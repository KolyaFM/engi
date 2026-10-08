import type {LearningGoal} from './goals';
import type {GoalMemory} from './memory';
import type {Attempt} from './attempts';
import {DISCLOSURE_COOLDOWN_MS} from './exposure';
export type KnowledgeMistake={key:string;goal:LearningGoal;failedAt:string};
/** Different presentation skills share an error, but direction, precision and content must agree. */
export function knowledgeMistakeKey(goal:LearningGoal){return JSON.stringify([goal.knowledge.kind,goal.knowledge.key,goal.direction,goal.precision,goal.revision]);}
export function synchronizeMistakes(previous:KnowledgeMistake[]|undefined,memories:GoalMemory[],now:Date){
 const active=new Set(memories.flatMap(m=>m.goal?[knowledgeMistakeKey(m.goal)]:[]));
 const migrated=previous??memories.filter(m=>m.goal&&m.independentAttempts>0&&m.lastCorrect===false).map(m=>({key:knowledgeMistakeKey(m.goal!),goal:m.goal!,failedAt:new Date(m.card.last_review??now).toISOString()}));
 const entries=new Map<string,KnowledgeMistake>();
 for(const row of migrated)if(active.has(row.key)&&(!entries.has(row.key)||entries.get(row.key)!.failedAt<row.failedAt))entries.set(row.key,row);
 if(previous===undefined)for(const m of memories){
  if(!m.goal||m.lastCorrect!==true||!m.card.last_review)continue;
  const key=knowledgeMistakeKey(m.goal),old=entries.get(key);
  if(old&&new Date(m.card.last_review).getTime()>=new Date(old.failedAt).getTime()+DISCLOSURE_COOLDOWN_MS)entries.delete(key);
 }
 return [...entries.values()];
}
export function applyMistakes(previous:KnowledgeMistake[],attempt:Attempt,memories:GoalMemory[]){
 const entries=new Map(previous.map(m=>[m.key,m])),goals=new Map(memories.filter(m=>m.goal).map(m=>[m.goalId,m.goal!]));
 const at=new Date(attempt.submittedAt!).getTime();
 for(const result of attempt.results??[]){
  if(!result.credit)continue;
  const goal=goals.get(result.goalId);if(!goal)continue;
  const key=knowledgeMistakeKey(goal),old=entries.get(key);
  if(!result.correct){if(!old||at>=new Date(old.failedAt).getTime())entries.set(key,{key,goal,failedAt:attempt.submittedAt!});}
  else if(old&&at>=new Date(old.failedAt).getTime()+DISCLOSURE_COOLDOWN_MS)entries.delete(key);
 }
 return [...entries.values()];
}
