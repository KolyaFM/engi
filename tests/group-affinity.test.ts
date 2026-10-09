import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {Bundle,Task} from '../src/lib/engi/types';
import {associationGoal} from '../src/lib/engi/study-core/compiler';
import {groupProposals} from '../src/services/group-candidates';
import {groupContext} from '../src/services/group-affinity';
import {buildLearningChronology} from '../src/services/learning-chronology';
import {buildSelfCheck} from '../src/services/self-check-composition';
function fixture(){
 const b:Bundle={entities:Array.from({length:8},(_,n)=>({id:'e'+n,type:n<4?'person':'state',name:'Object '+n,aliases:[],externalIds:{},originPackId:n<2?'pack-a':'pack-b'})),facts:Array.from({length:8},(_,n)=>({id:'f'+n,entityId:'e'+n,key:'year',valueKind:'date',dateStart:(1800+n)+'-01-01',dateEnd:(1800+n)+'-12-31',datePrecision:'year',verification:'user_confirmed',source:{name:'Test'}})),media:[],tags:[],entityTags:[],properties:[{id:'year',name:'Year',valueKind:'date',cardinality:'one',learnable:true}],missing:[],unresolved:[]};
 const ready=b.facts.map((f,n)=>({recipe:{id:'test',format:'match' as const,cue:'name' as const,answerKey:'year',memoryKey:'year',diagnostic:false},items:[{entityId:f.entityId,name:'Object '+n,targetId:'t'+n,answer:String(1800+n),answerId:String(1800+n),factId:f.id,aliases:[],sourceUrl:'',year:1800+n}],goals:[associationGoal(b,f,'recognition')]}));return {b,ready};
}
test('matching partitions actual subject types, including spare answers, without filling undersized buckets',()=>{
 const {b,ready}=fixture();assert.equal(groupProposals(b,[...ready.slice(0,2),ready[4]],new Set(),6).length,0);
 const groups=groupProposals(b,ready,new Set(),6,{spareAnswer:true});assert(groups.length);for(const g of groups){const types=g.items.map(i=>b.entities.find(e=>e.id===i.entityId)!.type);assert(types.every(t=>t===types[0]));for(const o of g.options!){const f=b.facts.find(f=>String(Number(f.dateStart!.slice(0,4)))===o.id)!;assert.equal(b.entities.find(e=>e.id===f.entityId)!.type,types[0]);}}
});
test('image roles and displayed reverse subjects remain hard compatibility constraints',()=>{
 const {b,ready}=fixture();b.media=b.entities.map((e,n)=>({id:'m'+n,entityId:e.id,role:n<2?'portrait':'map',url:'image'+n,license:'Test',sourceUrl:''}));const images=ready.slice(0,4).map((p,n)=>({...p,recipe:{...p.recipe,cue:'image' as const},items:p.items.map(i=>({...i,image:'image'+n,mediaId:'m'+n}))}));assert.equal(groupProposals(b,images,new Set(),6).length,0);
 const context=groupContext(b),r={...ready[0].recipe,direction:'reverse' as const};assert.notEqual(context.signature({...ready[0].items[0],entityId:'e4'},r),context.signature(ready[0].items[0],r));
});
test('specific shared tags outweigh a shared pack; pack origin is a preference rather than a barrier',()=>{
 const {b,ready}=fixture();b.tags=[{id:'art',name:'Art'},{id:'school',name:'School',parentId:'art'}];b.entityTags=[{entityId:'e0',tagId:'school'},{entityId:'e2',tagId:'school'}];const c=groupContext(b),items=ready.map(p=>p.items[0]);assert(c.similarity(items[0],items[2],items)>c.similarity(items[0],items[1],items));const groups=groupProposals(b,ready.slice(0,4),new Set(),3);assert(groups.some(g=>g.items.some(i=>i.entityId==='e0')&&g.items.some(i=>i.entityId==='e2')));
});
test('pack membership retains every installed source, without treating a user deck as a pack',()=>{
 const {b,ready}=fixture();b.entities.forEach(e=>delete e.originPackId);b.decks=[{id:'deck',name:'User deck',learning:{imageRecognition:true}}];b.deckMembers=b.entities.map(e=>({deckId:'deck',entityId:e.id}));const items=ready.map(p=>p.items[0]),c=groupContext(b,[],[{packId:'first',entityIds:['e0','e1']},{packId:'second',entityIds:['e0','e2']}]);assert(c.similarity(items[0],items[1],items)>0);assert(c.similarity(items[0],items[2],items)>0);assert.equal(c.similarity(items[0],items[3],items),0);
});
test('parent tags cannot multiply affinity and answer-bearing tags cannot select participants',()=>{
 const {b,ready}=fixture();b.entities.forEach(e=>delete e.originPackId);b.tags=[{id:'art',name:'Art'},{id:'school',name:'School',parentId:'art'},{id:'answer',name:'Works of 1800'}];b.entityTags=[{entityId:'e0',tagId:'school'},{entityId:'e1',tagId:'school'}];const items=ready.map(p=>p.items[0]),before=groupContext(b).similarity(items[0],items[1],items);b.entityTags.push({entityId:'e0',tagId:'art'},{entityId:'e1',tagId:'art'});assert.equal(groupContext(b).similarity(items[0],items[1],items),before);b.entityTags=[{entityId:'e0',tagId:'answer'},{entityId:'e1',tagId:'answer'}];assert.equal(groupContext(b).similarity(items[0],items[1],items),0);
});
test('recent co-occurrence penalizes the pair; matching never imports unsupplied future members',()=>{
 const {b,ready}=fixture(),items=ready.map(p=>p.items[0]),history:Task[]=[{id:'recent',recipe:ready[0].recipe,items:items.slice(0,2),options:[],reason:'due'}];assert(groupContext(b,history).similarity(items[0],items[1],items)<groupContext(b).similarity(items[0],items[1],items));for(const g of groupProposals(b,ready.slice(0,3),new Set(),3))assert(g.items.every(i=>['e0','e1','e2'].includes(i.entityId)));
});
test('self-check shares compatibility rules but chronology can mix people and states',()=>{
 const {b,ready}=fixture(),choices=ready.map(p=>({...p,recipe:{...p.recipe,format:'choice' as const}}));assert.equal(buildSelfCheck(b,[...choices.slice(0,2),choices[4]]),undefined);const group=buildSelfCheck(b,choices)!;assert(group.items.every(i=>b.entities.find(e=>e.id===i.entityId)!.type==='person'));const chronology=buildLearningChronology(b,[choices[0],choices[4],choices[5]],[],[],0)!;assert.equal(chronology.recipe.format,'sort');assert.equal(new Set(chronology.items.map(i=>b.entities.find(e=>e.id===i.entityId)!.type)).size,2);
});

