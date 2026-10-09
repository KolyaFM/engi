import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {Bundle} from '../src/lib/engi/types';
import {EngiDB} from '../src/db/engi-db';
import {putBundle} from '../src/db/repositories';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {deckStudyScope,SELECTED_DECKS} from '../src/services/deck-study-scope';
import {createTrainerService} from '../src/services/trainer-service';
import {readLifecycle} from '../src/services/learning-lifecycle-service';
import {deckOverview,cleanDeckSelection,createDeckTargetIndex} from '../src/services/deck-overview';
import {continuousCornerPath} from '../src/ui/continuous-corners';
import {scopedGoals} from '../src/lib/engi/knowledge/goal-progress';
import {getGoalSnapshot} from '../src/services/goal-snapshot';
import {buildGoalCatalog} from '../src/services/goal-catalog';
import {feedPerformance} from '../src/services/feed-performance';
const fixture=():Bundle=>({entities:Array.from({length:6},(_,n)=>({id:'e'+n,type:'person',name:'Person '+n,aliases:[],externalIds:{}})),facts:Array.from({length:6},(_,n)=>['birth','death'].map((key,k)=>({id:key+n,entityId:'e'+n,key,valueKind:'date' as const,dateStart:(1800+n+k*70)+'-01-01',dateEnd:(1800+n+k*70)+'-12-31',datePrecision:'year' as const,verification:'user_confirmed' as const,source:{name:'Test'}}))).flat(),properties:['birth','death'].map(key=>({id:key,name:key,valueKind:'date',cardinality:'one',learnable:true,subjectTypes:['person']})),decks:[{id:'a',name:'Birth',learning:{propertyIds:['birth'],imageRecognition:false}},{id:'b',name:'Death',learning:{propertyIds:['death'],imageRecognition:false}},{id:'c',name:'Other',learning:{propertyIds:['birth'],imageRecognition:false}}],deckMembers:Array.from({length:6},(_,n)=>n<4?['a','b'].map(deckId=>({deckId,entityId:'e'+n})):[{deckId:'c',entityId:'e'+n}]).flat(),media:[],tags:[],entityTags:[],missing:[],unresolved:[]});
test('selected scope unions permitted properties, deduplicates overlaps and never becomes stored content',()=>{
 const b=fixture(),scope=deckStudyScope(b,['a','b','a']);assert.equal(canonicalTargets(scope,SELECTED_DECKS).length,8);assert(canonicalTargets(deckStudyScope(b,['a']),SELECTED_DECKS).every(i=>i.factId?.startsWith('birth')));assert.equal(canonicalTargets(deckStudyScope(b,[]),SELECTED_DECKS).length,0);assert(!b.studyScope);assert.equal(scope.decks!.length,3);
});
test('deck target index preserves per-deck and selected-union property counts',async()=>{
 const d=new EngiDB('deck-overview-index-'+crypto.randomUUID());try{await putBundle(d,fixture());const snapshot=await createTrainerService(d).getGoalSnapshot(true),ledger=await readLifecycle(d),index=createDeckTargetIndex(snapshot.bundle);
  for(const ids of [[],['a'],['b'],['c'],['a','b'],['a','c'],['a','a','b']]){
   assert.deepEqual(deckOverview(snapshot,ledger,ids,Date.now(),index),deckOverview(snapshot,ledger,ids));
  }
  assert.equal(index.targetsFor(['a','b']).size,8);
  assert.equal(index.targetsFor(['a','c']).size,6);
 }finally{d.close();await d.delete();}
});
test('global statistics reads the prepared goal catalog without rebuilding questions',async()=>{
 const d=new EngiDB('global-stats-'+crypto.randomUUID());try{await putBundle(d,fixture());const snapshot=await createTrainerService(d).getGoalSnapshot(true);
  const guarded={...snapshot,bundle:new Proxy(snapshot.bundle,{get(){throw Error('statistics rebuilt questions')}})};
  assert.equal(scopedGoals(guarded).length,snapshot.goalCatalog!.length);
 }finally{d.close();await d.delete();}
});
test('lifecycle home and counters do not compile legacy task availability',async()=>{
 const d=new EngiDB('lifecycle-counters-fast-'+crypto.randomUUID());try{await putBundle(d,fixture());const svc=createTrainerService(d);await svc.getGoalSnapshot(true);feedPerformance.start();
  const snapshot=await svc.getGoalSnapshot(true);const plan=await svc.getDayPlan('all','mixed',['a']);assert(snapshot.dayPlan?.lifecycle);assert(plan.lifecycle);
  assert.equal(feedPerformance.report().filter(x=>x.stage==='proposals').length,0);
 }finally{feedPerformance.stop();d.close();await d.delete();}
});
test('selected decks reuse the global goal catalog without compiling it again',()=>{
 const b=fixture();b.entities[0].name='Person '+crypto.randomUUID();feedPerformance.start();try{
  const global=buildGoalCatalog(b,[]),before=feedPerformance.report().filter(x=>x.stage==='candidates').length;
  const scoped=buildGoalCatalog(deckStudyScope(b,['a','b']),[]);
  assert.deepEqual(scoped,global);
  assert.equal(feedPerformance.report().filter(x=>x.stage==='candidates').length,before);
 }finally{feedPerformance.stop();}
});
test('fresh selected study opens its introduction without compiling an empty proposal pool',async()=>{
 const d=new EngiDB('fresh-intro-fast-'+crypto.randomUUID());try{await putBundle(d,fixture());const svc=createTrainerService(d);await svc.getGoalSnapshot(true);feedPerformance.start();
  const session=await svc.startGoalFeed('all','mixed','daily',{endless:true,deckIds:['a']});
  assert(session.intro);assert.equal(feedPerformance.report().filter(x=>x.stage==='proposals').length,0);
 }finally{feedPerformance.stop();d.close();await d.delete();}
});
test('recently introduced goals do not force question generation before the next introduction',async()=>{
 const d=new EngiDB('intro-followup-fast-'+crypto.randomUUID());try{await putBundle(d,fixture());const svc=createTrainerService(d);let session=await svc.startGoalFeed('all','mixed','daily',{endless:true,deckIds:['a']});assert(session.intro);
  feedPerformance.start();session=await svc.completeIntro(session.id);const spans=feedPerformance.report();
  assert(session.intro);assert.equal(spans.filter(x=>x.stage==='proposals').length,0);
 }finally{feedPerformance.stop();d.close();await d.delete();}
});
test('opening an unchanged collection reuses its stored goal catalog after an app restart',async()=>{
 const d=new EngiDB('persistent-catalog-'+crypto.randomUUID());try{await putBundle(d,fixture());const unrelated=fixture();unrelated.facts[0].dateStart='1888-01-01';buildGoalCatalog(unrelated,[]);feedPerformance.start();
  const first=await getGoalSnapshot(d,true),built=feedPerformance.report().filter(x=>x.stage==='candidates').length;
  assert(built>0);assert(await d.appMeta.get('studyCore:goalCatalogCache'));
  const other=fixture();other.facts[0].dateStart='1901-01-01';buildGoalCatalog(other,[]);
  const before=feedPerformance.report().filter(x=>x.stage==='candidates').length;
  const second=await getGoalSnapshot(d,true);
  assert.deepEqual(second.goalCatalog,first.goalCatalog);
  assert.equal(feedPerformance.report().filter(x=>x.stage==='candidates').length,before);
  await d.facts.update('birth0',{dateStart:'1902-01-01',dateEnd:'1902-12-31'});
  await getGoalSnapshot(d,true);
  assert(feedPerformance.report().filter(x=>x.stage==='candidates').length>before);
 }finally{feedPerformance.stop();d.close();await d.delete();}
});
test('selection cleans missing and archived decks, preserves an explicit empty choice and defaults old users to all decks',()=>{
 const s:any={bundle:fixture()};assert.equal(cleanDeckSelection(undefined,s).ids.length,3);assert.deepEqual(cleanDeckSelection({ids:[]},s).ids,[]);assert.deepEqual(cleanDeckSelection({ids:['a','bad','a']},s).ids,['a']);
});
test('multi-deck introduction and continuation obey property permissions with one daily budget and matching counters',async()=>{
 const d=new EngiDB('deck-scope-'+crypto.randomUUID());try{await putBundle(d,fixture());const svc=createTrainerService(d);await svc.getGoalSnapshot(true);let s=await svc.startGoalFeed('all','mixed','daily',{endless:true,deckIds:['a']});assert(s.intro);assert(s.intro.unitIds.every(id=>canonicalTargets(deckStudyScope(fixture(),['a']),SELECTED_DECKS).some(i=>i.targetId===id)));s=await svc.completeIntro(s.id);let snapshot=await svc.getGoalSnapshot(true),ledger=await readLifecycle(d),plan=await svc.getDayPlan('all','mixed',['a']);assert.equal(deckOverview(snapshot,ledger,['a']).learning,plan.workload!.learning);assert.equal(deckOverview(snapshot,ledger,['b']).learning,0);assert.equal(ledger!.cards.length,1);
 const resumed=await createTrainerService(d).getResumableSession({endless:true});assert.deepEqual(resumed?.deckIds,['a']);assert.equal(resumed?.tasks[0]?.id,s.tasks[0]?.id);
 const union=await svc.startGoalFeed('all','mixed','daily',{endless:true,deckIds:['a','b']});assert(union.intro?.newProperty);assert(union.intro.unitIds.every(id=>canonicalTargets(deckStudyScope(fixture(),['b']),SELECTED_DECKS).some(i=>i.targetId===id)));await svc.completeIntro(union.id);ledger=await readLifecycle(d);assert.equal(ledger!.cards.length,1);assert.equal(ledger!.units.length,2);snapshot=await svc.getGoalSnapshot(true);plan=await svc.getDayPlan('all','mixed',['a','b']);assert.equal(deckOverview(snapshot,ledger,['a','b']).learning,plan.workload!.learning);
 await assert.rejects(svc.startGoalFeed('all','mixed','daily',{endless:true,deckIds:[]}));await assert.rejects(svc.startGoalFeed('all','mixed','daily',{endless:true,deckIds:['missing']}));
 }finally{d.close();await d.delete();}
});
test('declared known properties count once in percentage and have no learning obligations',async()=>{
 const d=new EngiDB('deck-known-'+crypto.randomUUID());try{await putBundle(d,fixture());const svc=createTrainerService(d);let s=await svc.startGoalFeed('all','mixed','daily',{endless:true,deckIds:['a','b']});assert(s.intro);const decision={entityId:s.intro.entityId,selections:Object.fromEntries(s.intro.unitIds.map(id=>[id,'green' as const]))};await svc.completeIntro(s.id,decision);const snapshot=await svc.getGoalSnapshot(true),ledger=await readLifecycle(d),stats=deckOverview(snapshot,ledger,['a','b']);assert.equal(stats.total,8);assert.equal(stats.learned,2);assert.equal(stats.percent,25);assert.equal(stats.learning,0);assert.equal(deckOverview(snapshot,ledger,['a','a']).total,4);
 }finally{d.close();await d.delete();}
});
test('small selected decks retain answerable individual choices using ungraded context distractors',async()=>{
 const d=new EngiDB('deck-small-'+crypto.randomUUID());try{await putBundle(d,fixture());const svc=createTrainerService(d);const s=await svc.startGoalFeed('all','mixed','daily',{endless:true,deckIds:['c']});assert(s.intro);let next=await svc.completeIntro(s.id);if(next.intro)next=await svc.completeIntro(next.id);assert(next.tasks[0]);assert(next.tasks[0].items.every(i=>['e4','e5'].includes(i.entityId)));assert(next.tasks[0].options.length>=2);assert(next.tasks[0].items.every(i=>i.factId?.startsWith('birth')));
 }finally{d.close();await d.delete();}
});
test('continuous-corner geometry scales without invalid coordinates for mobile controls',()=>{for(const [w,h,r]of [[180,220,24],[40,40,12],[320,52,20],[10,5,30]]){const path=continuousCornerPath(w,h,r);assert(!path.includes('NaN'));assert.equal((path.match(/C /g)??[]).length,8);assert(path.endsWith('Z'));}});
