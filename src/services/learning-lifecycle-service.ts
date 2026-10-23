import {readGoalStateRows} from './goal-state-rows';
import {propertyWorkload} from '../lib/engi/knowledge/property-workload';
import type {EngiDB} from '../db/engi-db';
import type {GoalCatalogEntry} from '../lib/engi/knowledge/goal-progress';
import type {GoalMemory} from '../lib/engi/study-core/memory';
import type {GoalDayPlan} from '../lib/engi/study-core/day-plan';
import {dayBoundary} from '../lib/engi/study-core/day-plan';
import {acquisitionKey,admitAcquisition,emptyLifecycle,learningLifecycleSchema,ACQUISITION_CONFIRMATION_MS,propertyKey,type LearningLifecycle} from '../lib/engi/study-core/acquisition';
import {INTRO_DISCLOSURE_COOLDOWN_MS} from '../lib/engi/study-core/exposure';
import {readStudyPreferences} from './study-preferences-service';
export const LIFECYCLE_KEY='studyCore:learningLifecycle';
export async function readLifecycle(db:EngiDB):Promise<LearningLifecycle|undefined>{const row=await db.appMeta.get(LIFECYCLE_KEY);return row?learningLifecycleSchema.parse(row.value):undefined;}
/** Versioned, idempotent adoption. Existing FSRS rows are never rewritten here. */
export async function ensureLifecycle(db:EngiDB,catalog:GoalCatalogEntry[],now=new Date()){
 let ledger=await readLifecycle(db);if(ledger){let dirty=false;
  const byKey=new Map<string,GoalCatalogEntry[]>(),byEntity=new Map<string,GoalCatalogEntry[]>(),unitsByEntity=new Map<string,typeof ledger.units>();
  for(const e of catalog)if(!e.suspended){const key=acquisitionKey(e.goal),entries=byKey.get(key)??[];entries.push(e);byKey.set(key,entries);for(const id of e.entityIds){const entries=byEntity.get(id)??[];entries.push(e);byEntity.set(id,entries);}}
  for(const u of ledger.units){const units=unitsByEntity.get(u.entityId)??[];units.push(u);unitsByEntity.set(u.entityId,units);}
  for(const unit of ledger.units.filter(u=>u.stage!=='completed')){
   // Adopt unfinished zero-gap confirmations without rewriting completed FSRS memory.
   if(unit.stage==='confirmation'&&unit.lastAttemptAt){const due=new Date(unit.lastAttemptAt).getTime()+ACQUISITION_CONFIRMATION_MS;if(new Date(unit.availableAt).getTime()<due){unit.availableAt=new Date(due).toISOString();dirty=true;}}
   const candidates=byKey.get(unit.key)??[];
   if(candidates.length&&!candidates.some(e=>e.goal.id===unit.goal.id)){
    dirty=true;
    unit.goal=(candidates.find(e=>e.goal.skill===unit.goal.skill)??candidates[0]).goal;
    // A success in recognition cannot confirm a newly required recall skill.
    unit.successes=0;unit.stage='first-check';unit.availableAt=now.toISOString();
   }
  }
  const keys=new Set(ledger.units.map(u=>u.key));
  for(const card of ledger.cards){
   const prior=unitsByEntity.get(card.entityId)??[],base=(g:typeof prior[number]['goal'])=>JSON.stringify([g.knowledge.kind,g.knowledge.key,g.direction,g.precision]);
   const revisions=new Map<string,Set<string>>();for(const u of prior){const key=base(u.goal),values=revisions.get(key)??new Set<string>();values.add(u.goal.revision);revisions.set(key,values);}
   const changed=(byEntity.get(card.entityId)??[]).filter(e=>{const old=revisions.get(base(e.goal));return old&&([...old].some(r=>r!==e.goal.revision))&&!keys.has(acquisitionKey(e.goal));});
   if(changed.length){dirty=true;ledger=admitAcquisition(ledger,card.entityId,changed.map(e=>e.goal),now,'migration');for(const e of changed)keys.add(acquisitionKey(e.goal));}
  }
  if(dirty)await db.appMeta.put({key:LIFECYCLE_KEY,value:ledger});return ledger;
 }
 const preferences=(await db.appMeta.get('studyPreferences'))?.value;
 if(preferences?.newCardsPerDay===undefined)await db.appMeta.put({key:'studyPreferences',value:{...await readStudyPreferences(db),newCardsPerDay:10}});
 ledger=emptyLifecycle();
 const rows=await readGoalStateRows(db,catalog.map(e=>e.goal.id),'memory'),memories=new Map(rows.filter(r=>!!r).map(r=>[r!.value.goalId,r!.value as GoalMemory]));
 const legacyTargets=new Set((await db.learningState.toArray()).filter(r=>!r.payload.legacyOf).map(r=>r.id));
 const exposures=await readGoalStateRows(db,catalog.map(e=>e.goal.id),'exposure');
 const disclosedKeys=new Set(catalog.filter((e,i)=>!!exposures[i]||memories.has(e.goal.id)||e.targetIds.some(id=>legacyTargets.has(id))).map(e=>acquisitionKey(e.goal)));
 const introduced=new Set<string>((await db.appMeta.get('introducedEntities'))?.value??[]);
 for(const entry of catalog)if(memories.has(entry.goal.id))for(const id of entry.entityIds)introduced.add(id);
 for(const entityId of introduced){
  const entries=catalog.filter(e=>!e.suspended&&e.entityIds.includes(entityId)&&disclosedKeys.has(acquisitionKey(e.goal))),groups=new Map<string,GoalCatalogEntry>();
  for(const e of entries){const key=acquisitionKey(e.goal),old=groups.get(key);if(!old||memories.has(e.goal.id)&&!memories.has(old.goal.id)||!memories.has(old.goal.id)&&e.goal.skill==='recognition')groups.set(key,e);}
  ledger=admitAcquisition(ledger,entityId,[...groups.values()].map(e=>e.goal),now,'migration');
  for(const u of ledger.units.filter(u=>u.entityId===entityId)){
   const memory=memories.get(u.goal.id);if(!memory){u.availableAt=now.toISOString();continue;}
   if([2,3].includes(Number(memory.card.state))){u.stage='completed';u.successes=2;u.completedAt=new Date(memory.card.last_review??now).toISOString();}
   else {u.requiredSuccesses=memory.independentSuccesses>0?1:2;u.availableAt=now.toISOString();}
  }
 }
 const daily=(await db.appMeta.get('newLearning'))?.value;
 if(daily?.day===dayBoundary(now).day)for(const c of ledger.cards)if(daily.introducedEntityIds?.includes(c.entityId)){c.source='daily';c.introducedAt=now.toISOString();}
 await db.appMeta.put({key:LIFECYCLE_KEY,value:ledger});return ledger;
}
export async function lifecycleProjection(db:EngiDB,catalog:GoalCatalogEntry[],memories:GoalMemory[],plan:GoalDayPlan,scope?:Set<string>,now=new Date(),snapshot?:LearningLifecycle){
 const ledger=snapshot??await readLifecycle(db);if(!ledger)return plan;
 const {relevant,activeGoalIds,learning,repeats}=propertyWorkload(catalog,memories,ledger,scope,now.getTime());
 const memoryIds=new Set(memories.map(m=>m.goalId)),introduced=new Set(ledger.cards.map(c=>c.entityId)),knownObjects=new Set(catalog.filter(e=>memoryIds.has(e.goal.id)).flatMap(e=>e.entityIds));
 const fresh=new Set(relevant.flatMap(e=>e.entityIds).filter(id=>!introduced.has(id)&&!knownObjects.has(id)));
 const {newCardsPerDay}=await readStudyPreferences(db),today=ledger.cards.filter(c=>c.source==='daily'&&dayBoundary(new Date(c.introducedAt)).day===dayBoundary(now).day),left=Math.max(0,newCardsPerDay-today.length),newCount=Math.min(left,fresh.size);
 const dates=[...learning.map(u=>new Date(u.availableAt).getTime()),...memories.filter(m=>activeGoalIds.has(m.goalId)).map(m=>new Date(m.card.due).getTime())].filter(t=>t>now.getTime());
 return {...plan,lifecycle:true,dailyTarget:Math.min(newCardsPerDay,today.length+fresh.size),newBudget:newCardsPerDay,newTarget:today.length+newCount,newGoalIds:today.map(c=>c.entityId),learningGoalIds:learning.map(u=>u.goal.id),admissionGoalIds:[],
  workload:{new:newCount,learning:learning.length,repeat:repeats.size,mistakes:new Set(plan.mistakes?.map(m=>propertyKey(m.goal))).size},available:{new:newCount,reinforce:learning.filter(u=>new Date(u.availableAt)<=now).length,repeat:repeats.size},
  repeat:[...repeats.values()].map(m=>({goalId:m.goalId,dueAt:new Date(m.card.due).toISOString(),status:'pending' as const,reason:'review' as const})),reinforce:learning.map(u=>({goalId:u.goal.id,dueAt:u.availableAt,status:'pending' as const,reason:'learning' as const})),
  nextAvailabilityAt:dates.length?new Date(Math.min(...dates)).toISOString():undefined};
}
export async function acceptLifecycleIntro(db:EngiDB,catalog:GoalCatalogEntry[],entityId:string,targetIds:string[],shownGoalIds:string[],now=new Date(),skill:'recognition'|'recall'='recognition'){
 const ledger=await ensureLifecycle(db,catalog,now),known=(await readGoalStateRows(db,catalog.map(e=>e.goal.id),'memory')).filter(r=>!!r).map(r=>r!.value as GoalMemory);
 const shown=new Set(shownGoalIds),targets=new Set(targetIds),entries=catalog.filter(e=>!e.suspended&&e.entityIds.includes(entityId)&&e.targetIds.some(id=>targets.has(id))&&shown.has(e.goal.id));
 const {newCardsPerDay}=await readStudyPreferences(db),dailyCount=ledger.cards.filter(c=>c.source==='daily'&&dayBoundary(new Date(c.introducedAt)).day===dayBoundary(now).day).length;
 const next=admitAcquisition(ledger,entityId,entries.map(e=>e.goal),now,dailyCount<newCardsPerDay?'daily':'extra',skill);
 for(const u of next.units){const memory=known.find(m=>m.goalId===u.goal.id);if(memory&&Number(memory.card.state)===2){u.stage='completed';u.successes=u.requiredSuccesses;u.completedAt=new Date(memory.card.last_review??now).toISOString();}}
 await db.appMeta.put({key:LIFECYCLE_KEY,value:next});
 for(const id of shown)await db.appMeta.put({key:'studyCore:exposure:'+id,value:{goalId:id,lastVisibleAt:now.toISOString(),episodeId:'accepted:'+entityId+':'+now.toISOString(),cooldownMs:INTRO_DISCLOSURE_COOLDOWN_MS}});
 return next;
}
