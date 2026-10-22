/** Evolve 1.8.2 workout history editing: syntax, security, invariants and linking regression. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const read=(name)=>fs.readFileSync(name,'utf8');
let checks=0;
function check(name,fn){fn();checks++;}
const paths=[
 'src/app/api/training/route.ts','src/components/training-client.tsx',
 'src/app/(app)/allenamento/page.tsx','src/app/training-editor.css',
 'supabase/migrations/202610220003_workout_edit_delete.sql'
];
for(const path of paths){
 check('Exists '+path,()=>assert.ok(fs.existsSync(path)));
 if(/tsx?$/.test(path))check('Parse '+path,()=>{
  const ast=ts.createSourceFile(path,read(path),ts.ScriptTarget.Latest,true,path.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  assert.equal(ast.parseDiagnostics.length,0,ast.parseDiagnostics.map(x=>x.messageText).join('; '));
 });
}
const api=read(paths[0]),ui=read(paths[1]),sql=read(paths[4]),page=read(paths[2]);
const apiChecks=[
 ['GET retains original owner-scoped diary',/export async function GET\(/, /\.from\('evolve_workouts'\)/, /\.eq\('user_id',user\.id\)/],
 ['Creation remains supported',/export async function POST\(/],
 ['PATCH available',/export async function PATCH\(/],
 ['DELETE available',/export async function DELETE\(/],
 ['Edit id is UUID',/id:z\.string\(\)\.uuid\(\)/],
 ['Validated shared fields',/const editSchema=fields\.extend/],
 ['Edit requires a valid date',/occurred_at:z\.string\(\)\.datetime\(\{offset:true\}\)/],
 ['Date cannot be in future',/stamp<=Date\.now\(\)\+60000/],
 ['Owner access with auth',/sb\.auth\.getUser\(\)/],
 ['Edit record with both id and owner',/\.update\([\s\S]*?\.eq\('id',d\.id\)\.eq\('user_id',user\.id\)/],
 ['Delete record with both id and owner',/\.delete\(\)[\s\S]*?\.eq\('id',parsed\.data\.id\)\.eq\('user_id',user\.id\)/],
 ['Missing record 404',/Sessione non trovata nel tuo diario/],
 ['Delete missing record 404',/Allenamento non trovato nel tuo diario/],
 ['Never exposes service role',/serverSupabase\(\)/],
 ['No implicit Coach updates',/No coach status mutation/]
];
for(const [title,...regexes] of apiChecks){
 if(title==='No implicit Coach updates')check(title,()=>assert.ok(!/\.from\('evolve_coach_logs'\)|\.from\('evolve_coach_commitments'\)/.test(api)));
 else check(title,()=>regexes.forEach(x=>assert.match(api,x,title)));
}
check('No service_role privilege',()=>assert.ok(!api.includes('service_role')));
check("Edit does not wipe workout details",()=>assert.ok(!/\.update\(\{[^\n]*details:/.test(api)));
check('Activity change clears vogatore-specific fields',()=>assert.match(api,/d\.activity==='vogatore'\?d\.strokes\?\?null:null/));
check('Effort and duration modification invalidate stale calories',()=>assert.match(api,/changedEffortOrDuration\?null:previous\.estimated_kcal/));
check('Optional weight can recalculate estimate',()=>assert.match(api,/d\.weight_kg!=null\?estimateKcal\(/));
check('Only returns modified record',()=>assert.match(api,/\.select\('\*'\)\.maybeSingle\(\)/));
const uiChecks=[
 ['Edit button',/Modifica<\/button>/],
 ['Delete button',/deleting===s.id\?'Elimino…':'Elimina'/],
 ['Edit uses PATCH',/method:editingId\?'PATCH':'POST'/],
 ['Edit does not duplicate row',/setEditingId\(s\.id\)/],
 ['Delete user confirmation',/window\.confirm\(/],
 ['Delete uses DELETE',/method:'DELETE'/],
 ['No auto delete',/if\(!window\.confirm/],
 ['Can cancel editing',/function cancelEdit\(/],
 ['Edit starts with original date',/setOccurredAt\(localDateTime\(new Date\(s\.occurred_at\)\)\)/],
 ['Edit original duration',/setMinutes\(String\(s\.duration_minutes\)\)/],
 ['Edit original effort',/setEffort\(String\(s\.effort\)\)/],
 ['Edit original note',/setNotes\(s\.notes\|\|''\)/],
 ['Edit original distance',/setDistance\(filled\(s\.distance_m\)\)/],
 ['Edit original stroke count',/setStrokes\(filled\(s\.strokes\)\)/],
 ['Edit original cadence',/setCadence\(filled\(s\.cadence_spm\)\)/],
 ['Edit original machine calories',/setMachine\(filled\(s\.machine_kcal\)\)/],
 ['Saving refreshes diary',/await load\(\);resetForm\(\)/],
 ['Deletion refreshes diary',/await load\(\);window\.dispatchEvent\(new Event\('evolve:workout-changed'\)\)/],
 ['Confirm wording says permanent',/Eliminare definitivamente/],
 ['Pending operation disables buttons',/const locked=saving\|\|Boolean\(deleting\)/]
];
for(const [title,regex] of uiChecks)check(title,()=>assert.match(ui,regex,title));
check('Form mounted for editing',()=>assert.match(ui,/ref=\{formRef\}/));
check('Aruba-safe fetch path',()=>assert.match(ui,/apiUrl\('\/api\/training'\)/));
check('Goals panel listens for workout updates',()=>assert.match(read('src/components/goal-journey-panel.tsx'),/addEventListener\('evolve:workout-changed'/));
check('Workout emits update event',()=>assert.match(ui,/dispatchEvent\(new Event\('evolve:workout-changed'\)\)/));
check('No automatic Coach completion',()=>assert.ok(!/api\/coach\/plan/.test(ui)));
const sqlChecks=[
 ['Authenticated owner policy unchanged',/create or replace function public\.evolve_sync_workout_evidence/],
 ['Atomic trigger after edits/deletions',/after update of occurred_at or delete on public\.evolve_workouts/],
 ['Both link types covered',/evolve_evidence_links/,/evolve_goal_links/],
 ['Deletes only linked workout key',/source_kind='workout' and source_key=old\.id::text/],
 ['Updates linked date',/evidence_day=\(new\.occurred_at at time zone 'Europe\/Rome'\)::date/],
 ['Handles absent optional tables',/to_regclass\('public\.evolve_evidence_links'\)/,/to_regclass\('public\.evolve_goal_links'\)/],
 ['Execution rights restricted',/revoke all on function public\.evolve_sync_workout_evidence\(\) from public/],
 ['Migration can rerun',/drop trigger if exists evolve_workouts_sync_evidence/],
 ['SQL function fixed search_path',/security definer set search_path = ''/]
];
for(const [title,...patterns] of sqlChecks)check(title,()=>patterns.forEach(p=>assert.match(sql,p,title)));
check('Does not delete Coach commitments',()=>assert.ok(!/delete from public\.evolve_coach_commitments/i.test(sql)));
check('Does not delete Coach logs',()=>assert.ok(!/delete from public\.evolve_coach_logs/i.test(sql)));
check('Does not delete other workouts',()=>assert.ok(!/delete from public\.evolve_workouts/i.test(sql)));
check('Page loads editor CSS',()=>assert.match(page,/import '@\/app\/training-editor\.css'/));
check('Page keeps existing workout client',()=>assert.match(page,/<TrainingClient\/>/));
check('Styling includes touch-sized actions',()=>assert.match(read(paths[3]),/min-height:44px/));
console.log(`EVOLVE 1.8.2: ${checks} CRUD AND LINK INTEGRITY CHECKS PASSED`);
