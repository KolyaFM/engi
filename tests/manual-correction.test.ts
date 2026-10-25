import 'fake-indexeddb/auto';
import {test} from 'node:test';import assert from 'node:assert/strict';
import {EngiDB,type SessionRow} from '../src/db/engi-db';
import {putBundle,learningRow} from '../src/db/repositories';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {triagedMemory} from '../src/lib/engi/learning/bootstrap';
import {composeUnit} from '../src/lib/engi/session/composer';
import {prepareStudyTask} from '../src/services/study-core-bridge';
import {createTrainerService} from '../src/services/trainer-service';
import {admitAcquisition,emptyLifecycle,ACQUISITION_CONFIRMATION_MS} from '../src/lib/engi/study-core/acquisition';
import {knowledgeMistakeKey} from '../src/lib/engi/study-core/mistakes';
import {MISTAKE_EPISODES_KEY,synchronizeEpisodes} from '../src/services/mistake-episodes';
import {buildGoalCatalog} from '../src/services/goal-catalog';
import {createStudyCoreService} from '../src/services/study-core-service';
import type {Bundle} from '../src/lib/engi/types';
import {associationGoal} from '../src/lib/engi/study-core/compiler';import {createEmptyCard} from 'ts-fsrs';
async function setup(){
 const db=new EngiDB('manual-correction-'+crypto.randomUUID()),now=new Date(),b:Bundle={entities:[0,1,2].map(n=>({id:'e'+n,type:'event',name:n?'Event '+n:'Освящение хора аббатства Сен-Дени',aliases:[],externalIds:{}})),facts:[1144,1167,1183].map((year,n)=>({id:'f'+n,entityId:'e'+n,key:'year',valueKind:'date',dateStart:year+'-01-01',dateEnd:year+'-12-31',datePrecision:'year',verification:'user_confirmed',source:{kind:'manual',name:'Test'}})),properties:[{id:'year',name:'Год',valueKind:'date',cardinality:'one',learnable:true,learning:{reverse:false}}],media:[],tags:[],entityTags:[],missing:[],unresolved:[]};
 await putBundle(db,b);const targets=canonicalTargets(b),rows=targets.map(i=>triagedMemory(i,'red','s',0));await db.learningState.bulkPut(rows.map(learningRow));
 const task=composeUnit(b,rows.find(m=>m.id==='ku:fact:f0:forward')!,'all','choice')!;task.memoryModel='goals';task.learningLifecycle=1;task.intent='repair';task.reason='retry';task.repairEpisodeIds=['error'];await prepareStudyTask(db,b,task,now);
 const goal=task.studyContract!.primaryGoals[0],ledger=admitAcquisition(emptyLifecycle(),'e0',[goal],now);ledger.units[0].stage='confirmation';ledger.units[0].successes=1;ledger.units[0].availableAt=new Date(+now+ACQUISITION_CONFIRMATION_MS).toISOString();await db.appMeta.put({key:'studyCore:learningLifecycle',value:ledger});
 const other=buildGoalCatalog(b,rows).find(e=>e.goal.knowledge.key==='f1')!.goal;
 const errors=[goal,other].map((g,n)=>({id:n?'other':'error',key:knowledgeMistakeKey(g),goal:g,status:'open',openedAt:now.toISOString(),failedAt:now.toISOString(),lastAttemptAt:now.toISOString(),attemptIds:[]}));
 await db.appMeta.put({key:MISTAKE_EPISODES_KEY,value:{version:1,episodes:errors}});
 const session:SessionRow={id:'s',feed:true,endless:true,memoryModel:'goals',learningLifecycle:1,format:'mixed',mode:'daily',tag:'all',tasks:[task],currentPosition:0,results:[],createdAt:now.toISOString(),updatedAt:now.toISOString(),status:'active',timeLeft:90,cooldown:[]};await db.activeSessions.put(session);
 return {db,b,task,goal,rows,session,svc:createTrainerService(db)};
}
test('a correct objective repair clears an error while acquisition confirmation is still blocked',async()=>{
 const {db,task,svc}=await setup();try{
  const result=await svc.answer({sessionId:'s',taskId:task.id,answer:task.items[0].answerId});assert.equal(result.feedback.score,1);
  const errors=(await db.appMeta.get(MISTAKE_EPISODES_KEY))!.value.episodes;assert.equal(errors[0].status,'resolved');assert.equal(errors[1].status,'open');
  assert.equal(await db.appMeta.where('key').startsWith('studyCore:memory:').count(),0,'a correction does not invent independent memory or graduate early');
  const unit=(await db.appMeta.get('studyCore:learningLifecycle'))!.value.units[0];assert.equal(unit.stage,'confirmation');assert.equal(unit.successes,1);
 }finally{db.close();await db.delete();}
});
test('hints still prevent automatic repair even when the chosen answer is correct',async()=>{
 const {db,task,svc}=await setup();try{
  await createStudyCoreService(db,{lifecycle:true}).hint(task.id,'source');await svc.answer({sessionId:'s',taskId:task.id,answer:task.items[0].answerId});
  assert.equal((await db.appMeta.get(MISTAKE_EPISODES_KEY))!.value.episodes[0].status,'open');
 }finally{db.close();await db.delete();}
});
test('a due review selected to repair an error retains repair rights during an acquisition gap',async()=>{
 const {db,b,task,svc,session}=await setup();try{
  const due={...task,id:task.id+':due',studyContract:undefined,intent:'learn' as const,reason:'due' as const};await prepareStudyTask(db,b,due);await db.activeSessions.put({...session,tasks:[due]});
  await svc.answer({sessionId:'s',taskId:due.id,answer:due.items[0].answerId});
  assert.equal((await db.appMeta.get(MISTAKE_EPISODES_KEY))!.value.episodes[0].status,'resolved');
  assert.equal((await db.appMeta.get('studyCore:learningLifecycle'))!.value.units[0].successes,1);
 }finally{db.close();await db.delete();}
});
test('manual correction closes only current errors, advances atomically and survives synchronization',async()=>{
 const {db,b,task,svc,rows}=await setup();try{
  const next=await svc.acceptCorrectAnswer('s',task.id),episodes=(await db.appMeta.get(MISTAKE_EPISODES_KEY))!.value.episodes;
  assert.equal(episodes[0].status,'resolved');assert.equal(episodes[0].resolution,'manual');assert.equal(episodes[1].status,'open');assert.notEqual(next.tasks[0]?.id,task.id);
  assert.equal(await db.reviewEvents.count(),0,'manual correction is not a graded review');assert.equal(await db.appMeta.where('key').startsWith('studyCore:memory:').count(),0);
  assert.equal((await db.appMeta.get('studyCore:attempt:'+task.id))!.value.phase,'skipped');
  const remaining=await synchronizeEpisodes(db,buildGoalCatalog(b,rows),[],undefined,new Date());assert(!remaining.some(e=>e.id==='error'));
  const duplicate=await svc.acceptCorrectAnswer('s',task.id);assert.equal(duplicate.completedCount,next.completedCount,'double tap cannot skip the next question');
  assert.equal((await db.appMeta.get(MISTAKE_EPISODES_KEY))!.value.episodes.find((e:any)=>e.id==='other').status,'open');
 }finally{db.close();await db.delete();}
});
test('manual correction rolls back if advancing the feed cannot be saved',async()=>{
 const {db,task,svc}=await setup();try{
  const fail=()=>{throw Error('test write failure')};db.activeSessions.hook('updating',fail);
  await assert.rejects(()=>svc.acceptCorrectAnswer('s',task.id),/test write failure/);db.activeSessions.hook('updating').unsubscribe(fail);
  assert.equal((await db.appMeta.get(MISTAKE_EPISODES_KEY))!.value.episodes[0].status,'open');assert.equal((await db.activeSessions.get('s'))!.tasks[0].id,task.id);
 }finally{db.close();await db.delete();}
});
test('manual correction defers due directions without adding success or changing memory strength',async()=>{
 const {db,b,task,goal,svc}=await setup();try{
  b.properties![0].learning!.reverse=true;await putBundle(db,b);
  const reverse=associationGoal(b,b.facts[0],'recognition','reverse'),at=new Date(Date.now()-1000);
  for(const g of [goal,reverse])await db.appMeta.put({key:'studyCore:memory:'+g.id,value:{goal:g,goalId:g.id,card:{...createEmptyCard(at),stability:7,difficulty:4},independentAttempts:2,independentSuccesses:1,lastCorrect:false}});
  await svc.acceptCorrectAnswer('s',task.id);
  for(const g of [goal,reverse]){const m=(await db.appMeta.get('studyCore:memory:'+g.id))!.value;assert(new Date(m.card.due).getTime()>Date.now()+290000);assert.equal(m.card.stability,7);assert.equal(m.card.difficulty,4);assert.equal(m.independentSuccesses,1);assert.equal(m.independentAttempts,2);}
 }finally{db.close();await db.delete();}
});
test('a stale manual request cannot clear or skip a different question',async()=>{
 const {db,task,svc}=await setup();try{
  await assert.rejects(()=>svc.acceptCorrectAnswer('s','previous-question'),/Вопрос уже сменился/);
  assert.equal((await db.activeSessions.get('s'))!.tasks[0].id,task.id);assert((await db.appMeta.get(MISTAKE_EPISODES_KEY))!.value.episodes.every((e:any)=>e.status==='open'));
 }finally{db.close();await db.delete();}
});
test('manual override after a wrong first attempt closes the error without rewriting that answer',async()=>{
 const {db,task,svc}=await setup();try{
  const wrong=task.options.find(o=>o.id!==task.items[0].answerId)!.id;await svc.answer({sessionId:'s',taskId:task.id,answer:wrong});
  await svc.acceptCorrectAnswer('s',task.id);
  assert.equal((await db.appMeta.get(MISTAKE_EPISODES_KEY))!.value.episodes[0].status,'resolved');
  const attempt=(await db.appMeta.get('studyCore:attempt:'+task.id))!.value;assert.equal(attempt.firstAnswer,wrong);assert.equal(attempt.results[0].correct,false);
 }finally{db.close();await db.delete();}
});
