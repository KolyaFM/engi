import type {EngiDB} from '../db/engi-db';
import type {GoalCatalogEntry} from '../lib/engi/knowledge/goal-progress';
import type {GoalMemory} from '../lib/engi/study-core/memory';
import type {Attempt} from '../lib/engi/study-core/attempts';
import {synchronizeDayPlan,applyDayAttempt,dayBoundary,type GoalDayPlan} from '../lib/engi/study-core/day-plan';
import {readStudyPreferences} from './study-preferences-service';
import {synchronizeEpisodes,MISTAKE_EPISODES_KEY,type MistakeEpisode} from './mistake-episodes';
export const DAY_PLAN_KEY='studyCore:dayPlan';
export async function ensureDayPlan(db:EngiDB,catalog:GoalCatalogEntry[],memories:GoalMemory[],now=new Date()){
 return db.transaction('rw',db.appMeta,async()=>{
  const old=(await db.appMeta.get(DAY_PLAN_KEY))?.value as GoalDayPlan|undefined,newLearning=(await db.appMeta.get('newLearning'))?.value;
  const extra=newLearning?.day===dayBoundary(now).day?newLearning.extraBudget??0:0;
  // Older memory rows may predate the stored goal definition.
  const definitions=new Map(catalog.map(e=>[e.goal.id,e.goal]));
  const enriched=memories.map(m=>({...m,goal:m.goal??definitions.get(m.goalId)}));
  const {newCardsPerDay}=await readStudyPreferences(db);
  const plan=synchronizeDayPlan(old,catalog.filter(e=>!e.suspended).map(e=>e.goal.id),enriched,now,newCardsPerDay+extra);
  plan.mistakes=await synchronizeEpisodes(db,catalog,enriched,old,now);
  plan.unavailableMistakes=((await db.appMeta.get(MISTAKE_EPISODES_KEY))?.value.episodes??[]).filter((e:MistakeEpisode)=>e.status==='unavailable').length;
  await db.appMeta.put({key:DAY_PLAN_KEY,value:plan});return plan;
 });
}
export async function recordDayAttempt(db:EngiDB,attempt:Attempt){
 const row=await db.appMeta.get(DAY_PLAN_KEY);if(!row)throw Error('Daily plan must be initialized before answering');
 const results=attempt.results?.filter(r=>r.credit)??[],memories=await db.appMeta.bulkGet(results.map(r=>'studyCore:memory:'+r.goalId));
 const plan=applyDayAttempt(row.value,attempt,memories.filter(m=>!!m).map(m=>m!.value));
 // The episode ledger owns errors; the day plan retains only its compatibility projection.
 plan.mistakes=row.value.mistakes;
 await db.appMeta.put({key:DAY_PLAN_KEY,value:plan});return plan;
}
