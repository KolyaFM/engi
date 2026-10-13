import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {propertyFixture} from './fixtures/deck-properties';
import {recipes,eligible,canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {composeUnit,compositionContext} from '../src/lib/engi/session/composer';
import {triagedMemory} from '../src/lib/engi/learning/bootstrap';
import {compileTaskContract,associationGoal} from '../src/lib/engi/study-core/compiler';
import {admitAcquisition,advanceAcquisition,emptyLifecycle} from '../src/lib/engi/study-core/acquisition';
import {propertyWorkload} from '../src/lib/engi/knowledge/property-workload';
import {EngiDB} from '../src/db/engi-db';
import {putBundle} from '../src/db/repositories';
import {learningRow} from '../src/db/repositories';
import {createTrainerService} from '../src/services/trainer-service';
import {LIFECYCLE_KEY} from '../src/services/learning-lifecycle-service';
const at=new Date('2026-10-13T10:00:00Z');
test('legacy forward permissions persist reverse configuration without copying memory evidence',async()=>{
 const db=new EngiDB('reverse-legacy-'+crypto.randomUUID());try{
  const b=propertyFixture(),forward=canonicalTargets(b).filter(i=>i.targetId.endsWith(':forward'));
  await putBundle(db,b);await db.learningState.bulkPut(forward.map(i=>learningRow(triagedMemory(i,'red','old',0))));
  const svc=createTrainerService(db);await svc.startGoalFeed('all','choice','daily',{endless:true,deckIds:['a']});
  for(const i of forward.filter(i=>i.factId?.startsWith('year')))assert(await db.learningState.get(i.targetId.replace(/:forward$/,':reverse')),'reverse permission must survive selection');
  assert.equal((await db.appMeta.where('key').startsWith('studyCore:memory:').toArray()).length,0);
 }finally{db.close();await db.delete();}
});
test('years generate reverse choices with source ownership and exactly one valid option',()=>{
 const b=propertyFixture();b.facts.find(f=>f.id==='year1')!.dateStart='1800-01-01';b.facts.find(f=>f.id==='year1')!.dateEnd='1800-12-31';
 const r=recipes(b).find(r=>!r.tag&&r.answerKey==='year'&&r.direction==='reverse'&&r.format==='choice');assert(r);
 const i=eligible(b,r).find(i=>i.factId==='year0')!;assert.equal(i.entityId,'e0');assert.equal(i.name,'State 0');assert.equal(i.valueCue?.text,'1800');
 for(let n=0;n<30;n++){const t=composeUnit(b,triagedMemory(i,'red','s',0),'all','choice',[],compositionContext(b))!;assert(t);assert.equal(t.recipe.direction,'reverse');assert(!t.options.some(o=>o.id==='e1'));assert.equal(t.options.filter(o=>o.id==='e0').length,1);const c=compileTaskContract(b,t);assert.equal(c.primaryGoals[0].direction,'reverse');assert(!c.shownClaims.some(claim=>claim.key==='entity:e0'));}
});
test('known property excludes both directions without creating any memory',async()=>{
 const db=new EngiDB('reverse-known-'+crypto.randomUUID());try{
  await putBundle(db,propertyFixture());const svc=createTrainerService(db);let s=await svc.startGoalFeed('all','choice','daily',{endless:true,deckIds:['a']});const intro=s.intro!;
  const forward=intro.unitIds.find(id=>id.endsWith(':forward'))!;s=await svc.completeIntro(s.id,{entityId:intro.entityId,selections:{[forward]:'green'}});
  const rows=await db.learningState.toArray();assert(rows.filter(r=>r.id.includes(forward.slice(0,-8))).every(r=>r.payload.status==='suspended'));
  assert.equal((await db.appMeta.get(LIFECYCLE_KEY))!.value.units.length,0);assert.equal((await db.appMeta.where('key').startsWith('studyCore:memory:').toArray()).length,0);
 }finally{db.close();await db.delete();}
});
test('three virtual days mix directions, preserve property counts and update only the answered goal',async(t)=>{
 t.mock.timers.enable({apis:['Date'],now:+at});const db=new EngiDB('reverse-days-'+crypto.randomUUID()),directions=new Set<string>();let checks=0;
 try{await putBundle(db,propertyFixture());const svc=createTrainerService(db);let s=await svc.startGoalFeed('all','choice','daily',{endless:true,deckIds:['a']});
  for(let day=0;day<3;day++)for(let turn=0;turn<40;turn++){
   t.mock.timers.setTime(+at+day*86400000+turn*25000);
   if(s.intro){s=await svc.completeIntro(s.id);continue;}const q=s.tasks[0];assert(q,'continuous feed supplies a task');
   const before=await db.appMeta.where('key').startsWith('studyCore:memory:').toArray();directions.add(q.recipe.direction??'forward');
   await svc.answer({sessionId:s.id,taskId:q.id,answer:q.items[0].answerId});checks++;
   const touched=new Set(q.studyContract!.primaryGoals.map(g=>'studyCore:memory:'+g.id)),after=await db.appMeta.where('key').startsWith('studyCore:memory:').toArray();
   assert.deepEqual(after.filter(r=>!touched.has(r.key)),before.filter(r=>!touched.has(r.key)));
   if(q.intent==='practice')assert.deepEqual(after,before);
   const plan=await svc.getDayPlan('all','choice',['a']);assert(plan.workload!.learning<=4);assert(plan.workload!.repeat<=4);
   s=await svc.advanceFeed(s.id,false,q.id);
  }
  assert(checks>80);assert.deepEqual([...directions].sort(),['forward','reverse']);assert.equal((await db.appMeta.get(LIFECYCLE_KEY))!.value.units.length,4);
 }finally{db.close();await db.delete();t.mock.timers.reset();}
});
test('reverse recall is unavailable for repeated values; explicit opt out and scope remain effective',()=>{
 const b=propertyFixture();for(const f of b.facts.filter(f=>f.key==='year')){f.dateStart='1800-01-01';f.dateEnd='1800-12-31';}
 assert(!recipes(b).some(r=>r.answerKey==='year'&&r.direction==='reverse'));
 b.properties![1].learning={reverse:false};assert(!canonicalTargets(b).some(i=>i.factId?.startsWith('other')&&i.targetId.endsWith(':reverse')));
});
test('one property has one acquisition obligation, confirmed in the other direction after five minutes',()=>{
 const b=propertyFixture(),f=b.facts[0],forward=associationGoal(b,f,'recognition'),reverse=associationGoal(b,f,'recognition','reverse');
 let ledger=admitAcquisition(emptyLifecycle(),f.entityId,[forward,reverse],at);assert.equal(ledger.units.length,1);
 ledger=advanceAcquisition(ledger,{id:'a',goalId:forward.id,goal:forward,at,correct:true,eligible:true});
 ledger=advanceAcquisition(ledger,{id:'early',goalId:reverse.id,goal:reverse,at:new Date(+at+1000),correct:true,eligible:true});assert.equal(ledger.units[0].stage,'confirmation');
 ledger=advanceAcquisition(ledger,{id:'b',goalId:reverse.id,goal:reverse,at:new Date(+at+300000),correct:true,eligible:true});assert.equal(ledger.units[0].stage,'completed');assert.equal(ledger.units[0].attemptIds.length,2);
 const catalog=[forward,reverse].map(goal=>({goal,targetIds:[],entityIds:[f.entityId],propertyId:f.key,suspended:false}));
 assert.equal(propertyWorkload(catalog,[],admitAcquisition(emptyLifecycle(),f.entityId,[forward,reverse],at)).learning.length,1);
});
