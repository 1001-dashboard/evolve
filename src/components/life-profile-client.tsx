'use client';
import {useState} from 'react';
import Link from 'next/link';
import {ArrowRight,CheckCircle2,Clock3,LockKeyhole,Save,UserRound,Target} from 'lucide-react';
import {apiUrl} from '@/lib/config';
import {LIFE_AREAS,type LifeArea,type LifeProfile} from '@/lib/life-engine';
const TIME=[5,10,15,20,30,45,60];
const make=(p:LifeProfile|null)=>({display_name:p?.display_name??'',birth_date:p?.birth_date??'',height_cm:p?.height_cm?.toString()??'',weight_kg:p?.weight_kg?.toString()??'',main_goal:p?.main_goal??'',life_areas:p?.life_areas??['benessere','lavoro'] as LifeArea[],minutes_per_day:p?.minutes_per_day??15,preferred_time:p?.preferred_time??'mattina',support_style:p?.support_style??'pratico',coach_context_opt_in:p?.coach_context_opt_in??false,morning_anchor:p?.morning_anchor??'',current_context:p?.current_context??''});
export function LifeProfileClient({initial,error}:{initial:LifeProfile|null;error:string|null}){
 const [form,setForm]=useState(make(initial)); const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [saved,setSaved]=useState(!!initial);
 const change=(key:string,value:unknown)=>{setForm(old=>({...old,[key]:value}));setSaved(false);setMessage('')};
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage('');try{
  const payload={...form,birth_date:form.birth_date||null,height_cm:form.height_cm?Number(form.height_cm):null,weight_kg:form.weight_kg?Number(form.weight_kg):null};
  const response=await fetch(apiUrl('/api/life/profile'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const result=await response.json();
  if(!response.ok)throw new Error(result.error||'Impossibile salvare il profilo.');setSaved(true);setMessage('Profilo salvato. Il piano quotidiano userà queste preferenze.');
 }catch(e){setMessage(e instanceof Error?e.message:'Salvataggio non riuscito.')}finally{setBusy(false)}}
 return <div className="space-y-5">
  <header className="path-header"><p className="eyebrow mb-2">EVOLVE · IL TUO PUNTO DI PARTENZA</p><h1 className="text-3xl md:text-4xl font-bold">Diamo a Evolve il tuo punto di partenza</h1><p className="muted mt-2">Si configura una volta e puoi aggiornarlo quando cambia qualcosa. Serve a suggerire passi realistici, non a giudicarti. Compila solo ciò che vuoi condividere.</p></header>
  {error&&<p className="path-alert" role="alert">{error}</p>}
  <div className="path-inline-alert" style={{background:'#eef9f8'}}><LockKeyhole size={18}/><span>Le informazioni sul benessere sono facoltative e archiviate nel tuo account Supabase. Solo se lo autorizzi, il Coach AI userà le preferenze generali. I dati fisici e i check-in restano esclusi. Non inserire diagnosi o informazioni sanitarie che non vuoi conservare.</span></div>
  <div className="evolve-profile-help"><strong>Da dove comincio?</strong><span>1. Inserisci le informazioni che vuoi usare · 2. Scegli le aree su cui lavorare · 3. Salva · 4. Apri il Coach e descrivi il primo problema.</span></div>
  <form onSubmit={submit} className="space-y-5">
   <section className="panel"><div className="flex gap-2 items-center mb-4"><UserRound size={22}/><h2 className="text-xl font-bold">1. Conosciamoci</h2></div>
    <div className="life-fields"><label><span>Come vuoi essere chiamato?</span><input className="field" maxLength={80} value={form.display_name} onChange={e=>change('display_name',e.target.value)} placeholder="Nome o soprannome"/></label>
    <label><span>Data di nascita (facoltativa)</span><input type="date" className="field" value={form.birth_date} max={new Date().toISOString().slice(0,10)} onChange={e=>change('birth_date',e.target.value)}/></label>
    <label><span>Altezza in cm (facoltativa)</span><input className="field" type="number" inputMode="numeric" min={90} max={250} value={form.height_cm} onChange={e=>change('height_cm',e.target.value)}/></label>
    <label><span>Peso in kg (facoltativo)</span><input className="field" type="number" inputMode="decimal" step="0.1" min={25} max={450} value={form.weight_kg} onChange={e=>change('weight_kg',e.target.value)}/></label></div>
   </section>
   <section className="panel"><div className="flex gap-2 items-center mb-4"><Target size={22}/><h2 className="text-xl font-bold">2. Che cosa conta adesso?</h2></div>
    <label className="life-wide-label"><span>Il mio obiettivo principale</span><textarea className="field" maxLength={320} rows={2} placeholder="Esempio: diventare più preparato al trasferimento, migliorando anche il benessere quotidiano" value={form.main_goal} onChange={e=>change('main_goal',e.target.value)}/></label>
    <fieldset className="mt-5"><legend className="font-semibold mb-2">Su quali aree vuoi lavorare?</legend><p className="muted text-xs mb-3">Selezionane almeno una. Potrai cambiarle quando vuoi.</p><div className="profile-area-grid">{LIFE_AREAS.map(area=><label className={'profile-area-card '+(form.life_areas.includes(area.id)?'is-selected':'')} key={area.id}><input type="checkbox" checked={form.life_areas.includes(area.id)} onChange={e=>{const next=e.target.checked?[...form.life_areas,area.id]:form.life_areas.filter(x=>x!==area.id);change('life_areas',next)}}/><span className="profile-area-copy"><strong>{area.label}</strong><small>{area.description}</small></span></label>)}</div></fieldset>
    <label className="life-wide-label mt-5"><span>Il contesto di oggi (facoltativo)</span><textarea rows={3} className="field" maxLength={500} value={form.current_context} onChange={e=>change('current_context',e.target.value)} placeholder="Esempio: nuovo lavoro in vista, periodo impegnativo, trasferimento possibile. Solo ciò che desideri condividere."/></label>
   </section>
   <section className="panel"><div className="flex gap-2 items-center mb-4"><Clock3 size={22}/><h2 className="text-xl font-bold">3. Come rendiamo il piano sostenibile?</h2></div><div className="life-fields">
    <label><span>Tempo quotidiano disponibile</span><select className="field" value={form.minutes_per_day} onChange={e=>change('minutes_per_day',Number(e.target.value))}>{TIME.map(n=><option key={n} value={n}>{n} minuti</option>)}</select></label>
    <label><span>Momento preferito</span><select className="field" value={form.preferred_time} onChange={e=>change('preferred_time',e.target.value)}><option value="mattina">Mattina</option><option value="pranzo">Pausa pranzo</option><option value="sera">Sera</option><option value="flessibile">Quando possibile</option></select></label>
    <label><span>Stile di accompagnamento</span><select className="field" value={form.support_style} onChange={e=>change('support_style',e.target.value)}><option value="pratico">Diretto e concreto</option><option value="graduale">Molto graduale</option><option value="equilibrato">Equilibrato</option></select></label>
    <label><span>A quale abitudine agganciare il primo passo?</span><input className="field" maxLength={120} placeholder="Esempio: il caffè delle 7" value={form.morning_anchor} onChange={e=>change('morning_anchor',e.target.value)}/></label></div>
    <div className="life-privacy-switch"><label><input type="checkbox" checked={form.coach_context_opt_in} onChange={e=>change('coach_context_opt_in',e.target.checked)}/><span><strong>Permetto al Coach AI di usare obiettivo e preferenze generali</strong><small>Facoltativo, disattivato inizialmente. Se lo attivi, Evolve può inviare al provider AI obiettivo, aree selezionate, tempo, stile e ancoraggio della routine. Mai automaticamente peso, nascita, check-in o note sul contesto personale.</small></span></label></div>
   </section>
   {message&&<div role="status" className="path-inline-alert">{saved&&<CheckCircle2 size={18}/>}<span>{message}</span></div>}
   <div className="flex gap-3 items-center flex-wrap"><button disabled={busy||form.life_areas.length===0} className="btn" type="submit"><Save size={17} className="inline mr-2"/>{busy?'Salvataggio…':'Salva profilo'}</button>{saved&&<Link href="/oggi" className="btn-secondary">Vai al piano di oggi <ArrowRight size={16} className="inline ml-1"/></Link>}</div>
  </form>
 </div>;
}
