import 'fake-indexeddb/auto';
import {test} from 'node:test';import assert from 'node:assert/strict';
import {EngiDB} from '../src/db/engi-db';import {putBundle} from '../src/db/repositories';
import {createTrainerService} from '../src/services/trainer-service';
import {propertyFixture} from './fixtures/deck-properties';
import {saveDeckPropertySelection} from '../src/services/deck-property-settings';
import {feedPerformance} from '../src/services/feed-performance';
test('new introductions carry their selected content without another database read; restored sessions have a read-only fallback',async()=>{
 const d=new EngiDB('intro-presentation-'+crypto.randomUUID());try{
  await putBundle(d,{entities:Array.from({length:6},(_,n)=>({id:'e'+n,name:'E'+n,type:'person',aliases:[],externalIds:{}})),media:Array.from({length:6},(_,n)=>({id:'m'+n,entityId:'e'+n,role:'primary',url:'https://example.test/'+n+'.png',license:'Test'})),facts:[],tags:[],entityTags:[],missing:[],unresolved:[]});
  const svc=createTrainerService(d),s=await svc.startGoalFeed('all','mixed','daily',{endless:true});assert(s.intro);
  const view=svc.introPresentation(s);assert(view,'selection must prepare the intro before returning');
  assert(view.items.length);assert(view.items.every(i=>s.intro!.unitIds.includes(i.targetId)&&i.entityId===s.intro!.entityId));
  assert.equal(view.bundle.entities.find(e=>e.id===s.intro!.entityId)?.name,'E'+s.intro!.entityId.slice(1));
  const restored=(await d.activeSessions.get(s.id))!;assert.equal(svc.introPresentation(restored),undefined,'presentation is never persisted');
  const before=JSON.stringify(await d.appMeta.toArray());const loaded=await svc.loadIntroPresentation(restored);assert.deepEqual(loaded,view);assert.equal(JSON.stringify(await d.appMeta.toArray()),before);
  assert.equal(svc.introPresentation({...s,intro:undefined}),undefined);
 }finally{d.close();await d.delete();}
});
test('prepared intros use current selected properties and never reuse a previous settings snapshot',async()=>{
 const d=new EngiDB('intro-scope-'+crypto.randomUUID());try{
  await putBundle(d,propertyFixture());const svc=createTrainerService(d);
  const first=await svc.startGoalFeed('all','mixed','daily',{endless:true,deckIds:['a']}),old=svc.introPresentation(first)!;
  assert(old.items.length);assert(old.items.every(i=>i.factId?.startsWith('year')));
  await saveDeckPropertySelection(d,'a',['other'],false);
  const next=await svc.startGoalFeed('all','mixed','daily',{endless:true,deckIds:['a']}),view=svc.introPresentation(next)!;
  assert(view.items.length);assert(view.items.every(i=>i.factId?.startsWith('other')));assert.notEqual(view,old);
  assert(!('bundle' in (await d.activeSessions.get(next.id))!), 'content snapshots stay out of IndexedDB');
 }finally{d.close();await d.delete();}
});
test('completing an intro reads content once for both acceptance and next selection',async()=>{
 const d=new EngiDB('intro-done-'+crypto.randomUUID());try{
  await putBundle(d,propertyFixture());const svc=createTrainerService(d),s=await svc.startGoalFeed('all','mixed','daily',{endless:true,deckIds:['a']});assert(s.intro);
  let reads=0,memoryReads=0;const read=d.entities.toArray.bind(d.entities);d.entities.toArray=(()=>{reads++;return read()}) as typeof d.entities.toArray;
  const readMemory=d.learningState.toArray.bind(d.learningState);d.learningState.toArray=(()=>{memoryReads++;return readMemory()}) as typeof d.learningState.toArray;
  feedPerformance.start();const next=await svc.completeIntro(s.id,{entityId:s.intro.entityId,introId:s.intro.introId,selections:s.intro.selections});const stages=feedPerformance.report();feedPerformance.stop();
  assert.equal(reads,1,'reuse the transaction content snapshot rather than reading it again in selectNext');assert(next.intro||next.tasks.length);
  assert.equal(stages.filter(s=>s.stage==='catalog').length,1,'acceptance and selection share the same up-to-date catalog');
  assert.equal(memoryReads,1,'configuration is normalized once after applying the choices');
 }finally{d.close();await d.delete();}
});
