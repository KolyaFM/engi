import 'fake-indexeddb/auto';
import {performance} from 'node:perf_hooks';
import {EngiDB} from '../src/db/engi-db.ts';
import {putBundle} from '../src/db/repositories.ts';
import {prepareDue} from '../tests/helpers22.ts';
import {createTrainerService} from '../src/services/trainer-service.ts';
import {createEmptyCard,State} from 'ts-fsrs';
import {feedPerformance} from '../src/services/feed-performance.ts';
import {isMapping} from '../src/lib/engi/questions/timeline.ts';
const results=[];
const fresh=process.argv.includes('--fresh');
const mixed=process.argv.includes('--mixed');
for(const size of [32,128,256]){
 const d=new EngiDB('latency-'+crypto.randomUUID()),svc=createTrainerService(d);
 const b={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[],properties:[{id:'rel',name:'Автор',valueKind:'entity',cardinality:'one',learnable:true,subjectTypes:['subject'],targetTypes:['answer']}],entityTypes:[{id:'subject',name:'Объект'},{id:'answer',name:'Ответ'}]};
 for(let n=0;n<8;n++)b.entities.push({id:'a'+n,type:'answer',name:'Ответ '+n,aliases:[],externalIds:{}});
 for(let n=0;n<size;n++){b.entities.push({id:'s'+n,type:'subject',name:'Объект '+n,aliases:[],externalIds:{}});b.facts.push({id:'f'+n,entityId:'s'+n,key:'rel',valueKind:'entity',valueEntityId:'a'+n%8,verification:'user_confirmed',source:{kind:'manual',name:'Тест'}});}
 try{
  await putBundle(d,b);await prepareDue(d);const snapshotStart=performance.now(),snapshot=await svc.getGoalSnapshot(),snapshotMs=performance.now()-snapshotStart;
  const now=Date.now();if(!fresh)for(const [n,e] of snapshot.goalCatalog.entries())await d.appMeta.put({key:'studyCore:memory:'+e.goal.id,value:{goalId:e.goal.id,goal:e.goal,card:{...createEmptyCard(),state:State.Review,due:new Date(now+(n<16?-1000:86400000*2)),last_review:new Date(now-86400000),stability:10,difficulty:5,reps:5},independentAttempts:5,independentSuccesses:5,lastCorrect:true}});
  const start=performance.now();let session=await svc.startGoalFeed('all',mixed?'mixed':'choice');const startMs=performance.now()-start,runs=[];feedPerformance.start();
  for(let n=0;n<6&&session.tasks.length;n++){
   const task=session.tasks[0];if(task.recipe.format==='recall_reveal')await svc.saveInteraction(session.id,task.id,{recallElapsedMs:5000,revealed:true});
   const answer=isMapping(task)?Object.fromEntries(task.items.map(i=>[i.entityId,i.answerId])):task.recipe.format==='recall_reveal'?true:task.items[0].answerId;
   const started=performance.now();await svc.answer({sessionId:session.id,taskId:task.id,answer});const answered=performance.now();session=await svc.advanceFeed(session.id,false,task.id);const advanced=performance.now();runs.push({format:task.recipe.format,items:task.items.length,answerMs:answered-started,advanceMs:advanced-answered});
  }
  results.push({size,fresh,mixed,goals:snapshot.goalCatalog.length,snapshotMs,startMs,runs,trace:feedPerformance.report()});feedPerformance.stop();
 }finally{d.close();await d.delete();}
}
console.log(JSON.stringify(results,null,2));
