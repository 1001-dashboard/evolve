/** Evolve 1.8 — deterministic projection, boundaries and source-link security checks. */
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const read=file=>readFileSync(file,'utf8');
let tests=0;
function check(actual,message){assert.ok(actual,message);tests++}
const components=[
 'src/lib/evolution/core.ts','src/app/api/evolution/route.ts','src/app/api/evolution/links/route.ts',
 'src/components/evolution-overview-client.tsx','src/app/(app)/visione/page.tsx',
 'src/app/evolution.css','src/components/sidebar-nav.tsx','src/app/(app)/giornata/page.tsx',
 'src/app/api/companion/route.ts','src/lib/daily-companion.ts',
 'supabase/migrations/202610220001_evolution_links.sql'
];
for(const file of components){
 check(existsSync(file),`File missing: ${file}`);
 if(!/\.(ts|tsx)$/.test(file))continue;
 const parsed=ts.createSourceFile(file,read(file),ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 check(parsed.parseDiagnostics.length===0,`Syntax error: ${file} — ${parsed.parseDiagnostics.map(x=>x.messageText).join(', ')}`);
}
const output=ts.transpileModule(read('src/lib/evolution/core.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports={};vm.runInNewContext(output,{exports,Date,Intl});
const {makeEvolution,dateInRome,isoDay,shifted,areaNames,sourceNames}=exports;
check(isoDay('2026-02-29')===null,'Reject impossible calendar day');
check(isoDay('2024-02-29')==='2024-02-29','Accept leap day');
check(isoDay('2026-10-22T00:00')===null,'Strict date-only format');
check(shifted('2026-03-01',-1)==='2026-02-28','Month shift');
check(shifted('2024-03-01',-1)==='2024-02-29','Leap date shift');
check(dateInRome('2026-10-21T23:50:00Z')==='2026-10-22','Rome timezone near midnight');
check(dateInRome('2026-07-01T22:30:00Z')==='2026-07-02','Rome summer time');
check(dateInRome('invalid')===null,'Invalid timestamp skipped');
check(Object.keys(areaNames).length===8,'All eight areas');
check(Object.keys(sourceNames).length===9,'Nine kinds of factual source');
const wid='132bb604-b038-44f1-b06b-c0767a315820';
const cid='d3b804ac-19df-49cb-aac9-39b0d7498156';
const cfood='a8b99ca7-17dd-47a1-b7a5-b1b080b0e751';
const profile={goal:'Organizzare meglio la settimana',areas:['allenamento','alimentazione','lavoro'],priority_areas:['allenamento','lavoro'],support_level:'guidato'};
const sample={today:'2026-10-22',profile,
 commitments:[{id:cid,title:'Allenati',kind:'allenamento',status:'active'},{id:cfood,title:'Prepara i pasti',kind:'alimentazione',status:'active'}],
 workouts:[{id:wid,occurred_at:'2026-10-22T05:05:00Z',activity:'vogatore',duration_minutes:25}],
 mealPlans:[{week_start:'2026-10-19',updated_at:'2026-10-21T13:00:00Z',menu:['p1','p2']}],
 coachLogs:[{commitment_id:cid,day:'2026-10-22',outcome:'done'}],
 states:[{day:'2026-10-22',energy:3}],focusLogs:[{day:'2026-10-22',outcome:'skipped'}],
 paths:[{program_id:'prog1',day:'2026-10-20',outcome:'done'}],programs:[{id:'prog1',category:'lingue'}],
 scenarios:[{id:'scen1',day:'2026-10-19',outcome:'done'}],
 actions:[{day:'2026-10-18',action_key:'key1',status:'done'}],legacyActions:[],
 diary:[{id:'diary1',created_at:'2026-10-21T21:50:00Z',kind:'general'}],links:[]};
const result=makeEvolution(sample);
check(result.events.length===9,'All source observations shared');
check(result.stats7.workout===1 && result.stats7.coach===1,'Separate sources count separately');
check(result.stats7.meal_plan===1,'Meal plan recorded, not meals consumed');
check(result.stats7.path===1,'Guided path contributes');
check(result.stats7.diary===1,'Diary contributes without exposing content');
check(result.domain.some(x=>x.area==='lavoro'&&x.isPriority),'Selected priorities preserved');
check(result.domain.some(x=>x.area==='alimentazione'&&!x.isPriority),'Inactive interest still visible');
check(result.domain.find(x=>x.area==='allenamento').observations30===1,'One workout means one workout observation, not two');
check(result.events.find(x=>x.source==='coach').area===null,'No made-up connection between generic Coach item and area');
check(!result.events.find(x=>x.source==='workout').linkedCommitmentId,'No unconfirmed coach link');
check(result.linkableUnlinked===2,'Workout + meal are linkable');
check(result.linkedEvidence===0,'No link assumed');
check(!result.events.some(x=>x.detail.includes('general')),'Diary content not copied');
check(result.stats30.checkin===1,'Checkins measured');
check(result.events.find(x=>x.source==='focus').outcome==='skipped','Skipped outcomes remain explicit');
check(result.events.find(x=>x.source==='workout').day==='2026-10-22','Correct workout date');
const link={id:'b3d306ef-e6d1-40b1-94c1-d27fb1c8c100',commitment_id:cid,source_kind:'workout',source_key:wid,evidence_day:'2026-10-22'};
const withLinks=makeEvolution({...sample,links:[link]});
check(withLinks.events.find(x=>x.source==='workout').linkedCommitmentId===cid,'Explicit association visible');
check(withLinks.linkedEvidence===1 && withLinks.linkableUnlinked===1,'Link status updates aggregation');
check(withLinks.stats7.coach===1 && withLinks.stats7.workout===1,'Evidence link never double marks Coach');
check(makeEvolution({...sample,workouts:[...sample.workouts,...sample.workouts]}).stats30.workout===1,'Duplicated fetch evidence deduplicated by ID');
check(makeEvolution({...sample,workouts:[]}).stats30.workout===0,'No workout does not invent attendance');
check(makeEvolution({...sample,coachLogs:[]}).stats30.coach===0,'No coach log means no outcome');
check(makeEvolution({...sample,profile:null}).domain.length===0,'Absent onboarding not inferred');
check(makeEvolution({...sample,legacyActions:[{id:'old1',status:'completed',created_at:'2026-10-20T09:00:00Z',completed_at:'2026-10-21T09:00:00Z'}]}).stats30.action===2,'Historical completed actions contribute without removing Life actions');
check(makeEvolution({...sample,legacyActions:[{id:'old1',status:'pending',created_at:'2026-10-20T09:00:00Z',completed_at:null}]}).stats30.action===1,'Pending old action not called an accomplishment');
check(makeEvolution({...sample,workouts:[{...sample.workouts[0],occurred_at:'2026-09-01T04:00:00Z'}]}).stats30.workout===0,'Old workouts excluded');
check(makeEvolution({...sample,workouts:[{...sample.workouts[0],occurred_at:'2026-10-23T04:00:00Z'}]}).stats30.workout===0,'Future workouts excluded');
check(makeEvolution({...sample,diary:[{id:'new',created_at:'2026-10-21T23:55:00Z',kind:'general'}]}).events.find(x=>x.source==='diary').day==='2026-10-22','Rome diary timezone');
const empty=makeEvolution({...sample,workouts:[],mealPlans:[],coachLogs:[],states:[],focusLogs:[],paths:[],scenarios:[],actions:[],legacyActions:[],diary:[]});
check(empty.observed7===0 && empty.observed30===0,'Empty sources do not imply user failure');
check(empty.note.includes('non esiste un punteggio'),'No invented global score');
const api=read('src/app/api/evolution/route.ts');
check(api.includes('sb.auth.getUser()'),'Authenticated reads');
check((api.match(/\.eq\('user_id',user\.id\)/g)||[]).length>=12,'Every read scoped to authenticated owner');
check(api.includes('Cache-Control'), 'No shared cache of private observations');
check(api.includes('action_items'),'Old action items included in shared overview');
check(api.includes('diary_entries')&&!api.includes("select('body"),'Diary contents not fetched');
check(api.includes('evolve_evidence_links'),'Saved links returned as part of shared read model');
check(api.includes('notices.push'),'Partial source failures disclosed');
const linkApi=read('src/app/api/evolution/links/route.ts');
check(linkApi.includes('confirmed:z.literal(true)'),'Explicit linking consent');
check(linkApi.includes('sb.auth.getUser()'),'Authenticated writes');
check((linkApi.match(/\.eq\('user_id',user\.id\)/g)||[]).length>=4,'Owner on commitment, evidence and deletion');
check(linkApi.includes("commitment.kind!==(source_kind==='workout'?'allenamento':'alimentazione')"),'Kind-compatible attribution');
check(linkApi.includes('dateInRome'),'Evidence source date independently derived');
check(linkApi.includes('shifted(today,-29)'),'Old evidence rejected');
check(!linkApi.includes("from('evolve_coach_logs')"),'Linking never mutates outcome logs');
check(!linkApi.includes('service_role'),'No service role for endpoint');
const sql=read('supabase/migrations/202610220001_evolution_links.sql');
check(sql.includes('enable row level security'),'Row-level security enabled');
check(sql.includes('user_id=auth.uid()'),'RLS requires current owner');
check(sql.includes('w.user_id=auth.uid()')&&sql.includes('m.user_id=auth.uid()'),'RLS checks source ownership');
check(sql.includes('c.user_id=auth.uid()'),'RLS verifies Coach ownership');
check(sql.includes("c.status='active'"),'RLS only active commitments');
check(sql.includes('evidence_day between'),'RLS guards date window');
check(sql.includes('::date=evidence_day'),'RLS verifies event date');
check(sql.includes('unique(user_id,source_kind,source_key)'),'One evidence cannot be reused across multiple tasks');
check(!sql.match(/\b(drop table|truncate)\b/i),'No destructive table operations');
const sidebar=read('src/components/sidebar-nav.tsx');
check(sidebar.includes("'/visione','Visione 360'"),'Navigation from every module');
check(sidebar.includes('const mobileTools=[primary[4],primary[5]'),'Mobile navigation remains comprehensive');
check(read('src/app/(app)/giornata/page.tsx').includes('/evolve/visione'),'Companion links to unified dashboard');
const companion=read('src/app/api/companion/route.ts');
check(companion.includes("from('evolve_evidence_links')"),'Companion fetches explicit links');
check(companion.includes(".eq('evidence_day',day)"),'Companion only labels today links');
check(read('src/lib/daily-companion.ts').includes('linkedTodayIds'),'Pure agenda reads linked IDs');
check(read('src/lib/daily-companion.ts').includes('non è stato')===false,'No hidden completion write');
const companionExports={};
vm.runInNewContext(ts.transpileModule(read('src/lib/daily-companion.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:companionExports,Date,Intl});
const commitment={id:cid,kind:'allenamento',title:'Allenati',description:'Usa il diario per registrare una sessione',minutes:10,cadence:'daily',days:[],status:'active'};
const companionInput={day:sample.today,commitments:[commitment],logs:[],onceDoneIds:[],focus:null,focusLogged:false,checkin:{energy:3,available_minutes:30},support:'autonomo',areas:['allenamento'],onboarded:true,goal:profile.goal,workoutToday:true,mealSaved:null,defaultMinutes:30,linkedTodayIds:[cid]};
const linkedAgenda=companionExports.createAgenda(companionInput);
check(linkedAgenda.tasks.length===1,'Link does not suppress approved task');
check(linkedAgenda.tasks[0].why.includes('registrazione collegata'),'Companion exposes confirmed linked evidence');
check(linkedAgenda.done===0,'Link never marks Coach done');
check(companionExports.createAgenda({...companionInput,linkedTodayIds:[]}).tasks[0].why.includes('prevista per oggi'),'Unlinked due task remains unchanged');

console.log(`EVOLVE 1.8: ${tests} CHECKS PASSED`);
