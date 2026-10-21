import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {serverSupabase} from '@/lib/supabase/server';
import {romeDay} from '@/lib/programs';
import {computeAdaptive,minusDays,monday,shorterDuration,
 type AdaptiveCheckin,type AdaptiveCommitment,type AdaptiveLog,
 type AdaptiveWorkout,type AdaptiveProfile} from '@/lib/adaptive-engine';

export const dynamic='force-dynamic';
const schema=z.object({action:z.literal('shorten'),commitment_id:z.string().uuid(),
 original_minutes:z.number().int().min(6).max(120),proposed_minutes:z.number().int().min(3).max(60),confirmed:z.literal(true)});
async function session(){const sb=await serverSupabase();const {data:{user}}=await sb.auth.getUser();return {sb,user};}

export async function GET(){
 const {sb,user}=await session();
 if(!user)return NextResponse.json({error:'Effettua l’accesso.'},{status:401});
 const today=romeDay(),start14=minusDays(today,13),start7=minusDays(today,6);
 const startStamp=minusDays(today,13)+'T00:00:00Z';
 const [items,logs,checkins,workouts,meal,profile]=await Promise.all([
  sb.from('evolve_coach_commitments').select('id,title,kind,minutes,cadence,status,updated_at').eq('user_id',user.id).eq('status','active').limit(100),
  sb.from('evolve_coach_logs').select('commitment_id,day,outcome').eq('user_id',user.id).gte('day',start14).lte('day',today).order('day',{ascending:false}).limit(350),
  sb.from('evolve_daily_states').select('day,energy').eq('user_id',user.id).gte('day',start7).lte('day',today).limit(20),
  sb.from('evolve_workouts').select('occurred_at,duration_minutes').eq('user_id',user.id).gte('occurred_at',startStamp).order('occurred_at',{ascending:false}).limit(100),
  sb.from('evolve_meal_plans').select('week_start').eq('user_id',user.id).eq('week_start',monday(today)).maybeSingle(),
  sb.from('evolve_guided_onboarding').select('priority_areas,support_level,confidence,started_on').eq('user_id',user.id).maybeSingle()
 ]);
 if(items.error||logs.error)return NextResponse.json({error:'Il registro del Coach non è disponibile. Verifica le migrazioni già previste per Evolve.'},{status:503});
 const notes:string[]=[];
 if(checkins.error)notes.push('I check-in non sono disponibili: i suggerimenti sull’energia sono disattivati.');
 if(workouts.error)notes.push('Il diario allenamenti non è disponibile: nessuna deduzione sul movimento.');
 if(meal.error)notes.push('Il piano pasti non è disponibile: nessuna deduzione sulla spesa.');
 if(profile.error)notes.push('Il profilo di personalizzazione non è disponibile.');
 const result=computeAdaptive({today,
  commitments:(items.data??[]) as AdaptiveCommitment[],
  logs:(logs.data??[]) as AdaptiveLog[],
  checkins:checkins.error?[]:(checkins.data??[]) as AdaptiveCheckin[],
  workouts:workouts.error?[]:(workouts.data??[]) as AdaptiveWorkout[],
  mealPlanSaved:meal.error?null:Boolean(meal.data),
  onboarding:profile.error||!profile.data?null:({areas:profile.data.priority_areas,
    support_level:profile.data.support_level,confidence:profile.data.confidence,started_on:profile.data.started_on} as AdaptiveProfile)
 });
 return NextResponse.json({...result,notes,today},{headers:{'Cache-Control':'private, no-store'}});
}

export async function POST(req:NextRequest){
 const input=schema.safeParse(await req.json().catch(()=>null));
 if(!input.success)return NextResponse.json({error:'Conferma la proposta e verifica i minuti.'},{status:400});
 const {sb,user}=await session();if(!user)return NextResponse.json({error:'Effettua l’accesso.'},{status:401});
 const {data:item,error:readErr}=await sb.from('evolve_coach_commitments')
  .select('id,title,minutes,status,updated_at').eq('user_id',user.id).eq('id',input.data.commitment_id).maybeSingle();
 if(readErr||!item)return NextResponse.json({error:'Attività non trovata nel tuo piano.'},{status:404});
 const today=romeDay();
 const {data:recent,error:logErr}=await sb.from('evolve_coach_logs').select('commitment_id,day,outcome')
  .eq('user_id',user.id).eq('commitment_id',item.id).gte('day',minusDays(today,13)).lte('day',today).limit(100);
 if(logErr)return NextResponse.json({error:'Impossibile verificare gli esiti registrati.'},{status:503});
 const duration=shorterDuration(item,(recent??[]) as AdaptiveLog[]);
 if(duration===null||duration!==input.data.proposed_minutes||item.minutes!==input.data.original_minutes)
  return NextResponse.json({error:'La proposta non è più attuale. Ricarica la pagina prima di confermare.'},{status:409});
 // Modify ONLY the allocated time, not the exercise, goals, cadence or plan description.
 const {data:updated,error}=await sb.from('evolve_coach_commitments')
  .update({minutes:duration,updated_at:new Date().toISOString()})
  .eq('user_id',user.id).eq('id',item.id).eq('status','active').eq('minutes',item.minutes).eq('updated_at',item.updated_at)
  .select('id,title,minutes').maybeSingle();
 if(error||!updated)return NextResponse.json({error:'La modifica non è stata applicata. Aggiorna e riprova.'},{status:409});
 return NextResponse.json({ok:true,item:updated,message:'Durata aggiornata dopo la tua conferma. Frequenza e contenuto invariati.'},{headers:{'Cache-Control':'private, no-store'}});
}
