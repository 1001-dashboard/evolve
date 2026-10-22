import {NextRequest} from 'next/server';
import {z} from 'zod';
import {serverSupabase} from '@/lib/supabase/server';
import {romeDay} from '@/lib/programs';
import {dateInRome,isoDay} from '@/lib/evolution/core';
import {dateShift} from '@/lib/evolution/goals';
export const dynamic='force-dynamic';
const uuid=z.string().uuid();
const link=z.object({goal_id:uuid,source_kind:z.enum(['workout','meal_plan','coach']),source_key:z.string().min(10).max(72),confirmed:z.literal(true)});
const unlink=z.object({id:uuid});
async function auth(){const sb=await serverSupabase();const {data:{user}}=await sb.auth.getUser();return {sb,user};}
export async function POST(req:NextRequest){
 const parsed=link.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return Response.json({error:'Conferma il collegamento e scegli una registrazione valida.'},{status:400});
 const {sb,user}=await auth();if(!user)return Response.json({error:'Accesso richiesto.'},{status:401});
 const {goal_id,source_kind,source_key}=parsed.data;
 const {data:goal,error:goalErr}=await sb.from('evolve_goals').select('id,status').eq('user_id',user.id).eq('id',goal_id).maybeSingle();
 if(goalErr||!goal||goal.status!=='active')return Response.json({error:'Scegli un tuo obiettivo attivo.'},{status:404});
 const today=romeDay();let day:string|null=null;
 if(source_kind==='workout'){
  if(!uuid.safeParse(source_key).success)return Response.json({error:'Identificativo allenamento non valido.'},{status:400});
  const {data:w,error}=await sb.from('evolve_workouts').select('occurred_at').eq('user_id',user.id).eq('id',source_key).maybeSingle();
  if(error||!w)return Response.json({error:'Sessione non trovata nel tuo diario.'},{status:404});
  day=dateInRome(w.occurred_at);
 }else if(source_kind==='meal_plan'){
  if(!isoDay(source_key))return Response.json({error:'Settimana del piano non valida.'},{status:400});
  const {data:m,error}=await sb.from('evolve_meal_plans').select('week_start,updated_at').eq('user_id',user.id).eq('week_start',source_key).maybeSingle();
  if(error||!m)return Response.json({error:'Piano pasti non trovato.'},{status:404});
  day=m.updated_at?dateInRome(m.updated_at):isoDay(m.week_start);
 }else{
  const match=/^([0-9a-f-]{36}):(\d{4}-\d{2}-\d{2})$/i.exec(source_key);
  if(!match||!uuid.safeParse(match[1]).success||!isoDay(match[2]))return Response.json({error:'Esito Coach non valido.'},{status:400});
  const {data:outcome,error}=await sb.from('evolve_coach_logs').select('day').eq('user_id',user.id)
   .eq('commitment_id',match[1]).eq('day',match[2]).eq('outcome','done').maybeSingle();
  if(error||!outcome)return Response.json({error:'Non risulta un completamento del Coach con questa data.'},{status:404});
  day=outcome.day;
 }
 if(!day||day>today||day<dateShift(today,-3650))return Response.json({error:'La data della registrazione non è valida.'},{status:400});
 const {data:stored,error}=await sb.from('evolve_goal_links')
  .insert({user_id:user.id,goal_id,source_kind,source_key,evidence_day:day}).select('id').single();
 if(error)return Response.json({error:error.code==='23505'?'Questa registrazione è già assegnata a un obiettivo. Scollegala prima di spostarla.':'Collegamento non salvato: verifica la migrazione 1.8.1.'},{status:error.code==='23505'?409:503});
 return Response.json({ok:true,id:stored.id,message:'Registrazione collegata. Nessun nuovo allenamento o completamento del Coach è stato creato.'},{status:201});
}
export async function DELETE(req:NextRequest){
 const parsed=unlink.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return Response.json({error:'Collegamento non valido.'},{status:400});
 const {sb,user}=await auth();if(!user)return Response.json({error:'Accesso richiesto.'},{status:401});
 const {data,error}=await sb.from('evolve_goal_links').delete().eq('user_id',user.id).eq('id',parsed.data.id).select('id').maybeSingle();
 if(error||!data)return Response.json({error:'Collegamento non trovato.'},{status:404});
 return Response.json({ok:true});
}
