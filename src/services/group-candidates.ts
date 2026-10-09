import type {Bundle,Task} from '../lib/engi/types';
import {compileTaskContract} from '../lib/engi/study-core/compiler';
import {preflight,shuffle,normalize} from '../lib/engi/engine';
import {feedSpan} from './feed-performance';
import type {GoalProposal} from './goal-proposals';
import {groupContext,type GroupContext} from './group-affinity';
/** Group only already eligible atomic candidates. Never introduce a future or suspended member. */
export function groupCandidates(b:Bundle,ready:Task[],known:Set<string>,newSlots:number,context=groupContext(b)):Task[]{
 return groupProposals(b,ready.filter(t=>!!t.studyContract).map(t=>({recipe:t.recipe,items:t.items,goals:t.studyContract!.primaryGoals})),known,newSlots,{context}).flatMap(p=>{
  const task:Task={id:crypto.randomUUID(),memoryModel:'goals',recipe:p.recipe,items:p.items,options:p.options!,reason:'due',practice:ready[0]?.practice};
  try{task.studyContract=compileTaskContract(b,task);return [task];}catch{return [];}
 });
}
export function groupProposals(b:Bundle,ready:GoalProposal[],known:Set<string>,newSlots:number,configuration:{spareAnswer?:boolean;conveyor?:boolean;context?:GroupContext}={}):GoalProposal[]{
 const end=feedSpan('groups');try{
 const affinity=configuration.context??groupContext(b),buckets=new Map<string,GoalProposal[]>(),out:GoalProposal[]=[],seen=new Set<string>(),counts=new Map<string,number>();
 for(const t of ready){
  if(!['match','categorize'].includes(t.recipe.format)||t.items.length!==1||t.goals.length!==1)continue;
  const kind=known.has(t.goals[0].id)?'due':'new';
  const signature=affinity.signature(t.items[0],t.recipe);if(!signature)continue;
  const key=JSON.stringify([t.recipe.format,t.recipe.answerKey,t.recipe.direction,t.recipe.cue,t.recipe.tag,kind,signature]);
  const bucket=buckets.get(key)??[];bucket.push(t);buckets.set(key,bucket);
 }
 // Randomized traversal avoids permanently privileging the first property/object.
 // Atomic candidates retain full goal coverage; grouped variants have a separate build budget.
 for(const bucket of shuffle([...buckets.values()]))for(const n of shuffle(bucket.map((_t,n)=>n))){
  const anchor=bucket[n],isConveyor=!!configuration.conveyor&&anchor.recipe.format==='categorize'&&new Set(bucket.map(p=>p.items[0].answerId)).size===2,minimum=anchor.recipe.format==='match'||isConveyor?3:2,fresh=!known.has(anchor.goals[0].id),limit=isConveyor?(fresh?Math.min(6,newSlots):6):fresh?Math.min(3,newSlots):3;
  if((counts.get(anchor.recipe.format)??0)>=32)continue;
  if(limit<minimum)continue;
  const selected=[anchor],entities=new Set([anchor.items[0].entityId]),answers=new Set([anchor.items[0].answerId]),goals=new Set([anchor.goals[0].id]);
  // Greedy whole-group affinity, bounded and with shuffled equal-score ties.
  const neighbours=shuffle(bucket.filter(t=>t!==anchor)),answerItems=bucket.map(t=>t.items[0]);
  while(selected.length<limit){
   const candidates=neighbours.filter(t=>!entities.has(t.items[0].entityId)&&!goals.has(t.goals[0].id)&&(anchor.recipe.format!=='match'||!answers.has(t.items[0].answerId)));
   const scores=new Map(candidates.map(t=>[t,affinity.rank(t.items[0],selected.map(t=>t.items[0]),answerItems)]));candidates.sort((a,c)=>scores.get(c)!-scores.get(a)!);
   // A conveyor must contain both sides, without imposing equal quotas.
   const t=isConveyor&&answers.size===1?candidates.find(t=>!answers.has(t.items[0].answerId))??candidates[0]:candidates[0];if(!t)break;
   const i=t.items[0],g=t.goals[0].id;
   selected.push(t);entities.add(i.entityId);answers.add(i.answerId);goals.add(g);
  }
  if(selected.length<minimum||answers.size<2)continue;
  const key=JSON.stringify([anchor.recipe.format,[...goals].sort()]);if(seen.has(key))continue;
  const items=shuffle(selected.map(t=>({...t.items[0]}))),bank=[...new Map(items.map(i=>[i.answerId,{id:i.answerId,name:i.answer}])).values()];
  const extra=shuffle(bucket.filter(t=>!answers.has(t.items[0].answerId)&&!items.some(i=>[i.answer,...i.aliases].some(a=>normalize(a)===normalize(t.items[0].answer))))).sort((a,c)=>affinity.rank(c.items[0],items,answerItems)-affinity.rank(a.items[0],items,answerItems))[0];
  if(configuration.spareAnswer&&anchor.recipe.format==='match'&&extra)bank.push({id:extra.items[0].answerId,name:extra.items[0].answer});
  const options=shuffle(bank);
  const cues=items.map(i=>anchor.recipe.cue==='image'&&i.image?i.image:normalize(i.name));if(new Set(cues).size!==items.length)continue;
  const task:Task={id:'group-proposal',recipe:{...anchor.recipe,prompt:(anchor.recipe.format==='match'?'Сопоставьте объекты':'Распределите объекты по категориям')+': '+(anchor.recipe.label??anchor.recipe.answerKey)+'.'},items,options,reason:'due'};
  if(!preflight(task))continue;
  seen.add(key);out.push({recipe:task.recipe,items,options,goals:selected.flatMap(p=>p.goals),group:true,...(configuration.conveyor&&anchor.recipe.format==='categorize'&&options.length===2?{presentation:'conveyor' as const}:{})});counts.set(anchor.recipe.format,(counts.get(anchor.recipe.format)??0)+1);
 }
 return out;
 }finally{end();}
}
