import type {EngiDB,SessionRow,ReviewEventRow} from '../db/engi-db';
import {learningRow} from '../db/repositories';
import {assess,updateMemory} from '../lib/engi/engine';
import {repairTask} from '../lib/engi/session/composer';
import {isDiscrete} from '../lib/engi/questions/timeline';
import type {Task,Memory} from '../lib/engi/types';
import {localDay} from '../lib/engi/knowledge/motivation';

export type AnswerInput={sessionId:string;taskId:string;answer:unknown;confidence?:string;latencyMs?:number};
function calibrate(m:Memory,t:Task,correct:boolean){
 const c=m.selfReport??{remembered:0,missed:0,objectiveSuccesses:0,objectiveFailures:0};
 if(t.recipe.format==='recall_reveal')correct?c.remembered++:c.missed++;
 else if(isDiscrete(t))correct?c.objectiveSuccesses++:c.objectiveFailures++;
 m.selfReport=c;
}
/** Called inside the answer transaction; failed correction taps never enter here. */
export async function commitReview(d:EngiDB,session:SessionRow,task:Task,input:AnswerInput,attemptSequence:string[]){
 const discrete=isDiscrete(task),first=discrete?attemptSequence[0]:input.answer;
 const result=assess(task,first),wrongChoices=discrete?[...new Set(attemptSequence.slice(0,-1))]:[];
 const changes=[];const fsrsUpdated=new Set<string>();const stabilityTransitions:{targetId:string;before:number;after:number}[]=[];
 let isNewFailure=false;
 for(const evidence of result.evidence.filter(e=>e.level==='direct')){
  const old=await d.learningState.get(evidence.item.targetId);
  if(!old&&!evidence.correct)isNewFailure=true;
  const quickRepair=!!task.retryOf&&!!old&&new Date(old.payload.card.due).getTime()>Date.now();
  let m=quickRepair?structuredClone(old!.payload):updateMemory(old?.payload,evidence.item,evidence.correct,undefined);
  if(!m)continue;
  if(quickRepair){m.attempts++;m.correct+=Number(evidence.correct)}else fsrsUpdated.add(m.id);
  const wrong=discrete?wrongChoices:(!evidence.correct&&task.recipe.format!=='recall_reveal'&&evidence.chosen?[evidence.chosen]:[]);
  for(const id of wrong)m.confusions[id]=(m.confusions[id]??0)+1;
  // Forced-correct completion is not a successful objective discrimination.
  if(evidence.correct&&discrete)for(const o of task.options)if(o.id!==evidence.item.answerId&&m.confusions[o.id]){const v=m.confusions[o.id]*.85;m.confusions[o.id]=v<.1?0:v}
  if(!old){const prior=await d.reviewEvents.where('targetIds').equals(m.id).toArray();
   for(const event of prior)for(const p of event.payload.targets??[])if(p.targetId===m.id&&!p.correct&&p.level==='direct'){
    const priorWrong=event.payload.metadata?.wrongChoices??(p.chosen&&p.chosen!=='false'?[p.chosen]:[]);
    for(const id of new Set<string>(priorWrong))m.confusions[id]=(m.confusions[id]??0)+1;m.attempts++;
   }
  }
  calibrate(m,task,evidence.correct);stabilityTransitions.push({targetId:m.id,before:old?.payload.card.stability??0,after:m.card.stability});
  const row=learningRow(m);await d.learningState.put(row);changes.push(row);
 }
 const confidence=['low','medium','high'].includes(input.confidence??'')?input.confidence!:'medium';
 const encoding=isNewFailure&&!task.retryOf&&!task.recipe.diagnostic;
 const feedback={...result,chosen:input.answer,items:task.items,nextReview:changes[0]?.payload.card.due,correctionComplete:discrete,encoding,repairResolved:!!task.retryOf&&result.score===1};
 const metadata={attemptSequence,wrongChoices,attemptCount:discrete?attemptSequence.length:1,firstTryCorrect:result.score===1,stabilityTransitions};
 const event:ReviewEventRow={id:task.id,timestamp:new Date().toISOString(),recipe:task.recipe.id,level:task.recipe.diagnostic?'diagnostic':task.recipe.evidence?.level??'direct',targetIds:task.items.map(i=>i.targetId),payload:{score:result.score,reason:task.reason,pretest:isNewFailure,selfReport:task.recipe.format==='recall_reveal',fsrsEnabled:fsrsUpdated.size>0,metadata,targets:result.evidence.map(e=>({targetId:e.item.targetId,correct:e.correct,chosen:discrete?attemptSequence[0]:e.chosen,level:e.level,fsrsUpdated:fsrsUpdated.has(e.item.targetId)})),latencyMs:Math.min(3600000,Math.max(0,input.latencyMs??0)),confidence,feedback}};
 if(session.feed&&!task.recipe.diagnostic&&result.score<1&&!task.retryOf){const repair=repairTask(task,Math.max(0,result.evidence.findIndex(e=>!e.correct)),wrongChoices);
  repair.retryAfter=(session.completedCount??0)+4;session.repairQueue=[...(session.repairQueue??[]).filter(t=>t.items[0].targetId!==repair.items[0].targetId),repair].slice(-12);
 }
 await d.reviewEvents.add(event);session.results=[...session.results,result.score].slice(-100);session.updatedAt=event.timestamp;session.interaction=undefined;await d.activeSessions.put(session);
 const counter=await d.appMeta.get('reviewsSinceBackup');await d.appMeta.put({key:'reviewsSinceBackup',value:(counter?.value??0)+1});
 let milestone:string|undefined;
 if(!task.recipe.diagnostic){const prior=(await d.appMeta.get('dailyLearning'))?.value,day=localDay(),daily=prior?.day===day?prior:{day,retrievals:0,stability30Gains:0};daily.retrievals++;
  const knownGains=new Set<string>(daily.gainTargetIds??[]),gainIds=stabilityTransitions.filter(t=>t.before<30&&t.after>=30&&!knownGains.has(t.targetId)).map(t=>t.targetId),gains=gainIds.length;
  daily.stability30Gains+=gains;daily.gainTargetIds=[...knownGains,...gainIds];
  if(daily.retrievals===15)milestone='Цель на сегодня выполнена ✓';else if(gains)milestone=`Ещё ${gains} знание закреплено на 30 дней`;
  await d.appMeta.put({key:'dailyLearning',value:daily});
 }
 return {pending:false as const,feedback,memories:changes,event,results:session.results,interaction:undefined,milestone};
}
