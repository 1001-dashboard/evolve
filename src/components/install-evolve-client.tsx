'use client';
import {useEffect,useState} from 'react';
import {Smartphone,Download,CheckCircle2} from 'lucide-react';
type InstallPrompt=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};
export function InstallEvolveClient(){
 const [prompt,setPrompt]=useState<InstallPrompt|null>(null);
 const [standalone,setStandalone]=useState(false);
 const [notice,setNotice]=useState('');
 useEffect(()=>{
  setStandalone(window.matchMedia('(display-mode: standalone)').matches);
  const event=(e:Event)=>{e.preventDefault();setPrompt(e as InstallPrompt)};
  const installed=()=>{setStandalone(true);setPrompt(null);setNotice('Evolve è stato aggiunto alla schermata Home.');};
  window.addEventListener('beforeinstallprompt',event);
  window.addEventListener('appinstalled',installed);
  return()=>{window.removeEventListener('beforeinstallprompt',event);window.removeEventListener('appinstalled',installed)};
 },[]);
 async function install(){
  if(!prompt)return;
  try{await prompt.prompt();const choice=await prompt.userChoice;setPrompt(null);if(choice.outcome==='accepted')setNotice('Richiesta accettata. Controlla la schermata Home del telefono.');}
  catch{setNotice('Apri il menu ⋮ di Chrome e scegli “Aggiungi a schermata Home”.');}
 }
 return <section className="panel auth-install"><div className="auth-install-title"><Smartphone size={25}/><div><h2>Metti Evolve sul tuo Android</h2><p className="muted">Aprilo dalla schermata Home, come una normale app.</p></div></div>
  {standalone?<p role="status" className="auth-success"><CheckCircle2 size={17}/> Evolve è già aperto in modalità app.</p>:
    prompt?<button type="button" className="btn" onClick={()=>void install()}><Download size={17}/> Installa Evolve</button>:
    <ol className="auth-install-steps"><li>Apri Evolve con <strong>Chrome su Android</strong>.</li><li>Tocca il menu <strong>⋮</strong> in alto a destra.</li><li>Scegli <strong>Installa app</strong> oppure <strong>Aggiungi a schermata Home</strong>.</li></ol>}
  {notice&&<p className="auth-success" role="status">{notice}</p>}
  <p className="muted auth-small">Richiede HTTPS e un browser compatibile. Questa versione non promette funzionamento offline o notifiche push.</p>
 </section>;
}
