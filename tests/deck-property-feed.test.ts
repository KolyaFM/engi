import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {propertyFixture} from './fixtures/deck-properties';
import {EngiDB} from '../src/db/engi-db';
import {putBundle} from '../src/db/repositories';
import {createTrainerService} from '../src/services/trainer-service';
import {saveDeckPropertySelection} from '../src/services/deck-property-settings';
import {compileIntroContract} from '../src/lib/engi/study-core/compiler';
import {readDeckPropertySettings} from '../src/services/deck-property-settings';
import {deckStudyScope,SELECTED_DECKS} from '../src/services/deck-study-scope';
import {canonicalTargets,recipes,eligible} from '../src/lib/engi/questions/recipe-factory';
test('enabled property batches get independent intro receipts, preserve known and do not consume another object',async()=>{
 const d=new EngiDB('property-feed-'+crypto.randomUUID());try{await putBundle(d,propertyFixture());const svc=createTrainerService(d);
  await saveDeckPropertySelection(d,'a',['year'],false);let s=await svc.startGoalFeed('all','mixed','daily',{endless:true,deckIds:['a']});const first=s.intro!;
  assert(first.unitIds.every(id=>id.includes('year')));assert(first.introId);
  const decision={entityId:first.entityId,introId:first.introId,selections:Object.fromEntries(first.unitIds.map(id=>[id,'green' as const]))};
  await svc.completeIntro(s.id,decision);await saveDeckPropertySelection(d,'a',['year','other'],false);
  s=(await svc.getResumableSession({endless:true}))!;assert(s.intro?.newProperty);assert.equal(s.intro.entityId,first.entityId);assert.notEqual(s.intro.introId,first.introId);
  const second=s.intro!;await svc.completeIntro(s.id,{entityId:second.entityId,introId:second.introId,selections:second.selections});
  const rows=await d.learningState.toArray();assert(rows.some(r=>r.id.includes('other')&&r.payload.status!=='suspended'));assert(rows.filter(r=>first.unitIds.includes(r.id)).every(r=>r.payload.initialFamiliarity==='green'));
  assert.equal((await d.appMeta.get('newLearning'))!.value.introducedEntityIds.length,1);
  const after=await svc.completeIntro(s.id,decision);assert.equal(after.intro?.entityId,(await d.activeSessions.get(s.id))!.intro?.entityId);
 }finally{d.close();await d.delete();}
});
test('scope filters every recipe format and retires disabled pending work on resume',async()=>{
 const d=new EngiDB('property-scope-'+crypto.randomUUID());try{const b=propertyFixture();await putBundle(d,b);const svc=createTrainerService(d);let s=await svc.startGoalFeed('all','mixed','daily',{endless:true,deckIds:['a']});
  const abandoned=s.intro!;await svc.observeIntroVisibility(s.id,'old-properties','start');await svc.completeIntro(s.id,{entityId:abandoned.entityId,introId:abandoned.introId,selections:abandoned.selections});
  await saveDeckPropertySelection(d,'a',['other'],false);s=(await svc.getResumableSession({endless:true}))!;assert(s.intro?.unitIds.every(id=>id.includes('other')));
  const scope=deckStudyScope(b,['a'],await readDeckPropertySettings(d));assert(canonicalTargets(scope,SELECTED_DECKS).every(i=>i.factId?.startsWith('other')));
  for(const recipe of recipes(scope).filter(r=>r.tag===SELECTED_DECKS))assert(eligible(scope,recipe).every(i=>i.factId?.startsWith('other')));
  const open=await svc.observeIntroVisibility(s.id,'disabled-intro','start');assert(open);
  await saveDeckPropertySelection(d,'a',[],false);s=(await svc.getResumableSession({endless:true}))!;assert(!s.intro);assert.equal(s.tasks.length,0);assert(s.exhausted);
  assert.equal((await d.appMeta.get('studyCore:attempt:'+open.attemptId))!.value.phase,'skipped');
 }finally{d.close();await d.delete();}
});
test('intro exposure only records displayed properties',()=>{
 const b=propertyFixture(),contract=compileIntroContract(b,{entityId:'e0',unitIds:['ku:fact:year0:forward'],newProperty:false},'s');
 assert(!contract.shownClaims.some(c=>c.key.includes('other0')));
});
