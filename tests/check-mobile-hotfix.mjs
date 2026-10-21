import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const read = (p) => readFileSync(resolve(process.cwd(), p), 'utf8');
const css = read('src/app/mobile-fixes.css');
const layout = read('src/app/layout.tsx');
const nav = read('src/components/sidebar-nav.tsx');
const login = read('src/app/login/page.tsx');
const checks = [
  ['CSS patch imported AFTER globals.css', layout.indexOf("'./globals.css'") >= 0 && layout.indexOf("'./mobile-fixes.css'") > layout.indexOf("'./globals.css'")],
  ['Responsive one-column routine', css.includes('.path-content') && css.includes('grid-template-columns: minmax(0, 1fr) !important')],
  ['Phone viewport rule', css.includes('@media (max-width: 780px)')],
  ['Mobile training / meal prep access', nav.includes("'/allenamento'") && nav.includes("'/mealprep'") && nav.includes('mobile-tools-panel')],
  ['Login avoids client RSC navigation after sign-in', login.includes("window.location.replace(BASE_PATH+'/giornata')")],
  ['Segment error recovery', read('src/app/(app)/error.tsx').includes('reset()')],
  ['Root error recovery', read('src/app/global-error.tsx').includes('reset()')],
];
let errors=0;
for(const [label,success] of checks){console.log((success?'OK':'FAIL')+'  '+label);if(!success) errors++;}
if(errors){process.exitCode=1;} else {console.log('MOBILE HOTFIX CHECKS PASSED');}
