import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const root=path.resolve(import.meta.dirname,'..');
const files=[
 'src/lib/outcomes/core.ts',
 'src/app/api/andamento/route.ts',
 'src/app/(app)/andamento/page.tsx',
 'src/app/(app)/progressi/page.tsx',
 'src/components/trends-360-client.tsx'
];
let checks=0;
for(const file of files){
 const source=fs.readFileSync(path.join(root,file),'utf8');
 const result=ts.transpileModule(source,{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}});
 const errors=(result.diagnostics??[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
 assert.equal(errors.length,0,`${file}: ${errors.map(x=>ts.flattenDiagnosticMessageText(x.messageText,' ')).join('; ')}`);checks++;
}
const source=fs.readFileSync(path.join(root,'src/lib/outcomes/core.ts'),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const module={exports:{}};vm.runInNewContext(compiled,{exports:module.exports,module,Date,Set,Math,Error,Number,String},{filename:'core.test.js'});
const {validIsoDay,shiftIsoDay,summarize,dailyMovement,factualInsights}=module.exports;
assert.equal(validIsoDay('2026-02-29'),false);checks++;
assert.equal(validIsoDay('2024-02-29'),true);checks++;
assert.equal(shiftIsoDay('2026-01-01',-1),'2025-12-31');checks++;
assert.equal(shiftIsoDay('2026-03-01',-1),'2026-02-28');checks++;
const data={
 workouts:[{day:'2026-10-19',duration_minutes:25,activity:'vogatore'},{day:'2026-10-19',duration_minutes:20,activity:'camminata'},{day:'2026-10-20',duration_minutes:15,activity:'kettlebell'},{day:'2026-10-09',duration_minutes:40,activity:'vogatore'},{day:'2026-10-21',duration_minutes:-900,activity:'altro'}],
 states:[{day:'2026-10-19',energy:3,mood:4,sleep_hours:7},{day:'2026-10-20',energy:4,mood:3,sleep_hours:null}],
 coach:[{day:'2026-10-20',outcome:'done'},{day:'2026-10-20',outcome:'skipped'}],
 meals:[{week_start:'2026-10-19'}],
 weights:[{id:'a',day:'2026-10-15',weight_kg:128.5,note:''},{id:'b',day:'2026-10-20',weight_kg:128,note:''}]
};
const s=summarize(data,7,'2026-10-21');
assert.equal(s.first,'2026-10-15');checks++;
assert.equal(s.trainingMinutes,60);checks++;
assert.equal(s.trainingSessions,3);checks++;
assert.equal(s.trainingDays,2);checks++;
assert.equal(s.avgEnergy,3.5);checks++;
assert.equal(s.avgSleep,7);checks++;
assert.equal(s.coachDone,1);checks++;
assert.equal(s.mealPlanWeeks,1);checks++;
assert.equal(s.weightChange,-0.5);checks++;
assert.equal(dailyMovement(data,7,'2026-10-21').length,7);checks++;
assert.ok(factualInsights(s,s).every(x=>!x.includes('guarito')));checks++;
const empty={workouts:[],states:[],coach:[],meals:[],weights:[]};
assert.equal(summarize(empty,7,'2026-10-21').weightChange,null);checks++;
assert.equal(summarize(empty,7,'2026-10-21').avgEnergy,null);checks++;
const api=fs.readFileSync(path.join(root,'src/app/api/andamento/route.ts'),'utf8');
for(const entity of ['evolve_workouts','evolve_daily_states','evolve_coach_logs','evolve_meal_plans','evolve_weight_entries']){
 assert.ok(api.includes(`from('${entity}')`),`Missing ${entity}`);checks++;
}
assert.ok((api.match(/\.eq\('user_id',user\.id\)/g)||[]).length>=6,'All reads/writes must be user filtered');checks++;
assert.ok(api.includes(".delete().eq('id',parsed.data.id).eq('user_id',user.id)"));checks++;
const sql=fs.readFileSync(path.join(root,'supabase/migrations/202610210002_outcomes.sql'),'utf8');
assert.ok(sql.includes('enable row level security'));checks++;
for(const action of ['select','insert','update','delete']){assert.ok(sql.includes(`for ${action} to authenticated`));checks++;}
const css=fs.readFileSync(path.join(root,'src/app/outcomes.css'),'utf8');
assert.ok(css.includes('max-width:600px'));checks++;
assert.ok(css.includes('max-width:370px'));checks++;
assert.ok(css.includes('minmax(0,1fr)'));checks++;
console.log(`OK: ${checks} controlli Evolve 1.4 (sintassi, date, progressi, RLS, responsive)`);
