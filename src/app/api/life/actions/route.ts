import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {serverSupabase} from '@/lib/supabase/server';
import {romeDay} from '@/lib/programs';
const schema=z.object({action_key:z.string().regex(/^(start-day|end-day|scenario-[0-9a-fA-F-]{36})$/),status:z.enum(['done','skipped']),note:z.string().trim().max(280).default('')});
export async function POST(req:NextRequest){
 const p=schema.safeParse(await req.json().catch(()=>null));if(!p.success)return NextResponse.json({error:'Attività non valida.'},{status:400});
 if((p.data.action_key==='start-day'||p.data.action_key==='end-day')&&p.data.status==='done'&&p.data.note.length<3)return NextResponse.json({error:'Scrivi una breve risposta per completare il passo.'},{status:400});
 const sb=await serverSupabase();const {data:{user}}=await sb.auth.getUser();if(!user)return NextResponse.json({error:'Accesso richiesto.'},{status:401});
 if(p.data.action_key.startsWith('scenario-')){
  const sid=p.data.action_key.slice(9);const {data:owned}=await sb.from('evolve_scenarios').select('id').eq('id',sid).eq('user_id',user.id).maybeSingle();
  if(!owned)return NextResponse.json({error:'Scenario non trovato.'},{status:404});
 }
 const {error}=await sb.from('evolve_daily_actions').upsert({...p.data,user_id:user.id,day:romeDay(),updated_at:new Date().toISOString()},{onConflict:'user_id,day,action_key'});
 return error?NextResponse.json({error:'Attività non salvata.'},{status:500}):NextResponse.json({ok:true});
}
