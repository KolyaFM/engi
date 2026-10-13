import test from 'node:test';
import assert from 'node:assert/strict';
import {defineGoal} from '../src/lib/engi/study-core/goals';
import {buildStatistics,statisticsKey,type StatisticsInput} from '../src/lib/engi/knowledge/statistics';
import 'fake-indexeddb/auto';
import {EngiDB} from '../src/db/engi-db';
import {getStatisticsInput} from '../src/services/statistics-service';
import type {Snapshot} from '../src/lib/engi/types';
import {resetLearningProgress} from '../src/services/learning-service';
const goal=(key:string,direction:'forward'|'reverse'='forward',revision='v1')=>defineGoal({knowledge:{kind:'fact',key},skill:'recognition',direction,cueRole:'subject',precision:'exact',revision});
const now=new Date('2026-10-13T12:00:00');
const input=():StatisticsInput=>({now,properties:[{key:statisticsKey(goal('a')),entityId:'state',name:'Столица',objectName:'Штат',deckIds:['one','two']}],completions:[],learning:[],known:[],answers:[],activity:[],repairs:[]});
test('statistics counts one property across directions, revisions and overlapping decks',()=>{
 const a=input();a.completions=[{key:statisticsKey(goal('a')),at:'2026-10-12T12:00:00'},{key:statisticsKey(goal('a','reverse','v2')),at:'2026-10-13T10:00:00'}];
 assert.equal(buildStatistics(a).mastered,1);assert.equal(buildStatistics(a).today.gained,0);assert.equal(buildStatistics(a,'two').mastered,1);
});
test('statistics accuracy keeps first independent scheduled answer per property per local day',()=>{
 const a=input();a.answers=[{id:'1',key:a.properties[0].key,at:'2026-10-13T09:00:00',correct:false,scheduled:true},{id:'2',key:a.properties[0].key,at:'2026-10-13T09:05:00',correct:true,scheduled:true},{id:'3',key:a.properties[0].key,at:'2026-10-13T08:00:00',correct:true,scheduled:false}];
 const s=buildStatistics(a);assert.equal(s.today.reviewed,1);assert.equal(s.today.correct,0);assert.equal(s.today.checked,1);
});
test('known declarations and migration baseline do not award today gains',()=>{
 const a=input();a.known=[a.properties[0].key];assert.equal(buildStatistics(a).mastered,0);assert.equal(buildStatistics(a).known,1);
 a.known=[];a.completions=[{key:a.properties[0].key}];const s=buildStatistics(a);assert.equal(s.mastered,1);assert.equal(s.today.gained,0);assert.equal(s.days.at(-1)!.mastered,1);assert.equal(s.historyStart,undefined);
});
test('statistics deduplicates screen activity, property repair and unfinished learning',()=>{
 const a=input(),key=a.properties[0].key,at='2026-10-13T10:00:00';a.learning=[key,key];a.activity=[{id:'screen',at},{id:'screen',at}];a.repairs=[{id:'episode',key,at},{id:'episode',key,at}];
 const s=buildStatistics(a);assert.equal(s.learning,1);assert.equal(s.today.tasks,1);assert.equal(s.today.repaired,1);
});
test('statistics uses calendar days and leaves missing activity at zero',()=>{
 const a=input();a.activity=[{id:'yesterday',at:'2026-10-12T23:59:59'},{id:'today',at:'2026-10-13T00:00:01'}];const s=buildStatistics(a);assert.equal(s.today.tasks,1);assert.equal(s.days.at(-2)!.tasks,1);assert.equal(s.days.at(-3)!.tasks,0);assert.equal(s.historyStart,'2026-10-12');
});
test('statistics reads beyond 1000 events and includes pending first failures without counting pair receipts as screens',async()=>{
 const db=new EngiDB('statistics-'+crypto.randomUUID());try{
 const g=goal('a'),bundle={entities:[{id:'state',name:'Штат',type:'state',aliases:[],externalIds:{}}],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[],decks:[],deckMembers:[]} as Snapshot['bundle'];
 const snapshot={bundle,memories:[],events:[],goalCatalog:[{goal:g,targetIds:['a'],entityIds:['state'],propertyId:'capital',suspended:false}],goalMemories:[]} as Snapshot;
 await db.reviewEvents.bulkPut(Array.from({length:1002},(_,i)=>({id:'event'+i,timestamp:'2026-10-12T12:00:00',recipe:'choice',level:'direct',targetIds:[g.id],payload:{studyCore:{attempt:{results:[{goalId:g.id,correct:true,credit:true}]}},metadata:{stabilityTransitions:[{targetId:g.id,before:2,after:3}]}}})));
 await db.appMeta.put({key:'studyCore:reviewReceipt:pending',value:{id:'pending',timestamp:'2026-10-13T09:00:00',recipe:'choice',level:'direct',targetIds:[g.id],payload:{studyCore:{attempt:{results:[{goalId:g.id,correct:false,credit:true}]}},metadata:{stabilityTransitions:[{targetId:g.id,before:3,after:1}]}}}});
 let projection=buildStatistics(await getStatisticsInput(db,snapshot,now));assert.equal(projection.days.at(-2)!.tasks,1002);assert.equal(projection.today.correct,0);assert.equal(projection.today.checked,1);assert.equal(projection.today.tasks,0);
 await db.reviewEvents.put({id:'task:pair:state',timestamp:'2026-10-13T10:00:00',recipe:'match',level:'direct',targetIds:[],payload:{}});
 projection=buildStatistics(await getStatisticsInput(db,snapshot,now));assert.equal(projection.today.tasks,0);
 await resetLearningProgress(db);projection=buildStatistics(await getStatisticsInput(db,snapshot,now));assert.equal(projection.days.reduce((n,d)=>n+d.tasks,0),0);assert.equal(projection.today.checked,0);
 }finally{await db.delete();}
});
test('a completed matching screen has deck activity even though its summary has no goal IDs',async()=>{
 const db=new EngiDB('statistics-group-'+crypto.randomUUID());try{
 const g=goal('a'),bundle={entities:[{id:'state',name:'Штат',type:'state',aliases:[],externalIds:{}}],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[],decks:[{id:'one',name:'Штаты',learning:{imageRecognition:false}}],deckMembers:[{deckId:'one',entityId:'state'}]} as Snapshot['bundle'];
 const snapshot={bundle,memories:[],events:[],goalCatalog:[{goal:g,targetIds:['a'],entityIds:['state'],propertyId:'capital',suspended:false}],goalMemories:[]} as Snapshot;
 await db.reviewEvents.put({id:'matching',timestamp:'2026-10-13T10:00:00',recipe:'match',level:'matching-summary',targetIds:[],payload:{feedback:{items:[{targetId:'a'}]}}});
 const projection=buildStatistics(await getStatisticsInput(db,snapshot,now),'one');assert.equal(projection.today.tasks,1);assert.equal(projection.today.reviewed,0);
 await db.reviewEvents.put({id:'legacy',timestamp:'2026-10-13T10:00:00',recipe:'choice',level:'direct',targetIds:['a'],payload:{targets:[{targetId:'a',correct:false,independent:true}],metadata:{stabilityTransitions:[{targetId:'a',before:3,after:1}]}}});
 const legacy=buildStatistics(await getStatisticsInput(db,snapshot,now),'one');assert.equal(legacy.today.checked,1);assert.equal(legacy.today.correct,0);
 }finally{await db.delete();}
});
