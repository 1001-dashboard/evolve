import {serverSupabase} from '@/lib/supabase/server';
import {romeDay} from '@/lib/programs';
import type {LifeProfile,DailyState,LifeScenario,ScenarioFeedback,DailyAction} from './types';

/** Returns a non-breaking fallback if migration v0.7 has not been run. */
export async function loadLife(){
  const sb=await serverSupabase();
  const {data:{user}}=await sb.auth.getUser();
  const day=romeDay();
  if(!user) return {profile:null,checkin:null,scenarios:[] as LifeScenario[],feedback:[] as ScenarioFeedback[],actions:[] as DailyAction[],day,error:'Sessione non valida.'};
  const [pr,st,sc,fb,act]=await Promise.all([
    sb.from('evolve_life_profiles').select('*').eq('user_id',user.id).maybeSingle(),
    sb.from('evolve_daily_states').select('*').eq('user_id',user.id).eq('day',day).maybeSingle(),
    sb.from('evolve_scenarios').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(60),
    sb.from('evolve_scenario_feedback').select('id,scenario_id,day,outcome,note').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100),
    sb.from('evolve_daily_actions').select('day,action_key,status,note').eq('user_id',user.id).eq('day',day).limit(30),
  ]);
  const error=[pr.error,st.error,sc.error,fb.error,act.error].some(Boolean)
    ?'Le funzioni Life Coaching richiedono la migrazione SQL 202610190003_life_coaching.sql in Supabase.':null;
  return {profile:(pr.data??null) as LifeProfile|null,checkin:(st.data??null) as DailyState|null,
    scenarios:(sc.data??[]) as LifeScenario[],feedback:(fb.data??[]) as ScenarioFeedback[],
    actions:(act.data??[]) as DailyAction[],day,error};
}
