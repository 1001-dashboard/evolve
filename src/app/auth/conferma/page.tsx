'use client';
import {useEffect,useState} from 'react';
import {browserSupabase} from '@/lib/supabase/browser';
import {BASE_PATH} from '@/lib/config';
/** Public-browser origin is retained after crossing the Aruba PHP proxy. */
export default function ConfermaEmail(){
 const [error,setError]=useState('');
 useEffect(()=>{
  let active=true;
  const complete=async()=>{
   try{
    const params=new URLSearchParams(window.location.search);
    if(params.get('error')||params.get('error_description'))throw new Error('Il link di conferma non è valido oppure è scaduto.');
    const sb=browserSupabase();
    const code=params.get('code');
    const tokenHash=params.get('token_hash');
    if(code){
     const {error:exchangeError}=await sb.auth.exchangeCodeForSession(code);
     if(exchangeError){
      // createBrowserClient may have processed the code during initialization.
      const {data:{session}}=await sb.auth.getSession();
      if(!session)throw exchangeError;
     }
    }else if(tokenHash){
     const {error:verifyError}=await sb.auth.verifyOtp({token_hash:tokenHash,type:'signup'});
     if(verifyError)throw verifyError;
    }else{
     // Handles an already processed implicit redirect, without creating a new account.
     const {data:{session}}=await sb.auth.getSession();
     if(!session)throw new Error('Il link non contiene i dati necessari per la conferma.');
    }
    if(active)window.location.replace(BASE_PATH+'/inizia');
   }catch{if(active)setError('Conferma non completata. Il link potrebbe essere scaduto: prova ad accedere o richiedi un nuovo messaggio.');}
  };
  void complete();return()=>{active=false};
 },[]);
 return <main className="login-shell"><section className="panel login-card auth-card">
  <p className="eyebrow">EVOLVE · CONFERMA EMAIL</p><h1 className="text-2xl font-bold mb-3">Conferma del tuo account</h1>
  {error?<><p role="alert" className="auth-error">{error}</p><a className="btn-secondary" href={BASE_PATH+'/login'}>Vai all'accesso</a></>:<p role="status" className="muted">Verifico il collegamento e preparo il tuo primo percorso…</p>}
 </section></main>;
}
