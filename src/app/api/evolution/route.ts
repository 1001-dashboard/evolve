import {serverSupabase} from '@/lib/supabase/server';
import {romeDay} from '@/lib/programs';
import {shifted,makeEvolution,type EvolutionInput,type Link} from '@/lib/evolution/core';
export const dynamic='force-dynamic';
export async function GET(){
 const sb=await serverSupabase();
 const {data:{user},error:authError}=await sb.auth.getUser();
 if(authError||!user)return Response.json({error:'Accedi per vedere il tuo percorso.'},{status:401});
 const today=romeDay(),start=shifted(today,-29),startWeek=shifted(today,-44);
 const [profile,commitments,coach,workouts,meal,states,focus,paths,programs,scenarios,actions,legacyActions,diary,links]=await Promise.all([
  sb.from('evolve_guided_onboarding').select('areas,priority_areas,goal,support_level').eq('user_id',user.id).maybeSingle(),
  sb.from('evolve_coach_commitments').select('id,title,kind,status').eq('user_id',user.id).limit(150),
  sb.from('evolve_coach_logs').select('commitment_id,day,outcome').eq('user_id',user.id).gte('day',start).lte('day',today).order('day',{ascending:false}).limit(500),
  sb.from('evolve_workouts').select('id,occurred_at,activity,duration_minutes').eq('user_id',user.id).gte('occurred_at',shifted(start,-1)+'T00:00:00Z').order('occurred_at',{ascending:false}).limit(300),
  sb.from('evolve_meal_plans').select('week_start,updated_at,menu').eq('user_id',user.id).gte('week_start',startWeek).order('week_start',{ascending:false}).limit(12),
  sb.from('evolve_daily_states').select('day,energy').eq('user_id',user.id).gte('day',start).lte('day',today).order('day',{ascending:false}).limit(32),
  sb.from('evolve_weekly_focus_logs').select('day,outcome').eq('user_id',user.id).gte('day',start).lte('day',today).order('day',{ascending:false}).limit(35),
  sb.from('evolve_checkins').select('id,program_id,day,outcome').eq('user_id',user.id).gte('day',start).lte('day',today).order('day',{ascending:false}).limit(300),
  sb.from('evolve_programs').select('id,category').eq('user_id',user.id).limit(120),
  sb.from('evolve_scenario_feedback').select('id,day,outcome').eq('user_id',user.id).gte('day',start).lte('day',today).order('day',{ascending:false}).limit(150),
  sb.from('evolve_daily_actions').select('day,action_key,status').eq('user_id',user.id).gte('day',start).lte('day',today).order('day',{ascending:false}).limit(150),
  sb.from('action_items').select('id,status,created_at,completed_at').eq('user_id',user.id).eq('status','completed').gte('completed_at',shifted(start,-1)+'T00:00:00Z').order('completed_at',{ascending:false}).limit(150),
  sb.from('diary_entries').select('id,created_at,kind').eq('user_id',user.id).gte('created_at',shifted(start,-1)+'T00:00:00Z').order('created_at',{ascending:false}).limit(150),
  sb.from('evolve_evidence_links').select('id,commitment_id,source_kind,source_key,evidence_day').eq('user_id',user.id).limit(400)
 ]);
 const notices:string[]=[];
 const optional=[['Profilo',profile],['Piano Coach',commitments],['Esiti Coach',coach],['Allenamento',workouts],['Meal prep',meal],['Check-in',states],['Focus',focus],['Percorsi',paths],['Programmi',programs],['Scenari',scenarios],['Azioni Life',actions],['Azioni storiche',legacyActions],['Diario',diary]] as const;
 for(const [name,response] of optional)if(response.error)notices.push(`${name}: dati non disponibili, nessuna deduzione da questo registro.`);
 if(links.error)notices.push('Collegamenti tra strumenti non disponibili: applica la migrazione 202610220001_evolution_links.sql in Supabase.');
 const input:EvolutionInput={
  today,
  profile:profile.error?null:profile.data as EvolutionInput['profile'],
  commitments:(commitments.data??[]) as EvolutionInput['commitments'],
  coachLogs:coach.error?[]:(coach.data??[]) as EvolutionInput['coachLogs'],
  workouts:workouts.error?[]:(workouts.data??[]) as EvolutionInput['workouts'],
  mealPlans:meal.error?[]:(meal.data??[]) as EvolutionInput['mealPlans'],
  states:states.error?[]:(states.data??[]) as EvolutionInput['states'],
  focusLogs:focus.error?[]:(focus.data??[]) as EvolutionInput['focusLogs'],
  paths:paths.error?[]:(paths.data??[]) as EvolutionInput['paths'],
  programs:programs.error?[]:(programs.data??[]) as EvolutionInput['programs'],
  scenarios:scenarios.error?[]:(scenarios.data??[]) as EvolutionInput['scenarios'],
  actions:actions.error?[]:(actions.data??[]) as EvolutionInput['actions'],
  legacyActions:legacyActions.error?[]:(legacyActions.data??[]) as EvolutionInput['legacyActions'],
  diary:diary.error?[]:(diary.data??[]) as EvolutionInput['diary'],
  links:links.error?[]:(links.data??[]) as Link[]
 };
 return Response.json({overview:makeEvolution(input),notices,linkingAvailable:!links.error},{headers:{'Cache-Control':'private, no-store'}});
}
