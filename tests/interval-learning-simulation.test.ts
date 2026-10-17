import 'fake-indexeddb/auto';import {test,mock} from 'node:test';import assert from 'node:assert/strict';
import {intervals} from './helpers-intervals';import {EngiDB} from '../src/db/engi-db';import {putBundle} from '../src/db/repositories';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';import {triagedMemory} from '../src/lib/engi/learning/bootstrap';import {learningRow} from '../src/db/repositories';
import {associationGoal} from '../src/lib/engi/study-core/compiler';import {admitAcquisition,emptyLifecycle} from '../src/lib/engi/study-core/acquisition';import {createTrainerService} from '../src/services/trainer-service';
test('thirty days of interval learning reach full checks, repair partial errors and preserve property counts',async()=>{
 const d=new EngiDB('interval-simulation-'+crypto.randomUUID()),b=intervals(),at=Date.UTC(2026,9,16,9),formats=new Set<string>();mock.timers.enable({apis:['Date'],now:at});
 try{await putBundle(d,b);const units=canonicalTargets(b),memories=units.map(i=>triagedMemory(i,'red','s',0));await d.learningState.bulkPut(memories.map(learningRow));let ledger=emptyLifecycle();for(const f of b.facts)ledger=admitAcquisition(ledger,f.entityId,[associationGoal(b,f,'recognition')],new Date(at));await d.appMeta.put({key:'studyCore:learningLifecycle',value:ledger});await d.appMeta.put({key:'introducedEntities',value:b.entities.map(e=>e.id)});
  const svc=createTrainerService(d);let s=await svc.startGoalFeed('all','mixed','daily',{endless:true});let endpointError=false;
  for(let day=0;day<30;day++)for(let n=0;n<10;n++){
   mock.timers.setTime(at+day*86400000+(n+1)*61000);
   if(s.exhausted)s=await svc.refreshGoalFeed(s.id);if(s.intro){s=await svc.completeIntro(s.id);continue;}const task=s.tasks[s.currentPosition];assert(task,'continuous interval feed has a playable task');formats.add(task.intervalExercise?.kind??task.recipe.format);
   const rule=task.studyContract!.response;
   if(rule.kind==='mapping'){for(const binding of rule.bindings.filter(b=>!b.support))await svc.answerMatchPair({sessionId:s.id,taskId:task.id,entityId:binding.responseKey,answerId:binding.expected,requestId:crypto.randomUUID()});}
   else if(rule.kind==='self-report'){await svc.saveInteraction(s.id,task.id,{revealed:true,recallElapsedMs:5000});await svc.answer({sessionId:s.id,taskId:task.id,answer:true});}
   else if(rule.kind==='practice-view'){s=await svc.advanceFeed(s.id,true,task.id);continue;}
   else if('expected' in rule){if(task.intervalExercise?.kind==='endpoint'&&!endpointError){await svc.answer({sessionId:s.id,taskId:task.id,answer:task.options.find(o=>o.id!==rule.expected)!.id});endpointError=true;}await svc.answer({sessionId:s.id,taskId:task.id,answer:rule.expected});}
   s=await svc.advanceFeed(s.id,false,task.id);
  }
  const after=(await d.appMeta.get('studyCore:learningLifecycle'))!.value;assert.equal(after.units.length,4);assert(after.units.every((u:any)=>u.stage==='completed'));assert(formats.has('choice'));assert(formats.has('endpoint'));assert(formats.has('bands'));assert.equal((await svc.getDayPlan()).workload!.mistakes,0);assert(endpointError);console.log('Interval simulation formats: '+[...formats].join(', '));
 }finally{mock.timers.reset();d.close();await d.delete();}
});
