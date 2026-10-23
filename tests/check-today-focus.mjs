/** Evolve 1.9.1 — Today must surface previously logged training, not bury it. */
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
const ts=require('typescript');
let assertions=0;
function ok(value,message){assert.ok(value,message);assertions++;}
function match(str,rx,message){ok(rx.test(str),message);}
function read(path){ok(existsSync(path),`${path} missing`);return readFileSync(path,'utf8');}
const files=['src/app/(app)/giornata/page.tsx','src/components/today-checkin-client.tsx',
 'src/components/training-intelligence-client.tsx','src/app/api/training/intelligence/route.ts',
 'src/app/today-focus.css','src/lib/training-intelligence.ts'];
for(const f of files){const c=read(f);if(f.endsWith('.ts')||f.endsWith('.tsx')){
 const node=ts.createSourceFile(f,c,ts.ScriptTarget.ES2022,true,f.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 ok(node.parseDiagnostics.length===0,`Invalid TS/TSX syntax in ${f}`);
 }}
const page=read(files[0]);const client=read(files[1]);const tr=read(files[2]);const api=read(files[3]);
match(page,/TrainingIntelligenceClient mode="today"/, 'Training insights displayed on Today');
match(page,/TodayCheckinClient/, 'Daily checkin can update training insight');
match(page,/evolve-movimento/, 'Movement anchor present');
match(page,/id="evolve-checkin"/, 'Functional checkin anchor');
match(page,/<details[^>]*id="evolve-coach"/, 'Coach commitments accessible but secondary');
match(page,/<details[^>]*id="evolve-obiettivi"/, 'Goals accessible but secondary');
match(page,/<details[^>]*id="evolve-approfondisci"/, 'Older habit tools accessible but secondary');
for(const component of ['DailyCompanionClient','GoalJourneyPanel','LifeDayClient','OrchestratorOverview','CoachCommitments'])
 ok(page.includes(`<${component}`),`Existing ${component} preserved`);
ok(page.indexOf('TrainingIntelligenceClient mode="today"')<page.indexOf('<TodayCheckinClient'), 'Present value before requiring a checkin');
ok(!/EVOLVE CORE · NOVITÀ 1\.8/.test(page),'Remove redundant release announcement from daily view');
match(tr,/if\(mode==='today'&&!i\.profile&&!sessionsExist&&!data\.trainingPriority\)return null/, 'No silent hide for four or five workouts');
ok(!/if\(mode==='today'&&\(i\.support_level==='autonomo'\|\|/.test(tr), 'Autonomy must not hide factual training summaries');
match(tr,/showSuggestion=mode==='training'\|\|\(mode==='today'&&Boolean\(i\.profile\)\)/, 'Opted-in training plans can produce an optional next action even in Autonomo');
match(tr,/i\.support_level==='autonomo'/, 'Autonomy notice remains explicit');
match(tr,/mode==='today'&&!i\.profile/, 'No plan offers explicit opt-in rather than guessed prescription');
match(tr,/mode==='today'\?\s*'Cosa raccontano i tuoi allenamenti'/, 'Factual summary visible on Today');
match(tr,/evolve:checkin-changed/, 'Insight refreshes after a saved daily check-in');
match(client,/fetch\(apiUrl\('\/api\/training\/intelligence'\)/, 'Quick checkin loads existing values');
match(client,/todayCheckin/, 'Quick checkin reads canonical daily state');
match(client,/fetch\(apiUrl\('\/api\/life\/checkin'\)/, 'Quick checkin writes existing table/API');
match(client,/new Event\('evolve:checkin-changed'\)/, 'Quick checkin notifies insight');
match(client,/sleep_hours:sleep===''\?null:Number\(sleep\),note/, 'Preserves existing sleep and note');
match(client,/!ready/, 'No save on stale/missing data');
match(client,/useState<number\|null>\(null\)/, 'Energy and mood are initially unknown, not assumed to be three');
match(client,/energy===null\|\|mood===null/, 'No checkin recorded before user selects subjective ratings');
match(api,/select\('day,energy,mood,sleep_hours,available_minutes,note'\)/, 'API reads complete checkin to prevent data loss');
match(api,/todayCheckin:checkin\.error\?undefined:checkin\.data\?\?null/, 'Checkin exposed or marked unavailable');
match(api,/\.eq\('user_id',user\.id\)/, 'Private checkin scoped to authenticated account');
match(api,/Cache-Control':'private, no-store/, 'No private coaching data cached');
const source=read('src/lib/training-intelligence.ts');
const transpiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const exports={};vm.runInNewContext(transpiled,{exports,Date,Intl,Number,Math,Map,Set});
const work=(id,day)=>({id,occurred_at:`${day}T08:00:00Z`,activity:'vogatore',duration_minutes:20,effort:5,distance_m:4000});
const data=exports.trainingReview({today:'2026-10-23',workouts:[work('a','2026-10-15'),work('b','2026-10-18'),work('c','2026-10-20'),work('d','2026-10-21'),work('e','2026-10-22')],
 profile:null,checkin:null,support_level:'autonomo',training_priority:false});
ok(data.period28.sessions===5,'All five pre-existing workouts counted in autonomy mode');
ok(data.next.kind==='setup','No automatic training plan assumed');
ok(data.period7.sessions>=3,'Daily factual summary has recent sessions');
const css=read(files[4]);match(css,/@media\(max-width:720px\)/,'Mobile layout rules');
match(css,/min-height:44px/,'Touch targets reach minimum size');
match(css,/\.today-focus-disclosure/, 'Secondary views use dedicated style');
console.log(`EVOLVE 1.9.1: ${assertions} TODAY-FOCUS CHECKS PASSED`);
