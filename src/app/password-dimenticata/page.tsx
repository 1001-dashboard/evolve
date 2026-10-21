'use client';
import {useState} from 'react';
import {browserSupabase} from '@/lib/supabase/browser';
import {BASE_PATH} from '@/lib/config';
export default function PasswordDimenticata(){
 const [email,setEmail]=useState('');const [busy,setBusy]=useState(false);const [sent,setSent]=useState(false);const [error,setError]=useState('');
 async function send(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy)return;setError('');setBusy(true);
  try{
   const redirectTo=window.location.origin+BASE_PATH+'/auth/recupero';
   const {error:authError}=await browserSupabase().auth.resetPasswordForEmail(email.trim(),{redirectTo});
   if(authError){setError(authError.message);return;}
   setSent(true);
  }catch(e){setError(e instanceof Error?e.message:'Impossibile inviare la richiesta.');}
  finally{setBusy(false);}
 }
 return <main className="login-shell"><section className="panel login-card auth-card">
  <p className="eyebrow">EVOLVE · RECUPERO ACCESSO</p><h1 className="text-2xl font-bold mb-3">Reimposta la password</h1>
  {sent?<p className="auth-success" role="status">Se l'indirizzo è associato a un account, riceverai un'email con le istruzioni. Controlla anche Spam.</p>:
   <><p className="muted mb-5">Inserisci l'email con cui hai creato il tuo account. Ti invieremo un link per scegliere una nuova password.</p>
    <form className="grid gap-4" onSubmit={send}>
     <label>Email<input className="field mt-1" type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
     {error&&<p role="alert" className="auth-error">{error}</p>}
     <button type="submit" disabled={busy} className="btn">{busy?'Invio in corso…':'Invia il link'}</button>
    </form></>}
  <div className="auth-links"><a href={BASE_PATH+'/login'}>← Torna all'accesso</a></div>
 </section></main>;
}
