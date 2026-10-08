import {readLifecycle} from './learning-lifecycle-service';
import {ACQUISITION_GAP_MS,ACTIVE_CARD_LIMIT} from '../lib/engi/study-core/acquisition';
import type {EngiDB,SessionRow} from '../db/engi-db';
import type {Bundle,Memory} from '../lib/engi/types';
import type {GoalMemory} from '../lib/engi/study-core/memory';
import type {Attempt} from '../lib/engi/study-core/attempts';
import type {TaskContract} from '../lib/engi/study-core/contracts';
import {newAdmission,type GoalDayPlan} from '../lib/engi/study-core/day-plan';
import {knowledgeMistakeKey} from '../lib/engi/study-core/mistakes';
import {exposureAvailableAt,type ExposureEntry} from '../lib/engi/study-core/exposure';
import {buildGoalCatalog} from './goal-catalog';
import {goalProposalPool} from './goal-proposals';
import {admitStudyCandidates} from '../lib/engi/session/study-availability';
import Dexie from 'dexie';

type CandidateTrace={goalId:string;knowledge:string;state:string;dueAt?:string;exposureUntil?:string;blocks:string[]};
export type StudyTraceEvent={at:string;kind:'selection'|'answer';sessionId?:string;taskId?:string;intent?:string;format?:string;reason?:string;objects?:string[];goals?:string[];[key:string]:unknown};
type Buffer={limit:number;events:StudyTraceEvent[]};
const buffers=new WeakMap<EngiDB,Buffer>();
/** Explicitly enabled, bounded and local. No persistence, content text, answer values or network. */
export function startStudyTrace(db:EngiDB,limit=300){buffers.set(db,{limit:Math.min(1000,Math.max(1,Math.floor(limit)||300)),events:[]});}
export function stopStudyTrace(db:EngiDB){buffers.delete(db);}
export function studyTraceReport(db:EngiDB){return structuredClone(buffers.get(db)?.events??[]);}
function append(db:EngiDB,event:StudyTraceEvent){const buffer=buffers.get(db);if(!buffer)return;const commit=()=>{if(buffers.get(db)!==buffer)return;buffer.events.push(event);if(buffer.events.length>buffer.limit)buffer.events.splice(0,buffer.events.length-buffer.limit);};if(Dexie.currentTransaction)Dexie.currentTransaction.on('complete',commit);else commit();}
export async function traceStudySelection(db:EngiDB,b:Bundle,enabled:Memory[],session:SessionRow,now=Date.now()){
 if(!buffers.has(db))return;
 const plan=(await db.appMeta.get(session.learningLifecycle?'studyCore:lifecycleDayPlan':'studyCore:dayPlan'))?.value as GoalDayPlan|undefined;if(!plan)return;
 const catalog=buildGoalCatalog(b,enabled),rows=await db.appMeta.bulkGet(catalog.map(e=>'studyCore:memory:'+e.goal.id));
 const memories=new Map(rows.filter(r=>!!r).map(r=>[r!.value.goalId,r!.value as GoalMemory]));
 const exposureRows=await db.appMeta.bulkGet(catalog.map(e=>'studyCore:exposure:'+e.goal.id));
 const exposures=new Map(exposureRows.filter(r=>!!r).map(r=>[r!.value.goalId,r!.value as ExposureEntry]));
 const pool=goalProposalPool(b,enabled,session.tag,session.format),proposed=new Set(pool.proposals.flatMap(p=>p.goals.map(g=>g.id)));
 const pending=new Set([...plan.repeat,...plan.reinforce].filter(r=>r.status==='pending').map(r=>r.goalId));
 const lifecycle=session.learningLifecycle?await readLifecycle(db):undefined;
 const activeUnits=new Map(lifecycle?.units.filter(u=>u.stage!=='completed').map(u=>[u.goal.id,u]));
 const admission=newAdmission(plan),newLeft=Math.max(0,plan.newTarget-plan.newGoalIds.length),candidates:CandidateTrace[]=[];
 for(const entry of catalog){const g=entry.goal,m=memories.get(g.id),ex=exposures.get(g.id),blocks:string[]=[];
  if(entry.suspended)blocks.push('suspended');if(!proposed.has(g.id))blocks.push('outside-proposal-pool');
  if(lifecycle){const unit=activeUnits.get(g.id),key=knowledgeMistakeKey(g),required=lifecycle.units.find(u=>u.key===key&&u.stage!=='completed');if(unit){if(new Date(unit.availableAt).getTime()>now)blocks.push('acquisition-gap');}else if(required)blocks.push('other-required-skill');else if(!m)blocks.push('not-admitted');else if(new Date(m.card.due).getTime()>now)blocks.push('not-due');}
  else if(!m){if(!newLeft)blocks.push('daily-budget');if(admission.held)blocks.push('learning-capacity');}
  else {if(!pending.has(g.id))blocks.push('no-pending-obligation');if(new Date(m.card.due).getTime()>now)blocks.push('not-due');}
  if(ex&&(activeUnits.has(g.id)?new Date(ex.lastVisibleAt).getTime()+ACQUISITION_GAP_MS:exposureAvailableAt(ex))>now)blocks.push('recent-disclosure');
  candidates.push({goalId:g.id,knowledge:knowledgeMistakeKey(g),state:activeUnits.get(g.id)?.stage??(!m?ex?'introduced':'unseen':Number(m.card.state)===1?'learning':Number(m.card.state)===3?'relearning':'review'),dueAt:m?new Date(m.card.due).toISOString():undefined,exposureUntil:ex?new Date(exposureAvailableAt(ex)).toISOString():undefined,blocks});
 }
 const admitted=admitStudyCandidates(pool.proposals,p=>p.goals,plan,memories,exposures,now);
 const task=session.tasks[session.currentPosition],primary=task?.studyContract?.primaryGoals??[];
 append(db,{at:new Date(now).toISOString(),kind:'selection',sessionId:session.id,taskId:task?.id,intent:task?.intent,format:task?.recipe.format,reason:task?.reason,
  objects:task?.items.map(i=>i.entityId)??(session.intro?[session.intro.entityId]:[]),goals:primary.map(g=>g.id),knowledge:primary.map(knowledgeMistakeKey),intro:!!session.intro,exhausted:!!session.exhausted,
  counters:{newLeft,activeLearning:plan.learningGoalIds?.length??0,activeFirstChecks:admission.active,capacity:admission.limit,newDone:plan.newGoalIds.length,newTarget:plan.newTarget,mistakes:plan.mistakes?.length??0},
  ordinaryAvailable:lifecycle?candidates.filter(c=>!c.blocks.length).length:admitted.available.length,completed:session.completedCount??0,acquisition:lifecycle?{activeObjects:new Set([...activeUnits.values()].map(u=>u.entityId)).size,capacity:ACTIVE_CARD_LIMIT,units:[...activeUnits.values()].map(u=>({key:u.key,stage:u.stage,successes:u.successes,availableAt:u.availableAt}))}:undefined,round:structuredClone(session.playRound),lastAutoNewAt:session.lastAutoNewAt,
  candidateCount:candidates.length,candidates:candidates.slice(0,160),truncated:candidates.length>160});
}
export async function traceStudyAnswer(db:EngiDB,contract:TaskContract,attempt:Attempt,before:GoalMemory[]){
 if(!buffers.has(db))return;
 const rows=await db.appMeta.bulkGet(contract.primaryGoals.map(g=>'studyCore:memory:'+g.id)),previous=new Map(before.map(m=>[m.goalId,m]));
 append(db,{at:attempt.submittedAt??new Date().toISOString(),kind:'answer',taskId:attempt.taskId,intent:contract.intent,goals:contract.primaryGoals.map(g=>g.id),
  results:attempt.results?.map(r=>({goalId:r.goalId,correct:r.correct,credit:r.credit,acquisitionCredit:r.acquisitionCredit,acquisitionStageBefore:r.acquisitionStageBefore,acquisitionStageAfter:r.acquisitionStageAfter,repairEligible:r.repairEligible})),
  memory:rows.filter(r=>!!r).map(r=>{const m=r!.value as GoalMemory;return {goalId:m.goalId,state:Number(m.card.state),dueAt:new Date(m.card.due).toISOString(),independentAttempts:m.independentAttempts,attemptsDelta:m.independentAttempts-(previous.get(m.goalId)?.independentAttempts??0)};})});
}
