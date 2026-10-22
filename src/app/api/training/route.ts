import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {serverSupabase} from '@/lib/supabase/server';
import {ACTIVITIES,estimateKcal} from '@/lib/training';

/** Both creation and editing have the same constraints. The original diary is the source of truth. */
const fields=z.object({
 activity:z.enum(ACTIVITIES),
 occurred_at:z.string().datetime({offset:true}).optional(),
 duration_minutes:z.number().min(1).max(600),
 effort:z.number().int().min(1).max(10),
 distance_m:z.number().min(0).max(200000).nullable().optional(),
 strokes:z.number().int().min(0).max(100000).nullable().optional(),
 cadence_spm:z.number().min(0).max(120).nullable().optional(),
 machine_kcal:z.number().min(0).max(10000).nullable().optional(),
 weight_kg:z.number().min(25).max(350).nullable().optional(),
 notes:z.string().max(1000).default(''),
 details:z.record(z.string(),z.union([z.string(),z.number()])).default({})
});
const editSchema=fields.extend({id:z.string().uuid(),occurred_at:z.string().datetime({offset:true})});
const deleteSchema=z.object({id:z.string().uuid()});

async function auth(){const sb=await serverSupabase();const {data:{user}}=await sb.auth.getUser();return {sb,user};}
function validTime(value?:string){
 if(!value)return true;
 const stamp=Date.parse(value);
 return Number.isFinite(stamp)&&stamp<=Date.now()+60000;
}
function fieldsForDb(d:z.infer<typeof fields>){
 return {
  activity:d.activity,duration_minutes:d.duration_minutes,effort:d.effort,
  distance_m:d.distance_m??null,
  strokes:d.activity==='vogatore'?d.strokes??null:null,
  cadence_spm:d.activity==='vogatore'?d.cadence_spm??null:null,
  machine_kcal:d.machine_kcal??null,notes:d.notes
 };
}

export async function GET(){
 const {sb,user}=await auth();
 if(!user)return NextResponse.json({error:'Accedi'},{status:401});
 const {data,error}=await sb.from('evolve_workouts').select('*').eq('user_id',user.id)
  .order('occurred_at',{ascending:false}).limit(200);
 return error?NextResponse.json({error:'Registro non disponibile. Verifica la migrazione SQL.'},{status:500})
  :NextResponse.json({items:data??[]},{headers:{'Cache-Control':'private, no-store'}});
}

export async function POST(req:NextRequest){
 const parsed=fields.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:'Controlla i dati della sessione.'},{status:400});
 const d=parsed.data;
 if(!validTime(d.occurred_at))return NextResponse.json({error:'Data allenamento non valida o futura.'},{status:400});
 const {sb,user}=await auth();if(!user)return NextResponse.json({error:'Accedi'},{status:401});
 const kcal=d.weight_kg!=null?estimateKcal(d.activity,d.duration_minutes,d.weight_kg,d.effort):null;
 const {data,error}=await sb.from('evolve_workouts').insert({
  user_id:user.id,...fieldsForDb(d),...(d.occurred_at?{occurred_at:d.occurred_at}:{}),
  estimated_kcal:kcal,details:d.details
 }).select('*').single();
 return error?NextResponse.json({error:'Salvataggio fallito. Verifica le autorizzazioni.'},{status:500})
  :NextResponse.json({item:data},{status:201,headers:{'Cache-Control':'private, no-store'}});
}

/** Update only a workout belonging to the authenticated account. ID cannot be changed. */
export async function PATCH(req:NextRequest){
 const parsed=editSchema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:'Dati di modifica non validi.'},{status:400});
 const d=parsed.data;
 if(!validTime(d.occurred_at))return NextResponse.json({error:'Non puoi inserire una data futura.'},{status:400});
 const {sb,user}=await auth();if(!user)return NextResponse.json({error:'Accedi'},{status:401});
 const {data:previous,error:readError}=await sb.from('evolve_workouts')
  .select('id,activity,duration_minutes,effort,estimated_kcal')
  .eq('id',d.id).eq('user_id',user.id).maybeSingle();
 if(readError)return NextResponse.json({error:'Impossibile leggere questa sessione.'},{status:500});
 if(!previous)return NextResponse.json({error:'Sessione non trovata nel tuo diario.'},{status:404});
 const changedEffortOrDuration=previous.activity!==d.activity||Number(previous.duration_minutes)!==d.duration_minutes||previous.effort!==d.effort;
 // Weight used for old estimates wasn't retained. Never keep an old calorie estimate after changing its underlying inputs.
 const estimated_kcal=d.weight_kg!=null?estimateKcal(d.activity,d.duration_minutes,d.weight_kg,d.effort)
  :changedEffortOrDuration?null:previous.estimated_kcal;
 const {data:updated,error}=await sb.from('evolve_workouts')
  .update({...fieldsForDb(d),occurred_at:d.occurred_at,estimated_kcal})
  .eq('id',d.id).eq('user_id',user.id).select('*').maybeSingle();
 if(error)return NextResponse.json({error:'Modifica non riuscita. Controlla anche la migrazione 202610220003_workout_edit_delete.sql.'},{status:500});
 if(!updated)return NextResponse.json({error:'Sessione non più presente. Aggiorna il diario.'},{status:404});
 return NextResponse.json({item:updated,message:'Allenamento aggiornato.'},{headers:{'Cache-Control':'private, no-store'}});
}

/** DB trigger removes only workout evidence links, NOT approved Coach commitments or their outcomes. */
export async function DELETE(req:NextRequest){
 const parsed=deleteSchema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:'Sessione non valida.'},{status:400});
 const {sb,user}=await auth();if(!user)return NextResponse.json({error:'Accedi'},{status:401});
 const {data:removed,error}=await sb.from('evolve_workouts').delete()
  .eq('id',parsed.data.id).eq('user_id',user.id).select('id').maybeSingle();
 if(error)return NextResponse.json({error:'Eliminazione non riuscita. Verifica la migrazione 202610220003_workout_edit_delete.sql.'},{status:500});
 if(!removed)return NextResponse.json({error:'Allenamento non trovato nel tuo diario.'},{status:404});
 return NextResponse.json({ok:true,id:removed.id},{headers:{'Cache-Control':'private, no-store'}});
}
