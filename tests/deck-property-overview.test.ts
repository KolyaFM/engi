import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {propertyFixture} from './fixtures/deck-properties';
import {EngiDB} from '../src/db/engi-db';
import {putBundle} from '../src/db/repositories';
import {createTrainerService} from '../src/services/trainer-service';
import {readLifecycle} from '../src/services/learning-lifecycle-service';
import {saveDeckPropertySelection} from '../src/services/deck-property-settings';
import {createDeckTargetIndex,createDeckProgressIndex,deckOverview} from '../src/services/deck-overview';
test('property counts match the feed and overlap once, while disabled progress is untouched',async()=>{
 const d=new EngiDB('property-overview-'+crypto.randomUUID());try{await putBundle(d,propertyFixture());const svc=createTrainerService(d);
  let settings=await saveDeckPropertySelection(d,'a',['year'],false);await svc.getGoalSnapshot(true);
  const s=await svc.startGoalFeed('all','mixed','daily',{endless:true,deckIds:['a']});await svc.completeIntro(s.id);
  const before=await d.learningState.toArray(),ledgerBefore=await readLifecycle(d);settings=await saveDeckPropertySelection(d,'a',[],false);
  let snapshot=await svc.getGoalSnapshot(true),lifecycle=await readLifecycle(d),index=createDeckTargetIndex(snapshot.bundle,settings),progress=createDeckProgressIndex(snapshot);
  assert.equal(deckOverview(snapshot,lifecycle,['a'],Date.now(),index,progress).total,0);assert.equal((await svc.getDayPlan('all','mixed',['a'])).workload!.learning,0);
  assert.deepEqual(await d.learningState.toArray(),before);assert.deepEqual(await readLifecycle(d),ledgerBefore);
  settings=await saveDeckPropertySelection(d,'a',['year'],false);snapshot=await svc.getGoalSnapshot(true);lifecycle=await readLifecycle(d);index=createDeckTargetIndex(snapshot.bundle,settings);progress=createDeckProgressIndex(snapshot);
  for(const ids of [['a'],['b'],['a','b'],['a','a','b']]){const view=deckOverview(snapshot,lifecycle,ids,Date.now(),index,progress),plan=await svc.getDayPlan('all','mixed',ids);assert.equal(view.learning,plan.workload!.learning);assert.equal(view.repeat,plan.workload!.repeat);assert.equal(view.mistakes,plan.mistakes!.length);}
  assert.equal(deckOverview(snapshot,lifecycle,['a'],Date.now(),index,progress).total,4);assert.equal(deckOverview(snapshot,lifecycle,['a','b'],Date.now(),index,progress).total,8);
 }finally{d.close();await d.delete();}
});
