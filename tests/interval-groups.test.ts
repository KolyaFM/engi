import 'fake-indexeddb/auto';import {test} from 'node:test';import assert from 'node:assert/strict';
import {intervals} from './helpers-intervals';
import {buildIntervalGroup} from '../src/services/interval-group-composition';
import {goalProposalPool} from '../src/services/goal-proposals';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {triagedMemory} from '../src/lib/engi/learning/bootstrap';
import {compileTaskContract} from '../src/lib/engi/study-core/compiler';
import {createStudyCoreService} from '../src/services/study-core-service';
import {EngiDB} from '../src/db/engi-db';
import {acquisitionBlocks} from '../src/services/acquisition-evidence-service';
import {admitAcquisition,emptyLifecycle} from '../src/lib/engi/study-core/acquisition';
test('bands use current targets, allow one support, enforce settings and do not update FSRS',async()=>{
 const b=intervals(),enabled=canonicalTargets(b).map(i=>triagedMemory(i,'red','s',0)),ready=goalProposalPool(b,enabled,'all','choice').proposals;
 assert.equal(buildIntervalGroup(b,ready.slice(0,2),[],[],288),undefined);
 const t=buildIntervalGroup(b,ready.slice(0,2),ready.slice(2,3),[],288)!;assert(t);assert.equal(t.intervalExercise?.kind,'bands');assert.equal(t.items.length,3);const c=compileTaskContract(b,t);assert.equal(c.primaryGoals.length,2);assert.equal(c.supportGoalIds.length,1);
 const copy=structuredClone(b);copy.properties![0].learning={rangeBands:'off'};assert.equal(buildIntervalGroup(copy,ready,[],[],288),undefined);
 assert.equal(buildIntervalGroup(b,ready,[],[t],288),undefined);
 const d=new EngiDB('bands-test-'+crypto.randomUUID());try{const core=createStudyCoreService(d,{lifecycle:true});await core.setContentRevisions(c.contentRevisions);await core.open(c,t.id,new Date(0));assert(c.response.kind==='mapping');for(const binding of c.response.bindings.filter(b=>!b.support)){const r=await core.submitPair(t.id,binding.responseKey,binding.expected,'pair-'+binding.responseKey,new Date(100));assert(!r.firstResult?.credit);}assert.equal(await d.appMeta.where('key').startsWith('studyCore:memory:').count(),0);const evidence=await d.appMeta.where('key').startsWith('studyCore:intervalEvidence:').toArray();assert(evidence.length<=2);assert(evidence.every(e=>c.primaryGoals.some(g=>g.id===e.value.goalId)));}finally{d.close();await d.delete();}
 const bad=structuredClone(t);if(bad.intervalExercise?.kind==='bands')bad.intervalExercise.scale.bands[0].start++;assert.throws(()=>compileTaskContract(b,bad));
});
test('final year reveal delays every exact goal including the last pair inferred by elimination',async()=>{
 const b=intervals(),enabled=canonicalTargets(b).map(i=>triagedMemory(i,'red','s',0)),ready=goalProposalPool(b,enabled,'all','choice').proposals,t=buildIntervalGroup(b,ready,[],[],288)!,c=compileTaskContract(b,t),d=new EngiDB('band-disclosure-'+crypto.randomUUID());
 try{let ledger=emptyLifecycle();for(const g of c.primaryGoals)ledger=admitAcquisition(ledger,t.items.find(i=>i.factId===g.knowledge.key)!.entityId,[g],new Date(0));await d.appMeta.put({key:'studyCore:learningLifecycle',value:ledger});const core=createStudyCoreService(d,{lifecycle:true});await core.setContentRevisions(c.contentRevisions);await core.open(c,t.id,new Date(0));assert(c.response.kind==='mapping');for(const [n,binding] of c.response.bindings.entries())await core.submitPair(t.id,binding.responseKey,binding.expected,'p'+n,new Date(n*70000+1));await core.observe(t.id,'feedback','all-years','start',new Date(200000));
  const ids=c.primaryGoals.map(g=>g.id),blocks=await acquisitionBlocks(d,ids,new Date(201000),undefined,c.primaryGoals);assert.equal(blocks.blocked.length,ids.length,'revealed years block all exact checks, even when no independent pair result exists');
  await core.observe(t.id,'feedback','all-years','end',new Date(202000));assert.equal((await acquisitionBlocks(d,ids,new Date(263000),undefined,c.primaryGoals)).blocked.length,0);
 }finally{d.close();await d.delete();}
});
test('wide interval groups can contain five participants while phone groups stay at three',()=>{
 const b=intervals();for(let n=4;n<6;n++){b.entities.push({...b.entities[0],id:'e'+n,name:'E'+n});b.facts.push({...b.facts[0],id:'f'+n,entityId:'e'+n,dateStart:(1900+n*20)+'-01-01',dateEnd:(1905+n*20)+'-12-31'});}
 const ready=goalProposalPool(b,canonicalTargets(b).map(i=>triagedMemory(i,'red','s',0)),'all','choice').proposals;
 assert.equal(buildIntervalGroup(b,ready,[],[],560)?.items.length,5);assert.equal(buildIntervalGroup(b,ready,[],[],240)?.items.length,3);
});
