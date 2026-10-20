import {readFileSync,existsSync} from 'node:fs';import assert from 'node:assert/strict';
const read=p=>readFileSync(p,'utf8');const config=read('next.config.ts');assert(config.includes("basePath: '/evolve'"));
for(const file of ['src/app/(app)/allenamento/page.tsx','src/app/(app)/mealprep/page.tsx','src/app/api/training/route.ts','src/app/api/mealprep/route.ts','supabase/migrations/202610190004_training_mealprep.sql'])assert(existsSync(file),file);
const recipe=read('src/lib/mealprep.ts');assert((recipe.match(/id:'/g)||[]).length>=8);const nav=read('src/components/sidebar-nav.tsx');assert(nav.includes('/allenamento')&&nav.includes('/mealprep'));const api=read('src/app/api/training/route.ts');assert(api.includes('sb.auth.getUser()')&&api.includes(".eq('user_id',user.id)"));const sql=read('supabase/migrations/202610190004_training_mealprep.sql');assert(sql.includes('enable row level security'));assert(sql.includes('evolve_meal_plans'));console.log('Evolve 1.0 structural release checks OK');

// Regression: makeDayPlan requires `state`, while loadLife returns `checkin`.
const dailyPage=read('src/app/(app)/giornata/page.tsx');
assert(/state\s*:\s*life\.checkin/.test(dailyPage),'Giornata must pass daily check-in as planner state');
assert(!dailyPage.includes('makeDayPlan({...life,'),'Do not spread loadLife directly into makeDayPlan');
console.log('Planner input mapping regression: OK');

// Regression: one canonical LifeProfile definition, including explicit AI consent.
const central=read('src/lib/life/types.ts');
const engine=read('src/lib/life-engine.ts');
assert(central.includes('coach_context_opt_in: boolean;'),'Canonical LifeProfile must declare AI opt-in');
assert(engine.includes("export type {LifeArea,LifeProfile,DailyState,DailyAction} from './life/types'"),'Life engine must re-export canonical models');
assert(!engine.includes('export type LifeProfile={'),'Do not duplicate LifeProfile in life-engine');
console.log('LifeProfile canonical typing regression: OK');
