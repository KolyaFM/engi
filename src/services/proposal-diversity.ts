import type {Task} from '../lib/engi/types';
import type {GoalProposal} from './goal-proposals';
import {propertyKey} from '../lib/engi/study-core/acquisition';

/** Count the interaction the player sees, not the underlying recipe's alias. */
export function presentationFamily(task:Pick<Task,'recipe'|'items'|'presentation'|'intervalExercise'>){
 if(task.intervalExercise)return task.intervalExercise.kind==='bands'?'interval-bands':'interval-endpoint';
 if(task.presentation==='conveyor')return 'conveyor';
 if(task.items.length===1&&['choice','match','categorize','missing'].includes(task.recipe.format))return task.recipe.answerPresentation==='image'?'image-choice':'choice';
 return task.presentation??task.recipe.format;
}
export function proposalDiversityPenalty(proposal:GoalProposal,history:Task[]){
 const lastGoals=[...history].reverse().flatMap(t=>t.studyContract?.primaryGoals??[]),family=presentationFamily(proposal);
 // A group checks multiple goals: average directional repetition rather than
 // charging it once per member. Eligibility and memory credit are unchanged.
 const direction=proposal.goals.reduce((sum,g)=>{const last=lastGoals.find(other=>propertyKey(other)===propertyKey(g));return sum+Number(!!last&&last.direction===g.direction)*4;},0)/Math.max(1,proposal.goals.length);
 return direction+history.slice(-5).filter(t=>presentationFamily(t)===family).length*3+Number(!!history.length&&presentationFamily(history.at(-1)!)===family)*8+(proposal.group?-2:0);
}
