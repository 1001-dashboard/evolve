/** Evolve 1.9.5 — factual weight trend and screening context, not an ideal-weight prescription. */
export type WeightPoint={day:string;weight_kg:number};
export type Baseline={
 today:string;birth_date:string|null;height_cm:number|null;profile_weight_kg:number|null;
 entries:WeightPoint[];notices:string[];
};
export type BaselineFacts={
 age:number|null;latestWeight:number|null;latestDay:string|null;bmi:number|null;
 bmiCategory:string|null;firstWeight:number|null;netChangeKg:number|null;
 hasProfile:boolean;nextWeighIn:boolean;daysSinceWeighIn:number|null;
};
export function ageAt(birth:string|null,day:string):number|null{
 if(!birth||!/^\d{4}-\d{2}-\d{2}$/.test(birth)||!/^\d{4}-\d{2}-\d{2}$/.test(day))return null;
 const b=new Date(birth+'T12:00:00Z'),now=new Date(day+'T12:00:00Z');
 if(!Number.isFinite(b.getTime())||!Number.isFinite(now.getTime())||b.toISOString().slice(0,10)!==birth||birth>day)return null;
 let age=now.getUTCFullYear()-b.getUTCFullYear();
 if(day.slice(5)<birth.slice(5))age--;
 return age>=18&&age<=110?age:null;
}
export function bmiCategory(bmi:number):string{
 if(bmi<18.5)return 'Sottopeso (classificazione BMI)';
 if(bmi<25)return 'Intervallo BMI standard';
 if(bmi<30)return 'Sovrappeso (classificazione BMI)';
 return 'Obesità (classificazione BMI)';
}
export function baselineFacts(input:Baseline):BaselineFacts{
 const weights=input.entries.filter(e=>/^\d{4}-\d{2}-\d{2}$/.test(e.day)&&Number.isFinite(e.weight_kg)&&e.weight_kg>=25&&e.weight_kg<=450)
  .sort((a,b)=>a.day.localeCompare(b.day));
 const last=weights[weights.length-1];const first=weights[0];
 const fallback=input.profile_weight_kg!=null&&Number.isFinite(input.profile_weight_kg)&&input.profile_weight_kg>=25&&input.profile_weight_kg<=450?input.profile_weight_kg:null;
 const latestWeight=last?.weight_kg??fallback;
 const h=input.height_cm;
 const bmi=latestWeight!=null&&h!=null&&h>=90&&h<=250?Math.round(latestWeight/Math.pow(h/100,2)*10)/10:null;
 const delta=last&&first&&last.day!==first.day?Math.round((last.weight_kg-first.weight_kg)*10)/10:null;
 const now=new Date(input.today+'T12:00:00Z').getTime(),old=last?new Date(last.day+'T12:00:00Z').getTime():NaN;
 const daysSinceWeighIn=last&&Number.isFinite(now)&&Number.isFinite(old)?Math.max(0,Math.floor((now-old)/86400000)):null;
 return {age:ageAt(input.birth_date,input.today),latestWeight,latestDay:last?.day??null,bmi,
  bmiCategory:bmi==null?null:bmiCategory(bmi),firstWeight:first?.weight_kg??null,netChangeKg:delta,
  hasProfile:Boolean(h&&ageAt(input.birth_date,input.today)!=null),
  nextWeighIn:daysSinceWeighIn===null||daysSinceWeighIn>=7,daysSinceWeighIn};
}
/** Accessible static sparkline; no automatic 'good' or 'bad' labeling for changes. */
export function weightLine(entries:WeightPoint[],width=300,height=110):{points:string;dots:{x:number;y:number;label:string}[]}|null{
 const rows=entries.filter(x=>Number.isFinite(x.weight_kg)&&x.weight_kg>=25&&x.weight_kg<=450).sort((a,b)=>a.day.localeCompare(b.day));
 if(rows.length<2)return null;
 const values=rows.map(x=>x.weight_kg),min=Math.min(...values),max=Math.max(...values);
 const pad=16,spread=Math.max(1,max-min), usableX=width-pad*2,usableY=height-pad*2;
 const dots=rows.map((p,i)=>({x:pad+(i/(rows.length-1))*usableX,y:pad+((max-p.weight_kg)/spread)*usableY,label:`${p.day}: ${p.weight_kg} kg`}));
 return {points:dots.map(x=>`${x.x.toFixed(1)},${x.y.toFixed(1)}`).join(' '),dots};
}
