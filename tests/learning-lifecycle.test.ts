import 'fake-indexeddb/auto';
import {test,mock} from 'node:test';
import assert from 'node:assert/strict';
import {EngiDB} from '../src/db/engi-db';
import {putBundle} from '../src/db/repositories';
import {createTrainerService} from '../src/services/trainer-service';
import type {Bundle} from '../src/lib/engi/types';
import {ensureLifecycle,LIFECYCLE_KEY} from '../src/services/learning-lifecycle-service';
import {buildGoalCatalog} from '../src/services/goal-catalog';
import {getBundle} from '../src/db/repositories';
import {createEmptyCard} from 'ts-fsrs';
import {exportBackup,restoreBackup} from '../src/services/backup-service';
import {setUnitSuspended} from '../src/services/learning-service';
import {saveKnowledge} from '../src/services/knowledge-service';
import {writeFileSync} from 'node:fs';
import {startStudyTrace,studyTraceReport} from '../src/services/study-selection-trace';
const fixture=(count=6):Bundle=>({entities:Array.from({length:count},(_,n)=>[{id:'s'+n,name:'Объект '+n,type:'s',aliases:[],externalIds:{}},{id:'a'+n,name:'Автор '+n,type:'a',aliases:[],externalIds:{}}]).flat(),facts:Array.from({length:count},(_,n)=>['author','country'].map(key=>({id:key+n,entityId:'s'+n,key,valueKind:'entity' as const,valueEntityId:'a'+n,verification:'user_confirmed' as const,source:{kind:'manual' as const,name:'Test'}}))).flat(),media:[],tags:[],entityTags:[],missing:[],unresolved:[],entityTypes:[{id:'s',name:'Объект'},{id:'a',name:'Ответ'}],properties:['author','country'].map(id=>({id,name:id,valueKind:'entity' as const,cardinality:'one' as const,learnable:true,subjectTypes:['s'],targetTypes:['a']}))});
async function run(action:(d:EngiDB,svc:ReturnType<typeof createTrainerService>)=>Promise<void>,bundle=fixture()){const d=new EngiDB('lifecycle-'+crypto.randomUUID());try{await putBundle(d,bundle);await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:1}});await action(d,createTrainerService(d));}finally{d.close();await d.delete();}}
test('completed object intro admits both properties immediately and consumes one daily object',()=>run(async(d,svc)=>{
 let session=await svc.startGoalFeed('all','choice','daily',{endless:true});assert(session.intro);
 session=await svc.completeIntro(session.id);
 const plan=await svc.getDayPlan('all','choice');assert.equal(plan.workload!.new,0);assert.equal(plan.workload!.learning,2);
 assert.equal(plan.newGoalIds.length,1);assert.equal((await d.appMeta.get('studyCore:learningLifecycle'))!.value.units.length,2);
}));
test('learning introduces another object instead of chaining properties of the first object',async()=>{
 const at=new Date(2026,9,8,10).getTime();mock.timers.enable({apis:['Date'],now:at});
 try{await run(async(d,svc)=>{
  let s=await svc.startGoalFeed('all','choice','daily',{endless:true});const owner=s.intro!.entityId;
  s=await svc.completeIntro(s.id);mock.timers.setTime(at+15000);
  const {pickLifecycleFeed}=await import('../src/services/lifecycle-feed-service');
  const next=await pickLifecycleFeed(d,await getBundle(d),(await d.learningState.toArray()).map(r=>r.payload),s,(await d.appMeta.get('newLearning'))!.value,[owner]);
  assert(next.intro,'another object should enter the queue before a different property of the last introduced object');assert.notEqual(next.intro.entityId,owner);
 });}finally{mock.timers.reset();}
});
test('learning alternates objects whenever another object has an eligible property',async()=>{
 const at=new Date(2026,9,8,10).getTime();mock.timers.enable({apis:['Date'],now:at});
 try{await run(async(d,svc)=>{
  let s=await svc.startGoalFeed('all','choice','daily',{endless:true});for(let n=0;n<3;n++)s=await svc.completeIntro(s.id);
  mock.timers.setTime(at+15000);const q=s.tasks[0],owner=q.items[0].entityId,ledger=(await d.appMeta.get(LIFECYCLE_KEY))!.value;
  // Other objects are at confirmation, while the last object's sibling is still at first-check.
  for(const u of ledger.units)if(u.entityId!==owner){u.successes=1;u.stage='confirmation';}
  await d.appMeta.put({key:LIFECYCLE_KEY,value:ledger});await svc.answer({sessionId:s.id,taskId:q.id,answer:q.items[0].answerId});
  s=await svc.advanceFeed(s.id,false,q.id);assert.notEqual(s.tasks[0].items[0].entityId,owner,'available different objects must outrank the first-check sibling of the last object');
 },fixture(3));}finally{mock.timers.reset();}
});
test('correct service answers drain acquisition and create one real FSRS review per property',async()=>{
 const at=new Date(2026,9,8,10).getTime();mock.timers.enable({apis:['Date'],now:at});
 try{await run(async(d,svc)=>{
  let session=await svc.startGoalFeed('all','choice','daily',{endless:true});session=await svc.completeIntro(session.id);
  const firstEntity=(await d.appMeta.get('studyCore:learningLifecycle'))!.value.cards[0].entityId;
  for(let n=0;n<35;n++){
   mock.timers.setTime(at+(n+1)*15000);
   if(session.intro){session=await svc.completeIntro(session.id);continue;}
   const task=session.tasks[0];assert(task,'feed must remain playable');
   if(task.recipe.format==='recall_reveal')await svc.saveInteraction(session.id,task.id,{revealed:true,recallElapsedMs:5000});
   const outcome=await svc.answer({sessionId:session.id,taskId:task.id,answer:task.recipe.format==='recall_reveal'?true:task.items[0].answerId});
   const ledger=(await d.appMeta.get('studyCore:learningLifecycle'))!.value;
   if(ledger.units.filter((u:any)=>u.entityId===firstEntity).every((u:any)=>u.stage==='completed')){
    for(const unit of ledger.units.filter((u:any)=>u.entityId===firstEntity)){const memory=(await d.appMeta.get('studyCore:memory:'+unit.goal.id))!.value;assert.equal(memory.card.state,2);assert.equal(memory.card.reps,1);}
    const before=structuredClone(ledger);await svc.answer({sessionId:session.id,taskId:task.id,answer:task.items[0].answerId});assert.deepEqual((await d.appMeta.get('studyCore:learningLifecycle'))!.value,before);
    assert(outcome);return;
   }
   session=await svc.advanceFeed(session.id,false,task.id);
  }
  assert.fail('initial properties never graduated');
 });}finally{mock.timers.reset();}
});
test('initial failure is one error; same-screen correction cannot advance acquisition or close it',async()=>{
 const at=new Date(2026,9,8,10).getTime();mock.timers.enable({apis:['Date'],now:at});
 try{await run(async(d,svc)=>{
  let s=await svc.startGoalFeed('all','choice','daily',{endless:true});s=await svc.completeIntro(s.id);mock.timers.setTime(at+15000);
  if(s.intro)s=await svc.completeIntro(s.id);else s=await svc.advanceFeed(s.id,true,s.tasks[0].id);
  const task=s.tasks[0];assert(task);const wrong=task.options.find(o=>o.id!==task.items[0].answerId)!;
  await svc.answer({sessionId:s.id,taskId:task.id,answer:wrong.id});const failed=structuredClone((await d.appMeta.get(LIFECYCLE_KEY))!.value);
  assert.equal((await svc.getDayPlan()).workload!.mistakes,1);
  await svc.answer({sessionId:s.id,taskId:task.id,answer:task.items[0].answerId});assert.deepEqual((await d.appMeta.get(LIFECYCLE_KEY))!.value,failed);assert.equal((await svc.getDayPlan()).workload!.mistakes,1);
  for(let n=0;n<20;n++){mock.timers.setTime(at+(n+3)*15000);s=await svc.advanceFeed(s.id,false,s.tasks[0].id);if(s.intro){s=await svc.completeIntro(s.id);continue;}const q=s.tasks[0];if(q.recipe.format==='recall_reveal')await svc.saveInteraction(s.id,q.id,{revealed:true,recallElapsedMs:5000});await svc.answer({sessionId:s.id,taskId:q.id,answer:q.recipe.format==='recall_reveal'?true:q.items[0].answerId});if((await svc.getDayPlan()).workload!.mistakes===0)return;}
  assert.fail('fresh checks must resolve the initial error');
 });}finally{mock.timers.reset();}
});
test('legacy Learning migrates idempotently and a fresh confirmation preserves every future FSRS field',()=>run(async(d,svc)=>{
 const catalog=buildGoalCatalog(await getBundle(d),[]),entry=catalog.find(e=>e.goal.skill==='recognition')!,card={...createEmptyCard(),state:1,stability:4,difficulty:5,last_review:new Date(),due:new Date(Date.now()+600000)};
 await d.appMeta.put({key:'studyCore:memory:'+entry.goal.id,value:{goalId:entry.goal.id,goal:entry.goal,card,independentAttempts:1,independentSuccesses:1,lastCorrect:true}});
 const ledger=await ensureLifecycle(d,catalog);assert.equal(ledger.units.find(u=>u.goal.id===entry.goal.id)!.requiredSuccesses,1);assert.deepEqual(await ensureLifecycle(d,catalog),ledger);
 const before=(await d.appMeta.get('studyCore:memory:'+entry.goal.id))!.value;
 // The confirmation is independent acquisition evidence despite a future FSRS deadline.
 const {createStudyCoreService}=await import('../src/services/study-core-service');const {defineGoal}=await import('../src/lib/engi/study-core/goals');void defineGoal;
 const core=createStudyCoreService(d,{lifecycle:true}),contract={id:'migration-confirm',practice:false,primaryGoals:[entry.goal],supportGoalIds:[],visibleEntities:[],actionFamily:'select' as const,shownClaims:[],hintClaims:[],feedbackClaims:[],contentRevisions:{[entry.goal.semanticKey]:entry.goal.revision},response:{kind:'choice' as const,goalId:entry.goal.id,options:['yes','no'],expected:'yes'}};
 await core.setContentRevisions(contract.contentRevisions);await core.open(contract,contract.id);const attempt=await core.submit(contract.id,'yes');assert.equal(attempt.results![0].acquisitionCredit,true);assert.equal(attempt.results![0].credit,false);assert.deepEqual((await d.appMeta.get('studyCore:memory:'+entry.goal.id))!.value,before);
}));
test('lifecycle backup survives restart and midnight; suspension removes active workload without erasing its progress',async()=>{
 const at=new Date(2026,9,8,23,59).getTime();mock.timers.enable({apis:['Date'],now:at});
 try{await run(async(d,svc)=>{
  let s=await svc.startGoalFeed('all','choice','daily',{endless:true});s=await svc.completeIntro(s.id);const ledger=(await d.appMeta.get(LIFECYCLE_KEY))!.value;
  const target=new EngiDB('lifecycle-restored-'+crypto.randomUUID());try{await restoreBackup(JSON.parse(JSON.stringify(await exportBackup(d))),target);assert.deepEqual((await target.appMeta.get(LIFECYCLE_KEY))!.value,ledger);}finally{target.close();await target.delete();}
  const catalog=buildGoalCatalog(await getBundle(d),(await d.learningState.toArray()).map(r=>r.payload)),unit=ledger.units[0],entry=catalog.find(e=>e.goal.id===unit.goal.id)!;
  await setUnitSuspended(entry.targetIds[0],true,d);assert.equal((await svc.getDayPlan()).workload!.learning,1);await setUnitSuspended(entry.targetIds[0],false,d);assert.equal((await svc.getDayPlan()).workload!.learning,2);
  s=await svc.startGoalFeed('all','choice','daily',{endless:true});mock.timers.setTime(at+120000);const resumed=(await createTrainerService(d).getResumableSession({endless:true}))!;assert.equal(resumed.id,s.id);assert.deepEqual((await d.appMeta.get(LIFECYCLE_KEY))!.value,ledger);assert.equal((await svc.getDayPlan()).workload!.new,1);
 });}finally{mock.timers.reset();}
});
test('home and feed use the same object/property projection before and after introduction',()=>run(async(d,svc)=>{
 let home=await svc.getGoalSnapshot(true),plan=await svc.getDayPlan('all','choice');assert.deepEqual(home.dayPlan!.workload,plan.workload);assert.equal(plan.workload!.new,1);
 const s=await svc.startGoalFeed('all','choice','daily',{endless:true});await svc.completeIntro(s.id);home=await svc.getGoalSnapshot(true);plan=await svc.getDayPlan('all','choice');assert.deepEqual(home.dayPlan!.workload,plan.workload);
}));
test('migration admits only previously introduced properties, not the whole known object',()=>run(async(d)=>{
 const catalog=buildGoalCatalog(await getBundle(d),[]),entry=catalog.find(e=>e.goal.skill==='recognition')!;
 await d.appMeta.put({key:'introducedEntities',value:entry.entityIds});
 await d.appMeta.put({key:'studyCore:memory:'+entry.goal.id,value:{goalId:entry.goal.id,goal:entry.goal,card:createEmptyCard(),independentAttempts:1,independentSuccesses:1}});
 const ledger=await ensureLifecycle(d,catalog);assert.equal(ledger.units.length,1);assert.equal(ledger.units[0].goal.id,entry.goal.id);
}));
test('repeat and errors count properties, deduplicating skills without collapsing the owning object',()=>run(async(d,svc)=>{
 const entries=buildGoalCatalog(await getBundle(d),[]).filter(e=>e.entityIds.includes('s0'));
 assert(entries.some(e=>e.goal.skill==='recall'));assert(entries.some(e=>e.goal.skill==='recognition'));
 for(const e of entries)await d.appMeta.put({key:'studyCore:memory:'+e.goal.id,value:{goalId:e.goal.id,goal:e.goal,lastCorrect:e.propertyId!=='author',card:{...createEmptyCard(),state:2,reps:1,last_review:new Date(Date.now()-86400000),due:new Date(Date.now()-1000)},independentAttempts:1,independentSuccesses:1}});
 await svc.getGoalSnapshot(true);const plan=await svc.getDayPlan();assert.equal(plan.workload!.repeat,2);assert.equal(plan.workload!.learning,0);assert.equal(plan.workload!.mistakes,1);
}));
test('changing enabled formats keeps unfinished acquisition and permits the new skill to complete it',async()=>{
 const at=new Date(2026,9,8,10).getTime();mock.timers.enable({apis:['Date'],now:at});
 try{await run(async(d,svc)=>{
  let s=await svc.startGoalFeed('all','choice','daily',{endless:true});s=await svc.completeIntro(s.id);
  const before=(await d.appMeta.get(LIFECYCLE_KEY))!.value;
  for(const p of (await getBundle(d)).properties!)await saveKnowledge({properties:[{...p,learning:{choice:'off',match:'off',categorize:'off',recallReveal:'on'}}]},d);
  s=await svc.startGoalFeed('all','recall_reveal','daily',{endless:true});
  const after=(await d.appMeta.get(LIFECYCLE_KEY))!.value;assert.equal(after.units.length,before.units.length);assert(after.units.every((u:any)=>u.goal.skill==='recall'));assert.equal((await svc.getDayPlan()).workload!.learning,2);
  mock.timers.setTime(at+15000);if(s.intro)s=await svc.completeIntro(s.id);const q=s.tasks[0];assert.equal(q.recipe.format,'recall_reveal');await svc.saveInteraction(s.id,q.id,{revealed:true,recallElapsedMs:5000});await svc.answer({sessionId:s.id,taskId:q.id,answer:true});assert.equal((await d.appMeta.get('studyCore:attempt:'+q.id))!.value.results[0].acquisitionCredit,true);
 });}finally{mock.timers.reset();}
});
test('editing an introduced property admits the new revision without spending a second object',()=>run(async(d,svc)=>{
 const s=await svc.startGoalFeed('all','choice','daily',{endless:true});await svc.completeIntro(s.id);
 const before=(await d.appMeta.get(LIFECYCLE_KEY))!.value,owner=before.cards[0].entityId,b=await getBundle(d),fact=b.facts.find(f=>f.entityId===owner)!;
 await saveKnowledge({facts:[{...fact,valueEntityId:fact.valueEntityId==='a5'?'a4':'a5'}]},d);
 const revised=await svc.startGoalFeed('all','choice','daily',{endless:true});assert.equal(revised.intro?.entityId,owner);const after=(await d.appMeta.get(LIFECYCLE_KEY))!.value;
 const entry=buildGoalCatalog(await getBundle(d),(await d.learningState.toArray()).map(r=>r.payload)).find(e=>e.goal.knowledge.key===fact.id&&e.goal.skill==='recognition')!;
 assert(after.units.some((u:any)=>u.goal.id===entry.goal.id&&u.stage!=='completed'));assert.equal(after.cards.filter((c:any)=>c.entityId===owner).length,1);
}));
test('a narrow waiting queue parks a protected question rather than showing its answer in filler',async()=>{
 const at=new Date(2026,9,8,10).getTime();mock.timers.enable({apis:['Date'],now:at});
 try{await run(async(d,svc)=>{
  let s=await svc.startGoalFeed('all','choice','daily',{endless:true});s=await svc.completeIntro(s.id);s=await svc.completeIntro(s.id);s=await svc.completeIntro(s.id);
  const q=s.tasks[0];assert(q);assert.equal(q.intent,'learn');assert(q.readyAt);assert.equal(q.reason,'bootstrap');
  mock.timers.setTime(at+11000);await svc.answer({sessionId:s.id,taskId:q.id,answer:q.items[0].answerId});
  const attempt=(await d.appMeta.get('studyCore:attempt:'+q.id))!.value;assert.equal(attempt.results[0].acquisitionCredit,true);
 });}finally{mock.timers.reset();}
});
test('a recall-only introduction trains the chosen skill and normal reveal permits labeled acquisition evidence',async()=>{
 const at=new Date(2026,9,8,10).getTime();mock.timers.enable({apis:['Date'],now:at});
 try{await run(async(d,svc)=>{
  let s=await svc.startGoalFeed('all','recall_reveal','daily',{endless:true});s=await svc.completeIntro(s.id);
  const ledger=(await d.appMeta.get(LIFECYCLE_KEY))!.value;assert(ledger.units.every((u:any)=>u.goal.skill==='recall'));
  mock.timers.setTime(at+15000);if(s.intro)s=await svc.completeIntro(s.id);const q=s.tasks[0];assert.equal(q.recipe.format,'recall_reveal');
  await svc.observeVisibility(s.id,q.id,'question','recall-question','start');await svc.saveInteraction(s.id,q.id,{revealed:true,recallElapsedMs:5000});await svc.observeVisibility(s.id,q.id,'answer-reveal','recall-answer','start');
  await svc.answer({sessionId:s.id,taskId:q.id,answer:true});const attempt=(await d.appMeta.get('studyCore:attempt:'+q.id))!.value;assert.equal(attempt.results[0].acquisitionCredit,true);assert.equal(attempt.results[0].selfReported,true);
 });}finally{mock.timers.reset();}
});
test('a ten-object daily plan spends exactly ten introductions despite twenty properties and two extra objects',async()=>{
 const at=new Date(2026,9,8,10).getTime();mock.timers.enable({apis:['Date'],now:at});
 try{await run(async(d,svc)=>{
  await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:10}});let s=await svc.startGoalFeed('all','choice','daily',{endless:true});
  for(let n=0;n<90;n++){
   mock.timers.setTime(at+(n+1)*15000);if(s.intro){s=await svc.completeIntro(s.id);continue;}
   const q=s.tasks[0];assert(q);if(q.recipe.format==='recall_reveal')await svc.saveInteraction(s.id,q.id,{revealed:true,recallElapsedMs:5000});await svc.answer({sessionId:s.id,taskId:q.id,answer:q.recipe.format==='recall_reveal'?true:q.items[0].answerId});s=await svc.advanceFeed(s.id,false,q.id);
  }
  const ledger=(await d.appMeta.get(LIFECYCLE_KEY))!.value,plan=await svc.getDayPlan();assert.equal(ledger.cards.filter((c:any)=>c.source==='daily').length,10);assert.equal(ledger.cards.filter((c:any)=>c.source==='extra').length,2);assert.equal(plan.newGoalIds.length,10);assert.equal(plan.newBudget,10);assert.equal(plan.workload!.learning,0);assert.equal(ledger.units.length,24);assert(ledger.units.every((u:any)=>u.stage==='completed'));
 },fixture(12));}finally{mock.timers.reset();}
});
test('three virtual days finish all admitted properties, bound active objects and preserve memory during games',async()=>{
 const at=new Date(2026,9,8,10).getTime();mock.timers.enable({apis:['Date'],now:at});
 try{await run(async(d,svc)=>{
  await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:3}});startStudyTrace(d,1000);
  let s=await svc.startGoalFeed('all','choice','daily',{endless:true}),previousTime=at,checks=0,games=0;
  const summaries=[];
  for(let day=0;day<3;day++){
   for(let n=0;n<60;n++){
    mock.timers.setTime(at+day*86400000+(n+1)*15000);
    if(s.intro){s=await svc.completeIntro(s.id);continue;}
    const q=s.tasks[0];assert(q,`empty on day ${day}, screen ${n}`);const before=await d.appMeta.where('key').startsWith('studyCore:memory:').toArray();
    if(q.recipe.format==='recall_reveal')await svc.saveInteraction(s.id,q.id,{revealed:true,recallElapsedMs:5000});
    if(q.items.length>1&&['match','categorize'].includes(q.recipe.format)){for(const item of q.items)await svc.answerMatchPair({sessionId:s.id,taskId:q.id,entityId:item.entityId,answerId:item.answerId,requestId:crypto.randomUUID()});}
    else await svc.answer({sessionId:s.id,taskId:q.id,answer:q.recipe.format==='recall_reveal'?true:q.items[0].answerId});
    if(q.intent==='practice'){games++;assert.deepEqual(await d.appMeta.where('key').startsWith('studyCore:memory:').toArray(),before);}else checks++;
    if(n%9===0){const resumed=(await createTrainerService(d).getResumableSession({endless:true}))!;assert.equal(resumed.tasks[0].id,q.id);}
    s=await svc.advanceFeed(s.id,false,q.id);const ledger=(await d.appMeta.get(LIFECYCLE_KEY))!.value;
    assert(new Set(ledger.units.filter((u:any)=>u.stage!=='completed').map((u:any)=>u.entityId)).size<=3);
    previousTime=Date.now();
   }
   const ledger=(await d.appMeta.get(LIFECYCLE_KEY))!.value,plan=await svc.getDayPlan();assert.equal(plan.workload!.learning,0);assert.equal(plan.workload!.mistakes,0);assert.equal(ledger.cards.length,6);
   summaries.push({day,at:previousTime,cards:ledger.cards.length,completedProperties:ledger.units.filter((u:any)=>u.stage==='completed').length,workload:plan.workload});
  }
  assert(checks>=24);assert(games>30);writeFileSync(new URL('../artifacts/learning-lifecycle-simulation.json',import.meta.url),JSON.stringify({summaries,checks,games,trace:studyTraceReport(d)},null,2));
 });}finally{mock.timers.reset();}
});
