/** Evolve 1.9 regression: deterministic training analysis, protected settings, integration. */
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
const ts=require('typescript');
let count=0;
const check=(truth,message)=>{assert.ok(truth,message);count++;};
const read=p=>readFileSync(p,'utf8');
const sources=[
 'src/lib/training-intelligence.ts','src/app/api/training/intelligence/route.ts',
 'src/components/training-intelligence-client.tsx','src/app/training-intelligence.css',
 'src/components/training-client.tsx','src/app/(app)/giornata/page.tsx',
 'src/app/(app)/visione/page.tsx','src/app/(app)/allenamento/page.tsx',
 'supabase/migrations/202610230001_training_intelligence.sql'
];
for(const path of sources){
 check(existsSync(path),`File mancante: ${path}`);
 if(!path.endsWith('.ts')&&!path.endsWith('.tsx'))continue;
 const tree=ts.createSourceFile(path,read(path),ts.ScriptTarget.Latest,true,path.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 check(tree.parseDiagnostics.length===0,`Errore sintassi: ${path}: ${tree.parseDiagnostics.map(x=>x.messageText).join(', ')}`);
}
const js=ts.transpileModule(read('src/lib/training-intelligence.ts'),{
 compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}
}).outputText;
const exports={};vm.runInNewContext(js,{exports,Date,Intl,Number,Set,Map,Math});
const {isoDay,dayShift,monday,romeDate,comparableTrend,trainingReview}=exports;
const eq=(actual,expected,message)=>check(actual===expected,`${message} got=${String(actual)} expected=${String(expected)}`);
eq(isoDay('2026-02-29'),false,'No leap day in 2026');
eq(isoDay('2024-02-29'),true,'Leap year accepted');
eq(dayShift('2026-03-01',-1),'2026-02-28','Month boundary');
eq(dayShift('2026-01-01',-1),'2025-12-31','Year boundary');
eq(monday('2026-10-23'),'2026-10-19','ISO week Friday');
eq(monday('2026-10-25'),'2026-10-19','ISO week Sunday');
eq(romeDate('2026-10-22T22:30:00Z'),'2026-10-23','Rome date +2');
eq(romeDate('2026-10-25T23:30:00Z'),'2026-10-26','Rome date winter +1');
eq(romeDate('invalid'),null,'Invalid timestamp');
const today='2026-10-23';
const workout=(id,date,extra={})=>({id,occurred_at:date,activity:'vogatore',duration_minutes:20,effort:5,distance_m:4000,...extra});
const items=[workout('a','2026-10-10T09:00:00Z'),workout('b','2026-10-15T09:00:00Z'),workout('c','2026-10-20T09:00:00Z'),workout('d','2026-10-21T09:00:00Z'),workout('e','2026-10-22T09:00:00Z')];
const profile={preferred_activity:'vogatore',focus:'continuita',target_sessions:4,preferred_minutes:20,goal_id:null};
const base={today,workouts:items,profile:null,checkin:null,support_level:'guidato',training_priority:true};
const out=trainingReview(base);
eq(out.period28.sessions,5,'Five existing sessions available');
eq(out.period28.minutes,100,'Total logged minutes');
eq(out.period7.sessions,3,'7-day count');
eq(out.previous7.sessions,2,'Previous window count');
eq(out.thisWeek.sessions,3,'Current ISO week');
eq(out.period28.days,5,'Distinct training days');
eq(out.next.kind,'setup','No guessed training plan without consent');
eq(out.confidence,'developing','Initial sample not authoritative performance claim');
check(out.review.includes('Ultimi sette giorni')&&out.review.includes('sette giorni precedenti'),'Explicit comparison windows');
check(out.next.reason.includes('5 sessioni'),'Onboarding explains existing data');
const enrolled=trainingReview({...base,profile});
eq(enrolled.next.kind,'rest','Yesterday workout prompts recovery choice');
const threeAgo=[workout('b','2026-10-19T09:00:00Z')];
const n=trainingReview({...base,profile,workouts:threeAgo});
eq(n.next.kind,'repeat','Familiar activity suggestion after gap');
eq(n.next.minutes,20,'Respects preferred minutes');
const short=trainingReview({...base,profile,workouts:threeAgo,
 checkin:{day:today,energy:4,available_minutes:10}});
eq(short.next.minutes,10,'Time-limited option never adds extra burden');
check(short.next.action.includes('10 minuti'),'Explains duration');
const low=trainingReview({...base,profile,workouts:threeAgo,
 checkin:{day:today,energy:1,available_minutes:30}});
eq(low.next.kind,'rest','Low energy supports recovery');
const staleEnergy=trainingReview({...base,profile,workouts:threeAgo,
 checkin:{day:'2026-10-20',energy:1,available_minutes:5}});
eq(staleEnergy.next.kind,'repeat','Stale check-in not applied today');
const recentIntense=trainingReview({...base,profile,workouts:[workout('x','2026-10-22T09:00:00Z',{effort:9})]});
eq(recentIntense.next.kind,'rest','Yesterday intense workout prompts recovery');
const todayLog=trainingReview({...base,profile,workouts:[workout('x','2026-10-23T09:00:00Z')]});
eq(todayLog.next.kind,'review','No second workout advised today');
const goalDone=trainingReview({...base,profile:{...profile,target_sessions:1},workouts:threeAgo});
eq(goalDone.next.kind,'review','Weekly target met no extra suggestion');
const unknown=trainingReview({...base,profile,workouts:[]});
eq(unknown.next.kind,'start','No workout entries is not failure');
check(unknown.review.includes('Potresti aver svolto'),'Missing entries not inactivity');
check(trainingReview({...base,workouts:[workout('f','2026-11-01T10:00:00Z')]}).period28.sessions===0,'Future records excluded');
check(trainingReview({...base,workouts:[workout('g','2026-03-01T09:00:00Z')]}).period28.sessions===0,'Old records excluded');
const pace=[
 workout('a','2026-10-09T09:00:00Z',{distance_m:3900}),workout('b','2026-10-10T09:00:00Z',{distance_m:4000}),
 workout('c','2026-10-15T09:00:00Z',{distance_m:4100}),workout('d','2026-10-16T09:00:00Z',{distance_m:4200})
];
check(Boolean(comparableTrend(pace,'vogatore')),'Four comparable sessions allow cautious pace observation');
check(comparableTrend(pace,'vogatore').detail.includes('non prova'),'No causal claim of fitness improvement');
check(!comparableTrend(pace.slice(0,3),'vogatore'),'Three sessions insufficient to compare');
check(!comparableTrend([...pace.slice(0,3),{...pace[3],activity:'corsa'}],'vogatore'),'Do not compare different activities');
check(!comparableTrend([...pace.slice(0,3),{...pace[3],effort:9}],'vogatore'),'Do not compare different effort classes');
check(!comparableTrend([...pace.slice(0,3),{...pace[3],duration_minutes:60}],'vogatore'),'Do not compare distant durations');
check(!comparableTrend([...pace.slice(0,3),{...pace[3],distance_m:null}],'vogatore'),'Do not invent missing distances');
check(!comparableTrend([workout('x','2026-10-01T09:00:00Z'),...pace,{...pace[3],id:'newest',occurred_at:'2026-10-19T09:00:00Z',distance_m:null}],'vogatore'),'Recent incomplete records block cherry-picked pace trend');
check(trainingReview({...base,profile,workouts:threeAgo}).next.action.includes('routine ripetibile'),'User-selected focus informs the next step');
check(trainingReview({...base,workouts:pace}).comparable?.certainty==='limited','Uncertain evidence labelled clearly');
const api=read('src/app/api/training/intelligence/route.ts');
check(api.includes('sb.auth.getUser()'),'Authentication on endpoint');
check((api.match(/\.eq\('user_id',user\.id\)/g)||[]).length>=5,'Every DB query scoped to owner');
check(api.includes(".eq('area','allenamento')")&&api.includes(".eq('status','active')"),'Only active training goals selectable');
check(api.includes('profileSchema.safeParse'),'User input schema validation');
check(api.includes(".upsert({")&&api.includes('user_id:user.id'),'Profile saved per user');
check(!api.includes('service_role'),'No service role escalation');
check(api.includes("'Cache-Control':'private, no-store'"),'No private data caching');
const sql=read('supabase/migrations/202610230001_training_intelligence.sql');
check(sql.includes('enable row level security'),'New table enables RLS');
check(sql.includes('user_id=auth.uid()'),'RLS scoped to owner');
check(sql.includes("g.area='allenamento'"),'Goal ownership and domain checked');
check(!/delete\s+from\s+public\.evolve_workouts/i.test(sql),'Migration preserves workout history');
const ui=read('src/components/training-intelligence-client.tsx');
check(ui.includes('TrainingIntelligenceClient'),'Reusable UI exists');
check(ui.includes("mode==='today'"),'Uses mode on daily screen');
check(ui.includes("i.support_level==='autonomo'"),'Daily view respects autonomy');
check(ui.includes('evolve:workout-changed'),'Refresh on edit/delete');
check(ui.includes('value={form.goal_id??'), 'Optional linked goal');
check(ui.includes('PUT'),'Writes only on consent');
check(ui.includes('Gli allenamenti storici')||ui.includes('allenamenti storici'),'No auto attribution to goal');
const train=read('src/components/training-client.tsx');
check(train.includes('<TrainingIntelligenceClient mode="training"/>'),'Diary integration');
check(train.includes('useRef<HTMLElement|null>'),'Prior 1.8.2 typecheck hotfix retained');
check(train.includes('evolve:workout-changed'),'Workout changes notify engine');
const day=read('src/app/(app)/giornata/page.tsx');
check(day.includes('<TrainingIntelligenceClient mode="today"/>'),'Daily integration');
check(read('src/app/(app)/visione/page.tsx').includes('<TrainingIntelligenceClient mode="vision"/>'),'360 integration');
check(read('next.config.ts').includes("basePath: '/evolve'"),'Base path retained');
console.log(`EVOLVE 1.9: ${count} TRAINING INTELLIGENCE CHECKS PASSED`);
