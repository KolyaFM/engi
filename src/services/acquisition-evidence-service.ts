import type {EngiDB} from '../db/engi-db';
import type {Attempt} from '../lib/engi/study-core/attempts';
import type {TaskContract} from '../lib/engi/study-core/contracts';
import type {GoalMemory} from '../lib/engi/study-core/memory';
import {graduateGoalMemory} from '../lib/engi/study-core/memory';
import {advanceAcquisition} from '../lib/engi/study-core/acquisition';
import {readLifecycle,LIFECYCLE_KEY} from './learning-lifecycle-service';
export async function acquisitionBlocks(db:EngiDB,goalIds:string[],now:Date,selfReportAttemptId?:string){
 const ledger=await readLifecycle(db),active=new Map(ledger?.units.filter(u=>u.stage!=='completed').map(u=>[u.goal.id,u]));
 // Training progresses through fresh attempts immediately. Hints and same-task
 // corrections remain ineligible; established FSRS keeps its exposure restrictions.
 return {active,blocked:[] as string[]};
}
/** Acquisition, FSRS and error rights are distinct. Only a real final answer seeds new memory. */
export async function applyAcquisitionEvidence(db:EngiDB,attempt:Attempt,contract:TaskContract,previous:GoalMemory[]){
 let ledger=await readLifecycle(db);if(!ledger)return {attempt,graduated:[] as GoalMemory[]};
 const now=new Date(attempt.submittedAt!),blocks=await acquisitionBlocks(db,contract.primaryGoals.map(g=>g.id),now,contract.response.kind==='self-report'?attempt.id:undefined),graduated:GoalMemory[]=[];
 const results=(attempt.results??[]).map(result=>{
  const unit=ledger!.units.find(u=>u.goal.id===result.goalId&&u.stage!=='completed');if(!unit)return result;
  const eligible=(result.credit||result.repairEligible===true)&&!attempt.ineligibleGoalIds.includes(result.goalId)&&!blocks.blocked.includes(result.goalId);
  const next=advanceAcquisition(ledger!,{id:attempt.id,goalId:result.goalId,at:now,correct:result.correct,eligible});
  const after=next.units.find(u=>u.key===unit.key)!;ledger=next;
  const completed=eligible&&after.stage==='completed',old=previous.find(m=>m.goalId===result.goalId);
  if(completed&&!old)graduated.push(graduateGoalMemory(unit.goal,now));
  return {...result,acquisitionCredit:eligible,...(contract.intent==='repair'?{repairEligible:eligible}:{}),acquisitionStageBefore:unit.stage,acquisitionStageAfter:after.stage,credit:completed&&(!old||new Date(old.card.due)<=now)};
 });
 await db.appMeta.put({key:LIFECYCLE_KEY,value:ledger});return {attempt:{...attempt,results},graduated};
}
