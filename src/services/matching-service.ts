import type {EngiDB} from '../db/engi-db';
import {getBundle} from '../db/repositories';
import {prepareStudyTask,feedStudyCore,commitInvalidStudyTask} from './study-core-bridge';
import {taskContentRevisions} from '../lib/engi/study-core/compiler';
import {buildGoalCatalog} from './goal-catalog';
import {ensureDayPlan} from './day-plan-service';
import {commitReview} from './review-commit';

export type MatchPairInput={sessionId:string;taskId:string;entityId:string;answerId:string;requestId:string};
/** Called inside the trainer's transaction: memory, pair receipt and screen state are atomic. */
export async function answerMatchPair(d:EngiDB,input:MatchPairInput){
 const session=await d.activeSessions.get(input.sessionId),task=session?.tasks[session.currentPosition];
 if(!session||session.status!=='active'||task?.id!==input.taskId||task.memoryModel!=='goals'||!['match','categorize'].includes(task.recipe.format)||task.items.length<2)throw Error('Текущая карточка соотнесения не найдена');
 const now=new Date(),bundle=await getBundle(d),core=feedStudyCore(d,'goals',task.learningLifecycle);
 const completed=await d.reviewEvents.get(task.id);
 if(completed?.payload.feedback.invalidContent)return {correct:false,complete:true,interaction:session.interaction,feedback:completed.payload.feedback,milestone:undefined};
 if(!task.studyContract&&!task.studyContractIssue)await prepareStudyTask(d,bundle,task,now);
 const enabled=await d.learningState.bulkGet(task.items.map(i=>i.targetId));
 const current=task.studyContract?taskContentRevisions(bundle,task,task.studyContract):{};
 if(!task.studyContract||enabled.some(r=>!r||r.payload.status==='suspended')||Object.entries(task.studyContract.contentRevisions).some(([id,revision])=>current[id]!==revision)){
  const result=await commitInvalidStudyTask(d,session,task);await core.skip(task.id);
  return {correct:false,complete:true,interaction:result.interaction,feedback:result.feedback,milestone:undefined};
 }
 const catalog=buildGoalCatalog(bundle,(await d.learningState.toArray()).map(r=>r.payload));
 const rows=await d.appMeta.bulkGet(catalog.map(e=>'studyCore:memory:'+e.goal.id));
 await ensureDayPlan(d,catalog,rows.filter(r=>!!r).map(r=>r!.value),now,session);
 const before=rows.filter(r=>!!r).map(r=>r!.value);
 const {attempt,pair,firstResult}=await core.submitPair(task.id,input.entityId,input.answerId,input.requestId,now);
 let milestone:string|undefined,mistakeResolved=0;
 if(firstResult){
  // Reuse the review accounting for a single first answer, preserving the parent screen.
  const item=task.items.find(i=>i.entityId===input.entityId)!,pairTask={...task,id:task.id+':pair:'+input.entityId,items:[item]};
  const result=await commitReview(d,{...session,interaction:undefined},pairTask,{sessionId:session.id,taskId:pairTask.id,answer:input.answerId},[input.answerId],
   {...attempt,id:pairTask.id,phase:'submitted',submittedAt:pair.at,results:[firstResult]},false,before);
  milestone=result.milestone;
  mistakeResolved=result.feedback?.mistakeResolved??0;
 }
 const interaction={taskId:task.id,attemptSequence:[],matching:{matched:attempt.matchedAnswers!,history:attempt.pairHistory!}};
 session.interaction=interaction;session.updatedAt=pair.at;
 const complete=attempt.phase==='submitted';
 let feedback=completed?.payload.feedback;
 if(complete&&!completed){
  const results=attempt.results??[],score=results.filter(r=>r.correct).length/task.items.length;
  feedback={score,matchingComplete:true,chosen:attempt.matchedAnswers,items:task.items,creditBlocked:!results.some(r=>r.credit)};
  // Pair events own independent learning credit; this event only closes the screen.
  await d.reviewEvents.add({id:task.id,timestamp:pair.at,recipe:task.recipe.id,level:'matching-summary',targetIds:[],payload:{score,feedback,memoryModel:'goals',fsrsEnabled:false}});
  session.results=[...session.results,score].slice(-100);
 }
 await d.activeSessions.put(session);
 return {correct:pair.correct,complete,interaction,feedback,milestone,mistakeResolved};
}
