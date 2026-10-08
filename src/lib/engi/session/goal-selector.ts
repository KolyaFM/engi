export type CandidateKind='due'|'new'|'practice';
export type SelectionCandidate={key:string;goalIds:string[];objectIds:string[];format:string;kind:CandidateKind;overdueMs:number;mistake:boolean;reinforcement?:boolean};
export type SelectionHistory={objectIds:string[];format:string};
export type GoalSelectorState={version:1;day:string;decisions:number;dueStreak:number;wait:Record<string,number>;recent:SelectionHistory[]};
export const DUE_BURST=3;
export const MAX_DUE_BURST=11;
export const FAIR_WAIT=12;
const keys=(c:SelectionCandidate)=>c.goalIds.length?c.goalIds:['practice:'+c.key];
const overlaps=(a:string[],b:string[])=>a.some(id=>b.includes(id));
/** Input contains only ready, permitted candidates. This function cannot relax eligibility. */
export function selectGoalCandidate(candidates:SelectionCandidate[],previous:GoalSelectorState|undefined,day:string,options:{newSlotsLeft?:number;maxDueBurst?:number}={}){
 const state:GoalSelectorState=previous?.version===1&&previous.day===day?structuredClone(previous):{version:1,day,decisions:0,dueStreak:0,wait:{},recent:previous?.version===1?structuredClone(previous.recent):[]};
 if(!candidates.length)return {index:-1,state,reason:'empty' as const};
 const hasDue=candidates.some(c=>c.kind==='due'),hasNew=candidates.some(c=>c.kind==='new');
 const dueCount=new Set(candidates.filter(c=>c.kind==='due').flatMap(keys)).size;
 const cap=Math.max(DUE_BURST,Math.min(MAX_DUE_BURST,Math.floor(options.maxDueBurst??MAX_DUE_BURST)));
 const burst=Math.max(DUE_BURST,Math.min(cap,Math.ceil(dueCount/Math.max(1,options.newSlotsLeft??3))));
 const kind:CandidateKind=hasDue&&(!hasNew||state.dueStreak<burst)?'due':hasNew?'new':'practice';
 const last=state.recent.at(-1);
 let pool=candidates.map((candidate,index)=>({candidate,index})).filter(r=>r.candidate.kind===kind);
 const waiting=(c:SelectionCandidate)=>Math.max(...keys(c).map(k=>state.wait[k]??0));
 const longest=Math.max(...pool.map(r=>waiting(r.candidate)));
 const forced=longest>=FAIR_WAIT;
 if(forced)pool=pool.filter(r=>waiting(r.candidate)>=Math.max(FAIR_WAIT,longest-2));
 if(last){
  const differentObjects=pool.filter(r=>!overlaps(r.candidate.objectIds,last.objectIds));
  const both=differentObjects.filter(r=>r.candidate.format!==last.format);
  const differentFormat=pool.filter(r=>r.candidate.format!==last.format);
  if(both.length)pool=both;else if(differentObjects.length)pool=differentObjects;else if(differentFormat.length)pool=differentFormat;
 }
 const features=(c:SelectionCandidate)=>{
  const urgency=Math.min(1,Math.max(0,c.overdueMs)/86400000);
  const wait=Math.min(1,waiting(c)/FAIR_WAIT);
  const objectRecency=state.recent.length?state.recent.filter(h=>overlaps(c.objectIds,h.objectIds)).length/state.recent.length:0;
  const formatRecency=state.recent.length?state.recent.filter(h=>c.format===h.format).length/state.recent.length:0;
  return {urgency,wait,mistake:Number(c.mistake),reinforcement:Number(!!c.reinforcement),objectRecency,formatRecency};
 };
 const score=(c:SelectionCandidate)=>{const f=features(c);return 2*f.urgency+2*f.wait+f.mistake+3*f.reinforcement-f.objectRecency-0.5*f.formatRecency;};
 pool.sort((a,b)=>score(b.candidate)-score(a.candidate)||a.index-b.index);
 const selected=pool[0],selectedFeatures=features(selected.candidate),selectedKeys=new Set(keys(selected.candidate)),nextWait:Record<string,number>={};
 // One tick per eligible goal, independent of how many formats present it.
 for(const k of new Set(candidates.flatMap(keys)))nextWait[k]=selectedKeys.has(k)?0:(state.wait[k]??0)+1;
 state.wait=nextWait;state.decisions++;state.dueStreak=kind==='due'?Math.min(MAX_DUE_BURST,state.dueStreak+1):kind==='new'?0:state.dueStreak;
 state.recent=[...state.recent,{objectIds:[...selected.candidate.objectIds],format:selected.candidate.format}].slice(-3);
 return {index:selected.index,state,reason:forced?'fairness' as const:'diversity-and-urgency' as const,features:selectedFeatures,burst};
}

