import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EngiDB} from '../src/db/engi-db';
import {putBundle,getBundle} from '../src/db/repositories';
import {prepareDue} from './helpers22';
import {createTrainerService} from '../src/services/trainer-service';
import {goalCandidates} from '../src/services/goal-candidates';
import {goalProposalPool,materializeGoalProposal} from '../src/services/goal-proposals';
import {groupProposals} from '../src/services/group-candidates';
import {compileTaskContract} from '../src/lib/engi/study-core/compiler';
import {pickGoalFeed} from '../src/services/goal-feed';
import {dailyNewState} from '../src/lib/engi/session/candidate-pool';
import type {Bundle,Memory} from '../src/lib/engi/types';
import {compositionContext} from '../src/lib/engi/session/composer';
function fixture(many=false):Bundle{
 const b:Bundle={entities:[],facts:[],media:[],tags:[{id:'subset',name:'Часть'}],entityTags:[],missing:[],unresolved:[],properties:[{id:'rel',name:'Автор',learnable:true,valueKind:'entity',cardinality:many?'many':'one',subjectTypes:['subject'],targetTypes:['answer']}],entityTypes:[{id:'subject',name:'Объект'},{id:'answer',name:'Ответ'}]};
 for(let n=0;n<4;n++)b.entities.push({id:'a'+n,type:'answer',name:'Ответ '+n,aliases:[],externalIds:{}});
 for(let n=0;n<8;n++){b.entities.push({id:'s'+n,type:'subject',name:'Объект '+n,aliases:[],externalIds:{}});b.facts.push({id:'f'+n,entityId:'s'+n,key:'rel',valueKind:'entity',valueEntityId:'a'+n%4,completeSet:true,verification:'user_confirmed',source:{kind:'manual',name:'Тест'}});b.media.push({id:'m'+n,entityId:'s'+n,role:'image',url:'engi-media://fixture/'+n,learningExemplar:true,sourceUrl:'',license:'test'});if(n<5)b.entityTags.push({entityId:'s'+n,tagId:'subset'});}
 if(many)b.facts.push({...b.facts[0],id:'extra',valueEntityId:'a1'});return b;
}
async function run(fn:(d:EngiDB,b:Bundle,enabled:Memory[])=>Promise<void>,many=false){const d=new EngiDB('proposals-'+crypto.randomUUID());try{await putBundle(d,fixture(many));await prepareDue(d);await fn(d,await getBundle(d),(await d.learningState.toArray()).map(r=>r.payload));}finally{d.close();await d.delete();}}
test('cached question structure is detached, immutable and invalidates on edits without progress dependencies',()=>{
 const b=fixture(),first=compositionContext(b);assert.equal(compositionContext(structuredClone(b)),first);
 const recipe=first.recipes.find(r=>r.answerKey==='rel'&&r.tag===undefined)!,item=first.pools.get(recipe)![0],oldAliases=[...item.aliases];
 b.entities.find(e=>e.id===item.answerId)!.aliases.push('Changed alias');assert.deepEqual(item.aliases,oldAliases);
 assert.notEqual(compositionContext(b),first);b.entities.find(e=>e.id===item.answerId)!.aliases.pop();assert.equal(compositionContext(b),first);
 assert.throws(()=>item.aliases.push('Poisoned'));assert.throws(()=>{item.answer='Poisoned';});assert(!Object.isFrozen(b.entities[0]));
});
test('proposal pool and validated eager generator have the same goal/format coverage in scopes and complete sets',async()=>{
 for(const many of [false,true])await run(async(_d,b,enabled)=>{
  for(const tag of ['all','subset'])for(const format of ['mixed','choice','recall_reveal','match','categorize','multi_choice']){
   const eager=goalCandidates(b,enabled,tag,format),pool=goalProposalPool(b,enabled,tag,format);
   const key=(ids:string[],fmt:string)=>JSON.stringify([ids.sort(),fmt]);
   assert.deepEqual(pool.proposals.map(p=>key(p.goals.map(g=>g.id),p.recipe.format)).sort(),eager.map(t=>key(t.studyContract!.primaryGoals.map(g=>g.id),t.recipe.format)).sort());
   for(const proposal of pool.proposals){assert(!('studyContract' in proposal));assert(!('id' in proposal));assert.equal(proposal.options,undefined);
    const task=materializeGoalProposal(b,enabled,proposal,pool.context,tag,[]);assert(task);assert.deepEqual(compileTaskContract(b,task!).primaryGoals.map(g=>g.id).sort(),proposal.goals.map(g=>g.id).sort());}
  }
 },many);
});
test('cache ignores presentation history but revalidates content, scope and suspension without freezing the graph',()=>run(async(_d,b,enabled)=>{
 const pool=goalProposalPool(b,enabled);assert.equal(goalProposalPool(structuredClone(b),structuredClone(enabled)),pool);
 b.entities[0].aliases.push('Ещё имя');assert.notEqual(goalProposalPool(b,enabled),pool);
 const before=goalProposalPool(b,enabled);enabled[0].status='suspended';assert.notEqual(goalProposalPool(b,enabled),before);
 const all=goalProposalPool(b,enabled);assert.notEqual(goalProposalPool(b,enabled,'subset'),all);
 b.facts[0].valueEntityId='a2';const after=goalProposalPool(b,enabled);assert.notEqual(after,all);
 assert(Object.isFrozen(after.proposals));assert(Object.isFrozen(after.proposals[0].items));
}));
test('materialization makes fresh task IDs, honors the proposed interaction and validates members again',()=>run(async(_d,b,enabled)=>{
 const pool=goalProposalPool(b,enabled),proposal=pool.proposals.find(p=>p.recipe.format==='choice'&&p.items[0].factId)!;
 const first=materializeGoalProposal(b,enabled,proposal,pool.context,'all',[])!,second=materializeGoalProposal(b,enabled,proposal,pool.context,'all',[first])!;
 assert.notEqual(first.id,second.id);assert.equal(first.recipe.format,proposal.recipe.format);assert.equal(first.recipe.answerKey,proposal.recipe.answerKey);assert.equal(first.recipe.direction,proposal.recipe.direction);
 assert.equal(first.studyContract,undefined);
 const disabled=enabled.map(m=>m.id===proposal.items[0].targetId?{...m,status:'suspended' as const}:m);assert.equal(materializeGoalProposal(b,disabled,proposal,pool.context,'all',[]),undefined);
 b.facts.find(f=>f.id===proposal.items[0].factId)!.valueEntityId='a-other';assert.equal(materializeGoalProposal(b,enabled,proposal,pool.context,'all',[]),undefined);
}));
test('group proposals contain every graded member without compiling or persisting attempts before selection',()=>run(async(d,b,enabled)=>{
 const pool=goalProposalPool(b,enabled),groups=groupProposals(b,pool.proposals,new Set(),3);assert(groups.length);
 for(const p of groups){assert(p.group);assert(!('studyContract' in p));const task=materializeGoalProposal(b,enabled,p,pool.context,'all',[]);assert(task);assert.equal(compileTaskContract(b,task!).primaryGoals.length,p.items.length);}
 assert.equal(await d.appMeta.where('key').startsWith('studyCore:attempt:').count(),0);
}));
test('single-goal materialization keeps image/name variety instead of fixing the cached cue',()=>run(async(_d,b,enabled)=>{
 const pool=goalProposalPool(b,enabled),p=pool.proposals.find(p=>p.recipe.format==='choice'&&p.items[0].factId)!,cues=new Set<string>(),random=Math.random;let seed=17;
 try{Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let n=0;n<32;n++)cues.add(materializeGoalProposal(b,enabled,p,pool.context,'all',[])!.recipe.cue);
 }finally{Math.random=random;}
 assert.deepEqual([...cues].sort(),['image','name']);
}));
test('complete-set distractors reject normalized aliases and duplicate labels before random selection',()=>run(async(_d,b,enabled)=>{
 b.entities.find(e=>e.id==='a0')!.aliases.push('Коллизия');
 b.entities.push({id:'bad',type:'answer',name:'КОЛЛИЗИЯ!',aliases:[],externalIds:{}},{id:'duplicate',type:'answer',name:'ответ 2',aliases:[],externalIds:{}});
 for(let n=0;n<20;n++){
  const t=goalCandidates(b,enabled,'all','multi_choice').find(t=>t.items[0].entityId==='s0')!;assert(t);assert(!t.options.some(o=>o.id==='bad'));assert.equal(new Set(t.options.map(o=>o.name.toLowerCase())).size,t.options.length);
 }
},true));
test('failed materialization retries without advancing selector history or day progress twice',()=>run(async(d,b,enabled)=>{
 const svc=createTrainerService(d),s=await svc.startGoalFeed(),key='studyCore:goalSelector',prior=(await d.appMeta.get(key))!.value;let tries=0;
 const picked=await d.transaction('rw',d.appMeta,d.installedPacks,()=>pickGoalFeed(d,b,enabled,s,dailyNewState(undefined),[],Date.now(),(...args)=>++tries===1?undefined:materializeGoalProposal(...args)));
 assert(picked.task);assert.equal(tries,2);assert.equal((await d.appMeta.get(key))!.value.decisions,prior.decisions+1);assert.equal((await svc.getDayPlan()).processedAttemptIds.length,0);assert.equal(await d.appMeta.where('key').startsWith('studyCore:memory:').count(),0);
 const before=(await d.appMeta.get(key))!.value;
 const empty=await d.transaction('rw',d.appMeta,d.installedPacks,()=>pickGoalFeed(d,b,enabled,s,dailyNewState(undefined),[],Date.now(),()=>undefined));assert(!empty.task);assert.deepEqual((await d.appMeta.get(key))!.value,before);
}));
