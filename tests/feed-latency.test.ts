import 'fake-indexeddb/auto';
import {test} from 'node:test';import assert from 'node:assert/strict';import {writeFile,mkdir} from 'node:fs/promises';
import {EngiDB} from '../src/db/engi-db';import {putBundle,learningRow} from '../src/db/repositories';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';import {triagedMemory} from '../src/lib/engi/learning/bootstrap';import {buildGoalCatalog} from '../src/services/goal-catalog';
import {admitAcquisition,emptyLifecycle} from '../src/lib/engi/study-core/acquisition';import {createTrainerService} from '../src/services/trainer-service';import {feedPerformance} from '../src/services/feed-performance';import type {Bundle} from '../src/lib/engi/types';
test('warm actual feed stays bounded at 50, 500 and 2000 selected properties',async()=>{
 const reports=[];
 for(const size of [50,500,2000]){
  const count=size/10,b:Bundle={entities:Array.from({length:count},(_,n)=>({id:'e'+n,name:'Object '+n,type:'thing',aliases:[],externalIds:{}})),facts:Array.from({length:size},(_,n)=>({id:'f'+n,entityId:'e'+Math.floor(n/10),key:'p'+n%10,valueKind:'number',valueNumber:n,verification:'verified',source:{name:'Test'}})),properties:Array.from({length:10},(_,n)=>({id:'p'+n,name:'Number '+n,valueKind:'number',cardinality:'one',learnable:true,learning:{reverse:false,sort:'off',timeline:'off',missing:'off'}})),media:[],tags:[],entityTags:[],missing:[],unresolved:[]};
  const db=new EngiDB('latency-'+size+'-'+crypto.randomUUID());try{
   await putBundle(db,b);const enabled=canonicalTargets(b).map(i=>triagedMemory(i,'red','fixture',0));await db.learningState.bulkPut(enabled.map(learningRow));const catalog=buildGoalCatalog(b,enabled);let ledger=emptyLifecycle();for(const e of b.entities)ledger=admitAcquisition(ledger,e.id,catalog.filter(c=>c.entityIds.includes(e.id)).map(c=>c.goal),new Date());for(const u of ledger.units){u.stage='confirmation';u.availableAt=new Date(Date.now()+3600000).toISOString();}
   await db.appMeta.bulkPut([{key:'studyCore:learningLifecycle',value:ledger},{key:'introducedEntities',value:b.entities.map(e=>e.id)},{key:'studyPreferences',value:{newCardsPerDay:0}}]);
   const svc=createTrainerService(db);let s=await svc.startGoalFeed('all','mixed','daily',{endless:true});feedPerformance.start();
   for(let n=0;n<12;n++){
    const q=s.tasks[0];assert(q);const r=q.studyContract!.response;
    if(r.kind==='self-report'){await svc.saveInteraction(s.id,q.id,{revealed:true,recallElapsedMs:5000});await svc.answer({sessionId:s.id,taskId:q.id,answer:true});}
    else if('expected'in r)await svc.answer({sessionId:s.id,taskId:q.id,answer:r.expected});else throw Error('Unexpected response '+r.kind);
    s=await svc.advanceFeed(s.id,false,q.id);assert(s.tasks.length);
   }
   const samples=feedPerformance.report();feedPerformance.stop();const counts=samples.filter(s=>s.stage==='materialize').length;assert(counts<=12*16,'materialization is bounded independently of total fact count');
   const selection=samples.filter(s=>s.stage==='selection').map(s=>s.ms).sort((a,b)=>a-b),report={properties:size,selections:selection.length,p50:selection[Math.floor(selection.length/2)],p95:selection[Math.ceil(selection.length*.95)-1],max:selection.at(-1),materializations:counts};reports.push(report);console.log('Warm feed latency:',JSON.stringify(report));
   assert.equal(await db.appMeta.where('key').startsWith('studyCore:memory:').count(),0,'practice does not invent memory');
  }finally{feedPerformance.stop();db.close();await db.delete();}
 }
 await mkdir('artifacts',{recursive:true});await writeFile('artifacts/feed-rhythm-latency.json',JSON.stringify(reports,null,2));
});
