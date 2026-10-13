import type {GoalCatalogEntry} from './goal-progress';
import type {GoalMemory} from '../study-core/memory';
import type {LearningLifecycle} from '../study-core/acquisition';
import {propertyKey} from '../study-core/acquisition';
/** Shared property projection for the deck picker and the live feed counters. */
export function propertyWorkload(catalog:GoalCatalogEntry[],memories:GoalMemory[],ledger:LearningLifecycle,scope?:Set<string>,now=Date.now()){
 const relevant=catalog.filter(e=>!e.suspended&&(!scope||scope.has(e.goal.id))),keys=new Set(relevant.map(e=>propertyKey(e.goal))),byGoal=new Map(relevant.map(e=>[e.goal.id,e])),activeGoalIds=new Set(byGoal.keys());
 const learning=[...new Map(ledger.units.filter(u=>keys.has(propertyKey(u.goal))&&u.stage!=='completed').map(u=>[propertyKey(u.goal),u])).values()],learningKeys=new Set(learning.map(u=>propertyKey(u.goal))),repeats=new Map<string,GoalMemory>();
 for(const m of memories){const entry=byGoal.get(m.goalId);if(entry&&!learningKeys.has(propertyKey(entry.goal))&&new Date(m.card.due).getTime()<=now)repeats.set(propertyKey(entry.goal),m);}
 return {relevant,keys,activeGoalIds,learning,learningKeys,repeats};
}
