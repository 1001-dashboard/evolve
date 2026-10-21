'use client';
import {useEffect,useState} from 'react';
import {browserSupabase} from '@/lib/supabase/browser';
import {BASE_PATH} from '@/lib/config';
/** Full navigation is intentional: Aruba PHP proxy can interrupt Next RSC navigation. */
export default function Login(){
 const [email,setEmail]=useState('');const [password,setPassword]=useState('');
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');
 useEffect(()=>{if(new URLSearchParams(window.location.search).get('password')==='updated')setNotice('Password aggiornata. Puoi accedere con la nuova password.');},[]);
 async function login(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy)return;setError('');setBusy(true);
  try{
   const {error:authError}=await browserSupabase().auth.signInWithPassword({email:email.trim(),password});
   if(authError){setError(authError.message.toLowerCase().includes('email not confirmed')?'Devi confermare la tua email prima di accedere. Controlla anche Spam.':authError.message.toLowerCase().includes('invalid login')?'Email o password non corretti.':authError.message);return;}
   window.location.replace(BASE_PATH+'/giornata');
  }catch(e){setError(e instanceof Error?e.message:'Connessione non disponibile. Riprova.');}
  finally{setBusy(false);}
 }
 return <main className="login-shell"><div className="panel login-card auth-card">
  <p className="eyebrow">EVOLVE · ACCEDI</p><h1 className="text-3xl font-bold mb-2">Bentornato.</h1>
  <p className="muted mb-6">Riprendi il tuo percorso da dove lo hai lasciato. Il tuo piano e il diario restano nel tuo account.</p>
  <form className="grid gap-4" onSubmit={login}>
   <label>Email<input className="field mt-1" type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
   <label>Password<input className="field mt-1" type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>
   {error&&<p role="alert" className="auth-error">{error}</p>}{notice&&<p role="status" className="auth-success">{notice}</p>}
   <button type="submit" className="btn" disabled={busy}>{busy?'Accesso in corso…':'Accedi'}</button>
  </form>
  <div className="auth-links"><a href={BASE_PATH+'/password-dimenticata'}>Password dimenticata?</a><a href={BASE_PATH+'/registrati'}>Crea un account</a></div>
  <p className="muted auth-small">Non hai ancora iniziato? Il nuovo percorso ti guida nella scelta degli obiettivi.</p>
  <a href={BASE_PATH+'/'} className="auth-back">← Scopri Evolve</a>
 </div></main>;
}
