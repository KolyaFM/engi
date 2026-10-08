import assert from 'node:assert/strict';
import {EngiDB} from '../src/db/engi-db';
import {putBundle,learningRow} from '../src/db/repositories';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {triagedMemory} from '../src/lib/engi/learning/bootstrap';
import {createTrainerService} from '../src/services/trainer-service';
import type {Bundle,Task} from '../src/lib/engi/types';
import {knowledgeMistakeKey} from '../src/lib/engi/study-core/mistakes';
import {goalRetention} from '../src/lib/engi/knowledge/goal-progress';
import {goalProposalPool} from '../src/services/goal-proposals';
import {admitStudyCandidates} from '../src/lib/engi/session/study-availability';
export type LiveScenario={seed:number;days:number;size:number;limit:number;profile:'steady'|'errors'|'short';format:string};
function fixture(size:number):Bundle{
 return {entities:[...Array.from({length:size},(_,i)=>({id:'s'+i,name:'Объект '+i,type:'subject',aliases:[],externalIds:{}})),...Array.from({length:8},(_,i)=>({id:'a'+i,name:'Автор '+i,type:'answer',aliases:[],externalIds:{}}))],facts:Array.from({length:size},(_,i)=>({id:'f'+i,entityId:'s'+i,key:'author',valueKind:'entity',valueEntityId:'a'+i%8,verification:'user_confirmed',source:{kind:'manual',name:'Модель'}})),media:[],tags:[],entityTags:[],missing:[],unresolved:[],entityTypes:[{id:'subject',name:'Объект'},{id:'answer',name:'Автор'}],properties:[{id:'author',name:'Автор',valueKind:'entity',cardinality:'one',learnable:true,subjectTypes:['subject'],targetTypes:['answer']}]};
}
export async function simulateLiveStudy(scenario:LiveScenario,setTime:(at:number)=>void){
 let seed=scenario.seed;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const originalRandom=Math.random;Math.random=random;
 const d=new EngiDB('live-model-'+crypto.randomUUID()),bundle=fixture(scenario.size),start=new Date(2026,9,8,10).getTime(),trace:string[]=[];
 let screens=0,credited=0,repairs=0,groupScreens=0,repeatedObjects=0,repeatedLearningObjects=0,avoidableLearningRepeats=0,adjacent=0,restarts=0,errorsCreated=0,hints=0,lastObject:string|undefined;
 const formats=new Set<string>(),visited=new Set<string>(),daily:number[]=[];
 function correct(task:Task){const r=task.studyContract!.response;if(r.kind==='choice')return r.expected;if(r.kind==='set')return r.expected;if(r.kind==='self-report')return true;throw Error('Unexpected atomic format '+r.kind);}
 try{
  setTime(start);await putBundle(d,bundle);
  for(const item of canonicalTargets(bundle))await d.learningState.put(learningRow({...triagedMemory(item,'red','',0),status:'review',bootstrap:undefined}));
  const enabled=(await d.learningState.toArray()).map(r=>r.payload);
  await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:scenario.limit}});
  let svc=createTrainerService(d);
  for(let day=0;day<scenario.days;day++){
   let now=start+day*86400000;setTime(now);let session=await svc.startGoalFeed('all',scenario.format);
   const end=now+(scenario.profile==='short'?180:1800)*1000;
   for(let step=0;step<60&&now<end;step++){
    if(session.exhausted){
     const plan=await svc.getDayPlan();assert.equal(plan.mistakes?.length??0,0,'stop with repairable errors');
     const next=Date.parse(session.waitingUntil??'');if(!Number.isFinite(next)||next>=end)break;
     now=Math.max(now+1,next+1);setTime(now);session=await svc.refreshGoalFeed(session.id);continue;
    }
    assert(!session.intro,'configured fixture must not need an intro');const task=session.tasks[0];assert(task);
    trace.push(`${day}:${step} ${task.intent} ${task.recipe.format} ${task.items.map(i=>i.factId).join(',')}`);if(trace.length>12)trace.shift();
    const before=(await d.appMeta.where('key').startsWith('studyCore:memory:').toArray()).map(r=>r.value),beforeMap=new Map(before.map(m=>[m.goalId,m]));
    if(task.intent==='learn'&&lastObject&&task.items.some(i=>i.entityId===lastObject)){
     const pool=goalProposalPool(bundle,enabled,'all',scenario.format),ids=[...new Set(pool.proposals.flatMap(p=>p.goals.map(g=>g.id)))],rows=await d.appMeta.bulkGet(ids.map(id=>'studyCore:exposure:'+id)),exposures=new Map(rows.filter(r=>!!r).map(r=>[r!.value.goalId,r!.value]));
     const admitted=admitStudyCandidates(pool.proposals,p=>p.goals,await svc.getDayPlan(),beforeMap,exposures,now).available,kind=task.studyContract!.primaryGoals.some(g=>beforeMap.has(g.id));
     if(admitted.some(p=>p.goals.some(g=>beforeMap.has(g.id))===kind&&p.items.every(i=>i.entityId!==lastObject)))avoidableLearningRepeats++;
    }
    for(const goal of task.studyContract!.primaryGoals){if(task.intent==='learn'&&beforeMap.has(goal.id))assert(new Date(beforeMap.get(goal.id).card.due).getTime()<=now,'FSRS review before due');visited.add(knowledgeMistakeKey(goal));}
    formats.add(task.recipe.format);screens++;if(lastObject){adjacent++;if(task.items.some(i=>i.entityId===lastObject)){repeatedObjects++;if(task.intent==='learn')repeatedLearningObjects++;}}lastObject=task.items[0].entityId;
    const episode=crypto.randomUUID();await svc.observeVisibility(session.id,task.id,'question',episode,'start');
    const hinted=step%17===9;if(hinted){hints++;await svc.observeVisibility(session.id,task.id,'source',task.id+':source','start');await svc.observeVisibility(session.id,task.id,'source',task.id+':source','end');}
    const wrong=scenario.profile==='errors'?random()<.42:random()<.12;
    if(task.studyContract!.response.kind==='mapping'){
     groupScreens++;let previous:string|undefined;
     for(const [n,item] of task.items.entries()){
      if(wrong&&n===0){const other=task.options.find(o=>o.id!==item.answerId)!;await svc.answerMatchPair({sessionId:session.id,taskId:task.id,entityId:item.entityId,answerId:other.id,requestId:crypto.randomUUID()});errorsCreated++;}
      await svc.answerMatchPair({sessionId:session.id,taskId:task.id,entityId:item.entityId,answerId:item.answerId,requestId:crypto.randomUUID()});
      const shown=crypto.randomUUID();await svc.observeVisibility(session.id,task.id,'matched-pairs',shown,'start');
      if(previous)await svc.observeVisibility(session.id,task.id,'matched-pairs',previous,'end');previous=shown;
      now+=1500;setTime(now);
     }
     if(previous)await svc.observeVisibility(session.id,task.id,'matched-pairs',previous,'end');
    }else{
     if(task.recipe.format==='recall_reveal'){now+=5000;setTime(now);await svc.saveInteraction(session.id,task.id,{recallElapsedMs:5000,revealed:true});await svc.observeVisibility(session.id,task.id,'answer-reveal',task.id+':reveal','start');}
     const right=correct(task),rule=task.studyContract!.response;
     const answer=wrong?(rule.kind==='choice'?rule.options.find(o=>o!==rule.expected)!:rule.kind==='set'?[]:false):right;
     await svc.answer({sessionId:session.id,taskId:task.id,answer,latencyMs:1500});
     if(wrong){errorsCreated++;if(rule.kind==='choice')await svc.answer({sessionId:session.id,taskId:task.id,answer:right});}
     const stable=await d.appMeta.where('key').startsWith('studyCore:memory:').toArray();await svc.answer({sessionId:session.id,taskId:task.id,answer:right});assert.deepEqual(await d.appMeta.where('key').startsWith('studyCore:memory:').toArray(),stable,'duplicate answer rescheduled memory');
     if(task.recipe.format==='recall_reveal')await svc.observeVisibility(session.id,task.id,'answer-reveal',task.id+':reveal','end');
    }
    await svc.observeVisibility(session.id,task.id,'question',episode,'end');
    if(task.recipe.format!=='recall_reveal'){await svc.observeVisibility(session.id,task.id,'feedback',task.id+':feedback','start');await svc.observeVisibility(session.id,task.id,'feedback',task.id+':feedback','end');}
    const after=(await d.appMeta.where('key').startsWith('studyCore:memory:').toArray()).map(r=>r.value);
    for(const m of after){assert(Number.isFinite(m.card.stability)&&m.card.stability>=0);assert(m.independentSuccesses<=m.independentAttempts);assert(new Date(m.card.due).getTime()>=new Date(m.card.last_review).getTime());}
    if(task.intent==='repair'){repairs++;assert.deepEqual(after,before,'repair rescheduled FSRS');}
    const gain=after.reduce((n,m)=>n+m.independentAttempts,0)-before.reduce((n,m)=>n+m.independentAttempts,0);credited+=gain;
    if(hinted)assert.equal(gain,0,'hinted attempt counted as independent');
    const plan=await svc.getDayPlan();assert(plan.newGoalIds.length<=scenario.limit,'daily new budget exceeded');assert.equal(new Set(plan.newGoalIds).size,plan.newGoalIds.length);
    assert.equal(after.reduce((n,m)=>n+m.independentAttempts,0),credited,'independent counts diverged');
    if(step%7===3){svc=createTrainerService(d);const resumed=await svc.getResumableSession();assert.equal(resumed!.tasks[0]?.id,task.id);restarts++;}
    now+=15000;setTime(now);session=await svc.advanceFeed(session.id,false,task.id);
   }
   daily.push((await svc.getDayPlan()).newGoalIds.length);
  }
  const memory=(await d.appMeta.where('key').startsWith('studyCore:memory:').toArray()).map(r=>r.value),ledger=(await d.appMeta.get('studyCore:mistakeEpisodes'))?.value;
  return {...scenario,screens,credited,repairs,groupScreens,errorsCreated,hints,restarts,uniqueKnowledge:visited.size,formats:[...formats],adjacent,repeatedObjects,repeatedLearningObjects,avoidableLearningRepeats,repeatRate:adjacent?Number((repeatedObjects/adjacent).toFixed(3)):0,dailyNew:daily,remainingErrors:ledger?.episodes.filter((e:any)=>e.status==='open').length??0,retentionModel:memory.length?Number((memory.reduce((n,m)=>n+goalRetention(m),0)/memory.length).toFixed(3)):null};
 }catch(error){throw Error(`${JSON.stringify(scenario)}\n${trace.join('\n')}\n${(error as Error).stack}`);}finally{d.close();await d.delete();Math.random=originalRandom;}
}
