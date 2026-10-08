/** Diagnostic only: synthetic databases, virtual time, no product policy changes. */
import 'fake-indexeddb/auto';
import {mock} from 'node:test';
import {writeFileSync,mkdirSync} from 'node:fs';
import {EngiDB} from '../src/db/engi-db';
import {putBundle,getBundle,learningRow} from '../src/db/repositories';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {triagedMemory} from '../src/lib/engi/learning/bootstrap';
import {createTrainerService} from '../src/services/trainer-service';
import {buildGoalCatalog} from '../src/services/goal-catalog';
import {LIFECYCLE_KEY} from '../src/services/learning-lifecycle-service';
import {startStudyTrace,studyTraceReport} from '../src/services/study-selection-trace';
import {createEmptyCard} from 'ts-fsrs';
import type {Bundle} from '../src/lib/engi/types';
import type {LearningLifecycle} from '../src/lib/engi/study-core/acquisition';

const fixture=(count:number,properties:number):Bundle=>({
 entities:Array.from({length:count},(_,n)=>[{id:'s'+n,name:'Object '+n,type:'s',aliases:[],externalIds:{}},{id:'a'+n,name:'Answer '+n,type:'a',aliases:[],externalIds:{}}]).flat(),
 facts:Array.from({length:count},(_,n)=>Array.from({length:properties},(_,p)=>({id:`p${p}-${n}`,entityId:'s'+n,key:'p'+p,valueKind:'entity' as const,valueEntityId:'a'+n,verification:'user_confirmed' as const,source:{kind:'manual' as const,name:'Synthetic audit'}}))).flat(),
 media:[],tags:[],entityTags:[],missing:[],unresolved:[],entityTypes:[{id:'s',name:'Object'},{id:'a',name:'Answer'}],
 properties:Array.from({length:properties},(_,p)=>({id:'p'+p,name:'Property '+p,valueKind:'entity' as const,cardinality:'one' as const,learnable:true,subjectTypes:['s'],targetTypes:['a']})),
});
const cases=[
 {name:'fresh-fast',properties:2,seconds:3,reviews:0,errors:false},
 {name:'fresh-normal',properties:2,seconds:10,reviews:0,errors:false},
 {name:'fresh-slow',properties:2,seconds:30,reviews:0,errors:false},
 {name:'one-property',properties:1,seconds:10,reviews:0,errors:false},
 {name:'eight-properties',properties:8,seconds:10,reviews:0,errors:false},
 {name:'due-reviews',properties:2,seconds:10,reviews:5,errors:false},
 {name:'with-errors',properties:2,seconds:10,reviews:0,errors:true},
];
const reports=[];
function compactTrace(events:ReturnType<typeof studyTraceReport>){return events.map(event=>{
 const candidates=event.candidates as {blocks:string[]}[]|undefined,acquisition=event.acquisition as {activeObjects:number;capacity:number;units:{stage:string}[]}|undefined;
 const candidateBlockCounts:Record<string,number>={},stageCounts:Record<string,number>={};
 for(const c of candidates??[])for(const block of c.blocks)candidateBlockCounts[block]=(candidateBlockCounts[block]??0)+1;
 for(const unit of acquisition?.units??[])stageCounts[unit.stage]=(stageCounts[unit.stage]??0)+1;
 return {...event,candidates:undefined,candidateBlockCounts,acquisition:acquisition?{activeObjects:acquisition.activeObjects,capacity:acquisition.capacity,stageCounts}:undefined};
});}
for(const scenario of cases){
 const initial=new Date(2026,9,8,10).getTime(),db=new EngiDB('queue-audit-'+crypto.randomUUID()),bundle=fixture(24,scenario.properties);
 mock.timers.enable({apis:['Date'],now:initial});
 try{
  await putBundle(db,bundle);await db.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:10}});
  if(scenario.reviews){
   const stored=await getBundle(db),oldOwners=new Set(Array.from({length:scenario.reviews},(_,n)=>'s'+n));
   for(const item of canonicalTargets(stored).filter(i=>oldOwners.has(i.factId?stored.facts.find(f=>f.id===i.factId)!.entityId:i.entityId)))await db.learningState.put(learningRow(triagedMemory(item,'green','audit-seed',0)));
   await db.appMeta.put({key:'introducedEntities',value:[...oldOwners]});
   for(const entry of buildGoalCatalog(stored,(await db.learningState.toArray()).map(r=>r.payload)).filter(e=>e.goal.skill==='recognition'&&e.entityIds.some(id=>oldOwners.has(id)))){
   await db.appMeta.put({key:'studyCore:memory:'+entry.goal.id,value:{goalId:entry.goal.id,goal:entry.goal,card:{...createEmptyCard(),state:2,reps:1,last_review:new Date(initial-86400000),due:new Date(initial-1000)},independentAttempts:1,independentSuccesses:1,lastCorrect:true}});
  }}
  const svc=createTrainerService(db);startStudyTrace(db,1000);let s=await svc.startGoalFeed('all','choice','daily',{endless:true});
  const screens:any[]=[],gaps:number[]=[],lastChecks=new Map<string,number>();let maxActiveObjects=0;
  for(let n=0;n<120;n++){
   mock.timers.setTime(initial+n*scenario.seconds*1000);
   if(s.intro){screens.push({screen:n,seconds:n*scenario.seconds,kind:'intro',objects:[s.intro.entityId]});s=await svc.completeIntro(s.id);}
   else{
    const task=s.tasks[0];if(!task){screens.push({screen:n,kind:'exhausted'});break;}
    const before=(await db.appMeta.get(LIFECYCLE_KEY))!.value as LearningLifecycle;
    const units=task.studyContract!.primaryGoals.map(g=>before.units.find(u=>u.goal.id===g.id)).filter(u=>!!u);
    const keys=units.map(u=>u!.key),owners=[...new Set(task.items.map(i=>i.factId?bundle.facts.find(f=>f.id===i.factId)!.entityId:i.entityId))];
    const kind=task.intent==='practice'?'game':task.intent==='repair'?'repair':units.some(u=>u!.stage!=='completed')?'acquisition':'review';
    for(const key of keys)if(kind==='acquisition'){const last=lastChecks.get(key);if(last!==undefined)gaps.push(n*scenario.seconds-last);lastChecks.set(key,n*scenario.seconds);}
    screens.push({screen:n,seconds:n*scenario.seconds,kind,objects:owners,knowledge:keys,stages:units.map(u=>u!.stage),format:task.recipe.format});
    if(task.recipe.format==='recall_reveal')await svc.saveInteraction(s.id,task.id,{revealed:true,recallElapsedMs:5000});
    const wrong=scenario.errors&&n%11===5&&task.recipe.format==='choice';
    if(task.items.length>1&&['match','categorize'].includes(task.recipe.format)){for(const item of task.items)await svc.answerMatchPair({sessionId:s.id,taskId:task.id,entityId:item.entityId,answerId:item.answerId,requestId:crypto.randomUUID()});}
    else {
     await svc.answer({sessionId:s.id,taskId:task.id,answer:task.recipe.format==='recall_reveal'?true:wrong?task.options.find(o=>o.id!==task.items[0].answerId)!.id:task.items[0].answerId});
     // Choice requires correcting this screen before advancing; this correction
     // must not be mistaken for a fresh learning/repair success.
     if(wrong)await svc.answer({sessionId:s.id,taskId:task.id,answer:task.items[0].answerId});
    }
    s=await svc.advanceFeed(s.id,false,task.id);
   }
   const ledger=(await db.appMeta.get(LIFECYCLE_KEY))!.value as LearningLifecycle;
   maxActiveObjects=Math.max(maxActiveObjects,new Set(ledger.units.filter(u=>u.stage!=='completed').map(u=>u.entityId)).size);
  }
  const ledger=(await db.appMeta.get(LIFECYCLE_KEY))!.value as LearningLifecycle,intros=screens.filter(e=>e.kind==='intro');
  const sorted=[...gaps].sort((a,b)=>a-b),acquisition=screens.filter(e=>e.kind==='acquisition');
  const summary={...scenario,seededReviewObjects:scenario.reviews,screens:screens.length,introductionsFirst20:intros.filter(e=>e.screen<20).length,firstIntroScreens:intros.slice(0,10).map(e=>e.screen),minimumSameKnowledgeGapSeconds:sorted[0],medianSameKnowledgeGapSeconds:sorted[Math.floor(sorted.length/2)],maxActiveObjects,acquisitionChecks:acquisition.length,reviews:screens.filter(e=>e.kind==='review').length,games:screens.filter(e=>e.kind==='game').length,completedProperties:ledger.units.filter(u=>u.stage==='completed').length,workload:(await svc.getDayPlan()).workload};
  reports.push({summary,screens,trace:compactTrace(studyTraceReport(db))});process.stdout.write(JSON.stringify(summary)+'\n');
 }finally{db.close();await db.delete();mock.timers.reset();}
}
mkdirSync(new URL('../artifacts/',import.meta.url),{recursive:true});
writeFileSync(new URL('../artifacts/learning-queue-audit.json',import.meta.url),JSON.stringify({policy:'production lifecycle scheduler; synthetic answers, virtual time',reports},null,2));
