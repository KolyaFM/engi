import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import {EngiDB} from '../src/db/engi-db';
import {putBundle} from '../src/db/repositories';
import {prepareDue} from './helpers22';
import {createTrainerService} from '../src/services/trainer-service';
import {goalCandidates} from '../src/services/goal-candidates';
import {groupCandidates} from '../src/services/group-candidates';
import {isMapping} from '../src/lib/engi/questions/timeline';
import {MappingCard} from '../src/components/study/MappingCard';
import type {Bundle,Task} from '../src/lib/engi/types';
import {createEmptyCard,State} from 'ts-fsrs';
const fixture=():Bundle=>({entities:[...Array.from({length:6},(_,n)=>({id:'s'+n,type:'subject',name:'Объект '+n,aliases:[],externalIds:{}})),...Array.from({length:3},(_,n)=>({id:'a'+n,type:'answer',name:'Ответ '+n,aliases:[],externalIds:{}}))],facts:Array.from({length:6},(_,n)=>({id:'f'+n,entityId:'s'+n,key:'rel',valueKind:'entity',valueEntityId:'a'+n%3,verification:'user_confirmed',source:{kind:'manual',name:'Тест'}})),media:[],tags:[],entityTags:[],missing:[],unresolved:[],properties:[{id:'rel',name:'Автор',learnable:true,valueKind:'entity',cardinality:'one',subjectTypes:['subject'],targetTypes:['answer']}],entityTypes:[{id:'subject',name:'Объект'},{id:'answer',name:'Ответ'}]});
async function run(fn:(d:EngiDB,svc:ReturnType<typeof createTrainerService>,b:Bundle)=>Promise<void>){const d=new EngiDB('groups-'+crypto.randomUUID()),b=fixture();try{await putBundle(d,b);await prepareDue(d);await fn(d,createTrainerService(d),b);}finally{d.close();await d.delete();}}
async function install(d:EngiDB,svc:ReturnType<typeof createTrainerService>,b:Bundle,format='match',repeated=false,distinct=false){
 const session=await svc.startGoalFeed('all',format),enabled=(await d.learningState.toArray()).map(r=>r.payload),atomic=goalCandidates(b,enabled,'all',format).filter(t=>(!repeated||['s0','s3','s1'].includes(t.items[0].entityId))&&(!distinct||['s0','s1','s2'].includes(t.items[0].entityId))),task=groupCandidates(b,atomic,new Set(),3)[0];assert(task&&isMapping(task));
 // Normal preparation/attempt opening, then select the deterministic group for exhaustive tests.
 task.studyContract=undefined;session.tasks=[task];await d.activeSessions.put(session);await svc.observeVisibility(session.id,task.id,'question','q:'+task.id,'start');
 return {session,task:(await d.activeSessions.get(session.id))!.tasks[0]};
}
function answer(t:Task){return Object.fromEntries(t.items.map(i=>[i.entityId,i.answerId]));}
test('progressive categories accept the same author twice and resume each solved object',()=>run(async(d,svc,b)=>{
 const {session,task}=await install(d,svc,b,'categorize',true);
 const repeated=task.items.filter(i=>i.answerId===task.items.find(i=>i.entityId==='s0')!.answerId);
 assert.equal(repeated.length,2);
 for(const [n,item] of repeated.entries()){
  const result=await svc.answerMatchPair({sessionId:session.id,taskId:task.id,entityId:item.entityId,answerId:item.answerId,requestId:'repeat:'+n});
  assert.equal(result.correct,true);assert.equal(result.complete,false);
  const episode=await svc.observeVisibility(session.id,task.id,'matched-pairs','category-exposure:'+n,'start');assert(episode);
 }
 assert.equal(Object.keys((await svc.getResumableSession())!.interaction!.matching!.matched).length,2);
 const last=task.items.find(i=>!repeated.includes(i))!;
 const result=await svc.answerMatchPair({sessionId:session.id,taskId:task.id,entityId:last.entityId,answerId:last.answerId,requestId:'last-category'});
 assert.equal(result.complete,true);assert((await svc.getFeedback(task.id)).matchingComplete);
}));
test('six matching permutations independently grade three goals, never reschedule on duplicate answer',async()=>{
 const permutations=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
 for(const permutation of permutations)await run(async(d,svc,b)=>{
  const {session,task}=await install(d,svc,b);assert.equal(task.items.length,3);
  const values=Object.fromEntries(task.items.map((i,n)=>[i.entityId,task.items[permutation[n]].answerId]));
  const result=await svc.answer({sessionId:session.id,taskId:task.id,answer:values});assert.equal(result.pending,false);
  const memories=await d.appMeta.where('key').startsWith('studyCore:memory:').toArray();assert.equal(memories.length,3);
  for(const target of result.event!.payload.targets){const n=task.studyContract!.primaryGoals.findIndex(g=>g.id===target.targetId);assert.equal(target.correct,permutation[n]===n);assert.equal(target.fsrsUpdated,true);}
  assert.equal((await svc.getDayPlan()).newGoalIds.length,3);
  await svc.answer({sessionId:session.id,taskId:task.id,answer:answer(task)});assert.deepEqual(await d.appMeta.where('key').startsWith('studyCore:memory:').toArray(),memories);
 });
});
test('partial mapping drafts survive resume, invalid or incomplete submissions do not consume budget',()=>run(async(d,svc,b)=>{
 const {session,task}=await install(d,svc,b);const partial={[task.items[0].entityId]:task.items[0].answerId};
 await svc.saveInteraction(session.id,task.id,{mapping:partial});assert.deepEqual((await svc.getResumableSession())!.interaction!.mapping,partial);
 await assert.rejects(svc.answer({sessionId:session.id,taskId:task.id,answer:partial}),/complete mapping/);
 const repeated=Object.fromEntries(task.items.map(i=>[i.entityId,task.items[0].answerId]));await assert.rejects(svc.answer({sessionId:session.id,taskId:task.id,answer:repeated}),/placed once/);
 assert.equal(await d.appMeta.where('key').startsWith('studyCore:memory:').count(),0);assert.equal((await svc.getDayPlan()).newGoalIds.length,0);
}));
test('hinting a bijective group blocks every independent credit, and skipping a group writes no memory',()=>run(async(d,svc,b)=>{
 const {session,task}=await install(d,svc,b);await svc.observeVisibility(session.id,task.id,'source','source','start');
 const result=await svc.answer({sessionId:session.id,taskId:task.id,answer:answer(task)});assert(result.event!.payload.targets.every((t:any)=>!t.independent));assert.equal(await d.appMeta.where('key').startsWith('studyCore:memory:').count(),0);
 const next=await install(d,svc,b);await svc.advanceFeed(next.session.id,true,next.task.id);assert.equal(await d.appMeta.where('key').startsWith('studyCore:memory:').count(),0);
}));
test('changed non-first member or suspended member invalidates the entire group before credit',async()=>{
 for(const change of ['fact','suspend'])await run(async(d,svc,b)=>{
  const {session,task}=await install(d,svc,b),member=task.items[1];
  if(change==='fact')await d.facts.update(member.factId!,{valueEntityId:'a-other'});else{const row=(await d.learningState.get(member.targetId))!;row.payload.status='suspended';await d.learningState.put(row);}
  const result=await svc.answer({sessionId:session.id,taskId:task.id,answer:answer(task)});assert(result.feedback.invalidContent);assert.equal(await d.appMeta.where('key').startsWith('studyCore:memory:').count(),0);
 });
});
test('categorization supports repeated categories and grades each relation separately',()=>run(async(d,svc,b)=>{
 const {session,task}=await install(d,svc,b,'categorize',true);assert.equal(task.options.length,2);assert.equal(task.items.length,3);const values=answer(task),first=task.items[0];values[first.entityId]=task.options.find(o=>o.id!==first.answerId)!.id;
 const result=await svc.answer({sessionId:session.id,taskId:task.id,answer:values});assert.equal(result.event!.payload.targets.filter((t:any)=>t.correct).length,task.items.length-1);
 assert.equal(result.event!.payload.targets.filter((t:any)=>t.fsrsUpdated).length,task.items.length);
}));
test('all 27 category assignments grade each goal by its own answer, including repeated choices',async()=>{
 for(let code=0;code<27;code++)await run(async(d,svc,b)=>{
  const {session,task}=await install(d,svc,b,'categorize',false,true);assert.equal(task.options.length,3);assert.equal(task.items.length,3);
  const values=Object.fromEntries(task.items.map((i,n)=>[i.entityId,task.options[Math.floor(code/3**n)%3].id]));
  const result=await svc.answer({sessionId:session.id,taskId:task.id,answer:values});
  for(const [n,target] of result.event!.payload.targets.entries())assert.equal(target.correct,values[task.items[n].entityId]===task.items[n].answerId);
  assert.equal((await svc.getDayPlan()).newGoalIds.length,3);
 });
});
test('group builder excludes visually indistinguishable subject cues',()=>run(async(d,_svc,b)=>{
 for(const e of b.entities.filter(e=>e.type==='subject'))e.name='Одинаковое имя';
 const tasks=goalCandidates(b,(await d.learningState.toArray()).map(r=>r.payload));assert.equal(groupCandidates(b,tasks,new Set(),3).length,0);
}));
test('another screen reviewing a non-first goal prevents early repeated credit for that member',()=>run(async(d,svc,b)=>{
 const {session,task}=await install(d,svc,b),goal=task.studyContract!.primaryGoals[1],key='studyCore:memory:'+goal.id;
 const value={goalId:goal.id,goal,card:{...createEmptyCard(),state:State.Review,due:new Date(Date.now()+2*86400000),reps:1,stability:5,difficulty:5},independentAttempts:1,independentSuccesses:1};await d.appMeta.put({key,value});
 const result=await svc.answer({sessionId:session.id,taskId:task.id,answer:answer(task)});
 assert.equal(result.event!.payload.targets.filter((t:any)=>t.fsrsUpdated).length,2);assert.deepEqual((await d.appMeta.get(key))!.value,value);assert.equal((await svc.getDayPlan()).newGoalIds.length,2);
}));
test('group composition respects new-goal capacity and never groups due goals with fresh goals',()=>run(async(d,_svc,b)=>{
 const tasks=goalCandidates(b,(await d.learningState.toArray()).map(r=>r.payload));assert.equal(groupCandidates(b,tasks,new Set(),1).length,0);
 const limited=groupCandidates(b,tasks,new Set(),2);assert(limited.length);assert(limited.every(t=>t.items.length===2));
 const known=new Set(tasks.slice(0,4).flatMap(t=>t.studyContract!.primaryGoals.map(g=>g.id)));
 for(const group of groupCandidates(b,tasks,known,3)){const flags=group.studyContract!.primaryGoals.map(g=>known.has(g.id));assert(flags.every(f=>f===flags[0]));}
}));
test('rendered group restores a saved answer and feedback shows every correction',()=>run(async(d,svc,b)=>{
 const {task}=await install(d,svc,b);const values=answer(task),first=task.items[0];values[first.entityId]=task.options.find(o=>o.id!==first.answerId)!.id;
 const html=renderToStaticMarkup(createElement(MappingCard,{task,feedback:{chosen:values},busy:false,onPersist:()=>{},onSubmit:()=>{},onNext:()=>{},onMediaReady:()=>{},onMediaFail:()=>{}}));
 assert(html.includes('Правильно: '+first.answer));assert(html.includes(`из ${task.items.length}`));assert(html.includes('Дальше'));assert(!html.includes('Проверить</button>'));
}));

test('matching pair commits its first error immediately and correction only resolves the tiles',()=>run(async(d,svc,b)=>{
 const {session,task}=await install(d,svc,b),item=task.items[0],goal=task.studyContract!.primaryGoals[0];
 const input={sessionId:session.id,taskId:task.id,entityId:item.entityId,answerId:task.options.find(o=>o.id!==item.answerId)!.id,requestId:'first'};
 const wrong=await svc.answerMatchPair(input);assert.equal(wrong.correct,false);assert.equal(wrong.complete,false);
 const first=(await d.appMeta.get('studyCore:memory:'+goal.id))!.value;
 assert.equal(first.independentAttempts,1);assert.equal(first.independentSuccesses,0);
 assert.equal(await d.appMeta.where('key').startsWith('studyCore:memory:').count(),1);
 assert.deepEqual((await svc.getResumableSession())!.interaction!.matching!.matched,{});
 const restored=createTrainerService(d),right=await restored.answerMatchPair({...input,answerId:item.answerId,requestId:'correction'});
 assert.equal(right.correct,true);assert.deepEqual(right.interaction!.matching!.matched,{[item.entityId]:item.answerId});
 assert.deepEqual((await d.appMeta.get('studyCore:memory:'+goal.id))!.value,first);
 assert.equal((await d.activeSessions.get(session.id))!.tasks[0].id,task.id);
 await assert.rejects(svc.answer({sessionId:session.id,taskId:task.id,answer:answer(task)}),/пары/);
}));

test('progressive matching grades other pairs separately and excludes the untested last pair',()=>run(async(d,svc,b)=>{
 const {session,task}=await install(d,svc,b);
 for(const [n,item] of task.items.entries()){
  const result=await svc.answerMatchPair({sessionId:session.id,taskId:task.id,entityId:item.entityId,answerId:item.answerId,requestId:'pair:'+n});
  assert.equal(result.correct,true);assert.equal(result.complete,n===task.items.length-1);
 }
 const rows=await d.appMeta.where('key').startsWith('studyCore:memory:').toArray();assert.equal(rows.length,2);
 assert.equal((await svc.getDayPlan()).newGoalIds.length,2);
 assert.equal(await d.appMeta.get('studyCore:memory:'+task.studyContract!.primaryGoals[2].id),undefined);
 assert((await svc.getFeedback(task.id)).matchingComplete);
 await svc.advanceFeed(session.id,false,task.id);
 assert.equal(await d.appMeta.where('key').startsWith('studyCore:memory:').count(),2);
}));

test('matching requests are idempotent and a previously failed last pair keeps its error',()=>run(async(d,svc,b)=>{
 const {session,task}=await install(d,svc,b),last=task.items[2],input={sessionId:session.id,taskId:task.id,entityId:last.entityId,answerId:task.items[0].answerId,requestId:'same'};
 await Promise.all([svc.answerMatchPair(input),svc.answerMatchPair(input)]);
 const key='studyCore:memory:'+task.studyContract!.primaryGoals[2].id,first=(await d.appMeta.get(key))!.value;
 assert.equal(first.independentAttempts,1);assert.equal(first.confusions[input.answerId],1);
 for(const [n,item] of task.items.slice(0,2).entries())await svc.answerMatchPair({sessionId:session.id,taskId:task.id,entityId:item.entityId,answerId:item.answerId,requestId:'other:'+n});
 await svc.answerMatchPair({...input,answerId:last.answerId,requestId:'last'});
 assert.deepEqual((await d.appMeta.get(key))!.value,first);
 assert.equal((await svc.getResumableSession())!.interaction!.matching!.history.length,4);
}));

test('hinted progressive matching does not credit any pair',()=>run(async(d,svc,b)=>{
 const {session,task}=await install(d,svc,b);await svc.observeVisibility(session.id,task.id,'source','matching-source','start');
 for(const [n,item] of task.items.entries())await svc.answerMatchPair({sessionId:session.id,taskId:task.id,entityId:item.entityId,answerId:item.answerId,requestId:'hinted:'+n});
 assert.equal(await d.appMeta.where('key').startsWith('studyCore:memory:').count(),0);assert.equal((await svc.getDayPlan()).newGoalIds.length,0);
}));

test('failed pair history write rolls back memory and permits a safe retry',()=>run(async(d,svc,b)=>{
 const {session,task}=await install(d,svc,b),item=task.items[0],input={sessionId:session.id,taskId:task.id,entityId:item.entityId,answerId:item.answerId,requestId:'retry'};
 const fail=()=>{throw Error('pair persistence failure');};d.reviewEvents.hook('creating',fail);
 await assert.rejects(svc.answerMatchPair(input),/pair persistence failure/);d.reviewEvents.hook('creating').unsubscribe(fail);
 assert.equal(await d.appMeta.where('key').startsWith('studyCore:memory:').count(),0);
 assert.equal((await svc.getResumableSession())!.interaction?.matching,undefined);
 await svc.answerMatchPair(input);assert.equal(await d.appMeta.where('key').startsWith('studyCore:memory:').count(),1);
}));

test('matched-pair disclosure exposes only solved facts and its episode stays immutable as more pairs are found',()=>run(async(d,svc,b)=>{
 const {session,task}=await install(d,svc,b),[first,second,last]=task.items;
 await svc.answerMatchPair({sessionId:session.id,taskId:task.id,entityId:first.entityId,answerId:first.answerId,requestId:'disclosure-first'});
 const episode=await svc.observeVisibility(session.id,task.id,'matched-pairs','matched-first','start');
 assert(episode!.claims.some(c=>c.key==='fact:'+first.factId));
 assert(!episode!.claims.some(c=>c.key==='fact:'+second.factId||c.key==='fact:'+last.factId));
 assert.equal((await d.appMeta.get('studyCore:exposure:'+task.studyContract!.primaryGoals[1].id)),undefined);
 await svc.answerMatchPair({sessionId:session.id,taskId:task.id,entityId:second.entityId,answerId:second.answerId,requestId:'disclosure-second'});
 const closed=await svc.observeVisibility(session.id,task.id,'matched-pairs','matched-first','end');assert.deepEqual(closed!.claims,episode!.claims);
 const next=await svc.observeVisibility(session.id,task.id,'matched-pairs','matched-second','start');assert.equal(next!.claims.length,2);
}));

test('content changes after a first pair preserve its history and invalidate remaining pairs',()=>run(async(d,svc,b)=>{
 const {session,task}=await install(d,svc,b),[first,second]=task.items;
 await svc.answerMatchPair({sessionId:session.id,taskId:task.id,entityId:first.entityId,answerId:first.answerId,requestId:'valid-first'});
 const memories=await d.appMeta.where('key').startsWith('studyCore:memory:').toArray();
 await d.facts.update(second.factId!,{valueEntityId:'a-changed'});
 const result=await svc.answerMatchPair({sessionId:session.id,taskId:task.id,entityId:second.entityId,answerId:second.answerId,requestId:'stale-second'});
 assert(result.feedback.invalidContent);assert.deepEqual(await d.appMeta.where('key').startsWith('studyCore:memory:').toArray(),memories);
 assert(await d.reviewEvents.get(task.id+':pair:'+first.entityId));
 await svc.advanceFeed(session.id,false,task.id);
}));

test('skipping a partly completed match preserves first answers without crediting untouched objects',()=>run(async(d,svc,b)=>{
 const {session,task}=await install(d,svc,b),item=task.items[0];
 await svc.answerMatchPair({sessionId:session.id,taskId:task.id,entityId:item.entityId,answerId:item.answerId,requestId:'before-skip'});
 const memories=await d.appMeta.where('key').startsWith('studyCore:memory:').toArray();
 await svc.advanceFeed(session.id,true,task.id);
 assert.deepEqual(await d.appMeta.where('key').startsWith('studyCore:memory:').toArray(),memories);
 assert.equal((await d.appMeta.get('studyCore:attempt:'+task.id))!.value.phase,'skipped');
 assert.equal((await svc.getDayPlan()).newGoalIds.length,1);
}));
