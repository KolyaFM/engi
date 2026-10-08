import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import {renderToStaticMarkup} from 'react-dom/server';
import {EngiDB} from '../src/db/engi-db';
import {putBundle,learningRow} from '../src/db/repositories';
import {createTrainerService} from '../src/services/trainer-service';
import {prepareDue} from './helpers22';
import {progress} from '../src/lib/engi/knowledge/progress';
import {goalRetention} from '../src/lib/engi/knowledge/goal-progress';
import {getEntityLearningStatus,getEntityMasterySummary} from '../src/lib/engi/knowledge/decks';
import {todayLearning,localDay} from '../src/lib/engi/knowledge/motivation';
import {goalCandidates} from '../src/services/goal-feed';
import {createEmptyCard} from 'ts-fsrs';
import {setUnitSuspended} from '../src/services/learning-service';
import {saveKnowledge} from '../src/services/knowledge-service';
import {exportBackup,restoreBackup} from '../src/services/backup-service';
import type {Bundle} from '../src/lib/engi/types';
function fixture():Bundle{
 const b:Bundle={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[],entityTypes:[{id:'subject',name:'Объект'},{id:'answer',name:'Ответ'}],properties:[{id:'rel',name:'Автор',valueKind:'entity',cardinality:'one',learnable:true,subjectTypes:['subject'],targetTypes:['answer']}]};
 for(let n=0;n<8;n++){b.entities.push({id:'s'+n,type:'subject',name:'Объект '+n,aliases:[],externalIds:{}},{id:'a'+n,type:'answer',name:'Автор '+n,aliases:[],externalIds:{}});b.facts.push({id:'f'+n,entityId:'s'+n,key:'rel',valueKind:'entity',valueEntityId:'a'+n,completeSet:true,verification:'user_confirmed',source:{kind:'manual',name:'Личное знание'}});}return b;
}
async function run(fn:(d:EngiDB,svc:ReturnType<typeof createTrainerService>,b:Bundle)=>Promise<void>){const d=new EngiDB('goal-ui-'+crypto.randomUUID()),b=fixture();try{await putBundle(d,b);await prepareDue(d);await fn(d,createTrainerService(d),b);}finally{d.close();await d.delete();}}
test('goal snapshot ignores old success and daily counters while including untested supported goals',()=>run(async(d,svc)=>{
 for(const r of await d.learningState.toArray())await d.learningState.put(learningRow({...r.payload,attempts:77,correct:77,firstSuccessAt:new Date().toISOString()}));
 await d.appMeta.put({key:'dailyLearning',value:{day:localDay(),retrievals:77,stability30Gains:77}});
 const s=await svc.getGoalSnapshot(),p=progress(s);assert(p.total>0);assert.equal(p.covered,0);assert.equal(p.new,p.total);assert.equal(p.retention,null);
 assert.equal(todayLearning(s).retrievals,0);assert.equal(getEntityLearningStatus('s0',s),'unlearned');
}));
test('one independent failure counts as checked but never makes its object learned; correction is not another check',()=>run(async(d,svc)=>{
 const feed=await svc.startGoalFeed('all','choice'),t=feed.tasks[0],wrong=t.options.find(o=>o.id!==t.items[0].answerId)!;
 await svc.answer({sessionId:feed.id,taskId:t.id,answer:wrong.id});
 let s=await svc.getGoalSnapshot();assert.equal(progress(s).covered,1);assert.equal(todayLearning(s).retrievals,1);
 assert.equal(getEntityLearningStatus(t.items[0].entityId,s),'in_progress');assert.equal(getEntityMasterySummary(t.items[0].entityId,s).label,'Нужно укрепить');
 await svc.answer({sessionId:feed.id,taskId:t.id,answer:t.items[0].answerId});s=await svc.getGoalSnapshot();assert.equal(progress(s).covered,1);assert.equal(todayLearning(s).retrievals,1);
}));
test('suspension hides both skills from active progress without deleting their historical memory',()=>run(async(d,svc)=>{
 const feed=await svc.startGoalFeed('all','choice'),t=feed.tasks[0];await svc.answer({sessionId:feed.id,taskId:t.id,answer:t.items[0].answerId});
 const before=await svc.getGoalSnapshot(),total=progress(before).total,ids=before.goalCatalog!.filter(e=>e.targetIds.includes(t.items[0].targetId)).map(e=>e.goal.id);
 await setUnitSuspended(t.items[0].targetId,true,d);let after=await svc.getGoalSnapshot();assert.equal(progress(after).total,total-ids.length);assert.equal(progress(after).covered,0);
 assert(await d.appMeta.get('studyCore:memory:'+t.studyContract!.primaryGoals[0].id));
 await setUnitSuspended(t.items[0].targetId,false,d);after=await svc.getGoalSnapshot();assert.equal(progress(after).total,total);assert.equal(progress(after).covered,1);
}));
test('editing a fact removes obsolete revision from current progress while preserving history',()=>run(async(d,svc,b)=>{
 const feed=await svc.startGoalFeed('all','choice'),t=feed.tasks[0];await svc.answer({sessionId:feed.id,taskId:t.id,answer:t.items[0].answerId});
 const fact=b.facts.find(f=>f.id===t.items[0].factId)!,other=t.options.find(o=>o.id!==t.items[0].answerId)!;
 await saveKnowledge({facts:[{...fact,valueEntityId:other.id}]},d);const s=await svc.getGoalSnapshot();assert.equal(progress(s).covered,0);
 assert(!s.goalCatalog!.some(e=>e.goal.id===t.studyContract!.primaryGoals[0].id));assert(await d.appMeta.get('studyCore:memory:'+t.studyContract!.primaryGoals[0].id));
}));
test('refreshing after a waiting deadline schedules a due goal without changing the new-object budget',()=>run(async(d,svc,b)=>{
 const enabled=(await d.learningState.toArray()).map(r=>r.payload),candidates=goalCandidates(b,enabled,'all','choice'),due=new Date(Date.now()+60000);
 for(const t of candidates)for(const goal of t.studyContract!.primaryGoals)await d.appMeta.put({key:'studyCore:memory:'+goal.id,value:{goalId:goal.id,goal,card:{...createEmptyCard(),due},independentAttempts:1,independentSuccesses:1}});
 const s=await svc.startGoalFeed('all','choice');assert.equal(s.exhausted,true);assert.equal(s.waitingUntil,due.toISOString());
 const key='studyCore:memory:'+candidates[0].studyContract!.primaryGoals[0].id,m=(await d.appMeta.get(key))!.value;m.card.due=new Date(Date.now()-1000);await d.appMeta.put({key,value:m});
 const budget=await d.appMeta.get('newLearning'),next=await svc.refreshGoalFeed(s.id);assert.equal(next.exhausted,false);assert(next.tasks.length);assert.equal(next.waitingUntil,undefined);
 assert.deepEqual(await d.appMeta.get('newLearning'),budget);assert.equal(next.completedCount,0);
 await assert.rejects(svc.refreshGoalFeed(s.id),/Сначала завершите/);
}));
test('waiting screen labels the actual deadline and disables continuation until it arrives',()=>{
 // Execute the actual TSX component; only its CSS import is omitted for server rendering.
 const source=readFileSync(new URL('../src/components/study/StopStudyCard.tsx',import.meta.url),'utf8'),code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const exports:Record<string,any>={};vm.runInNewContext(code,{exports,require:(id:string)=>id==='react'?React:id==='react/jsx-runtime'?jsxRuntime:{},Date,setInterval,clearInterval});
 const noop=()=>{},render=(time:number)=>renderToStaticMarkup(React.createElement(exports.StopStudyCard,{onMore:noop,onPractice:noop,onExit:noop,onRefresh:noop,waitingUntil:new Date(time).toISOString()}));
 const future=render(Date.now()+60000);assert(future.includes('Следующая проверка после паузы'));assert(/disabled=""[^>]*>Продолжить повторение/.test(future));
 const ready=render(Date.now()-1000);assert(ready.includes('Можно продолжить повторение'));assert(!/disabled=""[^>]*>Продолжить повторение/.test(ready));
});
test('serialized backup restores current goal progress and its independent daily counter',()=>run(async(d,svc)=>{
 const feed=await svc.startGoalFeed('all','choice'),t=feed.tasks[0];await svc.answer({sessionId:feed.id,taskId:t.id,answer:t.items[0].answerId});
 const before=await svc.getGoalSnapshot(),backup=JSON.parse(JSON.stringify(await exportBackup(d))),target=new EngiDB('goal-ui-restored-'+crypto.randomUUID());
 try{await restoreBackup(backup,target);const restored=await createTrainerService(target).getGoalSnapshot();
  assert.deepEqual(progress(restored),progress(before));assert.equal(todayLearning(restored).retrievals,1);
  assert.equal(restored.goalMemories![0].lastCorrect,true);assert.equal(new Date(restored.goalMemories![0].card.due).getTime(),new Date(before.goalMemories![0].card.due).getTime());
 }finally{target.close();await target.delete();}
}));
test('actual object panel renders goal counts and separate skills rather than legacy success totals',()=>run(async(d,svc)=>{
 for(const r of await d.learningState.toArray())await d.learningState.put(learningRow({...r.payload,attempts:77,correct:77}));
 const feed=await svc.startGoalFeed('all','choice'),t=feed.tasks[0];await svc.answer({sessionId:feed.id,taskId:t.id,answer:t.items[0].answerId});
 const snapshot=await svc.getGoalSnapshot(),source=readFileSync(new URL('../src/components/knowledge/GoalEntityLearningPanel.tsx',import.meta.url),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,exports:Record<string,any>={};
 vm.runInNewContext(code,{exports,require:(id:string)=>id==='react'?React:id==='react/jsx-runtime'?jsxRuntime:id.includes('goal-progress')?{goalRetention}:{setUnitSuspended},Date});
 const html=renderToStaticMarkup(React.createElement(exports.GoalEntityLearningPanel,{entityId:t.items[0].entityId,snapshot,onReload:()=>{}}));
 assert(html.includes('Самостоятельных проверок: 1'));assert(!html.includes('Самостоятельных проверок: 77'));
 assert(html.includes('Узнавание'));assert(html.includes('Воспроизведение · самоотчёт'));assert(html.includes('Нужна первая проверка'));
}));
