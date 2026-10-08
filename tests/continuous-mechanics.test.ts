import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EngiDB} from '../src/db/engi-db';
import {putBundle,getBundle,learningRow} from '../src/db/repositories';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {triagedMemory} from '../src/lib/engi/learning/bootstrap';
import {buildGoalCatalog} from '../src/services/goal-catalog';
import {createTrainerService} from '../src/services/trainer-service';
import {createEmptyCard} from 'ts-fsrs';
import type {Bundle} from '../src/lib/engi/types';
const fixture:Bundle={entities:Array.from({length:6},(_,n)=>({id:'e'+n,name:'Event '+n,type:'event',aliases:[],externalIds:{}})),facts:Array.from({length:6},(_,n)=>({id:'date'+n,entityId:'e'+n,key:'date',valueKind:'date',dateStart:String(1600+n*60),datePrecision:'year',verification:'user_confirmed',source:{kind:'manual',name:'Test'}})),media:[],tags:[],entityTags:[],missing:[],unresolved:[],entityTypes:[{id:'event',name:'Event'}],properties:[{id:'date',name:'Date',valueKind:'date',cardinality:'one',learnable:true,subjectTypes:['event']}]};
async function run(format:string,action:(d:EngiDB,s:any)=>Promise<void>){const d=new EngiDB('mechanics-'+crypto.randomUUID());try{
 await putBundle(d,fixture);const b=await getBundle(d),targets=canonicalTargets(b).filter(i=>['e0','e1','e2'].includes(i.entityId));
 for(const item of targets)await d.learningState.put(learningRow(triagedMemory(item,'green','seed',0)));
 await d.appMeta.put({key:'introducedEntities',value:['e0','e1','e2']});await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:0}});
 for(const e of buildGoalCatalog(b,(await d.learningState.toArray()).map(r=>r.payload)).filter(e=>e.goal.skill==='recognition'&&e.entityIds.some(id=>['e0','e1','e2'].includes(id))))await d.appMeta.put({key:'studyCore:memory:'+e.goal.id,value:{goalId:e.goal.id,goal:e.goal,card:{...createEmptyCard(),state:2,reps:1,stability:5,difficulty:5,last_review:new Date(Date.now()-86400000),due:new Date(Date.now()+86400000)},independentAttempts:1,independentSuccesses:1}});
 await action(d,await createTrainerService(d).startGoalFeed('all',format,'daily',{endless:true}));
}finally{d.close();await d.delete();}}
test('mixed feed can use familiar chronology as practice, without unknown events or date credit',()=>run('mixed',async(d,s)=>{
 const svc=createTrainerService(d);for(let n=0;n<16&&!s.tasks[0]?.recipe.diagnostic;n++){const t=s.tasks[0];assert(t);if(t.recipe.format==='recall_reveal')await svc.saveInteraction(s.id,t.id,{revealed:true,recallElapsedMs:5000});await svc.answer({sessionId:s.id,taskId:t.id,answer:t.recipe.format==='recall_reveal'?true:t.items[0].answerId});s=await svc.advanceFeed(s.id,false,t.id);}
 const q=s.tasks[0];assert(q?.recipe.diagnostic);assert(q.items.every((i:any)=>['e0','e1','e2'].includes(i.entityId)));assert(q.studyContract.practice);assert.equal(q.studyContract.primaryGoals.length,0);
 const before=await d.appMeta.where('key').startsWith('studyCore:memory:').toArray();const answer=q.recipe.format==='sort'?q.studyContract.response.expected:q.recipe.format==='timeline'?{[q.items[0].entityId]:q.items[0].year}:q.studyContract.response.expected;
 await createTrainerService(d).answer({sessionId:s.id,taskId:q.id,answer});assert.deepEqual(await d.appMeta.where('key').startsWith('studyCore:memory:').toArray(),before);
}));
test('legacy timeline selection uses vertical chronology instead of a slider',()=>run('timeline',async(_d,s)=>{assert.equal(s.tasks[0]?.recipe.format,'sort');assert.equal(s.tasks[0]?.intent,'practice');}));
test('resuming an old slider task replaces it without rewriting learned date memory',()=>run('timeline',async(d,s)=>{const before=await d.appMeta.where('key').startsWith('studyCore:memory:').toArray();s.tasks=[{...s.tasks[0],id:'legacy-slider',studyContract:undefined,recipe:{...s.tasks[0].recipe,format:'timeline'}}];await d.activeSessions.put(s);const next=await createTrainerService(d).getResumableSession();assert.equal(next!.tasks[0].recipe.format,'sort');assert.deepEqual(await d.appMeta.where('key').startsWith('studyCore:memory:').toArray(),before);}));

