/** v0.7: in-memory checks for deterministic planning and critical integration contracts.
 * Integration tests against live Supabase/production are intentionally out of scope. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url);
let ts;try{ts=require('typescript')}catch{ts=require(path.join(execFileSync('npm',['root','-g'],{encoding:'utf8'}).trim(),'typescript'))}
const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const source=read('src/lib/life-engine.ts');
const built=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const module={exports:{}};new Function('module','exports',built)(module,module.exports);
const {buildLifePlan,planMinutes,checkinSummary,SCENARIO_STARTERS,LIFE_AREAS}=module.exports;
assert.equal(LIFE_AREAS.length,4);assert.equal(SCENARIO_STARTERS.length,5);
const profile={display_name:'Test',life_areas:['benessere','lavoro'],minutes_per_day:15,preferred_time:'mattina',support_style:'graduale',morning_anchor:'un caffè',main_goal:'Prepararmi a un nuovo lavoro'};
const scenario={id:'123e4567-e89b-12d3-a456-426614174000',title:'Mi blocco nello spagnolo',context:'lavoro',trigger_text:'Se non capisco una richiesta',response_text:'Chiedo gentilmente di ripetere',small_step:'Ripeto una frase',fallback_text:'Chiedo supporto',active:true};
for(const budget of [5,10,15,20,30,45,60]){
 for(const energy of [1,2,3,4,5]){
  for(const mood of [1,2,3,4,5]){
   const state={day:'2026-10-19',energy,mood,sleep_hours:null,available_minutes:budget,note:''};
   const plan=buildLifePlan({...profile,minutes_per_day:budget},state,[scenario],'2026-10-19');
   assert(plan.length>=1&&plan.length<=3);
   assert(planMinutes(plan)<=budget,`Budget overflow at ${budget} min, energy ${energy}, mood ${mood}`);
   assert.equal(new Set(plan.map(x=>x.key)).size,plan.length);
   assert(plan.every(x=>x.title&&x.detail&&x.short));
   if(energy<=2||mood<=2) assert(!plan.some(x=>x.key.startsWith('scenario-')),'Low energy should simplify the plan');
  }
 }
}
assert.equal(buildLifePlan({...profile,minutes_per_day:15},null,[], '2026-10-19').length,2);
assert.match(checkinSummary(null),/registra/);
const sql=read('supabase/migrations/202610190003_life_coaching.sql');
for(const table of ['evolve_life_profiles','evolve_daily_states','evolve_scenarios','evolve_scenario_feedback','evolve_daily_actions']){
 assert(sql.includes(`create table if not exists public.${table}`));
 assert(sql.includes(`alter table public.${table} enable row level security`));
}
assert(sql.includes('coach_context_opt_in boolean not null default false'),'AI consent must default off');
for(const route of ['profile','checkin','actions','scenarios','scenarios/feedback']){
 const file=read(`src/app/api/life/${route}/route.ts`);
 assert(file.includes('auth.getUser()'),`${route}: must require authenticated identity`);
 assert(file.includes("user_id:user.id")||file.includes('user_id: user.id'),`${route}: must scope user ownership`);
}
const coach=read('src/app/api/coach/route.ts');assert(coach.includes('lifeProfile?.coach_context_opt_in?'));
for(const page of ['giornata','profilo','scenari'])assert(fs.existsSync(path.join(root,`src/app/(app)/${page}/page.tsx`)));
assert(read('next.config.ts').includes("basePath: '/evolve'"));
console.log('EVOLVE v0.7: PASS - 175 plan scenarios, capacity bounds, 5 RLS tables, 5 authenticated API routes, explicit AI consent, 3 app pages.');
