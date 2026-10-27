import {serverSupabase} from '@/lib/supabase/server';
import {romeDay} from '@/lib/programs';
import type {Baseline} from '@/lib/evolution/baseline';

export const dynamic='force-dynamic';
/** Reuse existing profile and weigh-ins, never create parallel medical/weight records. */
export async function GET(){
 const sb=await serverSupabase();const {data:{user},error:authError}=await sb.auth.getUser();
 if(authError||!user)return Response.json({error:'Effettua l’accesso.'},{status:401});
 const today=romeDay();const cutoff=new Date(today+'T12:00:00Z');cutoff.setUTCDate(cutoff.getUTCDate()-180);
 const [profile,weights]=await Promise.all([
  sb.from('evolve_life_profiles').select('birth_date,height_cm,weight_kg').eq('user_id',user.id).maybeSingle(),
  sb.from('evolve_weight_entries').select('day,weight_kg').eq('user_id',user.id).gte('day',cutoff.toISOString().slice(0,10)).lte('day',today).order('day',{ascending:true}).limit(181)
 ]);
 const notices:string[]=[];
 if(profile.error)notices.push('Profilo non disponibile: verifica la migrazione di Evolve Life.');
 if(weights.error)notices.push('Storico delle pesate non disponibile: verifica la migrazione Evolve 1.4.');
 const result:Baseline={today,birth_date:profile.error?null:profile.data?.birth_date??null,
  height_cm:profile.error?null:profile.data?.height_cm??null,
  profile_weight_kg:profile.error?null:profile.data?.weight_kg??null,
  entries:weights.error?[]:(weights.data??[]).map(x=>({day:String(x.day),weight_kg:Number(x.weight_kg)})),notices};
 return Response.json(result,{headers:{'Cache-Control':'private, no-store'}});
}
