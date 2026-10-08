import type {Bundle,Memory} from '../lib/engi/types';
import {canonicalTargets} from '../lib/engi/questions/recipe-factory';
import {triagedMemory} from '../lib/engi/learning/bootstrap';
import {goalCandidates} from './goal-candidates';
import type {GoalCatalogEntry} from '../lib/engi/knowledge/goal-progress';
import {feedSpan} from './feed-performance';
// One bounded entry. Value-based identity also detects in-place edits and other DB instances.
// Goal FSRS lives in appMeta; legacy rows here configure generation, not scheduling.
let cached:{key:string;entries:GoalCatalogEntry[]}|undefined;
export function buildGoalCatalog(b:Bundle,memories:Memory[]){
 const end=feedSpan('catalog');
 try{
 const key=JSON.stringify([b,memories]);
 if(cached?.key===key)return structuredClone(cached.entries);
 const entries=buildGoalCatalogUncached(b,memories);cached={key,entries:structuredClone(entries)};return entries;
 }finally{end();}
}
export function buildGoalCatalogUncached(b:Bundle,memories:Memory[]){
 const configured=new Map(memories.map(m=>[m.id,m]));
 const configuration=canonicalTargets(b).map(i=>({...configured.get(i.targetId)??triagedMemory(i,'red','',0),status:'review' as const}));
 const catalog=new Map<string,GoalCatalogEntry>();
 for(const task of goalCandidates(b,configuration))for(const goal of task.studyContract!.primaryGoals){
  const targetIds=task.items.map(i=>i.targetId),entityIds=[...new Set(task.items.map(i=>i.factId?b.facts.find(f=>f.id===i.factId)!.entityId:i.entityId))];
  catalog.set(goal.id,{goal,targetIds,entityIds,propertyId:task.recipe.answerKey,suspended:targetIds.some(id=>configured.get(id)?.status==='suspended')});
 }
 return [...catalog.values()];
}
