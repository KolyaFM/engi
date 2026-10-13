import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EngiDB,type PackRow} from '../src/db/engi-db';
import {emptyBundle,putBundle,getBundle,contentTables} from '../src/db/repositories';
import {parseV3} from '../src/lib/engi/import/schema-v3';
import {buildImportPlan} from '../src/lib/engi/import/semantic-merge';
import {removeInstalledPack,finishPackMediaCleanup,removedReference} from '../src/services/pack-removal';
import {withContentWriteLock} from '../src/services/content-write-lock';
import {prepareDeclarativePack,commitDeclarativeImport} from '../src/services/declarative-pack';
import {ZipWriter,BlobWriter,TextReader,configure} from '@zip.js/zip.js';
import {mediaStore,mediaKey} from '../src/media/media-store';
import {identityGoal,associationGoal} from '../src/lib/engi/study-core/compiler';
import {admitAcquisition,emptyLifecycle} from '../src/lib/engi/study-core/acquisition';
import {graduateGoalMemory} from '../src/lib/engi/study-core/memory';
const cache=new Map<string,Response>();let failMedia=false;
configure({useWebWorkers:false});
async function importRaw(d:EngiDB,raw:unknown){const w=new ZipWriter(new BlobWriter());await w.add('bundle.json',new TextReader(JSON.stringify(raw)));const p=(await prepareDeclarativePack(await w.close(),d))!;await commitDeclarativeImport(p,{},d);return (await d.installedPacks.get(p.packId))!;}
Object.defineProperty(globalThis,'caches',{configurable:true,value:{open:async()=>({match:async(k:string)=>cache.get(k)?.clone(),put:async(k:string,r:Response)=>cache.set(k,r.clone()),delete:async(k:string)=>{if(failMedia)throw Error('Cache failed');return cache.delete(k)}})}});
async function run(f:(db:EngiDB)=>Promise<void>){const d=new EngiDB('remove-'+crypto.randomUUID());try{await f(d)}finally{d.close();await d.delete();cache.clear();failMedia=false;}}
async function install(d:EngiDB,name:string,entities:string[]){
 const p=parseV3({schemaVersion:3,name,properties:[{name:'Год',valueType:'date'}],entities:entities.map((name,n)=>({name,type:'Событие',tags:['История'],facts:[{property:'Год',value:1800+n,source:{kind:'manual',name:'Тест'},verification:'user_confirmed'}]})),deck:{name,members:entities.map(name=>({name,type:'Событие'})),learning:{properties:['Год'],imageRecognition:false}}});
 const before=await getBundle(d),plan=buildImportPlan(p,before,{},name),pack:PackRow={packId:name,packVersion:1,name,createdAt:new Date().toISOString(),installedAt:new Date().toISOString(),files:[],entityIds:plan.entityIds,factIds:plan.factIds,mediaIds:[],tagIds:plan.bundle.tags.map(t=>t.id),entityTags:plan.bundle.entityTags.filter(l=>plan.entityIds.includes(l.entityId)),deckIds:[plan.deckId!]};
 await d.transaction('rw',contentTables(d),async()=>{await putBundle(d,plan.bundle);await d.installedPacks.put(pack)});return pack;
}
test('last pack removal erases content, learning, all task references and custom definitions',async()=>run(async d=>{
 const p=await install(d,'A',['Покупка']),b=await getBundle(d),e=b.entities[0],f=b.facts[0],g=associationGoal(b,f,'recognition','forward'),now=new Date();
 const lifecycle=admitAcquisition(emptyLifecycle(),e.id,[g],now,'daily');
 await d.appMeta.bulkPut([{key:'studyCore:learningLifecycle',value:lifecycle},{key:'studyCore:memory:'+g.id,value:graduateGoalMemory(g,now)},{key:'studyCore:contract:task',value:{id:'task',visibleEntities:[e.id],primaryGoals:[g]}},{key:'studyCore:attempt:attempt',value:{taskId:'task',results:[{goalId:g.id}]}},{key:'studyCore:openAttempt:attempt',value:'attempt'},{key:'studyCore:taskAttempt:task',value:'attempt'},{key:'studyCore:episode:episode',value:{attemptId:'attempt',claims:[{key:'fact:'+f.id,revealsGoalIds:[g.id]}]}},{key:'studyCore:exposure:'+g.id,value:{episodeId:'episode',goalId:g.id}},{key:'studyCore:mistakeEpisodes',value:{version:1,episodes:[{id:'mistake',goal:g,attemptIds:['attempt']}]}},{key:'deckSelection',value:{ids:p.deckIds}},{key:'deckPropertySettings',value:{version:1,revision:1,byDeck:{[p.deckIds![0]]:{disabledPropertyIds:[],imageRecognition:false}}}},{key:'newLearning',value:{introducedEntityIds:[e.id],extraBudget:0}},{key:'studyPreferences',value:{sound:true}}]);
 await d.learningState.put({id:'ku:fact:'+f.id+':forward',payload:{id:'ku:fact:'+f.id+':forward'} as any,dueAt:now.toISOString(),covered:0,stability:0});
 await d.targetMappings.put({legacyId:'fact:'+f.id,unitId:'ku:fact:'+f.id+':forward'});
 await d.reviewEvents.put({id:'review',timestamp:now.toISOString(),recipe:'recipe',targetIds:[g.id],level:'direct',payload:{entityId:e.id}});
 await d.activeSessions.put({id:'session',tasks:[{id:'task',items:[{entityId:e.id}]}]} as any);
 await removeInstalledPack(p.packId,d);
 for(const table of [d.entities,d.facts,d.media,d.tags,d.entityTags,d.decks,d.deckMembers,d.installedPacks,d.learningState,d.reviewEvents,d.activeSessions,d.targetMappings])assert.equal(await table.count(),0,table.name);
 assert.equal((await d.propertyDefinitions.toArray()).filter(p=>!p.builtIn).length,0);
 assert.equal((await d.entityTypes.toArray()).filter(t=>!t.builtIn).length,0);
 const meta=await d.appMeta.toArray();assert(!JSON.stringify(meta).includes(e.id));assert(!JSON.stringify(meta).includes(f.id));assert(!JSON.stringify(meta).includes('"attempt"'));assert.equal((await d.appMeta.get('studyPreferences'))?.value.sound,true);
}));
test('identifier matching preserves similarly prefixed identifiers',()=>{
 const ids=new Set(['e1','pack:fact:a']);assert(!removedReference('ku:entity:e12:identity',ids));assert(!removedReference('e10',ids));assert(removedReference('ku:fact:pack:fact:a:forward',ids));assert(removedReference('goal:["identity","e1","recognition"]',ids));
});
test('personal tag assignment retains its entity and tag',async()=>run(async d=>{
 const p=await install(d,'A',['A']),entity=p.entityIds[0];await d.tags.put({id:'personal-tag',name:'Мой тег',origin:'user'});await d.entityTags.put({entityId:entity,tagId:'personal-tag',origin:'user'});
 await removeInstalledPack(p.packId,d);assert(await d.entities.get(entity));assert(await d.entityTags.get([entity,'personal-tag']));assert(await d.tags.get('personal-tag'));assert.equal(await d.decks.count(),0);
}));
test('real imports own only explicitly declared tags and include unused custom types',async()=>run(async d=>{
 const a=await importRaw(d,{schemaVersion:3,name:'A',entityTypes:[{name:'Неиспользуемый тип'}],entities:[{name:'E',type:'Событие',tags:['X']}]});
 const b=await importRaw(d,{schemaVersion:3,name:'B',entities:[{name:'E',type:'Событие'},{name:'F',type:'Событие',tags:['X']}]});
 const bundle=await getBundle(d),e=bundle.entities.find(e=>e.name==='E')!,f=bundle.entities.find(e=>e.name==='F')!,tag=bundle.tags.find(t=>t.name==='X')!,type=bundle.entityTypes!.find(t=>t.name==='Неиспользуемый тип')!;
 assert(a.entityTypeIds?.includes(type.id));assert(!b.entityTags.some(l=>l.entityId===e.id&&l.tagId===tag.id));assert(b.entityTags.some(l=>l.entityId===f.id&&l.tagId===tag.id));
 await removeInstalledPack(a.packId,d);assert.equal(await d.entityTypes.get(type.id),undefined);assert.equal(await d.entityTags.get([e.id,tag.id]),undefined);assert(await d.entityTags.get([f.id,tag.id]));assert(await d.entities.get(e.id));
 await removeInstalledPack(b.packId,d);assert.equal(await d.entities.count(),0);assert.equal(await d.entityTags.count(),0);assert.equal(await d.tags.count(),0);
}));
test('reference qualifier facts belong to the originating pack even when another pack shares the entity',async()=>run(async d=>{
 const a=await importRaw(d,{schemaVersion:3,name:'A',properties:[{name:'Связь',valueType:'entity'},{name:'Год',valueType:'date'}],entities:[{name:'F',type:'Событие',facts:[{property:'Связь',value:{name:'E',type:'Событие',qualifiers:{Год:1800}}}]}]});
 const b=await importRaw(d,{schemaVersion:3,name:'B',entities:[{name:'E',type:'Событие'}]});
 const bundle=await getBundle(d),e=bundle.entities.find(e=>e.name==='E')!,q=bundle.facts.find(f=>f.entityId===e.id)!;assert(a.factIds.includes(q.id));
 await removeInstalledPack(b.packId,d);assert(await d.facts.get(q.id));assert(await d.entities.get(e.id));await removeInstalledPack(a.packId,d);assert.equal(await d.facts.count(),0);
}));
test('identical image bytes do not make unrelated entity-image associations shared',async()=>run(async d=>{
 const hash='c'.repeat(64);await mediaStore.put(hash,new Blob(['image'],{type:'image/png'}));
 const installImage=async(name:string)=>{const p=parseV3({schemaVersion:3,name,entities:[{name,type:'Событие',images:[{file:'media/image.png',license:'Test',sourceUrl:'https://example.org/image',primary:true}]}]}),plan=buildImportPlan(p,await getBundle(d),{},name,{'media/image.png':'engi-media://'+hash}),row:PackRow={packId:name,packVersion:1,name,createdAt:new Date().toISOString(),installedAt:new Date().toISOString(),files:[{path:'media/image.png',sha256:hash,bytes:5,mime:'image/png'}],entityIds:plan.entityIds,factIds:plan.factIds,mediaIds:plan.mediaIds,tagIds:[],entityTags:[]};await d.transaction('rw',contentTables(d),async()=>{await putBundle(d,plan.bundle);await d.installedPacks.put(row)});return row;};
 const a=await installImage('A'),b=await installImage('B');assert.equal(a.mediaIds.length,1);assert.equal(b.mediaIds.length,1);assert.notEqual(a.mediaIds[0],b.mediaIds[0]);await removeInstalledPack(a.packId,d);assert.equal(await d.entities.get(a.entityIds[0]),undefined);assert.equal(await d.media.get(a.mediaIds[0]),undefined);assert(await d.media.get(b.mediaIds[0]));assert(await mediaStore.has(hash));await removeInstalledPack(b.packId,d);assert.equal(await mediaStore.has(hash),false);
}));
test('confirmation deletes edits of exclusive pack content as well',async()=>run(async d=>{
 const p=await install(d,'A',['A']);await d.entities.update(p.entityIds[0],{userModified:true,name:'Исправленное название'});await d.facts.update(p.factIds[0],{userModified:true});await removeInstalledPack(p.packId,d);assert.equal(await d.entities.count(),0);assert.equal(await d.facts.count(),0);
}));
test('legacy archive provenance deletes generated decks and removed upstream rows',async()=>run(async d=>{
 const p=await install(d,'legacy',['A']),tag=p.tagIds[0];delete p.deckIds;await d.installedPacks.put(p);await d.decks.delete((await d.decks.toArray())[0].id);await d.deckMembers.clear();await d.decks.put({id:'deck.legacy.'+tag,name:'Legacy',learning:{imageRecognition:true},origin:'pack'});await d.deckMembers.put({deckId:'deck.legacy.'+tag,entityId:p.entityIds[0],origin:'pack'});await d.entities.put({id:'old-upstream',name:'Old',type:'event',aliases:[],externalIds:{},origin:'pack',originPackId:p.packId,archived:true});
 await removeInstalledPack(p.packId,d);assert.equal(await d.decks.count(),0);assert.equal(await d.deckMembers.count(),0);assert.equal(await d.entities.count(),0);
}));
test('content writes wait for cleanup, including cache work outside the database',async()=>run(async d=>{
 const order:string[]=[];let release!:()=>void;const wait=new Promise<void>(resolve=>release=resolve);
 const first=withContentWriteLock(d,async()=>{order.push('cleanup-start');await wait;order.push('cleanup-end');});
 const second=withContentWriteLock(d,async()=>{order.push('import');});await Promise.resolve();await Promise.resolve();assert.deepEqual(order,['cleanup-start']);release();await Promise.all([first,second]);assert.deepEqual(order,['cleanup-start','cleanup-end','import']);
}));
test('shared graph and unrelated memory survive; after the final owner is removed they disappear',async()=>run(async d=>{
 const a=await install(d,'A',['Общее']),b=await install(d,'B',['Общее','Другое']),bundle=await getBundle(d),shared=bundle.entities.find(e=>e.name==='Общее')!,g=identityGoal(bundle,shared.id,'recognition');
 await d.appMeta.put({key:'studyCore:memory:'+g.id,value:graduateGoalMemory(g,new Date())});
 await removeInstalledPack(a.packId,d);assert(await d.entities.get(shared.id));assert(await d.appMeta.get('studyCore:memory:'+g.id));assert.equal(await d.installedPacks.count(),1);assert.equal(await d.decks.count(),1);assert.equal(await d.deckMembers.count(),2);
 await removeInstalledPack(b.packId,d);assert.equal(await d.entities.count(),0);assert.equal(await d.tags.count(),0);assert.equal(await d.appMeta.where('key').startsWith('studyCore:memory:').count(),0);
}));
test('personal references preserve required entities, without keeping the removed deck',async()=>run(async d=>{
 const p=await install(d,'A',['Объект']),b=await getBundle(d),target=b.entities[0];
 await d.entities.put({id:'personal',type:target.type,name:'Мой объект',aliases:[],externalIds:{},origin:'user'});
 await d.propertyDefinitions.put({id:'personal-link',name:'Связь',valueKind:'entity',cardinality:'one',learnable:false,origin:'user'});
 await d.facts.put({id:'personal-fact',entityId:'personal',key:'personal-link',valueKind:'entity',valueEntityId:target.id,source:{kind:'manual',name:'Мой факт'},verification:'user_confirmed',origin:'user'});
 await removeInstalledPack(p.packId,d);assert(await d.entities.get(target.id));assert(await d.facts.get('personal-fact'));assert.equal(await d.decks.count(),0);assert.equal(await d.facts.count(),1);
}));
test('media deletion keeps shared bytes and journals failed cleanup for retry',async()=>run(async d=>{
 const a=await install(d,'A',['A']),b=await install(d,'B',['B']),hash='a'.repeat(64),unused='b'.repeat(64),blob=new Blob(['image'],{type:'image/png'});
 await mediaStore.put(hash,blob);await mediaStore.put(unused,blob);
 a.files=[{path:'media/a.png',bytes:5,sha256:hash,mime:'image/png'},{path:'media/unused.png',bytes:5,sha256:unused,mime:'image/png'}];b.files=[a.files[0]];await d.installedPacks.bulkPut([a,b]);
 failMedia=true;await assert.rejects(removeInstalledPack(a.packId,d),/Cache failed/);assert.equal(await d.installedPacks.get(a.packId),undefined);assert(await d.appMeta.get('packRemoval:pendingMedia'));
 failMedia=false;await finishPackMediaCleanup(d);assert(await mediaStore.has(hash));assert.equal(await mediaStore.has(unused),false);assert.equal(await d.appMeta.get('packRemoval:pendingMedia'),undefined);
 await removeInstalledPack(b.packId,d);assert.equal(cache.has(mediaKey(hash)),false);
}));
test('failed transaction leaves every table and cache unchanged',async()=>run(async d=>{
 const p=await install(d,'A',['A']),before=await getBundle(d);const reject=()=>{throw Error('Delete failed');};d.entities.hook('deleting',reject);
 await assert.rejects(removeInstalledPack(p.packId,d),/Delete failed/);d.entities.hook('deleting').unsubscribe(reject);
 assert.deepEqual(await getBundle(d),before);assert(await d.installedPacks.get(p.packId));assert.equal(await d.appMeta.get('packRemoval:pendingMedia'),undefined);
}));
