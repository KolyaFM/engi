import type {Bundle,Memory,Task,Recipe,Item} from '../lib/engi/types';
import type {LearningGoal} from '../lib/engi/study-core/goals';
import type {GoalMemory} from '../lib/engi/study-core/memory';
import {goalPresentationMemory} from '../lib/engi/study-core/presentation-memory';
import {goalCandidates} from './goal-candidates';
import {composeUnit,compositionContext,type CompositionContext} from '../lib/engi/session/composer';
import {compileTaskContract} from '../lib/engi/study-core/compiler';
import {feedSpan} from './feed-performance';
export type GoalProposal={presentation?:'conveyor';recipe:Recipe;items:Item[];goals:LearningGoal[];group?:boolean;options?:Task['options']};
type Pool={proposals:GoalProposal[];context:CompositionContext};
// Bounded by two configurations/scopes. No schedule, exposure, day plan or selected task is cached.
const cache:{key:string;pool:Pool}[]=[];
function freeze(value:any):any{if(value&&typeof value==='object'){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;}
export function goalProposalPool(b:Bundle,enabled:Memory[],tag='all',format='mixed'):Pool{
 const end=feedSpan('proposals');try{
 const key=JSON.stringify([b,enabled,tag,format]),entry=cache.find(e=>e.key===key);
 if(entry){cache.splice(cache.indexOf(entry),1);cache.push(entry);return entry.pool;}
 // Validate with the established generator once per content/configuration value.
 // Retain neither distractors nor task contracts in the proposal pool.
 const proposals=structuredClone(goalCandidates(b,enabled,tag,format).filter(t=>!!t.studyContract?.primaryGoals.length).map(t=>({recipe:t.recipe,items:t.items,goals:t.studyContract!.primaryGoals})));
 freeze(proposals);const pool=Object.freeze({proposals,context:compositionContext(b)});
 cache.push({key,pool});if(cache.length>2)cache.shift();return pool;
 }finally{end();}
}
export function materializeGoalProposal(b:Bundle,enabled:Memory[],proposal:GoalProposal,context:CompositionContext,tag:string,history:Task[],practice=false,memories:ReadonlyMap<string,GoalMemory>=new Map()):Task|undefined{
 const end=feedSpan('materialize');try{
 let task:Task|undefined;
 if(proposal.items.some(i=>!enabled.some(m=>m.id===i.targetId&&!m.legacyOf&&m.status!=='suspended')))return;
 if(proposal.group){task={presentation:proposal.presentation,id:crypto.randomUUID(),memoryModel:'goals',recipe:{...proposal.recipe},items:proposal.items.map(i=>({...i})),options:(proposal.options??[]).map(o=>({...o})),reason:'due',practice};}
 else{
  const m=enabled.find(m=>m.id===proposal.items[0].targetId&&!m.legacyOf&&m.status!=='suspended');if(!m)return;
  // The selector chooses a goal/interaction. Keep image/name presentation free to vary
  // at construction time, as in the eager generator; do not pin a random cached cue.
  const alternatives=(context.targets.get(m.id)??[]).filter(({r})=>r.format===proposal.recipe.format&&r.answerKey===proposal.recipe.answerKey&&r.direction===proposal.recipe.direction);
  const narrowed={...context,targets:new Map([[m.id,alternatives]])};
  task=composeUnit(b,goalPresentationMemory(m,memories.get(proposal.goals[0].id)),tag,proposal.recipe.format,history,narrowed);
  if(!task||task.items.some(i=>!enabled.some(m=>m.id===i.targetId&&!m.legacyOf&&m.status!=='suspended')))return;
  task.memoryModel='goals';task.practice=practice;
 }
 try{
  const contract=compileTaskContract(b,task),expected=proposal.goals.map(g=>g.id).sort(),actual=contract.primaryGoals.map(g=>g.id).sort();
  if(JSON.stringify(expected)!==JSON.stringify(actual))return;
  // Persistence and opening the actual attempt remain prepareStudyTask's responsibility.
  return task;
 }catch{return;}
 }finally{end();}
}
