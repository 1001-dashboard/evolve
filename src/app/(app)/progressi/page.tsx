import {serverSupabase} from '@/lib/supabase/server';
import {loadPrograms} from '@/lib/program-data';
import Link from 'next/link';
import {ArrowRight,CheckCircle2,Target} from 'lucide-react';
export default async function Progressi(){
  const sb=await serverSupabase();
  const {data:{user}}=await sb.auth.getUser();
  const [{data:actions},{data:entries}]=await Promise.all([
    sb.from('action_items').select('status').eq('user_id',user!.id),
    sb.from('diary_entries').select('kind,created_at').eq('user_id',user!.id),
  ]);
  const {programs,checkins,error}=await loadPrograms();
  const done=checkins.filter(x=>x.outcome==='done').length;
  const hard=checkins.filter(x=>x.outcome==='difficult').length;
  const tracked=checkins.length;
  const completedActions=(actions??[]).filter(x=>x.status==='completed').length;
  const totalActions=actions?.length??0;
  return <div className="space-y-6"><div><p className="eyebrow mb-2">DATI OSSERVABILI</p><h1 className="text-3xl font-bold">I tuoi progressi</h1><p className="muted mt-2">Conta ciò che pratichi e scopri quali esercizi ti risultano più accessibili.</p></div>
  {error&&<div className="path-alert">{error}</div>}
  <div className="path-summary"><div className="path-stat"><span>Percorsi creati</span><strong>{programs.length}</strong><small>{programs.filter(p=>p.status==='active').length} attivi</small></div><div className="path-stat"><span>Allenamenti completati</span><strong>{done}</strong><small>Confermati da te</small></div><div className="path-stat"><span>Da adattare</span><strong>{hard}</strong><small>Esercizi segnalati difficili</small></div></div>
  <section className="panel"><div className="flex justify-between items-center gap-3 flex-wrap mb-5"><h2 className="text-xl font-bold">Allenamenti registrati</h2><span className="chip"><Target size={14} className="mr-2"/>{tracked} check-in totali</span></div><div className="h-3 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-teal-500" style={{width:tracked?Math.round(done/tracked*100)+'%':'0%'}}/></div><p className="muted text-sm mt-3">{tracked?`${done} esercizi completati su ${tracked} check-in; ${hard} giudicati troppo difficili.`:'Inizia un percorso per vedere qui i tuoi risultati.'} I check-in descrivono l’attività svolta, non il tuo valore personale.</p><Link href="/routine" className="btn inline-block mt-5">Vai all’allenamento <ArrowRight size={16} className="inline ml-1"/></Link></section>
  <div className="grid-two"><section className="panel"><h2 className="font-bold text-lg mb-4">Azioni e diario</h2><div className="flex flex-wrap gap-2"><span className="chip"><CheckCircle2 size={14} className="mr-2"/>{completedActions}/{totalActions} azioni completate</span><span className="chip">{entries?.length??0} voci diario</span></div><p className="muted text-sm mt-4">I dati di azioni e diario precedenti restano disponibili.</p></section><section className="panel"><h2 className="font-bold text-lg mb-3">Ricorda</h2><p className="muted text-sm leading-relaxed">L’andamento non deve essere perfettamente crescente. Quando un esercizio è difficile, Evolve può semplificarlo. I dati registrati non sostituiscono valutazioni mediche o psicologiche.</p></section></div></div>
}
