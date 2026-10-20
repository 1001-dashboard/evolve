import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';
const get=(p)=>readFileSync(p,'utf8');
const check=(x,needle)=>assert(x.includes(needle),`Manca ${needle}`);
const sql=get('supabase/migrations/202610200001_coach_operativo.sql');
const api=get('src/app/api/coach/plan/route.ts');
const ai=get('src/app/api/coach/plan-draft/route.ts');
const coach=get('src/components/coach-client.tsx');
const plan=get('src/lib/coach/plan.ts');
assert(existsSync('src/components/coach-commitments.tsx'));
for(const key of ['evolve_coach_commitments','evolve_coach_logs','enable row level security','auth.uid()','user_id','coach_logs_owner','approval_token','evolve_coach_approval_unique'])check(sql,key);
for(const key of ['applySchema.safeParse','eq(\'user_id\',user.id)','source_session_id','upsert(rows,','return Response.json({ok:true,created','outcome','onConflict:\'user_id,commitment_id,day\''])check(api,key);
for(const key of ['safeGeminiDraft','eq(\'user_id\',user.id)','eq(\'session_id\',session.id)','coach_context_opt_in','responseMimeType'])check(ai,key);
for(const key of ['Conferma e attiva','Prepara il piano','onClick={approve}','onClick={generate}','onClick={()=>setDraft(null)}'])check(coach,key);
check(plan,'planDraftSchema');check(plan,'safeGeminiDraft');
const schedule=get('src/lib/coach/schedule.ts');
const compiled=ts.transpileModule(schedule,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const ctx={exports:{},module:{exports:{}}};vm.runInNewContext(compiled,ctx);const {isScheduled}=ctx.exports;
const dates=['2026-10-19','2026-10-20','2026-10-21','2026-10-22','2026-10-23','2026-10-24','2026-10-25'];
const weekdays=[1,2,3,4,5,6,7];let checks=0;
for(let i=0;i<dates.length;i++){
 for(const n of weekdays){assert.equal(isScheduled({cadence:'weekly',days:[n]},dates[i]),n===i+1);checks++;}
 assert(isScheduled({cadence:'daily',days:[]},dates[i]));assert(isScheduled({cadence:'once',days:[]},dates[i]));checks+=2;
}
assert.equal(isScheduled({cadence:'daily',days:[]},'bad-date'),false);checks++;
console.log(`Evolve Coach: OK - ${checks} schedule assertions + security, schema, confirmation and UI structural checks`);
