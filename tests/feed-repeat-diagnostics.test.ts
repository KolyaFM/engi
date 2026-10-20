import 'fake-indexeddb/auto';
import {test,mock} from 'node:test';import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';
import {EngiDB} from '../src/db/engi-db';import {putBundle,learningRow} from '../src/db/repositories';import {triagedMemory} from '../src/lib/engi/learning/bootstrap';import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {buildGoalCatalog} from '../src/services/goal-catalog';import {admitAcquisition,emptyLifecycle,ACQUISITION_CONFIRMATION_MS} from '../src/lib/engi/study-core/acquisition';import {createTrainerService} from '../src/services/trainer-service';import {startStudyTrace,studyTraceReport,stopStudyTrace} from '../src/services/study-selection-trace';import type {Bundle} from '../src/lib/engi/types';
const fixture=():Bundle=>({entities:Array.from({length:4},(_,n)=>({id:'e'+n,name:'Object '+n,type:'event',aliases:[],externalIds:{}})),facts:Array.from({length:4},(_,n)=>({id:'f'+n,entityId:'e'+n,key:'year',valueKind:'date',dateStart:(1700+n*10)+'-01-01',dateEnd:(1700+n*10)+'-12-31',datePrecision:'year',verification:'user_confirmed',source:{name:'Diagnostic'}})),properties:[{id:'year',name:'Year',valueKind:'date',cardinality:'one',learnable:true,subjectTypes:['event'],learning:{reverse:false,timeline:'off',missing:'off'}}],media:[],tags:[],entityTags:[],missing:[],unresolved:[]});

test('diagnose consecutive questions with waiting confirmations, first-attempt errors and restored sessions',async()=>{
 const at=Date.parse('2026-10-20T09:00:00Z'),reports=[];mock.timers.enable({apis:['Date'],now:at});
 try{for(const failFirst of [false,true]){
  mock.timers.setTime(at);const d=new EngiDB('repeat-diagnostic-'+crypto.randomUUID());try{
   const b=fixture();await putBundle(d,b);for(const item of canonicalTargets(b))await d.learningState.put(learningRow(triagedMemory(item,'red','seed',0)));
   const enabled=(await d.learningState.toArray()).map(r=>r.payload),catalog=buildGoalCatalog(b,enabled);let ledger=emptyLifecycle();
   for(const e of b.entities)ledger=admitAcquisition(ledger,e.id,catalog.filter(c=>c.entityIds.includes(e.id)).map(c=>c.goal),new Date(at-1000));
   for(const unit of ledger.units)if(unit.entityId!=='e0'){unit.stage='confirmation';unit.successes=1;unit.lastAttemptAt=new Date(at-1000).toISOString();unit.availableAt=new Date(at+ACQUISITION_CONFIRMATION_MS).toISOString();}
   await d.appMeta.put({key:'studyCore:learningLifecycle',value:ledger});await d.appMeta.put({key:'introducedEntities',value:b.entities.map(e=>e.id)});await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:0}});
   startStudyTrace(d,100);const svc=createTrainerService(d);let s=await svc.startGoalFeed('all','choice','daily',{endless:true});const screens=[];
   for(let n=0;n<5;n++){
    mock.timers.setTime(at+(n+1)*1000);const q=s.tasks[0];assert(q);assert.equal(q.items.length,1);const rule=q.studyContract!.response;assert.equal(rule.kind,'choice');if(rule.kind!=='choice')throw Error('Expected choice');
    screens.push({id:q.id,entity:q.items[0].entityId,fact:q.items[0].factId,intent:q.intent,reason:q.reason});
    const resumed=await svc.getResumableSession({endless:true});assert.equal(resumed!.tasks[0].id,q.id,'restoring a pending screen intentionally keeps it');
    await svc.observeVisibility(s.id,q.id,'question','visible'+n,'start');
    if(failFirst&&q.items[0].entityId==='e0'){const wrong=q.options.find(o=>o.id!==rule.expected)!;await svc.answer({sessionId:s.id,taskId:q.id,answer:wrong.id});}
    await svc.answer({sessionId:s.id,taskId:q.id,answer:rule.expected});await svc.observeVisibility(s.id,q.id,'feedback','feedback'+n,'start');await svc.observeVisibility(s.id,q.id,'feedback','feedback'+n,'end');
    s=await svc.advanceFeed(s.id,false,q.id);
   }
   const consecutive=screens.filter((q,n)=>n&&q.fact===screens[n-1].fact).length;
   assert.equal(new Set(screens.map(q=>q.id)).size,screens.length,'new repeats are distinct tasks, not restored old screen IDs');
   if(!failFirst)assert.equal(consecutive,0,'correct first attempts should rotate when other known objects exist');
   // Characterize the current defect, without changing scheduling as part of this audit.
   if(failFirst){assert.equal(consecutive,4);const unit=(await d.appMeta.get('studyCore:learningLifecycle'))!.value.units.find((u:any)=>u.entityId==='e0');assert.equal(unit.stage,'first-check');assert.equal(unit.successes,0);assert(Date.parse(unit.availableAt)<=Date.now());}
   reports.push({failFirst,consecutive,screens,trace:studyTraceReport(d)});
  }finally{stopStudyTrace(d);d.close();await d.delete();}
 }
 await mkdir('artifacts',{recursive:true});await writeFile('artifacts/feed-repeat-diagnostics.json',JSON.stringify(reports,null,2));
 }finally{mock.timers.reset();}
});
