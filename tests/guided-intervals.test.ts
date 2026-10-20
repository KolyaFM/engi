import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EngiDB} from '../src/db/engi-db';
import {putBundle,learningRow} from '../src/db/repositories';
import {triagedMemory} from '../src/lib/engi/learning/bootstrap';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {compileTaskContract,taskContentRevisions} from '../src/lib/engi/study-core/compiler';
import {goalProposalPool} from '../src/services/goal-proposals';
import {buildIntervalGroup} from '../src/services/interval-group-composition';
import {createTrainerService} from '../src/services/trainer-service';
import {prepareStudyTask} from '../src/services/study-core-bridge';
import {parseV3} from '../src/lib/engi/import/schema-v3';
import {buildImportPlan} from '../src/lib/engi/import/semantic-merge';
import type {Bundle} from '../src/lib/engi/types';
import {intervals} from './helpers-intervals';

function fixture():Bundle{
 const entries=[['kennedy','presidency',1961,1963],['kennedy','senate',1953,1960],['ussr','existence',1922,1991],['vietnam','event',1955,1975],['ww2','event',1939,1945]] as const;
 return {entities:[['kennedy','Джон Кеннеди','person'],['ussr','СССР','country'],['vietnam','Война во Вьетнаме','event'],['ww2','Вторая мировая война','event']].map(([id,name,type])=>({id,name,type,aliases:[],externalIds:{}})),facts:entries.map(([entityId,key,start,end],n)=>({id:'fact'+n,entityId,key,valueKind:'date',dateStart:start+'-01-01',dateEnd:end+'-12-31',datePrecision:'range',source:{kind:'manual',name:'test'},verification:'verified'})),properties:[['presidency','Период президентских полномочий','Президентство'],['senate','Работа в Сенате','Работа в Сенате'],['existence','Период существования','Период существования'],['event','Даты события','Даты события']].map(([id,name,shortName])=>({id,name,shortName,valueKind:'date',cardinality:'one',learnable:true,learning:{recallReveal:'off'}})),media:[],tags:[],entityTags:[],missing:[],unresolved:[]};
}
function proposals(b:Bundle){const enabled=canonicalTargets(b).map(i=>triagedMemory(i,'red','s',0));return {enabled,ready:goalProposalPool(b,enabled,'all','choice').proposals};}

test('guided phone groups mix custom fields, keep five facts and distinguish two periods of one object',()=>{
 const b=fixture(),{ready}=proposals(b),t=buildIntervalGroup(b,ready,[],[],300)!;
 assert(t);assert.equal(t.items.length,5);assert.equal(t.intervalExercise?.kind,'bands');if(t.intervalExercise?.kind==='bands')assert.equal(t.intervalExercise.interaction,'quiz');
 assert.equal(t.items.filter(i=>i.entityId==='kennedy').length,2);assert.equal(t.items.find(i=>i.factId==='fact0')!.interval?.propertyLabel,'Президентство');
 const c=compileTaskContract(b,t);assert(c.response.kind==='mapping');assert.equal(new Set(c.response.bindings.map(v=>v.responseKey)).size,5);assert(c.response.bindings.every(v=>t.items.some(i=>i.targetId===v.responseKey)));
 const changed=structuredClone(b);changed.properties!.find(p=>p.id==='event')!.learning={rangeBands:'off'};assert.throws(()=>compileTaskContract(changed,t));assert(Object.values(taskContentRevisions(changed,t,c)).every(v=>v==='unavailable'));
 const restricted=buildIntervalGroup(changed,proposals(changed).ready,[],[],300)!;assert(restricted);assert(restricted.items.every(i=>!['fact3','fact4'].includes(i.factId!)));
});

test('guided pair persistence owns the chosen fact, restores progress and cannot update exact memory',async()=>{
 const b=fixture(),{enabled,ready}=proposals(b),task=buildIntervalGroup(b,ready,[],[],300)!,d=new EngiDB('guided-'+crypto.randomUUID());assert(task);
 try{await putBundle(d,b);await d.learningState.bulkPut(enabled.map(learningRow));const svc=createTrainerService(d),base=await svc.startGoalFeed('all','mixed','daily',{endless:true});await prepareStudyTask(d,b,task);await d.activeSessions.put({...base,tasks:[task],currentPosition:0,intro:undefined,interaction:undefined});
  const kennedy=task.items.filter(i=>i.entityId==='kennedy'),first=kennedy[0],wrong=task.items.find(i=>i.entityId==='ussr')!;
  const failure=await svc.answerMatchPair({sessionId:base.id,taskId:task.id,entityId:first.entityId,responseKey:first.targetId,answerId:wrong.answerId,requestId:'wrong'});assert(!failure.correct);
  const mistake=(await d.appMeta.get('studyCore:mistakeEpisodes'))!.value.episodes[0];assert.equal(mistake.goal.id,task.studyContract!.primaryGoals.find(g=>g.knowledge.key===first.factId)!.id,'guided failure belongs to the asked period, not the clicked distractor');
  for(const item of kennedy){const result=await svc.answerMatchPair({sessionId:base.id,taskId:task.id,entityId:item.entityId,responseKey:item.targetId,answerId:item.answerId,requestId:crypto.randomUUID()});assert(result.correct);}
  const saved=(await d.activeSessions.get(base.id))!;assert.equal(Object.keys(saved.interaction!.matching!.matched).length,2);
  const rows=await d.reviewEvents.toArray();assert.equal(rows.filter(r=>r.id.startsWith(task.id+':pair:')).length,2);
  assert.equal(await d.appMeta.where('key').startsWith('studyCore:memory:').count(),0);
  for(const i of task.items.filter(i=>i.entityId!=='kennedy'))await svc.answerMatchPair({sessionId:base.id,taskId:task.id,entityId:i.entityId,responseKey:i.targetId,answerId:i.answerId,requestId:crypto.randomUUID()});
  assert((await d.reviewEvents.get(task.id))!.payload.feedback.matchingComplete);
 }finally{d.close();await d.delete();}
});

test('legacy saved interval contracts retain entity response keys and original property revisions',()=>{
 const b=intervals(),t=buildIntervalGroup(b,proposals(b).ready,[],[],300)!;assert(t.intervalExercise?.kind==='bands');delete t.intervalExercise.interaction;
 const c=compileTaskContract(b,t);assert(c.response.kind==='mapping');assert(c.response.bindings.every(v=>b.entities.some(e=>e.id===v.responseKey)));
 const p=b.properties![0];assert.equal(c.contentRevisions['property:'+p.id],JSON.stringify([p.valueKind,p.cardinality,p.learnable,p.learning,p.promptTemplates,p.inverse]));
});

test('declarative shortName is optional display metadata and survives reimport without changing facts',()=>{
 const raw={schemaVersion:3,name:'P',properties:[{name:'Период президентских полномочий',shortName:'Президентство',valueType:'date'}],entities:[{name:'Джон Кеннеди',type:'Человек',facts:[{property:'Период президентских полномочий',value:{start:1961,end:1963},source:{kind:'manual',name:'test'},verification:'verified'}]}]};
 const pkg=parseV3(raw),empty:Bundle={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[]},b=buildImportPlan(pkg,empty,{},'one').bundle;assert.equal(b.properties!.find(p=>p.name===raw.properties[0].name)!.shortName,'Президентство');
 const next=buildImportPlan(parseV3({...raw,properties:[{...raw.properties[0],shortName:'На посту президента'}]}),b,{},'two').bundle;assert.equal(next.facts[0].id,b.facts[0].id);assert.equal(next.properties!.find(p=>p.name===raw.properties[0].name)!.shortName,'На посту президента');
});
