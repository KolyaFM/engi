import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EngiDB,type SessionRow} from '../src/db/engi-db';
import type {Bundle} from '../src/lib/engi/types';
import {goalProposalPool} from '../src/services/goal-proposals';
import {selectRepairWork} from '../src/services/study-work-service';
import {knowledgeMistakeKey} from '../src/lib/engi/study-core/mistakes';
import {pickFeed,dailyNewState} from '../src/lib/engi/session/candidate-pool';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {triagedMemory} from '../src/lib/engi/learning/bootstrap';
import {deckStudyScope} from '../src/services/deck-study-scope';
import {createEmptyCard} from 'ts-fsrs';
import type {GoalMemory} from '../src/lib/engi/study-core/memory';

const fixture=():Bundle=>({entities:Array.from({length:8},(_,n)=>({id:'e'+n,type:'object',name:'Объект '+n,aliases:[],externalIds:{}})),facts:Array.from({length:8},(_,n)=>({id:'f'+n,entityId:'e'+n,key:'nickname',valueKind:'text' as const,valueText:'Прозвище '+n,verification:'user_confirmed' as const,source:{kind:'manual' as const,name:'Test'}})),media:[],tags:[],entityTags:[],missing:[],unresolved:[],properties:[{id:'nickname',name:'Прозвище',valueKind:'text',cardinality:'one',learnable:true,subjectTypes:['object'],learning:{reverse:true,choice:'on'}}],decks:['a','b'].map(id=>({id,name:id,learning:{imageRecognition:false}})),deckMembers:Array.from({length:8},(_,n)=>({deckId:n<4?'a':'b',entityId:'e'+n}))});
const session=():SessionRow=>({id:'test',format:'mixed',mode:'daily',tasks:[],currentPosition:0,results:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),status:'active',timeLeft:90,cooldown:[]});

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
