/** Composition benchmark only; all queues are synthetic and held in memory. */
import {writeFileSync} from 'node:fs';
import {random} from './models/chronology-model';
import {selectRelevantTask,applyTaskResult,type Knowledge,type ModelTask,type History} from './models/relevant-task-model';
type Scenario='dense'|'sparse'|'errors-and-due'|'future-only'|'all-known'|'same-years'|'one-category';
const scenarios:Scenario[]=['dense','sparse','errors-and-due','future-only','all-known','same-years','one-category'];
function fixture(scenario:Scenario,seed:number){const rng=random(seed),items:Knowledge[]=[];for(let n=0;n<120;n++){
 const date=n%2===0,needed=scenario==='dense'?n<80:scenario==='sparse'?n<4:scenario==='errors-and-due'?n<32:scenario==='future-only'?n<20:scenario==='all-known'?false:n<24;
 items.push({id:'k'+n,object:'o'+n,property:date?'admission':'country',kind:date?'date':'category',value:date?scenario==='same-years'?1800:1700+Math.floor(rng()*23)*10:scenario==='one-category'?'France':n%3===0?'USA':'France',need:needed?scenario==='errors-and-due'?n<8?'error':'due':'learning':'known',availableAt:scenario==='future-only'&&needed?1000000:0,introduced:n<115,excluded:n>=110,goal:date?'relative-order':'association'});
 }return items;}
function formatFirst(items:Knowledge[],now:number,step:number,rng:()=>number):ModelTask|undefined{
 // Deliberately simple comparison policy, NOT the current product selector.
 const safe=items.filter(k=>k.introduced&&!k.excluded&&k.availableAt<=now),kind=step%2===0?'date':'category',pool=safe.filter(k=>k.kind===kind).map(k=>({k,r:rng()})).sort((a,b)=>a.r-b.r).map(x=>x.k);
 if(!pool.length)return;const members=pool.slice(0,kind==='date'?4:12).map(k=>({...k,role:'target' as const}));
 return {anchor:members[0].id,format:kind==='date'?'order':'conveyor',members,why:['synthetic format-first baseline']};
}
const reports=[];
for(const scenario of scenarios)for(const policy of ['format-first','needs-first'] as const){const seeds=[];
 for(let seed=1;seed<=100;seed++){let items=fixture(scenario,seed);const originalNeeded=new Set(items.filter(k=>k.need!=='known').map(k=>k.id)),served=new Set<string>(),rng=random(seed+1000),history:History[]=[],trace:any[]=[];let selected=0,useful=0,support=0,knownGraded=0,blocked=0,maxSupport=0,wrongProperty=0,screens=0,waits=0;
 const formats:Record<string,number>={};
 for(let step=0;step<120;step++){const now=step*30,task=policy==='needs-first'?selectRelevantTask(items,now,history,seed):formatFirst(items,now,step,rng);if(!task){waits++;continue;}screens++;formats[task.format]=(formats[task.format]??0)+1;maxSupport=Math.max(maxSupport,task.members.filter(m=>m.role==='support').length);
  const neededNow=new Set(items.filter(k=>k.need!=='known').map(k=>k.id));
  for(const m of task.members){selected++;if(m.role==='support')support++;else if(neededNow.has(m.id)){useful++;served.add(m.id);}else knownGraded++;if(m.excluded||!m.introduced||m.availableAt>now)blocked++;if(m.property!==task.members[0].property)wrongProperty++;}
  const answer=Object.fromEntries(task.members.filter(m=>m.role==='target').map(m=>[m.id,rng()>.15]));items=applyTaskResult(items,task,answer,now);history.push({format:task.format,objects:task.members.map(m=>m.object),need:task.members.find(m=>m.id===task.anchor)!.need});if(history.length>5)history.shift();
  if(seed===1&&trace.length<15)trace.push({step,format:task.format,why:task.why,members:task.members.map(m=>({id:m.id,role:m.role,need:m.need})),threshold:task.threshold});
 }
 const allowedInitial=fixture(scenario,seed).filter(k=>originalNeeded.has(k.id)&&k.introduced&&!k.excluded&&k.availableAt<=120*30).length;
 seeds.push({selected,useful,support,knownGraded,blocked,maxSupport,wrongProperty,screens,waits,formats,coverage:allowedInitial?100*[...served].filter(id=>originalNeeded.has(id)).length/allowedInitial:null,trace});
 }
 const mean=(key:keyof typeof seeds[number])=>seeds.reduce((sum,r)=>sum+Number(r[key]),0)/seeds.length,total=seeds.reduce((s,r)=>s+r.selected,0),report={scenario,policy,seeds:100,horizonSeconds:3600,meanScreens:mean('screens'),usefulPercent:total?100*seeds.reduce((s,r)=>s+r.useful,0)/total:0,supportPercent:total?100*seeds.reduce((s,r)=>s+r.support,0)/total:0,meanKnownGraded:mean('knownGraded'),blockedSelections:seeds.reduce((s,r)=>s+r.blocked,0),maxSupport:Math.max(...seeds.map(r=>r.maxSupport)),wrongProperty:mean('wrongProperty'),meanInitialCoverage:seeds[0].coverage===null?null:mean('coverage'),formats:seeds.reduce((sum,r)=>{for(const [f,n]of Object.entries(r.formats))sum[f]=(sum[f]??0)+n;return sum;},{} as Record<string,number>),exampleTrace:seeds[0].trace};
 reports.push(report);console.log(JSON.stringify({...report,exampleTrace:undefined}));
}
writeFileSync('artifacts/relevant-task-model-audit.json',JSON.stringify({scope:'Synthetic task composition, not the product feed or a memory evaluation',reports},null,2));
