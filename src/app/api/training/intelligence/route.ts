import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {serverSupabase} from '@/lib/supabase/server';
import {romeDay} from '@/lib/programs';
import {ACTIVITIES} from '@/lib/training';
import {dayShift,trainingReview,type TrainingInput,type TrainingProfile,type TrainingWorkout,type TrainingCheckin} from '@/lib/training-intelligence';

export const dynamic='force-dynamic';
const profileSchema=z.object({
 preferred_activity:z.enum(ACTIVITIES),
 focus:z.enum(['continuita','resistenza','tecnica','equilibrio']),
 target_sessions:z.number().int().min(1).max(7),
 preferred_minutes:z.union([z.literal(5),z.literal(10),z.literal(15),z.literal(20),z.literal(25),z.literal(30),z.literal(40),z.literal(45),z.literal(60),z.literal(75),z.literal(90)]),
 goal_id:z.string().uuid().nullable()
});
async function auth(){const sb=await serverSupabase();const {data:{user}}=await sb.auth.getUser();return {sb,user};}

export async function GET(){
 const {sb,user}=await auth();if(!user)return NextResponse.json({error:'Effettua l’accesso.'},{status:401});
 const today=romeDay(),from=dayShift(today,-90);
 const [workouts,settings,checkin,onboarding,goals]=await Promise.all([
  sb.from('evolve_workouts').select('id,occurred_at,activity,duration_minutes,effort,distance_m')
   .eq('user_id',user.id).gte('occurred_at',from+'T00:00:00Z')
   .order('occurred_at',{ascending:false}).limit(250),
  sb.from('evolve_training_preferences').select('preferred_activity,focus,target_sessions,preferred_minutes,goal_id')
   .eq('user_id',user.id).maybeSingle(),
  sb.from('evolve_daily_states').select('day,energy,available_minutes')
   .eq('user_id',user.id).eq('day',today).maybeSingle(),
  sb.from('evolve_guided_onboarding').select('support_level,priority_areas')
   .eq('user_id',user.id).maybeSingle(),
  sb.from('evolve_goals').select('id,title').eq('user_id',user.id)
   .eq('area','allenamento').eq('status','active').limit(30)
 ]);
 if(workouts.error)return NextResponse.json({error:'Diario allenamenti non disponibile. Controlla la connessione Supabase.'},{status:503});
 const notices:string[]=[];
 if(settings.error)notices.push('Preferenze di allenamento non disponibili: esegui la migrazione 202610230001_training_intelligence.sql.');
 if(checkin.error)notices.push('Check-in non disponibile: non posso usare l’energia o il tempo indicati oggi.');
 if(onboarding.error)notices.push('Livello di supporto non disponibile: mostro solo il riepilogo.');
 if(goals.error)notices.push('Obiettivi connessi non disponibili: puoi comunque consultare lo storico.');
 const support=onboarding.error?'autonomo':onboarding.data?.support_level;
 const support_level=support==='guidato'||support==='essenziale'||support==='autonomo'?support:'autonomo';
 const priorities=!onboarding.error&&Array.isArray(onboarding.data?.priority_areas)?onboarding.data.priority_areas:[];
 const input:TrainingInput={today,
  workouts:(workouts.data??[]).map(w=>({id:w.id,occurred_at:w.occurred_at,activity:w.activity,
   duration_minutes:Number(w.duration_minutes),effort:Number(w.effort),
   distance_m:w.distance_m==null?null:Number(w.distance_m)})) as TrainingWorkout[],
  profile:settings.error?null:(settings.data??null) as TrainingProfile|null,
  checkin:checkin.error?null:(checkin.data??null) as TrainingCheckin|null,
  training_priority:priorities.includes('allenamento'),support_level};
 const insight=trainingReview(input);
 return NextResponse.json({insight,goals:goals.error?[]:goals.data??[],
  trainingPriority:input.training_priority,settingsAvailable:!settings.error,notices},
  {headers:{'Cache-Control':'private, no-store'}});
}

export async function PUT(req:NextRequest){
 const parsed=profileSchema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:'Controlla attività, obiettivo e frequenza.'},{status:400});
 const {sb,user}=await auth();if(!user)return NextResponse.json({error:'Effettua l’accesso.'},{status:401});
 if(parsed.data.goal_id){
  const {data:goal,error}=await sb.from('evolve_goals').select('id').eq('user_id',user.id)
   .eq('id',parsed.data.goal_id).eq('area','allenamento').eq('status','active').maybeSingle();
  if(error||!goal)return NextResponse.json({error:'Obiettivo non disponibile o non appartenente al tuo profilo.'},{status:400});
 }
 const {data,error}=await sb.from('evolve_training_preferences').upsert({
  user_id:user.id,...parsed.data,updated_at:new Date().toISOString()
 },{onConflict:'user_id'}).select('preferred_activity,focus,target_sessions,preferred_minutes,goal_id').single();
 if(error)return NextResponse.json({error:'Non riesco a salvare le preferenze. Verifica la migrazione SQL 202610230001_training_intelligence.sql.'},{status:503});
 return NextResponse.json({ok:true,profile:data,message:'Preferenze aggiornate dopo la tua conferma. Gli allenamenti precedenti e il Piano Coach non sono stati modificati.'},
  {headers:{'Cache-Control':'private, no-store'}});
}
