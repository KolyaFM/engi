import {dateYear} from '../historical-date';
import type {Fact,Item} from '../types';
import {trusted} from '../knowledge/properties';
import {formatDateFact} from './date-interval';
export type OrderingValues={min:number;max:number;factIds:string[];label:string;kind:'number'|'date';unit:string};
/** Compare the complete recorded set, never an arbitrary first value. */
export function orderingValues(rows:Fact[]):OrderingValues|undefined{
 if(!rows.length||rows.some(f=>!trusted(f)||f.learnable===false)||new Set(rows.map(f=>f.valueKind)).size!==1||new Set(rows.map(f=>f.unit??'')).size!==1)return;
 const kind=rows[0].valueKind;if(kind!=='date'&&kind!=='number')return;
 const values=rows.map(f=>{if(kind==='number')return Number.isFinite(f.valueNumber)?{min:f.valueNumber!,max:f.valueNumber!,label:String(f.valueNumber)+(f.unit?' '+f.unit:'')}:undefined;
  if(!['year','month','day'].includes(f.datePrecision??'')||!f.dateStart)return;
  // Legacy year facts may contain only "1900", without dateEnd. Precision,
  // rather than storage padding, determines their possible calendar bounds.
  const length=f.datePrecision==='year'?4:f.datePrecision==='month'?7:10,prefix=f.dateStart.slice(0,length);
  if(!(length===4?/^\d{4}$/:length===7?/^\d{4}-\d{2}$/:/^\d{4}-\d{2}-\d{2}$/).test(prefix)||!Number.isFinite(dateYear(f))||f.dateEnd&&(f.dateEnd.slice(0,length)!==prefix||dateYear(f,'end')!==dateYear(f)))return;
  const year=dateYear(f),month=Number(prefix.slice(5,7)),day=Number(prefix.slice(8,10)),min=year*10000+(length===4?101:month*100+(length===7?1:day)),max=year*10000+(length===4?1231:month*100+(length===7?31:day));
  return {min,max,label:formatDateFact(f)};
 });if(values.some(v=>!v))return;const ordered=values.filter(v=>!!v).sort((a,b)=>a.min-b.min);
 return {min:Math.min(...ordered.map(v=>v.min)),max:Math.max(...ordered.map(v=>v.max)),factIds:rows.map(f=>f.id).sort(),label:[...new Set(ordered.map(v=>v.label))].join(', '),kind,unit:rows[0].unit??''};
}
export function orderingTargets(item:Item):string[]{return item.ordering?item.ordering.factIds.map(id=>`ku:fact:${id}:forward`):[item.targetId];}
export function compatibleOrder(a:Item,b:Item){const x=a.ordering??{min:a.year!,max:a.year!,unit:'',kind:'date'},y=b.ordering??{min:b.year!,max:b.year!,unit:'',kind:'date'};return x.kind===y.kind&&x.unit===y.unit&&(x.max<y.min||y.max<x.min);}
/** Greedy interval scheduling finds a largest unambiguous set for each anchor. */
export function selectOrderItems(pool:Item[],max=5):Item[]{
 const candidates=pool.filter(i=>Number.isFinite(i.year));if(candidates.length<3)return [];
 const ordered=[...candidates].sort((a,b)=>(a.ordering?.max??a.year!)-(b.ordering?.max??b.year!));
 const choose=(items:Item[],anchor?:Item)=>{const chosen=anchor?[anchor]:[];for(const item of items)if(!chosen.some(i=>i.entityId===item.entityId||!compatibleOrder(i,item))){chosen.push(item);if(chosen.length===max)break;}return chosen;};
 const preferred=choose(ordered,candidates[0]);if(preferred.length>=3)return preferred;
 // If the preferred anchor cannot form a group, one earliest-finish pass per
 // kind/unit finds a valid alternative without trying every possible anchor.
 const groups=new Map<string,Item[]>();for(const item of ordered){const key=JSON.stringify([item.ordering?.kind??'date',item.ordering?.unit??'']),group=groups.get(key)??[];group.push(item);groups.set(key,group);}
 for(const group of groups.values()){const chosen=choose(group);if(chosen.length>=3)return chosen;}return [];
}
