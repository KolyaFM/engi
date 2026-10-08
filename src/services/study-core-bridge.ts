import type {EngiDB,SessionRow,ReviewEventRow} from '../db/engi-db';
import type {Bundle,Task} from '../lib/engi/types';
import {compileTaskContract,taskContentRevisions,contractAnswer} from '../lib/engi/study-core/compiler';
import {createStudyCoreService} from './study-core-service';
import {getBundle} from '../db/repositories';
import type {Attempt} from '../lib/engi/study-core/attempts';
import type {Item} from '../lib/engi/types';
/** Contract eligibility gates the legacy commit, without two competing live schedules. */
export const feedStudyCore=(db:EngiDB,model?:'goals',lifecycle?:1)=>createStudyCoreService(db,{applyMemory:model==='goals',lifecycle:!!lifecycle});
export async function prepareStudyTask(db:EngiDB,b:Bundle,task:Task,now=new Date()){
  if(task.studyContract||task.studyContractIssue)return;
  let contract;
  try{
    contract=compileTaskContract(b,task);
  }catch(error){task.studyContractIssue=(error as Error).message;return;}
  // Storage failures must abort the transaction, rather than masquerade as bad content.
  const core=feedStudyCore(db,task.memoryModel,task.learningLifecycle);
  await core.setContentRevisions(contract.contentRevisions);
  await core.open(contract,task.id,now);
  task.studyContract=contract;
}
export async function auditStudyAnswer(db:EngiDB,task:Task,answer:unknown,now=new Date()){
  const b=await getBundle(db);await prepareStudyTask(db,b,task,now);
  if(!task.studyContract)return undefined;
  const core=feedStudyCore(db,task.memoryModel,task.learningLifecycle);
  const current=taskContentRevisions(b,task,task.studyContract);
  await core.setContentRevisions(current);
  if(Object.entries(task.studyContract.contentRevisions).some(([key,revision])=>current[key]!==revision)){
    // Retain any already recorded first answer as historical evidence of the old revision.
    return {id:task.id,taskId:task.id,startedAt:new Date().toISOString(),phase:'stale',ineligibleGoalIds:[],results:[]} as Attempt;
  }
  return core.submit(task.id,contractAnswer(task,answer),now);
}
/** Interim binding to existing memories. Group eligibility always comes from primary goals. */
export function studyEvidence(task:Task,attempt:Attempt|undefined,item:Item){
  if(!attempt)return {credit:true,correct:undefined};
  const rule=task.studyContract?.response;
  const goalId=rule?.kind==='mapping'?rule.bindings.find(b=>b.responseKey===item.entityId)?.goalId:
    rule&&'goalId' in rule?rule.goalId:undefined;
  const result=attempt.results?.find(r=>r.goalId===goalId);
  return {credit:attempt.phase==='submitted'&&!!(result?.credit||result?.acquisitionCredit),
    correct:rule?.kind==='set'?result?.correct:undefined};
}
export async function commitInvalidStudyTask(db:EngiDB,s:SessionRow,t:Task){
  const receiptKey='studyCore:reviewReceipt:'+t.id,prior=(await db.appMeta.get(receiptKey))?.value;
  const feedback={score:0,evidence:[],expected:[],items:t.items,invalidContent:true,chosen:undefined};
  const event:ReviewEventRow={id:t.id,timestamp:new Date().toISOString(),recipe:t.recipe.id,level:'invalid_content',targetIds:[],
    payload:{score:0,feedback,fsrsEnabled:false,priorIndependentReview:prior,studyCore:{mode:'eligibility-gate',status:'stale-or-unavailable'}}};
  await db.reviewEvents.add(event);await db.appMeta.delete(receiptKey);s.interaction=undefined;s.updatedAt=event.timestamp;await db.activeSessions.put(s);
  return {pending:false as const,feedback,memories:[],event,results:s.results,interaction:undefined,milestone:undefined};
}
