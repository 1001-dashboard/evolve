import {z} from 'zod';

export const kinds=['azione','routine','allenamento','alimentazione','percorso','scenario'] as const;
export const kindLabels:Record<(typeof kinds)[number],string>={
 azione:'Azione pratica',routine:'Abitudine e routine',allenamento:'Allenamento',alimentazione:'Alimentazione e meal prep',percorso:'Percorso',scenario:'Scenario se-allora'
};
export const cadenceValues=['once','daily','weekly'] as const;
export const planItemSchema=z.object({
 kind:z.enum(kinds),title:z.string().trim().min(3).max(120),
 description:z.string().trim().min(8).max(650),
 minutes:z.number().int().min(1).max(120),
 cadence:z.enum(cadenceValues),
 days:z.array(z.number().int().min(1).max(7)).max(7).default([]),
 time_window:z.enum(['mattina','pranzo','sera','flessibile']).default('flessibile'),
}).superRefine((v,ctx)=>{
 if(v.cadence==='weekly'&&v.days.length===0)ctx.addIssue({code:'custom',message:'Seleziona almeno un giorno',path:['days']});
 if(new Set(v.days).size!==v.days.length)ctx.addIssue({code:'custom',message:'Giorni duplicati',path:['days']});
});
export const planDraftSchema=z.object({summary:z.string().trim().min(10).max(900),items:z.array(planItemSchema).min(1).max(6)});
export const applySchema=z.object({session_id:z.string().uuid().nullable().optional(),approval_token:z.string().uuid(),items:z.array(planItemSchema).min(1).max(6)});
export type PlanItem=z.infer<typeof planItemSchema>;
export type PlanDraft=z.infer<typeof planDraftSchema>;
export type CoachCommitment=PlanItem&{id:string;status:'active'|'paused'|'completed';created_at:string;};
export type CoachLog={commitment_id:string;day:string;outcome:'done'|'skipped';note:string};
export const DAY_NAMES=['Lu','Ma','Me','Gi','Ve','Sa','Do'];
export {isScheduled} from './schedule';
export function safeGeminiDraft(raw:string):PlanDraft|null{
 try{
  const cleaned=raw.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
  const parsed=planDraftSchema.safeParse(JSON.parse(cleaned));
  return parsed.success?parsed.data:null;
 }catch{return null}
}
