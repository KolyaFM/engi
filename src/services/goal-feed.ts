import type {EngiDB,SessionRow} from '../db/engi-db';
import type {Bundle,Memory,Task,Snapshot} from '../lib/engi/types';
import type {GoalMemory} from '../lib/engi/study-core/memory';
import {DISCLOSURE_COOLDOWN_MS,type ExposureEntry} from '../lib/engi/study-core/exposure';
import {goalCandidates} from './goal-candidates';
import {pickFeed} from '../lib/engi/session/candidate-pool';
import {buildGoalCatalog} from './goal-catalog';
import {ensureDayPlan} from './day-plan-service';
import {selectGoalCandidate,type SelectionCandidate} from '../lib/engi/session/goal-selector';
import {newAdmission} from '../lib/engi/study-core/day-plan';
import {interactionFamily} from '../lib/engi/session/interaction-family';
import {groupCandidates,groupProposals} from './group-candidates';
import {goalProposalPool,materializeGoalProposal} from './goal-proposals';

export {goalCandidates} from './goal-candidates';
export async function pickGoalFeed(db:EngiDB,b:Bundle,enabled:Memory[],s:SessionRow,daily:NonNullable<Snapshot['newLearning']>,introduced:string[],now=Date.now(),materializer=materializeGoalProposal){
 if(['timeline','sort','missing'].includes(s.format??''))return pickGoalFeedEager(db,b,enabled,s,daily,introduced,now);
 const catalog=buildGoalCatalog(b,enabled),rows=await db.appMeta.bulkGet(catalog.map(e=>'studyCore:memory:'+e.goal.id));
 const memory=new Map(rows.filter(r=>!!r).map(r=>[r!.value.goalId,r!.value as GoalMemory])),known=new Set(memory.keys());
 const plan=await ensureDayPlan(db,catalog,[...memory.values()],new Date(now));
 const pending=new Set([...plan.repeat,...plan.reinforce].filter(r=>r.status==='pending').map(r=>r.goalId));
 const newLeft=Math.max(0,plan.newTarget-plan.newGoalIds.length),newSlots=Math.min(newLeft,newAdmission(plan).available);
 const pool=goalProposalPool(b,enabled,s.tag,s.format),ids=[...new Set(pool.proposals.flatMap(p=>p.goals.map(g=>g.id)))];
 const exposureRows=await db.appMeta.bulkGet(ids.map(id=>'studyCore:exposure:'+id));
 const exposures=new Map(exposureRows.filter(r=>!!r).map(r=>[r!.value.goalId,r!.value as ExposureEntry]));
 let waitingUntil=Infinity;
 const available=pool.proposals.filter(p=>{
  if(s.mode==='practice')return true;
  if(p.goals.some(g=>memory.has(g.id)&&!pending.has(g.id))||p.goals.filter(g=>!memory.has(g.id)).length>newSlots)return false;
  const at=Math.max(...p.goals.map(g=>Math.max(memory.has(g.id)?new Date(memory.get(g.id)!.card.due).getTime():0,
   exposures.has(g.id)?new Date(exposures.get(g.id)!.lastVisibleAt).getTime()+DISCLOSURE_COOLDOWN_MS:0)));
  waitingUntil=Math.min(waitingUntil,at);return at<=now;
 });
 available.push(...groupProposals(available,known,s.mode==='practice'?3:newSlots));
 const owners=new Map(b.facts.map(f=>[f.id,f.entityId]));
 const selectorKey=s.mode==='practice'?'studyCore:practiceSelector':'studyCore:goalSelector',prior=(await db.appMeta.get(selectorKey))?.value;
 while(available.length){
  const descriptors:SelectionCandidate[]=available.map(p=>{
   const due=p.goals.filter(g=>memory.has(g.id)),objectIds=[...new Set(p.items.map(i=>i.factId?owners.get(i.factId)??i.entityId:i.entityId))];
   return {key:JSON.stringify([p.goals.map(g=>g.id).sort(),objectIds,p.recipe.format]),goalIds:p.goals.map(g=>g.id),objectIds,
    format:p.group?p.recipe.format:['choice','match','categorize'].includes(p.recipe.format)?'choice':p.recipe.format,
    kind:s.mode==='practice'?'practice':due.length?'due':'new',overdueMs:due.length?Math.max(...due.map(g=>now-new Date(memory.get(g.id)!.card.due).getTime())):0,
    mistake:due.some(g=>memory.get(g.id)!.lastCorrect===false),reinforcement:due.some(g=>Number(memory.get(g.id)!.card.state)!==2)};
  });
  // Retry from the unchanged prior state. Failed construction is not a selection or an answer.
  const picked=selectGoalCandidate(descriptors,prior,plan.day,{newSlotsLeft:newLeft}),proposal=available[picked.index];
  const task=materializer(b,enabled,proposal,pool.context,s.tag??'all',s.cooldown??[],s.mode==='practice');
  if(!task){available.splice(picked.index,1);continue;}
  task.reason=s.mode==='practice'?'practice':descriptors[picked.index].kind==='due'?'due':'new';
  await db.appMeta.put({key:selectorKey,value:picked.state});return {task,intro:undefined,waitingUntil:undefined};
 }
 const configuration=enabled.map(m=>({...m,bootstrap:undefined,card:{...m.card,due:new Date(now+365*86400000)}})),next=pickFeed(b,configuration,s,daily,introduced);
 if(next.intro&&newSlots>0)return {...next,waitingUntil:undefined};
 return {task:undefined,intro:undefined,exhausted:true as const,waitingUntil:Number.isFinite(waitingUntil)&&waitingUntil>now?new Date(waitingUntil).toISOString():undefined};
}
/** Retained as the diagnostic-format path and a reference for equivalence checks. */
export async function pickGoalFeedEager(db:EngiDB,b:Bundle,enabled:Memory[],s:SessionRow,daily:NonNullable<Snapshot['newLearning']>,introduced:string[],now=Date.now()){
 const catalog=buildGoalCatalog(b,enabled),allMemory=await db.appMeta.bulkGet(catalog.map(e=>'studyCore:memory:'+e.goal.id));
 const plan=await ensureDayPlan(db,catalog,allMemory.filter(r=>!!r).map(r=>r!.value),new Date(now));
 const pending=new Set([...plan.repeat,...plan.reinforce].filter(r=>r.status==='pending').map(r=>r.goalId));
 const newLeft=Math.max(0,plan.newTarget-plan.newGoalIds.length);
 const admission=newAdmission(plan),newSlots=Math.min(newLeft,admission.available);
 const known=new Set(allMemory.filter(r=>!!r).map(r=>r!.value.goalId));
 // Conservative pruning only: keep targets of every potentially admissible goal.
 // Keep the complete enabled list for set-member validation and distractors.
 const targets=s.mode==='practice'?undefined:new Set(catalog.filter(e=>!e.suspended&&(known.has(e.goal.id)?pending.has(e.goal.id):newSlots>0)).flatMap(e=>e.targetIds));
 const tasks=goalCandidates(b,enabled,s.tag,s.format,s.cooldown,targets),ids=[...new Set(tasks.flatMap(t=>t.studyContract?.primaryGoals.map(g=>g.id)??[]))];
 const memoryRows=allMemory;
 const exposureRows=await db.appMeta.bulkGet(ids.map(id=>'studyCore:exposure:'+id));
 const memory=new Map(memoryRows.filter(r=>!!r).map(r=>[r!.value.goalId,r!.value as GoalMemory]));
 const exposures=new Map(exposureRows.filter(r=>!!r).map(r=>[r!.value.goalId,r!.value as ExposureEntry]));
 let waitingUntil=Infinity;
 const available=tasks.filter(t=>{
  if(s.mode==='practice'){t.practice=true;return true;}
  const goals=t.studyContract?.primaryGoals??[];if(!goals.length)return true;
  if(goals.some(g=>memory.has(g.id)&&!pending.has(g.id))||goals.filter(g=>!memory.has(g.id)).length>newSlots)return false;
  const ready=goals.map(g=>Math.max(memory.has(g.id)?new Date(memory.get(g.id)!.card.due).getTime():0,
   exposures.has(g.id)?new Date(exposures.get(g.id)!.lastVisibleAt).getTime()+DISCLOSURE_COOLDOWN_MS:0));
  // Atomic and set tasks have one goal. Mixed-due grouped mappings remain unsupported here.
  const at=Math.max(...ready);waitingUntil=Math.min(waitingUntil,at);return at<=now;
 });
 available.push(...groupCandidates(b,available,known,s.mode==='practice'?3:newSlots));
 if(available.length){
  const owners=new Map(b.facts.map(f=>[f.id,f.entityId]));
  const descriptors:SelectionCandidate[]=available.map(t=>{
   const goals=t.studyContract?.primaryGoals??[],due=goals.filter(g=>memory.has(g.id));
   const objectIds=[...new Set(t.items.map(i=>i.factId?owners.get(i.factId)??i.entityId:i.entityId))];
   return {key:JSON.stringify([goals.map(g=>g.id).sort(),objectIds,t.recipe.format]),goalIds:goals.map(g=>g.id),objectIds,format:interactionFamily(t),
    kind:t.practice||!goals.length?'practice':due.length?'due':'new',
    overdueMs:due.length?Math.max(...due.map(g=>now-new Date(memory.get(g.id)!.card.due).getTime())):0,
    mistake:due.some(g=>memory.get(g.id)!.lastCorrect===false),reinforcement:due.some(g=>Number(memory.get(g.id)!.card.state)!==2)};
  });
  const selectorKey=s.mode==='practice'?'studyCore:practiceSelector':'studyCore:goalSelector',prior=(await db.appMeta.get(selectorKey))?.value;
  const picked=selectGoalCandidate(descriptors,prior,plan.day,{newSlotsLeft:newLeft});await db.appMeta.put({key:selectorKey,value:picked.state});
  const task=available[picked.index];task.reason=task.practice?'practice':descriptors[picked.index].kind==='due'?'due':'new';
  // Preparation owns persistence of the immutable contract and attempt.
  task.studyContract=undefined;return {task,intro:undefined,waitingUntil:undefined};}
 const configuration=enabled.map(m=>({...m,bootstrap:undefined,card:{...m.card,due:new Date(now+365*86400000)}}));
 const next=pickFeed(b,configuration,s,daily,introduced);
 if(next.intro&&newSlots>0)return {...next,waitingUntil:undefined};
 return {task:undefined,intro:undefined,exhausted:true as const,waitingUntil:Number.isFinite(waitingUntil)&&waitingUntil>now?new Date(waitingUntil).toISOString():undefined};
}
