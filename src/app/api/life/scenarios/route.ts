import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {serverSupabase} from '@/lib/supabase/server';
const fields=z.object({
 title:z.string().trim().min(3).max(100),context:z.enum(['lavoro','casa','relazioni','benessere','altro']),
 trigger_text:z.string().trim().min(5).max(280),response_text:z.string().trim().min(5).max(500),
 small_step:z.string().trim().min(5).max(280),fallback_text:z.string().trim().max(280)
});
const id=z.object({id:z.string().uuid()});
async function auth(){const sb=await serverSupabase();const {data:{user}}=await sb.auth.getUser();return {sb,user};}
export async function POST(req:NextRequest){
 const p=fields.safeParse(await req.json().catch(()=>null));
 if(!p.success) return NextResponse.json({error:'Completa situazione, risposta e primo passo.'},{status:400});
 const {sb,user}=await auth();if(!user) return NextResponse.json({error:'Accesso richiesto.'},{status:401});
 const {count}=await sb.from('evolve_scenarios').select('id',{count:'exact',head:true}).eq('user_id',user.id);
 if((count??0)>=60) return NextResponse.json({error:'Hai raggiunto il massimo di 60 scenari.'},{status:400});
 const {error}=await sb.from('evolve_scenarios').insert({...p.data,user_id:user.id});
 return error?NextResponse.json({error:'Non riesco a salvare lo scenario. Verifica la migrazione SQL v0.7.'},{status:500}):NextResponse.json({ok:true});
}
export async function PATCH(req:NextRequest){
 const parsed=z.union([id.extend({active:z.boolean()}),fields.extend({id:z.string().uuid()})]).safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:'Modifica non valida.'},{status:400});
 const {sb,user}=await auth();if(!user)return NextResponse.json({error:'Accesso richiesto.'},{status:401});
 const {id:scenarioId,...change}=parsed.data;
 const {data,error}=await sb.from('evolve_scenarios').update({...change,updated_at:new Date().toISOString()}).eq('id',scenarioId).eq('user_id',user.id).select('id');
 if(error)return NextResponse.json({error:'Salvataggio non riuscito.'},{status:500});
 if(!data?.length)return NextResponse.json({error:'Scenario non trovato.'},{status:404});
 return NextResponse.json({ok:true});
}
export async function DELETE(req:NextRequest){
 const p=id.safeParse(await req.json().catch(()=>null));if(!p.success)return NextResponse.json({error:'Richiesta non valida.'},{status:400});
 const {sb,user}=await auth();if(!user)return NextResponse.json({error:'Accesso richiesto.'},{status:401});
 const {data,error}=await sb.from('evolve_scenarios').delete().eq('id',p.data.id).eq('user_id',user.id).select('id');
 if(error)return NextResponse.json({error:'Eliminazione non riuscita.'},{status:500});
 if(!data?.length)return NextResponse.json({error:'Scenario non trovato.'},{status:404});
 return NextResponse.json({ok:true});
}
