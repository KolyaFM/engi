/** Proposed rules only. Not connected to product scheduling or user data. */
export type Actor='expert'|'guesser'|'partition-only'|'side-habit'|'recent-hint'|'learner';
export type Policy='same-boundary'|'mixed-context'|'two-orders'|'consistent'|'local-confirmation';
export type Probe={kind:'boundary'|'order';focus:number;threshold?:number;partners:number[];side:number;day:number};
export const years=[1700,1735,1760,1780,1790,1798,1802,1810,1825,1850,1890,1930];
export function random(seed:number){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
export function factorial(n:number):number{return n<2?1:n*factorial(n-1);}
export function chanceOfOrder(size:number){return 1/factorial(size);}
export function binaryTail(successes:number,trials:number){let total=0;for(let k=successes;k<=trials;k++)total+=factorial(trials)/(factorial(k)*factorial(trials-k));return total/2**trials;}
export function remainingMatchChance(remaining:number,spareAnswers:number){return 1/(remaining+spareAnswers);}
export function makeProbe(policy:Policy,stage:number,focus:number,day:number,rng:()=>number):Probe{
 const kind=policy==='same-boundary'||stage<2?'boundary':'order';
 // Opposite nearby boundaries distinguish local order from a memorized 1800 partition.
 const threshold=policy==='same-boundary'?1800:years[focus]+(stage%2?10:-10);
 let candidates=years.map((_y,i)=>i).filter(i=>i!==focus);
 if(policy==='local-confirmation'&&kind==='order')candidates=candidates.sort((a,b)=>Math.abs(years[a]-years[focus])-Math.abs(years[b]-years[focus])).slice(0,5);
 const partners:number[]=[];
 while(partners.length<3){const i=Math.floor(rng()*candidates.length);partners.push(candidates.splice(i,1)[0]);}
 return {kind,focus,threshold,partners,side:rng()<.5?0:1,day};
}
export function answerProbability(actor:Actor,p:Probe,exposures:number,lastSeenDay:number){
 const members=[p.focus,...p.partners],buckets=members.map(i=>years[i]<1800?0:1),sameBucket=buckets.filter(v=>v===0).length;
 if(actor==='expert')return .96;
 if(actor==='guesser')return p.kind==='boundary'?.5:chanceOfOrder(4);
 if(actor==='side-habit')return p.kind==='boundary'?Number((years[p.focus]<p.threshold! ?0:1)===p.side):chanceOfOrder(4);
 if(actor==='partition-only'){
  if(p.kind==='boundary')return p.threshold===1800?1:((years[p.focus]<1800)===(p.threshold!<1800)? .5:1);
  return 1/(factorial(sameBucket)*factorial(4-sameBucket));
 }
 if(actor==='recent-hint')return p.day===lastSeenDay?.95:(p.kind==='boundary'?.5:chanceOfOrder(4));
 // Hypothetical learner: feedback improves success, overnight retention remains imperfect.
 return Math.min(.94,(p.kind==='boundary'?.5:chanceOfOrder(4))+exposures*.055)*(p.day===lastSeenDay?1:.85);
}
type Unit={stage:number;available:number;lastAction:number;lastSeenDay:number;exposures:number;orders:string[];completedDay?:number};
export function simulate(policy:Policy,actor:Actor,seed:number,days=30,actionsPerDay=180,secondsPerAction=10){
 const rng=random(seed),units:Unit[]=years.map(()=>({stage:0,available:0,lastAction:-99,lastSeenDay:-1,exposures:0,orders:[]}));
const required=policy==='same-boundary'?2:policy==='mixed-context'?3:4;
 const formats:Record<string,number>={},completion:number[]=[],attempts:number[]=[],trace:any[]=[];
 let errors=0,repeated=0,last=-1,chronology=0,ordinary=0,streak=0,maxStreak=0,previous='';
 for(let day=0;day<days;day++)for(let a=0;a<actionsPerDay;a++){
  const action=day*actionsPerDay+a,now=day*86400+a*secondsPerAction;
  // One chronological screen per eight actions, independent of unrelated first-check backlog.
  if(a%8!==3){ordinary++;streak=previous==='ordinary'?streak+1:1;previous='ordinary';maxStreak=Math.max(maxStreak,streak);continue;}
  const available=units.map((u,i)=>({u,i})).filter(({u})=>u.stage<required&&u.available<=now&&action-u.lastAction>=3);
  if(!available.length){ordinary++;continue;}
  available.sort((a,b)=>a.u.lastAction-b.u.lastAction);
  const {u,i}=available[0];if(i===last)repeated++;last=i;
  let probe=makeProbe(policy,u.stage,i,day,rng),signature=probe.partners.slice().sort((a,b)=>a-b).join(',');
  // Do not accept the same order group as a new context. Use available alternatives.
  if(['two-orders','consistent','local-confirmation'].includes(policy)&&probe.kind==='order'){for(let n=0;n<100&&u.orders.includes(signature);n++){probe=makeProbe(policy,u.stage,i,day,rng);signature=probe.partners.slice().sort((a,b)=>a-b).join(',');}}
  const probability=answerProbability(actor,probe,u.exposures,u.lastSeenDay),correct=rng()<probability;
  chronology++;formats[probe.kind]=(formats[probe.kind]??0)+1;attempts.push(probability);previous=probe.kind;streak=1;
  const before=u.stage;u.lastAction=action;u.lastSeenDay=day;u.exposures++;
  if(correct){u.stage++;if(probe.kind==='order')u.orders.push(signature);if(u.stage===required){u.completedDay=day;completion.push(day);}else u.available=now+((['two-orders','consistent'].includes(policy)&&u.stage===3||policy==='local-confirmation'&&u.stage>=2)?86400:300);}
  else {errors++;if(['consistent','local-confirmation'].includes(policy)){u.stage=0;u.orders=[];}u.available=now+(['consistent','local-confirmation'].includes(policy)&&before>=2?86400:30);}
  if(trace.length<100)trace.push({day,action,focus:i,format:probe.kind,stageBefore:before,correct,stageAfter:u.stage,probability,threshold:probe.threshold,partners:probe.partners});
 }
 return {policy,actor,seed,completed:completion.length,total:units.length,completionDays:completion,chronology,ordinary,formats,errors,repeated,maxOrdinaryStreak:maxStreak,units:units.map((u,i)=>({focus:i,stage:u.stage,completedDay:u.completedDay})),trace};
}
/** Fixed, independent evidence windows; not an eventual guarantee under unlimited retries. */
export function randomPassChance(policy:Policy){return policy==='same-boundary'?.5**2:policy==='mixed-context'?.5**2/24:.5**2/24**2;}
