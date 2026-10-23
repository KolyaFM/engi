import 'fake-indexeddb/auto';
import {test,mock} from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {EngiDB} from '../src/db/engi-db';
import {putBundle,learningRow} from '../src/db/repositories';
import {triagedMemory} from '../src/lib/engi/learning/bootstrap';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {admitAcquisition,emptyLifecycle,ACQUISITION_CONFIRMATION_MS,propertyKey} from '../src/lib/engi/study-core/acquisition';
import {buildGoalCatalog} from '../src/services/goal-catalog';
import {createTrainerService} from '../src/services/trainer-service';
import {startStudyTrace,studyTraceReport,stopStudyTrace} from '../src/services/study-selection-trace';
import type {Bundle} from '../src/lib/engi/types';

test('successful portrait practice rotates knowledge before choosing its presentation',async()=>{
 const at=Date.parse('2026-10-20T12:00:00Z'),reports=[];
 mock.timers.enable({apis:['Date'],now:at});
 const originalRandom=Math.random,originalUUID=crypto.randomUUID;
 try{for(const {count,format} of [{count:3,format:'mixed'},{count:3,format:'choice'},{count:4,format:'mixed'},{count:6,format:'mixed'},{count:12,format:'mixed'}]){
  let seed=123,serial=0;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};crypto.randomUUID=()=>`00000000-0000-4000-8000-${(++serial).toString(16).padStart(12,'0')}`;mock.timers.setTime(at);
  const db=new EngiDB('recall-frequency-'+crypto.randomUUID());try{
   const b:Bundle={entities:Array.from({length:count},(_,n)=>({id:'president'+n,name:n===2?'George Washington':'President '+n,type:'person',aliases:[],externalIds:{}})),facts:[],properties:[],media:Array.from({length:count},(_,n)=>({id:'portrait'+n,entityId:'president'+n,role:'primary',url:'https://example.test/'+n+'.png',license:'Test'})),tags:[],entityTags:[],missing:[],unresolved:[]};
   await putBundle(db,b);
   const enabled=canonicalTargets(b).map(item=>triagedMemory(item,'red','seed',0));await db.learningState.bulkPut(enabled.map(learningRow));
   const catalog=buildGoalCatalog(b,enabled);let ledger=emptyLifecycle();
   for(const entity of b.entities)ledger=admitAcquisition(ledger,entity.id,catalog.filter(e=>e.entityIds.includes(entity.id)).map(e=>e.goal),new Date(at-1000));
   for(const unit of ledger.units){unit.stage='confirmation';unit.successes=0;unit.requiredSuccesses=1;unit.rehearsedAt=new Date(at-1000).toISOString();unit.lastAttemptAt=new Date(at-1000).toISOString();unit.availableAt=new Date(at+ACQUISITION_CONFIRMATION_MS).toISOString();}
   await db.appMeta.bulkPut([{key:'studyCore:learningLifecycle',value:ledger},{key:'introducedEntities',value:b.entities.map(e=>e.id)},{key:'studyPreferences',value:{newCardsPerDay:0}}]);
   startStudyTrace(db,300);const svc=createTrainerService(db);let session=await svc.startGoalFeed('all',format,'daily',{endless:true});
   const screens:{turn:number;object:string;objects:string[];properties:string[];property:string;format:string;intent?:string;reason:string;learningRecall:boolean;correct:boolean;availableAt:string;rehearsedAt?:string}[]=[];
   for(let turn=0;turn<24;turn++){
    const task=session.tasks[0];assert(task);const goal=task.studyContract!.primaryGoals[0];assert(goal);
    await svc.observeVisibility(session.id,task.id,'question','question'+turn,'start');mock.timers.setTime(at+(turn+1)*8000);
    const response=task.studyContract!.response;let answer:unknown;
    if(response.kind==='self-report'){await svc.saveInteraction(session.id,task.id,{revealed:true,recallElapsedMs:5000});await svc.observeVisibility(session.id,task.id,'answer-reveal','reveal'+turn,'start');answer=true;}
    else if(response.kind==='choice')answer=response.expected;
    else if(response.kind==='mapping')answer=Object.fromEntries(response.bindings.filter(b=>!b.support).map(b=>[b.responseKey,b.expected]));
    else throw Error('Unexpected response '+response.kind);
    await svc.answer({sessionId:session.id,taskId:task.id,answer});
    const current=(await db.appMeta.get('studyCore:learningLifecycle'))!.value.units.find((u:any)=>propertyKey(u.goal)===propertyKey(goal));
    screens.push({turn,objects:task.items.map(i=>i.entityId),properties:task.studyContract!.primaryGoals.map(propertyKey),object:task.items[0].entityId,property:propertyKey(goal),format:task.recipe.format,intent:task.intent,reason:task.reason,learningRecall:!!task.learningRecall,correct:true,availableAt:current.availableAt,rehearsedAt:current.rehearsedAt});
    await svc.observeVisibility(session.id,task.id,'feedback','feedback'+turn,'start');await svc.observeVisibility(session.id,task.id,'feedback','feedback'+turn,'end');
    session=await svc.advanceFeed(session.id,false,task.id);
   }
   const recalls=screens.filter(s=>s.format==='recall_reveal');
   const closeReturns=screens.flatMap((screen,n)=>{const previous=screens.slice(0,n).reverse().find(s=>s.property===screen.property);return previous&&n-previous.turn<=3?[{object:screen.object,format:screen.format,from:previous.turn,to:n,gap:n-previous.turn-1}]:[];});
   const closeRecalls=recalls.flatMap((screen,n)=>{const previous=recalls.slice(0,n).reverse().find(s=>s.object===screen.object);return previous&&screen.turn-previous.turn<=3?[{object:screen.object,from:previous.turn,to:screen.turn,gap:screen.turn-previous.turn-1}]:[];});
   assert(screens.every(s=>s.intent==='practice'),'pending confirmations should not earn premature independent credit');
   assert.equal(await db.appMeta.where('key').startsWith('studyCore:memory:').count(),0);
   assert.equal((await svc.getDayPlan()).workload!.mistakes,0,'every answer was correct');
   assert.equal(new Set(screens.flatMap(s=>s.objects)).size,count,'a protected confirmation must not permanently remove a portrait from practice');
   assert(screens.every((s,n)=>n===0||s.properties.length>1||screens[n-1].properties.length>1||s.property!==screens[n-1].property),'no consecutive atomic repeats');
   if(count===3){assert(screens.every((s,n)=>n<3||s.properties.length>1||screens.slice(n-2,n).some(previous=>previous.properties.length>1)||!screens.slice(n-2,n).some(previous=>previous.property===s.property)),'use all three portraits before returning to one');if(format==='mixed'){assert(recalls.length>0,'recall remains available');assert.equal(closeRecalls.length,0,'the same portrait recall cannot return after one or two intervening tasks');}}
   reports.push({count,format,recalls:recalls.length,closeReturns,closeRecalls,screens,trace:studyTraceReport(db)});
   console.log('Recall frequency:',JSON.stringify({count,format,recalls:recalls.length,closeReturns:closeReturns.length,closeRecalls}));
   await mkdir('artifacts',{recursive:true});await writeFile('artifacts/recall-frequency-diagnostics.json',JSON.stringify(reports,null,2));
   if(format==='mixed'){assert(recalls.length<=Math.ceil(screens.length*.1),'optional recall should occupy at most 10% of practice with objective alternatives');for(let n=0;n<screens.length;n++)assert(screens.slice(Math.max(0,n-19),n+1).filter(s=>s.format==='recall_reveal').length<=2,'rolling recall budget');}
   if(count===4){const counts=new Map<string,number>();for(const r of recalls){counts.set(r.object,(counts.get(r.object)??0)+1);assert(!(counts.get(r.object)!>=3&&counts.size<4),'no third recall of one portrait before other portraits receive a chance');}}
  }finally{stopStudyTrace(db);db.close();await db.delete();}
 }}finally{Math.random=originalRandom;crypto.randomUUID=originalUUID;mock.timers.reset();}
 await mkdir('artifacts',{recursive:true});await writeFile('artifacts/recall-frequency-diagnostics.json',JSON.stringify(reports,null,2));
});
