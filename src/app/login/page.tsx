'use client';
import {useState} from 'react';
import {browserSupabase} from '@/lib/supabase/browser';
import {BASE_PATH} from '@/lib/config';
/** Full navigation avoids PHP proxy RSC interruptions after authentication. */
export default function Login(){
 const [email,setEmail]=useState(''),[password,setPassword]=useState('');
 const [loading,setLoading]=useState(false),[error,setError]=useState(''),[info,setInfo]=useState('');
 async function submit(mode:'signin'|'signup'){
  if(loading)return;setLoading(true);setError('');setInfo('');
  try{
   const sb=browserSupabase();const result=mode==='signin'?await sb.auth.signInWithPassword({email,password}):await sb.auth.signUp({email,password});
   if(result.error){setError(result.error.message);return}
   if(mode==='signup'&&!result.data.session){setInfo('Controlla la tua email per confermare la registrazione. Dopo l’accesso potrai personalizzare Evolve.');return}
   window.location.replace(BASE_PATH+(mode==='signup'?'/inizia':'/giornata'));
  }catch(e){setError(e instanceof Error?e.message:'Impossibile collegarsi. Riprova.');}finally{setLoading(false)}
 }
 return <main className="login-shell"><div className="panel login-card"><h1 className="text-3xl font-bold mb-2">Evolve</h1><p className="muted mb-7">Entra nel tuo percorso personale. Per un nuovo account potrai scegliere tu obiettivi, abitudini e livello di accompagnamento.</p><form className="grid gap-4" onSubmit={e=>{e.preventDefault();void submit('signin')}}><label>Email<input className="field mt-1" type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input className="field mt-1" type="password" required minLength={6} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p role="alert" className="text-red-700 text-sm">{error}</p>}{info&&<p role="status" className="text-teal-800 text-sm">{info}</p>}<button type="submit" disabled={loading} className="btn">{loading?'Accesso in corso…':'Accedi'}</button><button type="button" disabled={loading} className="btn-secondary" onClick={()=>void submit('signup')}>Crea account</button></form></div></main>;
}
