'use client';
import {useEffect,useState} from 'react';
import {browserSupabase} from '@/lib/supabase/browser';
import {BASE_PATH} from '@/lib/config';
export default function RecuperoPassword(){
 const [ready,setReady]=useState(false);const [busy,setBusy]=useState(false);const [done,setDone]=useState(false);
 const [error,setError]=useState('');const [password,setPassword]=useState('');const [confirm,setConfirm]=useState('');
 useEffect(()=>{
  let active=true;
  const verify=async()=>{
   try{
    const params=new URLSearchParams(window.location.search);
    if(params.has('error'))throw Error('Il collegamento è scaduto.');
    const sb=browserSupabase();const code=params.get('code');const tokenHash=params.get('token_hash');
    if(code){
     const {error:exchangeError}=await sb.auth.exchangeCodeForSession(code);
     if(exchangeError){const {data:{session}}=await sb.auth.getSession();if(!session)throw exchangeError;}
    }else if(tokenHash){
     const {error:verifyError}=await sb.auth.verifyOtp({token_hash:tokenHash,type:'recovery'});
     if(verifyError)throw verifyError;
    }else{
     // A recovery link must carry code/token; an unrelated active session is insufficient.
     throw Error('Link di recupero incompleto.');
    }
    const {data:{session}}=await sb.auth.getSession();if(!session)throw Error('Sessione di recupero non valida.');
    if(active)setReady(true);
   }catch{if(active)setError('Link non valido o scaduto. Richiedi un nuovo collegamento di recupero.');}
  };void verify();return()=>{active=false};
 },[]);
 async function changePassword(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy)return;setError('');
  if(password.length<8){setError('La nuova password deve avere almeno 8 caratteri.');return;}
  if(password!==confirm){setError('Le password non coincidono.');return;}
  setBusy(true);
  try{
   const sb=browserSupabase();const {error:updateError}=await sb.auth.updateUser({password});
   if(updateError)throw updateError;
   await sb.auth.signOut();setDone(true);
   // Drop the one-time tokens from the address bar after success.
   window.history.replaceState(null,'',BASE_PATH+'/auth/recupero');
  }catch(e){setError(e instanceof Error?e.message:'Non è stato possibile aggiornare la password.');}
  finally{setBusy(false);}
 }
 return <main className="login-shell"><section className="panel login-card auth-card">
  <p className="eyebrow">EVOLVE · SICUREZZA</p><h1 className="text-2xl font-bold mb-3">Nuova password</h1>
  {error&&<p className="auth-error" role="alert">{error}</p>}
  {done?<><p className="auth-success" role="status">Password aggiornata. Accedi nuovamente con le nuove credenziali.</p><a className="btn" href={BASE_PATH+'/login?password=updated'}>Accedi a Evolve</a></>:
   ready?<form className="grid gap-4" onSubmit={changePassword}>
    <label>Nuova password (almeno 8 caratteri)<input required minLength={8} autoComplete="new-password" type="password" className="field mt-1" value={password} onChange={e=>setPassword(e.target.value)}/></label>
    <label>Conferma password<input required minLength={8} autoComplete="new-password" type="password" className="field mt-1" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>
    <button type="submit" disabled={busy} className="btn">{busy?'Aggiornamento…':'Salva la nuova password'}</button>
   </form>:error?<a className="btn-secondary" href={BASE_PATH+'/password-dimenticata'}>Richiedi un altro link</a>:<p role="status" className="muted">Verifico il link di recupero…</p>}
 </section></main>;
}
