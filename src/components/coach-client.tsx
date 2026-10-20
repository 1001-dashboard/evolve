'use client';
import {useState} from 'react';
import Link from 'next/link';
import {ArrowRight,CheckCircle2,MessageCircle,Trash2,WandSparkles} from 'lucide-react';
import {type PlanDraft,type PlanItem,kindLabels,kinds,DAY_NAMES} from '@/lib/coach/plan';

type Message={role:'user'|'assistant';content:string};
const presets=[
 'Ho una decisione complicata e non riesco a trasformarla in passi pratici.',
 'Voglio costruire una routine sostenibile per stare meglio fisicamente.',
 'Voglio organizzare allenamenti, alimentazione e lavoro senza sovraccaricarmi.',
];
export function CoachClient({initialSessionId,initialMessages}:{initialSessionId?:string;initialMessages:Message[]}){
 const [sessionId,setSessionId]=useState<string|undefined>(initialSessionId),[messages,setMessages]=useState<Message[]>(initialMessages);
 const [input,setInput]=useState(''),[busy,setBusy]=useState(false),[drafting,setDrafting]=useState(false),[saving,setSaving]=useState(false);
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[draftNotice,setDraftNotice]=useState(''),[draft,setDraft]=useState<PlanDraft|null>(null),[approvalToken,setApprovalToken]=useState('');
 async function send(e:React.FormEvent){
  e.preventDefault();if(busy||!input.trim())return;const m=input.trim();setInput('');setError('');setNotice('');setBusy(true);
  setMessages(p=>[...p,{role:'user',content:m},{role:'assistant',content:''}]);
  try{
   const response=await fetch('/evolve/api/coach',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId,message:m})});
   if(!response.ok){const d=await response.json();throw new Error(d.error||'Il Coach non è disponibile.');}
   const sid=response.headers.get('X-Session-Id');if(sid)setSessionId(sid);
   const reader=response.body?.getReader();if(!reader)throw Error('Risposta non leggibile.');
   const decoder=new TextDecoder();let reply='';
   while(true){const {done,value}=await reader.read();if(done)break;reply+=decoder.decode(value,{stream:true});setMessages(p=>p.map((x,i)=>i===p.length-1?{...x,content:reply}:x));}
   reply+=decoder.decode();setMessages(p=>p.map((x,i)=>i===p.length-1?{...x,content:reply}:x));
  }catch(e){setError(e instanceof Error?e.message:'Problema di connessione');setMessages(p=>p.slice(0,-1));}
  finally{setBusy(false)}
 }
 async function generate(){
  if(!sessionId)return;setDrafting(true);setError('');setNotice('');setDraftNotice('');
  try{
   const r=await fetch('/evolve/api/coach/plan-draft',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id:sessionId})});
   const v=await r.json();if(!r.ok)throw Error(v.error||'Proposta non disponibile');setDraft(v.draft);setDraftNotice(v.source==='rules'?String(v.notice||'Bozza preparata con regole di riserva, non dall’AI.'): '');setApprovalToken(crypto.randomUUID());
  }catch(e){setError(e instanceof Error?e.message:'Errore generazione piano')}finally{setDrafting(false)}
 }
 function update(i:number,key:keyof PlanItem,value:PlanItem[keyof PlanItem]){
  setDraft(p=>p?{...p,items:p.items.map((a,j)=>i===j?{...a,[key]:value}:a)}:p);
 }
 async function approve(){
  if(!draft||saving)return;setSaving(true);setError('');setNotice('');
  try{
   const r=await fetch('/evolve/api/coach/plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id:sessionId??null,approval_token:approvalToken,items:draft.items})});
   const v=await r.json();if(!r.ok)throw Error(v.error||'Il piano non è stato salvato');setNotice(`${v.created.length} attività salvate: le trovi nel Piano, in Oggi e nei moduli collegati.`);setDraft(null);setDraftNotice('');
  }catch(e){setError(e instanceof Error?e.message:'Salvataggio non riuscito')}finally{setSaving(false)}
 }
 const canDraft=Boolean(sessionId&&messages.some(m=>m.role==='user')&&!busy);
 return <div className="coach-workspace">
  <header className="coach-intro"><p className="eyebrow">EVOLVE · COACH OPERATIVO</p><h1>Porta un problema. Costruiamo un piano.</h1><p>Discutiamo poche opzioni, concordiamo cosa fare e trasformiamo le decisioni in attività che Evolve può seguire. Nulla viene programmato senza conferma.</p></header>
  <div className="coach-layout">
   <section className="panel coach-conversation" aria-label="Conversazione con Evolve">
    <div className="coach-head"><div><h2><MessageCircle size={20}/> Il confronto</h2><p className="muted text-sm">Descrivi cosa non funziona, cosa vuoi cambiare e quanto tempo hai.</p></div><button type="button" className="btn-secondary" onClick={()=>{setSessionId(undefined);setMessages([]);setDraft(null);setApprovalToken('');setNotice('');setDraftNotice('');setError('')}}>Nuovo problema</button></div>
    {messages.length===0&&<div className="coach-starters"><p className="font-semibold">Da dove vuoi partire?</p>{presets.map(x=><button type="button" key={x} onClick={()=>setInput(x)}>{x}<ArrowRight size={15}/></button>)}</div>}
    <div className="coach-message-list" role="log" aria-live="polite">{messages.map((m,i)=><article key={i} className={m.role==='user'?'coach-bubble user':'coach-bubble assistant'}><strong>{m.role==='user'?'Tu':'Coach Evolve'}</strong><p>{m.content||'Sto preparando una risposta…'}</p></article>)}</div>
    {error&&<p className="coach-error" role="alert">{error}</p>}{notice&&<p className="coach-success" role="status"><CheckCircle2 size={17}/>{notice} <Link href="/piano">Apri il piano →</Link></p>}
    <form onSubmit={send} className="coach-write"><label htmlFor="coach-problem">Il tuo problema o la tua risposta</label><textarea id="coach-problem" className="field" rows={3} maxLength={4000} placeholder="Es. Ho paura di non essere pronto per il nuovo lavoro, ma posso dedicare 15 minuti ogni mattina…" value={input} onChange={e=>setInput(e.target.value)}/><div className="coach-write-actions"><span className="muted text-xs">Una conversazione concreta, non una seduta terapeutica.</span><button className="btn" disabled={busy||!input.trim()} type="submit">{busy?'Attendi…':'Invia'} <ArrowRight size={16}/></button></div></form>
   </section>
   <aside className="coach-planning">
    <section className="panel coach-plan-guide"><p className="eyebrow">DALLE PAROLE AI FATTI</p><h2>Il piano concordato</h2><p>Quando hai chiarito il problema, genera una bozza. Puoi correggere ogni attività e scegliere i giorni. Evolve salva solo quando premi «Conferma e attiva».</p><button className="btn" type="button" onClick={generate} disabled={!canDraft||drafting||saving}><WandSparkles size={17}/>{drafting?'Preparo la proposta…':draft?'Rigenera proposta':'Prepara il piano'}</button>{!canDraft&&<p className="muted text-xs">Scrivi almeno un messaggio al Coach per attivare la proposta.</p>}</section>
    {draft&&<section className="panel coach-draft"><p className="eyebrow">BOZZA DA APPROVARE</p><h2>Modifica prima di salvare</h2><p className="muted text-sm">{draft.summary}</p>{draftNotice&&<p className="coach-draft-warning" role="status">{draftNotice}</p>}<div className="coach-draft-items">{draft.items.map((item,i)=><article className="coach-draft-item" key={i}><div className="coach-draft-title"><strong>Attività {i+1}</strong><button type="button" title="Rimuovi attività" aria-label={`Rimuovi attività ${i+1}`} onClick={()=>setDraft(p=>p?{...p,items:p.items.filter((_,j)=>j!==i)}:null)}><Trash2 size={16}/></button></div><label>Tipo<select className="field" value={item.kind} onChange={e=>update(i,'kind',e.target.value as PlanItem['kind'])}>{kinds.map(x=><option key={x} value={x}>{kindLabels[x]}</option>)}</select></label><label>Che cosa farò?<input className="field" maxLength={120} value={item.title} onChange={e=>update(i,'title',e.target.value)}/></label><label>Istruzioni pratiche<textarea className="field" rows={3} maxLength={650} value={item.description} onChange={e=>update(i,'description',e.target.value)}/></label><div className="coach-draft-cols"><label>Durata (min)<input className="field" type="number" min="1" max="120" value={item.minutes} onChange={e=>update(i,'minutes',Number(e.target.value))}/></label><label>Frequenza<select className="field" value={item.cadence} onChange={e=>update(i,'cadence',e.target.value as PlanItem['cadence'])}><option value="once">Una volta</option><option value="daily">Ogni giorno</option><option value="weekly">Giorni scelti</option></select></label></div>{item.cadence==='weekly'&&<div><span className="coach-field-label">Giorni della settimana</span><div className="coach-days">{DAY_NAMES.map((d,n)=><button type="button" key={d} className={item.days.includes(n+1)?'on':''} aria-pressed={item.days.includes(n+1)} onClick={()=>update(i,'days',item.days.includes(n+1)?item.days.filter(x=>x!==n+1):[...item.days,n+1].sort())}>{d}</button>)}</div></div>}<label>Quando<select className="field" value={item.time_window} onChange={e=>update(i,'time_window',e.target.value as PlanItem['time_window'])}><option value="mattina">Mattina</option><option value="pranzo">Pausa pranzo</option><option value="sera">Sera</option><option value="flessibile">Flessibile</option></select></label></article>)}</div><div className="coach-approve"><button className="btn" disabled={saving||draft.items.length===0} onClick={approve} type="button"><CheckCircle2 size={17}/>{saving?'Salvataggio…':'Conferma e attiva'}</button><button className="btn-secondary" type="button" onClick={()=>setDraft(null)}>Annulla</button></div><p className="muted text-xs">Le proposte per allenamento e alimentazione sono impegni e indicazioni operative, non prescrizioni sanitarie. I dettagli specialistici restano nei relativi moduli.</p></section>}
    <section className="panel"><h3 className="font-semibold">Dove finiscono le attività?</h3><p className="muted text-sm">Nel Piano e nella giornata. Le proposte di allenamento e alimentazione compaiono anche nelle rispettive sezioni, per registrare sessioni e organizzare pasti.</p><Link href="/piano" className="life-link">Apri il mio piano <ArrowRight size={16}/></Link></section>
   </aside>
  </div>
  <p className="notice">L'AI propone interventi organizzativi e di benessere non clinici. Non diagnostica né prescrive terapie; per salute, dipendenze e alimentazione clinica serve una valutazione professionale. Sul tier gratuito Gemini verifica le condizioni d'uso dei dati inviati.</p>
 </div>;
}
