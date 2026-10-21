import {serverSupabase} from '@/lib/supabase/server';
import {romeDay} from '@/lib/programs';
import {monday,minusDays} from '@/lib/adaptive-engine';
import type {CompanionInput,CompanionCommitment,CompanionLog,CompanionFocus,CompanionLevel} from '@/lib/daily-companion';

export const dynamic='force-dynamic';
export async function GET(){
 const sb=await serverSupabase();const {data:{user},error:authError}=await sb.auth.getUser();
 if(authError||!user)return Response.json({error:'Accedi per vedere il tuo programma.'},{status:401});
 const day=romeDay(),week=monday(day);
 const [commitments,logs,checkin,onboarding,workout,meal,focus,focusLog]=await Promise.all([
  sb.from('evolve_coach_commitments').select('id,kind,title,description,minutes,cadence,days,status,created_at').eq('user_id',user.id).eq('status','active').order('created_at',{ascending:false}).limit(100),
  sb.from('evolve_coach_logs').select('commitment_id,day,outcome').eq('user_id',user.id).eq('day',day).limit(120),
  sb.from('evolve_daily_states').select('energy,available_minutes').eq('user_id',user.id).eq('day',day).maybeSingle(),
  sb.from('evolve_guided_onboarding').select('priority_areas,support_level,minutes,goal').eq('user_id',user.id).maybeSingle(),
  sb.from('evolve_workouts').select('occurred_at').eq('user_id',user.id).gte('occurred_at',`${minusDays(day,1)}T00:00:00Z`).order('occurred_at',{ascending:false}).limit(30),
  sb.from('evolve_meal_plans').select('week_start').eq('user_id',user.id).eq('week_start',week).maybeSingle(),
  sb.from('evolve_weekly_focus').select('title,action_text,minutes').eq('user_id',user.id).eq('week_start',week).maybeSingle(),
  sb.from('evolve_weekly_focus_logs').select('outcome').eq('user_id',user.id).eq('week_start',week).eq('day',day).maybeSingle()
 ]);
 if(commitments.error||logs.error){return Response.json({error:'Impegni del Coach non disponibili. Controlla le migrazioni Supabase del Piano.'},{status:503,headers:{'Cache-Control':'private, no-store'}});}
 const notices:string[]=[];
 if(checkin.error)notices.push('Check-in non disponibile: il tempo iniziale è solo indicativo.');
 if(onboarding.error)notices.push('Personalizzazione non disponibile: puoi comunque consultare gli impegni.');
 if(workout.error)notices.push('Diario allenamenti non disponibile: nessuna deduzione sul movimento.');
 if(meal.error)notices.push('Meal prep non disponibile: nessuna deduzione sui pasti.');
 if(focus.error||focusLog.error)notices.push('Priorità settimanale non disponibile: non viene inclusa.');
 const items=(commitments.data??[]) as CompanionCommitment[];
 const onceIds=items.filter(x=>x.cadence==='once').map(x=>x.id);
 let onceDoneIds:string[]=[];
 if(onceIds.length){
  const older=await sb.from('evolve_coach_logs').select('commitment_id').eq('user_id',user.id).in('commitment_id',onceIds).eq('outcome','done').limit(100);
  if(older.error)notices.push('Storico delle attività singole non disponibile: consulta il Piano per verificarle.');
  else onceDoneIds=(older.data??[]).map(x=>x.commitment_id as string);
 }
 const input:CompanionInput={
  day,commitments:items,logs:(logs.data??[]) as CompanionLog[],onceDoneIds,
  focus:focus.error?null:(focus.data??null) as CompanionFocus,
  focusLogged:focusLog.error?true:Boolean(focusLog.data),
  checkin:checkin.error?null:(checkin.data??null) as CompanionInput['checkin'],
  onboarded:!onboarding.error&&Boolean(onboarding.data),
  areas:onboarding.error?[]:(Array.isArray(onboarding.data?.priority_areas)?onboarding.data.priority_areas:[]),
  support:!onboarding.error&&['guidato','essenziale','autonomo'].includes(onboarding.data?.support_level??'')?onboarding.data!.support_level as CompanionLevel:'autonomo',
  goal:onboarding.error?'':onboarding.data?.goal??'',defaultMinutes:onboarding.error?15:onboarding.data?.minutes??15,
  workoutToday:workout.error?null:(workout.data??[]).some(x=>typeof x.occurred_at==='string'&&romeDay(new Date(x.occurred_at))===day),
  mealSaved:meal.error?null:Boolean(meal.data)
 };
 return Response.json({input,notices},{headers:{'Cache-Control':'private, no-store'}});
}
