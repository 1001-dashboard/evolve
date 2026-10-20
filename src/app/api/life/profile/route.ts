import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {serverSupabase} from '@/lib/supabase/server';
const optionalDate=z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/),z.null()]);
const schema=z.object({
  display_name:z.string().trim().max(80),
  birth_date:optionalDate,
  height_cm:z.number().int().min(90).max(250).nullable(),
  weight_kg:z.number().min(25).max(450).nullable(),
  main_goal:z.string().trim().max(320),
  life_areas:z.array(z.enum(['benessere','lavoro','relazioni','crescita'])).min(1).max(4).refine(xs=>new Set(xs).size===xs.length),
  minutes_per_day:z.union([z.literal(5),z.literal(10),z.literal(15),z.literal(20),z.literal(30),z.literal(45),z.literal(60)]),
  preferred_time:z.enum(['mattina','pranzo','sera','flessibile']),
  support_style:z.enum(['pratico','graduale','equilibrato']),
  coach_context_opt_in:z.boolean(),
  morning_anchor:z.string().trim().max(120),
  current_context:z.string().trim().max(500),
});
export async function POST(req:NextRequest){
 const parsed=schema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success) return NextResponse.json({error:'Controlla i valori del profilo.'},{status:400});
 if(parsed.data.birth_date){const d=parsed.data.birth_date; if(Number.isNaN(Date.parse(d+'T00:00:00Z')) || d>new Date().toISOString().slice(0,10)) return NextResponse.json({error:'Data di nascita non valida.'},{status:400});}
 const sb=await serverSupabase();const {data:{user}}=await sb.auth.getUser();
 if(!user) return NextResponse.json({error:'Effettua l’accesso.'},{status:401});
 const {error}=await sb.from('evolve_life_profiles').upsert({...parsed.data,user_id:user.id,updated_at:new Date().toISOString()},{onConflict:'user_id'});
 if(error){
  const missing=error.code==='42P01'||error.code==='PGRST205'||error.code==='PGRST204';
  const message=missing?'La struttura del Profilo non è aggiornata. Controlla la migrazione SQL 202610190003_life_coaching.sql.':
   error.code==='42501'?'Permesso negato da Supabase: verifica le policy RLS del Profilo.':
   'Supabase ha rifiutato il salvataggio del Profilo.';
  return NextResponse.json({error:`${message} Codice: ${error.code||'sconosciuto'}.`},{status:500});
 }
 return NextResponse.json({ok:true});
}
