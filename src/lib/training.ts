export const ACTIVITIES = ['vogatore','kettlebell','camminata','sacco','corsa','bicicletta','nuoto','palestra','corpo libero','altro'] as const;
export type Activity = typeof ACTIVITIES[number];
export const LABELS:Record<Activity,string>={vogatore:'Vogatore',kettlebell:'Kettlebell',camminata:'Camminata',sacco:'Sacco / boxe',corsa:'Corsa',bicicletta:'Bicicletta',nuoto:'Nuoto',palestra:'Palestra', 'corpo libero':'Corpo libero',altro:'Altro'};
// MET indicative, not individualized measurements. Effort alone is a weak predictor.
const MET:Record<Activity,[number,number,number]>={vogatore:[3.5,5,7],kettlebell:[3.5,6,8],camminata:[2.5,3.5,4.5],sacco:[3.5,5.5,7.5],corsa:[5,7,10],bicicletta:[3.5,5.5,8],nuoto:[4,6,9],palestra:[2.5,4,6], 'corpo libero':[3,5,7],altro:[2.5,4,6]};
export function estimateKcal(activity:Activity,minutes:number,kg:number,effort:number){const range=MET[activity]??MET.altro;const met=range[effort<=3?0:effort<=6?1:2];return Math.round(met*3.5*kg/200*minutes);}
export function trainingSuggestion(activity:Activity,energy:number){
 if(energy<=2)return {title:'Giornata leggera',text:'Se ti senti bene e non hai sintomi o limitazioni, valuta mobilità dolce o una camminata tranquilla; il recupero è una scelta valida.'};
 const d:Record<Activity,string>={vogatore:'Tecnica rilassata, ritmo regolare e pause; verifica postura e respirazione.',kettlebell:'Tecnica prima del carico: esercizi familiari, recupero e movimenti controllati.',camminata:'Passo conversazionale; aumenta prima la regolarità, poi la durata.',sacco:'Round brevi con attenzione alla tecnica, ai polsi e alle pause.',corsa:'Alterna andatura facile e recupero in base alla preparazione.',bicicletta:'Pedalata comoda e continua; progressione graduale.',nuoto:'Vasche tranquille e pause adeguate alla tecnica.',palestra:'Movimenti già conosciuti, carichi gestibili e pause.', 'corpo libero':'Pochi movimenti controllati con tecnica stabile.',altro:'Scegli un’attività già conosciuta a intensità gestibile.'};
 return {title:'Allenamento flessibile',text:d[activity]};
}
