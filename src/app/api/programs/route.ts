import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { serverSupabase } from '@/lib/supabase/server';

const createSchema = z.object({
  category: z.enum(['benessere','alcol','lingue','lavoro','cambiamento','altro']),
  title: z.string().trim().min(3).max(120),
  objective: z.string().trim().max(500).optional(),
});
const changeSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['active','paused','completed']),
});

export async function POST(req: NextRequest) {
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({error:'Controlla obiettivo e tipologia.'},{status:400});
  const sb = await serverSupabase();
  const {data:{user}} = await sb.auth.getUser();
  if (!user) return NextResponse.json({error:'Effettua l’accesso.'},{status:401});
  const {category,title,objective} = parsed.data;
  const {data:existing} = await sb.from('evolve_programs').select('id').eq('user_id',user.id).eq('status','active').limit(8);
  if ((existing?.length ?? 0) >= 6) return NextResponse.json({error:'Hai già sei percorsi attivi. Consolidane uno prima di aggiungerne altri.'},{status:400});
  const {data,error} = await sb.from('evolve_programs').insert({user_id:user.id,category,title,objective:objective || null}).select('id').single();
  if (error) return NextResponse.json({error:'Impossibile creare il percorso. Verifica di aver eseguito la migrazione SQL 202610190001.'},{status:500});
  return NextResponse.json({id:data.id},{status:201});
}

export async function PATCH(req: NextRequest) {
  const parsed = changeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({error:'Dati non validi.'},{status:400});
  const sb = await serverSupabase();
  const {data:{user}} = await sb.auth.getUser();
  if (!user) return NextResponse.json({error:'Effettua l’accesso.'},{status:401});
  const {data,error} = await sb.from('evolve_programs').update({status:parsed.data.status,updated_at:new Date().toISOString()}).eq('id',parsed.data.id).eq('user_id',user.id).select('id').single();
  if (error || !data) return NextResponse.json({error:'Percorso non trovato o aggiornamento non riuscito.'},{status:404});
  return NextResponse.json({ok:true});
}
