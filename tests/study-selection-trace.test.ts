import 'fake-indexeddb/auto';
import {test,mock} from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {EngiDB} from '../src/db/engi-db';
import {putBundle} from '../src/db/repositories';
import {createTrainerService} from '../src/services/trainer-service';
import {startStudyTrace,stopStudyTrace,studyTraceReport} from '../src/services/study-selection-trace';
import type {Bundle} from '../src/lib/engi/types';

function fixture():Bundle{return {entities:[...Array.from({length:30},(_,n)=>({id:'s'+n,name:'Объект '+n,type:'s',aliases:[],externalIds:{}})),...Array.from({length:8},(_,n)=>({id:'a'+n,name:'Автор '+n,type:'a',aliases:[],externalIds:{}}))],facts:Array.from({length:30},(_,n)=>({id:'f'+n,entityId:'s'+n,key:'author',valueKind:'entity',valueEntityId:'a'+n%8,verification:'user_confirmed',source:{kind:'manual',name:'Трасса'}})),media:[],tags:[],entityTags:[],missing:[],unresolved:[],entityTypes:[{id:'s',name:'Объект'},{id:'a',name:'Автор'}],properties:[{id:'author',name:'Автор',valueKind:'entity',cardinality:'one',learnable:true,subjectTypes:['s'],targetTypes:['a']}]};}

test('selection trace is opt-in, bounded, isolated and cannot be mutated through its report',async()=>{
 const d=new EngiDB('trace-'+crypto.randomUUID());try{
  await putBundle(d,fixture());const svc=createTrainerService(d);let s=await svc.startGoalFeed('all','choice','daily',{endless:true,lifecycle:false});assert.equal(studyTraceReport(d).length,0);
  startStudyTrace(d,2);for(let n=0;n<3;n++)s=await svc.startGoalFeed('all','choice','daily',{endless:true,lifecycle:false});
  const report=studyTraceReport(d);assert.equal(report.length,2);report[0].reason='tampered';assert.notEqual(studyTraceReport(d)[0].reason,'tampered');stopStudyTrace(d);assert.equal(studyTraceReport(d).length,0);
 }finally{d.close();await d.delete();}
});

test('enabling diagnostics does not change the seeded task sequence or memory transitions',async()=>{
 const at=new Date(2026,9,8,10).getTime();mock.timers.enable({apis:['Date'],now:at});const originalRandom=Math.random,sequences=[],memories=[];
 try{for(const enabled of [false,true]){
  const d=new EngiDB('passive-trace-'+crypto.randomUUID());let seed=29;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  try{mock.timers.setTime(at);await putBundle(d,fixture());if(enabled)startStudyTrace(d);const svc=createTrainerService(d);let s=await svc.startGoalFeed('all','choice','daily',{endless:true,lifecycle:false});const sequence=[];
   for(let n=0;n<20;n++){sequence.push(s.intro?['intro',s.intro.entityId]:[s.tasks[0].intent,s.tasks[0].recipe.format,s.tasks[0].items[0].entityId]);mock.timers.setTime(at+n*8000+2000);
    if(s.intro)s=await svc.completeIntro(s.id);else{const q=s.tasks[0];await svc.answer({sessionId:s.id,taskId:q.id,answer:q.items[0].answerId});s=await svc.advanceFeed(s.id,false,q.id);}
   }
   sequences.push(sequence);memories.push(await d.appMeta.where('key').startsWith('studyCore:memory:').toArray());
  }finally{stopStudyTrace(d);d.close();await d.delete();}
 }assert.deepEqual(sequences[1],sequences[0]);assert.deepEqual(memories[1],memories[0]);
 }finally{Math.random=originalRandom;mock.timers.reset();}
});

test('clean correct-answer feed completes daily first checks and keeps introducing varied knowledge',async()=>{
 const at=new Date(2026,9,8,10).getTime();mock.timers.enable({apis:['Date'],now:at});
 const scenarios=[];
 try{for(const limit of [5,10]){
  const d=new EngiDB('trace-clean-'+limit+'-'+crypto.randomUUID());let seed=17;const originalRandom=Math.random;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  try{
   let now=at;mock.timers.setTime(now);await putBundle(d,fixture());await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:limit}});startStudyTrace(d,400);
   const svc=createTrainerService(d);let s=await svc.startGoalFeed('all','choice','daily',{endless:true,lifecycle:false});
   for(let n=0;n<80;n++){
    assert(!s.exhausted);const episode='screen-'+n;
    if(s.intro){await svc.observeIntroVisibility(s.id,episode,'start');now+=2000;mock.timers.setTime(now);await svc.observeIntroVisibility(s.id,episode,'end');s=await svc.completeIntro(s.id);}
    else {
     const q=s.tasks[0];assert(q);assert.equal(q.recipe.format,'choice');await svc.observeVisibility(s.id,q.id,'question',episode,'start');now+=2000;mock.timers.setTime(now);
     await svc.answer({sessionId:s.id,taskId:q.id,answer:q.items[0].answerId});await svc.observeVisibility(s.id,q.id,'question',episode,'end');
     await svc.observeVisibility(s.id,q.id,'feedback',episode+':feedback','start');now+=2000;mock.timers.setTime(now);await svc.observeVisibility(s.id,q.id,'feedback',episode+':feedback','end');
     now+=4000;mock.timers.setTime(now);s=await svc.advanceFeed(s.id,false,q.id);
    }
   }
   const trace=studyTraceReport(d),selected=trace.filter(e=>e.kind==='selection').slice(0,80),games=selected.filter(e=>e.reason==='game'),answers=trace.filter(e=>e.kind==='answer');
   const plan=await svc.getDayPlan(),summary={limit,screens:80,intros:selected.filter(e=>e.intro).length,games:games.length,checks:selected.filter(e=>e.intent==='learn').length,
    uniqueQuestionObjects:new Set(selected.filter(e=>!e.intro).flatMap(e=>e.objects??[])).size,correct:answers.every(e=>(e.results as {correct:boolean}[]).every(r=>r.correct)),
    newDone:plan.newGoalIds.length,newTarget:plan.newTarget,activeLearning:plan.learningGoalIds?.length,mistakes:plan.mistakes?.length,
    blockedGameScreens:games.filter(e=>Number((e.counters as {newLeft:number}).newLeft)>0&&Number((e.counters as {activeFirstChecks:number}).activeFirstChecks)>=3).length};
   assert.equal(summary.correct,true);assert.equal(summary.mistakes,0);
   assert(summary.newDone>=limit,`daily first checks stalled: ${JSON.stringify(summary)}`);
   assert(summary.games<40,`most screens still repeat correct answers: ${JSON.stringify(summary)}`);
   assert(summary.uniqueQuestionObjects>limit,'additional knowledge never enters the feed');
   scenarios.push({summary,trace});console.log('Selection trace: '+JSON.stringify(summary));
  }finally{stopStudyTrace(d);d.close();await d.delete();Math.random=originalRandom;}
 }
 const compact=scenarios.map(({summary,trace})=>({summary,trace:trace.map(e=>e.kind!=='selection'?e:{...e,candidates:undefined,blocks:(e.candidates as {blocks:string[]}[]).reduce((counts,entry)=>{for(const block of entry.blocks)counts[block]=(counts[block]??0)+1;return counts;},{} as Record<string,number>),selectedCandidates:(e.candidates as {goalId:string}[]).filter(c=>e.goals?.includes(c.goalId))})}));
 await mkdir('artifacts',{recursive:true});await writeFile('artifacts/study-selection-trace.json',JSON.stringify({scenario:'clean start, all correct, visible question and feedback, 80 screens',scenarios:compact},null,2)+'\n');
 }finally{mock.timers.reset();}
});
