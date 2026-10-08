import type {EngiDB,SessionRow} from '../db/engi-db';
import type {Bundle,Memory,Task,Snapshot} from '../lib/engi/types';
import type {GoalMemory} from '../lib/engi/study-core/memory';
import type {ExposureEntry} from '../lib/engi/study-core/exposure';
import {exposureAvailableAt} from '../lib/engi/study-core/exposure';
import {ACTIVE_CARD_LIMIT,ACQUISITION_GAP_MS,acquisitionKey} from '../lib/engi/study-core/acquisition';
import {buildGoalCatalog} from './goal-catalog';
import {ensureDayPlan} from './day-plan-service';
import {ensureLifecycle,lifecycleProjection} from './learning-lifecycle-service';
import {goalProposalPool,materializeGoalProposal} from './goal-proposals';
import {pickFeed} from '../lib/engi/session/candidate-pool';
import {selectRepairWork} from './study-work-service';
import {compileTaskContract} from '../lib/engi/study-core/compiler';
import {groupProposals} from './group-candidates';
/** One source of eligible work: acquisition, due reviews, repair, admission, then safe practice. */
export async function pickLifecycleFeed(db:EngiDB,b:Bundle,enabled:Memory[],s:SessionRow,daily:NonNullable<Snapshot['newLearning']>,introduced:string[],now=Date.now()){
 const catalog=buildGoalCatalog(b,enabled),ledger=await ensureLifecycle(db,catalog,new Date(now));
 const rows=await db.appMeta.bulkGet(catalog.map(e=>'studyCore:memory:'+e.goal.id)),memories=new Map(rows.filter(r=>!!r).map(r=>[r!.value.goalId,r!.value as GoalMemory]));
 const plan=await lifecycleProjection(db,catalog,[...memories.values()],await ensureDayPlan(db,catalog,[...memories.values()],new Date(now),s),undefined,new Date(now));
 await db.appMeta.put({key:'studyCore:lifecycleDayPlan',value:plan});
 const pool=goalProposalPool(b,enabled,s.tag,'mixed'),ids=[...new Set(pool.proposals.flatMap(p=>p.goals.map(g=>g.id)))];
 const exposureRows=await db.appMeta.bulkGet(ids.map(id=>'studyCore:exposure:'+id)),exposures=new Map(exposureRows.filter(r=>!!r).map(r=>[r!.value.goalId,r!.value as ExposureEntry]));
 const active=new Map(ledger.units.filter(u=>u.stage!=='completed').map(u=>[u.key,u])),activeIds=new Set(catalog.filter(e=>!e.suspended).map(e=>e.goal.id));
 const at=(id:string)=>{const goal=catalog.find(e=>e.goal.id===id)?.goal,unit=goal&&active.get(acquisitionKey(goal)),exposure=exposures.get(id);return Math.max(unit?new Date(unit.availableAt).getTime():new Date(memories.get(id)?.card.due??8640000000000000).getTime(),exposure?(unit?new Date(exposure.lastVisibleAt).getTime()+ACQUISITION_GAP_MS:exposureAvailableAt(exposure)):0);};
 const eligible=pool.proposals.filter(p=>p.goals.every(g=>{const u=active.get(acquisitionKey(g));return activeIds.has(g.id)&&(u?u.goal.id===g.id:memories.has(g.id))&&at(g.id)<=now;}));
 const repair=await selectRepairWork(db,b,enabled,s,memories,eligible.length>0,new Set(eligible.flatMap(p=>p.goals.map(acquisitionKey))));
 if(repair){repair.learningLifecycle=1;return {task:repair,intro:undefined};}
 const recent=s.cooldown?.slice(-2).flatMap(t=>t.studyContract?.primaryGoals.map(g=>g.id)??[])??[];
 const owners=(items:Task['items'])=>items.map(i=>i.factId?b.facts.find(f=>f.id===i.factId)?.entityId??i.entityId:i.entityId);
 const lastObjects=new Set(owners(s.cooldown?.at(-1)?.items??[])),recentObjects=new Set((s.cooldown?.slice(-2)??[]).flatMap(t=>owners(t.items)));
 const objectRank=(p:typeof pool.proposals[number])=>Number(owners(p.items).some(id=>lastObjects.has(id)))*3+Number(owners(p.items).some(id=>recentObjects.has(id)));
 const scopedIds=new Set(pool.proposals.flatMap(p=>p.goals.map(g=>g.id))),activeCards=new Set(ledger.units.filter(u=>u.stage!=='completed'&&scopedIds.has(u.goal.id)&&activeIds.has(u.goal.id)).map(u=>u.entityId));
 const introduce=()=>{
  if(s.mode==='practice'||activeCards.size>=ACTIVE_CARD_LIMIT)return;
  const configuration=enabled.map(m=>({...m,bootstrap:undefined,card:{...m.card,due:new Date(now+365*86400000)}}));
  // The lifecycle owns admission; the old composer only materializes the next intro.
  const next=pickFeed(b,configuration,{...s,repairQueue:[],mode:'daily'},{...daily,extraBudget:0,introducedEntityIds:[]},introduced,1);
  if(next.intro&&(next.intro.newProperty||plan.newBudget>0)){s.playRound=undefined;return next;}
 };
 const nextIntroduction=introduce();
 if(nextIntroduction?.intro?.newProperty)return nextIntroduction;
 // Fill the bounded queue when ready work would otherwise chain the last object's properties.
 if(eligible.length&&eligible.every(p=>objectRank(p)>=3)&&nextIntroduction&&!lastObjects.has(nextIntroduction.intro!.entityId))return nextIntroduction;
 const groups=(!s.format||['mixed','match','categorize'].includes(s.format))?groupProposals(eligible,new Set(memories.keys()),3).filter(p=>!s.format||s.format==='mixed'||p.recipe.format===s.format):[];
 const proposals=[...eligible,...groups];
 proposals.sort((a,c)=>{
  const rank=(p:typeof a)=>p.goals.reduce((score,g)=>score+Number(recent.includes(g.id))*10+(active.get(acquisitionKey(g))?.successes??-2),0)/p.goals.length+Number(p.recipe.format!==s.format&&s.format!=='mixed');
  return objectRank(a)-objectRank(c)||rank(a)-rank(c);
 });
 for(const p of proposals){const task=materializeGoalProposal(b,enabled,p,pool.context,s.tag??'all',s.cooldown??[],false,memories);if(task){task.learningLifecycle=1;task.intent='learn';task.reason=p.goals.some(g=>active.has(acquisitionKey(g)))?'bootstrap':'due';return {task,intro:undefined};}}
 const remainingRepair=await selectRepairWork(db,b,enabled,s,memories,false);if(remainingRepair){remainingRepair.learningLifecycle=1;return {task:remainingRepair,intro:undefined};}
 if(nextIntroduction)return nextIntroduction;
 const protectedGoals=new Set([...active.values()].map(u=>u.goal.id)),knownKeys=new Set([...ledger.units.map(u=>u.key),...catalog.filter(e=>memories.has(e.goal.id)).map(e=>acquisitionKey(e.goal))]);
 const games=pool.proposals.filter(p=>p.goals.every(g=>knownKeys.has(acquisitionKey(g))));
 games.sort((a,c)=>objectRank(a)-objectRank(c)||Number(a.goals.some(g=>recent.includes(g.id)))-Number(c.goals.some(g=>recent.includes(g.id))));
 
 for(const p of games){const task=materializeGoalProposal(b,enabled,p,pool.context,s.tag??'all',s.cooldown??[],true,memories);if(!task)continue;
  task.learningLifecycle=1;task.intent='practice';task.reason='game';const contract=compileTaskContract(b,task);
  if(![...contract.shownClaims,...contract.feedbackClaims].some(c=>c.revealsGoalIds.some(id=>protectedGoals.has(id))))return {task,intro:undefined};
 }
 const dates=[...active.values()].filter(u=>activeIds.has(u.goal.id)).map(u=>at(u.goal.id)).filter(t=>t>now);
 return {task:undefined,intro:undefined,exhausted:true as const,waitingUntil:dates.length?new Date(Math.min(...dates)).toISOString():undefined};
}
