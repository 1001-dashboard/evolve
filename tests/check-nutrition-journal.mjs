/** Evolve 1.9.2 — deterministic calculation, consistency and privacy checks. */
import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url);const ts=require('typescript');
const read=p=>readFileSync(p,'utf8');
let checks=0;
function test(label,fn){try{fn();checks++;}catch(e){throw new Error(`${label}: ${e.message}`)}}
const source=read('src/lib/nutrition-journal.ts');
const transpiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const module={exports:{}};vm.runInNewContext(transpiled,{module,exports:module.exports,Intl,Date,Set,Math,Number,String,Object,Array,Map});
const lib=module.exports;
const entry=(id,instant,kcal,source='ai_stima')=>({id,eaten_at:instant,meal_type:'pranzo',description:'pasto',kcal,kcal_low:null,kcal_high:null,calorie_source:kcal===null?'non_disponibile':source,note:''});
const today='2026-10-27';
for(const [name,value,expected] of [
 ['Rome midday','2026-10-27T12:20:00Z','2026-10-27'],
 ['Rome DST boundary','2026-03-29T22:30:00Z','2026-03-30'],
 ['Rome winter UTC boundary','2026-10-27T23:40:00Z','2026-10-28'],
 ['Invalid date','invalid',null],
])test(name,()=>assert.equal(lib.romeDate(value),expected));
const rows=[entry('a','2026-10-27T08:00:00Z',380),entry('b','2026-10-27T12:30:00Z',610),entry('c','2026-10-27T17:30:00Z',null),entry('d','2026-10-26T19:30:00Z',450)];
let summary=lib.summarizeFood(rows,today,2100);
for(const [field,expected] of [['count',3],['knownCount',2],['unknownCount',1],['estimatedTotal',990],['estimatedLow',990],['estimatedHigh',990],['reference',2100],['remaining',1110],['aboveReference',0],['partial',true]])test('Summary '+field,()=>assert.equal(summary[field],expected));
test('Estimated ranges remain visible',()=>{const row=entry('x','2026-10-27T08:00:00Z',350);row.kcal_low=200;row.kcal_high=500;const result=lib.summarizeFood([row],today,1900);assert.equal(result.estimatedLow,200);assert.equal(result.estimatedHigh,500);});
test('No goal, no remaining',()=>assert.equal(lib.summarizeFood(rows,today,null).remaining,null));
test('No invented meals',()=>assert.equal(lib.summarizeFood([],today,2100).count,0));
test('Over goal never negative remaining',()=>{let s=lib.summarizeFood([entry('z','2026-10-27T08:00:00Z',2800)],today,2100);assert.equal(s.remaining,0);assert.equal(s.aboveReference,700)});
test('Missing kcal not zero count',()=>assert.equal(lib.summarizeFood([entry('z','2026-10-27T08:00:00Z',null)],today,2000).unknownCount,1));
test('Calendar boundary excluded from today',()=>assert.equal(lib.summarizeFood([entry('z','2026-10-27T23:30:00Z',100)],today,2000).count,0));
test('No global target from raw data',()=>assert.equal(lib.summarizeFood(rows,today,100).reference,null));
for(const bad of [{age:16,heightCm:170,weightKg:80,equation:'plus5',activity:'leggera'},
 {age:40,heightCm:0,weightKg:80,equation:'plus5',activity:'leggera'},
 {age:40,heightCm:170,weightKg:0,equation:'plus5',activity:'leggera'}])test('Reject incomplete or underage calorie formula',()=>assert.equal(lib.maintenanceEstimate(bad),null));
const estimate=lib.maintenanceEstimate({age:40,heightCm:170,weightKg:80,equation:'plus5',activity:'leggera'});
test('Mifflin maintenance approximate',()=>assert.ok(estimate.center>=2000&&estimate.center<=2800));
test('Estimate has uncertainty band',()=>assert.ok(estimate.low<estimate.center&&estimate.high>estimate.center));
test('Energy is not a prescribed intake',()=>assert.ok(source.includes('NOT a prescribed intake')));
for(const excluded of ['uova','latticini','glutine','frutta secca'])test('Hunger respects '+excluded,()=>{const options=lib.hungerSuggestions(excluded);assert.ok(!options.some(o=>o.keywords.includes(excluded)));assert.ok(options.some(o=>o.id==='pasto'))});
test('Meal remains possible beyond reference',()=>assert.equal(lib.hungerSuggestions('uova, latticini, pane, frutta').at(-1).id,'pasto'));
test('Avoided fish safe',()=>assert.equal(lib.hungerSuggestions('pesce').length,3));
const paths=['src/components/nutrition-journal-client.tsx','src/app/api/nutrition/journal/route.ts','src/app/api/nutrition/estimate/route.ts','src/app/(app)/giornata/page.tsx','src/app/(app)/alimentazione/page.tsx','src/app/(app)/visione/page.tsx','supabase/migrations/202610270001_nutrition_journal.sql'];
for(const p of paths)test('Required file '+p,()=>assert.ok(existsSync(p)));
const sql=read(paths.at(-1)),journal=read(paths[1]),ai=read(paths[2]),client=read(paths[0]);
for(const name of ['evolve_food_entries','evolve_nutrition_settings'])test('RLS enabled '+name,()=>assert.ok(sql.includes(`alter table public.${name} enable row level security`)));
test('All journal data scoped to current user',()=>assert.ok((journal.match(/\.eq\('user_id',user\.id\)/g)||[]).length>=3));
test('No automatic photo save',()=>assert.ok(!journal.includes('photo')));
test('AI estimator requires opt-in',()=>assert.ok(ai.includes('z.literal(true)')));
test('AI estimator only returns preliminary results',()=>assert.ok(!ai.includes(".insert(")&&!ai.includes(".upsert(")));
test('Separate food reference from workouts',()=>assert.ok(!sql.includes('alter table public.evolve_workouts')));
test('CRUD methods all present',()=>{for(const verb of ['GET','POST','PATCH','DELETE','PUT'])assert.ok(journal.includes(`function ${verb}(`))});
test('Interactive hunger feature',()=>assert.ok(client.includes('Ho fame')));
test('AI kcal editable',()=>assert.ok(client.includes('onChange={e=>setKcal(e.target.value)}')));
test('Client delete requires confirmation',()=>assert.ok(client.includes('window.confirm(')));
test('All 3 pages integrated',()=>{for(const p of ['src/app/(app)/alimentazione/page.tsx','src/app/(app)/giornata/page.tsx','src/app/(app)/visione/page.tsx'])assert.ok(read(p).includes('NutritionJournalClient'))});
test('Maintenance input not persisted',()=>assert.ok(!journal.includes('weightKg')&&!journal.includes('heightCm')));
test('Diary history saved explicitly',()=>assert.ok(client.includes('Ho mangiato questo')));
for(const p of ['src/components/nutrition-journal-client.tsx', 'src/app/api/nutrition/journal/route.ts', 'src/app/api/nutrition/estimate/route.ts']){
 test('TS/TSX syntax: '+p,()=>{const r=ts.transpileModule(read(p),{fileName:p,reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});const errors=(r.diagnostics??[]).filter(e=>e.category===ts.DiagnosticCategory.Error);assert.deepEqual(errors.map(e=>ts.flattenDiagnosticMessageText(e.messageText,' ')),[]);});
}
console.log(`EVOLVE NUTRITION INTELLIGENCE: ${checks} controlli superati.`)
