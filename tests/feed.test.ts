import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {EngiDB} from '../src/db/engi-db';
import {createTrainerService} from '../src/services/trainer-service';
import {saveKnowledge} from '../src/services/knowledge-service';
import {getBundle,learningRow} from '../src/db/repositories';
import {updateMemory,assess} from '../src/lib/engi/engine';
import {composeFeed} from '../src/lib/engi/session/composer';
import {canonicalTargets,recipes} from '../src/lib/engi/questions/recipe-factory';
import type {Bundle} from '../src/lib/engi/types';

function fixture():Bundle {
 const b:Bundle={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[],entityTypes:[{id:'subject',name:'Объект'},{id:'answer',name:'Ответ'}],properties:[{id:'relation',name:'Связь',valueKind:'entity',cardinality:'one',learnable:true,subjectTypes:['subject'],targetTypes:['answer']},{id:'date',name:'Дата',valueKind:'date',cardinality:'one',learnable:true,subjectTypes:['subject']}]};
 for(let i=0;i<8;i++){b.entities.push({id:'s'+i,type:'subject',name:'Объект '+i,aliases:[],externalIds:{}},{id:'a'+i,type:'answer',name:'Ответ '+i,aliases:[],externalIds:{}});b.facts.push({id:'f'+i,entityId:'s'+i,key:'relation',valueKind:'entity',valueEntityId:'a'+i,verification:'user_confirmed',source:{kind:'manual',name:'Личное знание'}},{id:'d'+i,entityId:'s'+i,key:'date',valueKind:'date',dateStart:(1800+i*25)+'-01-01',dateEnd:(1800+i*25)+'-12-31',datePrecision:'year',verification:'user_confirmed',source:{kind:'manual',name:'Личное знание'}})}return b;
}
async function setup(run:(db:EngiDB,svc:ReturnType<typeof createTrainerService>)=>Promise<void>){const d=new EngiDB('feed-'+crypto.randomUUID());try{await saveKnowledge(fixture(),d);await run(d,createTrainerService(d))}finally{d.close();await d.delete()}}

test('wrong option only persists a draft, hides correction, and survives service recreation',()=>setup(async(d,svc)=>{
 const s=await svc.startFeed('all','choice');const t=s.tasks[0],wrong=t.options.find(o=>o.id!==t.items[0].answerId)!;
 const r=await svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id});
 assert.equal(await d.reviewEvents.count(),0);assert.equal(await d.learningState.count(),0);
 assert.equal((r as any).pending,true);assert.equal((r as any).feedback,null);
 assert.deepEqual((await createTrainerService(d).getResumableSession() as any).interaction.attemptSequence,[wrong.id]);
 await svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id});
 assert.deepEqual((await d.activeSessions.get(s.id) as any).interaction.attemptSequence,[wrong.id]);
}));

test('two wrong options then correct commit one Again and every real confusion exactly once',()=>setup(async(d,svc)=>{
 const s=await svc.startFeed('all','choice'),t=s.tasks[0],item=t.items[0];const wrong=t.options.filter(o=>o.id!==item.answerId).slice(0,2);
 const m=updateMemory(undefined,item,true,item.answerId)!;await d.learningState.put(learningRow(m));
 for(const o of wrong)await svc.answer({sessionId:s.id,taskId:t.id,answer:o.id});
 await Promise.all([svc.answer({sessionId:s.id,taskId:t.id,answer:item.answerId}),svc.answer({sessionId:s.id,taskId:t.id,answer:item.answerId})]);
 assert.equal(await d.reviewEvents.count(),1);const event=(await d.reviewEvents.get(t.id))!;
 assert.equal(event.payload.score,0);assert.equal(event.payload.feedback.correctionComplete,true);
 assert.deepEqual(event.payload.metadata.attemptSequence,[...wrong.map(o=>o.id),item.answerId]);
 assert.deepEqual(event.payload.metadata.wrongChoices,wrong.map(o=>o.id));assert.equal(event.payload.metadata.attemptCount,3);
 const next=(await d.learningState.get(item.targetId))!.payload;
 assert.equal(next.card.reps,m.card.reps+1);assert.equal(next.attempts,m.attempts+1);assert.equal(next.correct,m.correct);
 for(const o of wrong)assert.equal(next.confusions[o.id],1);
 assert.equal((await d.activeSessions.get(s.id))!.results.length,1);
 assert.equal((await d.appMeta.get('reviewsSinceBackup'))!.value,1);
}));

test('first-try correct commits Good and a failed new pretest waits for actual later retrieval',()=>setup(async(d,svc)=>{
 let s=await svc.startFeed('all','choice');let t=s.tasks[0];await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});
 assert.equal((await d.reviewEvents.get(t.id))!.payload.score,1);assert.equal((await d.learningState.get(t.items[0].targetId))!.payload.card.reps,1);
 s=await svc.advanceFeed(s.id);t=s.tasks[s.currentPosition];const wrong=t.options.find(o=>o.id!==t.items[0].answerId)!;
 await svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id});await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});
 assert.equal(await d.learningState.get(t.items[0].targetId),undefined);const event=(await d.reviewEvents.get(t.id))!;
 assert.equal(event.payload.pretest,true);assert.equal(event.payload.fsrsEnabled,false);assert.equal(event.payload.feedback.encoding,true);
 const stored=(await d.activeSessions.get(s.id))!;assert.equal(stored.repairQueue?.length,1);assert(stored.repairQueue![0].retryAfter!>=4);
}));

test('invalid option never changes progress and an unfinished card cannot silently advance',()=>setup(async(d,svc)=>{
 const s=await svc.startFeed('all','choice');await assert.rejects(svc.answer({sessionId:s.id,taskId:s.tasks[0].id,answer:'not-an-option'}));
 await assert.rejects(svc.advanceFeed(s.id));assert.equal((await d.activeSessions.get(s.id))!.currentPosition,0);assert.equal(await d.reviewEvents.count(),0);
}));

test('failed final event write keeps the draft and rolls back memory; retry commits once',()=>setup(async(d,svc)=>{
 const s=await svc.startFeed('all','choice'),t=s.tasks[0],wrong=t.options.find(o=>o.id!==t.items[0].answerId)!;
 await svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id});
 const fail=()=>{throw Error('event-write-failure')};d.reviewEvents.hook('creating',fail);
 await assert.rejects(svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId}));d.reviewEvents.hook('creating').unsubscribe(fail);
 assert.equal(await d.reviewEvents.count(),0);assert.deepEqual((await d.activeSessions.get(s.id) as any).interaction.attemptSequence,[wrong.id]);
 await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});assert.equal(await d.reviewEvents.count(),1);
}));

test('timeline scale is shared by its context and the neutral initial does not track each answer',()=>{
 const tasks=composeFeed(fixture(),[],'all','timeline','daily',[],12);assert(tasks.length>=3);
 const scales=tasks.map(t=>(t as any).timeline);assert(scales.every(Boolean));assert(scales.every(s=>JSON.stringify(s)===JSON.stringify(scales[0])));
 const allYears=fixture().facts.filter(f=>f.key==='date').map(f=>Number(f.dateStart!.slice(0,4)));
 assert(scales[0].min<=1800&&scales[0].max>=1975);const hits=allYears.filter(y=>Math.abs(y-scales[0].initial)<=15).length;assert(hits<allYears.length/2);
 for(const t of tasks){assert.equal(assess(t,{[t.items[0].entityId]:t.items[0].year}).evidence.length,0)}
});

test('adding one image does not remove imageless property targets or existing memory IDs',()=>{
 const original=fixture(),before=canonicalTargets(original).filter(i=>i.factId?.startsWith('f'));const b=structuredClone(original);b.media.push({id:'img',entityId:'s0',role:'primary',url:'engi-media://'+'a'.repeat(64),origin:'user',license:'Личное'});
 const after=canonicalTargets(b).filter(i=>i.factId?.startsWith('f'));assert.equal(new Set(after.map(i=>i.factId)).size,8);assert(before.every(i=>after.some(x=>x.targetId===i.targetId)));
});

test('image and name recipe pools stay separate and retain image memory targets',()=>{
 const b=fixture();for(let i=0;i<8;i++)b.media.push({id:'img'+i,entityId:'s'+i,role:'primary',url:'engi-media://'+'a'.repeat(64),origin:'user',license:'Личное'});
 const rs=recipes(b);assert.equal(new Set(rs.map(r=>r.id)).size,rs.length);
 const tasks=composeFeed(b,[],'all','choice','daily',[],12);assert.equal(tasks.length,12);
 for(const task of tasks)assert(task.items[0].targetId.endsWith(task.recipe.memoryKey));
});

test('a one-target corpus can refill without a permanent empty feed',()=>{
 const b=fixture();b.entities=b.entities.slice(0,2);b.facts=b.facts.filter(f=>f.id==='f0');
 assert.equal(composeFeed(b,[],'all','mixed','daily',[],12).length,12);
});

test('a shared three-answer pool fills and refills even with many distinct targets',()=>{
 const b=fixture();b.facts=b.facts.filter(f=>f.key==='relation').map((f,i)=>({...f,valueEntityId:'a'+(i%3)}));
 const first=composeFeed(b,[],'all','choice','daily',[],12);assert.equal(first.length,12);
 assert.equal(composeFeed(b,[],'all','choice','daily',first,12).length,12);
 for(let n=1;n<first.length;n++)assert.notEqual(first[n].items[0].targetId,first[n-1].items[0].targetId);
});

test('a narrow timeline cluster cannot all pass at its untouched default',()=>{
 const b=fixture();b.facts=b.facts.filter(f=>f.key==='date').slice(0,3).map((f,i)=>({...f,dateStart:(1871+i)+'-01-01',dateEnd:(1871+i)+'-12-31'}));
 const tasks=composeFeed(b,[],'all','timeline','daily',[],12);assert(tasks.length>=3);
 const initial=tasks[0].timeline!.initial;assert(tasks.every(t=>t.timeline!.initial===initial));
 assert(tasks.filter(t=>assess(t,{[t.items[0].entityId]:initial}).score===1).length<tasks.length/2);
});

test('recall result cannot be graded before its persisted five-second reveal',()=>setup(async(d,svc)=>{
 const s=await svc.startFeed('all','recall_reveal'),t=s.tasks[0];
 await assert.rejects(svc.answer({sessionId:s.id,taskId:t.id,answer:true}));assert.equal(await d.reviewEvents.count(),0);
 await (svc as any).saveInteraction(s.id,t.id,{recallElapsedMs:4999});await assert.rejects(svc.answer({sessionId:s.id,taskId:t.id,answer:true}));
 await (svc as any).saveInteraction(s.id,t.id,{recallElapsedMs:5000,revealed:true});await svc.answer({sessionId:s.id,taskId:t.id,answer:true});
 assert.equal((await d.learningState.get(t.items[0].targetId))!.payload.card.reps,1);assert.equal((await d.reviewEvents.get(t.id))!.payload.selfReport,true);
}));

test('objective probe failures reduce trust in repeated self-reported success',()=>setup(async(d,svc)=>{
 const s=await svc.startFeed('all','choice'),t=s.tasks[0];const m=updateMemory(undefined,t.items[0],true,t.items[0].answerId)!;
 (m as any).selfReport={remembered:3,missed:0,objectiveSuccesses:0,objectiveFailures:0};await d.learningState.put(learningRow(m));
 await svc.answer({sessionId:s.id,taskId:t.id,answer:t.options.find(o=>o.id!==t.items[0].answerId)!.id});await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});
 const next=(await d.learningState.get(m.id))!.payload as any;assert.equal(next.selfReport.objectiveFailures,1);assert.equal(next.selfReport.remembered,3);
}));

