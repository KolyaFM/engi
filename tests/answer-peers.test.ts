import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {Bundle,Item} from '../src/lib/engi/types';
import {distractors} from '../src/lib/engi/questions/distractors';
import {canonicalTargets,eligible,recipes} from '../src/lib/engi/questions/recipe-factory';
import {composeUnit} from '../src/lib/engi/session/composer';
import {triagedMemory} from '../src/lib/engi/learning/bootstrap';
import {goalCandidates} from '../src/services/goal-candidates';

function fixture(presidents=4){
 const b:Bundle={entities:Array.from({length:presidents+4},(_,n)=>({id:'e'+n,type:'person',name:'Person '+n,aliases:[],externalIds:{},originPackId:n<presidents?'presidents':'artists'})),facts:[],media:Array.from({length:presidents+4},(_,n)=>({id:'m'+n,entityId:'e'+n,role:'portrait',primary:true,url:'image-'+n,license:'test'})),tags:[{id:'people',name:'People'},{id:'president',name:'Presidents',parentId:'people'},{id:'artist',name:'Artists',parentId:'people'}],entityTags:Array.from({length:presidents+4},(_,n)=>({entityId:'e'+n,tagId:n<presidents?'president':'artist'})),decks:[{id:'presidents',name:'Presidents',learning:{imageRecognition:true}},{id:'artists',name:'Artists',learning:{imageRecognition:true}}],deckMembers:Array.from({length:presidents+4},(_,n)=>({entityId:'e'+n,deckId:n<presidents?'presidents':'artists'})),missing:[],unresolved:[]};
 const r=recipes(b).find(r=>r.answerKey==='identity'&&r.cue==='image'&&r.format==='choice'&&!r.tag)!,pool=eligible(b,r);
 return {b,r,pool,target:pool[0]};
}

test('new and established portrait quizzes choose presidents despite artist confusion and exposure history',()=>{
 const {b,pool,target}=fixture();
 for(const status of ['triaged','review'] as const){const memory={...triagedMemory(target,'red','s',0),status,confusions:{e4:1000}};
  for(let n=0;n<30;n++){const options=distractors(b,target,pool,memory,[]);assert.equal(options.length,3);assert(options.every(o=>['e1','e2','e3'].includes(o.id)));}
 }
});

test('same tags admit presidents from other packs/decks; a mixed pack cannot admit artists',()=>{
 const {b,pool,target}=fixture();b.entities[3].originPackId='other-presidents';b.deckMembers![3].deckId='artists';
 b.entities[4].originPackId='presidents';b.deckMembers![4].deckId='presidents';
 const options=distractors(b,target,pool,undefined,[]);assert(options.some(o=>o.id==='e3'));assert(!options.some(o=>o.id==='e4'));
});

test('deck membership still groups portraits when there are no tags or origin pack IDs',()=>{
 const {b:source,pool,target}=fixture(),b=structuredClone(source);b.tags=[];b.entityTags=[];b.entities.forEach(e=>delete e.originPackId);
 assert.deepEqual(new Set(distractors(b,target,pool,undefined,[]).map(o=>o.id)),new Set(['e1','e2','e3']));
});

test('too few presidents produce recall instead of an obvious choice, with unseen peers allowed as distractors only',()=>{
 const {b,target}=fixture(2),memory=triagedMemory(target,'red','s',0),before=structuredClone(memory);
 assert.equal(composeUnit(b,memory,'presidents','choice'),undefined);
 assert.equal(composeUnit(b,memory,'presidents','mixed')?.recipe.format,'recall_reveal');
 const tasks=goalCandidates(b,[memory],'presidents');assert(tasks.length);assert(tasks.every(t=>t.recipe.format!=='choice'));
 assert.deepEqual(memory,before);
 const many=fixture(),intro=triagedMemory(many.target,'red','s',0),choices=goalCandidates(many.b,[intro],'presidents','choice');
 assert(choices.length);assert(choices.every(t=>t.items.every(i=>i.entityId==='e0')));assert(choices.every(t=>t.options.every(o=>Number(o.id.slice(1))<4)));
});

test('name-to-portrait and reverse property questions use the answer group, not all people',()=>{
 const {b,target}=fixture();
 const memory=triagedMemory(target,'red','s',0);let imageTask=false;
 for(let n=0;n<40;n++){const t=composeUnit(b,memory,'presidents','choice')!;assert(t.options.every(o=>Number(o.id.slice(1))<4));if(t.recipe.answerPresentation==='image'){imageTask=true;assert(t.options.every(o=>o.image));}}
 assert(imageTask);
 const reverse=(i:Item)=>({...i,valueCue:{text:'1945',key:'test'},factId:undefined});
 const r=fixture(),options=distractors(r.b,reverse(r.target),r.pool.map(reverse),undefined,[]);assert(options.every(o=>['e1','e2','e3'].includes(o.id)));
});

test('scalar property comparisons use subject cohorts, without changing canonical learning units',()=>{
 const {b:source}=fixture(),b=structuredClone(source);b.properties=[{id:'year',name:'Year',valueKind:'date',cardinality:'one',learnable:true}];
 b.facts=b.entities.map((e,n)=>({id:'f'+n,entityId:e.id,key:'year',valueKind:'date',dateStart:(1800+n)+'-01-01',dateEnd:(1800+n)+'-12-31',datePrecision:'year',verification:'verified',source:{name:'test'}}));
 const r=recipes(b).find(r=>r.answerKey==='year'&&r.direction==='forward'&&r.format==='choice'&&!r.tag)!,pool=eligible(b,r),target=pool[0];
 assert(distractors(b,target,pool,undefined,[]).every(o=>['1801','1802','1803'].includes(o.id)));
 assert.equal(new Set(canonicalTargets(b).filter(i=>i.factId).map(i=>i.factId)).size,8);
});
