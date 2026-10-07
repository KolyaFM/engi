import {db,type EngiDB} from '../db/engi-db';
import {contentTables,getBundle,putBundle,learningRow,emptyBundle} from '../db/repositories';
import {validateImport} from '../lib/engi/validate';
import {factValue,textValue} from '../lib/engi/knowledge/properties';
import type {Bundle,Memory} from '../lib/engi/types';
const sources=(a:Bundle['facts'][number],b:Bundle['facts'][number])=>[...new Map([a.source,...a.sources??[],b.source,...b.sources??[]].map(s=>[JSON.stringify(s),s])).values()];
export function previewEntityMerge(b:Bundle,fromId:string,toId:string){
 const from=b.entities.find(e=>e.id===fromId&&!e.archived),to=b.entities.find(e=>e.id===toId&&!e.archived);if(!from||!to||fromId===toId)throw Error('Выберите два разных объекта');if(from.type!==to.type)throw Error('Объединять можно объекты одного типа');
 const externalConflicts=Object.entries(from.externalIds).filter(([k,v])=>to.externalIds[k]&&to.externalIds[k]!==v);if(externalConflicts.length)throw Error('Внешние идентификаторы противоречат друг другу');
 const conflicts:string[]=[];for(const f of b.facts.filter(f=>f.entityId===fromId&&!f.archived)){const p=b.properties?.find(p=>p.id===f.key);if(p?.cardinality==='one'&&b.facts.some(g=>g.entityId===toId&&g.key===f.key&&!g.archived&&factValue(g)!==factValue(f)))conflicts.push(`${p.name}: ${textValue(f,b)}`)}
 return {from,to,facts:b.facts.filter(f=>!f.archived&&(f.entityId===fromId||f.valueEntityId===fromId)).length,media:b.media.filter(m=>m.entityId===fromId&&!m.archived).length,conflicts};
}
function conservativeMemory(rows:Memory[],id:string):Memory{const weak=[...rows].sort((a,b)=>a.card.stability-b.card.stability)[0];const result:Memory={...structuredClone(weak),id,legacyOf:undefined,card:{...weak.card,stability:Math.min(...rows.map(r=>r.card.stability)),difficulty:Math.max(...rows.map(r=>r.card.difficulty)),due:new Date(Math.min(...rows.map(r=>new Date(r.card.due).getTime())))},attempts:Math.max(...rows.map(r=>r.attempts)),correct:Math.min(...rows.map(r=>r.correct)),confusions:{}};for(const r of rows)for(const [key,n]of Object.entries(r.confusions))result.confusions[key]=Math.max(result.confusions[key]??0,n);return result}
export async function mergeEntities(fromId:string,toId:string,d:EngiDB=db){return d.transaction('rw',[...contentTables(d),d.learningState,d.reviewEvents,d.targetMappings,d.activeSessions,d.appMeta],async()=>{
 const current=await getBundle(d),preview=previewEntityMerge(current,fromId,toId),b=structuredClone(current),from=b.entities.find(e=>e.id===fromId)!,to=b.entities.find(e=>e.id===toId)!;
 to.aliases=[...new Set([...to.aliases,...from.aliases,from.name])];to.externalIds={...from.externalIds,...to.externalIds};to.summary=to.summary??from.summary;to.userModified=true;from.archived=true;from.mergedInto=toId;from.externalIds={};from.userModified=true;
 const mappings=new Map<string,string>();mappings.set(`ku:entity:${fromId}:visual_identity`,`ku:entity:${toId}:visual_identity`);
 for(const f of b.facts){if(f.entityId===fromId)f.entityId=toId;if(f.valueEntityId===fromId)f.valueEntityId=toId;}
 const canonical=new Map<string,Bundle['facts'][number]>();for(const f of [...b.facts].sort((a,c)=>Number(current.facts.find(x=>x.id===c.id)?.entityId===toId)-Number(current.facts.find(x=>x.id===a.id)?.entityId===toId))){if(f.archived)continue;const key=JSON.stringify([f.entityId,f.key,factValue(f)]),old=canonical.get(key);if(!old){canonical.set(key,f);continue}old.sources=sources(old,f);f.archived=true;for(const direction of ['forward','reverse'])mappings.set(`ku:fact:${f.id}:${direction}`,`ku:fact:${old.id}:${direction}`);}
 for(const p of b.properties??[]){if(p.cardinality!=='one')continue;const groups=new Map<string,Bundle['facts']>();for(const f of b.facts.filter(f=>f.key===p.id&&!f.archived)){const group=groups.get(f.entityId)??[];group.push(f);groups.set(f.entityId,group)}for(const group of groups.values())if(new Set(group.map(factValue)).size>1)for(const f of group)f.verification='conflict';}
 for(const m of b.media)if(m.entityId===fromId){m.entityId=toId;m.userModified=true;if(b.media.some(x=>x.id!==m.id&&x.entityId===toId&&x.primary&&!x.archived))m.primary=false;const same=b.media.find(x=>x.id!==m.id&&x.entityId===toId&&x.url===m.url&&x.role===m.role&&!x.archived);if(same)m.archived=true;}
 for(const row of b.entityTags)if(row.entityId===fromId){row.entityId=toId;row.userModified=true}b.entityTags=[...new Map(b.entityTags.map(m=>[JSON.stringify([m.entityId,m.tagId]),m])).values()];
 for(const row of b.deckMembers??[])if(row.entityId===fromId){row.entityId=toId;row.userModified=true}b.deckMembers=[...new Map((b.deckMembers??[]).map(m=>[JSON.stringify([m.deckId,m.entityId]),m])).values()];
 for(const deck of b.decks??[])if(deck.learning.excludedFactIds)deck.learning.excludedFactIds=[...new Set(deck.learning.excludedFactIds.map(id=>mappings.get(`ku:fact:${id}:forward`)?.slice(8,-8)??id))];
 validateImport(b,emptyBundle(),true);await d.entityTags.where('entityId').equals(fromId).delete();await d.deckMembers.where('entityId').equals(fromId).delete();await putBundle(d,b);
 for(const [oldId,newId]of mappings){const old=await d.learningState.get(oldId);if(old&&!old.payload.legacyOf){const next=await d.learningState.get(newId);await d.learningState.put(learningRow(conservativeMemory([old.payload,...next?[next.payload]:[]],newId)));await d.learningState.put(learningRow({...old.payload,legacyOf:newId}));}await d.targetMappings.put({legacyId:oldId,unitId:newId});}
 const packs=await d.installedPacks.toArray();for(const pack of packs){pack.entityIds=[...new Set(pack.entityIds.map(id=>id===fromId?toId:id))];await d.installedPacks.put(pack);}
 await d.activeSessions.where('status').equals('active').modify({status:'completed'});return preview;
 })}
