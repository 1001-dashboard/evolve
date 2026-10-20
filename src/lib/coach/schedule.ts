/** Weekdays are ISO 1=Monday ... 7=Sunday; date is YYYY-MM-DD. */
export type Frequency={cadence:'once'|'daily'|'weekly';days:number[]};
export function isScheduled(item:Frequency,day:string):boolean{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return false;
 if(item.cadence==='once'||item.cadence==='daily')return true;
 const weekday=new Date(`${day}T12:00:00Z`).getUTCDay();
 return item.days.includes(weekday===0?7:weekday);
}
