import {MIN_YEAR_INDEX,formatHistoricalYear} from '../historical-date';
export type IntervalScale={min:number;max:number;ticks:number[];mode:'dated'|'sparse'|'anchored';bands:{id:string;start:number;end:number;marker:string;colorIndex:number;support?:boolean}[]};
/** Render from actual bounds, including persisted tasks with intentionally sparse ticks. */
export function intervalAxisTicks(min:number,max:number,width:number):number[]{
 if(!Number.isFinite(min)||!Number.isFinite(max)||max<=min||!Number.isFinite(width)||width<=0)return [];
 if(min<1){
  const span=max-min,limit=Math.max(2,Math.floor(width/90)),step=[1,2,5,10,20,25,50,100,200,250,500,1000,2000,5000,10000].find(s=>span/s<=limit)??Math.ceil(span);
  const candidates:number[]=[];
  for(let y=step;y<=1-min;y+=step){const index=1-y;if(index>=min&&index<=max)candidates.push(index);}
  for(let y=step;y<=max;y+=step)if(y>=min)candidates.push(y);
  if(min<=1&&max>=1)candidates.push(1);
  if(!candidates.some(y=>y<=0)){const year=Math.max(1,1-Math.ceil(min)),unit=10**Math.floor(Math.log10(year));candidates.push(1-Math.floor(year/unit)*unit);}
  const sorted=[...new Set(candidates)].sort((a,b)=>a-b),out:number[]=[];
  for(const index of sorted){const previous=out.at(-1),gap=previous===undefined?Infinity:(index-previous)/span*width,required=previous===undefined?0:(formatHistoricalYear(previous,true).length+formatHistoricalYear(index,true).length)*3.2+8;if(gap>=required)out.push(index);}
  if(out.length<2)return [Math.ceil(min),Math.floor(max)];return out;
 }
 const span=max-min,limit=Math.max(2,Math.min(5,Math.floor(width/48)+1));
 const baseStep=[1,2,5,10,20,25,50,100,200,250,500,1000,2000,2500,5000,10000].find(n=>span/n<=limit-1)??Math.ceil(span);
 const step=Math.max(1,Math.ceil(baseStep/2));
 const ticks:number[]=[];for(let year=Math.ceil(min/step)*step;year<=max;year+=step)ticks.push(year);
 return ticks;
}
export function buildIntervalScale(intervals:{id:string;start:number;end:number;support?:boolean}[],mode:IntervalScale['mode'],width:number):IntervalScale|undefined{
 if(intervals.length<3||intervals.length>5||!Number.isFinite(width)||width<160||intervals.some(i=>!Number.isInteger(i.start)||!Number.isInteger(i.end)||i.start<MIN_YEAR_INDEX||i.end>9999||i.start>i.end)||new Set(intervals.map(i=>i.id)).size!==intervals.length||new Set(intervals.map(i=>`${i.start}:${i.end}`)).size!==intervals.length)return;
 if(intervals.filter(i=>i.support).length>1||mode==='anchored'&&!intervals.some(i=>i.support))return;
 const lo=Math.min(...intervals.map(i=>i.start)),hi=Math.max(...intervals.map(i=>i.end+1)),span=hi-lo;
 const step=[1,2,5,10,20,50,100,200,500,1000,2000,5000].find(n=>span/n<=4)??5000;
 const min=Math.max(lo<1?MIN_YEAR_INDEX:1,Math.floor(lo/step)*step),max=Math.ceil(hi/step)*step,unit=width/(max-min);
 if(intervals.some(i=>(i.end+1-i.start)*unit<6)||intervals.some((i,n)=>intervals.slice(n+1).some(j=>Math.max(Math.abs(i.start-j.start),Math.abs(i.end-j.end))*unit<6)))return;
 const ticks:number[]=[];if(mode!=='anchored')for(let y=Math.ceil(min/step)*step;y<=max;y+=step)ticks.push(y);
 const spaced=ticks.filter((_,n)=>n%Math.max(1,Math.ceil(44/(step*unit)))===0);
 const visible=mode==='sparse'&&spaced.length>2?[spaced[0],spaced.at(-1)!]:spaced;
 return {min,max,ticks:visible,mode,bands:intervals.map((i,n)=>({...i,marker:String.fromCharCode(65+n),colorIndex:n}))};
}
