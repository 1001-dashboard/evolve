'use client';
import {useState} from 'react';
import {browserSupabase} from '@/lib/supabase/browser';
import {BASE_PATH} from '@/lib/config';

export default function Registrati(){
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [confirm,setConfirm]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [sent,setSent]=useState(false);const [resent,setResent]=useState(false);
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy)return;setError('');
  if(password.length<8){setError('Scegli una password di almeno 8 caratteri.');return;}
  if(password!==confirm){setError('Le due password non coincidono.');return;}
  setBusy(true);
  try{
   const redirectTo=window.location.origin+BASE_PATH+'/auth/conferma';
   const {data,error:authError}=await browserSupabase().auth.signUp({email:email.trim(),password,options:{emailRedirectTo:redirectTo}});
   if(authError){setError(authError.message);return;}
   if(data.session){window.location.replace(BASE_PATH+'/inizia');return;}
   // Supabase can intentionally conceal whether an account already exists.
   setSent(true);
  }catch(e){setError(e instanceof Error?e.message:'Impossibile completare la richiesta. Riprova.');}
  finally{setBusy(false);}
 }
 async function resend(){
  if(busy||resent)return;setError('');setBusy(true);
  try{
   const redirectTo=window.location.origin+BASE_PATH+'/auth/conferma';
   const {error:authError}=await browserSupabase().auth.resend({type:'signup',email:email.trim(),options:{emailRedirectTo:redirectTo}});
   if(authError)throw authError;setResent(true);
  }catch(e){setError(e instanceof Error?e.message:'Invio non disponibile, riprova più tardi.');}
  finally{setBusy(false);}
 }
 return <main className="login-shell"><div className="panel login-card auth-card">
  <p className="eyebrow">EVOLVE · IL TUO PRIMO PASSO</p>
  {sent?<><h1 className="text-2xl font-bold mb-3">Controlla la tua email.</h1>
   <p className="muted mb-4">Se la richiesta può essere completata, riceverai un messaggio per confermare l'indirizzo. Per la prima conferma usa preferibilmente lo stesso browser in cui ti sei registrato; controlla anche Spam.</p>
   <p className="auth-success" role="status">Dopo la conferma potrai scegliere liberamente obiettivi e livello di supporto.</p>
   {error&&<p className="auth-error" role="alert">{error}</p>}
   {resent?<p className="auth-success">Un altro messaggio è stato richiesto. Attendi qualche minuto.</p>:<button type="button" className="btn-secondary" disabled={busy} onClick={()=>void resend()}>Non è arrivata? Invia di nuovo</button>}
   <a className="btn" href={BASE_PATH+'/login'}>Vai all'accesso</a>
  </>:<><h1 className="text-3xl font-bold mb-2">Inizia da te.</h1>
   <p className="muted mb-5">Crea un account personale. Sceglierai tu cosa migliorare; nessun percorso è imposto e puoi cambiare obiettivo.</p>
   <form className="grid gap-4" onSubmit={submit}>
    <label>Email<input className="field mt-1" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
    <label>Password (almeno 8 caratteri)<input className="field mt-1" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/></label>
    <label>Ripeti la password<input className="field mt-1" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>
    {error&&<p className="auth-error" role="alert">{error}</p>}
    <button className="btn" type="submit" disabled={busy}>{busy?'Creo l’account…':'Crea il mio account'}</button>
   </form>
   <p className="auth-small muted">I dati del tuo percorso sono personali. Evolve aiuta con abitudini e organizzazione, ma non sostituisce medici, psicologi o dietisti.</p>
  </>}
  <div className="auth-links"><a href={BASE_PATH+'/login'}>Hai già un account? Accedi</a></div>
 </div></main>;
}
