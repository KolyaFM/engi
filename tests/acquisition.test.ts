import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defineGoal} from '../src/lib/engi/study-core/goals';
import {admitAcquisition,advanceAcquisition,emptyLifecycle,acquisitionKey} from '../src/lib/engi/study-core/acquisition';
const at=new Date('2026-10-08T10:00:00Z');
const goal=(key:string,skill:'recognition'|'recall'='recognition')=>defineGoal({knowledge:{kind:'fact',key},skill,direction:'forward',cueRole:'name',precision:'exact',revision:'v1'});
test('one object accepts every property without duplicating skills or spending property-sized daily budget',()=>{
 const goals=[goal('a'),goal('a','recall'),goal('b'),goal('c')];
 const ledger=admitAcquisition(emptyLifecycle(), 'object', goals,at);
 assert.equal(ledger.cards.length,1);assert.equal(ledger.units.length,3);
 assert.equal(ledger.units.find(u=>u.key===acquisitionKey(goals[0]))!.goal.id,goals[0].id);
 assert.deepEqual(admitAcquisition(ledger,'object',goals,new Date(at.getTime()+1000)),ledger);
});
test('two fresh eligible successes finish acquisition without a wall-clock pause; hints and duplicate answers cannot advance it',()=>{
 let ledger=admitAcquisition(emptyLifecycle(),'object',[goal('a')],at);
 const evidence=(id:string,seconds:number,correct=true,eligible=true)=>({id,goalId:goal('a').id,at:new Date(at.getTime()+seconds*1000),correct,eligible});
 ledger=advanceAcquisition(ledger,evidence('first',0));assert.equal(ledger.units[0].successes,1);
 assert.deepEqual(advanceAcquisition(ledger,evidence('first',25)),ledger);
 ledger=advanceAcquisition(ledger,evidence('hint',20,true,false));assert.equal(ledger.units[0].successes,1);
 ledger=advanceAcquisition(ledger,evidence('second',1));assert.equal(ledger.units[0].stage,'completed');
});
test('wrong first answers reset the current acquisition series and stay idempotent',()=>{
 let ledger=admitAcquisition(emptyLifecycle(),'object',[goal('a')],at);
 ledger=advanceAcquisition(ledger,{id:'one',goalId:goal('a').id,at:new Date(at.getTime()+10000),correct:true,eligible:true});
 ledger=advanceAcquisition(ledger,{id:'wrong',goalId:goal('a').id,at:new Date(at.getTime()+20000),correct:false,eligible:true});
 assert.equal(ledger.units[0].successes,0);assert.equal(ledger.units[0].stage,'first-check');
 assert.deepEqual(advanceAcquisition(ledger,{id:'wrong',goalId:goal('a').id,at:new Date(at.getTime()+40000),correct:true,eligible:true}),ledger);
});
