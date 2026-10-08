import type {EngiDB,SessionRow} from '../db/engi-db';
import type {Bundle,Memory,Snapshot,Task} from '../lib/engi/types';
import type {GoalMemory} from '../lib/engi/study-core/memory';
import {newAdmission} from '../lib/engi/study-core/day-plan';
import {knowledgeMistakeKey} from '../lib/engi/study-core/mistakes';
import {exposureAvailableAt,type ExposureEntry} from '../lib/engi/study-core/exposure';
import {compileTaskContract} from '../lib/engi/study-core/compiler';
import {dailyNewState} from '../lib/engi/session/candidate-pool';
import {shuffle} from '../lib/engi/engine';
import {buildGoalCatalog} from './goal-catalog';
import {ensureDayPlan,DAY_PLAN_KEY} from './day-plan-service';
import {goalProposalPool,materializeGoalProposal,type GoalProposal} from './goal-proposals';
import {groupProposals} from './group-candidates';
import {pickGoalFeed} from './goal-feed';
import {readStudyPreferences} from './study-preferences-service';

export const PLAY_ROUND_SIZE=6;
export const INITIAL_LEARNING_LIMIT=3;
export type PlayRound={version:1;startedAtCount:number;knowledgeKeys:string[];protectedKey?:string};
/** Called inside the same transaction as session selection. Never opens speculative tasks. */
export async function pickEndlessFeed(db:EngiDB,b:Bundle,enabled:Memory[],s:SessionRow,daily:NonNullable<Snapshot['newLearning']>,introduced:string[],now=Date.now()){
 const catalog=buildGoalCatalog(b,enabled),rows=await db.appMeta.bulkGet(catalog.map(e=>'studyCore:memory:'+e.goal.id));
 const memory=new Map(rows.filter(r=>!!r).map(r=>[r!.value.goalId,r!.value as GoalMemory]));
 const plan=await ensureDayPlan(db,catalog,[...memory.values()],new Date(now),s);plan.learningLimit=INITIAL_LEARNING_LIMIT;await db.appMeta.put({key:DAY_PLAN_KEY,value:plan});
 const next=await pickGoalFeed(db,b,enabled,s,daily,introduced,now);
 if(next.task||next.intro)return next;
 const {newCardsPerDay}=await readStudyPreferences(db),completed=s.completedCount??0;
 // Extend only when the current batch is spent. An unsuccessful construction spends nothing.
 if(s.mode!=='practice'&&newCardsPerDay>0&&plan.newGoalIds.length>=plan.newTarget&&!newAdmission(plan).held){
  const old=await db.appMeta.get('newLearning'),extra=dailyNewState(old?.value);
  await db.appMeta.put({key:'newLearning',value:{...extra,extraBudget:extra.extraBudget+1}});
  const extended=await pickGoalFeed(db,b,enabled,s,{...extra,extraBudget:extra.extraBudget+1},introduced,now);
  const fresh=extended.task?.intent==='learn'&&compileTaskContract(b,extended.task).primaryGoals.some(g=>!memory.has(g.id));
  if(extended.intro||fresh){s.lastAutoNewAt=completed;return extended;}
  if(old)await db.appMeta.put(old);else await db.appMeta.delete('newLearning');
  await ensureDayPlan(db,catalog,[...memory.values()],new Date(now));
 }
 const pool=goalProposalPool(b,enabled,s.tag,s.format),definitions=new Map(catalog.map(e=>[e.goal.id,knowledgeMistakeKey(e.goal)]));
 const ids=[...new Set(pool.proposals.flatMap(p=>p.goals.map(g=>g.id)))],exposureRows=await db.appMeta.bulkGet(ids.map(id=>'studyCore:exposure:'+id));
 const exposures=new Map(exposureRows.filter(r=>!!r).map(r=>[r!.value.goalId,r!.value as ExposureEntry]));
 const pending=new Set([...plan.repeat,...plan.reinforce].filter(r=>r.status==='pending').map(r=>r.goalId));
 const upcoming=pool.proposals.filter(p=>p.goals.length===1).flatMap(p=>p.goals).filter(g=>pending.has(g.id)||!memory.has(g.id)&&exposures.has(g.id)&&plan.newTarget>plan.newGoalIds.length)
  .map(g=>({key:knowledgeMistakeKey(g),at:Math.max(memory.has(g.id)?new Date(memory.get(g.id)!.card.due).getTime():0,exposures.has(g.id)?exposureAvailableAt(exposures.get(g.id)!):0)}))
  .filter(g=>g.at<=now+60000).sort((a,b)=>a.at-b.at);
 const prior=s.playRound,protectedKey=upcoming.find(g=>g.key===prior?.protectedKey)?.key??upcoming[0]?.key;
 // Another skill may practice already introduced knowledge, but never earns its first credit.
 const seenKeys=new Set([...memory.keys(),...exposures.keys()].map(id=>definitions.get(id)).filter((key):key is string=>!!key));
 const candidates=pool.proposals.filter(p=>p.goals.every(g=>seenKeys.has(knowledgeMistakeKey(g))));
 const frequencies=new Map<string,number>();for(const t of s.cooldown?.slice(-12)??[])for(const g of t.studyContract?.primaryGoals??[]){const key=knowledgeMistakeKey(g);frequencies.set(key,(frequencies.get(key)??0)+1);}
 const availableKeys=[...new Set(candidates.flatMap(p=>p.goals.map(knowledgeMistakeKey)))];
 if(!prior||completed-prior.startedAtCount>=PLAY_ROUND_SIZE||!prior.knowledgeKeys.some(k=>availableKeys.includes(k))){
  const ordered=shuffle(availableKeys).sort((a,b)=>(frequencies.get(a)??0)-(frequencies.get(b)??0));s.playRound={version:1,startedAtCount:completed,knowledgeKeys:ordered.filter(k=>k!==protectedKey).slice(0,3),protectedKey};
 }else prior.protectedKey=protectedKey;
 const round=s.playRound!,focus=new Set(round.knowledgeKeys),safe=(task:Task)=>!protectedKey||![...task.studyContract!.shownClaims,...task.studyContract!.feedbackClaims,...task.studyContract!.hintClaims].some(c=>c.revealsGoalIds.some(id=>definitions.get(id)===protectedKey));
 const proposals=[...candidates,...groupProposals(candidates,new Set(memory.keys()),3)];
 const rank=(p:GoalProposal)=>{
  const keys=p.goals.map(knowledgeMistakeKey),last=s.cooldown?.at(-1);
  return Number(!keys.some(k=>focus.has(k)))*10+Number(p.items.some(i=>last?.items.some(j=>j.entityId===i.entityId)))*5+
   Number(p.recipe.format===last?.recipe.format)+keys.reduce((n,k)=>n+(frequencies.get(k)??0),0);
 };
 proposals.sort((a,b)=>rank(a)-rank(b));
 let narrowFallback:Task|undefined;
 for(const proposal of proposals){
  const task=materializeGoalProposal(b,enabled,proposal,pool.context,s.tag??'all',s.cooldown??[],true,memory);if(!task)continue;
  task.intent='practice';task.reason='game';task.studyContract=compileTaskContract(b,task);
  if(safe(task)){task.studyContract=undefined;return {task,intro:undefined,waitingUntil:undefined};}
  narrowFallback??=task;
 }
 // A one-knowledge pool cannot offer an unrelated distraction. Keep playing without credit.
 if(narrowFallback){narrowFallback.studyContract=undefined;return {task:narrowFallback,intro:undefined,waitingUntil:undefined};}
 return next;
}
