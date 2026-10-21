import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const ts=createRequire(import.meta.url)('typescript');
const get=p=>readFileSync(p,'utf8');
const checks=[];const check=(name,fun)=>{fun();checks.push(name);console.log('OK',name);};
const sourceFiles=[
 'src/app/layout.tsx','src/app/page.tsx','src/app/login/page.tsx',
 'src/app/registrati/page.tsx','src/app/password-dimenticata/page.tsx',
 'src/app/auth/conferma/page.tsx','src/app/auth/recupero/page.tsx',
 'src/app/manifest.ts','src/app/installa/page.tsx','src/components/install-evolve-client.tsx',
 'src/app/(app)/inizia/page.tsx',
];
for(const file of sourceFiles){
 check('TypeScript parse '+file,()=>{
  const f=ts.createSourceFile(file,get(file),ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  assert.equal(f.parseDiagnostics.length,0,f.parseDiagnostics.map(d=>d.messageText).join('; '));
 });
}
check('Registration and sign-in are separate pages',()=>{
 const login=get('src/app/login/page.tsx');
 assert(login.includes("BASE_PATH+'/registrati'"));
 assert(login.includes("BASE_PATH+'/password-dimenticata'"));
 assert(login.includes('signInWithPassword'));
 assert(!login.includes('signUp('));
});
check('Sign-up uses email and explicit password confirmation',()=>{
 const code=get('src/app/registrati/page.tsx');
 assert(code.includes('password!==confirm'));
 assert(code.includes('emailRedirectTo:redirectTo'));
 assert(code.includes("BASE_PATH+'/auth/conferma'"));
 assert(code.includes("mode==='signup'")===false);
});
check('Supabase email confirmation supports PKCE and avoids the Vercel origin',()=>{
 const code=get('src/app/auth/conferma/page.tsx');
 assert(code.includes('exchangeCodeForSession(code)'));
 assert(code.includes("BASE_PATH+'/inizia'"));
 assert(code.includes("verifyOtp({token_hash:tokenHash,type:'signup'})"));
 assert(!code.includes('request.nextUrl.origin'));
});
check('Self-serve reset uses the public recovery route',()=>{
 const request=get('src/app/password-dimenticata/page.tsx');
 const reset=get('src/app/auth/recupero/page.tsx');
 assert(request.includes('resetPasswordForEmail'));
 assert(request.includes("BASE_PATH+'/auth/recupero'"));
 assert(reset.includes('updateUser({password})'));
 assert(reset.includes('await sb.auth.signOut()'));
 assert(reset.includes('if(password!==confirm)'));
});
check('No recovery form without a recovery link and valid session',()=>{
 const code=get('src/app/auth/recupero/page.tsx');
 assert(code.includes('if(code)'));
 assert(code.includes('tokenHash'));
 assert(code.includes('Link di recupero incompleto'));
 assert(code.includes('if(!session)throw'));
});
check('Full-page navigation when crossing the Aruba PHP reverse proxy',()=>{
 for(const file of ['src/app/login/page.tsx','src/app/registrati/page.tsx','src/app/auth/conferma/page.tsx'])
  assert(get(file).includes('window.location.replace(BASE_PATH'));
 assert(!get('src/app/login/page.tsx').includes('router.push('));
});
check('Static manifest has basePath-correct URLs and existing icons',()=>{
 const code=ts.transpileModule(get('src/app/manifest.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const mod={exports:{}};vm.runInNewContext(code,{module:mod,exports:mod.exports});
 const value=mod.exports.default();
 assert.equal(value.scope,'/evolve/');
 assert.equal(value.start_url,'/evolve/giornata');
 assert.equal(value.display,'standalone');
 assert.equal(value.icons.length,2);
 for(const icon of value.icons){assert(icon.src.startsWith('/evolve/brand/'));assert(icon.sizes==='192x192'||icon.sizes==='512x512');}
});
check('No service worker caches or intercepts sensitive sessions',()=>{
 const all=sourceFiles.map(p=>get(p)).join('\n');
 assert(!all.includes('caches.open('));assert(!all.includes('serviceWorker.register('));
});
check('Responsive auth layout',()=>{
 const css=get('src/app/first-experience.css');
 assert(css.includes('@media(max-width:600px)'));
 assert(css.includes('.auth-card'));
});
check('Public landing explains capabilities and autonomy',()=>{
 const code=get('src/app/page.tsx');
 assert(code.includes('progressivamente più autonomo'));
 assert(code.includes('Alimentazione e spesa'));
 assert(code.includes('Allenamento'));
 assert(code.includes('Mindset e coaching'));
});
check('Returning users can keep using the existing onboarding',()=>{
 const code=get('src/app/(app)/inizia/page.tsx');
 assert(code.includes('SmartOnboardingClient'));
 assert(code.includes('installa'));
});
check('No backend migrations required by patch',()=>assert(!existsSync('supabase')));
check('No Next reverse-proxy configuration change',()=>assert(!existsSync('next.config.ts')));
console.log(`EVOLVE 1.5.1: ${checks.length} first-experience checks PASSED`);
