'use client';
import {useEffect} from 'react';
import {BASE_PATH} from '@/lib/config';

/** Segment-level recovery UI for recoverable client-rendering failures. */
export default function AppError({error,reset}:{error:Error & {digest?:string};reset:()=>void}){
  useEffect(()=>{console.error('Evolve: errore di caricamento schermata',error);},[error]);
  return <main role="alert" className="panel" style={{maxWidth:680,margin:'32px auto',padding:24}}>
    <h1 className="text-2xl font-bold mb-3">Questa schermata non si è caricata.</h1>
    <p className="muted mb-5">Non significa che hai perso i dati. Puoi riprovare o tornare alla giornata.</p>
    <div className="flex flex-wrap gap-3">
      <button type="button" className="btn" onClick={()=>reset()}>Riprova</button>
      <a className="btn-secondary" href={BASE_PATH+'/giornata'}>Torna a Oggi</a>
    </div>
    <p className="muted text-xs mt-5">Se continua, aggiorna la pagina e invia uno screenshot dell'errore con l'indirizzo della schermata.</p>
  </main>;
}
