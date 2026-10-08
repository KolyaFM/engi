import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {Bundle,Task} from '../src/lib/engi/types';
import {compileTaskContract,compileIntroContract} from '../src/lib/engi/study-core/compiler';
import {createStudyCoreService} from '../src/services/study-core-service';
import {prepareStudyTask,auditStudyAnswer} from '../src/services/study-core-bridge';
import {EngiDB} from '../src/db/engi-db';
import {putBundle} from '../src/db/repositories';
const at=new Date('2026-10-08T02:00:00Z');
function bundle():Bundle{
 const b:Bundle={entities:[
  {id:'s0',type:'artwork',name:'Картина A',aliases:[],externalIds:{}},
  {id:'a0',type:'person',name:'Автор A',aliases:[],externalIds:{}},
  {id:'a1',type:'person',name:'Автор B',aliases:[],externalIds:{}},
  {id:'s1',type:'artwork',name:'Картина B',aliases:[],externalIds:{}},
 ],facts:[
  {id:'f0',entityId:'s0',key:'created_by',valueKind:'entity',valueEntityId:'a0',verification:'verified',completeSet:true,source:{kind:'manual',name:'test'}},
  {id:'f1',entityId:'s1',key:'created_by',valueKind:'entity',valueEntityId:'a1',verification:'verified',completeSet:true,source:{kind:'manual',name:'test'}},
 ],media:[{id:'m0',entityId:'s0',role:'primary',url:'engi-media://a'.repeat(1)+'a'.repeat(63),license:'test',primary:true}],tags:[],entityTags:[],missing:[],unresolved:[],properties:[{id:'created_by',name:'Автор',valueKind:'entity',cardinality:'one',learnable:true,subjectTypes:['artwork'],targetTypes:['person'],inverse:{enabled:false},learning:{forward:true}}]};
 return b;
}
function task(overrides:Partial<Task>={}):Task{return {id:crypto.randomUUID(),recipe:{id:'r',format:'choice',cue:'image',answerKey:'created_by',memoryKey:'x',diagnostic:false,direction:'forward',label:'Автор'},items:[{entityId:'s0',name:'Картина A',image:'engi-media://'+('a'.repeat(64)),mediaId:'m0',targetId:'legacy',answer:'Автор A',aliases:[],answerId:'a0',answerEntityId:'a0',factId:'f0',sourceUrl:''}],options:[{id:'a0',name:'Автор A'},{id:'a1',name:'Автор B'}],reason:'due',...overrides};}
async function dbRun(run:(db:EngiDB,svc:ReturnType<typeof createStudyCoreService>)=>Promise<void>){const db=new EngiDB('study-core-int-'+crypto.randomUUID());try{await run(db,createStudyCoreService(db));}finally{db.close();await db.delete();}}
test('compiler creates a contract from rendered image choice and tracks only the association',()=>{
 const c=compileTaskContract(bundle(),task());assert.equal(c.primaryGoals.length,1);assert.equal(c.actionFamily,'select');assert.equal(c.shownClaims.length,0);assert.equal(c.response.kind,'choice');
 if(c.response.kind==='choice')assert.equal(c.response.expected,'a0');
 assert(c.primaryGoals[0].semanticKey.includes('f0'));assert.equal(c.primaryGoals[0].cueRole,'subject-to-value');
});
test('compiler rejects a cached answer after the graph changed',()=>{
 const b=bundle();b.facts[0].valueEntityId='a1';assert.throws(()=>compileTaskContract(b,task()),/disagrees/);
});
test('complete set compiler refuses a partial “all answers” task',()=>{
 const b=bundle();b.facts.push({id:'f2',entityId:'s0',key:'created_by',valueKind:'entity',valueEntityId:'a1',verification:'verified',completeSet:true,source:{kind:'manual',name:'test'}});
 const t=task({recipe:{...task().recipe,format:'multi_choice',cue:'name'},items:[{...task().items[0],mediaId:undefined,image:undefined,answerId:'a0',answerEntityId:'a0',factId:'f0'},{...task().items[0],targetId:'legacy-2',answer:'Автор B',answerId:'a1',answerEntityId:'a1',factId:'f2'}],answerSet:['a0'],options:[{id:'a0',name:'Автор A'},{id:'a1',name:'Автор B'}]});
 assert.throws(()=>compileTaskContract(b,t),/partial set/);
 t.answerSet=['a0','a1'];const c=compileTaskContract(b,t);assert.equal(c.response.kind,'set');assert.equal(c.primaryGoals[0].knowledge.kind,'complete-set');
});
test('sort compiler creates practice with no date goal and feedback only after an incorrect order',()=>{
 const b=bundle();b.entities.push({id:'s2',type:'artwork',name:'Картина C',aliases:[],externalIds:{}});b.facts.push({id:'d0',entityId:'s0',key:'creation_date',valueKind:'date',dateStart:'1800-01-01',dateEnd:'1800-12-31',datePrecision:'year',verification:'verified',source:{kind:'manual',name:'test'}},{id:'d1',entityId:'s1',key:'creation_date',valueKind:'date',dateStart:'1850-01-01',dateEnd:'1850-12-31',datePrecision:'year',verification:'verified',source:{kind:'manual',name:'test'}},{id:'f2',entityId:'s2',key:'creation_date',valueKind:'date',dateStart:'1900-01-01',dateEnd:'1900-12-31',datePrecision:'year',verification:'verified',source:{kind:'manual',name:'test'}});b.properties!.push({id:'creation_date',name:'Дата',valueKind:'date',cardinality:'one',learnable:true,subjectTypes:['artwork'],inverse:{enabled:false},learning:{forward:true}});
 const base=task();const make=(id:string,year:number,factId:string,entityId:string,name:string)=>({...base.items[0],entityId,name,factId,mediaId:undefined,image:undefined,targetId:id,answerId:String(year),answer:String(year),year});
 const t:Task={...base,id:'sort',recipe:{...base.recipe,id:'sort',format:'sort',answerKey:'creation_date',cue:'name'},items:[make('s0',1800,'d0','s0','Картина A'),make('s1',1850,'d1','s1','Картина B'),make('s2',1900,'f2','s2','Картина C')],options:[],reason:'challenge'};
 const c=compileTaskContract(b,t);assert.equal(c.primaryGoals.length,0);assert.equal(c.practice,true);assert.equal(c.response.kind,'order');assert(c.feedbackClaims.every(x=>x.when==='incorrect'));
});
test('intro contract exposes shown facts for practice and does not create memory goals',()=>{
 const b=bundle(),c=compileIntroContract(b,{entityId:'s0',unitIds:['ku:fact:f0:forward'],newProperty:true},'session');assert.equal(c.primaryGoals.length,0);assert.equal(c.practice,true);assert(c.shownClaims.some(x=>x.key==='fact:f0'));
});
test('normal answer reveal preserves labeled recall self report after the thinking stage',()=>dbRun(async(db,svc)=>{
 const b=bundle();const c=compileTaskContract(b,{...task(),id:'recall',recipe:{...task().recipe,id:'recall',format:'recall_reveal',cue:'image'},options:[]});await svc.setContentRevisions(c.contentRevisions);await svc.open(c,'recall',at);c.feedbackClaims=[{key:'answer',revision:'v1',revealsGoalIds:[c.primaryGoals[0].id]}];
 // Stored contract is deliberately immutable; use a normal contract whose feedback claim exists before open.
 const c2={...c,id:'recall-2',feedbackClaims:c.feedbackClaims};await svc.setContentRevisions(c2.contentRevisions);await svc.open(c2,'recall-2',at);await svc.observe('recall-2','answer-reveal','ep','start',at);
 const row=await db.appMeta.get('studyCore:attempt:recall-2');assert(row);assert(!row!.value.ineligibleGoalIds.includes(c2.primaryGoals[0].id));
 const answer=await svc.submit('recall-2',true,new Date(at.getTime()+6000));assert.equal(answer.results![0].credit,true);assert.equal(answer.results![0].selfReported,true);
}));
test('a reveal heartbeat preserves its original disclosure snapshot after grading changes conditional claims',()=>dbRun(async(db,svc)=>{
 const c=compileTaskContract(bundle(),{...task(),id:'conditional-recall',recipe:{...task().recipe,format:'recall_reveal'},options:[]});
 c.feedbackClaims.push({key:'conditional-detail',revision:'v1',revealsGoalIds:[c.primaryGoals[0].id],when:'incorrect'});
 c.contentRevisions['conditional-detail']='v1';await svc.setContentRevisions(c.contentRevisions);await svc.open(c,c.id,at);
 const first=await svc.observe(c.id,'answer-reveal','conditional-episode','start',at);
 await svc.submit(c.id,false,new Date(at.getTime()+5000));
 const refreshed=await svc.observe(c.id,'answer-reveal','conditional-episode','refresh',new Date(at.getTime()+6000));assert.deepEqual(refreshed.claims,first.claims);
 await svc.observe(c.id,'answer-reveal','conditional-episode','end',new Date(at.getTime()+7000));
 await assert.rejects(svc.observe(c.id,'early-answer','conditional-episode','end',new Date(at.getTime()+8000)),/immutable/);
}));
test('one continuous visible question episode does not keep extending a second disclosure epoch',()=>dbRun(async(db,svc)=>{
 const identityTask=task({id:'q',recipe:{...task().recipe,answerKey:'identity',cue:'name'},items:[{...task().items[0],factId:undefined,answer:'Картина A',answerId:'s0',answerEntityId:'s0',targetId:'identity'}],options:[{id:'s0',name:'Картина A'},{id:'s1',name:'Картина B'}]});const c=compileTaskContract(bundle(),identityTask);await svc.setContentRevisions(c.contentRevisions);await svc.open(c,'q',at);await svc.observe('q','question','episode','start',at);await svc.observe('q','question','episode','refresh',new Date(at.getTime()+1000));await svc.observe('q','question','episode','end',new Date(at.getTime()+2000));await svc.observe('q','question','episode','refresh',new Date(at.getTime()+5000));
 const exposure=await db.appMeta.get(`studyCore:exposure:${c.primaryGoals[0].id}`);assert.equal(exposure!.value.lastVisibleAt,new Date(at.getTime()+2000).toISOString());
 const next={...c,id:'q2'};await svc.open(next,'q2',new Date(at.getTime()+30000));const row=await db.appMeta.get('studyCore:attempt:q2');assert(row!.value.ineligibleGoalIds.includes(c.primaryGoals[0].id));
}));
test('bridge preparation does not answer; first submission remains immutable through correction',async()=>{
 const db=new EngiDB('study-core-bridge-'+crypto.randomUUID());try{
  const b=bundle(),t=task({id:'bridge-task'});await putBundle(db,b);await prepareStudyTask(db,b,t);assert(t.studyContract);assert.equal((await db.appMeta.get('studyCore:attempt:bridge-task'))!.value.phase,'open');
  // The first choice completes the independent attempt; correction cannot replace it.
  const checked=await auditStudyAnswer(db,t,'a1');assert.equal(checked!.phase,'submitted');assert.equal(checked!.results![0].correct,false);
  const second=await auditStudyAnswer(db,t,'a0');assert.equal(second!.phase,'submitted');assert.deepEqual(second,checked);
 }finally{db.close();await db.delete();}
});
