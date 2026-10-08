import 'fake-indexeddb/auto';
import {test,mock} from 'node:test';
import assert from 'node:assert/strict';
import {EngiDB} from '../src/db/engi-db';
import {putBundle,learningRow} from '../src/db/repositories';
import {prepareDue} from './helpers22';
import {createTrainerService} from '../src/services/trainer-service';
import {associationGoal,completeSetGoal} from '../src/lib/engi/study-core/compiler';
import {goalCandidates} from '../src/services/goal-feed';
import {createEmptyCard,State} from 'ts-fsrs';
import type {Bundle} from '../src/lib/engi/types';
import {composeUnit,compositionContext} from '../src/lib/engi/session/composer';
import {compileTaskContract} from '../src/lib/engi/study-core/compiler';
import {interactionFamily} from '../src/lib/engi/session/interaction-family';
import {buildGoalCatalog,buildGoalCatalogUncached} from '../src/services/goal-catalog';
function fixture(many=false):Bundle{
 const b:Bundle={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[],entityTypes:[{id:'subject',name:'Объект'},{id:'answer',name:'Ответ'}],properties:[{id:'rel',name:'Автор',valueKind:'entity',cardinality:many?'many':'one',learnable:true,subjectTypes:['subject'],targetTypes:['answer']}]};
 for(let n=0;n<8;n++){b.entities.push({id:'s'+n,type:'subject',name:'Объект '+n,aliases:[],externalIds:{}},{id:'a'+n,type:'answer',name:'Автор '+n,aliases:[],externalIds:{}});b.facts.push({id:'f'+n,entityId:'s'+n,key:'rel',valueKind:'entity',valueEntityId:'a'+n,completeSet:true,verification:'user_confirmed',source:{kind:'manual',name:'Личное знание'}});}
 if(many)b.facts.push({...b.facts[0],id:'extra',valueEntityId:'a1'});return b;
}
test('catalog cache detects in-place content and suspension edits and cannot be poisoned by consumers',()=>run(async(d,_svc,b)=>{
 const enabled=(await d.learningState.toArray()).map(r=>r.payload);
 const normalize=(entries:ReturnType<typeof buildGoalCatalog>)=>entries.sort((a,b)=>a.goal.id.localeCompare(b.goal.id));
 const initial=buildGoalCatalog(b,enabled);assert.deepEqual(normalize(initial),normalize(buildGoalCatalogUncached(b,enabled)));
 initial.splice(0);assert(buildGoalCatalog(b,enabled).length>0);
 b.facts[0].valueEntityId='a2';assert.deepEqual(normalize(buildGoalCatalog(b,enabled)),normalize(buildGoalCatalogUncached(b,enabled)));
 enabled[0].status='suspended';assert.deepEqual(normalize(buildGoalCatalog(b,enabled)),normalize(buildGoalCatalogUncached(b,enabled)));
 b.properties![0].learnable=false;assert.deepEqual(normalize(buildGoalCatalog(b,enabled)),normalize(buildGoalCatalogUncached(b,enabled)));
}));
test('pruning generator targets keeps complete-set membership and unrelated distractors',()=>run(async(d,_svc,b)=>{
 const enabled=(await d.learningState.toArray()).map(r=>r.payload);
 const complete=goalCandidates(b,enabled,'all','multi_choice').find(t=>t.items[0].entityId==='s0')!;
 const filtered=goalCandidates(b,enabled,'all','multi_choice',[],new Set([complete.items[0].targetId]));
 assert.equal(filtered.length,1);assert.deepEqual(filtered[0].studyContract!.primaryGoals,complete.studyContract!.primaryGoals);
 assert.deepEqual(filtered[0].answerSet,complete.answerSet);assert.equal(filtered[0].items.length,2);assert(filtered[0].options.some(o=>!filtered[0].answerSet!.includes(o.id)));
 const suspended=enabled.map(m=>m.id==='ku:fact:extra:forward'?{...m,status:'suspended' as const}:m);
 assert.equal(goalCandidates(b,suspended,'all','multi_choice',[],new Set([complete.items[0].targetId])).length,0);
},true));
async function run(fn:(d:EngiDB,svc:ReturnType<typeof createTrainerService>,b:Bundle)=>Promise<void>,many=false){const d=new EngiDB('goal-feed-'+crypto.randomUUID()),b=fixture(many);try{await putBundle(d,b);await prepareDue(d);await fn(d,createTrainerService(d),b);}finally{d.close();await d.delete();}}
async function holdOtherRecognition(d:EngiDB,b:Bundle){
 for(const f of b.facts.slice(1)){const g=associationGoal(b,f,'recognition');await d.appMeta.put({key:'studyCore:memory:'+g.id,value:{goalId:g.id,card:{...createEmptyCard(),state:State.Review,due:new Date(Date.now()+2*86400000)},independentAttempts:1,independentSuccesses:1}});}
}
test('repair continues before the deadline and closes errors without changing memory or new budget',()=>run(async(d,svc,b)=>{
 await holdOtherRecognition(d,b);
 const s=await svc.startGoalFeed('all','choice'),t=s.tasks[0],wrong=t.options.find(o=>o.id!==t.items[0].answerId)!;
 await svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id});await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});
 const before=await d.appMeta.where('key').startsWith('studyCore:memory:').toArray(),plan=await svc.getDayPlan();
 const next=await svc.advanceFeed(s.id,false,t.id);assert.equal(next.exhausted,false);assert.equal(next.tasks[0].intent,'repair');
 const repair=next.tasks[0];assert.equal(repair.items[0].factId,t.items[0].factId);
 if(repair.recipe.format==='recall_reveal')await svc.saveInteraction(next.id,repair.id,{recallElapsedMs:5000,revealed:true});
 const result=await svc.answer({sessionId:next.id,taskId:repair.id,answer:repair.recipe.format==='recall_reveal'?true:repair.items[0].answerId});
 assert.equal(result.feedback!.mistakeResolved,1);assert.equal((await svc.getDayPlan()).mistakes!.length,0);
 assert.deepEqual(await d.appMeta.where('key').startsWith('studyCore:memory:').toArray(),before);
 assert.deepEqual((await svc.getDayPlan()).newGoalIds,plan.newGoalIds);
}));
test('repair hints and a corrected first failure keep the error open for a fresh task',()=>run(async(d,svc,b)=>{
 await holdOtherRecognition(d,b);
 const s=await svc.startGoalFeed('all','choice'),t=s.tasks[0];
 await svc.answer({sessionId:s.id,taskId:t.id,answer:t.options.find(o=>o.id!==t.items[0].answerId)!.id});
 await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});
 const next=await svc.advanceFeed(s.id,false,t.id),q=next.tasks[0];assert.equal(q.intent,'repair');
 await svc.observeVisibility(next.id,q.id,'source','repair-source','start');
 if(q.recipe.format==='recall_reveal')await svc.saveInteraction(next.id,q.id,{recallElapsedMs:5000,revealed:true});
 await svc.answer({sessionId:next.id,taskId:q.id,answer:q.recipe.format==='recall_reveal'?true:q.items[0].answerId});
 assert.equal((await svc.getDayPlan()).mistakes!.length,1);
 const again=await svc.advanceFeed(next.id,false,q.id);assert.equal(again.tasks[0].intent,'repair');assert.notEqual(again.tasks[0].id,q.id);
 const restored=await createTrainerService(d).getResumableSession();assert.equal(restored!.tasks[0].id,again.tasks[0].id);
}));
test('three saved mistakes drain with no time gate, including a final sole mistake',()=>run(async(d,svc,b)=>{
 for(const [n,f] of b.facts.entries()){
  const goal=associationGoal(b,f,'recognition'),at=new Date(Date.now()-1000);
  await d.appMeta.put({key:'studyCore:memory:'+goal.id,value:{goalId:goal.id,goal,lastCorrect:n>=3,independentAttempts:1,independentSuccesses:Number(n>=3),card:{...createEmptyCard(at),state:State.Review,due:new Date(Date.now()+86400000),last_review:at}}});
 }
 let s=await svc.startGoalFeed('all','choice');assert.equal((await svc.getDayPlan()).mistakes!.length,3);
 const seen=new Set<string>();
 for(let remaining=3;remaining>0;remaining--){
  assert.equal(s.exhausted,false);const q=s.tasks[0];assert.equal(q.intent,'repair');seen.add(q.items[0].factId!);
  if(q.recipe.format==='recall_reveal')await svc.saveInteraction(s.id,q.id,{recallElapsedMs:5000,revealed:true});
  await svc.answer({sessionId:s.id,taskId:q.id,answer:q.recipe.format==='recall_reveal'?true:q.items[0].answerId});
  assert.equal((await svc.getDayPlan()).mistakes!.length,remaining-1);
  s=await svc.advanceFeed(s.id,false,q.id);
 }
 assert.equal(seen.size,3);assert.equal(s.exhausted,true);
}));

async function seedFutureMistakes(d:EngiDB,b:Bundle,count:number){
 for(const [n,f] of b.facts.entries()){
  const goal=associationGoal(b,f,'recognition'),at=new Date(Date.now()-1000);
  await d.appMeta.put({key:'studyCore:memory:'+goal.id,value:{goalId:goal.id,goal,lastCorrect:n>=count,independentAttempts:1,independentSuccesses:Number(n>=count),card:{...createEmptyCard(at),state:State.Review,due:new Date(Date.now()+86400000),last_review:at}}});
 }
}
test('daily preference controls admission immediately, preserves completed cards and resets next day',()=>run(async(d,svc,b)=>{
 await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:7}});
 assert.equal((await svc.getDayPlan()).newBudget,7);
 const s=await svc.startGoalFeed('all','choice'),q=s.tasks[0];await svc.answer({sessionId:s.id,taskId:q.id,answer:q.items[0].answerId});
 const before=(await svc.getDayPlan()).newGoalIds;
 await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:0}});
 const plan=await svc.getDayPlan('all','choice');assert.deepEqual(plan.newGoalIds,before);assert.equal(plan.available!.new,0);
 const {ensureDayPlan}=await import('../src/services/day-plan-service'),catalog=buildGoalCatalog(b,(await d.learningState.toArray()).map(r=>r.payload)),memories=(await d.appMeta.where('key').startsWith('studyCore:memory:').toArray()).map(r=>r.value);
 const tomorrow=await ensureDayPlan(d,catalog,memories,new Date(Date.now()+86400000));assert.equal(tomorrow.newBudget,0);assert.equal(tomorrow.newTarget,0);
}));
test('zero daily preference keeps repairs available; explicit extra goals add to the selected limit',()=>run(async(d,svc,b)=>{
 await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:0}});await seedFutureMistakes(d,b,1);
 const s=await svc.startGoalFeed('all','choice');assert.equal(s.tasks[0].intent,'repair');assert.equal((await svc.getDayPlan()).newBudget,0);
 await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:5}});await d.appMeta.put({key:'newLearning',value:{day:(await svc.getDayPlan()).day,introducedEntityIds:[],extraBudget:2}});
 assert.equal((await svc.getDayPlan()).newBudget,7);
}));
test('extra admission adds the configured daily batch each time and refuses a zero limit',()=>run(async(d,svc,b)=>{
 await seedFutureMistakes(d,b,0);await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:10}});
 let s=await svc.startGoalFeed('all','choice');assert(s.exhausted);
 s=await svc.openMore(s.id);assert.equal((await svc.getDayPlan()).newBudget,20);assert.equal((await d.appMeta.get('newLearning'))!.value.extraBudget,10);
 assert(s.exhausted);await svc.openMore(s.id);assert.equal((await svc.getDayPlan()).newBudget,30);
 await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:0}});
 await assert.rejects(svc.openMore(s.id),/дневной лимит/);assert.equal((await d.appMeta.get('newLearning'))!.value.extraBudget,20);
}));
test('first intro enters the live queue after ten seconds without shortening later feedback intervals',async()=>{
 const at=new Date(2026,9,8,10).getTime();mock.timers.enable({apis:['Date'],now:at});
 try{await run(async(d,svc)=>{
  const {resetLearningProgress}=await import('../src/services/learning-service');await resetLearningProgress(d);await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:1}});
  const first=await svc.startGoalFeed('all','choice');assert(first.intro);await svc.observeIntroVisibility(first.id,'new-intro','start');
  let s=await svc.completeIntro(first.id);await svc.observeIntroVisibility(first.id,'new-intro','end');assert(s.exhausted);assert.equal(s.waitingUntil,new Date(at+10000).toISOString());
  mock.timers.setTime(at+9999);assert.equal((await svc.getDayPlan('all','choice')).available!.new,0);
  mock.timers.setTime(at+10000);s=await svc.refreshGoalFeed(s.id);assert(!s.exhausted);const q=s.tasks[0];assert.equal(q.items[0].entityId,first.intro.entityId);
  const blocked=(await d.appMeta.get('studyCore:attempt:'+q.id))!.value.ineligibleGoalIds;assert(q.studyContract!.primaryGoals.every(g=>!blocked.includes(g.id)));
  await svc.answer({sessionId:s.id,taskId:q.id,answer:q.items[0].answerId});await svc.observeVisibility(s.id,q.id,'feedback','ordinary-feedback','start');
  const {blockedByExposure}=await import('../src/lib/engi/study-core/exposure'),exposed=(await d.appMeta.get('studyCore:exposure:'+q.studyContract!.primaryGoals[0].id))!.value;
  assert(blockedByExposure([exposed],new Date(at+40000)).length);assert.equal(blockedByExposure([exposed],new Date(at+70000)).length,0);
 });}finally{mock.timers.reset();}
});
test('a larger daily preference permits introductions beyond the old fixed three-object limit',()=>run(async(d,svc,b)=>{
 for(const row of await d.learningState.toArray())if(!['ku:fact:f0:forward','ku:fact:f1:forward','ku:fact:f2:forward'].includes(row.id))await d.learningState.delete(row.id);
 const enabled=(await d.learningState.toArray()).map(r=>r.payload);
 for(const task of goalCandidates(b,enabled))for(const goal of task.studyContract!.primaryGoals)await d.appMeta.put({key:'studyCore:memory:'+goal.id,value:{goalId:goal.id,goal,lastCorrect:true,independentAttempts:1,independentSuccesses:1,card:{...createEmptyCard(),state:State.Review,due:new Date('2099-01-01')}}});
 await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:7}});
 const {localDay}=await import('../src/lib/engi/knowledge/motivation');await d.appMeta.put({key:'newLearning',value:{day:localDay(),introducedEntityIds:['s0','s1','s2'],extraBudget:0}});await d.appMeta.put({key:'introducedEntities',value:['s0','s1','s2']});
 const s=await svc.startGoalFeed('all','choice');assert(s.intro);assert.equal(s.exhausted,false);
}));
test('lowering the daily preference retires an unanswered new task safely on resume',()=>run(async(d,svc)=>{
 const s=await svc.startGoalFeed('all','choice');assert.equal(s.tasks[0].intent,'learn');
 await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:0}});await svc.getDayPlan();
 const resumed=await svc.getResumableSession();assert.equal(resumed!.exhausted,true);assert.equal(resumed!.tasks.length,0);
 assert.equal(await d.appMeta.where('key').startsWith('studyCore:memory:').count(),0);
}));
test('header availability excludes due reinforcement while answer exposure blocks the feed',()=>run(async(d,svc,b)=>{
 await seedFutureMistakes(d,b,0);
 const goal=associationGoal(b,b.facts[0],'recognition'),key='studyCore:memory:'+goal.id,row=(await d.appMeta.get(key))!;
 row.value.card.state=State.Relearning;row.value.card.due=new Date(Date.now()-1000);await d.appMeta.put(row);
 await d.appMeta.put({key:'studyCore:exposure:'+goal.id,value:{goalId:goal.id,lastVisibleAt:new Date().toISOString(),episodeId:'recent-answer'}});
 const s=await svc.startGoalFeed('all','choice');assert.equal(s.exhausted,true);
 const plan=await svc.getDayPlan('all','choice');assert.equal(plan.reinforce.filter(r=>r.status==='pending').length,1);
 assert.deepEqual(plan.available,{repeat:0,reinforce:0,new:0});
}));
test('home snapshot and mixed feed expose identical available new counts',()=>run(async(d,svc)=>{
 const snapshot=await svc.getGoalSnapshot(),plan=await svc.getDayPlan('all','mixed');assert.deepEqual(snapshot.dayPlan!.available,plan.available);
}));
test('availability retains the next deadline even when another review is already available',()=>run(async(d,svc,b)=>{
 await seedFutureMistakes(d,b,0);const due=new Date(Date.now()+4000);
 for(const [n,f] of b.facts.slice(0,2).entries()){
  const row=(await d.appMeta.get('studyCore:memory:'+associationGoal(b,f,'recognition').id))!;
  row.value.card.state=n===0?State.Relearning:State.Review;row.value.card.due=n===0?due:new Date(Date.now()-1000);await d.appMeta.put(row);
 }
 const plan=await svc.getDayPlan('all','choice');assert.equal(plan.available!.repeat,1);assert.equal(plan.available!.reinforce,0);assert.equal(plan.nextAvailabilityAt,due.toISOString());
}));
test('header availability follows the selected format while the full plan keeps other obligations',()=>run(async(d,svc,b)=>{
 await seedFutureMistakes(d,b,0);
 for(const f of b.facts){const goal=associationGoal(b,f,'recall');await d.appMeta.put({key:'studyCore:memory:'+goal.id,value:{goalId:goal.id,goal,lastCorrect:true,independentAttempts:1,independentSuccesses:1,card:{...createEmptyCard(),state:State.Review,due:new Date(Date.now()+86400000)}}});}
 const key='studyCore:memory:'+associationGoal(b,b.facts[0],'recognition').id,row=(await d.appMeta.get(key))!;row.value.card.state=State.Relearning;row.value.card.due=new Date(Date.now()-1000);await d.appMeta.put(row);
 const s=await svc.startGoalFeed('all','recall_reveal');assert.equal(s.exhausted,true);
 const recall=await svc.getDayPlan('all','recall_reveal');assert.equal(recall.available!.reinforce,0);assert.equal(recall.reinforce.filter(r=>r.status==='pending').length,1);
 assert.equal((await svc.getDayPlan('all','choice')).available!.reinforce,1);
}));
test('header counts a ready knowledge once across presentations and removes it after answering',()=>run(async(d,svc,b)=>{
 await seedFutureMistakes(d,b,0);
 const key='studyCore:memory:'+associationGoal(b,b.facts[0],'recognition').id,row=(await d.appMeta.get(key))!;row.value.card.state=State.Relearning;row.value.card.due=new Date(Date.now()-1000);await d.appMeta.put(row);
 assert.equal((await svc.getDayPlan('all','mixed')).available!.reinforce,1);
 const s=await svc.startGoalFeed('all','choice'),q=s.tasks[0];assert.equal(q.intent,'learn');
 await svc.answer({sessionId:s.id,taskId:q.id,answer:q.items[0].answerId});assert.equal((await svc.getDayPlan('all','choice')).available!.reinforce,0);
}));
test('a fresh error returns after two other learning tasks, before the learning queue ends',()=>run(async(d,svc,b)=>{
 await seedFutureMistakes(d,b,0);
 for(const [n,f] of b.facts.slice(0,5).entries()){
  const key='studyCore:memory:'+associationGoal(b,f,'recognition').id,row=(await d.appMeta.get(key))!;
  row.value.card.due=new Date(Date.now()-(n===0?86400000:1000));await d.appMeta.put(row);
 }
 let s=await svc.startGoalFeed('all','choice'),q=s.tasks[0];assert.equal(q.items[0].factId,'f0');
 await svc.answer({sessionId:s.id,taskId:q.id,answer:q.options.find(o=>o.id!==q.items[0].answerId)!.id});
 await svc.answer({sessionId:s.id,taskId:q.id,answer:q.items[0].answerId});
 for(let n=0;n<2;n++){
  s=await svc.advanceFeed(s.id,false,q.id);q=s.tasks[0];assert.equal(q.intent,'learn');assert(!q.items.some(i=>i.factId==='f0'));
  const answer=q.studyContract!.response.kind==='mapping'?Object.fromEntries(q.studyContract!.response.bindings.map(b=>[b.responseKey,b.expected])):q.items[0].answerId;
  await svc.answer({sessionId:s.id,taskId:q.id,answer});
 }
 s=await svc.advanceFeed(s.id,false,q.id);assert.equal(s.tasks[0].intent,'repair');assert.equal(s.tasks[0].items[0].factId,'f0');
}));
test('diagnostic scheduling drains future mistakes through valid alternative formats',()=>run(async(d,svc,b)=>{
 await seedFutureMistakes(d,b,1);
 const s=await svc.startGoalFeed('all','timeline');assert.equal(s.exhausted,false);assert.equal(s.tasks[0].intent,'repair');assert.equal(s.tasks[0].items[0].factId,'f0');
}));
test('temporarily disabled content retains its episode; a real revision change supersedes it',()=>run(async(d,svc,b)=>{
 await seedFutureMistakes(d,b,1);await svc.getDayPlan();const id=(await d.appMeta.get('studyCore:mistakeEpisodes'))!.value.episodes[0].id;
 await putBundle(d,{...b,properties:b.properties!.map(p=>({...p,learnable:false}))});
 assert.equal((await svc.getDayPlan()).unavailableMistakes,1);assert.equal((await d.appMeta.get('studyCore:mistakeEpisodes'))!.value.episodes[0].status,'unavailable');
 await putBundle(d,b);assert.equal((await svc.getDayPlan()).mistakes!.length,1);assert.equal((await d.appMeta.get('studyCore:mistakeEpisodes'))!.value.episodes[0].id,id);
 await putBundle(d,{...b,facts:b.facts.map(f=>f.id==='f0'?{...f,valueEntityId:'a2'}:f)});await svc.getDayPlan();
 assert.equal((await d.appMeta.get('studyCore:mistakeEpisodes'))!.value.episodes[0].status,'superseded');
}));
test('explicit unavailable-error retry clears media suppression without admitting extra new knowledge',()=>run(async(d,svc,b)=>{
 await seedFutureMistakes(d,b,1);const s=await svc.startGoalFeed('all','choice'),before=(await svc.getDayPlan()).newGoalIds;
 const {markRepairUnavailable}=await import('../src/services/mistake-episodes');await markRepairUnavailable(d,s.tasks[0].repairEpisodeIds!,'https://example.com/temporary-image.png');
 await d.activeSessions.update(s.id,{exhausted:true,tasks:[]});assert.equal((await svc.getDayPlan()).unavailableMistakes,1);
 const next=await svc.retryUnavailableMistakes(s.id);assert.equal(next.exhausted,false);assert.equal(next.tasks[0].intent,'repair');
 assert.equal((await d.appMeta.get('studyCore:mistakeEpisodes'))!.value.episodes[0].failedImage,undefined);
 assert.deepEqual((await svc.getDayPlan()).newGoalIds,before);
}));
test('failed repair and same-task correction preserve one error and never reschedule memory',()=>run(async(d,svc,b)=>{
 await seedFutureMistakes(d,b,1);
 const s=await svc.startGoalFeed('all','choice'),q=s.tasks[0],before=await d.appMeta.where('key').startsWith('studyCore:memory:').toArray();assert.equal(q.intent,'repair');
 if(q.recipe.format==='recall_reveal')await svc.saveInteraction(s.id,q.id,{recallElapsedMs:5000,revealed:true});
 const wrong=q.recipe.format==='recall_reveal'?false:q.options.find(o=>o.id!==q.items[0].answerId)!.id;
 await svc.answer({sessionId:s.id,taskId:q.id,answer:wrong});
 await svc.answer({sessionId:s.id,taskId:q.id,answer:q.recipe.format==='recall_reveal'?true:q.items[0].answerId});
 assert.equal((await svc.getDayPlan()).mistakes!.length,1);
 assert.deepEqual(await d.appMeta.where('key').startsWith('studyCore:memory:').toArray(),before);
 const next=await svc.advanceFeed(s.id,false,q.id);assert.equal(next.tasks[0].intent,'repair');assert.notEqual(next.tasks[0].id,q.id);
}));
test('scoped counters and repairs exclude errors from other collections, including suspended errors',()=>run(async(d,svc,b)=>{
 await seedFutureMistakes(d,b,2);
 await putBundle(d,{...b,tags:[{id:'one',name:'Один'},{id:'two',name:'Два'}],entityTags:[{entityId:'s0',tagId:'one'},{entityId:'s1',tagId:'two'}]});
 assert.equal((await svc.getDayPlan()).mistakes!.length,2);
 const row=(await d.learningState.get('ku:fact:f1:forward'))!;await d.learningState.put(learningRow({...row.payload,status:'suspended'}));
 const one=await svc.getDayPlan('one'),two=await svc.getDayPlan('two');
 assert.equal(one.mistakes!.length,1);assert.equal(one.unavailableMistakes,0);
 assert.equal(two.mistakes!.length,0);assert.equal(two.unavailableMistakes,1);
 const s=await svc.startGoalFeed('one','choice');assert.equal(s.tasks[0].intent,'repair');assert.equal(s.tasks[0].items[0].factId,'f0');
}));
test('mistake episodes survive day rollover and serialized backup without remigrating resolved errors',()=>run(async(d,svc,b)=>{
 await seedFutureMistakes(d,b,1);await svc.getDayPlan();
 const ledger=await d.appMeta.get('studyCore:mistakeEpisodes'),id=ledger!.value.episodes[0].id;
 const {ensureDayPlan}=await import('../src/services/day-plan-service');
 const catalog=buildGoalCatalog(b,(await d.learningState.toArray()).map(r=>r.payload)),memories=(await d.appMeta.where('key').startsWith('studyCore:memory:').toArray()).map(r=>r.value);
 const tomorrow=await ensureDayPlan(d,catalog,memories,new Date(Date.now()+86400000));assert.equal(tomorrow.mistakes!.length,1);assert.equal((await d.appMeta.get('studyCore:mistakeEpisodes'))!.value.episodes[0].id,id);
 const {exportBackup,restoreBackup}=await import('../src/services/backup-service'),backup=JSON.parse(JSON.stringify(await exportBackup(d))),target=new EngiDB('repair-backup-'+crypto.randomUUID());
 try{
  await restoreBackup(backup,target);const restored=createTrainerService(target),s=await restored.startGoalFeed('all','choice'),q=s.tasks[0];assert.equal(q.intent,'repair');assert.deepEqual(q.repairEpisodeIds,[id]);
  if(q.recipe.format==='recall_reveal')await restored.saveInteraction(s.id,q.id,{recallElapsedMs:5000,revealed:true});
  await restored.answer({sessionId:s.id,taskId:q.id,answer:q.recipe.format==='recall_reveal'?true:q.items[0].answerId});
  assert.equal((await restored.getDayPlan()).mistakes!.length,0);assert.equal((await createTrainerService(target).getDayPlan()).mistakes!.length,0);
 }finally{target.close();await target.delete();}
}));
test('live mistakes survive immediate correction and close across formats without altering the failed schedule',()=>run(async(d,svc,b)=>{
 const s=await svc.startGoalFeed('all','choice'),t=s.tasks[0],wrong=t.options.find(o=>o.id!==t.items[0].answerId)!;
 await svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id});
 assert.equal((await svc.getDayPlan()).mistakes!.length,1);
 const goal=t.studyContract!.primaryGoals[0],before=(await d.appMeta.get('studyCore:memory:'+goal.id))!.value;
 await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});
 assert.equal((await svc.getDayPlan()).mistakes!.length,1);
 const fact=b.facts.find(f=>f.id===t.items[0].factId)!;
 await putBundle(d,{...b,tags:[{id:'mistake-scope',name:'Ошибка'}],entityTags:[{entityId:fact.entityId,tagId:'mistake-scope'}]});
 const fresh=await svc.startGoalFeed('mistake-scope','recall_reveal'),next=fresh.tasks[0];assert.equal(next.items[0].factId,fact.id);
 await svc.saveInteraction(fresh.id,next.id,{recallElapsedMs:5000,revealed:true});
 const result=await svc.answer({sessionId:fresh.id,taskId:next.id,answer:true});
 assert.equal(result.feedback!.mistakeResolved,1);assert.equal((await svc.getDayPlan()).mistakes!.length,0);
 assert.deepEqual((await d.appMeta.get('studyCore:memory:'+goal.id))!.value,before);
 assert.equal((await createTrainerService(d).getDayPlan()).mistakes!.length,0);
}));
test('goal feed commits one goal FSRS while every legacy memory stays byte-for-byte unchanged',()=>run(async(d,svc)=>{
 const before=await d.learningState.toArray(),s=await svc.startGoalFeed('all','choice'),t=s.tasks[0];assert.equal(t.memoryModel,'goals');
 const r=await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId}),g=t.studyContract!.primaryGoals[0];
 const memory=(await d.appMeta.get('studyCore:memory:'+g.id))!.value;
 assert.equal(memory.card.reps,1);assert.equal(memory.independentSuccesses,1);assert.deepEqual(await d.learningState.toArray(),before);
 assert.deepEqual(r.event!.targetIds,[g.id]);assert.equal(r.event!.payload.targets[0].fsrsUpdated,true);
}));
test('recognition and recall of the same fact have independent live schedules',()=>run(async(d,svc,b)=>{
 const s=await svc.startGoalFeed('all','choice'),t=s.tasks[0],fact=b.facts.find(f=>f.id===t.items[0].factId)!;
 await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});
 const recognition=associationGoal(b,fact,'recognition'),recall=associationGoal(b,fact,'recall');
 assert(await d.appMeta.get('studyCore:memory:'+recognition.id));assert.equal(await d.appMeta.get('studyCore:memory:'+recall.id),undefined);
 // An explicit one-object scope tests schedule independence without relying on old feed order.
 await putBundle(d,{...b,tags:[{id:'single',name:'Один объект'}],entityTags:[{entityId:fact.entityId,tagId:'single'}]});
 const s2=await svc.startGoalFeed('single','recall_reveal');assert.equal(s2.tasks[0].items[0].factId,fact.id);
 await svc.saveInteraction(s2.id,s2.tasks[0].id,{recallElapsedMs:5000,revealed:true});
 await svc.answer({sessionId:s2.id,taskId:s2.tasks[0].id,answer:true});
 assert.equal((await d.appMeta.get('studyCore:memory:'+recall.id))!.value.card.reps,1);
 assert.equal((await d.appMeta.get('studyCore:memory:'+recognition.id))!.value.card.reps,1);
}));
test('full set has exactly one memory and does not credit or schedule any member',()=>run(async(d,svc,b)=>{
 const before=await d.learningState.toArray(),s=await svc.startGoalFeed('all','multi_choice'),t=s.tasks[0];
 const r=await svc.answer({sessionId:s.id,taskId:t.id,answer:t.answerSet}),g=completeSetGoal(b,t.items[0].entityId,'rel');
 assert.deepEqual(r.event!.targetIds,[g.id]);assert.equal((await d.appMeta.where('key').startsWith('studyCore:memory:').count()),1);
 assert.equal((await d.appMeta.get('studyCore:memory:'+g.id))!.value.card.reps,1);assert.deepEqual(await d.learningState.toArray(),before);
},true));
test('wrong first choice updates goal FSRS once before correction and survives replacement',()=>run(async(d,svc)=>{
 const s=await svc.startGoalFeed('all','choice'),t=s.tasks[0],wrong=t.options.find(o=>o.id!==t.items[0].answerId)!;
 await Promise.all([svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id}),svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id})]);
 const key='studyCore:memory:'+t.studyContract!.primaryGoals[0].id,m=(await d.appMeta.get(key))!.value;
 assert.equal(m.card.reps,1);assert.equal(m.independentAttempts,1);assert.equal(m.independentSuccesses,0);
 await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});assert.deepEqual((await d.appMeta.get(key))!.value,m);
 await svc.startGoalFeed();assert.deepEqual((await d.appMeta.get(key))!.value,m);
}));
test('goal selection ignores legacy due dates and reports the earliest future goal deadline',()=>run(async(d,svc,b)=>{
 const enabled=(await d.learningState.toArray()).map(r=>r.payload),candidates=goalCandidates(b,enabled,'all','choice'),due=new Date(Date.now()+120000);
 for(const m of enabled)await d.learningState.put(learningRow({...m,card:{...m.card,due:new Date('2099-01-01')}}));
 const fresh=await svc.startGoalFeed('all','choice');assert(fresh.tasks.length);
 for(const t of candidates)for(const g of t.studyContract!.primaryGoals)await d.appMeta.put({key:'studyCore:memory:'+g.id,value:{goalId:g.id,card:{...createEmptyCard(),due},independentAttempts:1,independentSuccesses:1}});
 const wait=await svc.startGoalFeed('all','choice');assert.equal(wait.exhausted,true);assert.equal(wait.waitingUntil,due.toISOString());
 assert.equal(wait.tasks.length,0);
}));
test('practice and early reveal do not create goal memory or touch legacy state',()=>run(async(d,svc)=>{
 const before=await d.learningState.toArray(),s=await svc.startGoalFeed('all','recall_reveal');
 await svc.saveInteraction(s.id,s.tasks[0].id,{recallElapsedMs:1000,revealed:true,earlyReveal:true});await svc.answer({sessionId:s.id,taskId:s.tasks[0].id,answer:true});
 const p=await svc.startGoalFeed('all','choice','practice');await svc.answer({sessionId:p.id,taskId:p.tasks[0].id,answer:p.tasks[0].items[0].answerId});
 assert.equal(await d.appMeta.where('key').startsWith('studyCore:memory:').count(),0);assert.deepEqual(await d.learningState.toArray(),before);
}));
test('real feedback disclosure prevents immediate Recall of the just shown fact',()=>run(async(d,svc,b)=>{
 const s=await svc.startGoalFeed('all','choice'),t=s.tasks[0];await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});
 await svc.observeVisibility(s.id,t.id,'feedback','actual-feedback','start');
 const next=await svc.startGoalFeed('all','recall_reveal');assert.notEqual(next.tasks[0].items[0].factId,t.items[0].factId);
 const recall=associationGoal(b,b.facts.find(f=>f.id===t.items[0].factId)!,'recall');assert.equal(await d.appMeta.get('studyCore:memory:'+recall.id),undefined);
}));
test('suspending a set member excludes the aggregate and duplicate presentations do not multiply goals',()=>run(async(d,_svc,b)=>{
 const enabled=(await d.learningState.toArray()).map(r=>r.payload),first=enabled.find(m=>m.id==='ku:fact:f0:forward')!;
 const ordinary=goalCandidates(b,enabled,'all','multi_choice'),duplicated=goalCandidates(b,[...enabled,...Array.from({length:20},()=>first)],'all','multi_choice');
 assert.deepEqual(duplicated.map(t=>t.studyContract!.primaryGoals[0].id).sort(),ordinary.map(t=>t.studyContract!.primaryGoals[0].id).sort());
 const suspended=enabled.map(m=>m.id==='ku:fact:extra:forward'?{...m,status:'suspended' as const}:m);
 assert(!goalCandidates(b,suspended,'all','multi_choice').some(t=>t.items[0].entityId==='s0'));
},true));
test('bounded set model: all 16 subsets grade one aggregate without any member memory',async()=>{
 for(let mask=0;mask<16;mask++)await run(async(d,svc)=>{
  const s=await svc.startGoalFeed('all','multi_choice'),t=s.tasks[0];assert.equal(t.options.length,4);
  const answer=t.options.filter((_o,n)=>mask&(1<<n)).map(o=>o.id),correct=JSON.stringify([...answer].sort())===JSON.stringify([...t.answerSet!].sort());
  const before=await d.learningState.toArray(),r=await svc.answer({sessionId:s.id,taskId:t.id,answer});
  const rows=await d.appMeta.where('key').startsWith('studyCore:memory:').toArray();assert.equal(rows.length,1);
  assert.equal(rows[0].value.independentAttempts,1);assert.equal(rows[0].value.independentSuccesses,Number(correct));
  assert.equal(r.event!.payload.targets.length,1);assert.equal(r.event!.payload.targets[0].correct,correct);
  assert.deepEqual(await d.learningState.toArray(),before);
 },true);
});
test('mixed generation preserves different formats for the same goal while deduplicating identical presentations',()=>run(async(d,_svc,b)=>{
 const enabled=(await d.learningState.toArray()).map(r=>r.payload),tasks=goalCandidates(b,enabled);
 const groups=new Map<string,Set<string>>();
 for(const task of tasks){const id=task.studyContract!.primaryGoals[0].id;const formats=groups.get(id)??new Set<string>();formats.add(task.recipe.format);groups.set(id,formats);}
 assert([...groups.values()].some(formats=>formats.has('choice')&&formats.has('match')));
 assert(tasks.filter(t=>['choice','match','categorize'].includes(t.recipe.format)).every(t=>interactionFamily(t)==='choice'));
 const duplicates=goalCandidates(b,[...enabled,...enabled]);assert.equal(duplicates.length,tasks.length);
 assert.equal(new Set(tasks.map(t=>JSON.stringify([t.studyContract!.primaryGoals.map(g=>g.id),t.recipe.format]))).size,tasks.length);
}));
test('precomputed composition pools preserve task semantics and are rebuilt for edited content',()=>run(async(d,_svc,b)=>{
 const m=(await d.learningState.toArray())[0].payload,original=Math.random;
 function build(context?:ReturnType<typeof compositionContext>){Math.random=()=>0.25;try{const t=composeUnit(b,m,'all','choice',[],context)!;assert(t);const c=compileTaskContract(b,t);return {recipe:t.recipe,items:t.items,options:t.options,goals:c.primaryGoals,response:c.response};}finally{Math.random=original;}}
 assert.deepEqual(build(compositionContext(b)),build());
 const edited={...b,entities:b.entities.map(e=>({...e,name:e.name+' изменено'}))},context=compositionContext(edited),t=composeUnit(edited,m,'all','choice',[],context)!;
 assert(t.items[0].name.endsWith('изменено'));assert(t.options.every(o=>o.name.endsWith('изменено')));
}));

test('live recognition memory controls difficulty independently of legacy and recall memory',()=>run(async(d,svc,b)=>{
 const now=Date.now(),g=associationGoal(b,b.facts[0],'recognition');
 await holdOtherRecognition(d,b);
 const before=await d.learningState.toArray();
 await d.appMeta.put({key:'studyCore:memory:'+g.id,value:{goalId:g.id,card:{...createEmptyCard(),state:State.Review,stability:90,difficulty:3,reps:6,last_review:new Date(now-86400000),due:new Date(now-1000)},lastCorrect:true,independentAttempts:6,independentSuccesses:6,latencyEmaMs:1000}});
 const recognition=await svc.startGoalFeed('all','choice');
 assert.equal(recognition.tasks[0].difficultyStage,4);
 const recall=await svc.startGoalFeed('all','recall_reveal');
 assert.equal(recall.tasks[0].difficultyStage,1);
 assert.deepEqual(await d.learningState.toArray(),before);
}));

test('unverified goal does not inherit difficulty or confusions from legacy progress',()=>run(async(d,svc)=>{
 for(const row of await d.learningState.toArray())await d.learningState.put(learningRow({...row.payload,status:'review',attempts:20,correct:20,lastOutcome:true,firstSuccessAt:new Date().toISOString(),latencyEmaMs:500,confusions:{a1:10},card:{...row.payload.card,state:State.Review,stability:180,last_review:new Date()}}));
 const before=await d.learningState.toArray(),s=await svc.startGoalFeed('all','choice'),task=s.tasks[0];
 assert.equal(task.difficultyStage,1);assert.equal(task.discrimination,false);assert.equal(task.options.length,4);
 assert.deepEqual(await d.learningState.toArray(),before);
}));

test('only credited first choices update goal confusions and latency, not correction or practice',()=>run(async(d,svc)=>{
 const before=await d.learningState.toArray(),s=await svc.startGoalFeed('all','choice'),t=s.tasks[0],wrong=t.options.find(o=>o.id!==t.items[0].answerId)!;
 const key='studyCore:memory:'+t.studyContract!.primaryGoals[0].id;
 await svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id,latencyMs:2400});
 const first=(await d.appMeta.get(key))!.value;
 assert.deepEqual(first.confusions,{[wrong.id]:1});assert.equal(first.latencyEmaMs,2400);
 await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId,latencyMs:10000});
 assert.deepEqual((await d.appMeta.get(key))!.value,first);
 const p=await svc.startGoalFeed('all','choice','practice'),pt=p.tasks[0];
 const allBefore=await d.appMeta.where('key').startsWith('studyCore:memory:').toArray();
 await svc.answer({sessionId:p.id,taskId:pt.id,answer:pt.options.find(o=>o.id!==pt.items[0].answerId)!.id,latencyMs:900});
 assert.deepEqual(await d.appMeta.where('key').startsWith('studyCore:memory:').toArray(),allBefore);
 assert.deepEqual(await d.learningState.toArray(),before);
}));

test('live goal confusion selects the mistaken alternative for mature discrimination',()=>run(async(d,svc,b)=>{
 const now=Date.now(),g=associationGoal(b,b.facts[0],'recognition');
 await holdOtherRecognition(d,b);
 await d.appMeta.put({key:'studyCore:memory:'+g.id,value:{goalId:g.id,card:{...createEmptyCard(),state:State.Review,stability:90,difficulty:3,reps:6,last_review:new Date(now-86400000),due:new Date(now-1000)},lastCorrect:true,independentAttempts:7,independentSuccesses:6,latencyEmaMs:1000,confusions:{a7:2}}});
 const s=await svc.startGoalFeed('all','choice'),t=s.tasks[0];
 assert.equal(t.discrimination,true);assert.deepEqual(t.options.map(o=>o.id).sort(),['a0','a7']);
}));

test('goal stability crossing thirty days is counted once and retained in history',()=>run(async(d,svc,b)=>{
 const now=Date.now(),g=associationGoal(b,b.facts[0],'recognition');
 await holdOtherRecognition(d,b);
 await d.appMeta.put({key:'studyCore:memory:'+g.id,value:{goalId:g.id,card:{...createEmptyCard(),state:State.Review,stability:29,difficulty:5,reps:5,last_review:new Date(now-14*86400000),due:new Date(now-1000)},lastCorrect:true,independentAttempts:5,independentSuccesses:5}});
 const s=await svc.startGoalFeed('all','choice'),t=s.tasks[0],input={sessionId:s.id,taskId:t.id,answer:t.items[0].answerId};
 const result=await svc.answer(input),after=(await d.appMeta.get('studyCore:memory:'+g.id))!.value;
 assert(after.card.stability>=30);
 assert.equal((await d.appMeta.get('studyCore:dailyLearning'))!.value.stability30Gains,1);
 assert.equal(result.event!.payload.metadata.stabilityTransitions[0].targetId,g.id);
 assert.equal(result.event!.payload.metadata.stabilityTransitions[0].before,29);
 assert.equal(result.event!.payload.metadata.stabilityTransitions[0].after,after.card.stability);
 await svc.answer(input);assert.equal((await d.appMeta.get('studyCore:dailyLearning'))!.value.stability30Gains,1);
}));
