import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {serverSupabase} from '@/lib/supabase/server';
import {periodStart, type PlanProfile} from '@/lib/personal-plan';
import {romeDay} from '@/lib/programs';

const schema=z.object({programId:z.string().uuid(),confidence:z.number().int().min(1).max(5),
  win:z.string().trim().max(320).default(''),obstacle:z.string().trim().max(320).default(''),adjustment:z.string().trim().max(320).default('')});

export async function POST(req:NextRequest){
  const parsed=schema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success) return NextResponse.json({error:'Dati revisione non validi.'},{status:400});
  const sb=await serverSupabase();
  const {data:{user}}=await sb.auth.getUser();
  if(!user) return NextResponse.json({error:'Effettua l’accesso.'},{status:401});
  const p=parsed.data;
  const {data:profile}=await sb.from('evolve_plan_profiles').select('starts_on').eq('user_id',user.id).eq('program_id',p.programId).maybeSingle();
  if(!profile) return NextResponse.json({error:'Crea prima il piano personale.'},{status:404});
  const {error}=await sb.from('evolve_plan_reviews').upsert({program_id:p.programId,user_id:user.id,
    period_start:periodStart(profile as PlanProfile,romeDay()),confidence:p.confidence,
    win:p.win||null,obstacle:p.obstacle||null,adjustment:p.adjustment||null,
    updated_at:new Date().toISOString(),
  },{onConflict:'program_id,period_start'});
  if(error) return NextResponse.json({error:'Non riesco a registrare la revisione.'},{status:500});
  return NextResponse.json({ok:true});
}
