import {serverSupabase} from '@/lib/supabase/server';
import type {StoredOnboarding} from './onboarding';
/** An absent v1.5 migration never prevents access to an existing dashboard. */
export async function loadOnboarding(){
 const sb=await serverSupabase();const {data:{user}}=await sb.auth.getUser();if(!user)return null;
 const {data}=await sb.from('evolve_guided_onboarding').select('*').eq('user_id',user.id).maybeSingle();
 return (data??null) as StoredOnboarding|null;
}
