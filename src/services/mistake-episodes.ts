import type {EngiDB} from '../db/engi-db';
import type {GoalCatalogEntry} from '../lib/engi/knowledge/goal-progress';
import type {GoalMemory} from '../lib/engi/study-core/memory';
import type {GoalDayPlan} from '../lib/engi/study-core/day-plan';
import type {Attempt} from '../lib/engi/study-core/attempts';
import type {TaskContract} from '../lib/engi/study-core/contracts';
import {knowledgeMistakeKey,synchronizeMistakes,type KnowledgeMistake} from '../lib/engi/study-core/mistakes';
export const MISTAKE_EPISODES_KEY='studyCore:mistakeEpisodes';
export type MistakeEpisode=KnowledgeMistake&{id:string;status:'open'|'resolved'|'unavailable'|'superseded';openedAt:string;lastAttemptAt:string;attemptIds:string[];resolvedAt?:string;unavailableReason?:string;failedImage?:string};
type Ledger={version:1;episodes:MistakeEpisode[]};
export async function synchronizeEpisodes(db:EngiDB,catalog:GoalCatalogEntry[],memories:GoalMemory[],legacy:GoalDayPlan|undefined,now:Date){
 const previous=(await db.appMeta.get(MISTAKE_EPISODES_KEY))?.value as Ledger|undefined;
 const definitions=new Map(catalog.map(e=>[knowledgeMistakeKey(e.goal),e]));
 const revisions=new Map<string,Set<string>>();
 const contentKey=(goal:KnowledgeMistake['goal'])=>JSON.stringify([goal.knowledge.kind,goal.knowledge.key]);
 for(const entry of catalog){const key=contentKey(entry.goal),values=revisions.get(key)??new Set<string>();values.add(entry.goal.revision);revisions.set(key,values);}
 const ledger:Ledger=previous??{version:1,episodes:synchronizeMistakes(legacy?.mistakes,memories,now).map(m=>({...m,id:crypto.randomUUID(),status:'open',openedAt:m.failedAt,lastAttemptAt:m.failedAt,attemptIds:[]}))};
 const available=new Set(catalog.filter(e=>!e.suspended).map(e=>knowledgeMistakeKey(e.goal)));
 for(const row of ledger.episodes){
  if(row.status==='resolved'||row.status==='superseded')continue;
  if(!definitions.has(row.key))row.status=revisions.has(contentKey(row.goal))&&!revisions.get(contentKey(row.goal))!.has(row.goal.revision)?'superseded':'unavailable';
  else row.status=available.has(row.key)&&!row.unavailableReason?'open':'unavailable';
 }
 await db.appMeta.put({key:MISTAKE_EPISODES_KEY,value:ledger});
 return ledger.episodes.filter(e=>e.status==='open');
}
export async function markRepairUnavailable(db:EngiDB,ids:string[],failedImage?:string){
 if(!ids.length)return;
 const row=await db.appMeta.get(MISTAKE_EPISODES_KEY);if(!row)return;
 const ledger=row.value as Ledger;
 for(const episode of ledger.episodes)if(ids.includes(episode.id)&&episode.status!=='resolved'){episode.status='unavailable';episode.failedImage=failedImage??episode.failedImage;episode.unavailableReason=episode.failedImage?'image':'question';}
 await db.appMeta.put({key:row.key,value:ledger});
}
/** Outcomes are called inside the answer transaction, independently of daily or FSRS credit. */
export async function recordMistakeOutcome(db:EngiDB,attempt:Attempt,contract:TaskContract){
 if(attempt.phase!=='submitted')return 0;
 const row=await db.appMeta.get(MISTAKE_EPISODES_KEY);if(!row)return 0;
 const ledger=row.value as Ledger;let resolved=0;
 for(const result of attempt.results??[]){
  const goal=contract.primaryGoals.find(g=>g.id===result.goalId);if(!goal)continue;
  const key=knowledgeMistakeKey(goal);
  let episode=ledger.episodes.find(e=>e.key===key&&(e.status==='open'||e.status==='unavailable'));
  if(episode?.attemptIds.includes(attempt.id))continue;
  const repair=contract.intent==='repair'&&result.repairEligible===true&&!!episode&&contract.repairEpisodeIds?.includes(episode.id);
  if(!result.credit&&!repair)continue;
  if(!result.correct){
   if(!episode){episode={id:crypto.randomUUID(),key,goal,status:'open',failedAt:attempt.submittedAt!,openedAt:attempt.submittedAt!,lastAttemptAt:attempt.submittedAt!,attemptIds:[]};ledger.episodes.push(episode);}
   episode.failedAt=attempt.submittedAt!;
   episode.status='open';episode.unavailableReason=undefined;
  }else if(episode){episode.status='resolved';episode.resolvedAt=attempt.submittedAt!;resolved++;}
  if(episode){episode.lastAttemptAt=attempt.submittedAt!;episode.attemptIds.push(attempt.id);}
 }
 await db.appMeta.put({key:MISTAKE_EPISODES_KEY,value:ledger});
 const plan=await db.appMeta.get('studyCore:dayPlan');
 if(plan)await db.appMeta.put({key:plan.key,value:{...plan.value,mistakes:ledger.episodes.filter(e=>e.status==='open')}});
 return resolved;
}
