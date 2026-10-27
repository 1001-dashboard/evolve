import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {serverSupabase} from '@/lib/supabase/server';
import {romeDay} from '@/lib/programs';

export const dynamic='force-dynamic';
const id=z.string().uuid();
const meal=z.object({
 eaten_at:z.string().datetime({offset:true}),
 meal_type:z.enum(['colazione','pranzo','cena','spuntino','altro']),
 description:z.string().trim().min(3).max(600),
 kcal:z.number().finite().min(0).max(4000).nullable(),
 kcal_low:z.number().finite().min(0).max(4000).nullable().default(null),
 kcal_high:z.number().finite().min(0).max(4000).nullable().default(null),
 calorie_source:z.enum(['etichetta','ai_stima','stima_personale','non_disponibile']),
 note:z.string().trim().max(600).default('')
}).superRefine((x,ctx)=>{
 if((x.kcal_low==null)!==(x.kcal_high==null)||
    (x.kcal_low!=null&&x.kcal_high!=null&&x.kcal_low>x.kcal_high))
  ctx.addIssue({code:'custom',path:['kcal_low'],message:'Intervallo kcal incoerente'});
 if((x.kcal==null)!==(x.calorie_source==='non_disponibile'))
  ctx.addIssue({code:'custom',path:['calorie_source'],message:'Indica se le calorie sono note o non disponibili.'});
});
const settings=z.object({daily_reference_kcal:z.number().int().min(800).max(6000).nullable(),
 avoided_foods:z.string().trim().max(500)});
const patch=z.object({id}).and(meal);
const remove=z.object({id});
async function session(){const sb=await serverSupabase();const {data:{user}}=await sb.auth.getUser();return {sb,user};}
const json=(data:object,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
function validTimestamp(s:string){const t=Date.parse(s);return Number.isFinite(t)&&t<=Date.now()+60000&&t>=Date.now()-366*86400000;}

export async function GET(){
 const {sb,user}=await session();if(!user)return json({error:'Effettua l’accesso.'},401);
 const cutoff=new Date(Date.now()-36*86400000).toISOString();
 const [entries,preferences]=await Promise.all([
  sb.from('evolve_food_entries').select('id,eaten_at,meal_type,description,kcal,kcal_low,kcal_high,calorie_source,note').eq('user_id',user.id).gte('eaten_at',cutoff).order('eaten_at',{ascending:false}).limit(300),
  sb.from('evolve_nutrition_settings').select('daily_reference_kcal,avoided_foods').eq('user_id',user.id).maybeSingle()
 ]);
 if(entries.error||preferences.error)return json({error:'Diario alimentare non disponibile. Esegui la migrazione 202610270001_nutrition_journal.sql in Supabase.'},503);
 return json({today:romeDay(),items:entries.data??[],settings:preferences.data??{daily_reference_kcal:null,avoided_foods:''}});
}
export async function POST(req:NextRequest){
 const parsed=meal.safeParse(await req.json().catch(()=>null));if(!parsed.success||!validTimestamp(parsed.success?parsed.data.eaten_at:''))return json({error:'Controlla data, pasto e calorie indicate.'},400);
 const {sb,user}=await session();if(!user)return json({error:'Accesso richiesto.'},401);
 const {data,error}=await sb.from('evolve_food_entries').insert({...parsed.data,user_id:user.id}).select('id').single();
 return error?json({error:'Non è stato possibile salvare il pasto.'},500):json({id:data.id},201);
}
export async function PATCH(req:NextRequest){
 const parsed=patch.safeParse(await req.json().catch(()=>null));if(!parsed.success||!validTimestamp(parsed.success?parsed.data.eaten_at:''))return json({error:'Dati di modifica non validi.'},400);
 const {sb,user}=await session();if(!user)return json({error:'Accesso richiesto.'},401);
 const {id:entryId,...values}=parsed.data;
 const {data,error}=await sb.from('evolve_food_entries').update({...values,updated_at:new Date().toISOString()}).eq('id',entryId).eq('user_id',user.id).select('id').maybeSingle();
 return error?json({error:'Modifica non riuscita.'},500):!data?json({error:'Pasto non trovato.'},404):json({ok:true});
}
export async function DELETE(req:NextRequest){
 const parsed=remove.safeParse(await req.json().catch(()=>null));if(!parsed.success)return json({error:'Identificativo non valido.'},400);
 const {sb,user}=await session();if(!user)return json({error:'Accesso richiesto.'},401);
 const {data,error}=await sb.from('evolve_food_entries').delete().eq('id',parsed.data.id).eq('user_id',user.id).select('id').maybeSingle();
 return error?json({error:'Eliminazione non riuscita.'},500):!data?json({error:'Pasto non trovato.'},404):json({ok:true});
}
export async function PUT(req:NextRequest){
 const parsed=settings.safeParse(await req.json().catch(()=>null));if(!parsed.success)return json({error:'Riferimento calorico o preferenze non validi.'},400);
 const {sb,user}=await session();if(!user)return json({error:'Accesso richiesto.'},401);
 const {error}=await sb.from('evolve_nutrition_settings').upsert({...parsed.data,user_id:user.id,updated_at:new Date().toISOString()},{onConflict:'user_id'});
 return error?json({error:'Preferenze non salvate.'},500):json({ok:true});
}
