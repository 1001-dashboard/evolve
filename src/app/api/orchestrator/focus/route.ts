import {z} from 'zod';
import {serverSupabase} from '@/lib/supabase/server';
import {romeDay} from '@/lib/programs';
import {weekMonday} from '@/lib/orchestrator/core';

const approval=z.object({mode:z.literal('approve'),focus_id:z.enum(['organizzazione','recupero','movimento','pasti','continuita']),title:z.string().trim().min(3).max(100),action_text:z.string().trim().min(8).max(260),minutes:z.number().int().min(1).max(60),review_note:z.string().trim().max(600).default('')});
const marking=z.object({mode:z.literal('mark'),outcome:z.enum(['done','skipped']),note:z.string().trim().max(260).default('')});
export async function POST(req:Request){
 const body=await req.json().catch(()=>null);
 const a=approval.safeParse(body),m=marking.safeParse(body);
 if(!a.success&&!m.success)return Response.json({error:'Controlla il testo e i dati inseriti.'},{status:400});
 const sb=await serverSupabase();const {data:{user},error:authError}=await sb.auth.getUser();
 if(authError||!user)return Response.json({error:'Accedi prima di salvare.'},{status:401});
 const day=romeDay(),week=weekMonday(day);
 if(a.success){
  const p=a.data;
  const {data:prior,error:priorError}=await sb.from('evolve_weekly_focus').select('action_text,focus_id').eq('user_id',user.id).eq('week_start',week).maybeSingle();
  if(priorError)return Response.json({error:'Revisione non disponibile. Esegui la migrazione SQL 1.3.'},{status:500});
  const {error}=await sb.from('evolve_weekly_focus').upsert({user_id:user.id,week_start:week,focus_id:p.focus_id,title:p.title,action_text:p.action_text,minutes:p.minutes,review_note:p.review_note,approved_at:new Date().toISOString(),updated_at:new Date().toISOString()},{onConflict:'user_id,week_start'});
  if(error)return Response.json({error:'Non sono riuscito a salvare. Verifica le autorizzazioni Supabase.'},{status:500});
  // Changing the approved action invalidates the prior completion marks for this week.
  if(prior&&(prior.action_text!==p.action_text||prior.focus_id!==p.focus_id)){
   const {error:clearError}=await sb.from('evolve_weekly_focus_logs').delete().eq('user_id',user.id).eq('week_start',week);
   if(clearError)return Response.json({ok:true,warning:'Azione aggiornata, ma controlla i vecchi completamenti.'});
  }
  return Response.json({ok:true,week,approved:true});
 }
 if(!m.success)return Response.json({error:'Esito non valido.'},{status:400});
 if(m.data.outcome==='done'&&m.data.note.trim().length<3)return Response.json({error:'Descrivi brevemente cosa hai fatto.'},{status:400});
 // Only an already-approved action can be checked off; no empty checkmarks.
 const {data:focus,error:focusError}=await sb.from('evolve_weekly_focus').select('week_start').eq('user_id',user.id).eq('week_start',week).maybeSingle();
 if(focusError||!focus)return Response.json({error:'Approva prima un focus settimanale.'},{status:400});
 const {error}=await sb.from('evolve_weekly_focus_logs').upsert({user_id:user.id,week_start:week,day,outcome:m.data.outcome,note:m.data.note,updated_at:new Date().toISOString()},{onConflict:'user_id,week_start,day'});
 if(error)return Response.json({error:'Esito non salvato.'},{status:500});
 return Response.json({ok:true,week,day});
}
