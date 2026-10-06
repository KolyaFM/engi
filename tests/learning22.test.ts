import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createEmptyCard,type Card} from 'ts-fsrs';
import {mergeLegacyStates,legacyUnitId} from '../src/lib/engi/learning/knowledge-unit';
import type {Bundle,Memory} from '../src/lib/engi/types';
import Dexie from 'dexie';
import {EngiDB} from '../src/db/engi-db';
import {storesV2} from '../src/db/migrations';
import {getSnapshot,learningRow} from '../src/db/repositories';
import {exportBackup,restoreBackup} from '../src/services/backup-service';
import {saveKnowledge} from '../src/services/knowledge-service';
import {triagedMemory,reviewLearning} from '../src/lib/engi/learning/bootstrap';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {createTrainerService} from '../src/services/trainer-service';
import {setUnitSuspended} from '../src/services/learning-service';
async function setup(run:(d:EngiDB,svc:ReturnType<typeof createTrainerService>)=>Promise<void>){const d=new EngiDB('learning22-'+crypto.randomUUID());try{await saveKnowledge(fixture(),d);await run(d,createTrainerService(d))}finally{d.close();await d.delete()}}
async function ready(d:EngiDB){for(const i of canonicalTargets((await getSnapshot(d)).bundle)){const m=triagedMemory(i,'red','',0);m.card.due=new Date(Date.now()-1000);await d.learningState.put(learningRow(m))}}
export function fixture():Bundle {const b:Bundle={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[],entityTypes:[{id:'sample',name:'Объект'},{id:'answer',name:'Ответ'}],properties:[{id:'party',name:'Партия',valueKind:'entity',subjectTypes:['sample'],targetTypes:['answer'],cardinality:'one',learnable:true},{id:'birth_date',name:'Дата рождения',valueKind:'date',subjectTypes:['sample'],cardinality:'one',learnable:true}]};for(let i=0;i<12;i++){b.entities.push({id:'s'+i,type:'sample',name:'Объект '+i,aliases:[],externalIds:{}},{id:'a'+i,type:'answer',name:'Ответ '+i,aliases:[],externalIds:{}});b.facts.push({id:'f'+i,entityId:'s'+i,key:'party',valueKind:'entity',valueEntityId:'a'+i,verification:'user_confirmed',source:{kind:'manual',name:'Личное знание'}},{id:'d'+i,entityId:'s'+i,key:'birth_date',valueKind:'date',dateStart:(1800+i*10)+'-01-01',dateEnd:(1800+i*10)+'-12-31',datePrecision:'year',verification:'user_confirmed',source:{kind:'manual',name:'Личное знание'}})}return b}
test('legacy cue variants map to one ordinary property and merge conservatively',()=>{
 const b=fixture(),id='ku:fact:f0:forward',a:Memory={id:'fact:f0:name_to_party',card:{...createEmptyCard<Card>(new Date()),due:new Date('2026-10-08'),stability:50,difficulty:3,reps:5},attempts:6,correct:5,confusions:{a1:1},firstSuccessAt:'2026-09-01'},c:Memory={...a,id:'fact:f0:image_to_party',card:{...a.card,due:new Date('2026-10-07'),stability:8,difficulty:7},correct:3,confusions:{a2:2}};
 assert.equal(legacyUnitId(a.id,b),id);assert.equal(legacyUnitId(c.id,b),id);
 const result=mergeLegacyStates([a,c],b),merged=result.states.find(m=>m.id===id)!;
 assert.equal(merged.card.stability,8);assert.equal(merged.card.difficulty,7);assert.equal(new Date(merged.card.due).toISOString(),new Date('2026-10-07').toISOString());assert.equal(merged.correct,3);
 assert.equal(result.mappings.length,2);assert.equal(result.states.find(m=>m.id===a.id)!.legacyOf,id);
 assert.deepEqual(mergeLegacyStates(result.states,b).states,result.states);
});

test('actual v2 upgrade preserves original history and maps old cues once through backup restore',async()=>{
 const name='upgrade22-'+crypto.randomUUID(),old=new Dexie(name);old.version(2).stores(storesV2);const b=fixture();await old.open();await old.table('entities').bulkPut(b.entities);await old.table('facts').bulkPut(b.facts);
 const m:Memory={id:'fact:f0:name_to_party',card:{...createEmptyCard<Card>(new Date()),stability:12,difficulty:6,reps:3},attempts:3,correct:2,confusions:{a1:2},firstSuccessAt:new Date().toISOString()};await old.table('learningState').put({id:m.id,payload:m,dueAt:new Date().toISOString(),stability:12,covered:1});const event={id:'old-review',timestamp:new Date().toISOString(),recipe:'old',level:'direct',targetIds:[m.id],payload:{score:0}};await old.table('reviewEvents').put(event);old.close();
 const d=new EngiDB(name),target=new EngiDB('restore22-'+crypto.randomUUID());try{const snapshot=await getSnapshot(d);assert(snapshot.memories.some(m=>m.id==='ku:fact:f0:forward'));assert(!snapshot.memories.some(m=>m.id.startsWith('fact:')));assert.deepEqual(await d.reviewEvents.get(event.id),event);assert.equal(await d.targetMappings.count(),1);const backup=await exportBackup(d);await restoreBackup(backup,target);await saveKnowledge(b,target);assert.equal((await getSnapshot(target)).memories.filter(m=>m.id==='ku:fact:f0:forward').length,1);assert.equal(await target.targetMappings.count(),1);assert.deepEqual((await target.reviewEvents.get(event.id))!.targetIds,[m.id])}finally{d.close();target.close();await d.delete();await target.delete()}
});

test('familiarity does not create success and bootstrap intervals depend on actual property probes',()=>{
 const item=canonicalTargets(fixture())[0],now=new Date('2026-10-06T12:00:00Z');
 for(const [color,days] of [['red',1],['orange',2],['yellow',3],['green',7]] as const){const m=triagedMemory(item,color,'session',0,now);assert.equal(m.card.reps,0);assert.equal(m.firstSuccessAt,undefined);assert.equal(m.objectiveReviews,0);const result=reviewLearning(m,item,true,true,false,false,1200,now);assert.equal(new Date(result.memory.card.due).getTime()-now.getTime(),days*86400000);assert.equal(result.memory.objectiveReviews,1);assert.equal(result.memory.status,color==='green'?'review':'learning')}
 const suspended=triagedMemory(item,'suspended','session',0,now);assert.equal(suspended.status,'suspended');assert.equal(suspended.card.reps,0);
});

test('bootstrap failure demotes green and repair preserves the next due and FSRS card',()=>{
 const item=canonicalTargets(fixture())[0],now=new Date('2026-10-06T12:00:00Z'),m=triagedMemory(item,'green','session',0,now),fail=reviewLearning(m,item,false,true,false,false,500,now);
 assert.equal(fail.memory.status,'learning');assert.equal(fail.memory.card.reps,0);assert.equal(fail.memory.bootstrap!.successes,0);assert.equal(new Date(fail.memory.card.due).getTime()-now.getTime(),86400000);
 const repaired=reviewLearning(fail.memory,item,true,true,true,false,600,now);assert.deepEqual(repaired.memory.card,fail.memory.card);assert.equal(repaired.fsrsUpdated,false);
});

test('Object Intro persists colors, creates no review, suspends only the selected unit and daily budget survives restarts',()=>setup(async(d,svc)=>{
 let s=await svc.startFeed();assert(s.intro);assert.equal(await d.reviewEvents.count(),0);const [a,c]=s.intro.unitIds;
 await svc.saveIntroSelection(s.id,a,'green');await svc.saveIntroSelection(s.id,c,'suspended');s=(await svc.getResumableSession())!;assert.equal(s.intro!.selections[a],'green');s=await svc.completeIntro(s.id);
 assert.equal((await d.learningState.get(a))!.payload.card.reps,0);assert.equal((await d.learningState.get(c))!.payload.status,'suspended');assert.equal(await d.reviewEvents.count(),0);
 for(let n=0;n<2;n++){s=await svc.startFeed();assert(s.intro);s=await svc.completeIntro(s.id)}s=await svc.startFeed();assert.equal(s.exhausted,true);assert.equal((await d.appMeta.get('newLearning'))!.value.introducedEntityIds.length,3);
}));

test('properties are independent; forced correction is one failed review and preserves first latency',()=>setup(async(d,svc)=>{
 await ready(d);let s=await svc.startFeed('all','choice'),t=s.tasks[0],siblings=(await d.learningState.toArray()).find(r=>r.id!==t.items[0].targetId&&r.id.includes(`:${t.items[0].entityId.replace('s','d')}:`));const before=siblings&&structuredClone(siblings.payload);
 const wrong=t.options.find(o=>o.id!==t.items[0].answerId)!;await svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id,latencyMs:450});assert.equal(await d.reviewEvents.count(),0);
 const [one,two]=await Promise.all([svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId,latencyMs:9000}),svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId,latencyMs:10000})]);assert.equal(await d.reviewEvents.count(),1);assert.equal(one.event!.payload.score,0);assert.equal(two.event!.payload.metadata.firstAttemptLatencyMs,450);assert.equal((await d.learningState.get(t.items[0].targetId))!.payload.card.reps,0);if(siblings)assert.deepEqual((await d.learningState.get(siblings.id))!.payload,before);
}));

test('after each answer stale tasks disappear and sibling properties are separated by unrelated entities',()=>setup(async(d,svc)=>{
 await ready(d);let s=await svc.startFeed('all','choice');const seen:string[]=[];
 for(let n=0;n<12;n++){const t=s.tasks[0];assert(t);assert(!seen.slice(-6).includes(t.items[0].entityId));seen.push(t.items[0].entityId);const clone={...t,id:crypto.randomUUID()};s.tasks.push(clone);await d.activeSessions.put(s);await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});assert.equal((await d.activeSessions.get(s.id))!.tasks.length,1);s=await svc.advanceFeed(s.id,false,t.id)}
}));

test('one non-due unit stops main mode; unscheduled practice never changes its FSRS card',async()=>{
 const d=new EngiDB('single22-'+crypto.randomUUID());try{const b=fixture();b.entities=b.entities.slice(0,2);b.facts=b.facts.filter(f=>f.id==='f0');await saveKnowledge(b,d);const item=canonicalTargets((await getSnapshot(d)).bundle)[0],m=triagedMemory(item,'green','',0);m.card.due=new Date(Date.now()+86400000);m.status='review';await d.learningState.put(learningRow(m));const svc=createTrainerService(d);let s=await svc.startFeed();assert.equal(s.exhausted,true);assert.equal(s.tasks.length,0);s=await svc.openMore(s.id,true);const t=s.tasks[0];assert.equal(t.recipe.format,'recall_reveal');await svc.saveInteraction(s.id,t.id,{recallElapsedMs:1200,earlyReveal:true,revealed:true});assert.equal(await d.reviewEvents.count(),0);await svc.answer({sessionId:s.id,taskId:t.id,answer:true});assert.deepEqual((await d.learningState.get(item.targetId))!.payload.card,m.card);assert.equal((await d.reviewEvents.get(t.id))!.level,'practice');s=await svc.advanceFeed(s.id);assert(s.tasks.length===1)}finally{d.close();await d.delete()}
});

test('Suspend and resume retain past memory without counting suspended units as learned',()=>setup(async(d,svc)=>{
 await ready(d);const m=(await d.learningState.toArray())[0];await setUnitSuspended(m.id,true,d);assert.equal((await d.learningState.get(m.id))!.payload.status,'suspended');let s=await svc.startFeed('all','choice');assert.notEqual(s.tasks[0].items[0].targetId,m.id);await setUnitSuspended(m.id,false,d);assert.equal((await d.learningState.get(m.id))!.payload.status,'triaged');assert.equal((await d.learningState.get(m.id))!.payload.card.reps,m.payload.card.reps);
}));


