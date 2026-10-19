import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let ts; try {ts=require('typescript')} catch {ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const root=process.cwd();
const errors=[];
let n=0;
function visit(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){if(ent.name==='node_modules'||ent.name==='.next')continue;const p=path.join(dir,ent.name);if(ent.isDirectory())visit(p);else if(/\.(tsx?|jsx?)$/.test(p)){const code=fs.readFileSync(p,'utf8');const sf=ts.createSourceFile(p,code,ts.ScriptTarget.Latest,true,p.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);n++;for(const d of sf.parseDiagnostics){const loc=sf.getLineAndCharacterOfPosition(d.start??0);errors.push(`${p}:${loc.line+1}:${loc.character+1} ${ts.flattenDiagnosticMessageText(d.messageText,' ')}`)}}}}
visit(path.join(root,'src'));
assert.deepEqual(errors,[],`Syntax errors:\n${errors.join('\n')}`);
assert.match(fs.readFileSync('next.config.ts','utf8'),/basePath:\s*['"]\/evolve['"]/);
assert(fs.existsSync('public/brand/logo.png'));
assert.match(fs.readFileSync('src/components/evolve-brand.tsx','utf8'),/logo\.src\.startsWith/);
assert.match(fs.readFileSync('src/components/programs-client.tsx','utf8'),/id="exercise-fields"/);
assert.match(fs.readFileSync('src/components/programs-client.tsx','utf8'),/guide\.steps\.map/);
assert.match(fs.readFileSync('src/components/programs-client.tsx','utf8'),/saveOutcome\('done'\)/);
assert.match(fs.readFileSync('src/components/programs-client.tsx','utf8'),/Troppo difficile/);
assert.match(fs.readFileSync('src/components/programs-client.tsx','utf8'),/Non oggi/);

// transpile pure functions into CommonJS to test without node_modules
const mod={exports:{}};
let js=ts.transpileModule(fs.readFileSync('src/lib/programs.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
new Function('exports','module','require',js)(mod.exports,mod,()=>{});
const lib=mod.exports;
const guideModule={exports:{}};
js=ts.transpileModule(fs.readFileSync('src/lib/exercise-guide.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
new Function('exports','module','require',js)(guideModule.exports,guideModule,()=>{});
const {guideFor,countAnswered,requiredAnswers,formatGuidedNote}=guideModule.exports;
let categoryCount=0,exerciseCount=0;
for(const cat of lib.categories){
  categoryCount++;
  for(let level=1;level<=4;level++){
    const keys=new Set();
    for(let i=0;i<3;i++){
      const ex=lib.exerciseFor({category:cat.id,level},i);
      assert(ex.key&&ex.title&&ex.description&&ex.minutes>0,`${cat.id} L${level}`);
      assert(!keys.has(ex.key),'Repeated exercise');
      keys.add(ex.key);exerciseCount++;
      const guide=guideFor(ex,cat.id);
      assert(guide.steps.length===3&&guide.intro&&guide.prompt);
      assert(guide.required<=guide.fields.length&&guide.quickRequired<=guide.required);
      if(cat.id==='alcol')assert(/non|osserv|attivit/i.test(guide.intro));
    }
  }
}
assert.equal(categoryCount,6);
assert.equal(exerciseCount,72);
const c=guideFor(lib.exerciseFor({category:'cambiamento',level:1},0),'cambiamento');
assert.equal(c.fields.length,3);assert.equal(c.required,3);assert.equal(c.quickRequired,1);
const answer={[c.fields[0].label]:'Casa: so budget; verifico affitti'};
assert.equal(countAnswered(c,answer),1);
assert.equal(requiredAnswers(c,false),3);
assert.equal(requiredAnswers(c,true),1);
assert.match(formatGuidedNote(c,answer,'Fatto'),/verifico affitti/);
assert.equal(formatGuidedNote(c,{},' '),'');
const l=guideFor(lib.exerciseFor({category:'lingue',level:1},0),'lingue');
assert.equal(l.required,0);assert.equal(countAnswered(l,{}),0);assert.match(l.example,/Buenos días/);
assert.equal(lib.exerciseFor({category:'cambiamento',level:1},3).key,lib.exerciseFor({category:'cambiamento',level:1},0).key);
console.log(JSON.stringify({syntax_files:n,categories:categoryCount,exercise_cases:exerciseCount,guided_steps:exerciseCount*3,special_guide_c1a:true,alcohol_safe:true,basePath:true,logo_fallback:true,interaction_states:3,status:'PASS'},null,2));
