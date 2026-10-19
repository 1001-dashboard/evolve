"use client";
import { useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, ChefHat, ClipboardList, Loader2, Save } from 'lucide-react';

type Mode='ingredients'|'photo';
const maxBytes=3_500_000;
export function NutritionClient() {
  const router=useRouter();
  const [mode,setMode]=useState<Mode>('ingredients');
  const [ingredients,setIngredients]=useState('');
  const [preferences,setPreferences]=useState('');
  const [details,setDetails]=useState('');
  const [photo,setPhoto]=useState<{data:string;mimeType:'image/jpeg'|'image/png'|'image/webp';name:string}|null>(null);
  const [loading,setLoading]=useState(false);
  const [saving,setSaving]=useState(false);
  const [consent,setConsent]=useState(false);
  const [result,setResult]=useState('');
  const [error,setError]=useState('');
  const [saved,setSaved]=useState(false);
  async function selectPhoto(e:ChangeEvent<HTMLInputElement>) {
    const file=e.target.files?.[0]; setError('');setPhoto(null);
    if(!file) return;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)) {setError('Usa JPEG, PNG o WebP.');return;}
    if(file.size>maxBytes) {setError('Immagine troppo grande (massimo 3,5 MB). Ridimensionala prima.');return;}
    const reader=new FileReader();
    reader.onload=()=>{const text=String(reader.result);const encoded=text.split(',')[1];if(encoded) setPhoto({data:encoded,mimeType:file.type as 'image/jpeg'|'image/png'|'image/webp',name:file.name});};
    reader.onerror=()=>setError('Impossibile leggere la foto.'); reader.readAsDataURL(file);
  }
  async function analyze() {
    setError('');setResult('');setSaved(false);setLoading(true);
    try {
      const payload=mode==='ingredients'?{mode,ingredients,preferences}:{mode,image:photo?.data,mimeType:photo?.mimeType,details};
      const response=await fetch('/evolve/api/nutrition',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const data=await response.json();if(!response.ok) throw new Error(data.error||'Errore durante l’analisi');
      setResult(data.answer);
    } catch(e) {setError(e instanceof Error?e.message:'Analisi non riuscita');}
    finally {setLoading(false);}
  }
  async function save() {
    if(!result)return;
    setSaving(true);setError('');
    try {
      const res=await fetch('/evolve/api/diary',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'nutrition',note:`${mode==='photo'?'Stima indicativa da foto':'Suggerimenti ricette'}\n${result}`.slice(0,2500)})});
      if(!res.ok) throw Error('Non è stato possibile salvare nel diario');setSaved(true);router.refresh();
    }catch(e){setError(e instanceof Error?e.message:'Errore salvataggio');}finally{setSaving(false);}
  }
  return <div className="space-y-6">
    <div><p className="eyebrow mb-2">Evolve · Cura di sé</p><h1 className="text-3xl font-bold">Alimentazione</h1><p className="muted mt-2">Mangiare con più consapevolezza, senza giudizi o calorie inventate.</p></div>
    <div className="nutrition-toggle" role="group" aria-label="Modalità alimentazione"><button className={mode==='ingredients'?'selected':''} onClick={()=>{setMode('ingredients');setResult('');}}><ChefHat size={18}/> Ricette dagli ingredienti</button><button className={mode==='photo'?'selected':''} onClick={()=>{setMode('photo');setResult('');}}><Camera size={18}/> Stima da foto</button></div>
    <div className="grid-two"><section className="panel space-y-4">
      {mode==='ingredients'?<><h2 className="text-xl font-bold">Cosa hai in cucina?</h2><label className="block font-semibold text-sm" htmlFor="ingredienti">Ingredienti disponibili</label><textarea id="ingredienti" className="field min-h-32" placeholder="Es. uova, zucchine, pasta integrale, pomodori, ceci..." value={ingredients} maxLength={1200} onChange={e=>setIngredients(e.target.value)}/><label className="block font-semibold text-sm" htmlFor="preferenze">Preferenze o esigenze (facoltativo)</label><input id="preferenze" className="field" placeholder="Es. 20 minuti, vegetariano, no lattosio" value={preferences} maxLength={350} onChange={e=>setPreferences(e.target.value)}/><p className="muted text-xs">Riceverai tre idee con preparazione e valori energetici indicativi.</p></>
      :<><h2 className="text-xl font-bold">Analizza il tuo pasto</h2><label className="block font-semibold text-sm" htmlFor="foto-pasto">Fotografia del piatto</label><input id="foto-pasto" className="field" type="file" accept="image/png,image/jpeg,image/webp" onChange={selectPhoto}/>{photo&&<p className="chip">Foto selezionata: {photo.name}</p>}<label className="block font-semibold text-sm" htmlFor="dettagli">Aggiungi dettagli (consigliato)</label><textarea id="dettagli" className="field min-h-24" placeholder="Es. 100 g pasta cruda, 1 cucchiaio di olio, porzione singola..." value={details} maxLength={350} onChange={e=>setDetails(e.target.value)}/><p className="notice">Dalla foto non è possibile misurare con precisione calorie, pesi, olio e condimenti. Il risultato sarà un intervallo orientativo.</p></>}
      <label className="flex gap-3 items-start text-sm"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} className="mt-1"/><span>Acconsento a inviare {mode==='photo'?'questa foto e i dettagli':'gli ingredienti e le preferenze'} al provider AI esterno. So che il piano gratuito potrebbe usare gli input per migliorare i propri prodotti. Non inserirò dati clinici o identificativi.</span></label>
      <button className="btn w-full flex justify-center items-center gap-2" disabled={!consent||loading||(mode==='photo'?!photo:ingredients.trim().length<3)} onClick={analyze}>{loading?<Loader2 className="animate-spin" size={17}/>:mode==='photo'?<Camera size={17}/>:<ChefHat size={17}/>} {loading?'Analisi in corso...':mode==='photo'?'Stima indicativa del piatto':'Suggerisci le ricette'}</button>
      {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
    </section><aside className="panel space-y-3"><h2 className="text-xl font-bold">Un approccio equilibrato</h2><p className="muted text-sm">Nessun alimento è un successo o un fallimento. Concentrati su regolarità dei pasti, varietà, praticità e progressi sostenibili.</p><div className="feature-card"><ClipboardList size={22} className="text-teal-700"/><div><strong className="text-sm">Diario collegato</strong><p className="muted text-xs">Decidi tu cosa salvare. Le foto non vengono conservate da Evolve.</p></div></div><p className="notice">Evolve non è un dietista e non produce diete terapeutiche. Se hai patologie, farmaci o disturbi alimentari, consulta un professionista.</p></aside></div>
    {result&&<section className="panel space-y-4" aria-live="polite"><div className="flex gap-3 items-center justify-between flex-wrap"><h2 className="text-xl font-bold">{mode==='photo'?'Analisi orientativa del pasto':'Idee per cucinare'}</h2><button className="btn-secondary inline-flex items-center gap-2" disabled={saving||saved} onClick={save}><Save size={16}/>{saving?'Salvataggio...':saved?'Salvato nel diario':'Salva nel diario'}</button></div><div className="nutrition-result whitespace-pre-wrap">{result}</div>{saved&&<p className="text-teal-700 text-sm font-semibold">Registrazione salvata nel tuo diario.</p>}</section>}
  </div>;
}
