import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(p,'utf8');
const sql=read('supabase/migrations/202610190003_life_coaching.sql');
assert(sql.includes("note text not null default '' check (char_length(note) <= 280)"),'Daily actions must save meaningful user observations');
const api=read('src/app/api/life/actions/route.ts');
assert(api.includes("z.string().trim().max(280)"),'Notes must be bounded');
assert(api.includes("p.data.note.length<3"),'A done marker for habit cannot be empty');
const day=read('src/components/life-day-client.tsx');
assert(day.includes('life-step-note') && day.includes('stepNotes[card.key]'));
assert(day.includes("fetch('/evolve'"),'Fetch must honor basePath');
const home=read('src/app/(app)/oggi/page.tsx');
assert(home.includes("redirect('/giornata')"),'Legacy route must open unified daily planner');
const nav=read('src/components/sidebar-nav.tsx');assert(nav.includes("'/giornata'"));
const notes=read('src/lib/life/planner.ts');assert(notes.includes('completion_note'));
for(const name of ['evolve_life_profiles','evolve_daily_states','evolve_scenarios','evolve_scenario_feedback','evolve_daily_actions']){
 assert(sql.includes(`enable row level security`));assert(sql.includes(`public.${name}`));}
assert(read('next.config.ts').includes("basePath: '/evolve'"));
console.log('EVOLVE v0.7 Daily: PASS - note obbligatorie per mini-routine, persistenza, routing, basePath, RLS.');
