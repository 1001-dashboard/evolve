import {serverSupabase} from '@/lib/supabase/server';
import type {PlanProfile,PlanReview} from '@/lib/personal-plan';

export async function loadPersonalPlans(userId:string){
  const sb=await serverSupabase();
  const [{data:profiles,error},{data:reviews,error:reviewError}]=await Promise.all([
    sb.from('evolve_plan_profiles').select('program_id,user_id,focus,baseline,obstacle,success_sign,minutes,days_per_week,confidence,preferred_time,starts_on,updated_at').eq('user_id',userId).limit(100),
    sb.from('evolve_plan_reviews').select('id,program_id,period_start,confidence,win,obstacle,adjustment').eq('user_id',userId).order('period_start',{ascending:false}).limit(300),
  ]);
  return {profiles:(profiles??[]) as PlanProfile[],reviews:(reviews??[]) as PlanReview[],planError:(error||reviewError)?'I piani personalizzati non sono ancora disponibili. Esegui la migrazione SQL 202610190002_personal_plans.sql in Supabase.':null};
}
