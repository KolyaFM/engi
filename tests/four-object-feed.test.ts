import 'fake-indexeddb/auto';
import {test,mock} from 'node:test';import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';
import {EngiDB} from '../src/db/engi-db';import {putBundle} from '../src/db/repositories';
import {createTrainerService} from '../src/services/trainer-service';
import {startStudyTrace,studyTraceReport,stopStudyTrace} from '../src/services/study-selection-trace';
import type {Bundle,Task} from '../src/lib/engi/types';
const content=(withFacts:boolean):Bundle=>({entities:Array.from({length:4},(_,n)=>({id:'e'+n,name:'Объект '+n,type:'person',aliases:[],externalIds:{}})),media:Array.from({length:4},(_,n)=>({id:'m'+n,entityId:'e'+n,role:'portrait',url:'https://example.test/'+n+'.png',license:'Test'})),facts:withFacts?Array.from({length:4},(_,n)=>({id:'f'+n,entityId:'e'+n,key:'year',valueKind:'date',dateStart:(1800+n*10)+'-01-01',dateEnd:(1800+n*10)+'-12-31',datePrecision:'year',verification:'verified',source:{name:'Test'}})):[],properties:withFacts?[{id:'year',name:'Год',valueKind:'date',cardinality:'one',learnable:true,learning:{reverse:false,sort:'off',timeline:'off',missing:'off'}}]:[],tags:[],entityTags:[],missing:[],unresolved:[]});
test('audit four-object fresh feeds with correct recall answers, resume and longer history',async()=>{
 const at=Date.parse('2026-10-23T09:00:00Z'),random=Math.random,uuid=crypto.randomUUID,reports=[];mock.timers.enable({apis:['Date'],now:at});
 try{for(const withFacts of [false,true])for(const seedValue of [1,17,41]){
  let seed=seedValue,serial=0;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};crypto.randomUUID=()=>`00000000-0000-4000-8000-${(++serial).toString(16).padStart(12,'0')}`;mock.timers.setTime(at);
  const db=new EngiDB('four-object-'+withFacts+'-'+seedValue);try{
   await putBundle(db,content(withFacts));startStudyTrace(db,1000);const svc=createTrainerService(db);let s=await svc.startGoalFeed('all','mixed','daily',{endless:true});const screens:{turn:number;format:string;objects:string[];properties:string[];reason:string;intent?:Task['intent'];learningRecall:boolean}[]=[];
   for(let turn=0;turn<64;turn++){
    mock.timers.setTime(at+(turn+1)*8000);
    assert(!s.exhausted,'four admitted objects must remain playable');if(s.intro){s=await svc.completeIntro(s.id);continue;}
    const q=s.tasks[0];assert(q);screens.push({turn,format:q.presentation??q.recipe.format,objects:q.items.map(i=>i.entityId),properties:q.studyContract!.primaryGoals.map(g=>g.knowledge.kind+':'+g.knowledge.key),reason:q.reason,intent:q.intent,learningRecall:!!q.learningRecall});
    if(turn%5===0){const resumed=await svc.getResumableSession({endless:true});assert.equal(resumed!.tasks[0].id,q.id,'resume keeps the pending task, not a new repeat');s=resumed!;}
    await svc.observeVisibility(s.id,q.id,'question','question'+turn,'start');
    if(q.recipe.format==='self_check'){for(const item of q.items)await svc.observeVisibility(s.id,q.id,`card-reveal:${item.entityId}`,'flip'+turn+item.entityId,'start');s=await svc.advanceFeed(s.id,true,q.id);continue;}
    const response=q.studyContract!.response;
    if(response.kind==='self-report'){await svc.saveInteraction(s.id,q.id,{revealed:true,recallElapsedMs:5000});await svc.observeVisibility(s.id,q.id,'answer-reveal','reveal'+turn,'start');await svc.answer({sessionId:s.id,taskId:q.id,answer:true});}
    else if(response.kind==='mapping')await svc.answer({sessionId:s.id,taskId:q.id,answer:Object.fromEntries(response.bindings.filter(b=>!b.support).map(b=>[b.responseKey,b.expected]))});
    else if(response.kind==='choice'||response.kind==='order'||response.kind==='practice-choice')await svc.answer({sessionId:s.id,taskId:q.id,answer:response.expected});
    else throw Error('Unexpected response '+response.kind);
    await svc.observeVisibility(s.id,q.id,'feedback','feedback'+turn,'start');await svc.observeVisibility(s.id,q.id,'feedback','feedback'+turn,'end');s=await svc.advanceFeed(s.id,false,q.id);
    if(turn>0&&turn%13===0){const previous=s.cooldown!;s=await svc.startGoalFeed('all','mixed','daily',{endless:true});assert.deepEqual(s.cooldown?.map(t=>t.id),previous.map(t=>t.id),'a new visit must retain the bounded recall history, not only the last three tasks');}
   }
   const recalls=screens.filter(q=>q.format==='recall_reveal'),byObject=Object.fromEntries(content(withFacts).entities.map(e=>[e.id,recalls.filter(q=>q.objects.includes(e.id)).map(q=>q.turn)]));
   const trace=studyTraceReport(db);assert(trace.filter(e=>e.kind==='answer').every(e=>(e.results as {correct:boolean}[]).every(r=>r.correct)),'all submitted answers are correct');assert.equal((await svc.getDayPlan()).workload!.mistakes,0);
   reports.push({withFacts,seedValue,byObject,screens,trace});console.log('Fresh four-object feed:',JSON.stringify({withFacts,seedValue,byObject}));
   assert.equal(new Set(screens.flatMap(q=>q.objects)).size,4,'all four objects remain in the feed across formats');
   const lastRecall=new Map<string,number>();for(const [index,screen] of screens.entries()){if(screen.format!=='recall_reveal')continue;const key=screen.objects[0]+':'+screen.properties[0],previous=lastRecall.get(key);assert(previous===undefined||index-previous>=20,'the same knowledge must not return as optional recall within twenty exercises');lastRecall.set(key,index);}
   for(let n=0;n<screens.length;n++)assert(screens.slice(Math.max(0,n-19),n+1).filter(q=>q.format==='recall_reveal').length<=2,'actual mixed screens keep optional recall at most two in twenty');
  }finally{stopStudyTrace(db);db.close();await db.delete();}
 }}finally{Math.random=random;crypto.randomUUID=uuid;mock.timers.reset();await mkdir('artifacts',{recursive:true});await writeFile('artifacts/four-object-feed.json',JSON.stringify(reports,null,2));}
});
