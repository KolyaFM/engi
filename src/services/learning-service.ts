import {db,type EngiDB} from '../db/engi-db';
import {getBundle,learningRow,contentTables} from '../db/repositories';
import {canonicalTargets} from '../lib/engi/questions/recipe-factory';
import {triagedMemory} from '../lib/engi/learning/bootstrap';
import {BUILTIN_PROPERTIES,BUILTIN_TYPES} from '../lib/engi/knowledge/properties';
import {mediaStore} from '../media/media-store';
export async function setUnitSuspended(id:string,suspend:boolean,d:EngiDB=db){
 await d.transaction('rw',[...contentTables(d),d.learningState,d.activeSessions],async()=>{
  const item=canonicalTargets(await getBundle(d)).find(i=>i.targetId===id);if(!item)throw Error('Знание больше не доступно');
  const old=await d.learningState.get(id),m=old?.payload??triagedMemory(item,'red','',0);
  if(suspend){if(m.status!=='suspended')m.suspendedFrom=m.status??'review';m.status='suspended'}else {m.status=m.suspendedFrom??(m.attempts>0?(m.bootstrap?'learning':'review'):'triaged');delete m.suspendedFrom}
  if(!suspend)m.card.due=new Date();await d.learningState.put(learningRow(m));
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
export async function clearAllData(d:EngiDB=db){
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
