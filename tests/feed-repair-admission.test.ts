import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EngiDB,type SessionRow} from '../src/db/engi-db';
import type {Bundle} from '../src/lib/engi/types';
import {goalProposalPool,materializeGoalProposal} from '../src/services/goal-proposals';
import {putBundle,learningRow} from '../src/db/repositories';
import {createTrainerService} from '../src/services/trainer-service';
import {prepareStudyTask} from '../src/services/study-core-bridge';
import {selectRepairWork} from '../src/services/study-work-service';
import {knowledgeMistakeKey} from '../src/lib/engi/study-core/mistakes';
import {pickFeed,dailyNewState} from '../src/lib/engi/session/candidate-pool';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {triagedMemory} from '../src/lib/engi/learning/bootstrap';
import {deckStudyScope} from '../src/services/deck-study-scope';
import {createEmptyCard} from 'ts-fsrs';
import type {GoalMemory} from '../src/lib/engi/study-core/memory';
import {compileTaskContract} from '../src/lib/engi/study-core/compiler';

const fixture=():Bundle=>({entities:Array.from({length:8},(_,n)=>({id:'e'+n,type:'object',name:'Объект '+n,aliases:[],externalIds:{}})),facts:Array.from({length:8},(_,n)=>({id:'f'+n,entityId:'e'+n,key:'nickname',valueKind:'text' as const,valueText:'Прозвище '+n,verification:'user_confirmed' as const,source:{kind:'manual' as const,name:'Test'}})),media:[],tags:[],entityTags:[],missing:[],unresolved:[],properties:[{id:'nickname',name:'Прозвище',valueKind:'text',cardinality:'one',learnable:true,subjectTypes:['object'],learning:{reverse:true,choice:'on'}}],decks:['a','b'].map(id=>({id,name:id,learning:{imageRecognition:false}})),deckMembers:Array.from({length:8},(_,n)=>({deckId:n<4?'a':'b',entityId:'e'+n}))});
const session=():SessionRow=>({id:'test',format:'mixed',mode:'daily',tasks:[],currentPosition:0,results:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),status:'active',timeLeft:90,cooldown:[]});

test('resuming an old reverse timed repair replaces it with an objective repair that clears the error',async()=>{
 const d=new EngiDB('repair-resume-'+crypto.randomUUID());try{
  const b=fixture();await putBundle(d,b);const enabled=canonicalTargets(b).map(i=>triagedMemory(i,'red','test',0));await d.learningState.bulkPut(enabled.map(learningRow));
  const pool=goalProposalPool(b,enabled,'all','mixed'),p=pool.proposals.find(p=>p.recipe.format==='recall_reveal'&&p.goals[0]?.direction==='reverse')!,goal=p.goals[0],at=new Date().toISOString();
  await d.appMeta.put({key:'studyCore:mistakeEpisodes',value:{version:1,episodes:[{id:'error',key:knowledgeMistakeKey(goal),goal,status:'open',failedAt:at,openedAt:at,lastAttemptAt:at,attemptIds:[]}]}});
  const timed=materializeGoalProposal(b,enabled,p,pool.context,'all',[])!;timed.memoryModel='goals';timed.learningLifecycle=1;timed.intent='repair';timed.reason='retry';timed.repairEpisodeIds=['error'];await prepareStudyTask(d,b,timed);
  const saved={...session(),memoryModel:'goals' as const,learningLifecycle:1 as const,endless:true,feed:true,tag:'all',tasks:[timed]};await d.activeSessions.put(saved);
  const svc=createTrainerService(d),resumed=await svc.getResumableSession({endless:true}),q=resumed!.tasks[0];assert.notEqual(q.id,timed.id);assert.equal(q.recipe.format,'choice');assert.equal(q.recipe.direction,'reverse');
  assert.equal((await d.appMeta.get('studyCore:attempt:'+timed.id))!.value.phase,'skipped');assert.equal(await d.reviewEvents.count(),0,'replacement must not grade the pending question');
  const r=q.studyContract!.response;if(r.kind!=='choice')throw Error('Expected choice');await svc.answer({sessionId:resumed!.id,taskId:q.id,answer:r.expected});
  assert.equal((await d.appMeta.get('studyCore:mistakeEpisodes'))!.value.episodes[0].status,'resolved');assert.equal(await d.appMeta.where('key').startsWith('studyCore:memory:').count(),0,'repair clears the error without inventing FSRS memory');
 }finally{d.close();await d.delete();}
});

test('mixed mistake repair does not alternate a valid objective check with timed self-report',async()=>{
 const d=new EngiDB('repair-timer-loop-'+crypto.randomUUID());try{
  const b=fixture(),enabled=canonicalTargets(b).map(i=>triagedMemory(i,'red','test',0)),goal=goalProposalPool(b,enabled,'all','mixed').proposals.find(p=>p.goals[0]?.direction==='reverse'&&p.recipe.format==='choice')!.goals[0],key=knowledgeMistakeKey(goal),at=new Date().toISOString();
  await d.appMeta.put({key:'studyCore:mistakeEpisodes',value:{version:1,episodes:[{id:'error',key,goal,status:'open',failedAt:at,openedAt:at,lastAttemptAt:at,attemptIds:[]}]}});
  const first=await selectRepairWork(d,b,enabled,session(),new Map(),false);assert.equal(first?.recipe.format,'choice');
  const next=await selectRepairWork(d,b,enabled,{...session(),cooldown:[first!]},new Map(),false);
  assert.equal(next?.recipe.format,'choice','format variation must not turn an objective error into a repeating timer');
 }finally{d.close();await d.delete();}
});
test('recall-only repair data obeys the shared canonical repeat guard; explicit recall remains possible',async()=>{
 const d=new EngiDB('repair-sparse-'+crypto.randomUUID());try{
  const b=fixture();b.properties![0].learning={...b.properties![0].learning,choice:'off',recallReveal:'on'};
  const enabled=canonicalTargets(b).map(i=>triagedMemory(i,'red','test',0)),goal=goalProposalPool(b,enabled,'all','mixed').proposals.find(p=>p.recipe.format==='recall_reveal')!.goals[0],key=knowledgeMistakeKey(goal),at=new Date().toISOString();
  await d.appMeta.put({key:'studyCore:mistakeEpisodes',value:{version:1,episodes:[{id:'error',key,goal,status:'open',failedAt:at,openedAt:at,lastAttemptAt:at,attemptIds:[]}]}});
  const first=await selectRepairWork(d,b,enabled,session(),new Map(),false);assert.equal(first?.recipe.format,'recall_reveal');first!.studyContract=compileTaskContract(b,first!);
  const history=[first!];assert.equal(await selectRepairWork(d,b,enabled,{...session(),cooldown:history},new Map(),false),undefined,'draining errors must not bypass the same-knowledge timer guard');
  assert.equal((await d.appMeta.get('studyCore:mistakeEpisodes'))!.value.episodes[0].status,'open','waiting for spacing is not an unavailable error');
  assert.equal((await selectRepairWork(d,b,enabled,{...session(),format:'recall_reveal',cooldown:history},new Map(),false))?.recipe.format,'recall_reveal');
 }finally{d.close();await d.delete();}
});

test('an eligible reverse error gets a repair even while it is also ordinary learning work',async()=>{
 const d=new EngiDB('repair-priority-'+crypto.randomUUID());try{
  const b=fixture(),enabled=canonicalTargets(b).map(i=>triagedMemory(i,'red','test',0)),goal=goalProposalPool(b,enabled,'all','mixed').proposals.find(p=>p.goals.length===1&&p.goals[0].direction==='reverse')!.goals[0],key=knowledgeMistakeKey(goal);
  await d.appMeta.put({key:'studyCore:mistakeEpisodes',value:{version:1,episodes:[{id:'error',key,goal,status:'open',failedAt:new Date().toISOString(),openedAt:new Date().toISOString(),lastAttemptAt:new Date().toISOString(),attemptIds:[]}]}});
  const task=await selectRepairWork(d,b,enabled,session(),new Map(),true);
  assert.equal(task?.intent,'repair');assert.equal(task?.recipe.direction,'reverse');
  assert.equal((await selectRepairWork(d,b,enabled,{...session(),format:'choice'},new Map(),true))?.recipe.format,'choice','repair honors the requested session format');
  assert.equal(await selectRepairWork(d,b,enabled,session(),new Map(),true,{excludedKeys:new Set([key])}),undefined,'disclosure protection still applies');
  const memory:GoalMemory={goal,goalId:goal.id,card:createEmptyCard(new Date(Date.now()-1000)),independentAttempts:1,independentSuccesses:0,lastCorrect:false};
  const due=await selectRepairWork(d,b,enabled,session(),new Map([[goal.id,memory]]),true);
  assert.equal(due?.intent,'learn','a due memory needs ordinary FSRS rights');assert.equal(due?.reason,'due');
  const repeated={...session(),cooldown:[due!]};
  assert.notEqual((await selectRepairWork(d,b,enabled,repeated,new Map([[goal.id,memory]]),true))?.intent,'learn','due reviews still yield to ordinary object variety');
  await d.appMeta.put({key:'studyCore:goalSelector',value:{version:1,recent:[{objectIds:due!.items.map(i=>i.entityId),format:due!.recipe.format}]}});
  assert.notEqual((await selectRepairWork(d,b,enabled,session(),new Map([[goal.id,memory]]),true))?.intent,'learn','persisted object history also protects a new session');
  memory.card.due=new Date(Date.now()+86400000);
  const early=await selectRepairWork(d,b,enabled,session(),new Map([[goal.id,memory]]),true);
  assert.equal(early?.intent,'repair','an extra check must preserve future FSRS scheduling');
 }finally{d.close();await d.delete();}
});

test('new introductions alternate available decks instead of following import order',()=>{
 const b=fixture(),s=session(),introduced:string[]=[],memories:ReturnType<typeof triagedMemory>[]=[];let firstDeck:string|undefined;
 for(let n=0;n<8;n++){
  const next=pickFeed(b,memories,s,dailyNewState(undefined),introduced,10);assert(next.intro);
  const id=next.intro.entityId,deck=b.deckMembers!.find(m=>m.entityId===id)!.deckId;if(n===0)firstDeck=deck;assert(firstDeck);assert.equal(deck,n%2?(firstDeck==='a'?'b':'a'):firstDeck);
  introduced.push(id);
  for(const unit of canonicalTargets(b).filter(i=>next.intro!.unitIds.includes(i.targetId))){const m=triagedMemory(unit,'red',s.id,0);m.status='suspended';memories.push(m);}
 }
});

test('deck rotation stays inside selection and continues after a smaller deck runs out',()=>{
 const b=fixture();b.deckMembers!.forEach((m,n)=>{m.deckId=n<6?'a':'b';});
 const scoped=deckStudyScope(b,['b']),s={...session(),tag:scoped.studyScope!.id,deckIds:['b']};
 const selected=pickFeed(scoped,[],s,dailyNewState(undefined),['e0'],10);
 assert(selected.intro);assert(['e6','e7'].includes(selected.intro.entityId),'unselected deck cannot introduce an object');
 const introduced:string[]=[],memories:ReturnType<typeof triagedMemory>[]=[];
 const order=[];
 for(let n=0;n<8;n++){
  const next=pickFeed(b,memories,session(),dailyNewState(undefined),introduced,10);assert(next.intro);
  order.push(b.deckMembers!.find(m=>m.entityId===next.intro!.entityId)!.deckId);introduced.push(next.intro.entityId);
  for(const unit of canonicalTargets(b).filter(i=>next.intro!.unitIds.includes(i.targetId))){const m=triagedMemory(unit,'red','test',0);m.status='suspended';memories.push(m);}
 }
 assert.deepEqual(order.slice(0,4),order[0]==='a'?['a','b','a','b']:['b','a','b','a']);assert.deepEqual(order.slice(4),['a','a','a','a']);
});

test('unseen objects are sampled uniformly without property weighting or import-order preference',()=>{
 const b=fixture();b.decks=[];b.deckMembers=[];
 b.facts.push({...b.facts[0],id:'extra',key:'extra'});b.properties!.push({...b.properties![0],id:'extra'});
 const random=Math.random;try{
  const selected=[];
  for(let n=0;n<8;n++){Math.random=()=>(n+.5)/8;selected.push(pickFeed(b,[],session(),dailyNewState(undefined),[],10).intro!.entityId);}
  assert.deepEqual(selected,Array.from({length:8},(_,n)=>'e'+n));
  const seen=['e0','e1'],memories=canonicalTargets(b).filter(i=>seen.includes(i.entityId)).map(i=>{const m=triagedMemory(i,'red','test',0);m.status='suspended';return m;});
  Math.random=()=>0;const next=pickFeed(b,memories,session(),dailyNewState(undefined),seen,10);assert.equal(next.intro!.entityId,'e2');
 }finally{Math.random=random;}
});


function mixedTypeFixture():Bundle{
 const b=fixture();b.entities=Array.from({length:96},(_,n)=>({...b.entities[0],id:'e'+n,name:'Object '+n,type:n<80?'event':n<88?'person':'book'}));
 b.facts=b.entities.map((e,n)=>({...b.facts[0],id:'f'+n,entityId:e.id,valueText:'Value '+n}));
 b.properties![0].subjectTypes=['event','person','book'];b.decks=b.decks!.slice(0,1);b.deckMembers=b.entities.map(e=>({deckId:'a',entityId:e.id}));return b;
}

test('introductions interleave custom object types even when eighty events precede people and books',()=>{
 const b=mixedTypeFixture(),s=session(),introduced:string[]=[],memories:ReturnType<typeof triagedMemory>[]=[],types:string[]=[];
 const random=Math.random;Math.random=()=>0;try{
  const units=canonicalTargets(b);
  for(let n=0;n<9;n++){
   const next=pickFeed(b,memories,s,dailyNewState(undefined),introduced,10);assert(next.intro);
   types.push(b.entities.find(e=>e.id===next.intro!.entityId)!.type);introduced.push(next.intro.entityId);
   for(const i of units.filter(i=>next.intro!.unitIds.includes(i.targetId))){const m=triagedMemory(i,'red',s.id,0);m.status='suspended';memories.push(m);}
  }
  for(let n=0;n<9;n+=3)assert.equal(new Set(types.slice(n,n+3)).size,3,'each available type enters before another block of events');
 }finally{Math.random=random;}
});

test('new properties on many familiar events cannot monopolize introductions ahead of fresh types',()=>{
 const b=mixedTypeFixture(),s=session(),introduced=b.entities.slice(0,80).map(e=>e.id),types:string[]=[];
 const memories:ReturnType<typeof triagedMemory>[]=[],units=canonicalTargets(b),random=Math.random;Math.random=()=>0;
 try{
  for(let n=0;n<3;n++){
   const next=pickFeed(b,memories,s,dailyNewState(undefined),introduced,10);assert(next.intro);
   const entity=b.entities.find(e=>e.id===next.intro!.entityId)!;types.push(entity.type);if(!introduced.includes(entity.id))introduced.push(entity.id);
   const items=units.filter(i=>next.intro!.unitIds.includes(i.targetId));
   s.cooldown!.push({id:'intro'+n,recipe:{id:'intro',format:'choice',cue:'name',answerKey:'identity',memoryKey:'intro',diagnostic:false},items:items.slice(0,1),options:[],reason:'intro'});
   for(const i of items){const m=triagedMemory(i,'red',s.id,0);m.status='suspended';memories.push(m);}
  }
  assert.equal(new Set(types).size,3,'pending properties and unseen objects share type rotation');
 }finally{Math.random=random;}
});


test('type rotation falls back when a small type runs out and keeps disabled types outside the scope',()=>{
 const b=mixedTypeFixture();b.entities=b.entities.filter(e=>e.type==='event'||e.id==='e80');b.facts=b.facts.filter(f=>b.entities.some(e=>e.id===f.entityId));b.deckMembers=b.deckMembers!.filter(m=>b.entities.some(e=>e.id===m.entityId));
 const introduced=['e0','e80'],units=canonicalTargets(b),memories=units.filter(i=>introduced.includes(i.entityId)).map(i=>{const m=triagedMemory(i,'red','test',0);m.status='suspended';return m;});
 const next=pickFeed(b,memories,session(),dailyNewState(undefined),introduced,10);assert(next.intro);assert.equal(b.entities.find(e=>e.id===next.intro!.entityId)!.type,'event');
 b.decks!.push({id:'other',name:'other',learning:{imageRecognition:false}});b.deckMembers!.find(m=>m.entityId==='e80')!.deckId='other';
 const scope=deckStudyScope(b,['a']);const scoped=pickFeed(scope,[],{...session(),tag:scope.studyScope!.id,deckIds:['a']},dailyNewState(undefined),['e0'],10);assert(scoped.intro);assert.notEqual(scoped.intro.entityId,'e80');
});
