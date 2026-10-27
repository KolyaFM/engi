import 'fake-indexeddb/auto';
import {test} from 'node:test';import assert from 'node:assert/strict';
import {parseV3} from '../src/lib/engi/import/schema-v3';import {buildImportPlan} from '../src/lib/engi/import/semantic-merge';
import {canonicalTargets,recipes,eligible} from '../src/lib/engi/questions/recipe-factory';
import {compileTaskContract,claimForFact} from '../src/lib/engi/study-core/compiler';
import {composeUnit} from '../src/lib/engi/session/composer';import {triagedMemory} from '../src/lib/engi/learning/bootstrap';
import {buildLearningChronology} from '../src/services/learning-chronology';
import {statisticsKey} from '../src/lib/engi/knowledge/statistics';
import type {Bundle} from '../src/lib/engi/types';
import {periodStartGoal,compileIntroContract} from '../src/lib/engi/study-core/compiler';
import {EngiDB} from '../src/db/engi-db';import {putBundle} from '../src/db/repositories';
import {createTrainerService} from '../src/services/trainer-service';
import {createDeckStudyCatalog} from '../src/services/deck-study-catalog';
import {buildGoalCatalog} from '../src/services/goal-catalog';
import {buildEndpointTask} from '../src/services/interval-composition';
import {buildIntervalGroup} from '../src/services/interval-group-composition';
import {directionConfiguration} from '../src/lib/engi/learning/direction-configuration';
import {ensureLifecycle,LIFECYCLE_KEY} from '../src/services/learning-lifecycle-service';
import {admitAcquisition,emptyLifecycle} from '../src/lib/engi/study-core/acquisition';
import {associationGoal} from '../src/lib/engi/study-core/compiler';
export const periodBundle=():Bundle=>({entities:[0,1,2,3].map(n=>({id:'e'+n,name:'Object '+n,type:n%2?'event':'person',aliases:[],externalIds:{}})),facts:[0,1,2].map(n=>({id:'f'+n,entityId:'e'+n,key:n===1?'war':'reign',valueKind:'date' as const,dateStart:(1100+n*20)+'-01-01',dateEnd:(1150+n*20)+'-12-31',datePrecision:'range' as const,source:{name:'Test',kind:'manual' as const},verification:'verified' as const})).concat([{id:'f3',entityId:'e3',key:'event-year',valueKind:'date' as const,dateStart:'1110-01-01',dateEnd:'1110-12-31',datePrecision:'year' as any,source:{name:'Test',kind:'manual' as const},verification:'verified' as const}]),properties:[{id:'reign',name:'Правление',valueKind:'date',cardinality:'one',learnable:true,learning:{reverse:false,periodStart:{name:'Начало правления',question:'В каком году началось правление?'}}},{id:'war',name:'Ход войны',valueKind:'date',cardinality:'one',learnable:true,learning:{reverse:false,periodStart:{name:'Начало войны'}}},{id:'event-year',name:'Год события',valueKind:'date',cardinality:'one',learnable:true,learning:{reverse:false}}],media:[],tags:[],entityTags:[],missing:[],unresolved:[]});
test('pack declares a named period start and import preserves it without extra facts',()=>{
 const pkg=parseV3({schemaVersion:3,name:'Test',properties:[{name:'Правление',valueType:'date',learning:{periodStart:{name:'Начало правления',question:'Когда началось правление?'}}}],entities:[]});
 const b=buildImportPlan(pkg,{entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[]},{},'test').bundle;
 assert.equal(b.properties!.find(p=>p.name==='Правление')!.learning!.periodStart!.name,'Начало правления');assert.equal(b.facts.length,0);
});
test('period starts generate independent exact-year questions without copying stored facts',()=>{
 const b=periodBundle(),before=JSON.stringify(b),items=canonicalTargets(b),start=items.find(i=>i.factId==='f0'&&i.dateEdge==='start');assert(start);
 assert.equal(start.answer,'1100');assert.equal(start.year,1100);assert.notEqual(start.targetId,items.find(i=>i.factId==='f0'&&!i.dateEdge)!.targetId);
 const task=composeUnit(b,triagedMemory(start,'red','test',0),'all','choice')!;assert(task);assert.equal(task.recipe.prompt,'В каком году началось правление?');
 const c=compileTaskContract(b,task);assert.equal(c.primaryGoals[0].precision,'period-start-year');
 const whole=claimForFact(b,b.facts[0]);assert(whole.revealsGoalIds.includes(c.primaryGoals[0].id));
 assert(c.feedbackClaims.every(claim=>claim.revealsGoalIds.every(id=>!id.includes('subject-to-value","range'))),'start feedback must not claim the full range');
 assert.notEqual(statisticsKey(c.primaryGoals[0]),JSON.stringify(['fact','f0']));assert.equal(JSON.stringify(b),before);
});
test('mixed chronology can order overlapping reigns, wars and exact events by their starts',()=>{
 const b=periodBundle(),proposals=canonicalTargets(b).filter(i=>i.dateEdge==='start'||i.factId==='f3').map(i=>{const q=composeUnit(b,triagedMemory(i,'red','test',0),'all','choice')!;assert(q);return {recipe:q.recipe,items:q.items,goals:compileTaskContract(b,q).primaryGoals}});
 const q=buildLearningChronology(b,proposals,[],[],0)!;assert(q);assert.equal(q.recipe.format,'sort');assert.equal(q.items.length,4);assert(q.items.every(i=>i.chronologyLabel));
 const c=compileTaskContract(b,q);assert.equal(c.primaryGoals.length,4);assert(c.primaryGoals.filter(g=>g.precision==='period-start-year').length===3);
});
test('start goals stay opt-in, reject approximate bounds and never duplicate recipes',()=>{
 const b=periodBundle();assert.equal(new Set(recipes(b).map(r=>r.id)).size,recipes(b).length);
 delete b.properties![0].learning!.periodStart;assert(!canonicalTargets(b).some(i=>i.factId==='f0'&&i.dateEdge));
 b.facts[1].datePrecision='circa';assert(!canonicalTargets(b).some(i=>i.factId==='f1'&&i.dateEdge));
 b.facts[2].dateBoundaryPrecision={start:'month',end:'year'};assert(!canonicalTargets(b).some(i=>i.factId==='f2'&&i.dateEdge));
});
test('invalid property kinds and ambiguous multiple periods cannot declare a start',()=>{
 for(const valueType of ['text','number','entity'])assert.throws(()=>parseV3({schemaVersion:3,name:'Test',entities:[],properties:[{name:'P',valueType,learning:{periodStart:{name:'Start'}}}]}));
 assert.throws(()=>parseV3({schemaVersion:3,name:'Test',entities:[],properties:[{name:'P',valueType:'date',multiple:true,learning:{periodStart:{name:'Start'}}}]}));
});
test('start revision changes only when its own year changes; stale answers are rejected',()=>{
 const b=periodBundle(),start=canonicalTargets(b).find(i=>i.factId==='f0'&&i.dateEdge)!;
 const q=composeUnit(b,triagedMemory(start,'red','',0),'all','choice')!,g=periodStartGoal(b,b.facts[0],'recognition');
 b.facts[0].dateEnd='1160-12-31';assert.equal(periodStartGoal(b,b.facts[0],'recognition').id,g.id);
 b.facts[0].dateStart='1101-01-01';assert.notEqual(periodStartGoal(b,b.facts[0],'recognition').id,g.id);assert.throws(()=>compileTaskContract(b,q));
});
test('source exclusions and selected properties control both period and derived start',()=>{
 const b=periodBundle();b.decks=[{id:'deck',name:'Test',learning:{imageRecognition:false,propertyIds:['reign'],excludedFactIds:['f0']}}];b.deckMembers=b.entities.map(e=>({deckId:'deck',entityId:e.id}));
 assert(canonicalTargets(b,'deck').every(i=>i.factId==='f2'));const catalog=createDeckStudyCatalog(b),ids=catalog.targetsFor(['deck']);assert(ids.has('ku:fact:f2:start:forward'));assert(!ids.has('ku:fact:f0:start:forward'));assert(!ids.has('ku:fact:f1:start:forward'));
 b.properties![0].learnable=false;assert(!canonicalTargets(b).some(i=>i.factId==='f2'));
});
test('derived start cannot be converted into a whole-period boundary or bands task',()=>{
 const b=periodBundle(),proposals=canonicalTargets(b).filter(i=>i.dateEdge).map(i=>{const q=composeUnit(b,triagedMemory(i,'red','',0),'all','choice')!;return {recipe:q.recipe,items:q.items,goals:compileTaskContract(b,q).primaryGoals};});
 const q=composeUnit(b,triagedMemory(canonicalTargets(b).find(i=>i.dateEdge)!,'red','',0),'all','choice')!;
 assert.equal(buildEndpointTask(b,q,undefined,[]),undefined);assert.equal(buildIntervalGroup(b,proposals,[],390),undefined);
});
test('intro reveals the start through the original period and couples familiarity choices',async()=>{
 const d=new EngiDB('period-start-'+crypto.randomUUID());try{
  const b=periodBundle();b.entities=b.entities.filter(e=>e.id!=='e3');b.facts=b.facts.filter(f=>f.entityId!=='e3');await putBundle(d,b);const svc=createTrainerService(d),s=await svc.startGoalFeed('all','choice','daily',{endless:true});assert(s.intro);
  const intro=s.intro,items=canonicalTargets(b).filter(i=>intro.unitIds.includes(i.targetId));const start=items.find(i=>i.dateEdge);
  assert(start);
  const contract=compileIntroContract(b,intro,s.id);assert(contract.shownClaims.some(c=>c.revealsGoalIds.includes(periodStartGoal(b,b.facts.find(f=>f.id===start.factId)!,'recognition').id)));
  const saved=await svc.saveIntroSelection(s.id,start.targetId,'green');assert(saved.intro!.unitIds.every(id=>saved.intro!.selections[id]==='green'));
  await svc.completeIntro(s.id,{entityId:intro.entityId,selections:saved.intro!.selections});
  for(const item of items)assert.equal((await d.learningState.get(item.targetId))!.payload.status,'suspended');
  const entries=buildGoalCatalog(b,(await d.learningState.toArray()).map(r=>r.payload));assert(entries.filter(e=>e.targetIds.includes(start.targetId)).every(e=>e.suspended));
 }finally{d.close();await d.delete();}
});
test('reimport adds a start definition to a pack-owned property and preserves personal edits',()=>{
 const make=(name:string)=>parseV3({schemaVersion:3,name:'Test',properties:[{name:'Правление',valueType:'date',learning:{periodStart:{name}}}],entities:[]});
 const empty:Bundle={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[]};
 const b=buildImportPlan(make('Start'),empty,{},'test').bundle,p=b.properties!.find(p=>p.name==='Правление')!;delete p.learning;
 assert.equal(buildImportPlan(make('New start'),b).bundle.properties!.find(q=>q.id===p.id)!.learning?.periodStart?.name,'New start');
 p.userModified=true;assert.equal(buildImportPlan(make('New start'),b).bundle.properties!.find(q=>q.id===p.id)!.learning?.periodStart,undefined);
});
test('adding start learning inherits source familiarity without copying memory evidence',()=>{
 const b=periodBundle(),old=structuredClone(b);for(const p of old.properties!)delete p.learning!.periodStart;
 const rows=canonicalTargets(old).map(i=>({...triagedMemory(i,'green','',0),status:'suspended' as const}));
 const configured=directionConfiguration(b,rows),start=configured.find(m=>m.id==='ku:fact:f0:start:forward');assert(start);assert.equal(start.status,'suspended');assert.equal(start.attempts,0);
 const catalog=buildGoalCatalog(b,rows);assert(catalog.filter(e=>e.targetIds.includes('ku:fact:f0:start:forward')).every(e=>e.suspended),'catalog itself respects source exclusions before configuration reconciliation');
});
test('adding a start to an introduced period joins learning without repeating its intro',async()=>{
 const b=periodBundle(),d=new EngiDB('period-start-adopt-'+crypto.randomUUID());try{
  const now=new Date(),old=admitAcquisition(emptyLifecycle(),'e0',[associationGoal(b,b.facts[0],'recognition')],now,'migration');await d.appMeta.put({key:LIFECYCLE_KEY,value:old});
  const ledger=await ensureLifecycle(d,buildGoalCatalog(b,[]),now);assert(ledger.units.some(u=>u.goal.precision==='period-start-year'&&u.entityId==='e0'));
  assert.equal(ledger.cards.length,1);assert.equal(ledger.units.find(u=>u.goal.precision==='period-start-year')!.successes,0);
 }finally{d.close();await d.delete();}
});
test('before/after stays available when ordering is disabled',()=>{
 const b=periodBundle();b.facts=b.facts.slice(0,3).map((f,n)=>({...f,key:'event-year',dateStart:(1100+n*10)+'-01-01',dateEnd:(1100+n*10)+'-12-31',datePrecision:'year'}));
 b.properties=b.properties!.filter(p=>p.id==='event-year');b.properties[0].learning={reverse:false,sort:'off',categorize:'on'};
 const proposals=canonicalTargets(b).map(i=>{const q=composeUnit(b,triagedMemory(i,'red','',0),'all','choice')!;return {recipe:q.recipe,items:q.items,goals:compileTaskContract(b,q).primaryGoals};});
 assert.equal(buildLearningChronology(b,proposals,[],[],0)?.contextual?.kind,'boundary');
});
