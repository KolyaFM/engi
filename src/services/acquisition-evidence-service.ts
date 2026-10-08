import type {EngiDB} from '../db/engi-db';
import type {Attempt} from '../lib/engi/study-core/attempts';
import type {TaskContract} from '../lib/engi/study-core/contracts';
import type {GoalMemory} from '../lib/engi/study-core/memory';
import {graduateGoalMemory} from '../lib/engi/study-core/memory';
import {advanceAcquisition,ACQUISITION_GAP_MS,acquisitionKey} from '../lib/engi/study-core/acquisition';
import {readLifecycle,LIFECYCLE_KEY} from './learning-lifecycle-service';
export async function acquisitionBlocks(db:EngiDB,goalIds:string[],now:Date,selfReportAttemptId?:string){
 const ledger=await readLifecycle(db),active=new Map(ledger?.units.filter(u=>u.stage!=='completed').map(u=>[u.goal.id,u]));
 const rows=await db.appMeta.bulkGet(goalIds.map(id=>'studyCore:exposure:'+id));
 if(selfReportAttemptId)for(let i=0;i<rows.length;i++){const exposure=rows[i];if(!exposure)continue;const episode=(await db.appMeta.get('studyCore:episode:'+exposure.value.episodeId))?.value;if(episode?.attemptId===selfReportAttemptId&&episode.phase==='answer-reveal')rows[i]=undefined;}

 return {active,blocked:goalIds.filter((id,i)=>{const unit=active.get(id);return unit&&Math.max(new Date(unit.availableAt).getTime(),rows[i]?new Date(rows[i]!.value.lastVisibleAt).getTime()+ACQUISITION_GAP_MS:0)>now.getTime();})};
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
