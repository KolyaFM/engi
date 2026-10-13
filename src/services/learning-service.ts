import {withContentWriteLock} from './content-write-lock';
import {db,type EngiDB} from '../db/engi-db';
import {getBundle,learningRow,contentTables} from '../db/repositories';
import {canonicalTargets} from '../lib/engi/questions/recipe-factory';
import {triagedMemory} from '../lib/engi/learning/bootstrap';
import {BUILTIN_PROPERTIES,BUILTIN_TYPES} from '../lib/engi/knowledge/properties';
import {mediaStore} from '../media/media-store';
import {buildGoalCatalog} from './goal-catalog';
import {readLifecycle,LIFECYCLE_KEY} from './learning-lifecycle-service';
import {admitAcquisition,acquisitionKey} from '../lib/engi/study-core/acquisition';
export async function setUnitSuspended(id:string,suspend:boolean,d:EngiDB=db){
 await d.transaction('rw',[...contentTables(d),d.learningState,d.activeSessions,d.appMeta],async()=>{
  const targets=canonicalTargets(await getBundle(d)),item=targets.find(i=>i.targetId===id);if(!item)throw Error('Знание больше не доступно');
  const old=await d.learningState.get(id),m=old?.payload??triagedMemory(item,'red','',0);
  if(suspend){if(m.status!=='suspended')m.suspendedFrom=m.status??'review';m.status='suspended'}else {m.status=m.suspendedFrom??(m.attempts>0?(m.bootstrap?'learning':'review'):'triaged');delete m.suspendedFrom}
  if(!suspend)m.card.due=new Date();await d.learningState.put(learningRow(m));
  for(const sibling of targets.filter(i=>!!item.factId&&i.factId===item.factId&&i.targetId!==id)){
   const old=await d.learningState.get(sibling.targetId),row=old?.payload??triagedMemory(sibling,m.initialFamiliarity??'red','',0);
   if(suspend){if(row.status!=='suspended')row.suspendedFrom=row.status??'triaged';row.status='suspended';}else{row.status=row.suspendedFrom??'triaged';delete row.suspendedFrom;row.card.due=new Date();}
   await d.learningState.put(learningRow(row));
  }
  if(!suspend){let ledger=await readLifecycle(d);if(ledger){const catalog=buildGoalCatalog(await getBundle(d),(await d.learningState.toArray()).map(r=>r.payload)),entries=catalog.filter(e=>!e.suspended&&e.targetIds.includes(id)&&!ledger!.units.some(u=>u.key===acquisitionKey(e.goal)));
   for(const card of ledger.cards){const goals=entries.filter(e=>e.entityIds.includes(card.entityId)).map(e=>e.goal);if(goals.length)ledger=admitAcquisition(ledger,card.entityId,goals,new Date(),'migration');}
   await d.appMeta.put({key:LIFECYCLE_KEY,value:ledger});}}
  await d.activeSessions.where('status').equals('active').modify({status:'completed'});
 });
}
export async function resetLearningProgress(d:EngiDB=db){
 await d.transaction('rw',[d.learningState,d.reviewEvents,d.activeSessions,d.targetMappings,d.appMeta],async()=>{
  await d.learningState.clear();
  await d.reviewEvents.clear();
  await d.activeSessions.clear();
  await d.targetMappings.clear();
  await d.appMeta.bulkDelete(['dailyLearning','newLearning','introducedEntities','reviewsSinceBackup']);
  await d.appMeta.where('key').startsWith('studyCore:').delete();
 });
}
export async function clearAllData(d:EngiDB=db){return withContentWriteLock(d,()=>clearDataUnlocked(d));}
async function clearDataUnlocked(d:EngiDB){
 const tables=[...contentTables(d),d.learningState,d.reviewEvents,d.activeSessions,d.targetMappings,d.appMeta];
 await d.transaction('rw',tables,async()=>{
  for(const table of tables){
   await table.clear();
  }
  await d.propertyDefinitions.bulkPut(BUILTIN_PROPERTIES);
  await d.entityTypes.bulkPut(BUILTIN_TYPES);
 });
 try{await mediaStore.clear()}catch{}
}
