/** Evolve 1.9.3: factual cross-screen integration and safe one-tap beer registration. */
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);const ts=require('typescript');
const read=p=>readFileSync(p,'utf8');
let n=0;const test=(label,fn)=>{try{fn();n++;}catch(e){throw Error(`${label}: ${e.message}`)}};
const libsrc=read('src/lib/nutrition-journal.ts');
const js=ts.transpileModule(libsrc,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const module={exports:{}};vm.runInNewContext(js,{module,exports:module.exports,Intl,Date,Set,Math,Number,String,Object,Array,Map});
const lib=module.exports;
for(const [milliliters,per100,expected] of [[500,43,215],[660,43,284],[500,38,190],[660,45,297],[660,40,264],[500,15,75],[660,120,792]]){
 test(`Beer ${milliliters}ml x ${per100} kcal`,()=>assert.equal(lib.beerKcal(milliliters,per100),expected));
}
for(const invalid of [[330,43],[1000,43],[500,-5],[500,121],[500,0],[660,NaN],[660,Infinity]])test('Reject bad beer input',()=>assert.equal(lib.beerKcal(...invalid),null));
const e=(id,stamp,kcal,kind='food',ml=null)=>({id,eaten_at:stamp,meal_type:'altro',description:kind==='beer'?'Birra':'Pasto',kcal,kcal_low:null,kcal_high:null,calorie_source:kcal!=null?'stima_personale':'non_disponibile',note:'',entry_kind:kind,beer_ml:ml});
const today='2026-10-27';
const entries=[e('1','2026-10-27T11:00:00Z',500),e('2','2026-10-27T20:00:00Z',215,'beer',500),e('3','2026-10-27T21:00:00Z',284,'beer',660),e('4','2026-10-26T21:00:00Z',215,'beer',500)];
test('Beer calories appear in food total EXACTLY once',()=>assert.equal(lib.summarizeFood(entries,today,2000).estimatedTotal,999));
test('Beer entries are two today',()=>assert.equal(lib.summarizeBeer(entries,today).count,2));
test('Beer today kcal sum only today',()=>assert.equal(lib.summarizeBeer(entries,today).kcalKnown,499));
test('Deleting beer re-computes total',()=>assert.equal(lib.summarizeFood(entries.filter(x=>x.id!=='2'),today,2000).estimatedTotal,784));
test('Older beer not included today',()=>assert.equal(lib.summarizeBeer(entries,'2026-10-26').count,1));
test('Unregistered item is NOT beer',()=>assert.equal(lib.summarizeBeer(entries.map(x=>({...x,entry_kind:'food'})),today).count,0));
test('No calorie target inferred from beer',()=>assert.equal(lib.summarizeFood(entries,today,null).remaining,null));
test('Beer does NOT add an exercise session',()=>assert.equal(lib.summarizeMovement([],today).sessions7,0));
const workouts=[
 {occurred_at:'2026-10-27T08:00:00Z',activity:'vogatore',duration_minutes:30},
 {occurred_at:'2026-10-24T08:00:00Z',activity:'kettlebell',duration_minutes:15},
 {occurred_at:'2026-10-21T08:00:00Z',activity:'vogatore',duration_minutes:25},
 {occurred_at:'2026-10-20T08:00:00Z',activity:'vogatore',duration_minutes:35}];
const movement=lib.summarizeMovement(workouts,today);
for(const [key,value] of [['sessions7',3],['minutes7',70],['sessionsToday',1],['minutesToday',30]])test('Movement cross-summary '+key,()=>assert.equal(movement[key],value));
test('No workout inference on empty logs',()=>assert.equal(lib.summarizeMovement([],today).minutes7,0));
test('Ignore broken workout times',()=>assert.equal(lib.summarizeMovement([{occurred_at:'invalid',activity:'altro',duration_minutes:10}],today).sessions7,0));
test('Ignore negative workouts',()=>assert.equal(lib.summarizeMovement([{occurred_at:'2026-10-27T08:00:00Z',activity:'altro',duration_minutes:-1}],today).sessions7,0));
test('Roma midnight handled',()=>assert.equal(lib.summarizeMovement([{occurred_at:'2026-10-26T23:30:00Z',activity:'camminata',duration_minutes:20}],today).sessionsToday,1));
for(const f of ['src/app/(app)/allenamento/page.tsx','src/app/(app)/alimentazione/page.tsx','src/app/(app)/giornata/page.tsx','src/app/(app)/visione/page.tsx','src/app/api/nutrition/journal/route.ts','src/app/api/nutrition/beer/route.ts','src/components/nutrition-journal-client.tsx','supabase/migrations/202610270001_nutrition_journal.sql','supabase/migrations/202610270002_nutrition_beer.sql'])test('File '+f,()=>assert.ok(existsSync(f)));
const beerApi=read('src/app/api/nutrition/beer/route.ts');const journal=read('src/app/api/nutrition/journal/route.ts');const client=read('src/components/nutrition-journal-client.tsx');const sql=read('supabase/migrations/202610270002_nutrition_beer.sql');
for(const term of ['volume_ml:z.union([z.literal(500),z.literal(660)])','kcal_per_100ml:z.number().min(15).max(120)','label_verified:z.boolean()','beerKcal(','user_id:user.id',"entry_kind:'beer'","meal_type:'altro'",'.insert({'])test('Beer endpoint '+term,()=>assert.ok(beerApi.includes(term)));
test('Cannot submit drink anonymously',()=>assert.ok(beerApi.includes('if(authError||!user)')));
test('No unsafe user identity accepted from client',()=>assert.ok(!beerApi.includes('parsed.data.user_id')));
test('Do not send photo or provider AI request for a beer tap',()=>assert.ok(!beerApi.includes('GEMINI')&&!beerApi.includes('photo')));
test('Uses one DB insert, no activity updates',()=>assert.equal((beerApi.match(/\.insert\(/g)||[]).length,1));
for(const term of [".eq('user_id',user.id)",".from('evolve_workouts')",".from('evolve_daily_states')",'summarizeMovement(','entry_kind,beer_ml','movement,checkin:'])test('Shared journal '+term,()=>assert.ok(journal.includes(term)));
test('RLS retained for beer table',()=>assert.ok(read('supabase/migrations/202610270001_nutrition_journal.sql').includes('enable row level security')));
test('Migration backfills food via default kind',()=>assert.ok(sql.includes("entry_kind text not null default 'food'")));
test('Migration preserves owner access',()=>assert.ok(sql.includes('Existing owner RLS')));
test('Restricts beer sizes at DB',()=>assert.ok(sql.includes('beer_ml in (500,660)')));
test('No data deletion in migration',()=>assert.ok(!/\bdelete\b\s+from|\btruncate\b|\bdrop\s+table/i.test(sql)));
for(const term of ['Birretta','Birra {ml/10} cl','kcal per 100 ml','Valore verificato sull’etichetta','Mens sana in corpore sano','window.dispatchEvent',"mode==='training'",'Ho fame'])test('UI '+term,()=>assert.ok(client.includes(term)));
for(const p of ['src/app/(app)/alimentazione/page.tsx','src/app/(app)/giornata/page.tsx','src/app/(app)/visione/page.tsx','src/app/(app)/allenamento/page.tsx'])test('Present on '+p,()=>assert.ok(read(p).includes('NutritionJournalClient')));
for(const file of ['src/components/nutrition-journal-client.tsx','src/app/api/nutrition/journal/route.ts','src/app/api/nutrition/beer/route.ts','src/app/(app)/allenamento/page.tsx']){
 test('Syntax '+file,()=>{const result=ts.transpileModule(read(file),{fileName:file,reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
  const errors=(result.diagnostics??[]).filter(d=>d.category===ts.DiagnosticCategory.Error);assert.deepEqual(errors.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')),[]);});
}
console.log(`EVOLVE 1.9.3: ${n} test superati.`);
