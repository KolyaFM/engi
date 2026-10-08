import 'fake-indexeddb/auto';
import {test,mock} from 'node:test';
import assert from 'node:assert/strict';
import {createEmptyCard,State} from 'ts-fsrs';
import {EngiDB} from '../src/db/engi-db';
import {putBundle} from '../src/db/repositories';
import {prepareDue} from './helpers22';
import {createTrainerService} from '../src/services/trainer-service';
import {associationGoal} from '../src/lib/engi/study-core/compiler';
import type {Bundle} from '../src/lib/engi/types';
function fixture():Bundle{
 const b:Bundle={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[],entityTypes:[{id:'s',name:'Объект'},{id:'a',name:'Автор'}],properties:[{id:'author',name:'Автор',valueKind:'entity',cardinality:'one',learnable:true,subjectTypes:['s'],targetTypes:['a']}]};
 for(let n=0;n<8;n++){b.entities.push({id:'s'+n,name:'Объект '+n,type:'s',aliases:[],externalIds:{}},{id:'a'+n,name:'Автор '+n,type:'a',aliases:[],externalIds:{}});b.facts.push({id:'f'+n,entityId:'s'+n,key:'author',valueKind:'entity',valueEntityId:'a'+n,verification:'user_confirmed',source:{kind:'manual',name:'Тест'}});}return b;
}
async function run(action:(d:EngiDB,svc:ReturnType<typeof createTrainerService>,b:Bundle)=>Promise<void>){const d=new EngiDB('endless-'+crypto.randomUUID()),b=fixture();try{await putBundle(d,b);await prepareDue(d);await action(d,createTrainerService(d),b);}finally{d.close();await d.delete();}}
async function future(d:EngiDB,b:Bundle){for(const f of b.facts){const goal=associationGoal(b,f,'recognition');await d.appMeta.put({key:'studyCore:memory:'+goal.id,value:{goalId:goal.id,goal,lastCorrect:true,independentAttempts:1,independentSuccesses:1,card:{...createEmptyCard(),state:State.Review,stability:10,difficulty:5,last_review:new Date(Date.now()-86400000),due:new Date(Date.now()+86400000)}}});}}
test('endless play fills an empty schedule, survives restarts and preserves every FSRS field',()=>run(async(d,svc,b)=>{
 await future(d,b);await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:0}});
 const before=await d.appMeta.where('key').startsWith('studyCore:memory:').toArray();let s=await svc.startGoalFeed('all','choice','daily',{endless:true,lifecycle:false});const objects=new Set<string>();
 for(let n=0;n<24;n++){assert(!s.exhausted);const q=s.tasks[0];assert.equal(q.intent,'practice');objects.add(q.items[0].entityId);await svc.answer({sessionId:s.id,taskId:q.id,answer:q.items[0].answerId});
  if(n%5===0){const restored=await createTrainerService(d).getResumableSession();assert.equal(restored!.tasks[0].id,q.id);}
  s=await svc.advanceFeed(s.id,false,q.id);
 }
 assert(objects.size>=3);assert.deepEqual(await d.appMeta.where('key').startsWith('studyCore:memory:').toArray(),before);assert.equal((await svc.getDayPlan()).newGoalIds.length,0);
}));
test('wrong first game answer creates one repair episode without FSRS credit; same-card correction keeps it open',()=>run(async(d,svc,b)=>{
 await future(d,b);await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:0}});const before=await d.appMeta.where('key').startsWith('studyCore:memory:').toArray();
 const s=await svc.startGoalFeed('all','choice','daily',{endless:true,lifecycle:false}),q=s.tasks[0];assert(q);await svc.answer({sessionId:s.id,taskId:q.id,answer:q.options.find(o=>o.id!==q.items[0].answerId)!.id});await svc.answer({sessionId:s.id,taskId:q.id,answer:q.items[0].answerId});
 assert.equal((await svc.getDayPlan()).mistakes!.length,1);assert.deepEqual(await d.appMeta.where('key').startsWith('studyCore:memory:').toArray(),before);
 const next=await svc.advanceFeed(s.id,false,q.id),repair=next.tasks[0];assert.equal(repair.intent,'repair');if(repair.recipe.format==='recall_reveal')await svc.saveInteraction(next.id,repair.id,{revealed:true,recallElapsedMs:5000});
 await svc.answer({sessionId:next.id,taskId:repair.id,answer:repair.recipe.format==='recall_reveal'?true:repair.items[0].answerId});assert.equal((await svc.getDayPlan()).mistakes!.length,0);
}));
test('an upcoming independent review is protected from filler and returns on time',async()=>{
 const at=new Date(2026,9,8,10).getTime();mock.timers.enable({apis:['Date'],now:at});try{await run(async(d,svc,b)=>{
  await future(d,b);await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:0}});const g=associationGoal(b,b.facts[0],'recognition'),row=(await d.appMeta.get('studyCore:memory:'+g.id))!;row.value.card.due=new Date(at+30000);await d.appMeta.put(row);
  let s=await svc.startGoalFeed('all','choice','daily',{endless:true,lifecycle:false});
  for(let n=0;n<6;n++){const q=s.tasks[0];assert(q);assert(q.items.every(i=>i.factId!=='f0'));await svc.observeVisibility(s.id,q.id,'question',q.id+':q','start');await svc.answer({sessionId:s.id,taskId:q.id,answer:q.items[0].answerId});await svc.observeVisibility(s.id,q.id,'feedback',q.id+':f','start');mock.timers.setTime(at+(n+1)*5000);s=await svc.advanceFeed(s.id,false,q.id);}
  assert.equal(s.tasks[0].intent,'learn');assert.equal(s.tasks[0].items[0].factId,'f0');
 });}finally{mock.timers.reset();}
});
test('endless admission grants one additional goal rather than another daily-sized batch',()=>run(async(d,svc,b)=>{
 await future(d,b);await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:1}});
 for(const f of b.facts.slice(6))await d.appMeta.delete('studyCore:memory:'+associationGoal(b,f,'recognition').id);
 await d.appMeta.put({key:'newLearning',value:{day:(await svc.getDayPlan()).day,introducedEntityIds:[],extraBudget:0}});
 let s=await svc.startGoalFeed('all','choice','daily',{endless:true,lifecycle:false});const q=s.tasks[0];await svc.answer({sessionId:s.id,taskId:q.id,answer:q.items[0].answerId});
 s=await svc.advanceFeed(s.id,false,q.id);assert(!s.exhausted);assert.equal((await d.appMeta.get('newLearning'))!.value.extraBudget,1);
}));

test('unavailable new content never inflates the automatic extra budget',()=>run(async(d,svc,b)=>{
 await future(d,b);await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:1}});
 let s=await svc.startGoalFeed('all','choice','daily',{endless:true,lifecycle:false});
 for(let n=0;n<15;n++){const q=s.tasks[0];assert(q);await svc.answer({sessionId:s.id,taskId:q.id,answer:q.items[0].answerId});s=await svc.advanceFeed(s.id,false,q.id);}
 assert.equal((await d.appMeta.get('newLearning'))?.value.extraBudget??0,0);
}));

test('three successful first checks waiting for FSRS do not block the next new goal',()=>run(async(d,svc,b)=>{
 await future(d,b);await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:1}});
 for(const f of b.facts.slice(0,3)){const key='studyCore:memory:'+associationGoal(b,f,'recognition').id,row=(await d.appMeta.get(key))!;row.value.card.state=State.Learning;await d.appMeta.put(row);}
 await d.appMeta.delete('studyCore:memory:'+associationGoal(b,b.facts[6],'recognition').id);
 const s=await svc.startGoalFeed('all','choice','daily',{endless:true,lifecycle:false});assert.equal(s.tasks[0].intent,'learn');assert.equal(s.tasks[0].items[0].factId,'f6');
}));

test('unresolved initial failures hold admission; a fresh repair releases it without rescheduling FSRS',()=>run(async(d,svc,b)=>{
 await future(d,b);await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:1}});
 for(const f of b.facts.slice(0,3)){const key='studyCore:memory:'+associationGoal(b,f,'recognition').id,row=(await d.appMeta.get(key))!;Object.assign(row.value,{lastCorrect:false,independentSuccesses:0});row.value.card.state=State.Learning;await d.appMeta.put(row);}
 await d.appMeta.delete('studyCore:memory:'+associationGoal(b,b.facts[6],'recognition').id);
 const s=await svc.startGoalFeed('all','choice','daily',{endless:true,lifecycle:false}),q=s.tasks[0];assert.equal(q.intent,'repair');assert.equal((await svc.getDayPlan()).admissionGoalIds?.length,3);
 const before=await d.appMeta.where('key').startsWith('studyCore:memory:').toArray();
 if(q.recipe.format==='recall_reveal')await svc.saveInteraction(s.id,q.id,{revealed:true,recallElapsedMs:5000});
 await svc.answer({sessionId:s.id,taskId:q.id,answer:q.recipe.format==='recall_reveal'?true:q.items[0].answerId});
 assert.equal((await svc.getDayPlan()).admissionGoalIds?.length,2);assert.deepEqual(await d.appMeta.where('key').startsWith('studyCore:memory:').toArray(),before);
}));

test('midnight resume preserves the admitted endless task and its interaction',async()=>{
 const at=new Date(2026,9,8,23,59).getTime();mock.timers.enable({apis:['Date'],now:at});
 try{await run(async(d,svc,b)=>{
  await future(d,b);await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:1}});
  const key='studyCore:memory:'+associationGoal(b,b.facts[0],'recognition').id,row=(await d.appMeta.get(key))!;row.value.card.state=State.Learning;await d.appMeta.put(row);
  await d.appMeta.delete('studyCore:memory:'+associationGoal(b,b.facts[6],'recognition').id);
  const s=await svc.startGoalFeed('all','choice','daily',{endless:true,lifecycle:false}),q=s.tasks[0];assert.equal(q.intent,'learn');
  const draft=await svc.saveInteraction(s.id,q.id,{recallElapsedMs:123});mock.timers.setTime(at+120000);
  const resumed=(await svc.getResumableSession({endless:true,lifecycle:false}))!;assert.equal(resumed.tasks[0].id,q.id);assert.deepEqual(resumed.interaction,draft);
  mock.timers.setTime(at+86400000+120000); // Answer through another rollover without resuming.
  await svc.answer({sessionId:s.id,taskId:q.id,answer:q.items[0].answerId});
 });}finally{mock.timers.reset();}
});

test('starting a bounded session restores its original admission capacity',()=>run(async(d,svc,b)=>{
 await future(d,b);await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:5}});
 await svc.startGoalFeed('all','choice','daily',{endless:true,lifecycle:false});assert.equal((await svc.getDayPlan()).learningLimit,3);
 await svc.startGoalFeed('all','choice');assert.equal((await svc.getDayPlan()).learningLimit,undefined);
}));

test('converting a saved bounded session preserves its pending task under the new admission rules',()=>run(async(d,svc,b)=>{
 await future(d,b);await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:5}});
 for(const f of b.facts.slice(0,3)){const key='studyCore:memory:'+associationGoal(b,f,'recognition').id,row=(await d.appMeta.get(key))!;row.value.card.state=State.Learning;await d.appMeta.put(row);}
 await d.appMeta.delete('studyCore:memory:'+associationGoal(b,b.facts[6],'recognition').id);
 const s=await svc.startGoalFeed('all','choice'),q=s.tasks[0];assert.equal(q.intent,'learn');const draft=await svc.saveInteraction(s.id,q.id,{recallElapsedMs:123});
 const resumed=(await svc.getResumableSession({endless:true,lifecycle:false}))!;assert.equal(resumed.tasks[0].id,q.id);assert.deepEqual(resumed.interaction,draft);
}));

test('known knowledge remains playable in another format without admitting or crediting its new skill',()=>run(async(d,svc,b)=>{
 await future(d,b);await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:0}});
 const before=await d.appMeta.where('key').startsWith('studyCore:memory:').toArray();
 const s=await svc.startGoalFeed('all','recall_reveal','daily',{endless:true,lifecycle:false}),q=s.tasks[0];assert(q);assert.equal(q.intent,'practice');assert.equal(q.recipe.format,'recall_reveal');
 await svc.saveInteraction(s.id,q.id,{revealed:true,recallElapsedMs:5000});await svc.answer({sessionId:s.id,taskId:q.id,answer:true});
 assert.deepEqual(await d.appMeta.where('key').startsWith('studyCore:memory:').toArray(),before);assert.equal((await svc.getDayPlan()).newGoalIds.length,0);
}));

test('seven virtual days of continuous play preserve practice memory, repair errors and bound initial learning',async()=>{
 const at=new Date(2026,9,8,10).getTime();mock.timers.enable({apis:['Date'],now:at});
 try{await run(async(d,svc,b)=>{
  await future(d,b);await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:1}});
  for(const f of b.facts.slice(6))await d.appMeta.delete('studyCore:memory:'+associationGoal(b,f,'recognition').id);
  let s=await svc.startGoalFeed('all','choice','daily',{endless:true,lifecycle:false}),games=0,repairs=0,checks=0;
  for(let day=0;day<7;day++)for(let n=0;n<24;n++){
   mock.timers.setTime(at+day*86400000+n*5000);
   const q=s.tasks[0];assert(q,`empty feed on day ${day}, screen ${n}`);
   const before=await d.appMeta.where('key').startsWith('studyCore:memory:').toArray();
   if(q.recipe.format==='recall_reveal')await svc.saveInteraction(s.id,q.id,{revealed:true,recallElapsedMs:5000});
   const wrong=q.intent==='practice'&&n%13===0&&q.recipe.format==='choice';
   await svc.answer({sessionId:s.id,taskId:q.id,answer:q.recipe.format==='recall_reveal'?true:wrong?q.options.find(o=>o.id!==q.items[0].answerId)!.id:q.items[0].answerId});
   if(wrong)await svc.answer({sessionId:s.id,taskId:q.id,answer:q.items[0].answerId});
   if(q.intent==='practice'){games++;assert.deepEqual(await d.appMeta.where('key').startsWith('studyCore:memory:').toArray(),before);}
   if(q.intent==='repair')repairs++;if(q.intent==='learn')checks++;
   if(n%8===0){const resumed=await createTrainerService(d).getResumableSession({endless:true,lifecycle:false});assert.equal(resumed!.tasks[0].id,q.id);}
   s=await svc.advanceFeed(s.id,false,q.id);
   const plan=await svc.getDayPlan();assert((plan.admissionGoalIds?.length??0)<=3);assert.equal(plan.learningLimit,3);
  }
  assert(games>50);assert(repairs>0);assert(checks>0);
  for(let n=0;n<12&&(await svc.getDayPlan()).mistakes!.length;n++){
   const q=s.tasks[0];assert(q);if(q.recipe.format==='recall_reveal')await svc.saveInteraction(s.id,q.id,{revealed:true,recallElapsedMs:5000});
   await svc.answer({sessionId:s.id,taskId:q.id,answer:q.recipe.format==='recall_reveal'?true:q.items[0].answerId});s=await svc.advanceFeed(s.id,false,q.id);
  }
  assert.equal((await svc.getDayPlan()).mistakes!.length,0);
 });}finally{mock.timers.reset();}
});
