import {serverSupabase} from '@/lib/supabase/server';
import {romeDay} from '@/lib/programs';
import {shiftDay,buildRollingPlan,type RollingInput} from '@/lib/evolution/rolling-plan';

export const dynamic='force-dynamic';
export async function GET(){
 const sb=await serverSupabase();const {data:{user},error:authError}=await sb.auth.getUser();
 if(authError||!user)return Response.json({error:'Accedi per consultare il tuo percorso.'},{status:401});
 const today=romeDay(),cutoff=shiftDay(today,-14)+'T00:00:00Z';
 const [profile,weights,training,food,checkins,preferences,reference]=await Promise.all([
  sb.from('evolve_life_profiles').select('birth_date,height_cm,weight_kg').eq('user_id',user.id).maybeSingle(),
  sb.from('evolve_weight_entries').select('day,weight_kg').eq('user_id',user.id).lte('day',today).order('day',{ascending:false}).limit(15),
  sb.from('evolve_workouts').select('id,occurred_at,activity,duration_minutes,effort').eq('user_id',user.id).gte('occurred_at',cutoff).order('occurred_at',{ascending:false}).limit(150),
  sb.from('evolve_food_entries').select('eaten_at,meal_type,kcal,entry_kind').eq('user_id',user.id).gte('eaten_at',cutoff).order('eaten_at',{ascending:false}).limit(200),
  sb.from('evolve_daily_states').select('day,energy,available_minutes,sleep_hours').eq('user_id',user.id).gte('day',shiftDay(today,-7)).lte('day',today).order('day',{ascending:false}).limit(9),
  sb.from('evolve_training_preferences').select('preferred_activity,target_sessions,preferred_minutes').eq('user_id',user.id).maybeSingle(),
  sb.from('evolve_nutrition_settings').select('daily_reference_kcal').eq('user_id',user.id).maybeSingle()
 ]);
 const input:RollingInput={today,
  profile:profile.error?null:profile.data as RollingInput['profile'],
  weights:weights.error?[]:(weights.data??[]) as RollingInput['weights'],
  training:training.error?[]:(training.data??[]) as RollingInput['training'],
  food:food.error?[]:(food.data??[]) as RollingInput['food'],
  checkins:checkins.error?[]:(checkins.data??[]) as RollingInput['checkins'],
  preferences:preferences.error?null:preferences.data as RollingInput['preferences'],
  dailyReference:reference.error?null:reference.data?.daily_reference_kcal??null,
  availability:{profile:!profile.error,weights:!weights.error,training:!training.error,
   food:!food.error,checkins:!checkins.error,preferences:!preferences.error,reference:!reference.error}
 };
 return Response.json({plan:buildRollingPlan(input)}, {headers:{'Cache-Control':'private, no-store'}});
}
