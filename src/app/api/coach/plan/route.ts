import {z} from 'zod';
import {serverSupabase} from '@/lib/supabase/server';
import {applySchema} from '@/lib/coach/plan';
import {romeDay} from '@/lib/programs';

async function auth(){const sb=await serverSupabase();const {data:{user}}=await sb.auth.getUser();return {sb,user};}
function dbError(code:string|undefined){
 if(code==='42P01'||code==='PGRST205'||code==='PGRST204')return 'Tabella del Coach mancante: esegui la migrazione SQL 202610200001_coach_operativo.sql.';
 return `Il piano non è stato salvato su Supabase${code?` (codice ${code})`:''}. Controlla migrazione e autorizzazioni.`;
}
export async function GET(){
 const {sb,user}=await auth();if(!user)return Response.json({error:'Accesso richiesto.'},{status:401});
 const day=romeDay();
 const [{data:items,error:err},{data:logs,error:logErr}]=await Promise.all([
  sb.from('evolve_coach_commitments').select('id,kind,title,description,minutes,cadence,days,time_window,status,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(150),
  sb.from('evolve_coach_logs').select('commitment_id,day,outcome,note').eq('user_id',user.id).order('day',{ascending:false}).limit(400)
 ]);
 if(err||logErr)return Response.json({error:dbError(err?.code||logErr?.code)},{status:500});
 return Response.json({items:items??[],logs:logs??[],day});
}
export async function POST(req:Request){
 const p=applySchema.safeParse(await req.json().catch(()=>null));
 if(!p.success)return Response.json({error:'Controlla tipi, frequenze, giorni e descrizioni del piano.'},{status:400});
 const {sb,user}=await auth();if(!user)return Response.json({error:'Accesso richiesto.'},{status:401});
 if(p.data.session_id){const {data}=await sb.from('coaching_sessions').select('id').eq('id',p.data.session_id).eq('user_id',user.id).maybeSingle();if(!data)return Response.json({error:'Sessione Coach non autorizzata.'},{status:403});}
 const {data:prior,error:priorErr}=await sb.from('evolve_coach_commitments').select('id,title,kind').eq('user_id',user.id).eq('approval_token',p.data.approval_token).order('approval_index');
 if(priorErr)return Response.json({error:dbError(priorErr.code)},{status:500});
 if(prior?.length===p.data.items.length)return Response.json({ok:true,created:prior,already_saved:true},{status:200});
 const pending=p.data.items.length-(prior?.length??0);
 const {count,error:countErr}=await sb.from('evolve_coach_commitments').select('id',{count:'exact',head:true}).eq('user_id',user.id).eq('status','active');
 if(countErr)return Response.json({error:dbError(countErr.code)},{status:500});
 if((count??0)+pending>60)return Response.json({error:'Hai già molti impegni attivi. Metti in pausa quelli non più utili.'},{status:400});
 const rows=p.data.items.map((v,index)=>({user_id:user.id,approval_token:p.data.approval_token,approval_index:index,source_session_id:p.data.session_id??null,kind:v.kind,title:v.title,description:v.description,minutes:v.minutes,cadence:v.cadence,days:v.cadence==='weekly'?v.days:[],time_window:v.time_window,status:'active'}));
 const {error}=await sb.from('evolve_coach_commitments').upsert(rows,{onConflict:'user_id,approval_token,approval_index',ignoreDuplicates:true});
 if(error)return Response.json({error:dbError(error.code)},{status:500});
 const {data, error:readErr}=await sb.from('evolve_coach_commitments').select('id,title,kind').eq('user_id',user.id).eq('approval_token',p.data.approval_token).order('approval_index');
 if(readErr||!data||data.length!==rows.length)return Response.json({error:'Alcune attività potrebbero essere state salvate. Controlla Il mio piano prima di riprovare.'},{status:500});
 return Response.json({ok:true,created:data},{status:201});
}
const change=z.object({id:z.string().uuid(),status:z.enum(['active','paused','completed'])});
export async function PATCH(req:Request){
 const p=change.safeParse(await req.json().catch(()=>null));if(!p.success)return Response.json({error:'Aggiornamento non valido.'},{status:400});
 const {sb,user}=await auth();if(!user)return Response.json({error:'Accedi.'},{status:401});
 const {data,error}=await sb.from('evolve_coach_commitments').update({status:p.data.status,updated_at:new Date().toISOString()}).eq('user_id',user.id).eq('id',p.data.id).select('id,status').maybeSingle();
 if(error||!data)return Response.json({error:'Impossibile aggiornare questo impegno.'},{status:400});
 return Response.json({ok:true,item:data});
}
const progress=z.object({id:z.string().uuid(),outcome:z.enum(['done','skipped']),note:z.string().max(300).default('')});
export async function PUT(req:Request){
 const p=progress.safeParse(await req.json().catch(()=>null));if(!p.success)return Response.json({error:'Esito non valido.'},{status:400});
 const {sb,user}=await auth();if(!user)return Response.json({error:'Accedi.'},{status:401});
 const {data:item}=await sb.from('evolve_coach_commitments').select('id,cadence,status').eq('id',p.data.id).eq('user_id',user.id).maybeSingle();
 if(!item||item.status!=='active')return Response.json({error:'Impegno non disponibile.'},{status:404});
 const {error}=await sb.from('evolve_coach_logs').upsert({user_id:user.id,commitment_id:item.id,day:romeDay(),outcome:p.data.outcome,note:p.data.note.trim()},{onConflict:'user_id,commitment_id,day'});
 if(error)return Response.json({error:dbError(error.code)},{status:500});
 // Once-only actions close after completion. Recording the log remains the source of truth.
 if(item.cadence==='once'&&p.data.outcome==='done')await sb.from('evolve_coach_commitments').update({status:'completed'}).eq('user_id',user.id).eq('id',item.id);
 return Response.json({ok:true});
}
