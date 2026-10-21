import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {serverSupabase} from '@/lib/supabase/server';
import {romeDay} from '@/lib/programs';
import {starterPlan,autonomyInsight,type Area,type StoredOnboarding} from '@/lib/onboarding';

const area=z.enum(['abitudini','benessere','allenamento','alimentazione','lavoro','apprendimento','relazioni','organizzazione']);
const minutes=z.union([z.literal(5),z.literal(10),z.literal(15),z.literal(20),z.literal(30),z.literal(45),z.literal(60)]);
const level=z.enum(['guidato','essenziale','autonomo']);
const confidence=z.number().int().min(1).max(5);
const setup=z.object({
 areas:z.array(area).min(1).max(3).refine(a=>new Set(a).size===a.length),
 goal:z.string().trim().min(5).max(320),obstacle:z.string().trim().max(350),
 minutes,anchor:z.string().trim().max(120),support_level:level,confidence,
 approval_token:z.string().uuid(),accepted_indices:z.array(z.number().int().min(0).max(2)).min(1).max(3).refine(a=>new Set(a).size===a.length)
});
const adjust=z.object({support_level:level,confidence});
const missing=(code?:string)=>code==='42P01'||code==='PGRST205'||code==='PGRST204';
const message=(code?:string)=>missing(code)?'Esegui prima la migrazione SQL 202610210003_smart_onboarding.sql in Supabase.':`Salvataggio non riuscito${code?` (codice ${code})`:''}.`;
async function authenticate(){const sb=await serverSupabase();const {data:{user}}=await sb.auth.getUser();return {sb,user};}
function daysBetween(a:string,b:string){const v=Date.parse(a+'T12:00:00Z'),w=Date.parse(b+'T12:00:00Z');return Number.isFinite(v)&&Number.isFinite(w)?Math.max(0,Math.floor((w-v)/86400000)):0;}
function subtractDays(ymd:string,n:number){const d=new Date(ymd+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-n);return d.toISOString().slice(0,10);}

export async function GET(){
 const {sb,user}=await authenticate();if(!user)return NextResponse.json({error:'Effettua l’accesso.'},{status:401});
 const {data:profile,error}=await sb.from('evolve_guided_onboarding').select('*').eq('user_id',user.id).maybeSingle();
 if(error)return NextResponse.json({error:message(error.code)},{status:503});
 if(!profile)return NextResponse.json({profile:null,progress:null});
 const row=profile as StoredOnboarding;const today=romeDay();
 const {data:commitments,error:comErr}=await sb.from('evolve_coach_commitments').select('id').eq('user_id',user.id).eq('approval_token',row.approval_token).limit(6);
 if(comErr)return NextResponse.json({profile:row,progress:null,warning:'Storico del piano non disponibile. Controlla la migrazione Coach.'});
 const ids=(commitments??[]).map(c=>c.id as string);
 let completed=0,skipped=0,activeDays=0;
 if(ids.length){
  const {data:logs,error:logErr}=await sb.from('evolve_coach_logs').select('day,outcome').eq('user_id',user.id).in('commitment_id',ids).gte('day',subtractDays(today,13)).lte('day',today).limit(150);
  if(logErr)return NextResponse.json({profile:row,progress:null,warning:'Registro degli impegni momentaneamente non disponibile.'});
  completed=(logs??[]).filter(l=>l.outcome==='done').length;
  skipped=(logs??[]).filter(l=>l.outcome==='skipped').length;
  activeDays=new Set((logs??[]).map(l=>l.day)).size;
 }
 return NextResponse.json({profile:row,progress:autonomyInsight(completed,skipped,row.confidence,daysBetween(row.started_on,today),activeDays),recorded:{completed,skipped},today});
}
export async function POST(req:NextRequest){
 const parsed=setup.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:'Verifica obiettivo, ambiti e attività scelte.'},{status:400});
 const {sb,user}=await authenticate();if(!user)return NextResponse.json({error:'Effettua l’accesso.'},{status:401});
 const input=parsed.data;const selected=starterPlan(input);
 if(input.accepted_indices.some(n=>n>=selected.length))return NextResponse.json({error:'Una delle attività non appartiene al tuo piano.'},{status:400});
 const {data:prior,error:priorErr}=await sb.from('evolve_guided_onboarding').select('started_on').eq('user_id',user.id).maybeSingle();
 if(priorErr)return NextResponse.json({error:message(priorErr.code)},{status:503});
 const stored={user_id:user.id,areas:input.areas,goal:input.goal,obstacle:input.obstacle,minutes:input.minutes,anchor:input.anchor,support_level:input.support_level,confidence:input.confidence,approval_token:input.approval_token,started_on:prior?.started_on??romeDay(),updated_at:new Date().toISOString()};
 const {error:saveErr}=await sb.from('evolve_guided_onboarding').upsert(stored,{onConflict:'user_id'});
 if(saveErr)return NextResponse.json({error:message(saveErr.code)},{status:500});
 // Updating only supplied columns preserves sensitive fields and explicit AI consent.
 const lifeAreas=Array.from(new Set(input.areas.map((a:Area)=>a==='lavoro'?'lavoro':a==='relazioni'?'relazioni':a==='apprendimento'||a==='organizzazione'?'crescita':'benessere')));
 const {error:lifeErr}=await sb.from('evolve_life_profiles').upsert({user_id:user.id,main_goal:input.goal,minutes_per_day:input.minutes,life_areas:lifeAreas,updated_at:new Date().toISOString()},{onConflict:'user_id'});
 if(lifeErr)return NextResponse.json({error:'Obiettivi salvati, ma sincronizzazione del Profilo incompleta. Controlla la migrazione Life Coaching prima di riprovare.',partial:true},{status:500});
 const accepted=input.accepted_indices.map(i=>({item:selected[i],index:i}));
 const rows=accepted.map(({item,index})=>({user_id:user.id,approval_token:input.approval_token,approval_index:index,source_session_id:null,...item,status:'active'}));
 const {error:planErr}=await sb.from('evolve_coach_commitments').upsert(rows,{onConflict:'user_id,approval_token,approval_index',ignoreDuplicates:true});
 if(planErr)return NextResponse.json({error:'Profilo salvato, ma il Piano non è stato attivato. Verifica le migrazioni del Coach e premi nuovamente Conferma.',partial:true},{status:500});
 return NextResponse.json({ok:true,created:rows.length});
}
export async function PATCH(req:NextRequest){
 const parsed=adjust.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'Livello di supporto non valido.'},{status:400});
 const {sb,user}=await authenticate();if(!user)return NextResponse.json({error:'Effettua l’accesso.'},{status:401});
 const {data,error}=await sb.from('evolve_guided_onboarding').update({...parsed.data,updated_at:new Date().toISOString()}).eq('user_id',user.id).select('support_level,confidence').maybeSingle();
 if(error||!data)return NextResponse.json({error:message(error?.code)},{status:400});
 return NextResponse.json({ok:true,profile:data});
}
