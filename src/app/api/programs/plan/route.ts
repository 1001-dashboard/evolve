import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {serverSupabase} from '@/lib/supabase/server';
import {choicesFor, type Focus} from '@/lib/personal-plan';
import {romeDay, type Category} from '@/lib/programs';

const profileSchema=z.object({
  programId:z.string().uuid(),
  focus:z.enum(['ibiza','spagnolo','inglese','stazione','trasferimento','movimento','abitudini','osservazione_alcol']),
  baseline:z.string().trim().min(5).max(320),
  obstacle:z.string().trim().max(320).default(''),
  successSign:z.string().trim().min(5).max(320),
  minutes:z.union([z.literal(5),z.literal(10),z.literal(15),z.literal(20),z.literal(30)]),
  daysPerWeek:z.number().int().min(2).max(7),
  confidence:z.number().int().min(1).max(5),
  preferredTime:z.enum(['mattina','pranzo','sera','flessibile']),
});

export async function POST(req:NextRequest){
  const parsed=profileSchema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success) return NextResponse.json({error:'Controlla i campi del piano.'},{status:400});
  const sb=await serverSupabase();
  const {data:{user}}=await sb.auth.getUser();
  if(!user) return NextResponse.json({error:'Effettua l’accesso.'},{status:401});
  const p=parsed.data;
  const {data:program}=await sb.from('evolve_programs').select('id,category').eq('id',p.programId).eq('user_id',user.id).single();
  if(!program) return NextResponse.json({error:'Percorso non trovato.'},{status:404});
  if(!choicesFor(program.category as Category).includes(p.focus as Focus))
    return NextResponse.json({error:'La priorità scelta non è compatibile con questo percorso.'},{status:400});
  const {data:existing,error:readError}=await sb.from('evolve_plan_profiles').select('starts_on').eq('program_id',p.programId).eq('user_id',user.id).maybeSingle();
  if(readError) return NextResponse.json({error:'Non riesco a leggere il piano: esegui la migrazione 202610190002_personal_plans.sql.'},{status:500});
  const {error}=await sb.from('evolve_plan_profiles').upsert({
    program_id:p.programId,user_id:user.id,focus:p.focus,baseline:p.baseline,obstacle:p.obstacle,
    success_sign:p.successSign,minutes:p.minutes,days_per_week:p.daysPerWeek,confidence:p.confidence,
    preferred_time:p.preferredTime,starts_on:existing?.starts_on??romeDay(),updated_at:new Date().toISOString(),
  },{onConflict:'program_id'});
  if(error) return NextResponse.json({error:'Impossibile salvare il piano. Verifica la migrazione Supabase.'},{status:500});
  return NextResponse.json({ok:true});
}
