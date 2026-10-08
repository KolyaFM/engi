import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EngiDB} from '../src/db/engi-db';
import {defineGoal} from '../src/lib/engi/study-core/goals';
import {admitAcquisition,advanceAcquisition,emptyLifecycle} from '../src/lib/engi/study-core/acquisition';
import {LIFECYCLE_KEY} from '../src/services/learning-lifecycle-service';
import {createStudyCoreService} from '../src/services/study-core-service';
import type {TaskContract} from '../src/lib/engi/study-core/contracts';
test('the last non-bijective category pair is independent acquisition evidence; retries cannot seed FSRS twice',async()=>{
 const db=new EngiDB('acquisition-pairs-'+crypto.randomUUID()),at=new Date(),goals=['one','two'].map(key=>defineGoal({knowledge:{kind:'fact',key},skill:'recognition',direction:'forward',cueRole:'name',precision:'exact',revision:'v1'}));
 try{
  let ledger=admitAcquisition(emptyLifecycle(),'owner',goals,new Date(at.getTime()-30000));
  for(const goal of goals)ledger=advanceAcquisition(ledger,{id:'first-'+goal.id,goalId:goal.id,at:new Date(at.getTime()-15000),correct:true,eligible:true});await db.appMeta.put({key:LIFECYCLE_KEY,value:ledger});
  const contract:TaskContract={id:'category',practice:false,primaryGoals:goals,supportGoalIds:[],visibleEntities:[],actionFamily:'categorize',shownClaims:[],hintClaims:[],feedbackClaims:[],contentRevisions:Object.fromEntries(goals.map(g=>[g.semanticKey,g.revision])),response:{kind:'mapping',bijective:false,options:['same','other'],bindings:goals.map((g,n)=>({responseKey:'subject'+n,goalId:g.id,expected:'same'}))}};
  const core=createStudyCoreService(db,{lifecycle:true});await core.setContentRevisions(contract.contentRevisions);await core.open(contract,contract.id,at);
  await core.submitPair(contract.id,'subject0','same','request0',at);const last=await core.submitPair(contract.id,'subject1','same','request1',at);assert.equal(last.firstResult!.acquisitionCredit,true);
  for(const goal of goals){const memory=await core.memory(goal.id);assert.equal(memory!.card.reps,1);assert.equal(memory!.card.state,2);}
  const before=await db.appMeta.toArray();await core.submitPair(contract.id,'subject1','same','request1',at);assert.deepEqual(await db.appMeta.toArray(),before);
 }finally{db.close();await db.delete();}
});
