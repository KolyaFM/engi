import {db,type EngiDB} from '../db/engi-db';
import {getBundle,learningRow,contentTables} from '../db/repositories';
import {canonicalTargets} from '../lib/engi/questions/recipe-factory';
import {triagedMemory} from '../lib/engi/learning/bootstrap';
export async function setUnitSuspended(id:string,suspend:boolean,d:EngiDB=db){
 await d.transaction('rw',[...contentTables(d),d.learningState,d.activeSessions],async()=>{
  const item=canonicalTargets(await getBundle(d)).find(i=>i.targetId===id);if(!item)throw Error('Знание больше не доступно');
  const old=await d.learningState.get(id),m=old?.payload??triagedMemory(item,'red','',0);
  if(suspend){if(m.status!=='suspended')m.suspendedFrom=m.status??'review';m.status='suspended'}else {m.status=m.suspendedFrom??(m.attempts>0?(m.bootstrap?'learning':'review'):'triaged');delete m.suspendedFrom}
  if(!suspend)m.card.due=new Date();await d.learningState.put(learningRow(m));
  await d.activeSessions.where('status').equals('active').modify({status:'completed'});
 });
}
