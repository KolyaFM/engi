export type IntervalScale={min:number;max:number;ticks:number[];mode:'dated'|'sparse'|'anchored';bands:{id:string;start:number;end:number;marker:string;colorIndex:number;support?:boolean}[]};
export function buildIntervalScale(intervals:{id:string;start:number;end:number;support?:boolean}[],mode:IntervalScale['mode'],width:number):IntervalScale|undefined{
 if(intervals.length<3||intervals.length>5||!Number.isFinite(width)||width<160||intervals.some(i=>!Number.isInteger(i.start)||!Number.isInteger(i.end)||i.start<1||i.end>9999||i.start>i.end)||new Set(intervals.map(i=>i.id)).size!==intervals.length||new Set(intervals.map(i=>`${i.start}:${i.end}`)).size!==intervals.length)return;
 if(intervals.filter(i=>i.support).length>1||mode==='anchored'&&!intervals.some(i=>i.support))return;
 const lo=Math.min(...intervals.map(i=>i.start)),hi=Math.max(...intervals.map(i=>i.end+1)),span=hi-lo;
 const step=[1,2,5,10,20,50,100,200,500,1000,2000,5000].find(n=>span/n<=5)??5000;
 const min=Math.max(1,Math.floor(lo/step)*step-step),max=Math.ceil(hi/step)*step+step,unit=width/(max-min);
 if(intervals.some(i=>(i.end+1-i.start)*unit<12)||intervals.some((i,n)=>intervals.slice(n+1).some(j=>Math.max(Math.abs(i.start-j.start),Math.abs(i.end-j.end))*unit<6)))return;
 const ticks:number[]=[];if(mode!=='anchored')for(let y=Math.ceil(min/step)*step;y<=max;y+=step)ticks.push(y);
 const spaced=ticks.filter((_,n)=>n%Math.max(1,Math.ceil(44/(step*unit)))===0);
 const visible=mode==='sparse'&&spaced.length>2?[spaced[0],spaced.at(-1)!]:spaced;
 return {min,max,ticks:visible,mode,bands:intervals.map((i,n)=>({...i,marker:String.fromCharCode(65+n),colorIndex:n}))};
}
