import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {EngiDB} from '../src/db/engi-db';
import {createTrainerService} from '../src/services/trainer-service';
import {emptyBundle,getSnapshot,putBundle,contentTables,historyPage} from '../src/db/repositories';
import {exportBackup,restoreBackup} from '../src/services/backup-service';
import {importPack} from '../src/services/pack-service';
import {sha256} from '../src/services/pack-format';
import {mediaStore} from '../src/media/media-store';
import {ZipWriter,BlobWriter,TextReader,BlobReader} from '@zip.js/zip.js';
import {buildIndexes} from '../src/lib/engi/indexes';
import {prepareDue} from './helpers22';
import type {Bundle} from '../src/lib/engi/types';
const cache=new Map<string,Response>();Object.defineProperty(globalThis,'caches',{value:{open:async()=>({match:async(k:string)=>cache.get(k)?.clone(),put:async(k:string,r:Response)=>{cache.set(k,r.clone())},delete:async(k:string)=>cache.delete(k)}),keys:async()=>['engi-media-v1']},configurable:true});
const seed:Bundle=JSON.parse(await readFile(new URL('./fixtures/seed.json',import.meta.url),'utf8'));
const image=new Blob([await readFile(new URL('../public/icon-192.png',import.meta.url))],{type:'image/png'});const hash=await sha256(image);
function localSeed(){const b=structuredClone(seed);b.media=b.media.map(m=>({...m,url:'engi-media://'+hash}));return b}
async function populate(d:EngiDB){await mediaStore.put(hash,image);await d.transaction('rw',contentTables(d),()=>putBundle(d,localSeed()))}
async function archive(version=1,mutate?:(b:any,m:any)=>void,extra?:string){const b=structuredClone(seed);b.media=b.media.map(m=>({...m,url:'media/image.png'}));const m={format:'engi-pack',schemaVersion:1,packId:'test.art',packVersion:version,name:'Test',createdAt:new Date().toISOString(),files:[{path:'media/image.png',bytes:image.size,sha256:hash,mime:'image/png'}]};mutate?.(b,m);const w=new ZipWriter(new BlobWriter());await w.add('manifest.json',new TextReader(JSON.stringify(m)));await w.add('bundle.json',new TextReader(JSON.stringify(b)));await w.add('media/image.png',new BlobReader(image),{level:0});if(extra)await w.add(extra,new TextReader('bad'));return w.close()}
async function dbTest(run:(d:EngiDB)=>Promise<void>){const d=new EngiDB('engi-test-'+crypto.randomUUID());try{await run(d)}finally{d.close();await d.delete()}}

test('empty DB, indexed context and local persistence across service recreation',async()=>dbTest(async d=>{
 assert.equal((await getSnapshot(d)).bundle.entities.length,0);await populate(d);await prepareDue(d);
 const ix=buildIndexes(localSeed());assert.equal(ix.entityById.size,seed.entities.length);
 const baseline=await d.learningState.toArray(),svc=createTrainerService(d),session=await svc.startFeed('all','choice'),task=session.tasks[0];
 const result=await svc.answer({sessionId:session.id,taskId:task.id,answer:task.items[0].answerId});assert.equal(result.feedback.score,1);assert.equal(await d.learningState.count(),baseline.length);
 d.close();const reopened=new EngiDB(d.name);try{const snapshot=await createTrainerService(reopened).getSnapshot();assert.equal(snapshot.memories.find(m=>m.id===task.items[0].targetId)!.attempts,1);assert.equal(snapshot.events.length,1);for(const sibling of baseline.filter(r=>r.id!==task.items[0].targetId))assert.deepEqual(await reopened.learningState.get(sibling.id),sibling);assert.equal((await createTrainerService(reopened).getResumableSession())?.id,session.id)}finally{reopened.close()}
}));

test('concurrent double submit is idempotent and event/state are atomic',async()=>dbTest(async d=>{
 await populate(d);await prepareDue(d);const svc=createTrainerService(d),session=await svc.startFeed('all','choice'),task=session.tasks[0],input={sessionId:session.id,taskId:task.id,answer:task.items[0].answerId};
 await Promise.all([svc.answer(input),svc.answer(input)]);assert.equal(await d.reviewEvents.count(),1);assert.equal((await d.learningState.get(task.items[0].targetId))?.payload.attempts,1);assert.equal((await d.activeSessions.get(session.id))?.results.length,1);
}));

test('failed initial probe, confusion harvest, direct match and session resume',async()=>dbTest(async d=>{
 await populate(d);await prepareDue(d);const svc=createTrainerService(d);let s=await svc.startFeed('all','choice');const t=s.tasks[0],wrong=t.options.find(o=>o.id!==t.items[0].answerId)!;
 await svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id});assert.equal(await d.reviewEvents.count(),0);await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});
 const failed=(await d.learningState.get(t.items[0].targetId))!.payload;assert.equal(failed.card.reps,0);assert.equal(failed.card.lapses,0);assert.equal(failed.attempts,1);assert.equal(failed.confusions[wrong.id],1);
 let found=false;for(let n=0;n<12;n++){s=await svc.advanceFeed(s.id);const current=s.tasks[0];assert(current);if(current.recipe.format==='recall_reveal')await svc.saveInteraction(s.id,current.id,{recallElapsedMs:5000,revealed:true});await svc.answer({sessionId:s.id,taskId:current.id,answer:current.recipe.format==='recall_reveal'?true:current.items[0].answerId});if(current.retryOf===t.id){found=true;break}}
 assert(found);const memory=(await d.learningState.get(t.items[0].targetId))!.payload;assert(memory.confusions[wrong.id]>0);assert.equal(memory.attempts,failed.attempts);assert.deepEqual(memory.card,failed.card);
 const match=await svc.startFeed('all','match'),mt=match.tasks[0],before=await d.reviewEvents.count();assert.equal(mt.recipe.format,'match');await svc.answer({sessionId:match.id,taskId:mt.id,answer:mt.items[0].answerId});assert.equal(await d.reviewEvents.count(),before+1);assert((await d.reviewEvents.get(mt.id))?.payload.targets.every((e:any)=>e.level==='direct'));const next=await svc.advanceFeed(match.id);assert.equal((await svc.getResumableSession())?.currentPosition,next.currentPosition);assert.equal((await historyPage(d,0,1)).length,1);
}));

test('backup catastrophe: restore without content then reimport stable IDs',async()=>dbTest(async d=>{
 await populate(d);await prepareDue(d);const svc=createTrainerService(d),session=await svc.startFeed('all','choice'),task=session.tasks[0];await svc.answer({sessionId:session.id,taskId:task.id,answer:task.items[0].answerId,confidence:'high'});
 const backup=JSON.parse(JSON.stringify(await exportBackup(d)));assert(!('bundle' in backup));assert(!('media' in backup));const target=new EngiDB('engi-catastrophe-'+crypto.randomUUID());try{await restoreBackup(backup,target);assert.equal(await target.entities.count(),seed.entities.length);assert.deepEqual(JSON.parse(JSON.stringify(await target.learningState.toArray())),backup.learningState);assert.equal(await target.reviewEvents.count(),1);await populate(target);assert((await getSnapshot(target)).memories.some(m=>m.id===task.items[0].targetId));await restoreBackup(backup,target);assert.equal(await target.reviewEvents.count(),1);const bad=structuredClone(backup);bad.learningState[0].payload.card.stability=-1;await assert.rejects(restoreBackup(bad,target));assert.equal(await target.reviewEvents.count(),1)}finally{target.close();await target.delete()}
}));

test('pack import twice, v2 stable targets, deduplicated image and no progress reset',async()=>dbTest(async d=>{
 cache.clear();await importPack(await archive(),()=>{},d);await prepareDue(d);const svc=createTrainerService(d),session=await svc.startFeed('all','choice'),t=session.tasks[0];await svc.answer({sessionId:session.id,taskId:t.id,answer:t.items[0].answerId});const before=JSON.stringify(await d.learningState.toArray());await importPack(await archive(),()=>{},d);assert.equal(await d.entities.count(),seed.entities.length);assert.equal(cache.size,1);await importPack(await archive(2,(b)=>{b.entities[0].name+=' v2'}),()=>{},d);assert.equal(JSON.stringify(await d.learningState.toArray()),before);assert.equal((await d.installedPacks.get('test.art'))?.packVersion,2);assert((await d.media.toArray()).every(m=>m.url.startsWith('engi-media://')));assert.equal((await mediaStore.getBlob(hash)).size,image.size);
}));

test('bad ZIP paths, hashes, unknown schema, missing references, duplicates leave old data intact',async()=>dbTest(async d=>{await importPack(await archive(),()=>{},d);const before=JSON.stringify(await getSnapshot(d));for(const zip of [await archive(2,undefined,'../evil'),await archive(2,(_b,m)=>m.files[0].sha256='0'.repeat(64)),await archive(2,(_b,m)=>m.schemaVersion=99),await archive(2,b=>b.media[0].entityId='absent'),await archive(2,b=>b.entities.push(b.entities[0])),await archive(2,(_b,m)=>m.files[0].mime='text/html')]){await assert.rejects(importPack(zip,()=>{},d));assert.equal(JSON.stringify(await getSnapshot(d)),before)}}));

test('editing a fact resets only its targets; reports stay offline and append-only',async()=>dbTest(async d=>{
 await populate(d);await prepareDue(d);const svc=createTrainerService(d);let session=await svc.startFeed('all','choice');const first=session.tasks[0];for(let n=0;n<4;n++){const t=session.tasks[0];await svc.answer({sessionId:session.id,taskId:t.id,answer:t.items[0].answerId});session=await svc.advanceFeed(session.id)}
 const s=await getSnapshot(d),fact=s.bundle.facts.find(f=>f.valueKind==='date')!,entity=s.bundle.entities.find(e=>e.id===fact.entityId)!,before=await d.reviewEvents.count(),memories=await d.learningState.toArray();
 const affected=memories.filter(m=>m.id.startsWith(`ku:fact:${fact.id}:`));assert(affected.length>0);await svc.editEntity({entityId:entity.id,name:entity.name,facts:[{...fact,year:1901}]});
 for(const m of affected)assert.equal(await d.learningState.get(m.id),undefined);for(const sibling of memories.filter(m=>!affected.some(a=>a.id===m.id)))assert.deepEqual(await d.learningState.get(sibling.id),sibling);
 assert.equal(await d.reviewEvents.count(),before);await svc.reportQuestion(first.id,'Ошибка');const report=(await d.reviewEvents.where('recipe').equals('report').first())!;await svc.resolveReport(report.id);await svc.resolveReport(report.id);assert.equal(await d.reviewEvents.where('recipe').equals('report_resolved').count(),1);
}));

test('an aborted event write rolls back FSRS and session result',async()=>dbTest(async d=>{
 await populate(d);await prepareDue(d);const svc=createTrainerService(d),session=await svc.startFeed('all','choice'),task=session.tasks[0],before=await d.learningState.toArray();
 const fail=()=>{throw Error('simulated write failure')};d.reviewEvents.hook('creating',fail);await assert.rejects(svc.answer({sessionId:session.id,taskId:task.id,answer:task.items[0].answerId}));d.reviewEvents.hook('creating').unsubscribe(fail);
 assert.deepEqual(await d.learningState.toArray(),before);assert.equal(await d.reviewEvents.count(),0);assert.equal((await d.activeSessions.get(session.id))?.results.length,0);await svc.answer({sessionId:session.id,taskId:task.id,answer:task.items[0].answerId});assert.equal(await d.learningState.count(),before.length);assert.equal((await d.learningState.get(task.items[0].targetId))!.payload.attempts,1);
}));

test('snapshot limits history but backup preserves every event and settings',async()=>dbTest(async d=>{await d.reviewEvents.bulkAdd(Array.from({length:1007},(_,i)=>({id:'history-'+i,timestamp:new Date(1700000000000+i).toISOString(),recipe:'report',level:'report',targetIds:[],payload:{reason:'test '+i}})));await d.appMeta.put({key:'customSetting',value:{goal:15}});assert.equal((await getSnapshot(d)).events.length,1000);const backup=await exportBackup(d);assert.equal(backup.reviewEvents.length,1007);assert.deepEqual(backup.settings.customSetting,{goal:15})}));
