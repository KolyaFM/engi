import type {EngiDB} from '../db/engi-db';
import type {GoalCatalogEntry} from '../lib/engi/knowledge/goal-progress';
import type {GoalMemory} from '../lib/engi/study-core/memory';
import type {Attempt} from '../lib/engi/study-core/attempts';
import {synchronizeDayPlan,applyDayAttempt,dayBoundary,type GoalDayPlan} from '../lib/engi/study-core/day-plan';
import {readStudyPreferences} from './study-preferences-service';
import {synchronizeEpisodes,MISTAKE_EPISODES_KEY,type MistakeEpisode} from './mistake-episodes';
import {knowledgeMistakeKey} from '../lib/engi/study-core/mistakes';
export const DAY_PLAN_KEY='studyCore:dayPlan';
export async function ensureDayPlan(db:EngiDB,catalog:GoalCatalogEntry[],memories:GoalMemory[],now=new Date(),session?:{endless?:boolean}){
 return db.transaction('rw',db.appMeta,async()=>{
  const old=(await db.appMeta.get(DAY_PLAN_KEY))?.value as GoalDayPlan|undefined,newLearning=(await db.appMeta.get('newLearning'))?.value;
  const extra=newLearning?.day===dayBoundary(now).day?newLearning.extraBudget??0:0;
  // Older memory rows may predate the stored goal definition.
  const definitions=new Map(catalog.map(e=>[e.goal.id,e.goal]));
  const enriched=memories.map(m=>({...m,goal:m.goal??definitions.get(m.goalId)}));
  const {newCardsPerDay}=await readStudyPreferences(db);
  const plan=synchronizeDayPlan(old,catalog.filter(e=>!e.suspended).map(e=>e.goal.id),enriched,now,newCardsPerDay+extra);
  if(session)plan.learningLimit=session.endless?3:undefined;
  plan.dailyTarget=Math.min(newCardsPerDay,plan.newTarget);
  plan.mistakes=await synchronizeEpisodes(db,catalog,enriched,old,now);
  // Successful first checks can wait for FSRS while other new knowledge enters the feed.
  // An unresolved initial failure still holds attention until a fresh repair succeeds.
  if(session?session.endless:old?.admissionGoalIds!==undefined){const errors=new Set(plan.mistakes?.map(m=>m.key));plan.admissionGoalIds=enriched.filter(m=>plan.learningGoalIds?.includes(m.goalId)&&!m.independentSuccesses&&m.goal&&errors.has(knowledgeMistakeKey(m.goal))).map(m=>m.goalId);}
  else delete plan.admissionGoalIds;
  plan.unavailableMistakes=((await db.appMeta.get(MISTAKE_EPISODES_KEY))?.value.episodes??[]).filter((e:MistakeEpisode)=>e.status==='unavailable').length;
  await db.appMeta.put({key:DAY_PLAN_KEY,value:plan});return plan;
 });
}
export async function recordDayAttempt(db:EngiDB,attempt:Attempt,lifecycle=false){
 const row=await db.appMeta.get(DAY_PLAN_KEY);if(!row)throw Error('Daily plan must be initialized before answering');if(lifecycle)return;
 const results=attempt.results?.filter(r=>r.credit)??[],memories=await db.appMeta.bulkGet(results.map(r=>'studyCore:memory:'+r.goalId));
 const plan=applyDayAttempt(row.value,attempt,memories.filter(m=>!!m).map(m=>m!.value));
 // The episode ledger owns errors; the day plan retains only its compatibility projection.
 plan.mistakes=row.value.mistakes;
 await db.appMeta.put({key:DAY_PLAN_KEY,value:plan});return plan;
}
