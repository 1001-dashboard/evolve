import { serverSupabase } from '@/lib/supabase/server';
import { romeDay, type Program, type Checkin } from './programs';

export async function loadPrograms() {
  const sb=await serverSupabase();
  const {data:{user}}=await sb.auth.getUser();
  if (!user) return {programs:[] as Program[],checkins:[] as Checkin[],day:romeDay(),error:'Sessione non valida.'};
  const [{data:programs,error},{data:checkins,error:checkinError}]=await Promise.all([
    sb.from('evolve_programs').select('id,category,title,objective,level,level_since,status,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100),
    sb.from('evolve_checkins').select('id,program_id,day,outcome,exercise_key,note').eq('user_id',user.id).order('day',{ascending:false}).limit(500),
  ]);
  return {programs:(programs??[]) as Program[],checkins:(checkins??[]) as Checkin[],day:romeDay(),error:(error||checkinError)?'Non riesco a leggere i percorsi. Esegui il file SQL 202610190001_change_engine.sql in Supabase → SQL Editor.':null};
}
