'use client';
import {useEffect} from 'react';

/** Root-level fallback when an error cannot be caught by a segment boundary. */
export default function GlobalError({error,reset}:{error:Error & {digest?:string};reset:()=>void}){
  useEffect(()=>{console.error('Evolve: errore applicazione',error);},[error]);
  return <html lang="it"><body style={{margin:0,fontFamily:'system-ui,Arial,sans-serif',background:'#f4f8fb',color:'#102d48'}}>
    <main role="alert" style={{margin:'12vh auto',maxWidth:520,padding:24}}>
      <h1>Si è verificato un errore.</h1>
      <p>Riprova a caricare Evolve. I tuoi dati salvati non vengono cancellati da questa operazione.</p>
      <button onClick={()=>reset()} style={{padding:'12px 20px',background:'#087c82',color:'#fff',border:0,borderRadius:10,marginRight:12}}>Riprova</button>
      <a href="/evolve/giornata" style={{color:'#075a68'}}>Torna a Oggi</a>
      <p style={{fontSize:12,color:'#637789',marginTop:20}}>Se l'errore continua, serve il messaggio della console browser per individuare la causa.</p>
    </main>
  </body></html>;
}
