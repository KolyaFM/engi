import {reconcileKnowledgeUnits} from '../db/learning-migration';
import {z} from 'zod';
import {db,type EngiDB} from '../db/engi-db';
import {APP_DB_VERSION} from '../db/migrations';
import {getBundle,putBundle,contentTables} from '../db/repositories';
import {validateImport} from '../lib/engi/validate';
import {mediaStore,hashFromUrl} from '../media/media-store';
import {sha256,checkImage,MAX_MEDIA_BYTES,manifestSchema,MAX_PACK_BYTES} from './pack-format';
import {learningRow} from '../db/repositories';
const date=z.union([z.string(),z.date()]).refine(x=>Number.isFinite(new Date(x).getTime()));
const count=z.number().int().nonnegative();
export const memorySchema=z.object({id:z.string().min(1).max(500),card:z.object({due:date,stability:z.number().finite().nonnegative(),difficulty:z.number().finite().min(0).max(10),elapsed_days:z.number().finite().nonnegative(),scheduled_days:z.number().finite().nonnegative(),reps:count,lapses:count,state:z.number().int().min(0).max(3),learning_steps:count,last_review:date.optional()}).passthrough(),attempts:count,correct:count,firstSuccessAt:date.optional(),confusions:z.record(z.number().finite().nonnegative())}).passthrough().refine(m=>m.correct<=m.attempts);
const eventSchema=z.object({id:z.string().min(1).max(500),timestamp:z.string().refine(x=>Number.isFinite(new Date(x).getTime())),recipe:z.string(),level:z.string(),targetIds:z.array(z.string()).default([]),payload:z.unknown()});
const backupSchema=z.object({format:z.literal('engi-backup'),schemaVersion:z.union([z.literal(1),z.literal(2),z.literal(3)]),appDbVersion:z.number().int().min(1).max(APP_DB_VERSION),exportedAt:z.string().datetime({offset:true}),learningState:z.array(z.object({id:z.string(),payload:memorySchema})),reviewEvents:z.array(eventSchema),installedPacks:z.array(manifestSchema.passthrough()),settings:z.record(z.unknown()),confusions:z.record(z.record(z.number().finite().nonnegative())),targetMappings:z.array(z.object({legacyId:z.string(),unitId:z.string()})).default([]),userKnowledge:z.unknown().optional(),userMedia:z.array(z.object({hash:z.string().regex(/^[a-f0-9]{64}$/),mime:z.enum(['image/png','image/jpeg','image/webp']),data:z.string()})).default([])});
function encode(bytes:Uint8Array){let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.slice(i,i+32768));return btoa(s)}
export async function exportBackup(d:EngiDB=db){
 await reconcileKnowledgeUnits(d);const data=await d.transaction('r',[...contentTables(d),d.learningState,d.reviewEvents,d.appMeta,d.targetMappings],async()=>({format:'engi-backup' as const,schemaVersion:3,appDbVersion:APP_DB_VERSION,exportedAt:new Date().toISOString(),learningState:await d.learningState.toArray(),reviewEvents:await d.reviewEvents.orderBy('timestamp').toArray(),installedPacks:await d.installedPacks.toArray(),settings:Object.fromEntries((await d.appMeta.toArray()).map(r=>[r.key,r.value])),targetMappings:await d.targetMappings.toArray(),confusions:Object.fromEntries((await d.learningState.toArray()).map(r=>[r.id,r.payload.confusions])),userKnowledge:await getBundle(d)}));
 const userMedia:{hash:string;mime:string;data:string}[]=[];for(const m of data.userKnowledge.media){const hash=hashFromUrl(m.url);if(!hash||userMedia.some(x=>x.hash===hash))continue;const blob=await mediaStore.getBlob(hash);userMedia.push({hash,mime:blob.type,data:encode(new Uint8Array(await blob.arrayBuffer()))})}return {...data,userMedia};
}
export async function restoreBackup(input:unknown,d:EngiDB=db){
 const backup=backupSchema.parse(input);if(new Set(backup.learningState.map(r=>r.id)).size!==backup.learningState.length||new Set(backup.reviewEvents.map(e=>e.id)).size!==backup.reviewEvents.length)throw Error('Повтор ID в копии');for(const r of backup.learningState)if(r.id!==r.payload.id)throw Error('ID состояния не совпадает');
 const current=await getBundle(d),knowledge=backup.schemaVersion>=2&&backup.userKnowledge?validateImport(backup.userKnowledge,current,true):undefined;
 const restoredMedia=[];let total=0;for(const m of backup.userMedia){if(m.data.length>Math.ceil(MAX_MEDIA_BYTES/3)*4+4)throw Error('Изображение в копии слишком большое');const blob=new Blob([Uint8Array.from(atob(m.data),c=>c.charCodeAt(0))],{type:m.mime});total+=blob.size;if(total>MAX_PACK_BYTES||blob.size>MAX_MEDIA_BYTES||await sha256(blob)!==m.hash)throw Error('Неверное изображение в копии');await checkImage(blob,m.mime);restoredMedia.push({...m,blob})}
 const added=new Set<string>();try{for(const m of restoredMedia){if(!await mediaStore.has(m.hash)){await mediaStore.put(m.hash,m.blob);added.add(m.hash)}}
 await d.transaction('rw',[...contentTables(d),d.learningState,d.reviewEvents,d.appMeta,d.activeSessions,d.targetMappings],async()=>{
  if(knowledge)await putBundle(d,knowledge);if(backup.targetMappings.length)await d.targetMappings.bulkPut(backup.targetMappings);for(const r of backup.learningState)await d.learningState.put(learningRow(r.payload as any));
  for(const e of backup.reviewEvents){const old=await d.reviewEvents.get(e.id);if(old&&JSON.stringify(old.payload)!==JSON.stringify(e.payload))throw Error('Конфликт ID истории');if(!old)await d.reviewEvents.add({...e,payload:e.payload})}
  for(const [key,value]of Object.entries(backup.settings))await d.appMeta.put({key,value});if(backup.schemaVersion===3)await d.installedPacks.bulkPut(backup.installedPacks as any);else await d.appMeta.put({key:'restoredPackMetadata',value:backup.installedPacks});
  if(backup.schemaVersion<3&&knowledge){for(const t of knowledge.tags){const id='deck.legacy.'+t.id;if(!await d.decks.get(id))await d.decks.put({id,name:t.name,learning:{imageRecognition:true}});for(const m of knowledge.entityTags.filter(m=>m.tagId===t.id&&!m.archived))await d.deckMembers.put({deckId:id,entityId:m.entityId});}}
  await d.appMeta.put({key:'lastBackupAt',value:backup.exportedAt});await d.appMeta.put({key:'reviewsSinceBackup',value:0});await d.activeSessions.where('status').equals('active').modify({status:'completed'});
 });}catch(e){for(const hash of added)if(!await d.media.where('hash').equals(hash).count())await mediaStore.remove(hash);throw e}
 await reconcileKnowledgeUnits(d);return backup.learningState.length;
}
export async function saveBackup(){const data=await exportBackup(),name=`engi-backup-${new Date().toISOString().slice(0,10)}.engi-backup`,file=new File([JSON.stringify(data)],name,{type:'application/json'});let shared=false;if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:'Резервная копия Энги'});shared=true}catch(e){if((e as Error).name==='AbortError')return;}}
 if(!shared){const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}await db.appMeta.bulkPut([{key:'lastBackupAt',value:new Date().toISOString()},{key:'reviewsSinceBackup',value:0}])}
