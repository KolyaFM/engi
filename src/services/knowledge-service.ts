import {db,type EngiDB} from '../db/engi-db';
import {contentTables,getBundle,putBundle} from '../db/repositories';
import {validateImport,propertySchema,typeSchema} from '../lib/engi/validate';
import {factValue,trusted} from '../lib/engi/knowledge/properties';
import type {Bundle,Entity,Fact,PropertyDefinition,EntityTypeDefinition,Tag,Media} from '../lib/engi/types';
import {sha256,checkImage,MAX_MEDIA_BYTES} from './pack-format';
import {mediaStore} from '../media/media-store';
export const newId=()=>`user.${crypto.randomUUID()}`;
const owned=<T extends object>(row:T)=>({...row,userModified:true,origin:('origin' in row?(row as any).origin:undefined)??'user'});
export async function saveKnowledge(delta:Partial<Bundle>,d:EngiDB=db){
 return d.transaction('rw',[...contentTables(d),d.learningState,d.activeSessions],async()=>{
  const current=await getBundle(d);const input={entities:[],facts:[],media:[],tags:[],entityTags:[],properties:[],entityTypes:[],missing:[],unresolved:[],...delta};
  for(const key of ['entities','facts','media','tags','entityTags','properties','entityTypes'] as const)(input as any)[key]=(input[key]??[]).map(owned);
  const clean=validateImport(input,current,true);
  // Validate final graph as well: changing object type may invalidate existing relations.
  const final={...current};for(const key of ['entities','facts','media','tags','properties','entityTypes'] as const)(final as any)[key]=[...new Map([...(current[key]??[]),...(clean[key]??[])].map(row=>[row.id,row])).values()];
  validateImport(final,{entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[]},true);
  for(const f of clean.facts){const old=current.facts.find(x=>x.id===f.id);if(old&&factValue(old)!==factValue(f)){const rows=await d.learningState.filter(r=>r.id.startsWith(`fact:${f.id}:`)).primaryKeys();await d.learningState.bulkDelete(rows)}}
  for(const p of clean.properties??[]){const old=current.properties?.find(x=>x.id===p.id);if(old&&old.cardinality!==p.cardinality){/* Semantics change affects generation, historical states remain. */}}
  await putBundle(d,clean);const active=await d.activeSessions.where('status').equals('active').toArray();for(const s of active)await d.activeSessions.update(s.id,{status:'completed'});return clean;
 });
}
export async function saveEntity(entity:Entity,facts:Fact[],tagIds:string[],d:EngiDB=db){const existing=await getBundle(d);const assignments=existing.entityTags.filter(t=>t.entityId===entity.id);const entityTags=[...assignments.filter(t=>!tagIds.includes(t.tagId)).map(t=>({...t,archived:true})),...tagIds.map(tagId=>({...assignments.find(t=>t.tagId===tagId),entityId:entity.id,tagId,archived:false}))];return saveKnowledge({entities:[entity],facts,entityTags},d)}
export async function archiveEntity(id:string,d:EngiDB=db){const b=await getBundle(d);const e=b.entities.find(e=>e.id===id);if(!e)throw Error('Объект не найден');return saveKnowledge({entities:[{...e,archived:true}],facts:b.facts.filter(f=>f.entityId===id).map(f=>({...f,archived:true}))},d)}
export const saveProperty=(p:PropertyDefinition,d:EngiDB=db)=>saveKnowledge({properties:[propertySchema.parse(p)]},d);
export const saveEntityType=(t:EntityTypeDefinition,d:EngiDB=db)=>saveKnowledge({entityTypes:[typeSchema.parse(t)]},d);
export const saveTag=(t:Tag,d:EngiDB=db)=>saveKnowledge({tags:[t]},d);
export async function uploadImage(entityId:string,file:Blob,role='primary',d:EngiDB=db){if(file.size>MAX_MEDIA_BYTES)throw Error('Изображение больше 16 МБ');const mime=file.type;if(!['image/webp','image/jpeg','image/png'].includes(mime))throw Error('Выберите PNG, JPEG или WebP');await checkImage(file,mime);const hash=await sha256(file);await mediaStore.put(hash,file);const row:Media={id:newId(),entityId,role,url:'engi-media://'+hash,license:'Личное изображение',origin:'user',primary:true,learningExemplar:true};const old=(await d.media.where('entityId').equals(entityId).toArray()).map(m=>({...m,primary:false}));await saveKnowledge({media:[...old,row]},d);return row}
export function conflicts(b:Bundle){const groups=new Map<string,Fact[]>();for(const f of b.facts.filter(trusted)){const key=JSON.stringify([f.entityId,f.key]);groups.set(key,[...groups.get(key)??[],f])}return [...groups.values()].filter(g=>b.properties?.find(p=>p.id===g[0].key)?.cardinality!=='many'&&new Set(g.map(factValue)).size>1).flat()}
