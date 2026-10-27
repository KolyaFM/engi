import type {Fact} from './types';
export type Era='CE'|'BCE';
export type DateFields=Pick<Fact,'dateStart'|'dateEnd'|'datePrecision'|'dateBoundaryPrecision'|'dateStartEra'|'dateEndEra'>;
export const MIN_YEAR_INDEX=-9998,MAX_YEAR_INDEX=9999;
export function assertLegacyDateCompatibility(facts:DateFields[]){if(facts.some(f=>f.dateStartEra==='BCE'||f.dateEndEra==='BCE'))throw Error('Даты до нашей эры требуют пакет schemaVersion 3 с явным указанием эры');}
/** Astronomical coordinates are internal only: year 0 represents 1 BCE. */
export function toYearIndex(year:number,era:Era='CE'){
 if(!Number.isInteger(year)||year<1||year>9999||!['CE','BCE'].includes(era))throw Error('Укажите год от 1 до 9999 и эру CE или BCE');
 return era==='BCE'?1-year:year;
}
export function historicalYear(index:number){
 if(!Number.isSafeInteger(index))throw Error('Год вне поддерживаемого диапазона');
 return {year:index<=0?1-index:index,era:index<=0?'BCE' as const:'CE' as const};
}
export function dateYear(f:DateFields,edge:'start'|'end'='start'){
 const value=edge==='start'?f.dateStart:f.dateEnd,era=edge==='start'?f.dateStartEra:f.dateEndEra;
 if(!value||!/^\d{4}(?:-|$)/.test(value))return NaN;
 try{return toYearIndex(Number(value.slice(0,4)),era??'CE');}catch{return NaN;}
}
export function formatHistoricalYear(index:number,explicitCE=false){const {year,era}=historicalYear(index);return String(year)+(era==='BCE'?' до н. э.':explicitCE?' н. э.':'');}
export function formatHistoricalRange(start:number,end:number,explicitCE=false){
 const a=historicalYear(start),b=historicalYear(end);
 if(a.era===b.era)return `${a.year}–${b.year}`+(a.era==='BCE'?' до н. э.':explicitCE?' н. э.':'');
 return `${formatHistoricalYear(start,true)} — ${formatHistoricalYear(end,true)}`;
}
/** Gregorian CE dates retain their existing ordering; BCE currently has year precision. */
export function dateOrderKey(f:DateFields,edge:'start'|'end'='start'){
 const s=(edge==='start'?f.dateStart:f.dateEnd)??'',year=dateYear(f,edge);
 return year*10000+Number(s.slice(5,7)||1)*100+Number(s.slice(8,10)||1);
}
export function datesOverlap(a:DateFields,b:DateFields){return dateOrderKey(a)<=dateOrderKey(b,'end')&&dateOrderKey(b)<=dateOrderKey(a,'end');}
export function daysInMonth(year:number,month:number){return [31,year%4===0&&(year%100!==0||year%400===0)?29:28,31,30,31,30,31,31,30,31,30,31][month-1];}
export function validCivilDate(s:string|undefined){
 if(!s||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
 const [year,month,day]=s.split('-').map(Number);return year>=1&&year<=9999&&month>=1&&month<=12&&day>=1&&day<=daysInMonth(year,month);
}
