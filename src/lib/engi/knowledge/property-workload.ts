import type {GoalCatalogEntry} from './goal-progress';
import type {GoalMemory} from '../study-core/memory';
import type {LearningLifecycle} from '../study-core/acquisition';
import {acquisitionKey} from '../study-core/acquisition';
/** Shared property projection for the deck picker and the live feed counters. */
export function propertyWorkload(catalog:GoalCatalogEntry[],memories:GoalMemory[],ledger:LearningLifecycle,scope?:Set<string>,now=Date.now()){
 const relevant=catalog.filter(e=>!e.suspended&&(!scope||scope.has(e.goal.id))),keys=new Set(relevant.map(e=>acquisitionKey(e.goal))),activeGoalIds=new Set(relevant.map(e=>e.goal.id));
 const learning=ledger.units.filter(u=>keys.has(u.key)&&u.stage!=='completed'&&activeGoalIds.has(u.goal.id)),learningKeys=new Set(learning.map(u=>u.key)),repeats=new Map<string,GoalMemory>();
 for(const m of memories){const entry=relevant.find(e=>e.goal.id===m.goalId);if(entry&&!learningKeys.has(acquisitionKey(entry.goal))&&new Date(m.card.due).getTime()<=now)repeats.set(acquisitionKey(entry.goal),m);}
 return {relevant,keys,activeGoalIds,learning,learningKeys,repeats};
}
