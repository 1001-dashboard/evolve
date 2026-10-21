import {serverSupabase} from '@/lib/supabase/server';
import {romeDay} from '@/lib/programs';
import {isScheduled} from '@/lib/coach/schedule';
import {dayGuidance,daysBefore,suggestions,totalWithMinutes,weekMonday,type ReviewFacts} from '@/lib/orchestrator/core';

export const dynamic='force-dynamic';
export async function GET(){
 const sb=await serverSupabase();
 const {data:{user},error:authError}=await sb.auth.getUser();
 if(authError||!user)return Response.json({error:'Accesso richiesto.'},{status:401});
 const day=romeDay(),start=daysBefore(day,6),week=weekMonday(day);
 const [states,workouts,meals,commitments,logs,focus,focusLog]=await Promise.all([
  sb.from('evolve_daily_states').select('day,energy,mood,sleep_hours,available_minutes').eq('user_id',user.id).gte('day',start).lte('day',day).order('day',{ascending:false}).limit(7),
  sb.from('evolve_workouts').select('occurred_at,activity,duration_minutes,effort').eq('user_id',user.id).gte('occurred_at',`${daysBefore(start,1)}T00:00:00Z`).order('occurred_at',{ascending:false}).limit(150),
  sb.from('evolve_meal_plans').select('week_start,menu,configuration').eq('user_id',user.id).eq('week_start',week).maybeSingle(),
  sb.from('evolve_coach_commitments').select('id,title,kind,minutes,cadence,days,status').eq('user_id',user.id).eq('status','active').limit(100),
  sb.from('evolve_coach_logs').select('commitment_id,day,outcome').eq('user_id',user.id).gte('day',start).lte('day',day).limit(400),
  sb.from('evolve_weekly_focus').select('week_start,focus_id,title,action_text,minutes,review_note').eq('user_id',user.id).eq('week_start',week).maybeSingle(),
  sb.from('evolve_weekly_focus_logs').select('day,outcome,note').eq('user_id',user.id).eq('week_start',week).order('day',{ascending:false}).limit(7)
 ]);
 // A missing migration is shown clearly, not interpreted as zero progress.
 const notices:string[]=[];
 if(states.error)notices.push('Check-in non disponibile: controlla le migrazioni precedenti.');
 if(workouts.error)notices.push('Diario allenamenti non disponibile.');
 if(meals.error)notices.push('Piano pasti non disponibile.');
 if(commitments.error||logs.error)notices.push('Piano Coach non disponibile.');
 if(focus.error||focusLog.error)notices.push('Revisione 1.3 non disponibile: esegui la migrazione SQL 202610210001_orchestrator.sql.');
 const checkins=states.error?[]:(states.data??[]);
 const sessions=workouts.error?[]:(workouts.data??[]).filter(s=>typeof s.occurred_at==='string'&&romeDay(new Date(s.occurred_at))>=start&&romeDay(new Date(s.occurred_at))<=day);
 const commit=commitments.error?[]:(commitments.data??[]);
 const histories=logs.error?[]:(logs.data??[]);
 const due=commit.filter(c=>isScheduled({cadence:c.cadence as 'once'|'daily'|'weekly',days:Array.isArray(c.days)?c.days:[]},day));
 const todayLog=histories.filter(l=>l.day===day);
 const doneCount=todayLog.filter(l=>l.outcome==='done'&&due.some(c=>c.id===l.commitment_id)).length;
 const f:ReviewFacts={
  checkinDays:checkins.length,
  lowEnergyDays:checkins.filter(x=>Number(x.energy)<=2).length,
  workoutCount:sessions.length,
  workoutMinutes:totalWithMinutes(sessions),
  plannedMeals:meals.error?null:(meals.data?Array.isArray(meals.data.menu)?meals.data.menu.length:0:null),
  coachDone:histories.filter(l=>l.outcome==='done').length,
  coachSkipped:histories.filter(l=>l.outcome==='skipped').length,
  coachScheduled:due.length
 };
 const today={energy:checkins.find(c=>c.day===day)?.energy??null,coachDue:due.length,coachDone:doneCount,workoutToday:sessions.some(s=>romeDay(new Date(s.occurred_at))===day),mealSaved:!!meals.data};
 return Response.json({day,week,start,facts:f,suggestions:suggestions(f),
  today,guidance:dayGuidance(today),
  focus:focus.error?null:focus.data,focusLogs:focusLog.error?[]:focusLog.data??[],notices},
  {headers:{'Cache-Control':'private, no-store'}});
}
