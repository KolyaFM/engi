import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {triagedMemory} from '../src/lib/engi/learning/bootstrap';
import {pickFeed,dailyNewState} from '../src/lib/engi/session/candidate-pool';
import type {Bundle} from '../src/lib/engi/types';
import type {SessionRow} from '../src/db/engi-db';

test('a newly enabled reverse unit belongs to its introduced source object and uses compact property Intro',()=>{
 const b:Bundle={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[],properties:[{id:'relation',name:'Автор',valueKind:'entity',cardinality:'one',learnable:true,subjectTypes:['subject'],targetTypes:['answer'],inverse:{enabled:true,name:'Произведение'},learning:{reverse:true},promptTemplates:{reverse:'Что создал {subject}?'}}]};
 for(let n=0;n<3;n++){
  b.entities.push({id:'s'+n,type:'subject',name:'Произведение '+n,aliases:[],externalIds:{}},{id:'a'+n,type:'answer',name:'Автор '+n,aliases:[],externalIds:{}});
  b.facts.push({id:'f'+n,entityId:'s'+n,key:'relation',valueKind:'entity',valueEntityId:'a'+n,verification:'user_confirmed',source:{kind:'manual',name:'Личное знание'}});
 }
 const units=canonicalTargets(b),memories=units.filter(i=>!i.targetId.endsWith(':reverse')).map(i=>triagedMemory(i,'red','old-session',0));
 const now=new Date().toISOString();
 const s:SessionRow={id:'new-session',tag:'all',format:'mixed',mode:'daily',tasks:[],currentPosition:0,results:[],createdAt:now,updatedAt:now,status:'active',timeLeft:90,completedCount:0,cooldown:[]};
 const next=pickFeed(b,memories,s,dailyNewState(undefined),['s0','s1','s2']);
 assert(next.intro);
 assert.equal(next.intro.entityId,'s0');
 assert.equal(next.intro.newProperty,true);
 assert.deepEqual(next.intro.unitIds,['ku:fact:f0:reverse']);
 const reverse=units.find(i=>i.targetId===next.intro!.unitIds[0])!;
 assert.equal(reverse.answer,'Произведение 0');
 assert.equal(reverse.name,'Автор 0');
});
