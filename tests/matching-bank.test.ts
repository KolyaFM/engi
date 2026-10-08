import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EngiDB} from '../src/db/engi-db';
import {defineGoal} from '../src/lib/engi/study-core/goals';
import {validateContract,gradeResponse,type TaskContract} from '../src/lib/engi/study-core/contracts';
import {createStudyCoreService} from '../src/services/study-core-service';
const goals=['a','b'].map(key=>defineGoal({knowledge:{kind:'fact',key},skill:'recognition',direction:'forward',cueRole:'subject',precision:'value',revision:'v1'}));
const contract=():TaskContract=>({id:'bank',practice:false,primaryGoals:goals,supportGoalIds:[],visibleEntities:[],actionFamily:'match',shownClaims:[],hintClaims:[],feedbackClaims:[],contentRevisions:Object.fromEntries(goals.map(g=>[g.semanticKey,g.revision])),response:{kind:'mapping',bijective:true,exhaustive:false,options:['a','b','distractor'],bindings:goals.map(g=>({responseKey:g.knowledge.key,goalId:g.id,expected:g.knowledge.key}))}});
test('a matching bank with a spare answer retains uniqueness without a forced final pair',async()=>{
 const d=new EngiDB('matching-bank-'+crypto.randomUUID());try{const c=contract();validateContract(c);assert(gradeResponse(c,{a:'a',b:'b'}).every(r=>r.correct));const core=createStudyCoreService(d);await core.setContentRevisions(c.contentRevisions);await core.open(c,c.id);await core.submitPair(c.id,'a','a','one');const last=await core.submitPair(c.id,'b','b','two');assert.equal(last.firstResult!.credit,true);assert.equal(last.attempt.phase,'submitted');}finally{d.close();await d.delete();}
});
test('a spare answer can be chosen incorrectly; correcting it cannot add independent credit',async()=>{
 const d=new EngiDB('matching-bank-wrong-'+crypto.randomUUID());try{const c=contract(),core=createStudyCoreService(d);await core.setContentRevisions(c.contentRevisions);await core.open(c,c.id);const wrong=await core.submitPair(c.id,'a','distractor','wrong');assert.equal(wrong.pair.correct,false);const corrected=await core.submitPair(c.id,'a','a','correct');assert.equal(corrected.firstResult,undefined);}finally{d.close();await d.delete();}
});
