import type {LearningGoal} from '../study-core/goals';
import type {GoalMemory} from '../study-core/memory';
import {exposureAvailableAt,type ExposureEntry} from '../study-core/exposure';
import {newAdmission,type GoalDayPlan} from '../study-core/day-plan';

/** Shared admission for scheduling and the practice header. Counts refer to goals, not views. */
export function admitStudyCandidates<T>(candidates:T[],goalsOf:(candidate:T)=>LearningGoal[],plan:GoalDayPlan,
 memories:ReadonlyMap<string,GoalMemory>,exposures:ReadonlyMap<string,ExposureEntry>,now=Date.now(),practice=false){
 const pending=new Set([...plan.repeat,...plan.reinforce].filter(r=>r.status==='pending').map(r=>r.goalId));
 const newLeft=Math.max(0,plan.newTarget-plan.newGoalIds.length),newSlots=Math.min(newLeft,newAdmission(plan).available);
 let waitingUntil=Infinity,nextAvailableAt=Infinity;
 const available=candidates.filter(candidate=>{
  if(practice)return true;
  const goals=goalsOf(candidate);if(!goals.length)return true;
  if(goals.some(g=>memories.has(g.id)&&!pending.has(g.id))||goals.filter(g=>!memories.has(g.id)).length>newSlots)return false;
  const at=Math.max(...goals.map(g=>Math.max(memories.has(g.id)?new Date(memories.get(g.id)!.card.due).getTime():0,
   exposures.has(g.id)?exposureAvailableAt(exposures.get(g.id)!):0)));
  waitingUntil=Math.min(waitingUntil,at);if(at>now)nextAvailableAt=Math.min(nextAvailableAt,at);return at<=now;
 });
 const goals=new Map(available.flatMap(candidate=>goalsOf(candidate)).map(g=>[g.id,g]));
 let repeat=0,reinforce=0,fresh=0;
 for(const id of goals.keys()){const memory=memories.get(id);if(!memory)fresh++;else if(Number(memory.card.state)===2)repeat++;else reinforce++;}
 return {available,waitingUntil,newLeft,newSlots,nextAt:Number.isFinite(nextAvailableAt)?new Date(nextAvailableAt).toISOString():undefined,counts:{repeat,reinforce,new:Math.min(fresh,newSlots)}};
}
