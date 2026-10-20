import 'fake-indexeddb/auto';
import {test,mock} from 'node:test';
import assert from 'node:assert/strict';
import {EngiDB,type SessionRow} from '../src/db/engi-db';
import {putBundle,learningRow} from '../src/db/repositories';
import {triagedMemory} from '../src/lib/engi/learning/bootstrap';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {admitAcquisition,emptyLifecycle,ACQUISITION_CONFIRMATION_MS,propertyKey} from '../src/lib/engi/study-core/acquisition';
import {compileTaskContract} from '../src/lib/engi/study-core/compiler';
import {graduateGoalMemory} from '../src/lib/engi/study-core/memory';
import {buildGoalCatalog} from '../src/services/goal-catalog';
import {goalProposalPool,materializeGoalProposal} from '../src/services/goal-proposals';
import {pickLifecycleFeed} from '../src/services/lifecycle-feed-service';
import type {Bundle} from '../src/lib/engi/types';

test('an alternative that discloses the reserved identity cannot suppress the only ready independent check',async()=>{
 const at=Date.parse('2026-10-20T09:00:00Z');mock.timers.enable({apis:['Date'],now:at});
 const db=new EngiDB('reserve-disclosure-'+crypto.randomUUID());
 try{
  const b:Bundle={
   entities:Array.from({length:4},(_,n)=>({id:'e'+n,name:'Object '+n,type:'event',aliases:[],externalIds:{}})),
   facts:Array.from({length:4},(_,n)=>({id:'f'+n,entityId:'e'+n,key:'year',valueKind:'date',dateStart:(1700+n*10)+'-01-01',dateEnd:(1700+n*10)+'-12-31',datePrecision:'year',verification:'user_confirmed',source:{name:'Test'}})),
   properties:[{id:'year',name:'Year',valueKind:'date',cardinality:'one',learnable:true,subjectTypes:['event'],promptTemplates:{forward:'Year of {subject}?'},learning:{reverse:false,timeline:'off',missing:'off'}}],
   media:Array.from({length:4},(_,n)=>({id:'m'+n,entityId:'e'+n,role:'primary',url:'https://example.test/'+n+'.png',license:'Test'})),
   tags:[],entityTags:[],missing:[],unresolved:[],
  };
  await putBundle(db,b);
  const enabled=canonicalTargets(b).map(item=>{
   const memory=triagedMemory(item,'red','seed',0);
   if(!(item.factId==='f0'||item.entityId==='e1'))memory.status='suspended';
   return memory;
  });
  await db.learningState.bulkPut(enabled.map(learningRow));
  const catalog=buildGoalCatalog(b,enabled).filter(e=>!e.suspended);let ledger=emptyLifecycle();
  for(const entityId of ['e0','e1'])ledger=admitAcquisition(ledger,entityId,catalog.filter(e=>e.entityIds.includes(entityId)).map(e=>e.goal),new Date(at-1000));
  const reserved=ledger.units.find(u=>u.goal.knowledge.kind==='identity'&&u.entityId==='e1');assert(reserved);
  reserved.stage='confirmation';reserved.successes=1;reserved.lastAttemptAt=new Date(at-1000).toISOString();reserved.availableAt=new Date(at+ACQUISITION_CONFIRMATION_MS).toISOString();
  const completed=ledger.units.find(u=>u.goal.knowledge.key==='f1');assert(completed);
  completed.stage='completed';completed.successes=completed.requiredSuccesses;completed.completedAt=new Date(at-86400000).toISOString();
  const memory=graduateGoalMemory(completed.goal,new Date(at));
  await db.appMeta.bulkPut([{key:'studyCore:learningLifecycle',value:ledger},{key:'studyCore:memory:'+memory.goalId,value:memory},{key:'introducedEntities',value:b.entities.map(e=>e.id)},{key:'studyPreferences',value:{newCardsPerDay:0}}]);
  const pool=goalProposalPool(b,enabled,'all','mixed');
  const lastProposal=pool.proposals.find(p=>p.recipe.format==='choice'&&p.goals[0].knowledge.key==='f0');assert(lastProposal);
  const last=materializeGoalProposal(b,enabled,lastProposal,pool.context,'all',[]);assert(last);last.studyContract=compileTaskContract(b,last);
  const alternative=pool.proposals.find(p=>p.recipe.format==='choice'&&p.goals[0].knowledge.key==='f1');assert(alternative);
  const alternativeTask=materializeGoalProposal(b,enabled,alternative,pool.context,'all',[last],true);assert(alternativeTask);
  const contract=compileTaskContract(b,alternativeTask);
  assert(contract.shownClaims.some(c=>c.revealsGoalIds.includes(reserved.goal.id)),'the apparent alternative actually discloses the reserved identity');
  assert.notEqual(propertyKey(alternative.goals[0]),propertyKey(reserved.goal),'its primary goal alone does not reveal that conflict');
  const session:SessionRow={id:'reserve-disclosure',tasks:[],currentPosition:0,results:[],mode:'daily',createdAt:new Date(at).toISOString(),updatedAt:new Date(at).toISOString(),status:'active',timeLeft:0,feed:true,endless:true,tag:'all',format:'choice',cooldown:[last]};
  const next=await pickLifecycleFeed(db,b,enabled,session,{day:'2026-10-20',introducedEntityIds:[],extraBudget:0},b.entities.map(e=>e.id),at);
  assert(next.task);assert.equal(next.task.items[0].factId,'f0','the only safe playable property may repeat');
  assert.equal(next.task.intent,'learn','the ready first-check keeps independent acquisition credit when every alternative discloses the reserve');
  assert.equal(next.task.reason,'bootstrap');
 }finally{db.close();await db.delete();mock.timers.reset();}
});
