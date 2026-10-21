import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
let n=0;
function check(name,fn){fn();n++;}
const read=(p)=>fs.readFileSync(p,'utf8');
const files=['src/lib/onboarding.ts','src/components/smart-onboarding-client.tsx','src/app/api/onboarding/route.ts','src/app/api/adaptive/route.ts','src/app/api/companion/route.ts'];
for(const path of files){
 const s=read(path);
 check('Syntax: '+path,()=>{const source=ts.createSourceFile(path,s,ts.ScriptTarget.Latest,true,path.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);assert.equal(source.parseDiagnostics.length,0,JSON.stringify(source.parseDiagnostics));});
}
const out=ts.transpileModule(read(files[0]),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
assert.equal(out.diagnostics?.length??0,0);
const module={exports:{}};vm.runInNewContext(out.outputText,{exports:module.exports,module});
const {AREAS,starterPlan}=module.exports;
check('Eight distinct defined interests',()=>assert.equal(new Set(AREAS.map(a=>a.id)).size,8));
const all=AREAS.map(a=>a.id);
for(const nprio of [1,2,3]){
 for(const minutes of [5,10,15,20,30,45,60]){
  const p=starterPlan({areas:all,priority_areas:all.slice(-nprio),minutes,anchor:'',obstacle:''});
  check(`Eight areas but only ${nprio} priorities (${minutes} min)`,()=>{assert.equal(p.length,nprio);assert(p.every(a=>a.minutes<=minutes));});
 }
}
for(let i=0;i<8;i++)for(let j=0;j<8;j++)if(i!==j){
 const p=starterPlan({areas:all,priority_areas:[all[i],all[j]],minutes:10,anchor:'',obstacle:''});
 check('Priority order controls activity order',()=>{assert.equal(p[0].title,starterPlan({areas:[all[i]],priority_areas:[all[i]],minutes:10,anchor:'',obstacle:''})[0].title);});
}
check('Non-selected interest is never turned into an activity',()=>{
 const p=starterPlan({areas:all,priority_areas:['lavoro'],minutes:30,anchor:'',obstacle:''});
 assert.equal(p.length,1);assert.equal(p[0].title,'Prepara una situazione professionale');
});
const ui=read('src/components/smart-onboarding-client.tsx');
const api=read('src/app/api/onboarding/route.ts');
const adaptive=read('src/app/api/adaptive/route.ts');
const companion=read('src/app/api/companion/route.ts');
const sql=read('supabase/migrations/202610210004_focus_areas.sql');
check('Dedicated step between interests and goal',()=>assert(ui.includes('PASSO 2 · LE PRIORITÀ ATTIVE')&&ui.includes('PASSO 3 · IL PUNTO A')));
check('Full areas selection has no 3-area UI cap',()=>assert(!ui.includes('form.areas.length>=3')&&!ui.includes('{form.areas.length}/3')));
check('One to three priorities in UI',()=>assert(ui.includes('form.priority_areas.length>=3')&&ui.includes('form.priority_areas.length<1')));
check('User approves at most 3 actual commitments',()=>assert(ui.includes('setAccepted(plan.map((_,i)=>i))')&&ui.includes('accepted.length===0')));
check('API accepts up to eight interests and limits priorities',()=>assert(api.includes('areas:z.array(area).min(1).max(8)')&&api.includes('priority_areas:z.array(area).min(1).max(3)')));
check('API checks priorities subset and uniqueness',()=>assert(api.includes('v.priority_areas.some(a=>!v.areas.includes(a))')&&api.includes('new Set(a).size===a.length')));
check('API stores both fields',()=>assert(api.includes('areas:input.areas,priority_areas:input.priority_areas')));
check('User ownership required',()=>assert(api.includes('sb.auth.getUser()')&&api.includes(".eq('user_id',user.id)")));
check('Companion only sees active priorities',()=>assert(companion.includes("select('priority_areas,support_level,minutes,goal')")&&companion.includes('onboarding.data?.priority_areas')));
check('Adaptive Coach only sees active priorities',()=>assert(adaptive.includes("select('priority_areas,support_level,confidence,started_on')")&&adaptive.includes('areas:profile.data.priority_areas')));
check('Existing interests are kept in profiles',()=>assert(sql.includes('SET priority_areas = areas[1:LEAST(cardinality(areas),3)]')&&sql.includes('WHERE priority_areas IS NULL')));
check('Database validates priority subset',()=>assert(sql.includes('priority_areas <@ areas')));
check('Database supports 8 interests',()=>assert(sql.includes('cardinality(areas) BETWEEN 1 AND 8')));
check('No user data deletion or RLS removal',()=>assert(!/\bdelete\s+from\b|\btruncate\b|\bdrop\s+table\b|\bdisable\s+row\s+level\s+security\b/i.test(sql)));
check('Aruba basePath unchanged',()=>assert(read('next.config.ts').includes("basePath: '/evolve'")));
console.log('EVOLVE 1.7.1: '+n+' FOCUS AREA CHECKS PASSED');
