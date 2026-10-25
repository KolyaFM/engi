import type {EngiDB,ReviewEventRow} from '../db/engi-db';
import type {Snapshot} from '../lib/engi/types';
import type {LearningGoal} from '../lib/engi/study-core/goals';
import type {LearningLifecycle} from '../lib/engi/study-core/acquisition';
import type {MistakeEpisode} from './mistake-episodes';
import {statisticsKey,type StatisticsInput,type StatisticsProperty} from '../lib/engi/knowledge/statistics';
import {properties as propertyDefinitions} from '../lib/engi/knowledge/properties';
import {legacyUnitId} from '../lib/engi/learning/knowledge-unit';

type History={events:ReviewEventRow[];pending:ReviewEventRow[];lifecycle?:LearningLifecycle;episodes:MistakeEpisode[]};
const caches=new WeakMap<EngiDB,{promise?:Promise<History>}>();
async function history(db:EngiDB){
 let cache=caches.get(db);if(!cache){cache={};caches.set(db,cache);const invalidate=()=>{cache!.promise=undefined;};
  db.reviewEvents.hook('creating',invalidate);db.reviewEvents.hook('updating',invalidate);db.reviewEvents.hook('deleting',invalidate);
  const meta=(key:string)=>{if(key==='studyCore:learningLifecycle'||key==='studyCore:mistakeEpisodes'||key.startsWith('studyCore:reviewReceipt:'))invalidate();};
  db.appMeta.hook('creating',(_key,row)=>meta(row.key));db.appMeta.hook('updating',(_changes,key)=>meta(key));db.appMeta.hook('deleting',key=>meta(key));
 }
 if(!cache.promise){const request=db.transaction('r',db.reviewEvents,db.appMeta,async()=>{
  const events:ReviewEventRow[]=[];let after:string|undefined;
  // Indexed primary-key pagination avoids the snapshot's 1000-row cap and offset scans.
  for(;;){const page=await (after?db.reviewEvents.where('id').above(after):db.reviewEvents.orderBy('id')).limit(500).toArray();events.push(...page);if(page.length<500)break;after=page.at(-1)!.id;}
  const [lifecycle,episodes,pending]=await Promise.all([db.appMeta.get('studyCore:learningLifecycle'),db.appMeta.get('studyCore:mistakeEpisodes'),db.appMeta.where('key').startsWith('studyCore:reviewReceipt:').toArray()]);
  return {events,pending:pending.map(r=>r.value),lifecycle:lifecycle?.value,episodes:episodes?.value.episodes??[]} as History;
 });cache.promise=request;request.catch(()=>{if(cache!.promise===request)cache!.promise=undefined;});}
 return cache.promise;
}
/** Read-only: opening statistics never touches the scheduler, admission or FSRS. */
export async function getStatisticsInput(db:EngiDB,s:Snapshot,now=new Date()):Promise<StatisticsInput>{
 const h=await history(db),entries=s.goalCatalog??[],byId=new Map(entries.map(e=>[e.goal.id,e])),properties=new Map<string,StatisticsProperty>();
 const entityMap=new Map(s.bundle.entities.map(e=>[e.id,e])),propertyMap=new Map(propertyDefinitions(s.bundle).map(p=>[p.id,p.name])),factMap=new Map(s.bundle.facts.map(f=>[f.id,f]));
 const decksByEntity=new Map<string,string[]>();for(const member of s.bundle.deckMembers??[]){if(member.archived)continue;const ids=decksByEntity.get(member.entityId)??[];ids.push(member.deckId);decksByEntity.set(member.entityId,ids);}
 const add=(goal:LearningGoal,entityId:string,propertyId?:string)=>{const key=statisticsKey(goal);if(goal.knowledge.kind==='order-relation')return undefined;if(!properties.has(key)){const entity=entityMap.get(entityId),image=s.bundle.media.find(m=>m.entityId===entityId&&!m.archived&&m.primary)?.url;
  properties.set(key,{key,entityId,name:goal.knowledge.kind==='identity'?'Узнавание по изображению':(goal.precision==='period-start-year'?propertyDefinitions(s.bundle).find(p=>p.id===propertyId)?.learning?.periodStart?.name:undefined)??propertyMap.get(propertyId??'')??propertyId??'Свойство',objectName:entity?.name??'Объект',deckIds:decksByEntity.get(entityId)??[],image});}return key;};
 for(const e of entries)add(e.goal,e.goal.knowledge.kind==='identity'?e.goal.knowledge.key:factMap.get(e.goal.knowledge.key)?.entityId??e.entityIds[0],e.propertyId);
 for(const unit of h.lifecycle?.units??[])add(unit.goal,unit.entityId,factMap.get(unit.goal.knowledge.key)?.key);
 const goalKey=(id:string)=>{const entry=byId.get(id);if(entry)return statisticsKey(entry.goal);try{const fields=JSON.parse(id.slice(5));if(!id.startsWith('goal:')||!Array.isArray(fields))return undefined;const key=JSON.stringify([...fields.slice(0,2),...(fields[5]==='period-start-year'?[fields[5]]:[])]);return properties.has(key)?key:undefined;}catch{return undefined;}};
 const data:StatisticsInput={now,properties:[...properties.values()],completions:[],learning:[],known:[],answers:[],activity:[],repairs:[]};
 const byTarget=new Map<string,string[]>();for(const entry of entries)for(const id of entry.targetIds){const keys=byTarget.get(id)??[];keys.push(statisticsKey(entry.goal));byTarget.set(id,keys);}
 const currentMemories=new Map(s.memories.map(m=>[m.id,m]));
 for(const entry of entries)if(entry.targetIds.length&&entry.targetIds.every(id=>currentMemories.get(id)?.initialFamiliarity==='green'))data.known.push(statisticsKey(entry.goal));
 const actualCompletion=new Map<string,string>();
 for(const event of [...h.events,...h.pending])for(const result of event.payload.studyCore?.attempt?.results??[]){const key=goalKey(result.goalId);if(key&&result.acquisitionStageAfter==='completed'&&result.acquisitionStageBefore!=='completed'&&result.correct){const at=event.payload.studyCore.attempt.submittedAt??event.timestamp;if(!actualCompletion.has(key)||at<actualCompletion.get(key)!)actualCompletion.set(key,at);}}
 const migrated=new Set(h.lifecycle?.cards.filter(c=>c.source==='migration').map(c=>c.entityId));
 for(const unit of h.lifecycle?.units??[]){const key=statisticsKey(unit.goal);if(!properties.has(key))continue;if(unit.stage==='completed')data.completions.push({key,at:actualCompletion.get(key)??(migrated.has(unit.entityId)?undefined:unit.completedAt)});else data.learning.push(key);}
 for(const memory of s.goalMemories??[]){const key=goalKey(memory.goalId);if(!key||data.known.includes(key)||h.lifecycle?.units.some(u=>statisticsKey(u.goal)===key))continue;if([2,3].includes(Number(memory.card.state))&&memory.independentSuccesses>0)data.completions.push({key});else if(memory.independentAttempts>0)data.learning.push(key);}
 for(const [key,at]of actualCompletion)data.completions.push({key,at});
 const completionTime=new Map(data.completions.map(c=>[c.key,c.at]));
 const events=new Map([...h.pending,...h.events].map(e=>[e.id,e]));
 for(const event of events.values()){
  const p=event.payload,attempt=p.studyCore?.attempt,keys=[...(event.targetIds??[]),...(p.feedback?.items??[]).map((i:{targetId:string})=>i.targetId)].flatMap(id=>{const k=goalKey(id);return k?[k]:byTarget.get(id)??[];});
  if(!h.pending.some(r=>r.id===event.id)&&!event.id.includes(':pair:')&&p.metadata?.completion!=='abandoned'&&!p.feedback?.invalidContent)data.activity.push({id:event.id,at:p.metadata?.completedAt??event.timestamp,keys});
  // Pair receipts own the learning evidence; their parent summary owns activity.
  const results=attempt?.results??p.targets?.map((r:{targetId:string;independent:boolean;correct:boolean;selfReported?:boolean})=>({goalId:r.targetId,credit:r.independent,correct:r.correct,selfReported:r.selfReported}))??[];
  for(const result of results){const target=legacyUnitId(result.goalId,s.bundle)??result.goalId;
   const legacyKeys=byTarget.get(target)??[],factKeys=legacyKeys.filter(key=>{const [kind,id]=JSON.parse(key);return kind==='fact'&&target.startsWith(`ku:fact:${id}:`);});
   const key=goalKey(result.goalId)??(factKeys.length===1?factKeys[0]:legacyKeys.length===1?legacyKeys[0]:undefined);if(!key)continue;const at=attempt?.submittedAt??event.timestamp;
   const prior=p.metadata?.stabilityTransitions?.find((t:{targetId:string;before:number})=>t.targetId===result.goalId)?.before;
   const graduated=completionTime.get(key),scheduled=!!result.credit&&!result.acquisitionStageBefore&&!result.selfReported&&!p.selfReport&&!p.metadata?.practice&&!p.metadata?.repair&&(prior>0||!!graduated&&Date.parse(graduated)<Date.parse(at));
   data.answers.push({id:event.id+':'+result.goalId,key,at,correct:!!result.correct,scheduled});
  }
 }
 for(const episode of h.episodes)if(episode.status==='resolved'&&episode.resolvedAt)data.repairs.push({id:episode.id,key:statisticsKey(episode.goal),at:episode.resolvedAt});
 return data;
}
