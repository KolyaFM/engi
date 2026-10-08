import type {LearningGoal} from '../study-core/goals';
import type {Snapshot} from '../types';
import type {GoalMemory} from '../study-core/memory';
import {canonicalTargets} from '../questions/recipe-factory';
import {retention} from '../engine';
export type GoalCatalogEntry={goal:LearningGoal;targetIds:string[];entityIds:string[];propertyId:string;suspended:boolean};
export function scopedGoals(s:Snapshot,tag='all'){
 const allowed=new Set(canonicalTargets(s.bundle,tag).map(i=>i.targetId));
 return (s.goalCatalog??[]).filter(e=>e.targetIds.every(id=>allowed.has(id)));
}
export function goalRetention(m:GoalMemory){return retention({id:m.goalId,card:m.card,attempts:m.independentAttempts,correct:m.independentSuccesses,confusions:{},firstSuccessAt:m.independentSuccesses?new Date(m.card.last_review??m.card.due).toISOString():undefined});}
export function summarizeGoals(s:Snapshot,entries=s.goalCatalog??[],now=Date.now()){
 const active=entries.filter(e=>!e.suspended),ids=new Set(active.map(e=>e.goal.id)),memory=(s.goalMemories??[]).filter(m=>ids.has(m.goalId));
 const checked=memory.filter(m=>m.independentAttempts>0);
 return {total:active.length,available:entries.length,new:active.length-memory.length,suspended:entries.length-active.length,covered:checked.length,
  retention:checked.length?Math.round(checked.reduce((sum,m)=>sum+goalRetention(m),0)/checked.length*100):null,
  week:memory.filter(m=>m.independentSuccesses>0&&m.card.stability>=7).length,month:memory.filter(m=>m.independentSuccesses>0&&m.card.stability>=30).length,quarter:memory.filter(m=>m.independentSuccesses>0&&m.card.stability>=90).length,
  due:memory.filter(m=>new Date(m.card.due).getTime()<=now).length};
}
