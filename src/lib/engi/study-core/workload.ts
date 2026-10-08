import type {GoalDayPlan} from './day-plan';
import type {GoalMemory} from './memory';
export type StudyWorkload={new:number;learning:number;repeat:number;mistakes:number};
/** Work remaining, including timed learning steps. Not the number selectable this second. */
export function studyWorkload(plan:GoalDayPlan,memories:GoalMemory[],introducedGoalIds:string[],scope?:Set<string>):StudyWorkload{
 const relevant=(id:string)=>!scope||scope.has(id),known=new Map(memories.filter(m=>relevant(m.goalId)).map(m=>[m.goalId,m]));
 const left=Math.max(0,plan.newTarget-plan.newGoalIds.length),introduced=[...new Set(introducedGoalIds)].filter(id=>relevant(id)&&!known.has(id)).slice(0,left);
 const learning=new Set([...introduced,...[...known.values()].filter(m=>m.independentAttempts>0&&[1,3].includes(Number(m.card.state))).map(m=>m.goalId)]);
 return {new:Math.max(0,left-introduced.length),learning:learning.size,repeat:plan.repeat.filter(r=>relevant(r.goalId)&&r.status==='pending').length,mistakes:plan.mistakes?.length??0};
}
