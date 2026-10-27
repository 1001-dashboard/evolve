import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {serverSupabase} from '@/lib/supabase/server';
import {beerKcal,REGULAR_BEER_KCAL_PER_100ML} from '@/lib/nutrition-journal';

export const dynamic='force-dynamic';
const schema=z.object({volume_ml:z.union([z.literal(500),z.literal(660)]),
 kcal_per_100ml:z.number().min(15).max(120).default(REGULAR_BEER_KCAL_PER_100ML),
 label_verified:z.boolean().default(false)}).strict();
const respond=(body:object,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
/** Each confirmed click inserts exactly ONE beer in the same nutrition journal used by Today and Vision 360. */
export async function POST(req:NextRequest){
 const parsed=schema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return respond({error:'Indica 50 o 66 cl e le kcal per 100 ml riportate in etichetta o stimate.'},400);
 const sb=await serverSupabase();const {data:{user},error:authError}=await sb.auth.getUser();
 if(authError||!user)return respond({error:'Accedi per registrare la bevanda.'},401);
 const {volume_ml,kcal_per_100ml,label_verified}=parsed.data;
 const kcal=beerKcal(volume_ml,kcal_per_100ml);
 if(kcal==null)return respond({error:'Valore calorico non valido.'},400);
 const {data,error}=await sb.from('evolve_food_entries').insert({
  user_id:user.id,eaten_at:new Date().toISOString(),meal_type:'altro',
  description:`Birra ${volume_ml/10} cl`,entry_kind:'beer',beer_ml:volume_ml,
  kcal,kcal_low:null,kcal_high:null,calorie_source:label_verified?'etichetta':'stima_personale',
  note:`${label_verified?'Valore dichiarato da etichetta':'Stima orientativa'}: ${kcal_per_100ml} kcal/100 ml. Il valore varia con gradazione e tipologia.`
 }).select('id').single();
 if(error)return respond({error:'Non è stato possibile registrare la birra. Esegui la migrazione 202610270002_nutrition_beer.sql.'},500);
 return respond({id:data.id,kcal,volume_ml},201);
}
