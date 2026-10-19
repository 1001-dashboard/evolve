import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {serverSupabase} from '@/lib/supabase/server';
import {romeDay} from '@/lib/programs';
const schema=z.object({scenario_id:z.string().uuid(),outcome:z.enum(['helped','adjust','rehearsed']),note:z.string().trim().max(320)});
export async function POST(req:NextRequest){
 const p=schema.safeParse(await req.json().catch(()=>null));if(!p.success)return NextResponse.json({error:'Feedback non valido.'},{status:400});
 const sb=await serverSupabase();const {data:{user}}=await sb.auth.getUser();if(!user)return NextResponse.json({error:'Accesso richiesto.'},{status:401});
 const {data:owned}=await sb.from('evolve_scenarios').select('id').eq('id',p.data.scenario_id).eq('user_id',user.id).maybeSingle();
 if(!owned)return NextResponse.json({error:'Scenario non trovato.'},{status:404});
 const {error}=await sb.from('evolve_scenario_feedback').insert({...p.data,user_id:user.id,day:romeDay()});
 return error?NextResponse.json({error:'Feedback non salvato.'},{status:500}):NextResponse.json({ok:true});
}
