import type {Task} from '../lib/engi/types';
import type {GoalProposal} from './goal-proposals';
import {propertyKey} from '../lib/engi/study-core/acquisition';
import {classifyFeedInteraction} from './feed-interactions';

/** Count the interaction the player sees, not the underlying recipe's alias. */
export function presentationFamily(task:Pick<Task,'recipe'|'items'|'presentation'|'intervalExercise'>){
 const {kind,answer}=classifyFeedInteraction(task);
 if(kind==='period-bands')return 'interval-bands';
 if(kind==='period-start'||kind==='period-end')return 'interval-endpoint';
 if(kind.endsWith('conveyor'))return 'conveyor';
 if(kind==='atomic-choice')return answer==='image'?'image-choice':'choice';
 return task.presentation??task.recipe.format;
}
export function proposalDiversityPenalty(proposal:GoalProposal,history:Task[]){
 return proposalDiversityContext(history)(proposal);
}
/** Build history indexes once per selection, rather than in every sort comparison. */
export function proposalDiversityContext(history:Task[]){
 const directions=new Map<string,string>(),families=new Map<string,number>();
 for(const t of history)for(const g of t.studyContract?.primaryGoals??[])directions.set(propertyKey(g),g.direction);
 for(const t of history.slice(-5)){const f=presentationFamily(t);families.set(f,(families.get(f)??0)+1);}
 const last=history.length?presentationFamily(history.at(-1)!):undefined;
 return (proposal:GoalProposal)=>{const family=presentationFamily(proposal);
 // A group checks multiple goals: average directional repetition rather than
 // charging it once per member. Eligibility and memory credit are unchanged.
 const direction=proposal.goals.reduce((sum,g)=>sum+Number(directions.get(propertyKey(g))===g.direction)*4,0)/Math.max(1,proposal.goals.length);
 return direction+(families.get(family)??0)*3+Number(last===family)*8+(proposal.group?-2:0);
 };
}
