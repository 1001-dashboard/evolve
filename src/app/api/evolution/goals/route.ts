import {NextRequest} from 'next/server';
import {z} from 'zod';
import {serverSupabase} from '@/lib/supabase/server';
import {romeDay} from '@/lib/programs';
import {dateInRome} from '@/lib/evolution/core';
import {GOAL_AREAS,dateShift,type GoalEvidence,type EvolutionGoal,type GoalLink} from '@/lib/evolution/goals';
export const dynamic='force-dynamic';
const uuid=z.string().uuid();
const creation=z.object({area:z.enum(GOAL_AREAS),title:z.string().trim().min(4).max(120),description:z.string().trim().max(350).default('')});
const update=z.object({id:uuid,status:z.enum(['active','paused','completed'])});
async function auth(){const sb=await serverSupabase();const {data:{user}}=await sb.auth.getUser();return {sb,user};}
const headers={'Cache-Control':'private, no-store'};
export async function GET(){
 const {sb,user}=await auth();if(!user)return Response.json({error:'Accesso richiesto.'},{status:401,headers});
 const today=romeDay(),since=dateShift(today,-90);
 const [goals,links,workouts,meals,logs,commitments,profile]=await Promise.all([
  sb.from('evolve_goals').select('id,area,title,description,status,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(60),
  sb.from('evolve_goal_links').select('id,goal_id,source_kind,source_key,evidence_day').eq('user_id',user.id).limit(600),
  sb.from('evolve_workouts').select('id,occurred_at,activity,duration_minutes').eq('user_id',user.id).order('occurred_at',{ascending:false}).limit(200),
  sb.from('evolve_meal_plans').select('week_start,updated_at').eq('user_id',user.id).gte('week_start',dateShift(today,-84)).order('week_start',{ascending:false}).limit(15),
  sb.from('evolve_coach_logs').select('commitment_id,day,outcome').eq('user_id',user.id).gte('day',since).lte('day',today).eq('outcome','done').order('day',{ascending:false}).limit(200),
  sb.from('evolve_coach_commitments').select('id,title').eq('user_id',user.id).limit(180),
  sb.from('evolve_guided_onboarding').select('areas,priority_areas,goal').eq('user_id',user.id).maybeSingle()
 ]);
 if(goals.error||links.error)return Response.json({error:'Obiettivi non disponibili: applica la migrazione 202610220002_goals_evidence.sql.'},{status:503,headers});
 const notices:string[]=[];
 for(const [name,response] of [['Allenamenti',workouts],['Piani pasti',meals],['Esiti Coach',logs],['Impegni Coach',commitments],['Profilo',profile]] as const)
  if(response.error)notices.push(`${name}: dati non disponibili, non vengono interpretati come attività mancanti.`);
 const known=new Map((commitments.data??[]).map(c=>[c.id,c.title]));
 const evidence:GoalEvidence[]=[];
 if(!workouts.error)for(const w of workouts.data??[]){
  const day=dateInRome(w.occurred_at);if(!day||day>today)continue;
  evidence.push({kind:'workout',key:w.id,day,label:`${w.activity} · ${Math.round(Number(w.duration_minutes)||0)} min`,detail:'Sessione del diario Allenamento',href:'/allenamento',minutes:Number(w.duration_minutes)||0});
 }
 if(!meals.error)for(const m of meals.data??[]){
  const day=m.updated_at?dateInRome(m.updated_at):m.week_start;if(!day||day>today)continue;
  evidence.push({kind:'meal_plan',key:m.week_start,day,label:`Piano pasti · settimana ${m.week_start}`,detail:'Piano salvato, non prova dei pasti consumati',href:'/mealprep'});
 }
 if(!logs.error&&!commitments.error)for(const l of logs.data??[]){
  if(!known.has(l.commitment_id))continue;
  evidence.push({kind:'coach',key:`${l.commitment_id}:${l.day}`,day:l.day,label:`Coach · ${known.get(l.commitment_id)}`,detail:'Completamento confermato nel Piano',href:'/piano'});
 }
 return Response.json({today,goals:(goals.data??[]) as EvolutionGoal[],links:(links.data??[]) as GoalLink[],
  evidence,profile:profile.error?null:profile.data,notices},{headers});
}
export async function POST(req:NextRequest){
 const parsed=creation.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return Response.json({error:'Controlla titolo, ambito e descrizione.'},{status:400});
 const {sb,user}=await auth();if(!user)return Response.json({error:'Accesso richiesto.'},{status:401});
 const {count,error:countErr}=await sb.from('evolve_goals').select('id',{count:'exact',head:true}).eq('user_id',user.id).eq('status','active');
 if(countErr)return Response.json({error:'Archivio obiettivi non disponibile. Controlla la migrazione.'},{status:503});
 if((count??0)>=12)return Response.json({error:'Hai già 12 obiettivi attivi. Completa o sospendi quelli non più attuali.'},{status:400});
 const {data,error}=await sb.from('evolve_goals').insert({user_id:user.id,...parsed.data,status:'active'}).select('id,area,title,description,status,created_at').single();
 if(error)return Response.json({error:'Non riesco a salvare questo obiettivo. Verifica la migrazione 1.8.1.'},{status:503});
 return Response.json({goal:data},{status:201,headers});
}
export async function PATCH(req:NextRequest){
 const parsed=update.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return Response.json({error:'Stato obiettivo non valido.'},{status:400});
 const {sb,user}=await auth();if(!user)return Response.json({error:'Accesso richiesto.'},{status:401});
 const {data,error}=await sb.from('evolve_goals').update({status:parsed.data.status,updated_at:new Date().toISOString()})
  .eq('user_id',user.id).eq('id',parsed.data.id).select('id,status').maybeSingle();
 if(error||!data)return Response.json({error:'Obiettivo non trovato o non aggiornabile.'},{status:404});
 return Response.json({ok:true,goal:data},{headers});
}
