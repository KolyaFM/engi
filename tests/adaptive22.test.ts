import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createEmptyCard,Rating,State,type Card} from 'ts-fsrs';
import type {Bundle,Memory,Recipe,Snapshot} from '../src/lib/engi/types';
import {allowedMedia,selectExemplar} from '../src/lib/engi/questions/exemplar-selector';
import {difficultyStage} from '../src/lib/engi/learning/mastery';
import {DAY,triagedMemory,reviewLearning} from '../src/lib/engi/learning/bootstrap';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {hydrate,scheduler} from '../src/lib/engi/engine';
import {progress} from '../src/lib/engi/knowledge/progress';
import {todayLearning} from '../src/lib/engi/knowledge/motivation';
import {EngiDB} from '../src/db/engi-db';
import {learningRow} from '../src/db/repositories';
import {saveKnowledge} from '../src/services/knowledge-service';
import {setUnitSuspended} from '../src/services/learning-service';

function fixture():Bundle{
 const b:Bundle={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[]};
 for(let i=0;i<4;i++){
  b.entities.push({id:'p'+i,type:'person',name:'Человек '+i,aliases:[],externalIds:{}},{id:'a'+i,type:'organization',name:'Партия '+i,aliases:[],externalIds:{}});
  b.facts.push({id:'f'+i,entityId:'p'+i,key:'party',valueKind:'entity',valueEntityId:'a'+i,verification:'user_confirmed',source:{kind:'manual',name:'Личное знание'}});
 }
 return b;
}
const recipe:Recipe={id:'image-choice',format:'choice',cue:'image',answerKey:'party',memoryKey:'party',diagnostic:false};
const media=(id:string,extra:Partial<Bundle['media'][number]>={})=>({id,entityId:'p0',role:'portrait',url:'engi-media://'+'a'.repeat(64),license:'Личное изображение',...extra});
function mature(id:string,stability=100,now=new Date()):Memory{
 return {id,status:'review',card:{...createEmptyCard<Card>(now),state:State.Review,stability,difficulty:5,reps:8,last_review:now,due:new Date(now.getTime()+DAY)},attempts:8,correct:8,confusions:{},firstSuccessAt:now.toISOString(),lastOutcome:true,latencyEmaMs:1000};
}

test('exemplar rotation avoids each of the last three views when a fourth is available',()=>{
 const b=fixture();b.media=['a','b','c','d'].map(id=>media(id));const m=mature('visual');m.recentMediaIds=['a','b','c'];
 for(let n=0;n<8;n++){const recent=m.recentMediaIds.slice(-3),selected=selectExemplar(b,'p0',recipe,m)!;assert(selected);assert(!recent.includes(selected.id));m.recentMediaIds.push(selected.id)}
 assert.equal(m.recentMediaIds[3],'d');assert.equal(new Set(m.recentMediaIds.slice(3,7)).size,4);
});

test('learning images exclude memes, archived images, opted-out exemplars and wrong entity roles',()=>{
 const b=fixture();b.media=[media('meme',{role:'meme'}),media('archived',{archived:true}),media('disabled',{learningExemplar:false}),media('other',{entityId:'p1'}),media('wrong-role',{role:'artwork'}),media('valid')];
 assert.deepEqual(allowedMedia(b,'p0',recipe).map(m=>m.id),['valid']);assert.equal(selectExemplar(b,'p0',recipe)!.id,'valid');
 b.entities[0].type='artwork';b.media.push(media('painting',{role:'painting'}));assert.deepEqual(allowedMedia(b,'p0',recipe).map(m=>m.id),['wrong-role','painting']);
});

test('small exemplar pools fall back safely without immediate repetition whenever possible',()=>{
 const b=fixture(),m=mature('visual');b.media=[media('a'),media('b')];m.recentMediaIds=['a','b','a'];assert.equal(selectExemplar(b,'p0',recipe,m)!.id,'b');
 b.media=[media('a')];assert.equal(selectExemplar(b,'p0',recipe,m)!.id,'a');b.media=[];assert.equal(selectExemplar(b,'p0',recipe,m),undefined);
});

test('presentation stages grow with stable recall and fall after failure or slow retrieval',()=>{
 for(const [stability,expected] of [[3,1],[14,2],[45,3],[100,4]] as const)assert.equal(difficultyStage(mature('m',stability)),expected);
 const strong=mature('m'),before=structuredClone(strong);assert.equal(difficultyStage({...strong,lastOutcome:false}),1);assert.equal(difficultyStage({...strong,status:'learning'}),1);assert.equal(difficultyStage({...strong,latencyEmaMs:7000}),2);
 const faded={...strong,card:{...strong.card,last_review:new Date(Date.now()-2000*DAY)}};assert.equal(difficultyStage(faded),1);assert.deepEqual(strong,before);
});

test('response latency changes presentation difficulty without multiplying FSRS scheduling',()=>{
 const item=canonicalTargets(fixture())[0],now=new Date('2026-10-06T12:00:00Z'),old=mature(item.targetId,100,new Date(now.getTime()-DAY));delete old.latencyEmaMs;
 const fast=reviewLearning(old,item,true,true,false,false,1000,now),slow=reviewLearning(old,item,true,true,false,false,20000,now);
 assert.equal(fast.fsrsUpdated,true);assert.equal(slow.fsrsUpdated,true);assert.deepEqual(slow.memory.card,fast.memory.card);assert.equal(fast.memory.attempts,slow.memory.attempts);assert.equal(fast.memory.latencyEmaMs,1000);assert.equal(slow.memory.latencyEmaMs,20000);assert(difficultyStage(fast.memory)>difficultyStage(slow.memory));
});

test('progress counts active known units separately from unseen, suspended and actual retrievals',()=>{
 const b=fixture(),units=canonicalTargets(b),now=new Date(),review=mature(units[0].targetId);review.card.due=new Date(now.getTime()-1000);
 const triaged=triagedMemory(units[1],'green','',0),suspended={...mature(units[2].targetId),status:'suspended' as const},legacy={...review,id:'old-cue',legacyOf:review.id},orphan=mature('removed-target');
 const snapshot:Snapshot={bundle:b,memories:[review,triaged,suspended,legacy,orphan],events:['direct','diagnostic','repair','practice','direct'].map((level,i)=>({id:'e'+i,timestamp:now.toISOString(),recipe:'test',level,payload:{score:1,metadata:{stabilityTransitions:[{targetId:review.id,before:10,after:35}]}}}))};
 const p=progress(snapshot);assert.equal(p.available,4);assert.equal(p.total,2);assert.equal(p.new,1);assert.equal(p.suspended,1);assert.equal(p.covered,1);assert.equal(p.due,1);assert.equal(p.quarter,1);assert.deepEqual(todayLearning(snapshot,now),{retrievals:2,stability30Gains:1});
});

test('each completed familiarity bootstrap hands its next review to the unmodified FSRS scheduler',()=>{
 const item=canonicalTargets(fixture())[0];
 for(const [color,probes] of [['red',3],['orange',2],['yellow',2],['green',1]] as const){
  let now=new Date('2026-10-06T12:00:00Z'),m=triagedMemory(item,color,'',0,now);
  for(let n=0;n<probes;n++){m=reviewLearning(m,item,true,true,false,false,1000,now).memory;assert.equal(m.status,n+1===probes?'review':'learning');assert.equal(m.bootstrap!.successes,n+1);now=new Date(m.card.due)}
  const expected=scheduler.next(hydrate(m),now,Rating.Good).card,result=reviewLearning(m,item,true,true,false,false,1000,now);
  assert.equal(result.fsrsUpdated,true);assert.equal(result.memory.status,'review');assert.deepEqual(result.memory.card,expected);assert(result.memory.card.scheduled_days>1,`${color} must leave the bootstrap interval`);
 }
});

test('repeated suspension and resume preserve mature review status and all prior evidence',async()=>{
 const d=new EngiDB('adaptive22-'+crypto.randomUUID());try{
  const b=fixture();await saveKnowledge(b,d);const item=canonicalTargets(b)[0],m=mature(item.targetId);m.bootstrap={successes:3,probeAfterCards:0};m.confusions={a1:2};await d.learningState.put(learningRow(m));
  await setUnitSuspended(m.id,true,d);await setUnitSuspended(m.id,true,d);const suspended=(await d.learningState.get(m.id))!.payload;assert.equal(suspended.status,'suspended');assert.equal(suspended.suspendedFrom,'review');assert.deepEqual(suspended.card,m.card);
  await setUnitSuspended(m.id,false,d);const resumed=(await d.learningState.get(m.id))!.payload;assert.equal(resumed.status,'review');assert.equal(resumed.suspendedFrom,undefined);assert.equal(resumed.attempts,m.attempts);assert.equal(resumed.firstSuccessAt,m.firstSuccessAt);assert.deepEqual(resumed.confusions,m.confusions);assert.deepEqual({...resumed.card,due:m.card.due},m.card);assert(new Date(resumed.card.due).getTime()<=Date.now());assert.equal(await d.reviewEvents.count(),0);
 }finally{d.close();await d.delete()}
});
