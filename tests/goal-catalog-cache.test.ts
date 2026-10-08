import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildGoalCatalog} from '../src/services/goal-catalog';
import {feedPerformance} from '../src/services/feed-performance';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {triagedMemory} from '../src/lib/engi/learning/bootstrap';
import type {Bundle} from '../src/lib/engi/types';
test('intro decisions reuse structural catalog while suspension and content changes remain visible',()=>{
 const b:Bundle={entities:Array.from({length:5},(_,n)=>[{id:'s'+n,type:'s',name:'S'+n,aliases:[],externalIds:{}},{id:'a'+n,type:'a',name:'A'+n,aliases:[],externalIds:{}}]).flat(),facts:Array.from({length:5},(_,n)=>({id:'f'+n,entityId:'s'+n,key:'author',valueKind:'entity',valueEntityId:'a'+n,verification:'user_confirmed',source:{kind:'manual',name:'Test'}})),properties:[{id:'author',name:'Author',valueKind:'entity',cardinality:'one',learnable:true,subjectTypes:['s'],targetTypes:['a']}],entityTypes:[{id:'s',name:'S'},{id:'a',name:'A'}],media:[],tags:[],entityTags:[],missing:[],unresolved:[]};
 feedPerformance.start();try{buildGoalCatalog(b,[]);const m=triagedMemory(canonicalTargets(b)[0],'green','intro',1);m.status='suspended';const excluded=buildGoalCatalog(b,[m]);assert(excluded.filter(e=>e.targetIds.includes(m.id)).every(e=>e.suspended));assert.equal(feedPerformance.report().filter(s=>s.stage==='candidates').length,1,'a decision must not regenerate every candidate');
 m.status='triaged';assert(buildGoalCatalog(b,[m]).filter(e=>e.targetIds.includes(m.id)).every(e=>!e.suspended));b.facts[0].valueEntityId='a1';buildGoalCatalog(b,[m]);assert.equal(feedPerformance.report().filter(s=>s.stage==='candidates').length,2);
 }finally{feedPerformance.stop();}
});
