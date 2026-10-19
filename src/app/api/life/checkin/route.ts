import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {serverSupabase} from '@/lib/supabase/server';
import {romeDay} from '@/lib/programs';
const schema=z.object({energy:z.number().int().min(1).max(5),mood:z.number().int().min(1).max(5),
 sleep_hours:z.number().min(0).max(16).nullable(),
 available_minutes:z.union([z.literal(5),z.literal(10),z.literal(15),z.literal(20),z.literal(30),z.literal(45),z.literal(60)]),
 note:z.string().trim().max(350)});
export async function POST(req:NextRequest){
 const p=schema.safeParse(await req.json().catch(()=>null));
 if(!p.success) return NextResponse.json({error:'Controlla i dati del check-in.'},{status:400});
 const sb=await serverSupabase();const {data:{user}}=await sb.auth.getUser();
 if(!user) return NextResponse.json({error:'Effettua l’accesso.'},{status:401});
 const {error}=await sb.from('evolve_daily_states').upsert({user_id:user.id,day:romeDay(),...p.data,updated_at:new Date().toISOString()},{onConflict:'user_id,day'});
 if(error) return NextResponse.json({error:'Check-in non salvato. Verifica la migrazione SQL v0.7.'},{status:500});
 return NextResponse.json({ok:true});
}
