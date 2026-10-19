import Link from 'next/link';
import { ArrowRight, CalendarDays, CheckCircle2, Footprints, Languages, RefreshCw, Target, TrendingUp } from 'lucide-react';
import {loadPrograms} from '@/lib/program-data';
import {exerciseFor,categories} from '@/lib/programs';
import {serverSupabase} from '@/lib/supabase/server';

export default async function Today(){
  const {programs,checkins,day,error}=await loadPrograms();
  const sb=await serverSupabase();
  const {data:{user}}=await sb.auth.getUser();
  const {data:actions}=user?await sb.from('action_items').select('id,title,status').eq('user_id',user.id).order('created_at',{ascending:false}).limit(6):{data:[]};
  const active=programs.filter(p=>p.status==='active');
  const mission=active[0];
  const logs=mission?checkins.filter(c=>c.program_id===mission.id):[];
  const todayLog=logs.find(x=>x.day===day);
  const exercise=mission?exerciseFor(mission,Math.max(0,logs.length-(todayLog?1:0))):null;
  const done=checkins.filter(x=>x.outcome==='done').length;
  const already=active.filter(p=>checkins.some(c=>c.program_id===p.id&&c.day===day)).length;
  return <div className="space-y-6">
    <header className="path-header"><div><p className="eyebrow mb-2">EVOLVE · OGGI</p><h1 className="text-3xl md:text-4xl font-bold">Un passo alla volta.</h1><p className="muted mt-2">Non devi fare tutto oggi. Allenati su una cosa concreta.</p></div><span className="chip"><CalendarDays size={15} className="mr-2"/>{new Date(day+'T12:00:00').toLocaleDateString('it-IT',{day:'numeric',month:'long'})}</span></header>
    {error&&<p className="path-alert">{error}</p>}
    <section className="path-today-hero">
      <div className="relative z-10"><p className="eyebrow mb-3">{mission?'LA TUA MISSIONE DEL GIORNO':'IL TUO PROSSIMO INIZIO'}</p>
        <h2 className="text-3xl font-bold max-w-2xl mb-3">{exercise?.title??'Scegli qualcosa che vuoi cambiare.'}</h2>
        <p className="max-w-2xl mb-6" style={{color:'#44637b'}}>{exercise?.description??'Un obiettivo alla volta, esercizi brevi e continuità. Parti da un percorso guidato, poi Evolve adatta la difficoltà.'}</p>
        <div className="flex flex-wrap items-center gap-3"><Link className="btn" href={mission?'/routine':'/percorsi'}>{todayLog?'Vedi il tuo percorso':mission?'Vai al tuo esercizio':'Crea il tuo primo percorso'} <ArrowRight size={17} className="inline ml-2"/></Link>{mission&&<span className="chip">{todayLog?'Oggi registrato':`${exercise?.minutes} minuti · Livello ${mission.level}/4`}</span>}</div>
      </div><Target className="path-today-mark" size={200} strokeWidth={0.65}/>
    </section>
    <section className="path-summary" aria-label="I tuoi dati"><div className="path-stat"><span>Percorsi attivi</span><strong>{active.length}</strong><small>Un obiettivo alla volta</small></div><div className="path-stat"><span>Esercizi completati</span><strong>{done}</strong><small>Registrazioni effettive</small></div><div className="path-stat"><span>Check-in oggi</span><strong>{already}<small>/{active.length}</small></strong><small>Non serve essere perfetti</small></div></section>
    <div className="grid-two"><section className="panel"><div className="flex items-center justify-between gap-2 mb-4"><h2 className="text-xl font-bold">I tuoi percorsi</h2><Link href="/percorsi" className="text-sm text-teal-700 font-semibold">Gestisci <ArrowRight size={14} className="inline"/></Link></div>{active.slice(0,4).map(p=>{const Icon=p.category==='lingue'?Languages:p.category==='benessere'?Footprints:p.category==='lavoro'?TrendingUp:RefreshCw;return <Link href="/routine" className="path-today-program" key={p.id}><Icon size={19}/><span className="flex-1"><strong>{p.title}</strong><small>{categories.find(x=>x.id===p.category)?.label} · livello {p.level}/4</small></span><ArrowRight size={17}/></Link>})}{active.length===0&&<p className="muted text-sm">Nessun percorso attivo. Puoi iniziare con benessere, lingue, lavoro o un cambiamento importante.</p>}</section>
      <section className="panel"><div className="flex justify-between gap-2 items-center mb-4"><h2 className="text-xl font-bold">Altri strumenti</h2><span className="muted text-xs">Quando ti servono</span></div><Link className="path-today-program" href="/alimentazione"><Footprints size={19}/><span className="flex-1"><strong>Alimentazione</strong><small>Ricette e diario alimentare</small></span><ArrowRight size={17}/></Link><Link className="path-today-program" href="/azioni"><CheckCircle2 size={19}/><span className="flex-1"><strong>Azioni libere</strong><small>{actions?.filter(x=>x.status==='pending').length??0} in sospeso tra le ultime 6</small></span><ArrowRight size={17}/></Link><Link className="path-today-program" href="/diario"><RefreshCw size={19}/><span className="flex-1"><strong>Diario</strong><small>Osservazioni e check-in personali</small></span><ArrowRight size={17}/></Link></section></div>
    <p className="notice">Le attività quotidiane sono suggerimenti da adattare alle tue condizioni. I progressi mostrano azioni registrate, non una valutazione clinica del benessere.</p>
  </div>
}
