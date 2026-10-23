import 'fake-indexeddb/auto';
import {test,mock} from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {EngiDB} from '../src/db/engi-db';
import {putBundle} from '../src/db/repositories';
import {createTrainerService} from '../src/services/trainer-service';
import {startStudyTrace,studyTraceReport,stopStudyTrace} from '../src/services/study-selection-trace';
import type {Bundle,Task} from '../src/lib/engi/types';
import type {SelectionDecision} from '../src/services/selection-decision';
import {buildGoalCatalog} from '../src/services/goal-catalog';

function fixture():Bundle{return {entities:[...Array.from({length:24},(_,n)=>({id:'s'+n,name:'Объект '+n,type:'s',aliases:[],externalIds:{}})),...Array.from({length:4},(_,n)=>({id:'a'+n,name:'Категория '+n,type:'a',aliases:[],externalIds:{}}))],facts:Array.from({length:24},(_,n)=>[
 {id:'year'+n,entityId:'s'+n,key:'year',valueKind:'date' as const,dateStart:String(1800+n*5),datePrecision:'year' as const},
 {id:'group'+n,entityId:'s'+n,key:'group',valueKind:'entity' as const,valueEntityId:'a'+n%4},
 {id:'side'+n,entityId:'s'+n,key:'side',valueKind:'entity' as const,valueEntityId:'a'+n%2},
].map(f=>({...f,verification:'user_confirmed' as const,source:{kind:'manual' as const,name:'Synthetic variety test'}}))).flat(),media:[],tags:[],entityTags:[],missing:[],unresolved:[],entityTypes:[{id:'s',name:'Объект'},{id:'a',name:'Категория'}],properties:[{id:'year',name:'Год',valueKind:'date',cardinality:'one',learnable:true,subjectTypes:['s'],learning:{timeline:'off',missing:'off'}},...['group','side'].map(id=>({id,name:id,valueKind:'entity' as const,cardinality:'one' as const,learnable:true,subjectTypes:['s'],targetTypes:['a']}))]};}

async function answer(d:EngiDB,svc:ReturnType<typeof createTrainerService>,s:any,q:Task){
 await svc.observeVisibility(s.id,q.id,'question','visible:'+q.id,'start');
 if(q.recipe.format==='self_check'){for(const item of q.items)await svc.observeVisibility(s.id,q.id,`card-reveal:${item.entityId}`,'flip:'+q.id+':'+item.entityId,'start');return svc.advanceFeed(s.id,true,q.id);}
 if(q.recipe.format==='recall_reveal'){await svc.saveInteraction(s.id,q.id,{revealed:true,recallElapsedMs:5000});await svc.observeVisibility(s.id,q.id,'answer-reveal','revealed:'+q.id,'start');}
 if(q.items.length>1&&['match','categorize'].includes(q.recipe.format)){for(const item of q.items)await svc.answerMatchPair({sessionId:s.id,taskId:q.id,entityId:item.entityId,answerId:item.answerId,requestId:crypto.randomUUID()});}
 else {const r=q.studyContract!.response;const value=r.kind==='choice'||r.kind==='set'||r.kind==='order'?r.expected:r.kind==='self-report'?true:undefined;assert.notEqual(value,undefined,r.kind);await svc.answer({sessionId:s.id,taskId:q.id,answer:value});}
 await svc.observeVisibility(s.id,q.id,'question','visible:'+q.id,'end');
 return svc.advanceFeed(s.id,false,q.id);
}

test('actual lifecycle decisions explain fresh, multi-day and extended feeds without changing seeded selection',async()=>{
 const at=Date.parse('2026-10-14T09:00:00Z'),random=Math.random,uuid=crypto.randomUUID;mock.timers.enable({apis:['Date'],now:at});
 const reports=[];
 try{for(const [name,days,steps] of [['fresh',1,35],['multi-day',3,45],['extended',1,140]] as const){
  let seed=41,serial=0;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};crypto.randomUUID=()=>`00000000-0000-4000-8000-${(++serial).toString(16).padStart(12,'0')}`;
  const sequences=[];
  // Fresh scenario also runs without diagnostics to verify exact passive behavior.
  for(const tracing of name==='fresh'?[false,true]:[true]){
   seed=41;serial=0;mock.timers.setTime(at);const d=new EngiDB('variety-'+name+'-'+tracing);try{
    const b=fixture();await putBundle(d,b);buildGoalCatalog(b,[]);seed=41;serial=0;await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:10}});if(tracing)startStudyTrace(d,1000);
    const svc=createTrainerService(d);let s=await svc.startGoalFeed('all','mixed','daily',{endless:true});const sequence=[],presentations:Record<string,number>={};
    for(let day=0;day<days;day++)for(let n=0;n<steps;n++){
     mock.timers.setTime(at+day*86400000+(n+1)*15000);assert(!s.exhausted,`${name} stopped at ${day}:${n}`);
     if(s.intro){sequence.push(['intro',s.intro.entityId]);s=await svc.completeIntro(s.id);continue;}
     const q=s.tasks[0];assert(q);const format=q.items.length===1&&['match','categorize'].includes(q.recipe.format)?'single-choice':q.presentation??q.recipe.format;presentations[format]=(presentations[format]??0)+1;
     sequence.push([q.intent,format,q.items.map(i=>i.entityId),q.studyContract?.primaryGoals.map(g=>g.id)]);s=await answer(d,svc,s,q);
    }
    // Random admission changes when the last properties enter confirmation.
    // Drain a bounded tail instead of requiring graduation at an arbitrary cutoff.
    if(name==='extended')for(let n=0;n<40&&(await svc.getDayPlan()).workload!.learning>0;n++){
     mock.timers.setTime(at+(steps+n+1)*15000);assert(!s.intro,'The extended fixture should already have admitted all objects');
     const q=s.tasks[0];assert(q);const format=q.items.length===1&&['match','categorize'].includes(q.recipe.format)?'single-choice':q.presentation??q.recipe.format;presentations[format]=(presentations[format]??0)+1;
     sequence.push([q.intent,format,q.items.map(i=>i.entityId),q.studyContract?.primaryGoals.map(g=>g.id)]);s=await answer(d,svc,s,q);
    }
    sequences.push(sequence);
    if(tracing){const trace=studyTraceReport(d),selections=trace.filter(e=>e.kind==='selection');assert(selections.every(e=>(e.decision as SelectionDecision)?.branch),'Every lifecycle selection must carry its actual branch');
     const branches:Record<string,number>={},checks:Record<string,number>={};let adjacentObjects=0,adjacentProperties=0,repeatWithAlternative=0;
     for(const event of selections){const decision=event.decision as SelectionDecision;branches[decision.branch]=(branches[decision.branch]??0)+1;for(const [format,check] of Object.entries(decision.checks)){const key=format+':'+check.status;checks[key]=(checks[key]??0)+1;}if(decision.selected?.objectDistance===1){adjacentObjects++;if(decision.alternatives?.some(p=>p.objectPenalty<100))repeatWithAlternative++;}if(decision.selected?.propertyDistance===1)adjacentProperties++;}
     const ledger=(await d.appMeta.get('studyCore:learningLifecycle'))!.value,plan=await svc.getDayPlan();
     const summary={name,days,screens:sequence.length,presentations,branches,checks,adjacentObjects,adjacentProperties,repeatWithAlternative,introduced:ledger.cards.length,dailyIntroductions:ledger.cards.filter((c:any)=>c.source==='daily').length,extraIntroductions:ledger.cards.filter((c:any)=>c.source==='extra').length,completedProperties:ledger.units.filter((u:any)=>u.stage==='completed').length,workload:plan.workload};
     if(repeatWithAlternative){mkdirSync('artifacts',{recursive:true});writeFileSync('artifacts/feed-variety-repeats.json',JSON.stringify(selections.filter(e=>(e.decision as SelectionDecision).selected?.objectDistance===1),null,2));}
     const grouped=(presentations.match??0)+(presentations.categorize??0)+(presentations.conveyor??0);
     assert.equal(plan.workload?.mistakes,0);assert(ledger.units.length>0);assert.equal(repeatWithAlternative,0,'Do not trade an immediate object repeat for format variety');
     if(name==='multi-day')assert(grouped>=5,`Compatible groups must not be crowded out by atomic questions: ${grouped}`);
     if(name==='extended'){assert(summary.extraIntroductions>0,'Long play must admit additional objects');assert.equal(plan.workload?.learning,0,'Extended correct play must finish admitted properties rather than cycle a subset');}reports.push({summary,trace});console.log('Feed variety: '+JSON.stringify(summary));
    }
   }finally{stopStudyTrace(d);d.close();await d.delete();}
  }if(name==='fresh')assert.deepEqual(sequences[1],sequences[0],'Diagnostics must not change random draws, selected tasks or goals');
 }
 mkdirSync('artifacts',{recursive:true});writeFileSync('artifacts/feed-variety.json',JSON.stringify(reports,null,2));
 }finally{Math.random=random;crypto.randomUUID=uuid;mock.timers.reset();}
});
