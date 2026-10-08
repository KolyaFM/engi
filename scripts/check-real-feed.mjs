// Isolated process: only this modelling run uses virtual wall time and seeded randomness.
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
const RealDate=Date,realRandom=Math.random;
let clock=new RealDate('2026-10-08T07:00:00Z').getTime(),randomState=1;
globalThis.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[clock]));}static now(){return clock;}};
Math.random=()=>{randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296;};
await import('fake-indexeddb/auto');
const {EngiDB}=await import('../src/db/engi-db.ts');
const {putBundle}=await import('../src/db/repositories.ts');
const {createTrainerService}=await import('../src/services/trainer-service.ts');
const {prepareDue}=await import('../tests/helpers22.ts');
const {createEmptyCard,State}=await import('ts-fsrs');
const {goalCandidates}=await import('../src/services/goal-candidates.ts');
const {buildGoalCatalog}=await import('../src/services/goal-catalog.ts');
const {interactionFamily}=await import('../src/lib/engi/session/interaction-family.ts');
const {isDiscrete,isMapping}=await import('../src/lib/engi/questions/timeline.ts');
const days=Number(process.argv.find(a=>a.startsWith('--days='))?.split('=')[1]??90);
const seed=Number(process.argv.find(a=>a.startsWith('--seed='))?.split('=')[1]??1);
const only=process.argv.find(a=>a.startsWith('--case='))?.split('=')[1];
const noPool=process.argv.includes('--no-pool');
assert(Number.isInteger(days)&&days>0&&days<=365);
function fixture(kind,size=8){
 const b={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[],entityTypes:[{id:'subject',name:'Объект'},{id:'answer',name:'Ответ'}],properties:[{id:'rel',name:'Автор',valueKind:'entity',cardinality:kind==='sets'?'many':'one',learnable:true,subjectTypes:['subject'],targetTypes:['answer']}]};
 for(let n=0;n<Math.max(4,Math.ceil(size/3));n++)b.entities.push({id:'a'+n,type:'answer',name:'Автор '+n,aliases:[],externalIds:{}});
 for(let n=0;n<size;n++){
  b.entities.push({id:'s'+n,type:'subject',name:'Объект '+n,aliases:[],externalIds:{}});
  const values=kind==='sets'?[n%4,(n+1)%4]:[kind==='scarce'?n%2:n%4];
  for(let j=0;j<values.length;j++)b.facts.push({id:'f'+n+':'+j,entityId:'s'+n,key:'rel',valueKind:'entity',valueEntityId:'a'+values[j],completeSet:true,verification:'user_confirmed',source:{kind:'manual',name:'Тестовые данные'}});
  if(['paintings','people'].includes(kind)&&n%4!==0)b.media.push({id:'m'+n,entityId:'s'+n,role:'image',url:'engi-media://fixture/'+n+'.png',sourceUrl:'',license:'test',learningExemplar:true});
  if(kind==='people')b.facts.push({id:'date'+n,entityId:'s'+n,key:'year',valueKind:'date',dateStart:(1800+n*4)+'-01-01',dateEnd:(1800+n*4)+'-12-31',datePrecision:'year',verification:'user_confirmed',source:{kind:'manual',name:'Тестовые данные'}});
 }
 if(kind==='people')b.properties.push({id:'year',name:'Начало срока',valueKind:'date',cardinality:'one',learnable:true,subjectTypes:['subject']});
 return b;
}
const cases=[{kind:'paintings',profile:'steady',minutes:15,maxAnswers:16},{kind:'people',profile:'short',minutes:3,maxAnswers:10},{kind:'sets',profile:'errors',minutes:15,maxAnswers:16},{kind:'scarce',profile:'irregular',minutes:6,maxAnswers:12}].filter(c=>!only||c.kind===only);
async function memories(db){return (await db.appMeta.where('key').startsWith('studyCore:memory:').toArray()).map(r=>r.value);}
async function runCase(config){
 const wallStart=performance.now(),start=new RealDate('2026-10-08T07:00:00Z').getTime();clock=start;randomState=seed;
 const db=new EngiDB('virtual-'+config.kind+'-'+crypto.randomUUID()),svc=createTrainerService(db),bundle=fixture(config.kind);
 const result={...config,days,seed,visitedDays:0,answers:0,skips:0,hints:0,intros:0,waits:0,credits:0,failures:0,corrections:0,objectRepeats:0,formatRepeats:0,pairs:0,maxLearning:0,newAdmitted:0,formats:{},interactions:{},firstLearningAges:[],daily:[]};
 try{
  await putBundle(db,bundle);await prepareDue(db);
  const initial=await svc.getGoalSnapshot(),catalogIds=initial.goalCatalog.map(e=>e.goal.id).sort();
  assert(catalogIds.length>0);
  const past=new Date(clock-30*86400000);
  for(const entry of initial.goalCatalog.slice(0,Math.floor(initial.goalCatalog.length/2)))await db.appMeta.put({key:'studyCore:memory:'+entry.goal.id,value:{goalId:entry.goal.id,goal:entry.goal,card:{...createEmptyCard(past),state:State.Review,due:past,last_review:past,stability:10,difficulty:5,reps:5},independentAttempts:5,independentSuccesses:5,lastCorrect:true}});
  const firstLearning=new Map(),counts=new Map();let last;
  for(let day=0;day<days;day++){
   if(config.profile==='irregular'&&day%3!==0)continue;
   result.visitedDays++;clock=start+day*86400000;
   const finish=clock+config.minutes*60000;
   let session=await svc.startGoalFeed('all','mixed'),answered=0,loops=0;
   while(clock<finish&&answered<config.maxAnswers&&loops++<config.maxAnswers*4+20){
    if(session.intro){result.intros++;await svc.observeIntroVisibility(session.id,'intro:'+session.id+':'+loops,'start');session=await svc.completeIntro(session.id);clock+=15000;continue;}
    if(session.exhausted){
     if(session.waitingUntil&&new Date(session.waitingUntil).getTime()<=finish){clock=Math.max(clock+1,new Date(session.waitingUntil).getTime());result.waits++;session=await svc.refreshGoalFeed(session.id);continue;}
     break;
    }
    const t=session.tasks[0];assert(t?.studyContract);assert(t.studyContract.primaryGoals.length>0);
    assert(t.items.length===1||t.recipe.format==='multi_choice'||isMapping(t),'Unexpected group: model must support its real response');
    const before=await memories(db),known=new Map(before.map(m=>[m.goalId,m]));
    await svc.observeVisibility(session.id,t.id,'question','q:'+t.id,'start');
    clock+=5000;await svc.observeVisibility(session.id,t.id,'question','q:'+t.id,'end');
    if(result.answers+result.skips>0&&(result.answers+result.skips)%19===0){session=await svc.advanceFeed(session.id,true,t.id);result.skips++;clock+=10000;continue;}
    const hinted=result.answers>0&&result.answers%17===0&&t.recipe.format!=='recall_reveal';
    if(hinted){await svc.observeVisibility(session.id,t.id,'source','source:'+t.id,'start');result.hints++;}
    const goalId=t.studyContract.primaryGoals[0].id,count=(counts.get(goalId)??0)+1;counts.set(goalId,count);
    const index=catalogIds.indexOf(goalId),correct=(index*37+count*29+seed*13)%100>=(config.profile==='errors'?65:20);
    const discrete=isDiscrete(t),expected=t.items[0].answerId;
    let answer;
    if(t.recipe.format==='recall_reveal'){await svc.saveInteraction(session.id,t.id,{recallElapsedMs:5000,revealed:true});await svc.observeVisibility(session.id,t.id,'answer-reveal','reveal:'+t.id,'start');answer=correct;}
    else if(t.recipe.format==='multi_choice')answer=correct?t.answerSet:[];
    else if(isMapping(t)){
     const values=t.items.map(i=>i.answerId);if(!correct){if(t.recipe.format==='match')[values[0],values[1]]=[values[1],values[0]];else values[0]=t.options.find(o=>o.id!==values[0]).id;}
     answer=Object.fromEntries(t.items.map((i,n)=>[i.entityId,values[n]]));
     await svc.saveInteraction(session.id,t.id,{mapping:answer});
    }
    else {assert(discrete);answer=correct?expected:t.options.find(o=>o.id!==expected).id;}
    const object=t.items[0].entityId;
    const interaction=interactionFamily(t);
    if(last){result.pairs++;if(last.object===object)result.objectRepeats++;if(last.format===interaction)result.formatRepeats++;}
    last={object,format:interaction};result.formats[t.recipe.format]=(result.formats[t.recipe.format]??0)+1;result.interactions[interaction]=(result.interactions[interaction]??0)+1;
    let response=await svc.answer({sessionId:session.id,taskId:t.id,answer});
    const attempt=(await db.appMeta.get('studyCore:attempt:'+t.id)).value;
    if(hinted){const revealed=new Set(t.studyContract.hintClaims.filter(c=>c.key==='source').flatMap(c=>c.revealsGoalIds));assert(!(attempt.results??[]).some(r=>r.credit&&revealed.has(r.goalId)),'Hinted goal received independent credit');await svc.observeVisibility(session.id,t.id,'source','source:'+t.id,'end');}
    if(t.recipe.format==='recall_reveal')await svc.observeVisibility(session.id,t.id,'answer-reveal','reveal:'+t.id,'end');
    for(const r of attempt.results??[])if(r.credit){
     result.credits++;if(!r.correct)result.failures++;
     const old=known.get(r.goalId);if(old)assert(new Date(old.card.due).getTime()<=new Date(attempt.submittedAt).getTime(),'Early credited review');
     else {result.newAdmitted++;firstLearning.set(r.goalId,clock);}
    }
    const firstState=await memories(db);
    if(response.pending){result.corrections++;response=await svc.answer({sessionId:session.id,taskId:t.id,answer:expected});assert.deepEqual(await memories(db),firstState,'Correction changed memory');}
    await svc.observeVisibility(session.id,t.id,'feedback','feedback:'+t.id,'start');clock+=1000;await svc.observeVisibility(session.id,t.id,'feedback','feedback:'+t.id,'end');
    result.answers++;answered++;
    const after=await memories(db),load=after.filter(m=>m.card.state===State.Learning).length;result.maxLearning=Math.max(result.maxLearning,load);assert(load<=3);
    for(const m of after)if(m.card.state===State.Review&&firstLearning.has(m.goalId)){result.firstLearningAges.push((clock-firstLearning.get(m.goalId))/86400000);firstLearning.delete(m.goalId);}
    const plan=await svc.getDayPlan();assert(plan.newGoalIds.length<=plan.newBudget);assert.equal(plan.learningGoalIds.length,load);
    clock+=9000;session=await svc.advanceFeed(session.id,false,t.id);
   }
   const snapshot=await svc.getGoalSnapshot();assert.deepEqual(snapshot.goalCatalog.map(e=>e.goal.id).sort(),catalogIds,'Catalog changed without content edits');
   const m=await memories(db),plan=snapshot.dayPlan;
   result.daily.push({day,answers:answered,new:plan.newGoalIds.length,learning:m.filter(v=>v.card.state===State.Learning).length,relearning:m.filter(v=>v.card.state===State.Relearning).length,review:m.filter(v=>v.card.state===State.Review).length,newHeld:plan.learningGoalIds.length>=plan.newBudget});
   if(day%15===0)process.stderr.write(config.kind+': virtual day '+day+'/'+days+'; answers='+result.answers+'\n');
  }
  const final=await svc.getGoalSnapshot();result.catalogGoals=final.goalCatalog.length;result.uncheckedGoals=final.goalCatalog.length-final.goalMemories.length;
  result.stillLearning=firstLearning.size;result.oldestFirstLearningDays=firstLearning.size?Math.max(...[...firstLearning.values()].map(v=>(clock-v)/86400000)):0;
  result.wallMs=Math.round(performance.now()-wallStart);
  return result;
 }finally{db.close();await db.delete();}
}
const results=[];
try{
 for(const config of cases)results.push(await runCase(config));
 // Generator coverage/performance is measured separately from the 90-day small-graph histories.
 const pool=[];
 if(!noPool)for(const kind of ['paintings','people','sets','scarce'])for(const size of [8,32,128,256]){
  const db=new EngiDB('pool-'+crypto.randomUUID());
  try{await putBundle(db,fixture(kind,size));await prepareDue(db);const enabled=(await db.learningState.toArray()).map(r=>r.payload),b=fixture(kind,size),begin=performance.now(),catalog=buildGoalCatalog(b,enabled),tasks=goalCandidates(b,enabled);pool.push({kind,size,goals:catalog.length,candidates:tasks.length,formats:[...new Set(tasks.map(t=>t.recipe.format))],interactions:[...new Set(tasks.map(interactionFamily))],maxItems:Math.max(...tasks.map(t=>t.items.length)),wallMs:Math.round(performance.now()-begin)});}finally{db.close();await db.delete();}
 }
 process.stdout.write(JSON.stringify({virtualClock:true,days,seed,results,pool},null,2)+'\n');
}finally{globalThis.Date=RealDate;Math.random=realRandom;}

