import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { serverSupabase } from '@/lib/supabase/server';
import { exerciseFor, romeDay, type Program, type Checkin } from '@/lib/programs';
import {taskForDay,type PlanProfile} from '@/lib/personal-plan';

const schema = z.object({
  programId: z.string().uuid(),
  outcome: z.enum(['done','difficult','skipped']),
  note: z.string().trim().max(500).optional(),
});
function nextDay(day:string) {
  const d = new Date(day + 'T12:00:00.000Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0,10);
}

export async function POST(req: NextRequest) {
  const parsed=schema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success) return NextResponse.json({error:'Controlla la valutazione inviata.'},{status:400});
  const sb=await serverSupabase();
  const {data:{user}}=await sb.auth.getUser();
  if(!user) return NextResponse.json({error:'Effettua l’accesso.'},{status:401});
  const {data, error:loadError} = await sb.from('evolve_programs').select('*')
    .eq('id',parsed.data.programId).eq('user_id',user.id).single();
  if(loadError || !data || data.status!=='active') return NextResponse.json({error:'Percorso non disponibile.'},{status:404});
  const program=data as Program;
  const day=romeDay();
  const {data:existing}=await sb.from('evolve_checkins').select('id,exercise_key').eq('user_id',user.id)
    .eq('program_id',program.id).eq('day',day).maybeSingle();
  const {count}=await sb.from('evolve_checkins').select('id',{count:'exact',head:true})
    .eq('user_id',user.id).eq('program_id',program.id);
  const {data:profile,error:profileError}=await sb.from('evolve_plan_profiles').select('program_id,user_id,focus,baseline,obstacle,success_sign,minutes,days_per_week,confidence,preferred_time,starts_on,updated_at').eq('user_id',user.id).eq('program_id',program.id).maybeSingle();
  if(profileError) return NextResponse.json({error:'Il piano non è disponibile: verifica la migrazione Supabase v0.6.'},{status:500});
  const {data:recentForPlan}=profile?await sb.from('evolve_checkins').select('day,outcome').eq('user_id',user.id).eq('program_id',program.id).order('day',{ascending:false}).limit(30):{data:[]};
  const planned=profile?taskForDay(profile as PlanProfile,day,recentForPlan??[]):null;
  if(profile && !planned && !existing) return NextResponse.json({error:'Oggi il tuo piano prevede un giorno libero: l’allenamento riprende alla prossima data.'},{status:400});
  const exercise=exerciseFor(program, Math.max(0,(count??0)-(existing ? 1:0)));
  const {error:saveError}=await sb.from('evolve_checkins').upsert({
    user_id:user.id,program_id:program.id,day,exercise_key:existing?.exercise_key??planned?.key??exercise.key,
    outcome:parsed.data.outcome,note:parsed.data.note || null,
  },{onConflict:'program_id,day'});
  if(saveError) return NextResponse.json({error:'Impossibile salvare il risultato. Controlla la migrazione SQL.'},{status:500});

  // Adattamento solo dopo un NUOVO giorno registrato: evita multipli salti di livello.
  if (!existing) {
    const {data:recent} = await sb.from('evolve_checkins').select('id,program_id,day,outcome,exercise_key,note')
      .eq('user_id',user.id).eq('program_id',program.id)
      .gte('day',program.level_since).order('day',{ascending:false}).limit(3);
    const records=(recent ?? []) as Checkin[];
    let newLevel=program.level;
    if(records.length>=3 && records.every(x=>x.outcome==='done')) newLevel=Math.min(4,program.level+1);
    else if(records.length>=2 && records.slice(0,2).every(x=>x.outcome==='difficult')) newLevel=Math.max(1,program.level-1);
    if(newLevel!==program.level) {
      await sb.from('evolve_programs').update({level:newLevel,level_since:nextDay(day),updated_at:new Date().toISOString()})
        .eq('id',program.id).eq('user_id',user.id);
    }
  }
  return NextResponse.json({ok:true});
}
