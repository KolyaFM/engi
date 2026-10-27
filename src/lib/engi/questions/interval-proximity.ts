import {MIN_YEAR_INDEX} from '../historical-date';
import type {DateInterval} from './date-interval';

/** Content selection only: keep old saved exercises and their scales valid. */
export function arePeriodsClose(periods:DateInterval[]):boolean{
 if(periods.length<3||periods.length>5||periods.some(p=>!Number.isInteger(p.start)||!Number.isInteger(p.end)||p.start<MIN_YEAR_INDEX||p.end>9999||p.start>p.end))return false;
 const durations=periods.map(p=>p.end-p.start+1).sort((a,b)=>a-b),middle=Math.floor(durations.length/2);
 // A very long event must not enlarge the allowed gaps for all shorter ones.
 const typical=durations.length%2?durations[middle]:(durations[middle-1]+durations[middle])/2;
 const ordered=[...periods].sort((a,b)=>a.start-b.start||a.end-b.end),lastEnd=Math.max(...ordered.map(p=>p.end));
 // Permit modest separation, scaled to the periods rather than a fixed era.
 const spacing=3*typical;
 if(lastEnd-ordered[0].start+1>spacing*periods.length)return false;
 let coveredEnd=ordered[0].end;
 for(const period of ordered.slice(1)){
  if(period.start-coveredEnd-1>spacing)return false;
  coveredEnd=Math.max(coveredEnd,period.end);
 }
 return true;
}
