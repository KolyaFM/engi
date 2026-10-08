import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EngiDB} from '../src/db/engi-db';
import {createTrainerService} from '../src/services/trainer-service';
import {putBundle,learningRow} from '../src/db/repositories';
import {prepareDue} from './helpers22';
import {createStudyCoreService} from '../src/services/study-core-service';
import {compileTaskContract,compileIntroContract} from '../src/lib/engi/study-core/compiler';
import type {Bundle,Task} from '../src/lib/engi/types';
import {reviewReceiptKey} from '../src/services/review-commit';
import {resetLearningProgress} from '../src/services/learning-service';

function fixture():Bundle{
 const b:Bundle={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[],properties:[{id:'relation',name:'Автор',valueKind:'entity',cardinality:'one',learnable:true,subjectTypes:['subject'],targetTypes:['answer']}]};
 for(let n=0;n<8;n++){
  b.entities.push({id:'s'+n,type:'subject',name:'Объект '+n,aliases:[],externalIds:{}},{id:'a'+n,type:'answer',name:'Автор '+n,aliases:[],externalIds:{}});
  b.facts.push({id:'f'+n,entityId:'s'+n,key:'relation',valueKind:'entity',valueEntityId:'a'+n,completeSet:true,verification:'verified',source:{name:'test'}});
 }
 return b;
}
async function run(action:(d:EngiDB,svc:ReturnType<typeof createTrainerService>)=>Promise<void>,b=fixture(),mature=true){
 const d=new EngiDB('gate-'+crypto.randomUUID());try{
  await putBundle(d,b);
  if(mature){
   await prepareDue(d);
   for(const r of await d.learningState.toArray()){
    const m=r.payload;m.status='review';m.bootstrap=undefined;m.attempts=5;m.correct=5;m.objectiveReviews=5;
    m.firstSuccessAt=new Date(Date.now()-86400000).toISOString();
    m.card={...m.card,state:2,reps:5,stability:10,difficulty:5,last_review:new Date(Date.now()-86400000),due:new Date(Date.now()-1000)};
    await d.learningState.put(learningRow(m));
   }
  }
  await action(d,createTrainerService(d));
 }finally{d.close();await d.delete();}
}
test('live normal Recall after five seconds receives self-report credit and exactly one FSRS update',()=>run(async(d,svc)=>{
 const s=await svc.startFeed('all','recall_reveal'),t=s.tasks[0],before=(await d.learningState.get(t.items[0].targetId))!.payload;
 await svc.saveInteraction(s.id,t.id,{recallElapsedMs:5000,revealed:true});
 await svc.observeVisibility(s.id,t.id,'answer-reveal','normal-episode','start');
 const r=await svc.answer({sessionId:s.id,taskId:t.id,answer:true});
 assert.equal(r.event!.payload.studyCore.attempt.results[0].credit,true);assert.equal(r.event!.payload.studyCore.attempt.results[0].selfReported,true);
 assert.equal(r.event!.payload.fsrsEnabled,true);assert.equal((await d.learningState.get(before.id))!.payload.card.reps,before.card.reps+1);
 await svc.answer({sessionId:s.id,taskId:t.id,answer:true});assert.equal((await d.learningState.get(before.id))!.payload.card.reps,before.card.reps+1);
}));
test('early reveal freezes all live memory fields and does not advance daily progress or create repair debt',()=>run(async(d,svc)=>{
 const s=await svc.startFeed('all','recall_reveal'),t=s.tasks[0],before=(await d.learningState.get(t.items[0].targetId))!.payload;
 await svc.saveInteraction(s.id,t.id,{recallElapsedMs:1200,earlyReveal:true,revealed:true});
 await svc.observeVisibility(s.id,t.id,'early-answer','early-episode','start');
 const r=await svc.answer({sessionId:s.id,taskId:t.id,answer:false});
 assert.equal(r.event!.payload.studyCore.attempt.results[0].credit,false);assert.equal(r.event!.payload.fsrsEnabled,false);assert.equal(r.event!.level,'practice');
 assert.deepEqual((await d.learningState.get(before.id))!.payload,before);assert.equal(await d.appMeta.get('dailyLearning'),undefined);
 assert.equal((await d.activeSessions.get(s.id))!.repairQueue?.length??0,0);assert.equal(r.feedback!.creditBlocked,true);
}));
test('opening a source before answering blocks both Good and Again in the live memory path',()=>run(async(d,svc)=>{
 const s=await svc.startFeed('all','choice'),t=s.tasks[0],before=(await d.learningState.get(t.items[0].targetId))!.payload;
 await svc.observeVisibility(s.id,t.id,'source','source-episode','start');
 const wrong=t.options.find(o=>o.id!==t.items[0].answerId)!;
 await svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id});const r=await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});
 assert.equal(r.event!.payload.studyCore.attempt.results[0].credit,false);assert.deepEqual((await d.learningState.get(before.id))!.payload,before);
 assert.equal(r.event!.payload.fsrsEnabled,false);assert.equal(await d.appMeta.get('dailyLearning'),undefined);
}));
test('a hint opened after the first wrong choice preserves the original independent failure',()=>run(async(d,svc)=>{
 const s=await svc.startFeed('all','choice'),t=s.tasks[0],before=(await d.learningState.get(t.items[0].targetId))!.payload;
 const wrong=t.options.find(o=>o.id!==t.items[0].answerId)!;
 await svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id});
 const initial=(await d.appMeta.get('studyCore:attempt:'+t.id))!.value;assert.equal(initial.phase,'submitted');assert.equal(initial.firstAnswer,wrong.id);
 await svc.observeVisibility(s.id,t.id,'source','later-source','start');
 const r=await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});
 assert.equal(r.event!.payload.studyCore.attempt.results[0].credit,true);assert.equal(r.event!.payload.studyCore.attempt.results[0].correct,false);
 const after=(await d.learningState.get(before.id))!.payload;assert.equal(after.card.reps,before.card.reps+1);assert.equal(after.card.lapses,before.card.lapses+1);
}));
test('editing a fact after the first answer preserves its historical commit but invalidates correction',()=>run(async(d,svc)=>{
 const s=await svc.startFeed('all','choice'),t=s.tasks[0];
 const wrong=t.options.find(o=>o.id!==t.items[0].answerId)!;
 await svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id});
 const before=(await d.learningState.get(t.items[0].targetId))!.payload;
 const initial=(await d.appMeta.get('studyCore:attempt:'+t.id))!.value;
 await d.facts.update(t.items[0].factId!,{valueEntityId:wrong.id});
 const r=await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});
 assert.equal(r.feedback!.invalidContent,true);assert.equal(r.event!.level,'invalid_content');
 assert.deepEqual((await d.learningState.get(before.id))!.payload,before);
 assert.deepEqual((await d.appMeta.get('studyCore:attempt:'+t.id))!.value,initial);
 assert.equal((await d.appMeta.get('dailyLearning'))!.value.retrievals,1);
}));
test('an intro heartbeat queued after Done stays with the old object after a progress reset',()=>run(async(d,svc)=>{
 await resetLearningProgress(d);const first=await svc.startGoalFeed('all','choice');assert(first.intro);
 const opened=await svc.observeIntroVisibility(first.id,'first-intro','start');assert(opened);
 const next=await svc.completeIntro(first.id);assert(next.intro);assert.notEqual(next.intro.entityId,first.intro.entityId);
 const refreshed=await svc.observeIntroVisibility(first.id,'first-intro','refresh');assert.equal(refreshed!.attemptId,opened.attemptId);
 const ended=await svc.observeIntroVisibility(first.id,'first-intro','end');assert(ended!.endedAt);
 const current=await svc.observeIntroVisibility(next.id,'second-intro','start');assert.notEqual(current!.attemptId,opened.attemptId);
 const late=await svc.observeIntroVisibility(first.id,'first-intro','refresh');assert.deepEqual(late,ended);
 assert.deepEqual((await d.appMeta.get('studyCore:episode:second-intro'))!.value,current);
},fixture(),false));

test('reference facts can be shown in Intro and completing it creates no false success',async()=>{
 const b=fixture();b.facts.push({id:'reference',entityId:'s0',key:'note',valueKind:'text',valueText:'Контекст',learnable:false,verification:'verified',source:{name:'test'}});
 const c=compileIntroContract(b,{entityId:'s0',unitIds:['ku:fact:f0:forward'],newProperty:false},'intro');
 assert.deepEqual(c.shownClaims.find(c=>c.key==='fact:reference')!.revealsGoalIds,[]);
 await run(async(d,svc)=>{
  const s=await svc.startFeed();assert.equal(s.intro!.entityId,'s0');
  await svc.observeIntroVisibility(s.id,'intro-episode','start');
  await svc.completeIntro(s.id);await svc.observeIntroVisibility(s.id,'intro-episode','end');
  assert((await d.learningState.count())>0);assert.equal(await d.reviewEvents.count(),0);
  assert((await d.learningState.toArray()).every(r=>r.payload.card.reps===0));
 },b,false);
});
test('normal recall reveal credits its owner but invalidates another open screen of the same fact',async()=>{
 const d=new EngiDB('foreign-reveal-'+crypto.randomUUID());try{
  const b=fixture(),base:Task={id:'recall',recipe:{id:'r',format:'recall_reveal',cue:'name',answerKey:'relation',memoryKey:'x',diagnostic:false},items:[{entityId:'s0',name:'Объект 0',targetId:'ku:fact:f0:forward',factId:'f0',answer:'Автор 0',answerId:'a0',answerEntityId:'a0',aliases:[],sourceUrl:''}],options:[{id:'a0',name:'Автор 0'},{id:'a1',name:'Автор 1'}],reason:'due'};
  const recall=compileTaskContract(b,base),choice=compileTaskContract(b,{...base,id:'choice',recipe:{...base.recipe,format:'choice'}}),core=createStudyCoreService(d),at=new Date();
  await core.setContentRevisions({...recall.contentRevisions,...choice.contentRevisions});await core.open(recall,'recall',at);await core.open(choice,'choice',at);
  await core.observe('recall','answer-reveal','ep','start',new Date(at.getTime()+5000));
  const own=await core.submit('recall',true,new Date(at.getTime()+6000)),other=await core.submit('choice','a0',new Date(at.getTime()+6000));
  assert.equal(own.results![0].credit,true);assert.equal(other.results![0].credit,false);
  assert(await core.memory(recall.primaryGoals[0].id));assert.equal(await core.memory(choice.primaryGoals[0].id),undefined);
 }finally{d.close();await d.delete();}
});
test('partial answer to a complete set gives no successful evidence for its individual members',async()=>{
 const b=fixture();b.properties![0].cardinality='many';b.facts.push({...b.facts[0],id:'coauthor',valueEntityId:'a1'});
 await run(async(d,svc)=>{
  const s=await svc.startFeed('all','multi_choice'),t=s.tasks[0];assert.equal(t.studyContract!.primaryGoals.length,1);
  const before=await d.learningState.bulkGet(t.items.map(i=>i.targetId));
  const r=await svc.answer({sessionId:s.id,taskId:t.id,answer:[t.answerSet![0]]});
  assert.equal(r.event!.payload.score,0);assert(r.event!.payload.targets.every((t:{correct:boolean})=>!t.correct));
  const after=await d.learningState.bulkGet(t.items.map(i=>i.targetId));
  after.forEach((m,n)=>assert.equal(m!.payload.correct,before[n]!.payload.correct));
 },b);
});
test('leaving an unfinished correction and starting another session cannot erase or repeat the failure',()=>run(async(d,svc)=>{
 const s=await svc.startFeed('all','choice'),t=s.tasks[0],old=(await d.learningState.get(t.items[0].targetId))!.payload;
 const wrong=t.options.find(o=>o.id!==t.items[0].answerId)!;
 await svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id});
 const committed=(await d.learningState.get(old.id))!.payload;assert.equal(committed.card.reps,old.card.reps+1);assert.equal(committed.card.lapses,old.card.lapses+1);
 assert.equal(await svc.getFeedback(t.id),null);assert.equal((await d.activeSessions.get(s.id))!.results.length,0);
 await svc.startFeed('all','choice');
 assert.deepEqual((await d.learningState.get(old.id))!.payload,committed);
 assert.equal((await d.reviewEvents.get(t.id))!.payload.metadata.completion,'abandoned');
 assert.equal((await d.reviewEvents.get(t.id))!.payload.feedback.correctionComplete,false);
 assert.equal(await d.appMeta.get(reviewReceiptKey(t.id)),undefined);
 assert.equal((await d.appMeta.get('dailyLearning'))!.value.retrievals,1);
}));
test('skip after a wrong answer archives its result without a second memory transition',()=>run(async(d,svc)=>{
 const s=await svc.startFeed('all','choice'),t=s.tasks[0],wrong=t.options.find(o=>o.id!==t.items[0].answerId)!;
 await svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id});const committed=(await d.learningState.get(t.items[0].targetId))!.payload;
 await svc.advanceFeed(s.id,true,t.id);assert.deepEqual((await d.learningState.get(committed.id))!.payload,committed);
 assert.equal((await d.reviewEvents.get(t.id))!.payload.metadata.completion,'abandoned');
}));
test('editing through the knowledge service after a first answer does not resurrect invalidated memory',async()=>{
 const b=fixture();b.entityTypes=[{id:'subject',name:'Объект'},{id:'answer',name:'Автор'}];b.facts=b.facts.map(f=>({...f,source:{kind:'manual',name:'Личное знание'}}));
 await run(async(d,svc)=>{
 const s=await svc.startFeed('all','choice'),t=s.tasks[0],wrong=t.options.find(o=>o.id!==t.items[0].answerId)!;
 await svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id});
 const fact=(await d.facts.get(t.items[0].factId!))!,entity=(await d.entities.get(fact.entityId))!;
 await svc.editEntity({entityId:entity.id,name:entity.name,facts:[{...fact,valueEntityId:wrong.id}]});
 assert.equal(await d.learningState.get(t.items[0].targetId),undefined);
 await assert.rejects(svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId}),/Текущая карточка не найдена/);
 assert.equal(await d.learningState.get(t.items[0].targetId),undefined);
 await svc.startFeed('all','choice');
 assert.equal((await d.reviewEvents.get(t.id))!.payload.studyCore.attempt.firstAnswer,wrong.id);
 assert.equal(await d.learningState.get(t.items[0].targetId),undefined);
 assert.equal(await d.appMeta.get(reviewReceiptKey(t.id)),undefined);
 },b);
});
test('failure writing a first-answer receipt rolls back memory, attempt, progress and interaction together',()=>run(async(d,svc)=>{
 const s=await svc.startFeed('all','choice'),t=s.tasks[0],before=(await d.learningState.get(t.items[0].targetId))!.payload;
 const fail=(_key:string,obj:{key:string})=>{if(obj.key===reviewReceiptKey(t.id))throw Error('receipt-write-failure');};
 d.appMeta.hook('creating',fail);
 const wrong=t.options.find(o=>o.id!==t.items[0].answerId)!;
 await assert.rejects(svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id}),/receipt-write-failure/);
 d.appMeta.hook('creating').unsubscribe(fail);
 assert.deepEqual((await d.learningState.get(before.id))!.payload,before);
 assert.equal((await d.appMeta.get('studyCore:attempt:'+t.id))!.value.phase,'open');
 assert.equal(await d.appMeta.get('dailyLearning'),undefined);assert.equal((await d.activeSessions.get(s.id))!.interaction,undefined);
 await svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id});assert.equal((await d.learningState.get(before.id))!.payload.card.reps,before.card.reps+1);
}));
test('concurrent wrong answers create only one first-answer transition and one daily increment',()=>run(async(d,svc)=>{
 const s=await svc.startFeed('all','choice'),t=s.tasks[0],before=(await d.learningState.get(t.items[0].targetId))!.payload,wrongs=t.options.filter(o=>o.id!==t.items[0].answerId);
 await Promise.all(wrongs.map(o=>svc.answer({sessionId:s.id,taskId:t.id,answer:o.id})));
 const committed=(await d.learningState.get(before.id))!.payload;assert.equal(committed.card.reps,before.card.reps+1);assert.equal(committed.attempts,before.attempts+1);
 assert.equal((await d.appMeta.get('dailyLearning'))!.value.retrievals,1);
 await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});assert.deepEqual((await d.learningState.get(before.id))!.payload,committed);
}));
test('bounded event model: 32 correction, hint, recreation and abandonment traces preserve the first commit',async()=>{
 for(let mask=0;mask<32;mask++)await run(async(d,initial)=>{
  let svc=initial;const s=await svc.startFeed('all','choice'),t=s.tasks[0],wrongs=t.options.filter(o=>o.id!==t.items[0].answerId);
  if(mask&1)await svc.observeVisibility(s.id,t.id,'source','before','start');
  const old=(await d.learningState.get(t.items[0].targetId))!.payload;
  await svc.answer({sessionId:s.id,taskId:t.id,answer:wrongs[0].id});
  const committed=(await d.learningState.get(old.id))!.payload;
  if(mask&1)assert.deepEqual(committed,old);else assert.equal(committed.card.reps,old.card.reps+1);
  if(mask&2)svc=createTrainerService(d);
  if(mask&4)await svc.observeVisibility(s.id,t.id,'source','after','start');
  if(mask&8){await svc.answer({sessionId:s.id,taskId:t.id,answer:wrongs[0].id});await svc.answer({sessionId:s.id,taskId:t.id,answer:wrongs[1].id});}
  if(mask&16)await svc.startFeed('all','choice');
  else{await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});}
  assert.deepEqual((await d.learningState.get(old.id))!.payload,committed,'trace '+mask);
  assert.equal((await d.appMeta.get('dailyLearning'))?.value.retrievals??0,mask&1?0:1);
  assert.equal(await d.reviewEvents.count(),1);assert.equal(await d.appMeta.get(reviewReceiptKey(t.id)),undefined);
 });
});
