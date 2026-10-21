/** Evolve 1.7 — deterministic agenda and integration/static security tests. */
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const read=p=>readFileSync(p,'utf8');
let count=0;
const check=(ok,desc)=>{assert.ok(ok,desc);count++};
const files=['src/lib/daily-companion.ts','src/app/api/companion/route.ts','src/components/daily-companion-client.tsx',
 'src/app/daily-companion.css','src/app/(app)/giornata/page.tsx'];
for(const path of files){
 check(existsSync(path),`Missing ${path}`);
 if(!path.endsWith('.css')){
  const f=ts.createSourceFile(path,read(path),ts.ScriptTarget.Latest,true,path.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  check(f.parseDiagnostics.length===0,`Syntax ${path}: ${f.parseDiagnostics.map(x=>x.messageText).join(' | ')}`);
 }
}
const js=ts.transpileModule(read(files[0]),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true});
check((js.diagnostics??[]).length===0,'TS transpile without diagnostics');
const exports={};vm.runInNewContext(js.outputText,{exports});
const {createAgenda,isCompanionDue}=exports;
const uuid=n=>`a56f2130-0e01-4ad5-89f0-${String(n).padStart(12,'0')}`;
const item=(n,minutes,kind='routine',cadence='daily')=>({id:uuid(n),kind,title:`Task ${n}`,description:'Task description',minutes,cadence,days:[],status:'active'});
const base={day:'2026-10-21',commitments:[item(1,10),item(2,20),item(3,25)],logs:[],onceDoneIds:[],focus:null,focusLogged:false,
 checkin:{energy:3,available_minutes:30},support:'guidato',areas:['allenamento','alimentazione'],onboarded:true,
 goal:'Essere piu costante',workoutToday:false,mealSaved:false,defaultMinutes:15};
check(isCompanionDue({...item(1,10),cadence:'daily'},base.day),'Daily due');
check(isCompanionDue({...item(1,10),cadence:'weekly',days:[3]},base.day),'Wednesday weekly due');
check(!isCompanionDue({...item(1,10),cadence:'weekly',days:[4]},base.day),'Thursday weekly not due Wednesday');
check(isCompanionDue({...item(1,10),cadence:'once'},base.day),'Once due');
check(!isCompanionDue({...item(1,10),cadence:'once'},'garbled'),'Invalid day ignored');
const normal=createAgenda(base);
check(normal.tasks.length===2,'Budget fits 10+20 minutes');
check(normal.tasks.every(x=>x.source==='coach'),'Prioritize approved items');
check(normal.hiddenApproved===1,'Over-budget commitment not erased');
check(normal.dueMinutes===55,'Preserve total approved minutes');
check(normal.minutesAvailable===30,'Read available time');
check(normal.message.includes('restano nel Piano'),'No hidden automatic skip');
const five=createAgenda(base,{minutes:5});
check(five.tasks.length===0,'No commitment fits 5 minutes');
check(five.hiddenApproved===3,'All due commitments retained');
const ten=createAgenda(base,{minutes:10});
check(ten.tasks.length===1&&ten.tasks[0].title==='Task 1','10 minutes select one');
check(createAgenda(base,{lowEnergy:true}).tasks.length===1,'Low energy keeps one priority');
check(createAgenda({...base,checkin:{energy:1,available_minutes:30}}).tasks.length===1,'Existing low-energy checkin limits one');
check(createAgenda({...base,commitments:[{...item(1,12),status:'paused'}]}).allApproved===0,'Paused item not considered due');
const log={commitment_id:uuid(1),day:base.day,outcome:'done'};
check(createAgenda({...base,commitments:[item(1,10)],logs:[log]}).tasks.length===1,'No due, can show optional idea');
check(!createAgenda({...base,commitments:[item(1,10)],logs:[log]}).tasks.some(x=>x.id===`coach:${uuid(1)}`),'Completed not repeated');
check(createAgenda({...base,logs:[log]}).done===1,'Completion count from recorded outcomes');
check(createAgenda({...base,logs:[{...log,outcome:'skipped'}]}).skipped===1,'Skip count from recorded outcomes');
check(!createAgenda({...base,logs:[{...log,day:'2026-10-20'}]}).done,'Prior day not counted');
const once={...item(9,7),cadence:'once'};
check(createAgenda({...base,commitments:[once],onceDoneIds:[once.id]}).allApproved===0,'Once completed historically not resurfaced');
check(createAgenda({...base,commitments:[once],onceDoneIds:[]}).allApproved===1,'Once pending visible');
check(createAgenda({...base,commitments:[item(1,6),item(2,20),item(3,10)]}).tasks[0].minutes===6,'Shortest fits first');
check(createAgenda({...base,commitments:[],areas:['alimentazione'],mealSaved:false,workoutToday:null}).tasks.some(x=>x.id==='optional:meals'),'Meal prep suggestion only in chosen area');
check(!createAgenda({...base,commitments:[],areas:['alimentazione'],mealSaved:true}).tasks.some(x=>x.id==='optional:meals'),'Existing meal plan acknowledged');
check(!createAgenda({...base,commitments:[item(1,5,'alimentazione')],areas:['alimentazione'],mealSaved:false,logs:[{commitment_id:uuid(1),day:base.day,outcome:'done'}]}).tasks.some(x=>x.id==='optional:meals'),'No duplicate meal prompt after approved task');
check(!createAgenda({...base,commitments:[],areas:['alimentazione'],mealSaved:null}).tasks.some(x=>x.id==='optional:meals'),'Unavailable data not interpreted as no meal');
check(!createAgenda({...base,commitments:[],areas:[],mealSaved:false}).tasks.some(x=>x.id==='optional:meals'),'Area opt-in required');
check(!createAgenda({...base,commitments:[],areas:['allenamento'],workoutToday:null}).tasks.some(x=>x.id==='optional:training'),'Unavailable workout data no assumption');
check(createAgenda({...base,commitments:[],areas:['allenamento'],workoutToday:false}).tasks.some(x=>x.id==='optional:training'),'Movement relevant to opted-in area');
check(!createAgenda({...base,commitments:[item(1,5,'allenamento')],areas:['allenamento'],workoutToday:false,logs:[{commitment_id:uuid(1),day:base.day,outcome:'done'}]}).tasks.some(x=>x.id==='optional:training'),'No duplicate workout prompt after approved task');
check(!createAgenda({...base,commitments:[],areas:['allenamento'],workoutToday:true}).tasks.some(x=>x.id==='optional:training'),'Workout recorded today no extra prompt');
check(!createAgenda({...base,commitments:[],areas:['allenamento'],workoutToday:false},{lowEnergy:true}).tasks.some(x=>x.id==='optional:training'),'Low energy no workout prompt');
check(createAgenda({...base,commitments:[],areas:['alimentazione'],mealSaved:false},{lowEnergy:true}).tasks.length===0,'Low energy skips all extra prompts');
check(createAgenda({...base,commitments:[],support:'autonomo'}).tasks.length===0,'Autonomous mode no optional suggestions');
check(createAgenda({...base,commitments:[item(1,10)],support:'autonomo'}).tasks.length===1,'Autonomous mode retains approved commitments');
check(createAgenda({...base,commitments:[],onboarded:false}).tasks.length===0,'No prompts to unconfigured account');
check(createAgenda({...base,commitments:[],support:'essenziale'}).extraSuggested<=1,'Essential limits optional prompts');
check(createAgenda({...base,commitments:[],support:'guidato'}).extraSuggested<=1,'Guided no overload');
check(createAgenda({...base,commitments:[],focus:{title:'Settimanale',action_text:'Primo passo',minutes:10}}).allApproved===1,'Weekly approved focus included');
check(createAgenda({...base,commitments:[],focus:{title:'Settimanale',action_text:'Primo passo',minutes:10},focusLogged:true}).allApproved===0,'Weekly focus already logged hidden');
check(createAgenda({...base,commitments:[],focus:{title:'Settimanale',action_text:'Primo passo',minutes:10},support:'autonomo'}).tasks.length===1,'Weekly focus retained in autonomous');
check(createAgenda({...base,commitments:[item(1,3)],areas:[],defaultMinutes:10,checkin:null}).tasks[0].minutes===3,'Very short approved time not changed');
for(const budget of [5,10,15,20,30,45,60]){
 const agenda=createAgenda(base,{minutes:budget});
 check(agenda.tasks.reduce((s,x)=>s+x.minutes,0)<=budget,`Budget honored: ${budget}`);
 check(agenda.tasks.length<=3,`No overcrowding: ${budget}`);
 check(agenda.tasks.every(x=>x.why.length>10),'Every task justified');
}
const route=read(files[1]),client=read(files[2]),today=read(files[4]);
check(route.includes('sb.auth.getUser()'),'Auth required');
check((route.match(/\.eq\('user_id',user\.id\)/g)||[]).length>=8,'Every DB query user scoped');
check(route.includes("'Cache-Control':'private, no-store'"),'No private API caching');
check(!route.includes('service_role'),'No privileged DB access');
check(!route.includes('.update(')&&!route.includes('.upsert('),'Planning API read-only');
check(client.includes("method:'PUT'")&&client.includes("/api/coach/plan"),'Explicitly logging through Coach API');
check(client.includes("outcome:'done'|'skipped'"),'Only actual completion or skip logged');
check(client.includes('aria-pressed'),'Accessible time selection');
check(client.includes('Ripristina'),'Clear local-only override');
check(today.includes('<DailyCompanionClient/>'),'Companion top-level Today');
check(today.includes('id="evolve-checkin"'),'Check-in remains reachable');
check(today.includes('<LifeDayClient'),'Existing Life Daily remains');
check(today.includes('<OrchestratorOverview'),'Orchestrator remains');
check(today.includes("'/evolve/coach'")||today.includes('href="/evolve/coach"'),'Aruba full page links');
check(read('next.config.ts').includes("basePath: '/evolve'"),'Basepath preserved');
console.log(`EVOLVE 1.7: ${count} COMPANION CHECKS PASSED`);
