import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
const read=p=>fs.readFileSync(p,'utf8');
let tests=0;const ok=(name,fn)=>{fn();tests++;console.log('OK',name)};
const files=['src/lib/onboarding.ts','src/lib/onboarding-data.ts','src/components/smart-onboarding-client.tsx','src/components/sidebar-nav.tsx','src/app/(app)/inizia/page.tsx','src/app/(app)/giornata/page.tsx','src/app/login/page.tsx','src/app/api/onboarding/route.ts'];
for(const file of files){
 const code=read(file);const source=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 ok('TypeScript syntax '+file,()=>assert.equal(source.parseDiagnostics.length,0,source.parseDiagnostics.map(e=>e.messageText).join('; ')));
}
const mod={exports:{}};const compiled=ts.transpileModule(read('src/lib/onboarding.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(compiled,{exports:mod.exports,module:mod});
const lib=mod.exports;
for(const area of lib.AREAS){
 const input={areas:[area.id],minutes:15,anchor:'dopo colazione',obstacle:'poco tempo'};
 ok('Safe concrete starter for '+area.id,()=>{
  const p=lib.starterPlan(input);assert.equal(p.length,1);assert(p[0].description.length>=8&&p[0].description.length<=650);assert(p[0].minutes>=1&&p[0].minutes<=120);assert(['azione','routine','allenamento','alimentazione','percorso','scenario'].includes(p[0].kind));
 });
}
for(const minutes of [5,10,15,20,30,45,60])ok('Budget '+minutes,()=>{
 const p=lib.starterPlan({areas:['abitudini','allenamento','alimentazione'],minutes,anchor:'',obstacle:''});assert.equal(p.length,3);assert(p.every(c=>c.minutes<=minutes));
});

ok('Several completions in one day do not justify fading',()=>assert.equal(lib.autonomyInsight(9,0,5,25,1).suggest,false));
for(let a=0;a<lib.AREAS.length;a++)for(let b=a+1;b<lib.AREAS.length;b++)for(let c=b+1;c<lib.AREAS.length;c++){
 const arr=[lib.AREAS[a].id,lib.AREAS[b].id,lib.AREAS[c].id];
 ok('Three-area combination '+arr.join(','),()=>{
  const p=lib.starterPlan({areas:arr,minutes:10,anchor:'',obstacle:''});
  assert.equal(p.length,3);assert(p.every(x=>x.minutes<=10));
  assert(p.every(x=>x.cadence==='weekly'&&x.days.length>=1));
  assert.equal(new Set(p.flatMap(x=>x.days)).size,6);
 });
}
ok('No automatic fade when fewer than 14 days',()=>assert.equal(lib.autonomyInsight(10,0,5,13).suggest,false));
ok('No automatic fade with sparse activity',()=>assert.equal(lib.autonomyInsight(2,0,5,22).suggest,false));
ok('No automatic fade with low confidence',()=>assert.equal(lib.autonomyInsight(8,0,2,22).suggest,false));
ok('No fade for low recorded success',()=>assert.equal(lib.autonomyInsight(4,3,5,22).suggest,false));
ok('Suggestion after sustained recordings plus confidence',()=>assert.equal(lib.autonomyInsight(8,1,4,22).suggest,true));
ok('Guided keeps optional cards',()=>assert.equal(lib.guidanceCards([{kind:'habit',key:'a'},{kind:'program',key:'b'}],'guidato').length,2));
ok('Essential keeps a single optional item',()=>assert.equal(lib.guidanceCards([{kind:'habit',key:'a'},{kind:'program',key:'b'}],'essenziale').length,1));
ok('Autonomous hides only optional prompts',()=>assert.equal(lib.guidanceCards([{kind:'habit',key:'a'}],'autonomo').length,0));
const sql=read('supabase/migrations/202610210003_smart_onboarding.sql');
ok('RLS enabled',()=>assert(sql.includes('enable row level security')&&sql.includes('auth.uid()')));
ok('Migration does not delete user data',()=>assert(!/drop\s+table|truncate\s+|delete\s+from/i.test(sql)));
const api=read('src/app/api/onboarding/route.ts');
ok('API authenticated writes and scoped reads',()=>assert(api.includes('sb.auth.getUser()')&&api.includes(".eq('user_id',user.id)")));
ok('Plan activation idempotent',()=>assert(api.includes('approval_token')&&api.includes('ignoreDuplicates:true')));
ok('Plan requires explicit user consent',()=>assert(api.includes('accepted_indices')&&api.includes('some(n=>n>=selected.length)')));
ok('AI context opt-in remains unchanged',()=>assert(!api.includes('coach_context_opt_in')));
const today=read('src/app/(app)/giornata/page.tsx');
ok('No forced onboarding and Coach stays active',()=>assert(today.includes('!onboarding?')&&today.includes('<CoachCommitments section="today"/>')));
ok('Daily prompt level affects only optional cards',()=>assert(today.includes('guidanceCards(suggested,onboarding.support_level)')));
ok('Aruba basePath unmodified by patch',()=>assert(!fs.existsSync('next.config.ts')));
ok('Android-first layout',()=>assert(read('src/app/onboarding.css').includes('@media(max-width:600px)')));
console.log(`EVOLVE 1.5 onboarding: ${tests} tests OK`);
