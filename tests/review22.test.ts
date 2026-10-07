import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {triagedMemory} from '../src/lib/engi/learning/bootstrap';
import {pickFeed,dailyNewState} from '../src/lib/engi/session/candidate-pool';
import type {Bundle} from '../src/lib/engi/types';
import {EngiDB,type SessionRow} from '../src/db/engi-db';
import {resetLearningProgress} from '../src/services/learning-service';

test('a newly enabled reverse unit belongs to its introduced source object and uses compact property Intro',()=>{
 const b:Bundle={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[],properties:[{id:'relation',name:'Автор',valueKind:'entity',cardinality:'one',learnable:true,subjectTypes:['subject'],targetTypes:['answer'],inverse:{enabled:true,name:'Произведение'},learning:{reverse:true},promptTemplates:{reverse:'Что создал {subject}?'}}]};
 for(let n=0;n<3;n++){
  b.entities.push({id:'s'+n,type:'subject',name:'Произведение '+n,aliases:[],externalIds:{}},{id:'a'+n,type:'answer',name:'Автор '+n,aliases:[],externalIds:{}});
  b.facts.push({id:'f'+n,entityId:'s'+n,key:'relation',valueKind:'entity',valueEntityId:'a'+n,verification:'user_confirmed',source:{kind:'manual',name:'Личное знание'}});
 }
 const units=canonicalTargets(b),memories=units.filter(i=>!i.targetId.endsWith(':reverse')).map(i=>triagedMemory(i,'red','old-session',0));
 const now=new Date().toISOString();
 const s:SessionRow={id:'new-session',tag:'all',format:'mixed',mode:'daily',tasks:[],currentPosition:0,results:[],createdAt:now,updatedAt:now,status:'active',timeLeft:90,completedCount:0,cooldown:[]};
 const next=pickFeed(b,memories,s,dailyNewState(undefined),['s0','s1','s2']);
 assert(next.intro);
 assert.equal(next.intro.entityId,'s0');
 assert.equal(next.intro.newProperty,true);
 assert.deepEqual(next.intro.unitIds,['ku:fact:f0:reverse']);
 const reverse=units.find(i=>i.targetId===next.intro!.unitIds[0])!;
 assert.equal(reverse.answer,'Произведение 0');
 assert.equal(reverse.name,'Автор 0');
});

test('resetLearningProgress clears memory, reviews, sessions and meta while keeping content',async()=>{
 const d=new EngiDB('reset-test-'+crypto.randomUUID());
 try{
  await d.learningState.put({id:'ku:test',payload:{} as any,dueAt:new Date().toISOString(),stability:1,covered:1});
  await d.reviewEvents.put({id:'ev:1',timestamp:new Date().toISOString(),recipe:'rec',level:'direct',payload:{},targetIds:['ku:test']});
  await d.activeSessions.put({id:'s:1',tasks:[],currentPosition:0,results:[],mode:'daily',createdAt:'',updatedAt:'',status:'active',timeLeft:60});
  await d.targetMappings.put({legacyId:'leg:1',unitId:'ku:test'});
  await d.appMeta.bulkPut([
   {key:'dailyLearning',value:{retrievals:5}},
   {key:'newLearning',value:{introducedEntityIds:['e1']}},
   {key:'introducedEntities',value:['e1']},
   {key:'reviewsSinceBackup',value:10},
   {key:'studyPreferences',value:{sound:true}},
   {key:'persistentStorage',value:true}
  ]);
  await d.entities.put({id:'e1',type:'person',name:'Person',aliases:[],externalIds:{}});

  await resetLearningProgress(d);

  assert.equal(await d.learningState.count(),0);
  assert.equal(await d.reviewEvents.count(),0);
  assert.equal(await d.activeSessions.count(),0);
  assert.equal(await d.targetMappings.count(),0);
  assert.equal(await d.appMeta.get('dailyLearning'),undefined);
  assert.equal(await d.appMeta.get('newLearning'),undefined);
  assert.equal(await d.appMeta.get('introducedEntities'),undefined);
  assert.equal(await d.appMeta.get('reviewsSinceBackup'),undefined);
  assert.deepEqual(await d.appMeta.get('studyPreferences'),{key:'studyPreferences',value:{sound:true}});
  assert.deepEqual(await d.appMeta.get('persistentStorage'),{key:'persistentStorage',value:true});
  assert.equal(await d.entities.count(),1);
 }finally{
  d.close();
  await d.delete();
 }
});
