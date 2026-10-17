import type {EngiDB} from '../db/engi-db';
import type {Attempt} from '../lib/engi/study-core/attempts';
import type {TaskContract} from '../lib/engi/study-core/contracts';
import {recordIntervalEvidence,type IntervalEvidence} from '../lib/engi/study-core/interval-evidence';
const prefix='studyCore:intervalEvidence:';
export async function readIntervalEvidence(db:EngiDB,ids:string[]){const rows=await db.appMeta.bulkGet(ids.map(id=>prefix+id));return new Map(rows.flatMap(r=>r?[[r.value.goalId,r.value as IntervalEvidence] as const]:[]));}
/** Disclosures are not successful attempts: even an inferred final pair must wait after seeing its years. */
export async function recordIntervalDisclosure(db:EngiDB,contract:TaskContract,goalIds:string[],at:string){
 if(!contract.intervalEvidence)return;
 for(const g of contract.primaryGoals.filter(g=>goalIds.includes(g.id))){const key=prefix+g.id,old=(await db.appMeta.get(key))?.value as IntervalEvidence|undefined,base=old?.revision===g.revision?old:{goalId:g.id,revision:g.revision,attemptIds:[]};await db.appMeta.put({key,value:{...base,lastDisclosureAt:base.lastDisclosureAt&&base.lastDisclosureAt>at?base.lastDisclosureAt:at}});}
}
export async function saveIntervalEvidence(db:EngiDB,attempt:Attempt,contract:TaskContract){
 if(!contract.intervalEvidence||attempt.phase==='stale')return;
 for(const result of attempt.results??[]){if(!result.intervalCredit)continue;const g=contract.primaryGoals.find(g=>g.id===result.goalId);if(!g)continue;
  const key=prefix+g.id,previous=(await db.appMeta.get(key))?.value;
  await db.appMeta.put({key,value:recordIntervalEvidence(previous,{taskId:attempt.id,goalId:g.id,revision:g.revision,kind:contract.intervalEvidence.kind==='endpoint'?contract.intervalEvidence.edge:'context',correct:result.correct,at:attempt.submittedAt??new Date().toISOString()})});
 }
}
