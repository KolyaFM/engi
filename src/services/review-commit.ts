import type {Attempt} from '../lib/engi/study-core/attempts';
import type {GoalMemory} from '../lib/engi/study-core/memory';
import {reviewLearning,unitDue} from '../lib/engi/learning/bootstrap';
import type {EngiDB,SessionRow,ReviewEventRow} from '../db/engi-db';
import {learningRow} from '../db/repositories';
import {assess} from '../lib/engi/engine';
import {repairTask} from '../lib/engi/session/composer';
import {isDiscrete} from '../lib/engi/questions/timeline';
import type {Task,Memory} from '../lib/engi/types';
import {localDay} from '../lib/engi/knowledge/motivation';
import {studyEvidence} from './study-core-bridge';
import {recordDayAttempt} from './day-plan-service';
import {recordMistakeOutcome} from './mistake-episodes';
import {traceStudyAnswer} from './study-selection-trace';

export type AnswerInput={sessionId:string;taskId:string;answer:unknown;confidence?:string;latencyMs?:number};
function calibrate(m:Memory,t:Task,correct:boolean){
 const c=m.selfReport??{remembered:0,missed:0,objectiveSuccesses:0,objectiveFailures:0};
 if(t.recipe.format==='recall_reveal')correct?c.remembered++:c.missed++;
 else if(isDiscrete(t))correct?c.objectiveSuccesses++:c.objectiveFailures++;
 m.selfReport=c;
}
export const reviewReceiptKey=(taskId:string)=>'studyCore:reviewReceipt:'+taskId;
/** Preserve first-answer history when a screen is skipped or its session is replaced. */
export async function abandonReview(d:EngiDB,taskId:string){
 const key=reviewReceiptKey(taskId),receipt=(await d.appMeta.get(key))?.value as ReviewEventRow|undefined;
 if(!receipt)return;
 if(!await d.reviewEvents.get(taskId))await d.reviewEvents.add({...receipt,payload:{...receipt.payload,metadata:{...receipt.payload.metadata,completion:'abandoned',completedAt:new Date().toISOString()}}});
 await d.appMeta.delete(key);
}
/** First independent answer commits memory; correction only finalizes the screen event. */
export async function commitReview(d:EngiDB,session:SessionRow,task:Task,input:AnswerInput,attemptSequence:string[],audited?:Attempt,deferCompletion=false,goalBefore:GoalMemory[]=[]){
 const receipt=(await d.appMeta.get(reviewReceiptKey(task.id)))?.value as ReviewEventRow|undefined;
 if(receipt){
  if(deferCompletion){session.updatedAt=new Date().toISOString();await d.activeSessions.put(session);return {pending:true as const,feedback:null,memories:[],event:undefined,results:session.results,interaction:session.interaction,milestone:undefined};}
  const event:ReviewEventRow={...receipt,payload:{...receipt.payload,metadata:{...receipt.payload.metadata,attemptSequence:[...attemptSequence],attemptCount:attemptSequence.length,wrongChoices:[...new Set(attemptSequence.slice(0,-1))],completedAt:new Date().toISOString()},feedback:{...receipt.payload.feedback,chosen:input.answer,correctionComplete:true}}};
  await d.reviewEvents.add(event);await d.appMeta.delete(reviewReceiptKey(task.id));
  session.results=[...session.results,event.payload.score].slice(-100);session.interaction=undefined;session.updatedAt=new Date().toISOString();await d.activeSessions.put(session);
  return {pending:false as const,feedback:event.payload.feedback,memories:event.payload.memoryModel==='goals'?[]:await d.learningState.bulkGet(event.targetIds),event,results:session.results,interaction:undefined,milestone:undefined};
 }
 const discrete=isDiscrete(task),first=discrete?attemptSequence[0]:input.answer;
 const result=assess(task,first),wrongChoices=discrete?[...new Set(deferCompletion?attemptSequence:attemptSequence.slice(0,-1))]:[];
 for(const evidence of result.evidence){const checked=studyEvidence(task,audited,evidence.item);if(checked.correct!==undefined)evidence.correct=checked.correct;}
 if(task.studyContract?.response.kind==='set'&&audited?.results?.length)result.score=Number(audited.results[0].correct);
 const eligible=result.evidence.filter(e=>e.level==='direct'&&studyEvidence(task,audited,e.item).credit);
 const creditBlocked=result.evidence.length>0&&eligible.length===0;
 const changes=[];const fsrsUpdated=new Set<string>();const stabilityTransitions:{targetId:string;before:number;after:number}[]=[];
 let isNewFailure=false;
 for(const evidence of task.memoryModel==='goals'?[]:eligible){
  const old=await d.learningState.get(evidence.item.targetId);
  if(!old||old.payload.status==='suspended')continue;
  if(!old.payload.attempts&&!evidence.correct)isNewFailure=true;
  const latency=session.interaction?.firstAttemptLatencyMs??input.latencyMs??0;
  const applied=reviewLearning(old.payload,evidence.item,evidence.correct,task.recipe.format!=='recall_reveal',!!task.retryOf,!!task.practice||task.recipe.format==='multi_choice'&&!unitDue(old.payload,session.id,session.completedCount??0),latency);
  const m=applied.memory;if(applied.fsrsUpdated)fsrsUpdated.add(m.id);
  if(evidence.item.mediaId)m.recentMediaIds=[...m.recentMediaIds??[],evidence.item.mediaId].slice(-3);
  const wrong=discrete?wrongChoices:(!evidence.correct&&task.recipe.format!=='recall_reveal'&&evidence.chosen?[evidence.chosen]:[]);
  for(const id of wrong)m.confusions[id]=(m.confusions[id]??0)+1;
  // Forced-correct completion is not a successful objective discrimination.
  if(evidence.correct&&discrete)for(const o of task.options)if(o.id!==evidence.item.answerId&&m.confusions[o.id]){const v=m.confusions[o.id]*.85;m.confusions[o.id]=v<.1?0:v}
  calibrate(m,task,evidence.correct);stabilityTransitions.push({targetId:m.id,before:old?.payload.card.stability??0,after:m.card.stability});
  const row=learningRow(m);await d.learningState.put(row);changes.push(row);
 }
 const goalResults=task.memoryModel==='goals'?audited?.results??[]:[];
 for(const r of goalResults)if(r.credit)fsrsUpdated.add(r.goalId);
 const goalMemories=await d.appMeta.bulkGet(goalResults.filter(r=>r.credit).map(r=>'studyCore:memory:'+r.goalId));
 for(const row of goalMemories){
  if(!row)continue;
  const m=row.value as GoalMemory,r=goalResults.find(r=>r.goalId===m.goalId)!,rule=task.studyContract!.response;
  const prior=goalBefore.find(p=>p.goalId===m.goalId);
  stabilityTransitions.push({targetId:m.goalId,before:prior?.card.stability??0,after:m.card.stability});
  const chosen=rule.kind==='choice'?audited?.firstAnswer:rule.kind==='mapping'?(audited?.firstAnswer as Record<string,unknown>)?.[rule.bindings.find(b=>b.goalId===m.goalId)!.responseKey]:undefined;
  if(typeof chosen==='string'){
   m.confusions={...m.confusions};
   if(!r.correct)m.confusions[chosen]=(m.confusions[chosen]??0)+1;
   else for(const option of task.options)if(option.id!==chosen&&m.confusions[option.id]){const value=m.confusions[option.id]*.85;if(value<.1)delete m.confusions[option.id];else m.confusions[option.id]=value;}
  }
  // Group timing measures multiple goals; recall timing includes the reveal stage.
  if(isDiscrete(task)){
   const latency=session.interaction?.firstAttemptLatencyMs??input.latencyMs;
   if(latency!==undefined&&Number.isFinite(latency)){const bounded=Math.min(3600000,Math.max(0,latency));m.latencyEmaMs=m.latencyEmaMs===undefined?bounded:m.latencyEmaMs*.7+bounded*.3;}
  }
  const item=task.items.find(i=>studyEvidence(task,{...audited!,results:[r]},i).credit);
  if(item?.mediaId)m.recentMediaIds=[...m.recentMediaIds??[],item.mediaId].slice(-3);
  await d.appMeta.put({key:row.key,value:m});
 }
 const confidence=['low','medium','high'].includes(input.confidence??'')?input.confidence!:'medium';
 const encoding=isNewFailure&&!task.retryOf&&!task.recipe.diagnostic;
 const feedback={...result,creditBlocked,chosen:input.answer,items:task.items,nextReview:goalMemories[0]?.value.card.due??changes[0]?.payload.card.due,correctionComplete:discrete&&!deferCompletion,encoding,repairResolved:!!task.retryOf&&result.score===1&&!creditBlocked,mistakeResolved:0};
 const metadata={firstAttemptLatencyMs:session.interaction?.firstAttemptLatencyMs??input.latencyMs??0,earlyReveal:!!session.interaction?.earlyReveal,revealElapsedMs:session.interaction?.recallElapsedMs,difficultyStage:task.difficultyStage,practice:!!task.practice,repair:!!task.retryOf,attemptSequence,wrongChoices,attemptCount:discrete?attemptSequence.length:1,firstTryCorrect:result.score===1,stabilityTransitions};
 const event:ReviewEventRow={id:task.id,timestamp:new Date().toISOString(),recipe:task.recipe.id,level:creditBlocked?'practice':task.retryOf?'repair':task.practice?'practice':task.recipe.diagnostic?'diagnostic':task.recipe.evidence?.level??'direct',targetIds:task.items.map(i=>i.targetId),payload:{studyCore:audited?{mode:'eligibility-gate',attempt:audited}:undefined,score:result.score,reason:task.reason,pretest:isNewFailure,selfReport:task.recipe.format==='recall_reveal',fsrsEnabled:fsrsUpdated.size>0,metadata,targets:result.evidence.map(e=>({targetId:e.item.targetId,correct:e.correct,independent:studyEvidence(task,audited,e.item).credit,chosen:discrete?attemptSequence[0]:e.chosen,level:e.level,fsrsUpdated:fsrsUpdated.has(e.item.targetId)})),latencyMs:Math.min(3600000,Math.max(0,input.latencyMs??0)),confidence,feedback}};
 if(task.memoryModel==='goals'){
  if(audited){await recordDayAttempt(d,audited,!!task.learningLifecycle);feedback.mistakeResolved=await recordMistakeOutcome(d,audited,task.studyContract!);await traceStudyAnswer(d,task.studyContract!,audited,goalBefore);}
  event.targetIds=goalResults.map(r=>r.goalId);
  event.payload.memoryModel='goals';
  event.payload.targets=goalResults.map(r=>({targetId:r.goalId,correct:r.correct,independent:r.credit,selfReported:r.selfReported,level:'direct',fsrsUpdated:r.credit}));
 }
 if(task.memoryModel!=='goals'&&session.feed&&!task.recipe.diagnostic&&!task.practice&&!creditBlocked&&result.score<1&&!task.retryOf){const repair=repairTask(task,Math.max(0,result.evidence.findIndex(e=>!e.correct)),wrongChoices);
  repair.retryAfter=(session.completedCount??0)+4;session.repairQueue=[...(session.repairQueue??[]).filter(t=>t.items[0].targetId!==repair.items[0].targetId),repair].slice(-12);
 }
 if(deferCompletion)await d.appMeta.put({key:reviewReceiptKey(task.id),value:event});
 else{await d.reviewEvents.add(event);session.results=[...session.results,result.score].slice(-100);session.interaction=undefined;}
 session.updatedAt=event.timestamp;session.tasks=[task];session.currentPosition=0;await d.activeSessions.put(session);
 const counter=await d.appMeta.get('reviewsSinceBackup');await d.appMeta.put({key:'reviewsSinceBackup',value:(counter?.value??0)+1});
 let milestone:string|undefined;
 if(!task.recipe.diagnostic&&!task.practice&&!task.retryOf&&!creditBlocked){const dailyKey=task.memoryModel==='goals'?'studyCore:dailyLearning':'dailyLearning',prior=(await d.appMeta.get(dailyKey))?.value,day=localDay(),daily=prior?.day===day?prior:{day,retrievals:0,stability30Gains:0};daily.retrievals++;
  const knownGains=new Set<string>(daily.gainTargetIds??[]),gainIds=stabilityTransitions.filter(t=>t.before<30&&t.after>=30&&!knownGains.has(t.targetId)).map(t=>t.targetId),gains=gainIds.length;
  daily.stability30Gains+=gains;daily.gainTargetIds=[...knownGains,...gainIds];
  if(daily.retrievals===15)milestone='15 самостоятельных проверок за сегодня';else if(gains)milestone=`Ещё ${gains} знание закреплено на 30 дней`;
  await d.appMeta.put({key:dailyKey,value:daily});
 }
 if(deferCompletion)return {pending:true as const,feedback:null,memories:changes,event:undefined,results:session.results,interaction:session.interaction,milestone:undefined};
 return {pending:false as const,feedback,memories:changes,event,results:session.results,interaction:undefined,milestone};
}

