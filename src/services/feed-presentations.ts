import type {Task} from '../lib/engi/types';
import type {LearningGoal} from '../lib/engi/study-core/goals';
import {propertyKey} from '../lib/engi/study-core/acquisition';
import type {GoalProposal} from './goal-proposals';
import {classifyFeedInteraction,type FeedInteraction} from './feed-interactions';
import {rankRhythmCandidates,type RhythmTurn} from '../lib/engi/session/feed-rhythm-policy';
export type PresentationCandidate={key:string;interaction:FeedInteraction;goals:readonly LearningGoal[];supportGoalIds:readonly string[];proposal?:GoalProposal;preparedTask?:Task};
/** Callers supply only eligible work. Budgets apply after knowledge-age ordering. */
export function buildPresentationCandidates(proposals:GoalProposal[],tasks:Task[]):PresentationCandidate[]{
 const buckets=new Map<string,PresentationCandidate[]>(),seen=new Set<string>();
 const add=(p:GoalProposal|Task)=>{
  const task='reason'in p?p:undefined,goals=task?.studyContract?.primaryGoals??('goals'in p?p.goals:[]),interaction=classifyFeedInteraction(p);
  const key=JSON.stringify([interaction.kind,p.recipe.id,goals.map(propertyKey).sort(),p.items.map(i=>i.targetId)]);if(seen.has(key))return;seen.add(key);
  const bucket=buckets.get(interaction.kind)??[];if(bucket.length>=8)return;
  bucket.push({key,interaction,goals,supportGoalIds:[],...(task?{preparedTask:task}:{proposal:p as GoalProposal})});buckets.set(interaction.kind,bucket);
 };
 for(const p of proposals)add(p);for(const task of tasks)add(task);
 return [...buckets.values()].flat().slice(0,96);
}
export function rankPresentationCandidates(candidates:PresentationCandidate[],history:Task[],options:{seed:string;format:string;allowRecallFallback?:boolean}){
 const turns:RhythmTurn[]=history.filter(t=>t.reason!=='intro').map(t=>({key:t.id,interaction:classifyFeedInteraction(t),knowledgeKeys:t.studyContract?.primaryGoals.map(propertyKey)??[],objectIds:t.items.map(i=>i.entityId),optional:t.intent!=='repair'}));
 const lastProperty=new Map<string,number>();turns.forEach((t,n)=>t.knowledgeKeys.forEach(k=>lastProperty.set(k,n)));
 const candidatesByKey=new Map(candidates.map(c=>[c.key,c]));
 return rankRhythmCandidates(candidates.map(c=>{
  const keys=c.goals.map(propertyKey),knowledgeAge=keys.length?Math.min(...keys.map(k=>turns.length-(lastProperty.get(k)??-1))):turns.length;
  const same=turns.slice(-20).filter(t=>t.interaction.kind===c.interaction.kind&&t.knowledgeKeys.some(k=>keys.includes(k))).length;
  return {key:c.key,interaction:c.interaction,knowledgeKeys:keys,objectIds:c.preparedTask?.items.map(i=>i.entityId)??c.proposal?.items.map(i=>i.entityId)??[],need:1,knowledgeAge,variantPenalty:Math.min(1,same/4)};
 }),turns,{...options,allowRecallFallback:!!options.allowRecallFallback}).map(r=>({...r,candidate:candidatesByKey.get(r.key)!}));
}
export function earliestDueCohort<T>(rows:T[],due:(row:T)=>number):T[]{const earliest=Math.min(...rows.map(due));return rows.filter(row=>due(row)-earliest<60000);}
export function materializePresentationChoice(candidates:PresentationCandidate[],history:Task[],options:{seed:string;format:string;prefer?:(candidate:PresentationCandidate)=>boolean},build:(candidate:PresentationCandidate)=>{task:Task;safe:boolean}|undefined){
 const ranking=rankPresentationCandidates(candidates,history,options),attempted=new Set<string>();let attempts=0,fallback:{task:Task;row:typeof ranking[number]}|undefined;
 const finish=(task:Task|undefined,row?:typeof ranking[number])=>({task,ranking:row?ranking.map(r=>r.key===row.key?row:r):ranking,attempts});
 for(const allowRecallFallback of [false,true]){
  const remaining=candidates.filter(c=>!attempted.has(c.key));
  let ranked=(allowRecallFallback?rankPresentationCandidates(remaining,history,{...options,allowRecallFallback}):ranking).filter(r=>!r.blocked);
  // Object diversity is a preference among permitted formats, never a way to
  // erase an objective alternative and authorize another optional recall.
  if(options.prefer){
   // A repeated format on fresh knowledge is preferable to a group repeating
   // the last object. Re-evaluate the soft run rule, but never its recall cap.
   const preferred=rankPresentationCandidates(remaining.filter(options.prefer),history,{...options,allowRecallFallback}).filter(r=>!r.blocked);
   const keys=new Set(preferred.map(r=>r.key));ranked=[...preferred,...ranked.filter(r=>!keys.has(r.key))];
  }
  for(const row of ranked){if(attempted.has(row.key)||attempts>=(allowRecallFallback?8:7))continue;attempted.add(row.key);attempts++;const result=build(row.candidate);if(!result)continue;if(!result.safe){fallback??={task:result.task,row};continue;}return finish(result.task,row);}
  if(fallback)return finish(fallback.task,fallback.row);
 }return finish(undefined);
}
