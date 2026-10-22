/** Evolve 1.8.1 — logic, integration contracts, security assertions. */
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
const ts=require('typescript');
let checks=0;
const ok=(v,label)=>{assert.ok(v,label);checks++};
const read=p=>readFileSync(p,'utf8');
const expected=[
 'src/lib/evolution/goals.ts','src/app/api/evolution/goals/route.ts',
 'src/app/api/evolution/goal-links/route.ts','src/components/goal-journey-panel.tsx',
 'src/app/goal-journey.css','src/app/(app)/visione/page.tsx',
 'src/app/(app)/allenamento/page.tsx','src/app/(app)/giornata/page.tsx',
 'supabase/migrations/202610220002_goals_evidence.sql'
];
for(const name of expected){
 ok(existsSync(name),'Manca '+name);
 if(name.endsWith('.sql')||name.endsWith('.css'))continue;
 const source=ts.createSourceFile(name,read(name),ts.ScriptTarget.Latest,true,name.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 ok(source.parseDiagnostics.length===0,`Syntax error ${name}: ${source.parseDiagnostics.map(x=>x.messageText).join('; ')}`);
}
const source=read('src/lib/evolution/goals.ts');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports={};vm.runInNewContext(js,{exports,Date,Map,Number,Set});
const {GOAL_AREAS,dateShift,goalStats,asEvidenceKey}=exports;
ok(GOAL_AREAS.length===8,'Eight goal areas');
ok(GOAL_AREAS.includes('allenamento')&&GOAL_AREAS.includes('relazioni'),'Full profile scopes');
ok(dateShift('2026-10-22',-29)==='2026-09-23','30 day window');
ok(dateShift('2026-03-01',-1)==='2026-02-28','Month boundary');
ok(dateShift('2024-03-01',-1)==='2024-02-29','Leap day');
for(const bad of ['bad','2026-02-30','2026-10-1','']){let rejected=false;try{dateShift(bad,3)}catch{rejected=true}ok(rejected,'Invalid date rejects '+bad)}
ok(asEvidenceKey('workout','test')==='workout:test','Typed event composite key');
const id='ab3e7bc8-3e25-4872-9d22-4c5810f3b662';
const goal={id,area:'allenamento',title:'Continuare con il movimento',description:'',status:'active',created_at:'2026-01-01T00:00:00Z'};
const goal2={...goal,id:'ce331ee8-5642-482c-a8ef-74fe10bf0a7a',title:'Un altro obiettivo'};
const workout={kind:'workout',key:'w1',day:'2026-10-22',label:'Vogatore',detail:'',href:'/allenamento',minutes:25};
const meal={kind:'meal_plan',key:'2026-10-19',day:'2026-10-21',label:'Piano',detail:'',href:'/mealprep'};
const coach={kind:'coach',key:'c1:2026-10-20',day:'2026-10-20',label:'Fatto',detail:'',href:'/piano'};
const older={kind:'workout',key:'w0',day:'2026-09-19',label:'Vecchio',detail:'',href:'/allenamento',minutes:30};
const l=(kind,key,day,goal_id=id)=>({id:kind+key,goal_id,source_kind:kind,source_key:key,evidence_day:day});
const selected=[l('workout','w1','2026-10-22'),l('meal_plan','2026-10-19','2026-10-21'),l('coach','c1:2026-10-20','2026-10-20')];
let stats=goalStats([goal,goal2],selected,[workout,meal,coach,older],'2026-10-22');
ok(stats.length===2,'Each goal separate');
ok(stats[0].workouts7===1&&stats[0].workouts30===1,'Workout counted only once');
ok(stats[0].minutes7===25&&stats[0].minutes30===25,'Workout minutes exact');
ok(stats[0].mealPlans30===1,'Meal plan represented separately');
ok(stats[0].coachDone30===1,'Coach observation separately');
ok(stats[0].totalRecorded30===3,'Event count not misrepresented as workouts');
ok(stats[0].lastEvidenceDay==='2026-10-22','Last record day');
ok(stats[1].totalRecorded30===0,'Unlinked goal has zero observed evidence');
ok(stats[1].lastEvidenceDay===null,'No event date invented');
stats=goalStats([goal],[...selected,selected[0]],[workout,workout,meal,coach],'2026-10-22');
ok(stats[0].workouts30===1,'Duplicate links and events not double counted');
stats=goalStats([goal],[l('workout','w1','2026-10-21')],[workout],'2026-10-22');
ok(stats[0].workouts30===0,'Mismatch registered day rejected');
stats=goalStats([goal],[l('workout','w0','2026-09-19')],[older],'2026-10-22');
ok(stats[0].workouts30===0,'Older event excluded from recent statistics');
stats=goalStats([goal],[l('workout','w1','2026-10-22')],[], '2026-10-22');
ok(stats[0].totalRecorded30===0,'Missing source is not manufactured');
stats=goalStats([goal],[l('coach','c1:2026-10-20','2026-10-20')],[coach], '2026-10-22');
ok(stats[0].workouts30===0&&stats[0].coachDone30===1,'Coach completion is not a workout');
for(const n of [0,-12,NaN,Infinity]){stats=goalStats([goal],[l('workout','w1','2026-10-22')],[{...workout,minutes:n}],'2026-10-22');ok(stats[0].minutes30===0,'Non-positive invalid duration not counted')}
const goalApi=read('src/app/api/evolution/goals/route.ts');
const linkApi=read('src/app/api/evolution/goal-links/route.ts');
for(const [label,text] of [['goals',goalApi],['links',linkApi]]){
 ok(text.includes('sb.auth.getUser()'),`${label} requires auth`);
 ok((text.match(/\.eq\('user_id',user\.id\)/g)||[]).length>=3,`${label} checks ownership`);
 ok(!text.includes('service_role'),`${label} no service role`);
}
ok(goalApi.includes(".eq('outcome','done')"),'Only confirmed Coach outcomes exposed');
ok(goalApi.includes(".order('occurred_at',{ascending:false}).limit(200)"),'Previously recorded training included');
ok(goalApi.includes(".from('evolve_workouts')"),'Existing workouts source not duplicated');
ok(goalApi.includes(".from('evolve_meal_plans')"),'Existing meals source not duplicated');
ok(goalApi.includes(".from('evolve_coach_logs')"),'Existing Coach log source');
ok(linkApi.includes("confirmed:z.literal(true)"),'Explicit confirmed association');
ok(linkApi.includes(".eq('outcome','done')"),'Server checks actual Coach completion');
ok(linkApi.includes(".eq('id',goal_id)"),'Server verifies goal ownership');
ok(linkApi.includes(".eq('id',source_key)"),'Server verifies workout ownership');
ok(linkApi.includes(".eq('week_start',source_key)"),'Server verifies meal plan ownership');
ok(linkApi.includes(".delete().eq('user_id',user.id)"),'Revocable link per owner');
ok(!linkApi.includes(".from('evolve_coach_logs').insert"),'Link does not create Coach outcome');
ok(!linkApi.includes(".from('evolve_workouts').insert"),'Link does not create workout');
const sql=read(expected.at(-1));
ok(sql.includes('enable row level security')&&sql.match(/enable row level security/g).length===2,'RLS on both new tables');
ok(sql.includes('evolve_goals_owner'),'Owner policy for goals');
ok(sql.includes('evolve_goal_links_insert'),'Owner insert policy for links');
ok(sql.includes('auth.uid()'),'User validation in RLS');
ok(sql.includes("unique(user_id,source_kind,source_key)"),'One goal assignment per event');
ok(sql.includes('foreign key (goal_id,user_id)'),'Goal cannot belong to other user');
ok(sql.includes('w.id::text=source_key')&&sql.includes('w.user_id=auth.uid()'),'SQL validates workout owner');
ok(sql.includes('m.user_id=auth.uid()'),'SQL validates meal owner');
ok(sql.includes("l.outcome='done'")&&sql.includes('l.user_id=auth.uid()'),'SQL validates actual Coach outcome');
ok(!sql.includes('drop table')&&!sql.includes('truncate '),'Migration is additive');
ok(!sql.includes('update public.evolve_coach_logs')&&!sql.includes('update public.evolve_workouts'),'Migration does not overwrite history');
const client=read('src/components/goal-journey-panel.tsx');
ok(client.includes('goalStats('),'Client uses shared calculation');
ok(client.includes('confirmed:true'),'Client requires explicit association');
ok(client.includes('Scollega'),'Client exposes unlink');
ok(client.includes("mode==='training'"),'Training view only relevant events');
ok(client.includes("mode==='today'"),'Daily read-only overview');
for(const name of ['visione','allenamento','giornata']){
 const page=read(`src/app/(app)/${name}/page.tsx`);
 ok(page.includes('GoalJourneyPanel'),'Goals accessible in '+name);
 ok(page.includes('goal-journey.css'),'Styles loaded in '+name);
}
ok(read('next.config.ts').includes("basePath: '/evolve'"),'Aruba basePath unchanged');
console.log(`EVOLVE 1.8.1: ${checks} GOAL SYNC CHECKS PASSED`);
