import {withContentWriteLock} from './content-write-lock';
import {db,type EngiDB,type PackRow} from '../db/engi-db';
import {contentTables,getBundle} from '../db/repositories';
import {hashFromUrl,mediaStore} from '../media/media-store';
import {stopStudyTrace} from './study-selection-trace';
const PENDING_MEDIA='packRemoval:pendingMedia';
const values=(packs:PackRow[],key:'entityIds'|'factIds'|'mediaIds'|'tagIds'|'deckIds')=>new Set(packs.flatMap(p=>p[key]??[]));
// Full identifier fields, including encoded goals; e1 must never match e12.
export function removedReference(value:unknown,ids:Set<string>):boolean{
 if(typeof value==='string')return [...ids].some(id=>value===id||value.endsWith(':'+id)||value.startsWith(id+':')||value.includes(':'+id+':')||value.includes('"'+id+'"'));
 if(Array.isArray(value))return value.some(v=>removedReference(v,ids));
 return !!value&&typeof value==='object'&&Object.entries(value).some(([k,v])=>removedReference(k,ids)||removedReference(v,ids));
}
function prune(value:any,ids:Set<string>):any{
 if(typeof value==='string')return removedReference(value,ids)?undefined:value;
 if(Array.isArray(value))return value.filter(v=>!removedReference(v,ids)).map(v=>prune(v,ids));
 if(value&&typeof value==='object'&&!(value instanceof Date))return Object.fromEntries(Object.entries(value).filter(([k])=>!removedReference(k,ids)).map(([k,v])=>[k,prune(v,ids)]).filter(([,v])=>v!==undefined));
 return value;
}
/** Cache Storage is outside IndexedDB's transaction; a durable journal permits retries. */
export async function finishPackMediaCleanup(d:EngiDB=db){return withContentWriteLock(d,()=>finishMediaCleanup(d));}
async function finishMediaCleanup(d:EngiDB){
 const pending=(await d.appMeta.get(PENDING_MEDIA))?.value as string[]|undefined;if(!pending?.length)return;
 for(const hash of pending){
  const referenced=await d.media.where('hash').equals(hash).count(),packs=await d.installedPacks.toArray();
  if(!referenced&&!packs.some(p=>p.files.some(f=>f.sha256===hash)))await mediaStore.remove(hash);
  await d.transaction('rw',d.appMeta,async()=>{const row=await d.appMeta.get(PENDING_MEDIA);if(!row)return;const next=(row.value as string[]).filter(h=>h!==hash);if(next.length)await d.appMeta.put({key:PENDING_MEDIA,value:next});else await d.appMeta.delete(PENDING_MEDIA);});
 }
}
export async function removeInstalledPack(packId:string,d:EngiDB=db){return withContentWriteLock(d,()=>removePack(packId,d));}
async function removePack(packId:string,d:EngiDB){
 const result=await d.transaction('rw',[...contentTables(d),d.learningState,d.reviewEvents,d.activeSessions,d.targetMappings,d.appMeta],async()=>{
  const pack=await d.installedPacks.get(packId);if(!pack)throw Error('Пакет уже удалён');
  const b=await getBundle(d),others=(await d.installedPacks.toArray()).filter(p=>p.packId!==packId);
  const otherEntities=values(others,'entityIds'),otherFacts=values(others,'factIds'),otherMedia=values(others,'mediaIds'),otherDecks=values(others,'deckIds');
  const candidates=new Set([...pack.entityIds,...b.entities.filter(e=>e.originPackId===packId||!others.length&&e.origin==='pack').map(e=>e.id)]);
  const candidateFacts=new Set([...pack.factIds,...b.facts.filter(f=>f.originPackId===packId||candidates.has(f.entityId)&&f.origin!=='user'&&!otherFacts.has(f.id)).map(f=>f.id)]);
  const facts=b.facts.filter(f=>f.origin==='user'||otherFacts.has(f.id)||!candidateFacts.has(f.id));
  const candidateMedia=new Set([...pack.mediaIds,...b.media.filter(m=>m.originPackId===packId||candidates.has(m.entityId)&&m.origin!=='user'&&!otherMedia.has(m.id)).map(m=>m.id)]);
  const imageFacts=new Set(facts.map(f=>f.valueMediaId).filter(Boolean));
  const media=b.media.filter(m=>m.origin==='user'||otherMedia.has(m.id)||imageFacts.has(m.id)||!candidateMedia.has(m.id));
  const ownedDecks=new Set([...(pack.deckIds??[]),...pack.tagIds.map(id=>'deck.legacy.'+id),...(b.decks??[]).filter(d=>d.originPackId===packId).map(d=>d.id)]);
  const decks=new Set((b.decks??[]).filter(d=>ownedDecks.has(d.id)&&d.origin!=='user'&&!otherDecks.has(d.id)&&!others.some(p=>p.tagIds.some(id=>'deck.legacy.'+id===d.id))).map(d=>d.id));
  const ownLink=(p:PackRow,deck:string,entity:string)=>p.deckMembers?p.deckMembers.some(m=>m.deckId===deck&&m.entityId===entity):((p.deckIds??[]).includes(deck)||p.tagIds.some(t=>'deck.legacy.'+t===deck))&&p.entityIds.includes(entity);
  const members=(b.deckMembers??[]).filter(m=>!decks.has(m.deckId)&&(!ownLink(pack,m.deckId,m.entityId)||m.origin==='user'||others.some(p=>ownLink(p,m.deckId,m.entityId))));
  const keep=new Set([...otherEntities,...b.entities.filter(e=>!candidates.has(e.id)||e.origin==='user').map(e=>e.id),...members.map(m=>m.entityId),...b.entityTags.filter(l=>l.origin==='user').map(l=>l.entityId),...media.map(m=>m.entityId)]);
  for(const f of facts){keep.add(f.entityId);if(f.valueEntityId)keep.add(f.valueEntityId);}
  const entities=new Set(b.entities.filter(e=>candidates.has(e.id)&&!keep.has(e.id)).map(e=>e.id));
  const removedFacts=new Set(b.facts.filter(f=>!facts.includes(f)).map(f=>f.id)),removedMedia=new Set(b.media.filter(m=>!media.includes(m)).map(m=>m.id));
  const ownTag=(p:PackRow,e:string,t:string)=>p.entityTags.some(l=>l.entityId===e&&l.tagId===t);
  const links=b.entityTags.filter(l=>!entities.has(l.entityId)&&(!ownTag(pack,l.entityId,l.tagId)||l.origin==='user'||others.some(p=>ownTag(p,l.entityId,l.tagId))));
  const usedTags=new Set([...links.map(l=>l.tagId),...values(others,'tagIds')]);
  let changed=true;while(changed){changed=false;for(const t of b.tags)if(usedTags.has(t.id)&&t.parentId&&!usedTags.has(t.parentId)){usedTags.add(t.parentId);changed=true;}}
  const tags=new Set(b.tags.filter(t=>!usedTags.has(t.id)&&t.origin!=='user'&&(pack.tagIds.includes(t.id)||t.originPackId===packId||!others.length&&t.origin==='pack')).map(t=>t.id));
  const usedProperties=new Set([...facts.map(f=>f.key),...others.flatMap(p=>p.propertyIds??[])]);
  const ownedProperties=new Set([...(pack.propertyIds??[]),...b.facts.filter(f=>removedFacts.has(f.id)).map(f=>f.key)]);
  const properties=new Set((b.properties??[]).filter(p=>!p.builtIn&&p.origin!=='user'&&!usedProperties.has(p.id)&&(ownedProperties.has(p.id)||p.originPackId===packId||!others.length&&p.origin==='pack')).map(p=>p.id));
  const usedTypes=new Set([...b.entities.filter(e=>!entities.has(e.id)).map(e=>e.type),...others.flatMap(p=>p.entityTypeIds??[]),...(b.properties??[]).filter(p=>!properties.has(p.id)).flatMap(p=>[...p.subjectTypes??[],...p.targetTypes??[]])]);
  const ownedTypes=new Set([...(pack.entityTypeIds??[]),...b.entities.filter(e=>entities.has(e.id)).map(e=>e.type)]);
  const types=new Set((b.entityTypes??[]).filter(t=>!t.builtIn&&t.origin!=='user'&&!usedTypes.has(t.id)&&(ownedTypes.has(t.id)||t.originPackId===packId||!others.length&&t.origin==='pack')).map(t=>t.id));
  const ids=new Set([packId,...entities,...removedFacts,...removedMedia,...decks,...tags,...properties,...types]);
  await d.entities.bulkDelete([...entities]);await d.facts.bulkDelete([...removedFacts]);await d.media.bulkDelete([...removedMedia]);await d.tags.bulkDelete([...tags]);await d.propertyDefinitions.bulkDelete([...properties]);await d.entityTypes.bulkDelete([...types]);await d.decks.bulkDelete([...decks]);
  await d.entityTags.bulkDelete(b.entityTags.filter(l=>!links.includes(l)).map(l=>[l.entityId,l.tagId]));
  await d.deckMembers.bulkDelete((b.deckMembers??[]).filter(m=>!members.includes(m)).map(m=>[m.deckId,m.entityId]));
  for(const deck of (b.decks??[]).filter(d=>!decks.has(d.id)))await d.decks.put({...deck,...(deck.parentId&&decks.has(deck.parentId)?{parentId:undefined}:{}),learning:{...deck.learning,propertyIds:deck.learning.propertyIds?.filter(id=>!properties.has(id)),excludedFactIds:deck.learning.excludedFactIds?.filter(id=>!removedFacts.has(id))}});
  await d.installedPacks.delete(packId);
  const meta=await d.appMeta.toArray();
  for(const row of meta.filter(r=>r.key.startsWith('studyCore:contract:')))if(removedReference(row.value,ids))ids.add(row.value.id);
  // A mixed task cannot survive with deleted options. Other knowledge keeps its own memory.
  for(const s of await d.activeSessions.toArray())if(removedReference(s,ids)){await d.activeSessions.delete(s.id);ids.add(s.id);for(const t of s.tasks??[])ids.add(t.id);}
  for(const e of await d.reviewEvents.toArray())if(removedReference(e,ids)){await d.reviewEvents.delete(e.id);ids.add(e.id);}
  const linked=meta.filter(r=>/^studyCore:(contract|attempt|openAttempt|taskAttempt|episode|reviewReceipt):/.test(r.key));
  changed=true;while(changed){changed=false;for(const row of linked)if(removedReference(row,ids)){const id=row.key.slice(row.key.indexOf(':',10)+1);if(!ids.has(id)){ids.add(id);changed=true;}if(typeof row.value==='string'&&!ids.has(row.value)){ids.add(row.value);changed=true;}}}
  for(const row of await d.learningState.toArray())if(removedReference(row.id,ids)||removedReference(row.payload.legacyOf,ids)){await d.learningState.delete(row.id);ids.add(row.id);}else await d.learningState.put({...row,payload:prune(row.payload,ids)});
  for(const row of await d.targetMappings.toArray())if(removedReference(row,ids))await d.targetMappings.delete(row.legacyId);
  const derived=new Set(['studyCore:dayPlan','studyCore:goalCatalogCache','studyCore:goalSelector','studyCore:practiceSelector']);
  for(const row of meta){
   if(row.key===PENDING_MEDIA)continue;
   if(derived.has(row.key)||removedReference(row.key,ids)){await d.appMeta.delete(row.key);continue;}
   if(!removedReference(row.value,ids))continue;
   if(row.key==='studyCore:learningLifecycle'){
    const v=row.value,units=v.units.filter((u:any)=>!removedReference(u.entityId,ids)&&!removedReference(u.goal,ids)).map((u:any)=>({...u,attemptIds:u.attemptIds.filter((id:string)=>!ids.has(id)),contextEvidence:u.contextEvidence?.filter((e:unknown)=>!removedReference(e,ids))})),cards=v.cards.filter((c:any)=>!entities.has(c.entityId));
    if(cards.length)await d.appMeta.put({key:row.key,value:{...v,cards,units}});else await d.appMeta.delete(row.key);
   }else if(/^studyCore:(contract|attempt|openAttempt|taskAttempt|episode|reviewReceipt|revision|exposure|intervalEvidence):/.test(row.key))await d.appMeta.delete(row.key);
   else await d.appMeta.put({key:row.key,value:prune(row.value,ids)});
  }
  const hashes=new Set<string>([...(await d.appMeta.get(PENDING_MEDIA))?.value??[],...pack.files.map(f=>f.sha256),...b.media.filter(m=>removedMedia.has(m.id)).map(m=>hashFromUrl(m.url)).filter((h):h is string=>!!h)]);
  if(hashes.size)await d.appMeta.put({key:PENDING_MEDIA,value:[...hashes]});
  return {entities:entities.size,facts:removedFacts.size};
 });
 stopStudyTrace(d);await finishMediaCleanup(d);return result;
}
