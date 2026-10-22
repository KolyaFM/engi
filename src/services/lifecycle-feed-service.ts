import {intervalAvailableAt} from '../lib/engi/study-core/interval-evidence';
import {buildIntervalGroup} from './interval-group-composition';
import {buildEndpointTask} from './interval-composition';
import {readIntervalEvidence} from './interval-evidence-service';
import {readGoalStateRows} from './goal-state-rows';
import {buildSelfCheck} from './self-check-composition';
import {readGroupContext} from './group-affinity';
import type {EngiDB,SessionRow} from '../db/engi-db';
import type {Bundle,Memory,Task,Snapshot} from '../lib/engi/types';
import type {GoalMemory} from '../lib/engi/study-core/memory';
import type {ExposureEntry} from '../lib/engi/study-core/exposure';
import {exposureAvailableAt} from '../lib/engi/study-core/exposure';
import {ACQUISITION_CONFIRMATION_MS,acquisitionKey,propertyKey} from '../lib/engi/study-core/acquisition';
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
import {buildLearningChronology} from './learning-chronology';
import {MISTAKE_EPISODES_KEY,type MistakeEpisode} from './mistake-episodes';
import type {SelectionDecision} from './selection-decision';
import {proposalDiversityPenalty,presentationFamily} from './proposal-diversity';
/** One source of eligible work: acquisition, due reviews, repair, admission, then safe practice. */
export async function pickLifecycleFeed(db:EngiDB,b:Bundle,enabled:Memory[],s:SessionRow,daily:NonNullable<Snapshot['newLearning']>,introduced:string[],now=Date.now(),audit?:(decision:SelectionDecision)=>void){
 const decision:SelectionDecision={branch:'',checks:{matching:{status:'not-reached'},chronology:{status:'not-reached'},recall:{status:'not-reached'},selfCheck:{status:'not-reached'},intervalBands:{status:'not-reached'}}};
 function finish<T extends {task?:Task;intro?:{entityId:string};exhausted?:boolean}>(next:T,branch:string):T&{exhausted?:boolean}{
  if(audit){const history=s.cooldown??[],objects=(items:Task['items'])=>items.map(i=>i.factId?b.facts.find(f=>f.id===i.factId)?.entityId??i.entityId:i.entityId),chosen=next.task,ids=chosen?objects(chosen.items):next.intro?[next.intro.entityId]:[],keys=chosen?.studyContract?.primaryGoals.map(propertyKey)??[];
   const distance=(match:(t:Task)=>boolean)=>{const n=[...history].reverse().findIndex(match);return n<0?null:n+1;};
   audit({...decision,branch,selected:{objectDistance:distance(t=>objects(t.items).some(id=>ids.includes(id))),propertyDistance:distance(t=>(t.studyContract?.primaryGoals??[]).some(g=>keys.includes(propertyKey(g)))),formatDistance:chosen?distance(t=>presentationFamily(t)===presentationFamily(chosen)):null}});
  }return next;
 }
 const catalog=buildGoalCatalog(b,enabled),ledger=await ensureLifecycle(db,catalog,new Date(now));
 const rows=await readGoalStateRows(db,catalog.map(e=>e.goal.id),'memory'),memories=new Map(rows.filter(r=>!!r).map(r=>[r!.value.goalId,r!.value as GoalMemory]));
 const plan=await lifecycleProjection(db,catalog,[...memories.values()],await ensureDayPlan(db,catalog,[...memories.values()],new Date(now),s),undefined,new Date(now));
 await db.appMeta.put({key:'studyCore:lifecycleDayPlan',value:plan});
 const episodes=(await db.appMeta.get(MISTAKE_EPISODES_KEY))?.value.episodes as MistakeEpisode[]|undefined;
 const hasRepair=!!episodes?.some(e=>e.status==='open'||e.status==='unavailable'&&e.unavailableReason);
 // A fresh collection has no review proposals yet. Open its first object before
 // compiling the full question pool; the normal path takes over after exposure.
 if(s.mode!=='practice'&&!ledger.cards.length&&!ledger.units.length&&!memories.size&&!hasRepair&&!plan.mistakes?.length){
  const configuration=enabled.map(m=>({...m,bootstrap:undefined,card:{...m.card,due:new Date(now+365*86400000)}}));
  const next=pickFeed(b,configuration,{...s,repairQueue:[],mode:'daily'},{...daily,extraBudget:0,introducedEntityIds:[]},introduced,1);
  if(next.intro&&(next.intro.newProperty||plan.newBudget>0))return finish(next,'first-introduction');
 }
 const introduce=()=>{
  if(s.mode==='practice')return;
  const configuration=enabled.map(m=>({...m,bootstrap:undefined,card:{...m.card,due:new Date(now+365*86400000)}}));
  const next=pickFeed(b,configuration,{...s,repairQueue:[],mode:'daily'},{...daily,extraBudget:0,introducedEntityIds:[]},introduced,1);
  if(next.intro&&(next.intro.newProperty||plan.newBudget>0)){s.playRound=undefined;return next;}
 };
 // Immediately after an introduction, all recently shown goals may still be
 // behind their disclosure interval. Decide that before compiling every task.
 if(s.mode!=='practice'&&s.cooldown?.at(-1)?.reason==='intro'){
  if(!hasRepair){
   const scoped=b.studyScope?new Set(b.studyScope.targetIds):undefined;
   const activeGoals=catalog.filter(e=>!e.suspended&&(!scoped||e.targetIds.every(id=>scoped.has(id)))&&(
    ledger.units.some(u=>u.stage!=='completed'&&u.goal.id===e.goal.id)||memories.has(e.goal.id)));
   const shown=await readGoalStateRows(db,activeGoals.map(e=>e.goal.id),'exposure');
   const readyGoals=activeGoals.filter((e,i)=>{
    const unit=ledger.units.find(u=>u.stage!=='completed'&&u.goal.id===e.goal.id),exposure=shown[i]?.value as ExposureEntry|undefined;
    const due=unit?new Date(unit.availableAt).getTime():new Date(memories.get(e.goal.id)?.card.due??8640000000000000).getTime();
    const visible=exposure?(unit&&unit.stage==='confirmation'?new Date(exposure.lastVisibleAt).getTime()+ACQUISITION_CONFIRMATION_MS:unit?0:exposureAvailableAt(exposure)):0;
    return Math.max(due,visible)<=now;
   });
   const lastOwners=new Set((s.cooldown?.at(-1)?.items??[]).map(i=>i.factId?b.facts.find(f=>f.id===i.factId)?.entityId??i.entityId:i.entityId));
   const onlyLastObject=readyGoals.length>0&&readyGoals.every(e=>e.entityIds.some(id=>lastOwners.has(id)));
   if(!readyGoals.length||onlyLastObject){
    const first=ledger.units.filter(u=>u.stage==='first-check'&&activeGoals.some(e=>e.goal.id===u.goal.id));
    const canIntroduce=shouldIntroduce({firstChecks:first.length,firstCheckObjects:new Set(first.map(u=>u.entityId)).size,actionsSinceIntro:0,hasReady:readyGoals.length>0,onlyLastObject});
    const next=introduce();
    if(next?.intro?.newProperty||canIntroduce&&next)return finish(next!,'spread-introductions');
   }
  }
 }
 const pool=goalProposalPool(b,enabled,s.tag,'mixed'),ids=[...new Set(pool.proposals.flatMap(p=>p.goals.map(g=>g.id)))];
 const exposureRows=await readGoalStateRows(db,ids,'exposure'),exposures=new Map(exposureRows.filter(r=>!!r).map(r=>[r!.value.goalId,r!.value as ExposureEntry]));
 const active=new Map(ledger.units.filter(u=>u.stage!=='completed').map(u=>[propertyKey(u.goal),u])),activeIds=new Set(catalog.filter(e=>!e.suspended).map(e=>e.goal.id));
 const byGoal=new Map(catalog.map(e=>[e.goal.id,e.goal])),byProperty=new Map<string,typeof catalog>();for(const e of catalog){const key=propertyKey(e.goal);const list=byProperty.get(key)??[];list.push(e);byProperty.set(key,list);}
 const intervalEvidence=await readIntervalEvidence(db,catalog.map(e=>e.goal.id));
 const availability=new Map<string,number>();
 const at=(id:string)=>{const cached=availability.get(id);if(cached!==undefined)return cached;const goal=byGoal.get(id);if(!goal)return Infinity;const siblings=byProperty.get(propertyKey(goal))??[],unit=active.get(propertyKey(goal)),exposure=exposures.get(id),own=memories.get(id);const related=siblings.flatMap(e=>{const m=memories.get(e.goal.id);return m?[m]:[];});const due=unit?new Date(unit.availableAt).getTime():own?new Date(own.card.due).getTime():related.length?Math.min(...related.map(m=>new Date(m.card.due).getTime())):Infinity;const recentReview=unit?0:Math.max(0,...related.map(m=>m.card.last_review?new Date(m.card.last_review).getTime()+ACQUISITION_CONFIRMATION_MS:0));const date=Math.max(due,recentReview,intervalAvailableAt(intervalEvidence.get(id)),exposure?(unit?(unit.stage==='confirmation'?new Date(exposure.lastVisibleAt).getTime()+ACQUISITION_CONFIRMATION_MS:0):exposureAvailableAt(exposure)):0);availability.set(id,date);return date;};
 const compatible=(p:typeof pool.proposals[number])=>!s.format||s.format==='mixed'||p.recipe.format===s.format;
 const history=s.cooldown??[],recent=history.slice(-5).flatMap(t=>t.studyContract?.primaryGoals.map(g=>g.id)??[]);
 const recentProperties=new Set(history.at(-1)?.studyContract?.primaryGoals.map(propertyKey)??[]);
 const knownKeys=new Set([...ledger.units.map(u=>propertyKey(u.goal)),...catalog.filter(e=>memories.has(e.goal.id)).map(e=>propertyKey(e.goal))]);
 const practicePool=pool.proposals.filter(p=>compatible(p)&&p.goals.every(g=>activeIds.has(g.id)&&knownKeys.has(propertyKey(g))));
 // Prefer presentations that leave the nearest confirmation undisclosed, but
 // never let this preference exclude older knowledge from continuous practice.
 const pending=new Map<string,number>();for(const p of practicePool)for(const g of p.goals){const key=propertyKey(g),date=at(g.id);if(active.has(key)&&date>now)pending.set(key,Math.min(pending.get(key)??Infinity,date));}
 const reservedProperty=[...pending].sort((a,c)=>a[1]-c[1]||a[0].localeCompare(c[0]))[0]?.[0];
 const reservedGoals=new Set(reservedProperty?(byProperty.get(reservedProperty)??[]).map(e=>e.goal.id):[]);
 const repeatsRecent=(p:typeof pool.proposals[number])=>p.goals.length>0&&p.goals.every(g=>recentProperties.has(propertyKey(g)));
 // A different primary goal can still reveal the reserve in its prompt or
 // options. Validate the actual presentation before deferring a ready check.
 const practiceTasks=new Map<typeof pool.proposals[number],{task:Task;safe:boolean}|undefined>();
 const practiceTask=(p:typeof pool.proposals[number])=>{
  if(practiceTasks.has(p))return practiceTasks.get(p);
  const task=materializeGoalProposal(b,enabled,p,pool.context,s.tag??'all',history,true,memories);
  if(!task){practiceTasks.set(p,undefined);return;}
  task.learningLifecycle=1;task.intent='practice';task.reason='game';const contract=compileTaskContract(b,task);
  const result={task,safe:![...contract.shownClaims,...contract.feedbackClaims].some(c=>c.revealsGoalIds.some(id=>reservedGoals.has(id)))};
  practiceTasks.set(p,result);return result;
 };
 const canVary=recentProperties.size>0&&practicePool.some(p=>!repeatsRecent(p)&&!p.goals.some(g=>propertyKey(g)===reservedProperty)&&practiceTask(p)?.safe);
 const deferRecent=(p:typeof pool.proposals[number])=>canVary&&repeatsRecent(p);
 if(audit)decision.practice={reservedProperty,recentProperties:[...recentProperties],deferredCandidates:pool.proposals.filter(deferRecent).length};
 const eligible=s.mode==='practice'?[]:pool.proposals.filter(p=>compatible(p)&&!deferRecent(p)&&p.goals.every(g=>{const u=active.get(propertyKey(g));return activeIds.has(g.id)&&(u?u.goal.skill===g.skill:memories.has(g.id)||catalog.some(e=>propertyKey(e.goal)===propertyKey(g)&&memories.has(e.goal.id)))&&at(g.id)<=now;}));
 if(audit)decision.availableFormats=eligible.reduce((counts,p)=>{counts[p.recipe.format]=(counts[p.recipe.format]??0)+1;return counts;},{} as Record<string,number>);
 const repairOptions={format:s.format,excludedKeys:new Set(catalog.filter(e=>{const u=active.get(propertyKey(e.goal));return canVary&&recentProperties.has(propertyKey(e.goal))||u&&(!activeIds.has(e.goal.id)||at(e.goal.id)>now);}).map(e=>acquisitionKey(e.goal)))};
 const repair=await selectRepairWork(db,b,enabled,s,memories,eligible.length>0,repairOptions);
 if(repair){repair.learningLifecycle=1;return finish({task:repair,intro:undefined},'repair');}
 const owners=(items:Task['items'])=>items.map(i=>i.factId?b.facts.find(f=>f.id===i.factId)?.entityId??i.entityId:i.entityId);
 const lastObjects=new Set(owners(history.at(-1)?.items??[]));
 const objectRank=(p:typeof pool.proposals[number])=>Number(owners(p.items).some(id=>lastObjects.has(id)))*100+owners(p.items).reduce((sum,id)=>sum+history.slice(-5).reduce((n,t,index)=>n+Number(owners(t.items).includes(id))*(index+1),0),0)/p.items.length;
 const scopedKeys=new Set(pool.proposals.flatMap(p=>p.goals.filter(g=>activeIds.has(g.id)).map(propertyKey))),firstChecks=ledger.units.filter(u=>u.stage==='first-check'&&scopedKeys.has(propertyKey(u.goal)));
 const introIndex=history.map(t=>t.reason).lastIndexOf('intro'),sinceIntro=history.slice(introIndex+1).reduce((n,t)=>n+Math.max(1,t.studyContract?.primaryGoals.length??t.items.length),0);
 const due=eligible.filter(p=>p.goals.some(g=>active.get(propertyKey(g))?.stage!=='first-check')),first=eligible.filter(p=>p.goals.every(g=>active.get(propertyKey(g))?.stage==='first-check'));
 const sinceOrder=history.slice(history.map(t=>t.recipe.format).lastIndexOf('sort')+1).length;
 if(pool.context.standaloneOrderingTargets.size&&(!s.format||['mixed','sort'].includes(s.format))&&!due.length&&(sinceOrder>=6||!catalog.length&&(sinceOrder>=3||!history.length))){
  const known=new Set(catalog.filter(e=>!e.suspended&&e.goal.knowledge.kind==='fact'&&(ledger.units.some(u=>u.stage==='completed'&&propertyKey(u.goal)===propertyKey(e.goal))||memories.has(e.goal.id)&&!active.has(propertyKey(e.goal)))).map(e=>e.goal.knowledge.key));
  const task=chronologyPractice(b,enabled,known,new Set(catalog.filter(e=>active.has(propertyKey(e.goal))).map(e=>e.goal.id)),s.tag??'all','sort',history,s.id+(s.completedCount??0),true);
  if(task)return finish({task,intro:undefined},'standalone-ordering');
 }
 const admission=shouldIntroduce({firstChecks:firstChecks.length,firstCheckObjects:new Set(firstChecks.map(u=>u.entityId)).size,actionsSinceIntro:sinceIntro,hasReady:eligible.length>0,onlyLastObject:eligible.length>0&&eligible.every(p=>owners(p.items).some(id=>lastObjects.has(id)))});
 const candidateIntroduction=introduce(),nextIntroduction=candidateIntroduction?.intro?.newProperty||admission?candidateIntroduction:undefined;
 if(nextIntroduction?.intro?.newProperty)return finish(nextIntroduction,'new-property');
 if(nextIntroduction&&(!due.length||history.slice(introIndex+1).some(t=>['due','confirmation'].includes(t.reason))))return finish(nextIntroduction,'admission');
 const dueStreak=dueTurnsSinceFirstCheck(history.map(t=>t.reason));
 const lane=chooseWorkLane(due.length>0,first.length>0,dueStreak),selected=lane==='due'?due:first;
 // Partial exercises share one disclosure budget between exact checks. A
 // practice screen in history does not replenish that budget.
 const freshIntervalContext=(p:typeof pool.proposals[number])=>p.goals.every(g=>{const u=active.get(propertyKey(g)),e=intervalEvidence.get(g.id),lastContext=Math.max(e?.lastExerciseAt?Date.parse(e.lastExerciseAt):0,e?.lastDisclosureAt?Date.parse(e.lastDisclosureAt):0),review=memories.get(g.id)?.card.last_review,lastExact=Math.max(u?.lastAttemptAt?Date.parse(u.lastAttemptAt):0,review?new Date(review).getTime():0);return !lastContext||lastContext<lastExact;});
 if(audit){decision.lane=lane;decision.checks.selfCheck={status:!s.format||s.format==='mixed'?'cooldown':'disabled'};decision.checks.recall={status:(!s.format||s.format==='mixed')&&lane==='first'?'cooldown':'disabled'};decision.checks.chronology={status:s.mode!=='practice'&&['mixed','sort','timeline','missing'].includes(s.format??'mixed')?'cooldown':'disabled'};}
 const affinity=await readGroupContext(db,b,history),sinceSelfCheck=history.slice(history.map(t=>t.recipe.format).lastIndexOf('self_check')+1).length;
 if((!s.format||s.format==='mixed')&&sinceSelfCheck>=9){const targets=selected.filter(p=>!active.get(propertyKey(p.goals[0]))?.selfCheckedAt).sort((a,c)=>objectRank(a)-objectRank(c)||selectionTie(s.id+':self-check:'+(s.completedCount??0)+propertyKey(a.goals[0]))-selectionTie(s.id+':self-check:'+(s.completedCount??0)+propertyKey(c.goals[0])));const task=buildSelfCheck(b,targets,affinity,history);if(audit)decision.checks.selfCheck={status:task?'generated':'no-compatible-group',count:task?1:0};if(task)return finish({task,intro:undefined},'self-check');}
 // An optional timed rehearsal is a presentation of existing first-check work,
 // never another memory obligation or an objective graduation.
 const sinceRecall=history.slice(history.map(t=>t.recipe.format).lastIndexOf('recall_reveal')+1).length;
 if((!s.format||s.format==='mixed')&&lane==='first'&&sinceRecall>=5){const readyKeys=new Set(first.filter(p=>!owners(p.items).some(id=>lastObjects.has(id))).flatMap(p=>p.goals.map(acquisitionKey))),recalls=pool.proposals.filter(p=>p.recipe.format==='recall_reveal'&&p.goals.length===1&&readyKeys.has(acquisitionKey(p.goals[0]))&&!active.get(propertyKey(p.goals[0]))?.rehearsedAt);if(audit)decision.checks.recall={status:recalls.length?'generated':'no-compatible-group',count:recalls.length};recalls.sort((a,c)=>objectRank(a)-objectRank(c));for(const proposal of recalls){const task=materializeGoalProposal(b,enabled,proposal,pool.context,s.tag??'all',history,false,memories);if(task){task.learningLifecycle=1;task.learningRecall=true;task.intent='learn';task.reason='rehearsal';return finish({task,intro:undefined},task.reason??'selected');}}}
 if((!s.format||s.format==='mixed')&&s.mode!=='practice'&&history.length>=4){
  // A contextual period comparison is not an exact review. Pending acquisition
  // work can participate before its confirmation date without earning FSRS credit.
  const pending=pool.proposals.filter(p=>p.goals.every(g=>{const u=active.get(propertyKey(g));return activeIds.has(g.id)&&u?.goal.skill===g.skill&&intervalAvailableAt(intervalEvidence.get(g.id))<=now;})&&!owners(p.items).some(id=>lastObjects.has(id)));
  // At most one partial/contextual disclosure between exact checks; otherwise
  // the repeated reveals would perpetually push confirmations five minutes away.
  const targets=[...new Map([...selected,...pending].filter(freshIntervalContext).map(p=>[p.goals.map(g=>g.id).join()+':'+p.recipe.format,p])).values()];
  const supports=pool.proposals.filter(p=>p.goals.every(g=>activeIds.has(g.id)&&memories.has(g.id)&&!active.has(propertyKey(g))&&new Date(memories.get(g.id)!.card.due).getTime()>now));
  const task=buildIntervalGroup(b,targets,supports,history,Math.max(160,Math.min(560,(s.presentationWidth??360)-100)));
  if(audit)decision.checks.intervalBands={status:task?'generated':history.slice(-6).some(t=>t.intervalExercise?.kind==='bands')?'cooldown':'no-compatible-group',count:targets.length};
  if(task)return finish({task,intro:undefined},'interval-bands');
 }
 const protectedGoals=new Set(catalog.filter(e=>active.has(propertyKey(e.goal))).map(e=>e.goal.id));
 const completedKeys=new Set([...ledger.units.filter(u=>u.stage==='completed').map(u=>propertyKey(u.goal)),...catalog.filter(e=>memories.has(e.goal.id)&&!active.has(propertyKey(e.goal))).map(e=>propertyKey(e.goal))]);
 const knownFacts=new Set(catalog.filter(e=>!e.suspended&&completedKeys.has(propertyKey(e.goal))&&e.goal.knowledge.kind==='fact').map(e=>e.goal.knowledge.key));
 const diagnostic=()=>chronologyPractice(b,enabled,knownFacts,protectedGoals,s.tag??'all',s.format??'mixed',history,s.id+(s.completedCount??0));
 const lastDiagnostic=history.map(t=>!!t.recipe.diagnostic).lastIndexOf(true),diagnosticActions=history.slice(lastDiagnostic+1).reduce((n,t)=>n+Math.max(1,t.items.length),0);
 const recentContext=history.map(t=>!!t.contextual||!!t.recipe.diagnostic).lastIndexOf(true),contextActions=history.slice(recentContext+1).reduce((n,t)=>n+Math.max(1,t.items.length),0);
 if(s.mode!=='practice'&&(s.format==='mixed'&&contextActions>=6||['sort','timeline'].includes(s.format??''))){
  const targets=first.filter(p=>p.recipe.format==='choice'||p.recipe.format==='categorize').sort((a,c)=>objectRank(a)-objectRank(c));
  const supports=pool.proposals.filter(p=>p.goals.every(g=>activeIds.has(g.id)&&!active.has(propertyKey(g))&&memories.has(g.id)&&new Date(memories.get(g.id)!.card.due).getTime()>now)).filter(p=>p.recipe.format==='choice');
  if(lane==='first'||!due.length){const task=buildLearningChronology(b,targets,supports,history,s.completedCount??0);if(audit)decision.checks.chronology={status:task?'generated':'no-compatible-group',count:task?1:0};if(task)return finish({task,intro:undefined},'learning-chronology');}
 }
 if((s.format==='mixed'&&contextActions>=8&&!eligible.length||['timeline','sort','missing'].includes(s.format??''))){const task=diagnostic();if(audit)decision.checks.chronology={status:task?'generated':'no-compatible-group',count:task?1:0};if(task)return finish({task,intro:undefined},'diagnostic');}
 const groups=(!s.format||['mixed','match','categorize'].includes(s.format))?groupProposals(b,selected,new Set(memories.keys()),12,{spareAnswer:true,conveyor:true,context:affinity}).filter(compatible):[];
 if(audit)decision.checks.matching={status:!s.format||['mixed','match','categorize'].includes(s.format)?groups.length?'generated':'no-compatible-group':'disabled',count:groups.length};
 const proposals=[...selected,...groups],earliest=selected.length?Math.min(...selected.flatMap(p=>p.goals.map(g=>at(g.id)))):now;
 const formatRank=(p:typeof pool.proposals[number])=>proposalDiversityPenalty(p,history);
 proposals.sort((a,c)=>{
  const urgency=(p:typeof a)=>lane==='due'?Math.floor(Math.max(0,Math.min(...p.goals.map(g=>at(g.id)))-earliest)/60000):0;
  const repeatsLast=(p:typeof a)=>Number(owners(p.items).some(id=>lastObjects.has(id)));
  return repeatsLast(a)-repeatsLast(c)||urgency(a)-urgency(c)||(objectRank(a)+formatRank(a))-(objectRank(c)+formatRank(c))||selectionTie(s.id+(s.completedCount??0)+a.goals.map(g=>g.id)+a.recipe.format)-selectionTie(s.id+(s.completedCount??0)+c.goals.map(g=>g.id)+c.recipe.format);
 });
 if(audit){const nearest=proposals.slice(0,8);decision.alternatives=[...nearest,...proposals.filter(p=>p.group&&!nearest.includes(p)).slice(0,3)].map(p=>({priority:proposals.indexOf(p)+1,format:p.recipe.format,presentation:presentationFamily(p),objects:owners(p.items),properties:p.goals.map(propertyKey),group:!!p.group,objectPenalty:objectRank(p),formatPenalty:formatRank(p)}));}
 for(const p of proposals){const task=materializeGoalProposal(b,enabled,p,pool.context,s.tag??'all',history,false,memories);if(task){task.learningLifecycle=1;task.intent='learn';task.reason=lane==='first'?'bootstrap':p.goals.some(g=>active.has(propertyKey(g)))?'confirmation':'due';const partial=(!s.format||s.format==='mixed')&&freshIntervalContext(p)&&!history.slice(-3).some(t=>t.intervalExercise)?buildEndpointTask(b,task,intervalEvidence.get(p.goals[0].id),history):undefined;return finish({task:partial??task,intro:undefined},task.reason??'selected');}if(audit&&(decision.rejected?.length??0)<8){(decision.rejected??=[]).push({priority:proposals.indexOf(p)+1,format:p.recipe.format,group:!!p.group,reason:'materialization'});}}
 const remainingRepair=await selectRepairWork(db,b,enabled,s,memories,false,repairOptions);if(remainingRepair){remainingRepair.learningLifecycle=1;return finish({task:remainingRepair,intro:undefined},'drain-repairs');}
 if(nextIntroduction)return finish(nextIntroduction,'remaining-introduction');
 const diagnosticTask=diagnostic();if(diagnosticTask&&(contextActions>=8||['timeline','sort','missing'].includes(s.format??'')))return finish({task:diagnosticTask,intro:undefined},'diagnostic');
 const games=[...practicePool];
 const lastPropertyTurn=new Map<string,number>();history.forEach((t,n)=>{for(const g of t.studyContract?.primaryGoals??[])lastPropertyTurn.set(propertyKey(g),n+1);});
 const propertyRank=(p:typeof pool.proposals[number])=>Math.max(0,...p.goals.map(g=>lastPropertyTurn.get(propertyKey(g))??0));
 // Global format pacing can lock a four-object rotation to the same portrait
 // on every recall turn. Count presentations for each canonical knowledge too.
 const knowledgeFamily=(t:Parameters<typeof presentationFamily>[0])=>{const family=presentationFamily(t);return family==='image-choice'?'choice':family;};
 const presentations=new Map<string,Map<string,number>>();for(const t of history){const family=knowledgeFamily(t);for(const key of new Set(t.studyContract?.primaryGoals.map(propertyKey)??[])){const counts=presentations.get(key)??new Map<string,number>();counts.set(family,(counts.get(family)??0)+1);presentations.set(key,counts);}}
 const knowledgeFormatRank=(p:typeof pool.proposals[number])=>p.goals.reduce((sum,g)=>sum+(presentations.get(propertyKey(g))?.get(knowledgeFamily(p))??0),0)/Math.max(1,p.goals.length);
 if(audit&&decision.practice)decision.practice.presentationCounts=[...new Set(games.flatMap(p=>p.goals.map(propertyKey)))].slice(0,32).map(property=>({property,choice:presentations.get(property)?.get('choice')??0,recall:presentations.get(property)?.get('recall_reveal')??0}));
 games.sort((a,c)=>propertyRank(a)-propertyRank(c)||objectRank(a)-objectRank(c)||knowledgeFormatRank(a)-knowledgeFormatRank(c)||formatRank(a)-formatRank(c)||selectionTie(s.id+(s.completedCount??0)+a.goals.map(g=>g.id))-selectionTie(s.id+(s.completedCount??0)+c.goals.map(g=>g.id)));

 let fallback:Task|undefined,rank:{property:number;object:number}|undefined;
 for(const p of games){
  // First choose the least recently practised knowledge. Disclosure and format
  // can break ties within that priority, not force a return to newer knowledge.
  const priority={property:propertyRank(p),object:objectRank(p)};
  if(fallback&&rank&&(priority.property!==rank.property||priority.object!==rank.object))return finish({task:fallback,intro:undefined},'practice-disclosure-fallback');
  const prepared=practiceTask(p);if(!prepared)continue;const {task,safe}=prepared;
  if(safe)return finish({task,intro:undefined},'game');
  fallback??=task;rank??=priority;
 }
 if(fallback)return finish({task:fallback,intro:undefined},'practice-disclosure-fallback');
 if(diagnosticTask&&pool.context.standaloneOrderingTargets.size)return finish({task:diagnosticTask,intro:undefined},'standalone-ordering-fallback');
 const dates=[...active.values()].filter(u=>activeIds.has(u.goal.id)).map(u=>at(u.goal.id)).filter(t=>t>now);
 return finish({task:undefined,intro:undefined,exhausted:true as const,waitingUntil:dates.length?new Date(Math.min(...dates)).toISOString():undefined},'no-playable-content');
}
