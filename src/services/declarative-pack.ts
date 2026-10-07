import {ZipReader,BlobReader,BlobWriter,TextWriter,configure,type Entry} from '@zip.js/zip.js';
import {db,type EngiDB,type PackRow} from '../db/engi-db';
import {getBundle,putBundle,contentTables} from '../db/repositories';
import {parseV3,type PackageV3} from '../lib/engi/import/schema-v3';
import {buildImportPlan,type ImportDecisions} from '../lib/engi/import/semantic-merge';
import {mediaStore} from '../media/media-store';
import {safePath,sha256,checkImage,MAX_PACK_BYTES,MAX_MEDIA_BYTES,manifestV3Schema} from './pack-format';
import type {Bundle} from '../lib/engi/types';
configure({useWebWorkers:typeof Worker!=='undefined'});
export type PreparedImport={pkg:PackageV3;current:Bundle;seed:string;packId:string;files:{path:string;bytes:number;sha256:string;mime:'image/png'|'image/jpeg'|'image/webp'}[];blobs:Map<string,Blob>;mediaUrls:Record<string,string>;decisions:ImportDecisions;createdAt:string};
const checkAbort=(signal?:AbortSignal)=>{if(signal?.aborted)throw new DOMException('Импорт отменён','AbortError')};
export async function prepareDeclarativePack(file:Blob,d:EngiDB=db,onProgress:(s:string)=>void=()=>{},signal?:AbortSignal):Promise<PreparedImport|undefined>{
 if(file.size>MAX_PACK_BYTES)throw Error('Пакет больше 512 МБ');const reader=new ZipReader(new BlobReader(file));try{
  onProgress('Проверяем структуру пакета…');checkAbort(signal);const entries=await reader.getEntries(),map=new Map<string,Entry>();let total=0;
  if(entries.length>50010)throw Error('Слишком много файлов');for(const e of entries){const path=e.directory?e.filename.replace(/\/$/,''):e.filename;if(!safePath(path)||map.has(e.filename)||e.encrypted)throw Error('Недопустимый путь ZIP');if(!e.directory){total+=e.uncompressedSize;if(total>MAX_PACK_BYTES||e.uncompressedSize>MAX_MEDIA_BYTES||e.uncompressedSize/Math.max(1,e.compressedSize)>100)throw Error('Превышен размер ZIP')}map.set(e.filename,e);}
  const json=async(path:string)=>{const e=map.get(path);if(!e||e.directory)throw Error(`Нет ${path}`);return JSON.parse(await e.getData!(new TextWriter(),{checkSignature:true}))};
  const raw=await json('bundle.json');if(raw.schemaVersion!==3)return undefined;const pkg=parseV3(raw),manifest=map.has('manifest.json')?manifestV3Schema.parse(await json('manifest.json')):undefined;
  const paths=[...new Set(pkg.entities.flatMap(e=>e.images.map(m=>m.file)))];const files:PreparedImport['files']=[],blobs=new Map<string,Blob>(),mediaUrls:Record<string,string>={};
  if(manifest&&new Set(manifest.files.map(f=>f.path)).size!==manifest.files.length)throw Error('Повтор файла в manifest');
  const declared=new Set(manifest?.files.map(f=>f.path)??paths);for(const e of entries)if(!e.directory&&!['bundle.json','manifest.json'].includes(e.filename)&&!declared.has(e.filename))throw Error('Незаявленный файл в ZIP');
  for(const [n,path]of [...declared].entries()){checkAbort(signal);const entry=map.get(path),meta=manifest?.files.find(f=>f.path===path),mime=meta?.mime??(/\.png$/i.test(path)?'image/png':/\.jpe?g$/i.test(path)?'image/jpeg':/\.webp$/i.test(path)?'image/webp':undefined);if(!entry||entry.directory||!safePath(path)||!path.startsWith('media/')||!mime)throw Error(`Недопустимый файл ${path}`);onProgress(`Проверяем изображения ${n+1} / ${declared.size}`);const blob=await entry.getData!(new BlobWriter(mime),{checkSignature:true}),hash=await sha256(blob);if(meta&&(meta.bytes!==blob.size||meta.sha256!==hash))throw Error('Изображение не соответствует manifest');await checkImage(blob,mime);files.push({path,bytes:blob.size,sha256:hash,mime});blobs.set(hash,blob);mediaUrls[path]='engi-media://'+hash;}
  for(const path of paths)if(!mediaUrls[path])throw Error(`Не найдено изображение ${path}`);
  const current=await getBundle(d),packId='semantic.'+await sha256(new Blob([JSON.stringify(pkg),JSON.stringify(files)])),prior=await d.installedPacks.get(packId),decisions:ImportDecisions={};if(prior?.deckIds?.[0]&&current.decks?.some(x=>x.id===prior.deckIds![0]&&!x.archived))decisions.deck=prior.deckIds[0];
  return {pkg,current,seed:crypto.randomUUID(),packId,files,blobs,mediaUrls,decisions,createdAt:manifest?.createdAt??new Date().toISOString()};
 }finally{await reader.close()}
}
export const planDeclarativeImport=(p:PreparedImport,decisions:ImportDecisions=p.decisions)=>buildImportPlan(p.pkg,p.current,decisions,p.seed,p.mediaUrls);
export async function commitDeclarativeImport(p:PreparedImport,decisions:ImportDecisions=p.decisions,d:EngiDB=db,onProgress:(s:string)=>void=()=>{},signal?:AbortSignal){
 checkAbort(signal);const plan=planDeclarativeImport(p,decisions);if(plan.issues.length)throw Error('Сначала разрешите все неоднозначности');const missing=[];for(const f of p.files)if(!await mediaStore.has(f.sha256))missing.push(f);
 const estimate=await globalThis.navigator?.storage?.estimate?.(),needed=missing.reduce((n,f)=>n+f.bytes,0);if(estimate?.quota&&estimate.quota-(estimate.usage??0)<needed*1.15+1024*1024)throw Error('Недостаточно места');
 const added=new Set<string>();try{
  for(const [n,f]of missing.entries()){checkAbort(signal);onProgress(`Сохраняем изображения ${n+1} / ${missing.length}`);await mediaStore.put(f.sha256,p.blobs.get(f.sha256)!);added.add(f.sha256)}checkAbort(signal);onProgress('Сохраняем набор…');
  await d.transaction('rw',[...contentTables(d),d.activeSessions,d.learningState],async()=>{
   const current=await getBundle(d);if(JSON.stringify(current)!==JSON.stringify(p.current))throw Error('База изменилась после подготовки импорта. Откройте пакет ещё раз.');
   await putBundle(d,plan.bundle); // All identity decisions and graph writes are one transaction.
   const row:PackRow={...{format:'engi-pack',schemaVersion:2},packId:p.packId,packVersion:1,name:p.pkg.name,createdAt:p.createdAt,files:p.files,entityIds:plan.entityIds,factIds:plan.factIds,mediaIds:plan.bundle.media.filter(m=>p.files.some(f=>m.url==='engi-media://'+f.sha256)).map(m=>m.id),tagIds:plan.bundle.tags.filter(t=>!p.current.tags.some(x=>x.id===t.id)).map(t=>t.id),entityTags:plan.bundle.entityTags.filter(t=>!p.current.entityTags.some(x=>x.entityId===t.entityId&&x.tagId===t.tagId)),deckIds:plan.deckId?[plan.deckId]:[],installedAt:new Date().toISOString()};await d.installedPacks.put(row);await d.activeSessions.where('status').equals('active').modify({status:'completed'});
  });return {...plan.stats,entities:plan.stats.newEntities,facts:plan.stats.newFacts,name:p.pkg.name};
 }catch(error){for(const hash of added){const referenced=await d.media.where('hash').equals(hash).count();const packs=await d.installedPacks.toArray();if(!referenced&&!packs.some(x=>x.files.some(f=>f.sha256===hash)))await mediaStore.remove(hash)}throw error}
}
