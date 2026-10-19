/** Evolve v0.6 - checks pure business logic and TypeScript syntax. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url);
let ts;
try{ts=require('typescript')}catch{ts=require(path.join(execFileSync('npm',['root','-g'],{encoding:'utf8'}).trim(),'typescript'))}
const root=path.resolve(import.meta.dirname,'..');
const sources=[];
function list(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,ent.name);if(ent.isDirectory())list(p);else if(/\.tsx?$/.test(p))sources.push(p)}}
list(path.join(root,'src'));
let errors=0;
for(const file of sources){const sf=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);errors+=sf.parseDiagnostics.length;if(sf.parseDiagnostics.length)console.error(file,sf.parseDiagnostics.map(x=>x.messageText))}
assert.equal(errors,0,'Sintassi TypeScript/TSX');
const file=fs.readFileSync(path.join(root,'src/lib/personal-plan.ts'),'utf8');
const code=ts.transpileModule(file,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};
new Function('module','exports',code)(mod,mod.exports);
const lib=mod.exports;
assert.equal(lib.focusOptions.length,8);
const today='2026-10-19';
for(const focus of lib.focusOptions.map(x=>x.id)){
 for(let n=2;n<=7;n++){
  const profile={program_id:'test',user_id:'test',focus,starts_on:today,baseline:'Esperienza di partenza',obstacle:'',success_sign:'Risultato verificabile',days_per_week:n,confidence:2,minutes:10,preferred_time:'flessibile',updated_at:''};
  const items=lib.scheduleFor(profile,today);
  assert.equal(items.length,n);
  assert.equal(new Set(items.map(x=>x.day)).size,n);
  items.forEach(x=>{assert(x.day>=today&&x.day<='2026-10-25');assert(x.task.title&&x.task.steps.length===3);assert(x.task.minutes>0)});
  assert(lib.taskForDay(profile,today),'First day should be scheduled');
  assert.equal(lib.periodStart(profile,'2026-10-26'),'2026-10-26');
  assert.equal(lib.scheduleFor(profile,'2026-10-26').length,n);
 }
}
const pIbiza={program_id:'i',user_id:'u',focus:'ibiza',starts_on:today,baseline:'Gestisco rental ma temo nuovo contesto',obstacle:'Lingua e distanza',success_sign:'Gestisco un checkin',days_per_week:3,confidence:2,minutes:10,preferred_time:'mattina',updated_at:''};
const firstIbiza=lib.scheduleFor(pIbiza,today);
assert.equal(firstIbiza.length,3);
assert(firstIbiza[0].task.key.startsWith('tr'));
assert(firstIbiza[1].task.key.startsWith('es'));
assert(firstIbiza[2].task.key.startsWith('op'));
const w2='2026-10-26';
const baseWeek2=lib.scheduleFor(pIbiza,w2).map(x=>x.task.key);
const difficultWeek2=lib.scheduleFor(pIbiza,w2,[{day:'2026-10-19',outcome:'difficult'},{day:'2026-10-21',outcome:'difficult'}]).map(x=>x.task.key);
assert.notDeepEqual(baseWeek2,difficultWeek2,'Two difficult previous-week sessions should adjust upcoming week');
const stableWeek2=lib.scheduleFor(pIbiza,w2,[{day:'2026-10-19',outcome:'difficult'},{day:'2026-10-21',outcome:'difficult'},{day:'2026-10-26',outcome:'done'}]).map(x=>x.task.key);
assert.deepEqual(stableWeek2,difficultWeek2,'Current-week sessions must not change current-week schedule');
assert.deepEqual(lib.choicesFor('alcol'),['osservazione_alcol']);
for(const f of lib.focusOptions){if(f.id!=='osservazione_alcol')continue;const p={focus:f.id,starts_on:today,days_per_week:3,confidence:2};for(const x of lib.scheduleFor(p,today)){assert(!/riduci di \d|bevi \d|smetti subito/i.test(x.task.instruction))}}
for(const route of ['src/app/api/programs/plan/route.ts','src/app/api/programs/review/route.ts'])assert(fs.existsSync(path.join(root,route)));
assert(fs.readFileSync(path.join(root,'next.config.ts'),'utf8').includes("basePath: '/evolve'"));
console.log(`EVOLVE v0.6: OK - ${sources.length} TypeScript/TSX, 48 combinazioni focus/cadenza, 8 focus, 2 route, basePath`);
