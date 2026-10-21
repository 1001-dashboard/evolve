/** Evolve v1.2: test statici del percorso utente, dell'accessibilità basilare e delle rotte. */
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
const read=p=>readFileSync(p,'utf8');
const coach=read('src/components/coach-client.tsx');
const nav=read('src/components/sidebar-nav.tsx');
const today=read('src/app/(app)/giornata/page.tsx');
const plan=read('src/app/(app)/piano/page.tsx');
const guide=read('src/app/(app)/guida/page.tsx');
const css=read('src/app/globals.css');
const profile=read('src/components/life-profile-client.tsx');
const progress=read('src/app/(app)/progressi/page.tsx');
const cases={
 'first_use_coach': ['Qual è il problema', 'Come usare il Coach', 'evolve-steps', 'coach-starters', 'Crea una proposta di piano', 'Conferma e attiva'],
 'review_before_approval': ['setDraft(v.draft)', 'onClick={approve}', 'onClick={()=>setDraft(null)}', 'draftRef.current?.scrollIntoView', 'Non salva nulla'],
 'plan_linking': ['evolve-tool-hub', '<details', 'CoachCommitments section="plan"', 'Meal prep e spesa'],
 'today_navigability': ['CoachCommitments section="today"', 'LifeDayClient', 'Come funziona Evolve?', 'concordate con il Coach'],
 'guide': ['quattro passi', 'parti da un problema', 'Quale schermata devo aprire?', 'Diario allenamenti'],
 'profile': ['Diamo a Evolve il tuo punto di partenza', 'Salva profilo', 'evolve-profile-help'],
 'progress_honesty': ['Esercizi guidati completati','diario allenamenti','registri separati'],
};
const fileMap={first_use_coach:coach,review_before_approval:coach,plan_linking:plan,today_navigability:today,guide:guide.toLowerCase(),profile:profile,progress_honesty:progress};
let checked=0;
for(const [name,arr] of Object.entries(cases))for(const text of arr){assert(fileMap[name].toLowerCase().includes(text.toLowerCase()),`${name}: missing ${text}`);checked++}
for(const [r,p] of [['/coach','src/app/(app)/coach/page.tsx'],['/piano','src/app/(app)/piano/page.tsx'],['/giornata','src/app/(app)/giornata/page.tsx'],['/guida','src/app/(app)/guida/page.tsx'],['/profilo','src/app/(app)/profilo/page.tsx'],['/allenamento','src/app/(app)/allenamento/page.tsx'],['/mealprep','src/app/(app)/mealprep/page.tsx']]){assert(existsSync(p),`Missing route ${r}`);checked++}
// 1.4.1: native links need /evolve prefix to avoid RSC prefetch via PHP proxy.
assert(nav.includes('href={publicHref("/guida")}') || nav.includes('href="/guida"'));
assert(nav.includes('aria-current'));
assert(css.includes('@media(max-width:680px)'));
assert(css.includes('.coach-next-step'));
assert(css.includes('.evolve-guide-directory'));
assert(read('next.config.ts').includes("basePath: '/evolve'"));
checked+=6;
console.log(`EVOLVE 1.2 UX: PASS — ${checked} checks for the main journey, links, labels and responsive styles`);
