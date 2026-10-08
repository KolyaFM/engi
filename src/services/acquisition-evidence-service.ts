import type {EngiDB} from '../db/engi-db';
import type {Attempt} from '../lib/engi/study-core/attempts';
import type {TaskContract} from '../lib/engi/study-core/contracts';
import type {GoalMemory} from '../lib/engi/study-core/memory';
import {graduateGoalMemory} from '../lib/engi/study-core/memory';
import {advanceAcquisition,ACQUISITION_CONFIRMATION_MS} from '../lib/engi/study-core/acquisition';
import {readLifecycle,LIFECYCLE_KEY} from './learning-lifecycle-service';
export async function acquisitionBlocks(db:EngiDB,goalIds:string[],now:Date,selfReportAttemptId?:string){
 const ledger=await readLifecycle(db),active=new Map(ledger?.units.filter(u=>u.stage!=='completed').map(u=>[u.goal.id,u]));
 // A future confirmation can be practised, but cannot acquire independent credit.
 const blocked:string[]=[];
 for(const id of goalIds){const unit=active.get(id);if(!unit)continue;
  if(new Date(unit.availableAt)>now){blocked.push(id);continue;}
  if(unit.stage==='confirmation'){
   const ex=(await db.appMeta.get('studyCore:exposure:'+id))?.value;
   const episode=ex&&selfReportAttemptId?(await db.appMeta.get('studyCore:episode:'+ex.episodeId))?.value:undefined;
   const ownReveal=!!selfReportAttemptId&&episode?.attemptId===selfReportAttemptId;
   if(ex&&!ownReveal&&new Date(ex.lastVisibleAt).getTime()+ACQUISITION_CONFIRMATION_MS>now.getTime())blocked.push(id);
  }
 }
 return {active,blocked};
}
/** Acquisition, FSRS and error rights are distinct. Only a real final answer seeds new memory. */
export async function applyAcquisitionEvidence(db:EngiDB,attempt:Attempt,contract:TaskContract,previous:GoalMemory[]){
 let ledger=await readLifecycle(db);if(!ledger)return {attempt,graduated:[] as GoalMemory[]};
 const now=new Date(attempt.submittedAt!),blocks=await acquisitionBlocks(db,contract.primaryGoals.map(g=>g.id),now,contract.response.kind==='self-report'?attempt.id:undefined),graduated:GoalMemory[]=[];
 if(contract.contextual){const next=structuredClone(ledger),results=(attempt.results??[]).map(result=>{
  const unit=next.units.find(u=>u.goal.id===result.goalId&&u.stage==='first-check');
  const eligible=!!unit&&!contract.practice&&result.correct&&!attempt.ineligibleGoalIds.includes(result.goalId)&&!blocks.blocked.includes(result.goalId)&&!unit.attemptIds.includes(attempt.id);
  if(eligible){unit!.contextEvidence=[...unit!.contextEvidence??[],{taskId:contract.id,at:now.toISOString(),kind:contract.contextual!.kind,peers:contract.visibleEntities,threshold:contract.contextual!.threshold}].slice(-20);unit!.attemptIds.push(attempt.id);unit!.stage='confirmation';unit!.requiredSuccesses=1;unit!.successes=0;unit!.lastAttemptAt=now.toISOString();unit!.availableAt=new Date(now.getTime()+ACQUISITION_CONFIRMATION_MS).toISOString();}
  return {...result,credit:false,contextCredit:eligible};
 });await db.appMeta.put({key:LIFECYCLE_KEY,value:next});return {attempt:{...attempt,results},graduated};}
 const results=(attempt.results??[]).map(result=>{
  const unit=ledger!.units.find(u=>u.goal.id===result.goalId&&u.stage!=='completed');if(!unit)return result;
  const eligible=!contract.practice&&(result.credit||result.repairEligible===true)&&!attempt.ineligibleGoalIds.includes(result.goalId)&&!blocks.blocked.includes(result.goalId);
  const next=advanceAcquisition(ledger!,{id:attempt.id,goalId:result.goalId,at:now,correct:result.correct,eligible});
  const after=next.units.find(u=>u.key===unit.key)!;ledger=next;
  const completed=eligible&&after.stage==='completed',old=previous.find(m=>m.goalId===result.goalId);
  if(completed&&!old)graduated.push(graduateGoalMemory(unit.goal,now));
  return {...result,acquisitionCredit:eligible,...(contract.intent==='repair'?{repairEligible:eligible}:{}),acquisitionStageBefore:unit.stage,acquisitionStageAfter:after.stage,credit:completed&&(!old||new Date(old.card.due)<=now)};
 });
 await db.appMeta.put({key:LIFECYCLE_KEY,value:ledger});return {attempt:{...attempt,results},graduated};
}
