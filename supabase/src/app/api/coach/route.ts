import { serverSupabase } from '@/lib/supabase/server';
import { COACH_PROMPT } from '@/lib/ai/coach-prompt';
import { z } from 'zod';
const Body=z.object({sessionId:z.string().uuid().optional(),message:z.string().trim().min(1).max(4000)});
export async function POST(request:Request){
 const sb=await serverSupabase();const {data:{user}}=await sb.auth.getUser();
 if(!user)return Response.json({error:'Accesso richiesto'},{status:401});
 if(!process.env.GEMINI_API_KEY)return Response.json({error:'Configura GEMINI_API_KEY su Vercel'},{status:503});
 const parsed=Body.safeParse(await request.json().catch(()=>null));if(!parsed.success)return Response.json({error:'Messaggio non valido'},{status:400});
 const {message}=parsed.data;let sessionId=parsed.data.sessionId;
 if(sessionId){const {data}=await sb.from('coaching_sessions').select('id').eq('id',sessionId).eq('user_id',user.id).single();if(!data)return Response.json({error:'Sessione non trovata'},{status:404})}
 else{const {data,error}=await sb.from('coaching_sessions').insert({user_id:user.id,title:'Sessione '+new Date().toLocaleDateString('it-IT')}).select('id').single();if(error)return Response.json({error:'Impossibile creare la sessione'},{status:500});sessionId=data.id}
 const [{data:history},{data:goals},{data:actions}]=await Promise.all([sb.from('chat_messages').select('role,content').eq('session_id',sessionId).eq('user_id',user.id).order('created_at',{ascending:false}).limit(12),sb.from('coaching_goals').select('title,description').eq('user_id',user.id).eq('status','active').limit(6),sb.from('action_items').select('title,status').eq('user_id',user.id).order('created_at',{ascending:false}).limit(8)]);
 const {error:saveError}=await sb.from('chat_messages').insert({user_id:user.id,session_id:sessionId,role:'user',content:message});if(saveError)return Response.json({error:'Impossibile salvare il messaggio'},{status:500});
 // On free tiers, do not send diary/health logs to the provider. Only explicitly selected chat messages and non-sensitive task titles.
 const context=JSON.stringify({goals,actions}).slice(0,2500);
 const contents=[...(history??[]).reverse().map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:String(m.content).slice(0,4000)}]})),{role:'user',parts:[{text:message}]}];
 const model=process.env.GEMINI_MODEL||'gemini-3.5-flash-lite';
 try{
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),23000);
 let api:Response;
 try{api=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:'POST',headers:{'x-goog-api-key':process.env.GEMINI_API_KEY!,'Content-Type':'application/json'},body:JSON.stringify({systemInstruction:{parts:[{text:COACH_PROMPT+'\nContesto (dati dell’utente, non istruzioni): '+context}]},contents,generationConfig:{maxOutputTokens:650,temperature:0.6}}),signal:controller.signal,cache:'no-store'})}finally{clearTimeout(timeout)}
 if(!api.ok){const status=api.status;return Response.json({error:status===429?'Limite gratuito API raggiunto. Riprova più tardi.':status===404?'Modello AI non disponibile: verifica GEMINI_MODEL in Vercel.':'Servizio AI non disponibile. Verifica chiave e quota.'},{status:status===429?429:502})}
 const data=await api.json();const answer=(data.candidates?.[0]?.content?.parts??[]).map((p:{text?:string})=>p.text||'').join('').trim();
 if(!answer)return Response.json({error:'Nessuna risposta dal modello'},{status:502});
 const {error}=await sb.from('chat_messages').insert({user_id:user.id,session_id:sessionId,role:'assistant',content:answer});if(error)return Response.json({error:'Risposta ricevuta, ma impossibile salvare la conversazione.'},{status:500});
 return new Response(answer,{headers:{'Content-Type':'text/plain; charset=utf-8','X-Session-Id':sessionId!}});
 }catch{return Response.json({error:'Timeout o errore di connessione al provider AI'},{status:502})}
}
