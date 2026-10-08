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
async function install(d:EngiDB,svc:ReturnType<typeof createTrainerService>,b:Bundle,format='match',repeated=false){
 const session=await svc.startGoalFeed('all',format),enabled=(await d.learningState.toArray()).map(r=>r.payload),atomic=goalCandidates(b,enabled,'all',format).filter(t=>!repeated||['s0','s3','s1'].includes(t.items[0].entityId)),task=groupCandidates(b,atomic,new Set(),3)[0];assert(task&&isMapping(task));
 // Normal preparation/attempt opening, then select the deterministic group for exhaustive tests.
 task.studyContract=undefined;session.tasks=[task];await d.activeSessions.put(session);await svc.observeVisibility(session.id,task.id,'question','q:'+task.id,'start');
 return {session,task:(await d.activeSessions.get(session.id))!.tasks[0]};
}
function answer(t:Task){return Object.fromEntries(t.items.map(i=>[i.entityId,i.answerId]));}
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
  const {session,task}=await install(d,svc,b,'categorize');assert.equal(task.options.length,3);assert.equal(task.items.length,3);
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
