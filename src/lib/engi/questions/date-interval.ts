import {dateYear,formatHistoricalYear,formatHistoricalRange,MIN_YEAR_INDEX,type DateFields} from '../historical-date';
import type {Fact} from '../types';
export type DateInterval={start:number;end:number};
/** Old archives lack boundary precision. Only full calendar-year bounds are inferred. */
export function yearInterval(f:Fact):DateInterval|undefined{
 if(f.valueKind!=='date'||f.datePrecision!=='range'||!f.dateStart||!f.dateEnd)return;
 const p=f.dateBoundaryPrecision;
 if(p&&(p.start!=='year'||p.end!=='year'))return;
 if(!p&&(!f.dateStart.endsWith('-01-01')||!f.dateEnd.endsWith('-12-31')))return;
 const start=dateYear(f),end=dateYear(f,'end');
 if(!Number.isInteger(start)||!Number.isInteger(end)||start<MIN_YEAR_INDEX||end>9999||start>end)return;
 return {start,end};
}
export function formatDateFact(f:DateFields):string{
 if(f.dateStartEra==='BCE'||f.dateEndEra==='BCE'){const prefix=f.datePrecision==='circa'?'Около ':'';return prefix+(f.datePrecision==='range'||dateYear(f)!==dateYear(f,'end')&&f.datePrecision==='circa'?formatHistoricalRange(dateYear(f),dateYear(f,'end')):formatHistoricalYear(dateYear(f)));}
 const point=(value:string|undefined,precision?:string)=>!value?'':precision==='year'?String(Number(value.slice(0,4))):precision==='month'?value.slice(0,7).split('-').reverse().join('.'):value.split('-').reverse().join('.');
 if(f.datePrecision==='range'||f.dateStart!==f.dateEnd&&f.datePrecision==='circa'){
  const inferred=f.dateStart?.endsWith('-01-01')&&f.dateEnd?.endsWith('-12-31');
  const start=point(f.dateStart,f.dateBoundaryPrecision?.start??(inferred?'year':'day')),end=point(f.dateEnd,f.dateBoundaryPrecision?.end??(inferred?'year':'day'));
  return (f.datePrecision==='circa'?'Около ':'')+(start===end&&f.datePrecision==='circa'?start:`${start}–${end}`);
 }
 return (f.datePrecision==='circa'?'Около ':'')+point(f.dateStart,f.datePrecision==='circa'?'year':f.datePrecision??'year');
}
