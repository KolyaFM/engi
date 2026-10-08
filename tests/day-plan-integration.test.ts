import 'fake-indexeddb/auto';
import {test,after,mock} from 'node:test';
import assert from 'node:assert/strict';
import {EngiDB} from '../src/db/engi-db';
import {putBundle} from '../src/db/repositories';
import {prepareDue} from './helpers22';
import {createTrainerService} from '../src/services/trainer-service';
import {dayPlanSummary} from '../src/lib/engi/study-core/day-plan';
import {DAY_PLAN_KEY} from '../src/services/day-plan-service';
import {studyWorkload} from '../src/lib/engi/study-core/workload';
import type {Bundle} from '../src/lib/engi/types';
import {createEmptyCard,State} from 'ts-fsrs';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import {renderToStaticMarkup} from 'react-dom/server';
import {synchronizeDayPlan,dayBoundary} from '../src/lib/engi/study-core/day-plan';
// These scenarios require ten-minute steps to stay within the same local day.
// Freeze only Date at local noon; midnight deferral has separate explicit tests.
mock.timers.enable({apis:['Date'],now:new Date(2026,9,8,12,0,0).getTime()});
after(()=>mock.timers.reset());
function fixture(many=false):Bundle{
 const b:Bundle={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[],entityTypes:[{id:'subject',name:'Объект'},{id:'answer',name:'Ответ'}],properties:[{id:'rel',name:'Автор',valueKind:'entity',cardinality:many?'many':'one',learnable:true,subjectTypes:['subject'],targetTypes:['answer']}]};
 for(let n=0;n<8;n++){b.entities.push({id:'s'+n,type:'subject',name:'Объект '+n,aliases:[],externalIds:{}},{id:'a'+n,type:'answer',name:'Автор '+n,aliases:[],externalIds:{}});b.facts.push({id:'f'+n,entityId:'s'+n,key:'rel',valueKind:'entity',valueEntityId:'a'+n,completeSet:true,verification:'user_confirmed',source:{kind:'manual',name:'Личное знание'}});}
 if(many)b.facts.push({...b.facts[0],id:'extra',valueEntityId:'a1'});return b;
}
async function run(fn:(d:EngiDB,svc:ReturnType<typeof createTrainerService>)=>Promise<void>,many=false){const d=new EngiDB('day-integration-'+crypto.randomUUID());try{await putBundle(d,fixture(many));await prepareDue(d);await fn(d,createTrainerService(d));}finally{d.close();await d.delete();}}
test('live feed admits three new goals and stops admitting a fourth while learning steps wait',()=>run(async(d,svc)=>{
 const legacy=await d.learningState.toArray();
 for(let i=0;i<3;i++){const s=await svc.startGoalFeed('all','choice'),t=s.tasks[0];assert(t);await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});}
 const p=(await svc.getDayPlan())!,summary=dayPlanSummary(p);assert.equal(p.newGoalIds.length,3);assert.equal(summary.new.left,0);assert.equal(summary.reinforce.left,3);
 const fourth=await svc.startGoalFeed('all','choice');assert(fourth.exhausted);assert.equal(fourth.tasks.length,0);assert(fourth.waitingUntil);assert.deepEqual(await d.learningState.toArray(),legacy);
}));
test('first wrong answer updates the plan once; correction and repeated submission preserve it',()=>run(async(_d,svc)=>{
 const s=await svc.startGoalFeed('all','choice'),t=s.tasks[0],wrong=t.options.find(o=>o.id!==t.items[0].answerId)!;
 await Promise.all([svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id}),svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id})]);
 const p=await svc.getDayPlan();assert.equal(p!.newGoalIds.length,1);assert.equal(p!.reinforce.length,1);assert.equal(p!.processedAttemptIds.length,1);assert.equal(p!.reinforce[0].reason,'mistake');
 await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});assert.deepEqual(await svc.getDayPlan(),p);
 await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});assert.deepEqual(await svc.getDayPlan(),p);
}));
test('early recall reveal and optional practice consume no daily slot',()=>run(async(_d,svc)=>{
 const s=await svc.startGoalFeed('all','recall_reveal'),t=s.tasks[0];
 await svc.saveInteraction(s.id,t.id,{recallElapsedMs:1000,revealed:true,earlyReveal:true});await svc.answer({sessionId:s.id,taskId:t.id,answer:true});
 const p=await svc.startGoalFeed('all','choice','practice'),q=p.tasks[0];await svc.answer({sessionId:p.id,taskId:q.id,answer:q.items[0].answerId});
 const plan=(await svc.getDayPlan())!;assert.equal(plan.newGoalIds.length,0);assert.equal(plan.reinforce.length,0);assert.equal(plan.processedAttemptIds.length,0);
}));
test('failure writing the daily plan rolls back FSRS, attempt and counters, and permits one retry',()=>run(async(d,svc)=>{
 const s=await svc.startGoalFeed('all','choice'),t=s.tasks[0],key='studyCore:memory:'+t.studyContract!.primaryGoals[0].id;
 const before=await svc.getDayPlan();let wroteMemory=false;
 const creating=(_key:any,value:any)=>{if(value.key===key)wroteMemory=true;};
 const updating=(_changes:any,_key:any,value:any)=>{if(value.key===DAY_PLAN_KEY&&wroteMemory)throw Error('Injected plan write failure');};
 d.appMeta.hook('creating',creating);d.appMeta.hook('updating',updating);
 try{await assert.rejects(svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId}),/Injected plan write failure/);}
 finally{d.appMeta.hook('creating').unsubscribe(creating);d.appMeta.hook('updating').unsubscribe(updating);}
 assert(wroteMemory);assert.equal(await d.appMeta.get(key),undefined);assert.deepEqual(await svc.getDayPlan(),before);assert.equal(await d.reviewEvents.get(t.id),undefined);
 assert.equal((await d.appMeta.get('studyCore:attempt:'+t.id))!.value.phase,'open');
 await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});assert.equal((await svc.getDayPlan())!.newGoalIds.length,1);assert.equal((await d.appMeta.get(key))!.value.card.reps,1);
}));
test('a complete-set task consumes one goal slot regardless of the number of members',()=>run(async(_d,svc)=>{
 const s=await svc.startGoalFeed('all','multi_choice'),t=s.tasks[0];await svc.answer({sessionId:s.id,taskId:t.id,answer:t.answerSet});
 const p=(await svc.getDayPlan())!;assert.equal(p.newGoalIds.length,1);assert.equal(p.reinforce.length,1);assert.equal(p.processedAttemptIds.length,1);
},true));
test('a mature review failure closes Repeat, then a delayed independent success closes Reinforce',()=>run(async(d,svc)=>{
 const initial=await svc.startGoalFeed('all','choice'),goal=initial.tasks[0].studyContract!.primaryGoals[0],key='studyCore:memory:'+goal.id;
 const yesterday=new Date(Date.now()-86400000);
 await d.appMeta.put({key,value:{goalId:goal.id,goal,card:{...createEmptyCard(yesterday),state:State.Review,due:yesterday,last_review:yesterday,stability:10,difficulty:5,reps:5},independentAttempts:5,independentSuccesses:5,lastCorrect:true}});
 const s=await svc.startGoalFeed('all','choice'),t=s.tasks[0];assert.equal(t.studyContract!.primaryGoals[0].id,goal.id);
 const wrong=t.options.find(o=>o.id!==t.items[0].answerId)!;await svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id});
 const first=(await svc.getDayPlan())!;assert.equal(dayPlanSummary(first).repeat.done,1);assert.equal(dayPlanSummary(first).reinforce.left,1);assert.equal(first.newGoalIds.length,0);
 await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});assert.deepEqual(await svc.getDayPlan(),first);
 // Make only the stored deadline ready; pure FSRS tests cover the real ten-minute interval.
 const m=(await d.appMeta.get(key))!.value;assert.equal(m.card.state,State.Relearning);m.card.due=new Date(Date.now()-1000);await d.appMeta.put({key,value:m});
 const next=await svc.startGoalFeed('all','choice'),q=next.tasks[0];assert.equal(q.studyContract!.primaryGoals[0].id,goal.id);
 await svc.answer({sessionId:next.id,taskId:q.id,answer:q.items[0].answerId});
 assert.equal((await d.appMeta.get(key))!.value.card.state,State.Review);assert.equal(dayPlanSummary((await svc.getDayPlan())!).reinforce.left,0);
}));
test('actual daily panel distinguishes a pending deadline from a completed plan',()=>{
 const code=ts.transpileModule(readFileSync(new URL('../src/components/study/DayPlanPanel.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,exports:Record<string,any>={};
 vm.runInNewContext(code,{exports,require:(id:string)=>id==='react'?React:id==='react/jsx-runtime'?jsxRuntime:id.includes('day-plan')?{dayPlanSummary,dayBoundary}:id.includes('workload')?{studyWorkload}:{},Date,setInterval,clearInterval});
 const p=synchronizeDayPlan(undefined,[],[],new Date());p.reinforce.push({goalId:'g',dueAt:new Date(Date.now()+60000).toISOString(),status:'pending',reason:'mistake'});
 const render=()=>renderToStaticMarkup(React.createElement(exports.DayPlanPanel,{plan:p}));
 assert(render().includes('Следующая проверка по сроку'));assert(!render().includes('План на сегодня выполнен'));
 p.reinforce[0].status='deferred';assert(render().includes('План на сегодня выполнен'));assert(render().includes('перенесены на другой день'));
 p.learningGoalIds=['a','b','c'];p.newTarget=1;assert(render().includes('Новое на паузе'));assert(!render().includes('План на сегодня выполнен'));
});
test('live mixed feed reserves a new-goal turn after three due selections even across session replacement',()=>run(async(d,svc)=>{
 const snapshot=await svc.getGoalSnapshot(),past=new Date(Date.now()-86400000);
 for(const entry of snapshot.goalCatalog!.filter(e=>e.goal.skill==='recognition'))await d.appMeta.put({key:'studyCore:memory:'+entry.goal.id,value:{goalId:entry.goal.id,goal:entry.goal,card:{...createEmptyCard(past),state:State.Review,due:past,last_review:past,stability:10,difficulty:5,reps:5},independentAttempts:5,independentSuccesses:5,lastCorrect:true}});
 const reasons:string[]=[];for(let i=0;i<4;i++){const s=await svc.startGoalFeed('all','mixed');assert(s.tasks.length);reasons.push(s.tasks[0].reason);}
 assert.deepEqual(reasons,['due','due','due','new']);assert.equal((await d.appMeta.get('studyCore:goalSelector'))!.value.decisions,4);
 // Selection is not an answer: replacing screens cannot manufacture daily progress.
 assert.equal((await svc.getDayPlan())!.newGoalIds.length,0);
}));
test('optional practice neither resets nor advances the tracked selector state',()=>run(async(d,svc)=>{
 await svc.startGoalFeed('all','mixed');const before=(await d.appMeta.get('studyCore:goalSelector'))!.value;
 await svc.startGoalFeed('all','mixed','practice');assert.deepEqual((await d.appMeta.get('studyCore:goalSelector'))!.value,before);
 assert.equal((await d.appMeta.get('studyCore:practiceSelector'))!.value.decisions,1);
}));
test('an empty waiting refresh does not age the selector or reserve a new turn',()=>run(async(d,svc)=>{
 const snapshot=await svc.getGoalSnapshot(),future=new Date(Date.now()+60000);
 for(const entry of snapshot.goalCatalog!)await d.appMeta.put({key:'studyCore:memory:'+entry.goal.id,value:{goalId:entry.goal.id,goal:entry.goal,card:{...createEmptyCard(),state:State.Review,due:future,reps:1},independentAttempts:1,independentSuccesses:1,lastCorrect:true}});
 const s=await svc.startGoalFeed('all','mixed');assert(s.exhausted);assert(s.waitingUntil);const before=await d.appMeta.get('studyCore:goalSelector');
 const refreshed=await svc.refreshGoalFeed(s.id);assert(refreshed.exhausted);assert.deepEqual(await d.appMeta.get('studyCore:goalSelector'),before);
}));
test('failed contract persistence rolls back selector reservation together with the new session',()=>run(async(d,svc)=>{
 const hook=(_key:any,value:any)=>{if(value.key.startsWith('studyCore:attempt:'))throw Error('Injected attempt creation failure');};
 d.appMeta.hook('creating',hook);
 try{await assert.rejects(svc.startGoalFeed('all','mixed'),/Injected attempt creation failure/);}
 finally{d.appMeta.hook('creating').unsubscribe(hook);}
 assert.equal(await d.appMeta.get('studyCore:goalSelector'),undefined);assert.equal(await d.activeSessions.count(),0);
 const next=await svc.startGoalFeed('all','mixed');assert(next.tasks.length);assert.equal((await d.appMeta.get('studyCore:goalSelector'))!.value.decisions,1);
}));
test('carried first learning holds live new tasks until FSRS graduation releases a slot',()=>run(async(d,svc)=>{
 const snapshot=await svc.getGoalSnapshot(),goals=snapshot.goalCatalog!.filter(e=>e.goal.skill==='recognition').slice(0,3).map(e=>e.goal),past=new Date(Date.now()-86400000),future=new Date(Date.now()+60000);
 for(const goal of goals)await d.appMeta.put({key:'studyCore:memory:'+goal.id,value:{goalId:goal.id,goal,card:{...createEmptyCard(past),state:State.Learning,due:future,last_review:past,learning_steps:1,reps:1,stability:1,difficulty:5},independentAttempts:1,independentSuccesses:1,lastCorrect:true}});
 const s=await svc.startGoalFeed('all','choice');assert(s.exhausted);assert.equal(s.waitingUntil,future.toISOString());
 const key='studyCore:memory:'+goals[0].id,m=(await d.appMeta.get(key))!.value;m.card.due=new Date(Date.now()-1000);await d.appMeta.put({key,value:m});
 const next=await svc.refreshGoalFeed(s.id),t=next.tasks[0];assert.equal(t.studyContract!.primaryGoals[0].id,goals[0].id);
 await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});assert.equal((await d.appMeta.get(key))!.value.card.state,State.Review);
 assert.equal(dayPlanSummary((await svc.getDayPlan())!).admission.available,1);
 const fresh=await svc.advanceFeed(s.id,false,t.id),q=fresh.tasks[0];assert(q);assert.equal(q.reason,'new');await svc.answer({sessionId:s.id,taskId:q.id,answer:q.items[0].answerId});
 assert.equal(dayPlanSummary((await svc.getDayPlan())!).admission.active,3);
}));
test('a task opened before capacity changed cannot commit a fourth first-learning goal',()=>run(async(d,svc)=>{
 const s=await svc.startGoalFeed('all','choice'),t=s.tasks[0],goal=t.studyContract!.primaryGoals[0],key='studyCore:memory:'+goal.id;
 const catalog=(await svc.getGoalSnapshot()).goalCatalog!,others=catalog.filter(e=>e.goal.skill==='recognition'&&e.goal.id!==goal.id).slice(0,3),past=new Date(Date.now()-86400000),future=new Date(Date.now()+60000);
 for(const {goal:g} of others)await d.appMeta.put({key:'studyCore:memory:'+g.id,value:{goalId:g.id,goal:g,card:{...createEmptyCard(past),state:State.Learning,due:future,last_review:past,reps:1},independentAttempts:1,independentSuccesses:1,lastCorrect:true}});
 await assert.rejects(svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId}),/first-learning limit/);
 assert.equal(await d.appMeta.get(key),undefined);assert.equal(await d.reviewEvents.get(t.id),undefined);assert.equal((await d.appMeta.get('studyCore:attempt:'+t.id))!.value.phase,'open');
 await d.appMeta.delete('studyCore:memory:'+others[0].goal.id);
 await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});assert.equal((await d.appMeta.get(key))!.value.independentAttempts,1);assert.equal((await svc.getDayPlan())!.newGoalIds.length,1);
}));

