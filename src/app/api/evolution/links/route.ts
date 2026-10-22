import {NextRequest} from 'next/server';
import {z} from 'zod';
import {serverSupabase} from '@/lib/supabase/server';
import {romeDay} from '@/lib/programs';
import {dateInRome,isoDay,shifted} from '@/lib/evolution/core';
export const dynamic='force-dynamic';
const uuid=z.string().uuid();
const add=z.object({commitment_id:uuid,source_kind:z.enum(['workout','meal_plan']),source_key:z.string().min(10).max(40),confirmed:z.literal(true)});
const remove=z.object({id:uuid});
async function auth(){const sb=await serverSupabase();const {data:{user}}=await sb.auth.getUser();return {sb,user};}
export async function POST(req:NextRequest){
 const data=add.safeParse(await req.json().catch(()=>null));
 if(!data.success)return Response.json({error:'Verifica il collegamento e conferma la scelta.'},{status:400});
 const {sb,user}=await auth();if(!user)return Response.json({error:'Accesso richiesto.'},{status:401});
 const {commitment_id,source_kind,source_key}=data.data;
 const {data:commitment,error:commitErr}=await sb.from('evolve_coach_commitments')
  .select('id,kind,status').eq('user_id',user.id).eq('id',commitment_id).maybeSingle();
 if(commitErr||!commitment||commitment.status!=='active')return Response.json({error:'Impegno non disponibile nel tuo Piano attivo.'},{status:404});
 if(commitment.kind!==(source_kind==='workout'?'allenamento':'alimentazione'))
  return Response.json({error:'Puoi collegare solo registrazioni dello stesso tipo dell’impegno.'},{status:400});
 const today=romeDay();let evidenceDay:string|null=null;
 if(source_kind==='workout'){
  if(!uuid.safeParse(source_key).success)return Response.json({error:'Identificativo allenamento non valido.'},{status:400});
  const {data:workout,error}=await sb.from('evolve_workouts').select('occurred_at').eq('user_id',user.id).eq('id',source_key).maybeSingle();
  if(error||!workout)return Response.json({error:'Allenamento non trovato nel tuo diario.'},{status:404});
  evidenceDay=dateInRome(workout.occurred_at);
 }else{
  if(!isoDay(source_key))return Response.json({error:'Settimana non valida.'},{status:400});
  const {data:plan,error}=await sb.from('evolve_meal_plans').select('week_start,updated_at').eq('user_id',user.id).eq('week_start',source_key).maybeSingle();
  if(error||!plan)return Response.json({error:'Piano pasti non trovato nel tuo account.'},{status:404});
  evidenceDay=plan.updated_at?dateInRome(plan.updated_at):isoDay(plan.week_start);
 }
 if(!evidenceDay||evidenceDay<shifted(today,-29)||evidenceDay>today)
  return Response.json({error:'Puoi collegare solo registrazioni degli ultimi 30 giorni, non future.'},{status:400});
 const {data:linked,error}=await sb.from('evolve_evidence_links').insert({user_id:user.id,commitment_id,source_kind,source_key,evidence_day:evidenceDay})
  .select('id').single();
 if(error)return Response.json({error:error.code==='23505'?'Questa registrazione è già collegata a un impegno.':'Collegamento non salvato. Verifica la migrazione Evolution 1.8.'},{status:error.code==='23505'?409:503});
 return Response.json({ok:true,id:linked.id,message:'Collegamento salvato. L’impegno non è stato segnato automaticamente come completato.'},{status:201});
}
export async function DELETE(req:NextRequest){
 const data=remove.safeParse(await req.json().catch(()=>null));if(!data.success)return Response.json({error:'Collegamento non valido.'},{status:400});
 const {sb,user}=await auth();if(!user)return Response.json({error:'Accesso richiesto.'},{status:401});
 const {data:deleted,error}=await sb.from('evolve_evidence_links').delete().eq('user_id',user.id).eq('id',data.data.id).select('id').maybeSingle();
 if(error||!deleted)return Response.json({error:'Collegamento non trovato.'},{status:404});
 return Response.json({ok:true});
}
