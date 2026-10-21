import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {serverSupabase} from '@/lib/supabase/server';
import {romeDay} from '@/lib/programs';
import {shiftIsoDay,validIsoDay,summarize,dailyMovement,factualInsights,type Observations} from '@/lib/outcomes/core';

const input=z.object({day:z.string().refine(validIsoDay,'Data non valida'),weight_kg:z.number().min(25).max(450),note:z.string().trim().max(160).default('')});
const remove=z.object({id:z.string().uuid()});
async function authenticated(){
 const sb=await serverSupabase();const {data:{user}}=await sb.auth.getUser();return {sb,user};
}
function romeDate(iso:string):string{
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Rome',day:'2-digit',month:'2-digit',year:'numeric'}).formatToParts(new Date(iso));
 const get=(type:string)=>parts.find(p=>p.type===type)?.value??'';
 return `${get('year')}-${get('month')}-${get('day')}`;
}
export async function GET(){
 const {sb,user}=await authenticated();if(!user)return NextResponse.json({error:'Accedi per vedere i tuoi dati.'},{status:401});
 const today=romeDay();const from=shiftIsoDay(today,-60);
 const [training,states,coach,meals,weights]=await Promise.all([
   sb.from('evolve_workouts').select('occurred_at,activity,duration_minutes').eq('user_id',user.id).gte('occurred_at',`${from}T00:00:00Z`).order('occurred_at',{ascending:false}).limit(500),
   sb.from('evolve_daily_states').select('day,energy,mood,sleep_hours').eq('user_id',user.id).gte('day',from).order('day',{ascending:false}).limit(65),
   sb.from('evolve_coach_logs').select('day,outcome').eq('user_id',user.id).gte('day',from).order('day',{ascending:false}).limit(500),
   sb.from('evolve_meal_plans').select('week_start').eq('user_id',user.id).gte('week_start',shiftIsoDay(from,-7)).order('week_start',{ascending:false}).limit(12),
   sb.from('evolve_weight_entries').select('id,day,weight_kg,note').eq('user_id',user.id).gte('day',shiftIsoDay(today,-90)).order('day',{ascending:true}).limit(120),
 ]);
 const issues=[training.error&&'Allenamento',states.error&&'Check-in',coach.error&&'Coach',meals.error&&'Meal prep',weights.error&&'Peso'].filter(Boolean);
 const observations:Observations={
  workouts:(training.data??[]).map(x=>({day:romeDate(x.occurred_at),activity:String(x.activity),duration_minutes:Number(x.duration_minutes)})),
  states:(states.data??[]).map(x=>({day:String(x.day),energy:Number(x.energy),mood:Number(x.mood),sleep_hours:x.sleep_hours==null?null:Number(x.sleep_hours)})),
  coach:(coach.data??[]).map(x=>({day:String(x.day),outcome:String(x.outcome)})),
  meals:(meals.data??[]).map(x=>({week_start:String(x.week_start)})),
  weights:(weights.data??[]).map(x=>({id:String(x.id),day:String(x.day),weight_kg:Number(x.weight_kg),note:String(x.note??'')})),
 };
 const seven=summarize(observations,7,today);
 const thirty=summarize(observations,30,today);
 const prev7=summarize(observations,7,shiftIsoDay(seven.first,-1));
 const prev30=summarize(observations,30,shiftIsoDay(thirty.first,-1));
 return NextResponse.json({
  today,
  seven,thirty,
  observations:{weights:observations.weights,workouts:dailyMovement(observations,30,today)},
  insights7:factualInsights(seven,prev7),insights30:factualInsights(thirty,prev30),
  warning:issues.length?`Dati non disponibili per: ${issues.join(', ')}. Verifica le migrazioni SQL e la connessione Supabase.`:null,
  weightWritable:!weights.error,
 },{headers:{'Cache-Control':'private, no-store'}});
}
export async function POST(req:NextRequest){
 const parsed=input.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'Inserisci un peso e una data validi.'},{status:400});
 const {sb,user}=await authenticated();if(!user)return NextResponse.json({error:'Accedi per registrare il peso.'},{status:401});
 const today=romeDay();const {day,weight_kg,note}=parsed.data;
 if(day>today || day<shiftIsoDay(today,-180))return NextResponse.json({error:'Puoi registrare una pesata di oggi o dei 180 giorni precedenti.'},{status:400});
 const {data,error}=await sb.from('evolve_weight_entries').upsert({user_id:user.id,day,weight_kg,note,updated_at:new Date().toISOString()},{onConflict:'user_id,day'}).select('id,day,weight_kg,note').single();
 if(error)return NextResponse.json({error:'Pesata non salvata. Controlla la migrazione Evolve 1.4.'},{status:500});
 return NextResponse.json({item:data},{status:201});
}
export async function DELETE(req:NextRequest){
 const parsed=remove.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'Registrazione non valida.'},{status:400});
 const {sb,user}=await authenticated();if(!user)return NextResponse.json({error:'Accedi.'},{status:401});
 const {data,error}=await sb.from('evolve_weight_entries').delete().eq('id',parsed.data.id).eq('user_id',user.id).select('id').maybeSingle();
 if(error||!data)return NextResponse.json({error:'Registrazione non trovata o impossibile da eliminare.'},{status:404});
 return NextResponse.json({ok:true});
}
