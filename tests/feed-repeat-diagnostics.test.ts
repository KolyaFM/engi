import 'fake-indexeddb/auto';
import {test,mock} from 'node:test';import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';
import {EngiDB} from '../src/db/engi-db';import {putBundle,learningRow} from '../src/db/repositories';import {triagedMemory} from '../src/lib/engi/learning/bootstrap';import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {graduateGoalMemory} from '../src/lib/engi/study-core/memory';
import {buildGoalCatalog} from '../src/services/goal-catalog';import {admitAcquisition,emptyLifecycle,ACQUISITION_CONFIRMATION_MS} from '../src/lib/engi/study-core/acquisition';import {createTrainerService} from '../src/services/trainer-service';import {startStudyTrace,studyTraceReport,stopStudyTrace} from '../src/services/study-selection-trace';import type {Bundle,Task} from '../src/lib/engi/types';
const fixture=():Bundle=>({entities:Array.from({length:4},(_,n)=>({id:'e'+n,name:'Object '+n,type:'event',aliases:[],externalIds:{}})),facts:Array.from({length:4},(_,n)=>({id:'f'+n,entityId:'e'+n,key:'year',valueKind:'date',dateStart:(1700+n*10)+'-01-01',dateEnd:(1700+n*10)+'-12-31',datePrecision:'year',verification:'user_confirmed',source:{name:'Diagnostic'}})),properties:[{id:'year',name:'Year',valueKind:'date',cardinality:'one',learnable:true,subjectTypes:['event'],learning:{reverse:false,timeline:'off',missing:'off'}}],media:[],tags:[],entityTags:[],missing:[],unresolved:[]});

test('waiting confirmations and same-screen corrections do not cause immediate repeats when other practice is available',async()=>{
 const at=Date.parse('2026-10-20T09:00:00Z'),reports=[];mock.timers.enable({apis:['Date'],now:at});
 try{for(const scenario of ['first-correct','first-error','one-completed','two-completed','single-reserve','single-admitted']){
  const failFirst=scenario==='first-error';
  mock.timers.setTime(at);const d=new EngiDB('repeat-diagnostic-'+crypto.randomUUID());try{
   const b=fixture();await putBundle(d,b);for(const item of canonicalTargets(b)){const memory=triagedMemory(item,'red','seed',0);if(scenario==='single-reserve'&&!['e0','e1'].includes(item.entityId)||scenario==='single-admitted'&&item.entityId!=='e0')memory.status='suspended';await d.learningState.put(learningRow(memory));}
   const enabled=(await d.learningState.toArray()).map(r=>r.payload),catalog=buildGoalCatalog(b,enabled);let ledger=emptyLifecycle();
   for(const e of b.entities)ledger=admitAcquisition(ledger,e.id,catalog.filter(c=>c.entityIds.includes(e.id)).map(c=>c.goal),new Date(at-1000));
   for(const unit of ledger.units)if(unit.entityId!=='e0'){unit.stage='confirmation';unit.successes=1;unit.lastAttemptAt=new Date(at-1000).toISOString();unit.availableAt=new Date(at+ACQUISITION_CONFIRMATION_MS).toISOString();}
   if(scenario.endsWith('completed')||scenario==='single-reserve')for(const unit of ledger.units.filter(u=>u.entityId==='e0'||scenario==='two-completed'&&u.entityId==='e1')){unit.stage='completed';unit.successes=unit.requiredSuccesses;unit.completedAt=new Date(at-86400000).toISOString();const memory=graduateGoalMemory(unit.goal,new Date(at));await d.appMeta.put({key:'studyCore:memory:'+unit.goal.id,value:memory});}
   await d.appMeta.put({key:'studyCore:learningLifecycle',value:ledger});await d.appMeta.put({key:'introducedEntities',value:b.entities.map(e=>e.id)});await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:0}});
   startStudyTrace(d,100);const svc=createTrainerService(d);let s=await svc.startGoalFeed('all','choice','daily',{endless:true});const screens:{id:string;entity:string;fact?:string;intent?:Task['intent'];reason:string}[]=[];
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
   if(scenario!=='single-admitted')assert.equal(consecutive,0,'rotate actual knowledge even when other goals are waiting or the first attempt was wrong');
   else {assert.equal(consecutive,4,'a truly single playable question remains playable');assert(screens.every(q=>q.fact==='f0'),'suspended properties never enter practice');}
   if(failFirst){const unit=(await d.appMeta.get('studyCore:learningLifecycle'))!.value.units.find((u:any)=>u.entityId==='e0');assert.equal(unit.stage,'first-check');assert.equal(unit.successes,0);assert(Date.parse(unit.availableAt)<=Date.now());}
   if(scenario==='one-completed'||scenario==='single-reserve'){
    assert(screens.every(q=>q.intent==='practice'));assert.equal(new Set(screens.map(q=>q.fact)).size,scenario==='one-completed'?4:2,'disclosure preference must not exclude playable knowledge');assert.equal((await svc.getDayPlan()).workload!.mistakes,0);
    const before=(await d.appMeta.where('key').startsWith('studyCore:memory:').toArray());assert.equal(before.length,1,'practice never manufactures independent memories');
    const reservedBefore=(await d.appMeta.get('studyCore:learningLifecycle'))!.value.units.find((u:any)=>u.entityId==='e1');assert.equal(Date.parse(reservedBefore.availableAt),at+ACQUISITION_CONFIRMATION_MS);
    // Practice may disclose any pending property. Wait beyond its actual last
    // disclosure instead of pretending the original reserve stayed untouched.
    mock.timers.setTime(at+2*ACQUISITION_CONFIRMATION_MS);const current=s.tasks[0],rule=current.studyContract!.response;if(rule.kind!=='choice')throw Error('Expected practice choice');await svc.answer({sessionId:s.id,taskId:current.id,answer:rule.expected});
    assert.deepEqual(await d.appMeta.where('key').startsWith('studyCore:memory:').toArray(),before,'practice does not alter FSRS');s=await svc.advanceFeed(s.id,false,current.id);
    // With only two enabled properties, one intervening screen can prevent an
    // immediate repeat of the practice question that was already on screen.
    if(s.tasks[0].intent==='practice'){assert.equal(scenario,'single-reserve');const intervening=s.tasks[0],response=intervening.studyContract!.response;assert.equal(intervening.items[0].factId,'f0');if(response.kind!=='choice')throw Error('Expected intervening choice');await svc.answer({sessionId:s.id,taskId:intervening.id,answer:response.expected});s=await svc.advanceFeed(s.id,false,intervening.id);}
    const check=s.tasks[0];assert.equal(check.intent,'learn','a ready confirmation must return after at most one intervening screen');assert.notEqual(check.items[0].factId,'f0','a ready confirmation outranks practice');const response=check.studyContract!.response;if(response.kind!=='choice')throw Error('Expected independent choice');await svc.answer({sessionId:s.id,taskId:check.id,answer:response.expected});
    assert.equal((await d.appMeta.get('studyCore:learningLifecycle'))!.value.units.find((u:any)=>u.entityId===check.items[0].entityId).stage,'completed');
   }
   reports.push({scenario,failFirst,consecutive,screens,trace:studyTraceReport(d)});
  }finally{stopStudyTrace(d);d.close();await d.delete();}
 }
 await mkdir('artifacts',{recursive:true});await writeFile('artifacts/feed-repeat-diagnostics.json',JSON.stringify(reports,null,2));
 }finally{mock.timers.reset();}
});
