/** Opt-in, bounded, content-free diagnostics. Uses real monotonic time, not FSRS time. */
type Sample={stage:string;ms:number};
let enabled=false;
const samples:Sample[]=[];
let observer:PerformanceObserver|undefined;
export const feedPerformance={
 start(){enabled=true;samples.length=0;observer?.disconnect();
  if(typeof PerformanceObserver!=='undefined'&&PerformanceObserver.supportedEntryTypes.includes('longtask')){
   observer=new PerformanceObserver(list=>{if(enabled)for(const e of list.getEntries())record({stage:'browser.longtask',ms:e.duration});});observer.observe({entryTypes:['longtask']});
  }
 },
 stop(){enabled=false;observer?.disconnect();observer=undefined;},
 report(){return samples.map(s=>({...s}));},
};
function record(sample:Sample){samples.push(sample);if(samples.length>1000)samples.shift();}
export function feedSpan(stage:string){
 const start=enabled?performance.now():undefined;
 return ()=>{if(start===undefined||!enabled)return;record({stage,ms:performance.now()-start});};
}
export async function measureFeed<T>(stage:string,work:()=>Promise<T>):Promise<T>{const end=feedSpan(stage);try{return await work();}finally{end();}}
if(typeof window!=='undefined')Object.assign(window,{engiPerformance:feedPerformance});
