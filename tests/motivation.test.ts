import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {EngiDB} from '../src/db/engi-db';
import {getSnapshot,learningRow} from '../src/db/repositories';
import * as knowledge from '../src/services/knowledge-service';
import {recipes,eligible,canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {updateMemory} from '../src/lib/engi/engine';
import {composeFeed} from '../src/lib/engi/session/composer';
import {createTrainerService} from '../src/services/trainer-service';
import {exportBackup,restoreBackup} from '../src/services/backup-service';
import type {Bundle} from '../src/lib/engi/types';
function fixture():Bundle{const b:Bundle={entities:[],facts:[],media:[],tags:[{id:'set',name:'Моя подборка'}],entityTags:[],missing:[],unresolved:[],entityTypes:[{id:'s',name:'Объект'},{id:'a',name:'Ответ'}],properties:[{id:'p',name:'Автор',valueKind:'entity',cardinality:'one',learnable:true,subjectTypes:['s'],targetTypes:['a']}]};for(let i=0;i<6;i++){b.entities.push({id:'s'+i,type:'s',name:'Объект '+i,aliases:[],externalIds:{}},{id:'a'+i,type:'a',name:'Ответ '+i,aliases:[],externalIds:{}});b.facts.push({id:'f'+i,entityId:'s'+i,key:'p',valueKind:'entity',valueEntityId:'a'+i,source:{kind:'manual',name:'Личное знание'},verification:'user_confirmed'});b.entityTags.push({entityId:'s'+i,tagId:'set'})}return b}
async function setup(run:(d:EngiDB)=>Promise<void>){const d=new EngiDB('motivation-'+crypto.randomUUID());try{await knowledge.saveKnowledge(fixture(),d);await run(d)}finally{d.close();await d.delete()}}

test('accept upstream fact resets only its own targets and clears conflict',()=>setup(async d=>{
 const b=fixture(),r=recipes(b).find(r=>r.answerKey==='p'&&r.format==='choice')!,items=eligible(b,r);
 for(const i of items.slice(0,2))await d.learningState.put(learningRow(updateMemory(undefined,i,true,i.answerId)!));
 const old=(await d.facts.get('f0'))!;await d.facts.put({...old,origin:'pack',originPackId:'sample',originPackVersion:1,userModified:true,upstreamConflict:true,upstreamValue:{...old,valueEntityId:'a2'}});
 await (knowledge as any).resolvePackConflict('facts','f0','pack',d);
 assert.equal((await d.facts.get('f0'))!.valueEntityId,'a2');assert.equal((await d.facts.get('f0'))!.upstreamConflict,false);assert.equal((await d.facts.get('f0'))!.userModified,false);
 assert.equal(await d.learningState.get(items[0].targetId),undefined);assert(await d.learningState.get(items[1].targetId));
}));

test('keep local fact clears conflict without changing memory and remembers upstream acknowledgement',()=>setup(async d=>{
 const b=fixture(),i=eligible(b,recipes(b).find(r=>r.answerKey==='p'&&r.format==='choice')!)[0];await d.learningState.put(learningRow(updateMemory(undefined,i,true,i.answerId)!));const before=await d.learningState.toArray(),old=(await d.facts.get('f0'))!;
 await d.facts.put({...old,origin:'pack',originPackId:'sample',userModified:true,upstreamConflict:true,upstreamValue:{...old,valueEntityId:'a2'}});
 await (knowledge as any).resolvePackConflict('facts','f0','mine',d);const next=(await d.facts.get('f0'))! as any;
 assert.equal(next.valueEntityId,'a0');assert.equal(next.upstreamConflict,false);assert(next.upstreamAcknowledged);assert.deepEqual(await d.learningState.toArray(),before);
}));

test('invalid upstream relation cannot corrupt existing graph or dismiss conflict',()=>setup(async d=>{
 const old=(await d.facts.get('f0'))!;await d.facts.put({...old,upstreamConflict:true,upstreamValue:{...old,valueEntityId:'absent'}});
 await assert.rejects((knowledge as any).resolvePackConflict('facts','f0','pack',d));assert.equal((await d.facts.get('f0'))!.valueEntityId,'a0');assert.equal((await d.facts.get('f0'))!.upstreamConflict,true);
}));

test('home hook uses real due memories and otherwise actual new objects',async()=>{
 const {returnHook}=await import('../src/lib/engi/knowledge/motivation');const b=fixture(),i=eligible(b,recipes(b).find(r=>r.answerKey==='p'&&r.format==='choice')!)[0],m=updateMemory(undefined,i,true,i.answerId)!;m.card.due=new Date(Date.now()-1000);
 assert.equal(returnHook({bundle:b,memories:[m],events:[]})!.kind,'due');assert.equal(returnHook({bundle:b,memories:[],events:[]})!.count,6);
 assert.equal(returnHook({bundle:{...b,entities:[],facts:[],entityTags:[]},memories:[],events:[]}),null);
});

test('daily progress counts completed retrievals, excludes diagnostics and reports real stability crossings',async()=>{
 const {todayLearning}=await import('../src/lib/engi/knowledge/motivation');const now=new Date();
 const s={bundle:fixture(),memories:[],events:[{id:'a',timestamp:now.toISOString(),recipe:'choice',level:'direct',payload:{score:0,metadata:{stabilityTransitions:[]}}},{id:'b',timestamp:now.toISOString(),recipe:'choice',level:'direct',payload:{score:1,metadata:{stabilityTransitions:[{targetId:'x',before:29,after:31}]}}},{id:'c',timestamp:now.toISOString(),recipe:'timeline',level:'diagnostic',payload:{score:1}},{id:'d',timestamp:new Date(now.getTime()-86400000).toISOString(),recipe:'choice',level:'direct',payload:{score:1}}]};
 assert.deepEqual(todayLearning(s,now),{retrievals:2,stability30Gains:1});
});

test('low-trust repeated self-grades are checked by objective choices, not more Recall',()=>{
 const b=fixture();b.properties![0].learning={match:'off',categorize:'off'};
 const memories=canonicalTargets(b).map(i=>({...updateMemory(undefined,i,true,i.answerId)!,selfReport:{remembered:5,missed:0,objectiveFailures:2,objectiveSuccesses:0}}));
 const tasks=composeFeed(b,memories,'all','mixed','weak',[],12);assert(tasks.length>=6);assert(tasks.every(t=>t.recipe.format==='choice'));assert(tasks.some(t=>t.reason==='calibration'));
});

test('self-grade calibration and acknowledged local content survive backup and restore',()=>setup(async d=>{
 const b=fixture(),i=canonicalTargets(b)[0],m={...updateMemory(undefined,i,true,i.answerId)!,selfReport:{remembered:3,missed:1,objectiveFailures:1,objectiveSuccesses:2}};await d.learningState.put(learningRow(m));
 const backup=JSON.parse(JSON.stringify(await exportBackup(d))),target=new EngiDB('backup-'+crypto.randomUUID());try{await restoreBackup(backup,target);assert.deepEqual((await target.learningState.get(m.id))!.payload.selfReport,m.selfReport)}finally{target.close();await target.delete()}
}));

test('a quick near-twin repair does not schedule FSRS twice and decays observed confusion',()=>setup(async d=>{
 const svc=createTrainerService(d);let s=await svc.startFeed('all','choice');const t=s.tasks[0],wrong=t.options.find(o=>o.id!==t.items[0].answerId)!;
 await d.learningState.put(learningRow(updateMemory(undefined,t.items[0],true,t.items[0].answerId)!));await svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id});await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});
 const before=(await d.learningState.get(t.items[0].targetId))!.payload;let repaired=false;
 for(let n=0;n<10;n++){s=await svc.advanceFeed(s.id);const next=s.tasks[s.currentPosition];if(next.recipe.format==='recall_reveal')await svc.saveInteraction(s.id,next.id,{recallElapsedMs:5000,revealed:true});await svc.answer({sessionId:s.id,taskId:next.id,answer:next.recipe.format==='recall_reveal'?true:next.items[0].answerId});if(next.retryOf===t.id){const after=(await d.learningState.get(t.items[0].targetId))!.payload;assert.deepEqual(after.card,before.card);assert(after.confusions[wrong.id]<before.confusions[wrong.id]);assert.equal((await d.reviewEvents.get(next.id))!.payload.feedback.repairResolved,true);repaired=true;break}}
 assert(repaired);
}));
