import type {EngiDB,SessionRow} from '../db/engi-db';
import type {Bundle,Memory,Task,Snapshot} from '../lib/engi/types';
import type {GoalMemory} from '../lib/engi/study-core/memory';
import type {ExposureEntry} from '../lib/engi/study-core/exposure';
import {exposureAvailableAt} from '../lib/engi/study-core/exposure';
import {ACQUISITION_CONFIRMATION_MS,acquisitionKey} from '../lib/engi/study-core/acquisition';
import {shouldIntroduce,chooseWorkLane,selectionTie,dueTurnsSinceFirstCheck} from '../lib/engi/session/continuous-feed-policy';
import {buildGoalCatalog} from './goal-catalog';
import {ensureDayPlan} from './day-plan-service';
import {ensureLifecycle,lifecycleProjection} from './learning-lifecycle-service';
import {goalProposalPool,materializeGoalProposal} from './goal-proposals';
import {pickFeed} from '../lib/engi/session/candidate-pool';
import {selectRepairWork} from './study-work-service';
import {compileTaskContract} from '../lib/engi/study-core/compiler';
import {groupProposals} from './group-candidates';
import {chronologyPractice} from './chronology-practice';
/** One source of eligible work: acquisition, due reviews, repair, admission, then safe practice. */
export async function pickLifecycleFeed(db:EngiDB,b:Bundle,enabled:Memory[],s:SessionRow,daily:NonNullable<Snapshot['newLearning']>,introduced:string[],now=Date.now()){
 const catalog=buildGoalCatalog(b,enabled),ledger=await ensureLifecycle(db,catalog,new Date(now));
 const rows=await db.appMeta.bulkGet(catalog.map(e=>'studyCore:memory:'+e.goal.id)),memories=new Map(rows.filter(r=>!!r).map(r=>[r!.value.goalId,r!.value as GoalMemory]));
 const plan=await lifecycleProjection(db,catalog,[...memories.values()],await ensureDayPlan(db,catalog,[...memories.values()],new Date(now),s),undefined,new Date(now));
 await db.appMeta.put({key:'studyCore:lifecycleDayPlan',value:plan});
 const pool=goalProposalPool(b,enabled,s.tag,'mixed'),ids=[...new Set(pool.proposals.flatMap(p=>p.goals.map(g=>g.id)))];
 const exposureRows=await db.appMeta.bulkGet(ids.map(id=>'studyCore:exposure:'+id)),exposures=new Map(exposureRows.filter(r=>!!r).map(r=>[r!.value.goalId,r!.value as ExposureEntry]));
 const active=new Map(ledger.units.filter(u=>u.stage!=='completed').map(u=>[u.key,u])),activeIds=new Set(catalog.filter(e=>!e.suspended).map(e=>e.goal.id));
 const at=(id:string)=>{const goal=catalog.find(e=>e.goal.id===id)?.goal,unit=goal&&active.get(acquisitionKey(goal)),exposure=exposures.get(id);return Math.max(unit?new Date(unit.availableAt).getTime():new Date(memories.get(id)?.card.due??8640000000000000).getTime(),exposure?(unit?(unit.stage==='confirmation'?new Date(exposure.lastVisibleAt).getTime()+ACQUISITION_CONFIRMATION_MS:0):exposureAvailableAt(exposure)):0);};
 const compatible=(p:typeof pool.proposals[number])=>!s.format||s.format==='mixed'||p.recipe.format===s.format;
 const eligible=s.mode==='practice'?[]:pool.proposals.filter(p=>compatible(p)&&p.goals.every(g=>{const u=active.get(acquisitionKey(g));return activeIds.has(g.id)&&(u?u.goal.id===g.id:memories.has(g.id))&&at(g.id)<=now;}));
 const repairOptions={format:s.format,excludedKeys:new Set([...active.values()].filter(u=>!activeIds.has(u.goal.id)||at(u.goal.id)>now).map(u=>u.key))};
 const repair=await selectRepairWork(db,b,enabled,s,memories,eligible.length>0,new Set(eligible.flatMap(p=>p.goals.map(acquisitionKey))),repairOptions);
 if(repair){repair.learningLifecycle=1;return {task:repair,intro:undefined};}
 const history=s.cooldown??[],recent=history.slice(-5).flatMap(t=>t.studyContract?.primaryGoals.map(g=>g.id)??[]);
 const owners=(items:Task['items'])=>items.map(i=>i.factId?b.facts.find(f=>f.id===i.factId)?.entityId??i.entityId:i.entityId);
 const lastObjects=new Set(owners(history.at(-1)?.items??[]));
 const objectRank=(p:typeof pool.proposals[number])=>Number(owners(p.items).some(id=>lastObjects.has(id)))*100+owners(p.items).reduce((sum,id)=>sum+history.slice(-5).reduce((n,t,index)=>n+Number(owners(t.items).includes(id))*(index+1),0),0)/p.items.length;
 const scopedIds=new Set(pool.proposals.flatMap(p=>p.goals.map(g=>g.id))),firstChecks=ledger.units.filter(u=>u.stage==='first-check'&&scopedIds.has(u.goal.id)&&activeIds.has(u.goal.id));
 const introIndex=history.map(t=>t.reason).lastIndexOf('intro'),sinceIntro=history.slice(introIndex+1).reduce((n,t)=>n+Math.max(1,t.studyContract?.primaryGoals.length??t.items.length),0);
 const introduce=()=>{
  if(s.mode==='practice')return;
  const configuration=enabled.map(m=>({...m,bootstrap:undefined,card:{...m.card,due:new Date(now+365*86400000)}}));
  // The lifecycle owns admission; the old composer only materializes the next intro.
  const next=pickFeed(b,configuration,{...s,repairQueue:[],mode:'daily'},{...daily,extraBudget:0,introducedEntityIds:[]},introduced,1);
  if(next.intro&&(next.intro.newProperty||plan.newBudget>0)){s.playRound=undefined;return next;}
 };
 const due=eligible.filter(p=>p.goals.some(g=>active.get(acquisitionKey(g))?.stage!=='first-check')),first=eligible.filter(p=>p.goals.every(g=>active.get(acquisitionKey(g))?.stage==='first-check'));
 const admission=shouldIntroduce({firstChecks:firstChecks.length,firstCheckObjects:new Set(firstChecks.map(u=>u.entityId)).size,actionsSinceIntro:sinceIntro,hasReady:eligible.length>0,onlyLastObject:eligible.length>0&&eligible.every(p=>owners(p.items).some(id=>lastObjects.has(id)))});
 const candidateIntroduction=introduce(),nextIntroduction=candidateIntroduction?.intro?.newProperty||admission?candidateIntroduction:undefined;
 if(nextIntroduction?.intro?.newProperty)return nextIntroduction;
 if(nextIntroduction&&(!due.length||history.slice(introIndex+1).some(t=>['due','confirmation'].includes(t.reason))))return nextIntroduction;
 const dueStreak=dueTurnsSinceFirstCheck(history.map(t=>t.reason));
 const lane=chooseWorkLane(due.length>0,first.length>0,dueStreak),selected=lane==='due'?due:first;
 const protectedGoals=new Set([...active.values()].map(u=>u.goal.id));
 const completedKeys=new Set([...ledger.units.filter(u=>u.stage==='completed').map(u=>u.key),...catalog.filter(e=>memories.has(e.goal.id)&&!active.has(acquisitionKey(e.goal))).map(e=>acquisitionKey(e.goal))]);
 const knownFacts=new Set(catalog.filter(e=>!e.suspended&&completedKeys.has(acquisitionKey(e.goal))&&e.goal.knowledge.kind==='fact').map(e=>e.goal.knowledge.key));
 const diagnostic=()=>chronologyPractice(b,enabled,knownFacts,protectedGoals,s.tag??'all',s.format??'mixed',history,s.id+(s.completedCount??0));
 const lastDiagnostic=history.map(t=>!!t.recipe.diagnostic).lastIndexOf(true),diagnosticActions=history.slice(lastDiagnostic+1).reduce((n,t)=>n+Math.max(1,t.items.length),0);
 if((s.format==='mixed'&&diagnosticActions>=8||['timeline','sort','missing'].includes(s.format??''))&&!firstChecks.length){const task=diagnostic();if(task)return {task,intro:undefined};}
 const groups=(!s.format||['mixed','match','categorize'].includes(s.format))?groupProposals(selected,new Set(memories.keys()),3,{spareAnswer:true}).filter(compatible):[];
 const proposals=[...selected,...groups],earliest=selected.length?Math.min(...selected.flatMap(p=>p.goals.map(g=>at(g.id)))):now;
 const formatRank=(p:typeof pool.proposals[number])=>history.slice(-5).filter(t=>t.recipe.format===p.recipe.format).length*3+Number(p.recipe.format===history.at(-1)?.recipe.format)*8+(p.group?(history.at(-1)?.items.length??0)>1?8:-2:0);
 proposals.sort((a,c)=>{
  const urgency=(p:typeof a)=>lane==='due'?Math.floor(Math.max(0,Math.min(...p.goals.map(g=>at(g.id)))-earliest)/60000):0;
  return urgency(a)-urgency(c)||objectRank(a)-objectRank(c)||formatRank(a)-formatRank(c)||selectionTie(s.id+(s.completedCount??0)+a.goals.map(g=>g.id)+a.recipe.format)-selectionTie(s.id+(s.completedCount??0)+c.goals.map(g=>g.id)+c.recipe.format);
 });
 for(const p of proposals){const task=materializeGoalProposal(b,enabled,p,pool.context,s.tag??'all',history,false,memories);if(task){task.learningLifecycle=1;task.intent='learn';task.reason=lane==='first'?'bootstrap':p.goals.some(g=>active.has(acquisitionKey(g)))?'confirmation':'due';return {task,intro:undefined};}}
 const remainingRepair=await selectRepairWork(db,b,enabled,s,memories,false,new Set(),repairOptions);if(remainingRepair){remainingRepair.learningLifecycle=1;return {task:remainingRepair,intro:undefined};}
 if(nextIntroduction)return nextIntroduction;
 const diagnosticTask=diagnostic();if(diagnosticTask&&(!history.at(-1)?.recipe.diagnostic||['timeline','sort','missing'].includes(s.format??'')))return {task:diagnosticTask,intro:undefined};
 const knownKeys=new Set([...ledger.units.map(u=>u.key),...catalog.filter(e=>memories.has(e.goal.id)).map(e=>acquisitionKey(e.goal))]);
 const games=pool.proposals.filter(p=>compatible(p)&&p.goals.every(g=>activeIds.has(g.id)&&knownKeys.has(acquisitionKey(g))));
 games.sort((a,c)=>objectRank(a)-objectRank(c)||formatRank(a)-formatRank(c)||Number(a.goals.some(g=>recent.includes(g.id)))-Number(c.goals.some(g=>recent.includes(g.id)))||selectionTie(s.id+(s.completedCount??0)+a.goals.map(g=>g.id))-selectionTie(s.id+(s.completedCount??0)+c.goals.map(g=>g.id)));
 
 let fallback:Task|undefined;
 for(const p of games){const task=materializeGoalProposal(b,enabled,p,pool.context,s.tag??'all',history,true,memories);if(!task)continue;
  task.learningLifecycle=1;task.intent='practice';task.reason='game';const contract=compileTaskContract(b,task);
  if(![...contract.shownClaims,...contract.feedbackClaims].some(c=>c.revealsGoalIds.some(id=>protectedGoals.has(id))))return {task,intro:undefined};
  fallback??=task;
 }
 if(fallback)return {task:fallback,intro:undefined};
 const dates=[...active.values()].filter(u=>activeIds.has(u.goal.id)).map(u=>at(u.goal.id)).filter(t=>t>now);
 return {task:undefined,intro:undefined,exhausted:true as const,waitingUntil:dates.length?new Date(Math.min(...dates)).toISOString():undefined};
}
