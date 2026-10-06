import {prepareDue} from './helpers22';
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
async function setup(run:(db:EngiDB,svc:ReturnType<typeof createTrainerService>)=>Promise<void>){const d=new EngiDB('feed-'+crypto.randomUUID());try{await saveKnowledge(fixture(),d);await prepareDue(d);await run(d,createTrainerService(d))}finally{d.close();await d.delete()}}


test('wrong option persists only a draft, never reveals correction, and resumes across service recreation',()=>setup(async(d,svc)=>{
 const s=await svc.startFeed('all','choice'),t=s.tasks[0],wrong=t.options.find(o=>o.id!==t.items[0].answerId)!,before=await d.learningState.toArray();
 const pending=await svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id,latencyMs:1600});assert.equal(pending.pending,true);assert.equal(pending.feedback,null);assert.equal(await d.reviewEvents.count(),0);assert.deepEqual(await d.learningState.toArray(),before);
 const resumed=await createTrainerService(d).getResumableSession();assert.deepEqual(resumed!.interaction!.attemptSequence,[wrong.id]);await svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id,latencyMs:3000});assert.deepEqual((await d.activeSessions.get(s.id))!.interaction!.attemptSequence,[wrong.id]);
}));
test('two real errors then forced correction commit one Again with all unique confusions and first latency',()=>setup(async(d,svc)=>{
 const s=await svc.startFeed('all','choice'),t=s.tasks[0],m=updateMemory(undefined,t.items[0],true,t.items[0].answerId)!;m.card.due=new Date(Date.now()-1000);m.card.state=2;m.status='review';await d.learningState.put(learningRow(m));const wrongs=t.options.filter(o=>o.id!==t.items[0].answerId).slice(0,2);
 await svc.answer({sessionId:s.id,taskId:t.id,answer:wrongs[0].id,latencyMs:1200});await svc.answer({sessionId:s.id,taskId:t.id,answer:wrongs[1].id,latencyMs:5000});await Promise.all([svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId,latencyMs:9000}),svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId})]);
 const event=(await d.reviewEvents.get(t.id))!,after=(await d.learningState.get(m.id))!.payload;assert.equal(await d.reviewEvents.count(),1);assert.equal(event.payload.score,0);assert.equal(event.payload.metadata.firstAttemptLatencyMs,1200);assert.deepEqual(event.payload.metadata.wrongChoices,wrongs.map(o=>o.id));assert.equal(after.card.reps,m.card.reps+1);assert.equal(after.card.lapses,m.card.lapses+1);assert.equal(after.correct,m.correct);for(const o of wrongs)assert.equal(after.confusions[o.id],1);
}));
test('first successful bootstrap probe is real Good; a new failed probe is not a memory lapse',()=>setup(async(d,svc)=>{
 let s=await svc.startFeed('all','choice'),t=s.tasks[0];await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});assert.equal((await d.learningState.get(t.items[0].targetId))!.payload.card.reps,1);s=await svc.advanceFeed(s.id);t=s.tasks[0];await svc.answer({sessionId:s.id,taskId:t.id,answer:t.options.find(o=>o.id!==t.items[0].answerId)!.id});await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});const row=(await d.learningState.get(t.items[0].targetId))!.payload,event=(await d.reviewEvents.get(t.id))!;assert.equal(row.card.reps,0);assert.equal(row.card.lapses,0);assert.equal(event.payload.fsrsEnabled,false);assert.equal(event.payload.feedback.encoding,true);assert.equal((await d.activeSessions.get(s.id))!.repairQueue!.length,1);
}));
test('invalid options and unfinished advance cannot change progress',()=>setup(async(d,svc)=>{
 const s=await svc.startFeed('all','choice');await assert.rejects(svc.answer({sessionId:s.id,taskId:s.tasks[0].id,answer:'invalid'}));await assert.rejects(svc.advanceFeed(s.id));assert.equal(await d.reviewEvents.count(),0);assert.equal((await d.activeSessions.get(s.id))!.tasks[0].id,s.tasks[0].id);
}));
test('an aborted final event rolls back memory and preserves correction draft for one safe retry',()=>setup(async(d,svc)=>{
 const s=await svc.startFeed('all','choice'),t=s.tasks[0],wrong=t.options.find(o=>o.id!==t.items[0].answerId)!,before=(await d.learningState.get(t.items[0].targetId))!.payload;await svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id});const fail=()=>{throw Error('event-write-failure')};d.reviewEvents.hook('creating',fail);await assert.rejects(svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId}));d.reviewEvents.hook('creating').unsubscribe(fail);assert.deepEqual((await d.learningState.get(t.items[0].targetId))!.payload,before);assert.deepEqual((await d.activeSessions.get(s.id))!.interaction!.attemptSequence,[wrong.id]);await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});assert.equal(await d.reviewEvents.count(),1);
}));
test('timeline scale is shared and narrow dates cannot all pass without adjusting the neutral default',()=>{
 for(const years of [[1800,1850,1900],[1871,1872,1873]]){const b=fixture();b.facts=b.facts.filter(f=>f.key==='date').slice(0,3).map((f,n)=>({...f,dateStart:years[n]+'-01-01',dateEnd:years[n]+'-12-31'}));const tasks=composeFeed(b,[],'all','timeline','daily');assert.equal(tasks.length,1);const scale=tasks[0].timeline!;assert(years.filter(y=>Math.abs(y-scale.initial)<=15).length<years.length/2);assert.equal(assess(tasks[0],{[tasks[0].items[0].entityId]:tasks[0].items[0].year}).evidence.length,0)}
});
test('ordinary property image and name cues share one unit and adding images keeps imageless properties',()=>{
 const b=fixture(),before=canonicalTargets(b).filter(i=>i.factId?.startsWith('f'));b.media.push({id:'img',entityId:'s0',role:'primary',url:'engi-media://'+'a'.repeat(64),origin:'user',license:'Личное'});const clone=structuredClone(b),after=canonicalTargets(clone).filter(i=>i.factId?.startsWith('f'));assert.equal(after.length,8);assert(before.every(i=>after.some(x=>x.targetId===i.targetId)));const rs=recipes(clone);assert.equal(new Set(rs.map(r=>r.id)).size,rs.length);
});
test('one scheduled unit creates one useful question and no non-due refill',()=>{
 const b=fixture();b.entities=b.entities.slice(0,2);b.facts=b.facts.filter(f=>f.id==='f0');const i=canonicalTargets(b)[0],m=updateMemory(undefined,i,true,i.answerId)!;assert.equal(composeFeed(b,[m]).length,0);m.card.due=new Date(Date.now()-1000);assert.equal(composeFeed(b,[m]).length,1);
});
test('Recall cannot grade before reveal; early reveal is not itself a review',()=>setup(async(d,svc)=>{
 const s=await svc.startFeed('all','recall_reveal'),t=s.tasks[0];await assert.rejects(svc.answer({sessionId:s.id,taskId:t.id,answer:true}));await svc.saveInteraction(s.id,t.id,{recallElapsedMs:1200});await assert.rejects(svc.saveInteraction(s.id,t.id,{revealed:true}));await svc.saveInteraction(s.id,t.id,{recallElapsedMs:1200,earlyReveal:true,revealed:true});assert.equal(await d.reviewEvents.count(),0);await svc.answer({sessionId:s.id,taskId:t.id,answer:true});assert.equal((await d.reviewEvents.get(t.id))!.payload.metadata.earlyReveal,true);assert.equal((await d.reviewEvents.get(t.id))!.payload.metadata.revealElapsedMs,1200);
}));
test('objective failure reduces trust in repeated confident self-reports',()=>setup(async(d,svc)=>{
 const s=await svc.startFeed('all','choice'),t=s.tasks[0],m=(await d.learningState.get(t.items[0].targetId))!.payload;m.selfReport={remembered:3,missed:0,objectiveSuccesses:0,objectiveFailures:0};await d.learningState.put(learningRow(m));await svc.answer({sessionId:s.id,taskId:t.id,answer:t.options.find(o=>o.id!==t.items[0].answerId)!.id});await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});assert.equal((await d.learningState.get(m.id))!.payload.selfReport!.objectiveFailures,1);
}));
