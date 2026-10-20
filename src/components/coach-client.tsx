'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {ArrowRight,CheckCircle2,MessageCircle,Trash2,WandSparkles} from 'lucide-react';
import {type PlanDraft,type PlanItem,kindLabels,kinds,DAY_NAMES} from '@/lib/coach/plan';

type Message={role:'user'|'assistant';content:string};
const presets=[
 'Ho dubbi sul trasferimento e sul nuovo lavoro: voglio capire cosa verificare e come prepararmi.',
 'Voglio rimettermi in forma, ma faccio fatica a essere costante con allenamento e alimentazione.',
 'Ho troppe cose da gestire: aiutami a scegliere una priorità e una routine sostenibile.',
];
export function CoachClient({initialSessionId,initialMessages}:{initialSessionId?:string;initialMessages:Message[]}){
 const [sessionId,setSessionId]=useState<string|undefined>(initialSessionId),[messages,setMessages]=useState<Message[]>(initialMessages);
 const [input,setInput]=useState(''),[busy,setBusy]=useState(false),[drafting,setDrafting]=useState(false),[saving,setSaving]=useState(false);
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[draftNotice,setDraftNotice]=useState(''),[draft,setDraft]=useState<PlanDraft|null>(null),[approvalToken,setApprovalToken]=useState('');
 const draftRef=useRef<HTMLElement|null>(null);
 useEffect(()=>{if(draft?.summary){const id=requestAnimationFrame(()=>draftRef.current?.scrollIntoView({behavior:'smooth',block:'start'}));return()=>cancelAnimationFrame(id);}},[draft?.summary]);
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
 const stage=notice?3:draft?2:messages.some(m=>m.role==='user')?1:0;
 return <div className="coach-workspace">
  <header className="coach-intro"><p className="eyebrow">EVOLVE · INIZIA QUI</p><h1>Dimmi cosa vuoi cambiare. Ti aiuto a metterlo in pratica.</h1><p>Scrivi il problema con parole tue. Parliamone quanto basta, poi Evolve prepara una proposta da correggere insieme. <strong>Non salva nulla finché non confermi.</strong></p></header>
  <nav className="evolve-steps" aria-label="Come usare il Coach">{[
   ['1','Racconta','Che cosa vuoi affrontare'],['2','Rivedi','Controlla la proposta'],['3','Attiva','Trova le attività in Oggi']
  ].map(([n,name,desc],i)=><div key={n} className={'evolve-step '+(stage===i?'current':stage>i?'passed':'')} aria-current={stage===i?'step':undefined}><span className="evolve-step-number">{stage>i?'✓':n}</span><span><strong>{name}</strong><small>{desc}</small></span></div>)}</nav>
  <div className="coach-layout">
   <section className="panel coach-conversation" aria-label="Conversazione con Evolve">
    <div className="coach-head"><div><h2><MessageCircle size={20}/> 1. Da dove partiamo?</h2><p className="muted text-sm">Scrivi il problema. Non devi compilare un questionario né raccontare tutto: bastano situazione e risultato desiderato.</p></div><button type="button" className="btn-secondary" onClick={()=>{if(draft&&!window.confirm('Hai una proposta non salvata. Vuoi iniziare un altro problema e scartarla?'))return;setSessionId(undefined);setMessages([]);setDraft(null);setApprovalToken('');setNotice('');setDraftNotice('');setError('')}}>Inizia un altro problema</button></div>
    {messages.length===0&&<div className="coach-starters"><p className="font-semibold">Scegli un esempio o scrivi liberamente:</p>{presets.map(x=><button type="button" key={x} onClick={()=>setInput(x)}>{x}<ArrowRight size={15}/></button>)}</div>}
    <div className="coach-message-list" role="log" aria-live="polite">{messages.map((m,i)=><article key={i} className={m.role==='user'?'coach-bubble user':'coach-bubble assistant'}><strong>{m.role==='user'?'Tu':'Coach Evolve'}</strong><p>{m.content||'Sto preparando una risposta…'}</p></article>)}</div>
    {error&&<p className="coach-error" role="alert">{error}</p>}{notice&&<p className="coach-success" role="status"><CheckCircle2 size={17}/>{notice} <Link href="/piano">Apri il piano →</Link></p>}
    <form onSubmit={send} className="coach-write"><label htmlFor="coach-problem">{messages.length?'Scrivi la tua risposta o chiedi una proposta concreta':'Qual è il problema che vuoi risolvere?'}</label><textarea id="coach-problem" className="field" rows={3} maxLength={4000} placeholder="Es. Temo di non riuscire a gestire il nuovo lavoro. Vorrei allenarmi su situazioni concrete e capire se fa per me." value={input} onChange={e=>setInput(e.target.value)}/><div className="coach-write-actions"><span className="muted text-xs">Non serve una conversazione lunga: puoi creare una proposta appena hai spiegato il problema.</span><button className="btn" disabled={busy||!input.trim()} type="submit">{busy?'Attendi…':'Invia'} <ArrowRight size={16}/></button></div></form>
    <div className="coach-next-step" aria-live="polite"><div><strong>2. Passiamo dalle parole ai fatti?</strong><p>{canDraft?'Puoi creare subito una proposta: scegli tu cosa tenere e cosa modificare.':'Dopo il tuo primo messaggio, qui potrai generare una proposta pratica.'}</p></div><button className="btn" type="button" aria-label="Prepara il piano dalla conversazione" onClick={generate} disabled={!canDraft||drafting||saving}><WandSparkles size={17}/>{drafting?'Preparo la proposta…':draft?'Rigenera la proposta':'Crea una proposta di piano'}</button></div>
   </section>
   <aside className="coach-planning">
    <section className="panel coach-plan-guide"><p className="eyebrow">COME FUNZIONA</p><h2>Il Coach serve per decidere cosa fare</h2><ol className="coach-explain"><li>Spieghi un problema: non serve essere preciso.</li><li>Evolve propone pochi passi, con durata e frequenza.</li><li>Tu modifichi e confermi; solo allora le attività entrano in <strong>Oggi</strong> e <strong>Il mio piano</strong>.</li></ol><p className="muted text-xs">Allenamento e alimentazione restano strumenti per registrare le attività: il Coach non sostituisce una valutazione clinica.</p></section>
    {draft&&<section id="evolve-proposta" ref={draftRef} className="panel coach-draft" tabIndex={-1}><p className="eyebrow">PASSO 2 DI 3 · PROPOSTA NON ANCORA SALVATA</p><h2>Ecco il piano. Tieni solo ciò che ti serve.</h2><p className="muted text-sm">{draft.summary}</p>{draftNotice&&<p className="coach-draft-warning" role="status">{draftNotice}</p>}<div className="coach-draft-items">{draft.items.map((item,i)=><article className="coach-draft-item" key={i}><div className="coach-draft-title"><strong>Attività {i+1}</strong><button type="button" title="Rimuovi attività" aria-label={`Rimuovi attività ${i+1}`} onClick={()=>setDraft(p=>p?{...p,items:p.items.filter((_,j)=>j!==i)}:null)}><Trash2 size={16}/></button></div><label>Tipo<select className="field" value={item.kind} onChange={e=>update(i,'kind',e.target.value as PlanItem['kind'])}>{kinds.map(x=><option key={x} value={x}>{kindLabels[x]}</option>)}</select></label><label>Che cosa farò?<input className="field" maxLength={120} value={item.title} onChange={e=>update(i,'title',e.target.value)}/></label><label>Istruzioni pratiche<textarea className="field" rows={3} maxLength={650} value={item.description} onChange={e=>update(i,'description',e.target.value)}/></label><div className="coach-draft-cols"><label>Durata (min)<input className="field" type="number" min="1" max="120" value={item.minutes} onChange={e=>update(i,'minutes',Number(e.target.value))}/></label><label>Frequenza<select className="field" value={item.cadence} onChange={e=>update(i,'cadence',e.target.value as PlanItem['cadence'])}><option value="once">Una volta</option><option value="daily">Ogni giorno</option><option value="weekly">Giorni scelti</option></select></label></div>{item.cadence==='weekly'&&<div><span className="coach-field-label">Giorni della settimana</span><div className="coach-days">{DAY_NAMES.map((d,n)=><button type="button" key={d} className={item.days.includes(n+1)?'on':''} aria-pressed={item.days.includes(n+1)} onClick={()=>update(i,'days',item.days.includes(n+1)?item.days.filter(x=>x!==n+1):[...item.days,n+1].sort())}>{d}</button>)}</div></div>}<label>Quando<select className="field" value={item.time_window} onChange={e=>update(i,'time_window',e.target.value as PlanItem['time_window'])}><option value="mattina">Mattina</option><option value="pranzo">Pausa pranzo</option><option value="sera">Sera</option><option value="flessibile">Flessibile</option></select></label></article>)}</div><div className="coach-approve-intro"><strong>3. Vuoi adottare questa proposta?</strong><p>Premendo Conferma e attiva le attività saranno davvero salvate. Puoi sempre metterle in pausa nel tuo piano.</p></div><div className="coach-approve"><button className="btn" disabled={saving||draft.items.length===0} onClick={approve} type="button"><CheckCircle2 size={17}/>{saving?'Salvataggio…':'Conferma e attiva'}</button><button className="btn-secondary" type="button" onClick={()=>setDraft(null)}>Annulla</button></div><p className="muted text-xs">Le proposte per allenamento e alimentazione sono impegni e indicazioni operative, non prescrizioni sanitarie. I dettagli specialistici restano nei relativi moduli.</p></section>}
    <section className="panel coach-where"><h3 className="font-semibold">Hai già un piano attivo?</h3><p className="muted text-sm">Non devi riscriverlo: puoi vedere le attività concordate, registrare ciò che hai fatto o metterle in pausa.</p><Link href="/giornata" className="life-link">Cosa devo fare oggi? <ArrowRight size={16}/></Link><Link href="/piano" className="life-link">Vedi e gestisci il mio piano <ArrowRight size={16}/></Link></section>
   </aside>
  </div>
  <p className="notice">L'AI propone interventi organizzativi e di benessere non clinici. Non diagnostica né prescrive terapie; per salute, dipendenze e alimentazione clinica serve una valutazione professionale. Sul tier gratuito Gemini verifica le condizioni d'uso dei dati inviati.</p>
 </div>;
}
