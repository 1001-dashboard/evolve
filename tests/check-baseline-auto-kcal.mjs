/** Evolve 1.9.5 — baseline, truthful weekly data, and voluntary AI estimate flow. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
let checks=0;
function test(name,fn){try{fn();checks++}catch(e){throw new Error(name+': '+e.message)}}
function read(path){return fs.readFileSync(path,'utf8')}
function transpile(file){const r=ts.transpileModule(read(file),{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}});const errs=(r.diagnostics??[]).filter(x=>x.category===ts.DiagnosticCategory.Error);assert.equal(errs.length,0,errs.map(x=>ts.flattenDiagnosticMessageText(x.messageText,' ')).join('\n'));return r.outputText;}
function load(file){const mod={exports:{}};vm.runInNewContext(transpile(file),{module:mod,exports:mod.exports,Intl,Date,Math,Number,String,Object,Array,Map,Set});return mod.exports;}
const b=load('src/lib/evolution/baseline.ts');
test('age after birthday',()=>assert.equal(b.ageAt('1987-04-10','2026-10-27'),39));
test('age before birthday',()=>assert.equal(b.ageAt('1987-11-10','2026-10-27'),38));
test('invalid birthday',()=>assert.equal(b.ageAt('2026-02-30','2026-10-27'),null));
test('future birthday',()=>assert.equal(b.ageAt('2030-01-01','2026-10-27'),null));
test('minor not calculated',()=>assert.equal(b.ageAt('2015-01-01','2026-10-27'),null));
const base={today:'2026-10-27',birth_date:'1987-04-10',height_cm:180,profile_weight_kg:120,entries:[],notices:[]};
test('profile weight fallback',()=>assert.equal(b.baselineFacts(base).latestWeight,120));
test('BMI 180 cm 120 kg',()=>assert.equal(b.baselineFacts(base).bmi,37));
test('no implied target weight',()=>assert.ok(!('goalWeight' in b.baselineFacts(base))));
test('latest log overrides profile',()=>assert.equal(b.baselineFacts({...base,entries:[{day:'2026-10-20',weight_kg:119}]}).latestWeight,119));
test('one weight no trend',()=>assert.equal(b.baselineFacts({...base,entries:[{day:'2026-10-20',weight_kg:119}]}).netChangeKg,null));
test('history change, no moral judgement',()=>assert.equal(b.baselineFacts({...base,entries:[{day:'2026-10-12',weight_kg:121},{day:'2026-10-20',weight_kg:119}]}).netChangeKg,-2));
test('sorted history',()=>assert.equal(b.baselineFacts({...base,entries:[{day:'2026-10-20',weight_kg:119},{day:'2026-10-12',weight_kg:121}]}).latestWeight,119));
test('nudge weekly on day 7',()=>assert.equal(b.baselineFacts({...base,entries:[{day:'2026-10-20',weight_kg:119}]}).nextWeighIn,true));
test('no nudge next day',()=>assert.equal(b.baselineFacts({...base,entries:[{day:'2026-10-26',weight_kg:119}]}).nextWeighIn,false));
test('new user nudge',()=>assert.equal(b.baselineFacts(base).nextWeighIn,true));
test('no BMI without height',()=>assert.equal(b.baselineFacts({...base,height_cm:null}).bmi,null));
test('no weight cannot infer BMI',()=>assert.equal(b.baselineFacts({...base,profile_weight_kg:null}).bmi,null));
test('empty sparkline',()=>assert.equal(b.weightLine([]),null));
test('one point sparkline',()=>assert.equal(b.weightLine([{day:'2026-10-27',weight_kg:120}]),null));
test('two points chart',()=>assert.equal(b.weightLine([{day:'2026-10-12',weight_kg:121},{day:'2026-10-26',weight_kg:119}]).dots.length,2));
test('flat line finite positions',()=>assert.ok(b.weightLine([{day:'2026-10-12',weight_kg:120},{day:'2026-10-26',weight_kg:120}]).dots.every(d=>Number.isFinite(d.y))));
const food=load('src/lib/nutrition-journal.ts');
const meal=(id,date,kcal)=>({id,eaten_at:date,meal_type:'pranzo',description:'Pasto',kcal,kcal_low:null,kcal_high:null,calorie_source:kcal===null?'non_disponibile':'stima_personale',note:''});
const week=food.foodWeek([meal('a','2026-10-27T11:00:00+01:00',420),meal('b','2026-10-26T11:00:00+01:00',null)],'2026-10-27');
test('seven day chart',()=>assert.equal(week.length,7));
test('last day known',()=>assert.equal(week[6].kcalKnown,420));
test('unknown calories are not zero',()=>assert.equal(week[5].kcalKnown,null));
test('unknown partial',()=>assert.equal(week[5].partial,true));
test('no logs not inferred fasting',()=>assert.equal(week[0].kcalKnown,null));
test('no target from food log',()=>assert.equal(food.summarizeFood([meal('a','2026-10-27T11:00:00+01:00',420)],'2026-10-27',null).remaining,null));
test('invalid date has no graph',()=>assert.equal(food.foodWeek([],'today').length,0));
const client=read('src/components/nutrition-journal-client.tsx');
const api=read('src/app/api/evolution/baseline/route.ts');
const baseline=read('src/components/evolution-baseline-client.tsx');
for(const [s,context] of [
 ['if(!editingBeer&&meal.kcal.trim()===\'\'&&consent){await calculateKcal();return;}',client],
 ['Conferma stima e salva',client],['Stima automaticamente le kcal',client],
 ['Completa kcal',client],['foodWeek(',client],
 ['setReviewEstimate(true)',client]])test('Client contains '+s,()=>assert.ok(context.includes(s)));
test('Description edits invalidate previous estimate',()=>assert.ok(client.includes('setReviewEstimate(false)')));
test('No AI without consent',()=>assert.ok(client.includes("if(!consent){setError(")));
test('No direct auto insert in estimate endpoint',()=>assert.ok(!read('src/app/api/nutrition/estimate/route.ts').includes('.insert(')));
test('Baseline checks server identity',()=>assert.ok(api.includes('if(authError||!user)')));
test('Baseline queries scoped to user',()=>assert.equal((api.match(/\.eq\('user_id',user.id\)/g)||[]).length,2));
test('Baseline does not alter recorded weight',()=>assert.ok(!api.includes('.update(')&&!api.includes('.insert(')&&!api.includes('.upsert(')));
test('Actual weight saved through existing API',()=>assert.ok(baseline.includes("apiUrl('/api/andamento')")));
test('No guessed weight values in form',()=>assert.ok(baseline.includes("useState('')")));
test('BMI is only screening',()=>assert.ok(baseline.includes('non indica da solo')));
test('Do not prescribe calories automatically',()=>assert.ok(baseline.includes('non definisce un obiettivo dietetico')));
test('Daily check once per 7 days',()=>assert.ok(read('src/lib/evolution/baseline.ts').includes('daysSinceWeighIn>=7')));
test('Chart real weights',()=>assert.ok(baseline.includes('weightLine(data.entries)')));
for(const p of ['src/components/evolution-baseline-client.tsx','src/app/api/evolution/baseline/route.ts','src/components/nutrition-journal-client.tsx','src/app/(app)/alimentazione/page.tsx','src/app/(app)/giornata/page.tsx','src/app/(app)/visione/page.tsx']){
 test('TS syntax '+p,()=>transpile(p));
}
for(const page of ['alimentazione','giornata','visione'])test('Connected '+page,()=>assert.ok(read(`src/app/(app)/${page}/page.tsx`).includes('EvolutionBaselineClient')));
console.log(`EVOLVE 1.9.5: ${checks} controlli superati.`);
