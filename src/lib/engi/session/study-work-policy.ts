import type {Task} from '../types';
import {knowledgeMistakeKey} from '../study-core/mistakes';
import type {LearningGoal} from '../study-core/goals';
export type RepairCandidate={key:string;lastAttemptAt:string;goal:LearningGoal;format:string};
/** Spacing is measured in other tasks, and becomes a preference when learning runs out. */
export function selectRepairCandidate(candidates:RepairCandidate[],history:Task[],hasLearning:boolean){
 const recent=history.slice(-2),last=history.at(-1);
 const keys=(task:Task)=>task.studyContract?.primaryGoals.map(knowledgeMistakeKey)??[];
 if(hasLearning&&last?.intent==='repair')return -1;
 const pool=candidates.map((candidate,index)=>({candidate,index})).filter(({candidate})=>!hasLearning||!recent.some(t=>keys(t).includes(candidate.key)));
 if(!pool.length)return -1;
 pool.sort((a,b)=>{
  const repeated=(c:RepairCandidate)=>Number(!!last&&keys(last).includes(c.key));
  return repeated(a.candidate)-repeated(b.candidate)||a.candidate.lastAttemptAt.localeCompare(b.candidate.lastAttemptAt)||Number(a.candidate.format===last?.recipe.format)-Number(b.candidate.format===last?.recipe.format)||a.index-b.index;
 });
 return pool[0].index;
}
