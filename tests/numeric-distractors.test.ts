import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {Bundle,Recipe} from '../src/lib/engi/types';
import {nearbyNumericDistractors} from '../src/lib/engi/questions/numeric-distractors';
import {eligible,recipes} from '../src/lib/engi/questions/recipe-factory';
import {composeUnit,compositionContext} from '../src/lib/engi/session/composer';
import {triagedMemory} from '../src/lib/engi/learning/bootstrap';
import {assess,preflight} from '../src/lib/engi/engine';
import {compileTaskContract} from '../src/lib/engi/study-core/compiler';

function fixture(kind:'date'|'number'='date',values=[1801,1820,1850,1900],unit?:string){
 const b:Bundle={entities:values.map((_,n)=>({id:'e'+n,type:'person',name:'Президент '+n,aliases:[],externalIds:{}})),facts:values.map((value,n)=>({id:'f'+n,entityId:'e'+n,key:'value',valueKind:kind,...(kind==='date'?{dateStart:String(value).padStart(4,'0')+'-01-01',dateEnd:String(value).padStart(4,'0')+'-12-31',datePrecision:'year' as const}:{valueNumber:value,unit}),verification:'verified',source:{kind:'manual',name:'Тест'}})),properties:[{id:'value',name:'Число',valueKind:kind,cardinality:'one',learnable:true,inverse:{enabled:true},promptTemplates:{forward:'Назовите число',reverse:'Кто соответствует этому числу?'}}],media:[],tags:[],entityTags:[],missing:[],unresolved:[]};
 const recipe=recipes(b).find(r=>r.answerKey==='value'&&r.format==='choice'&&r.direction==='forward')!;
 return {b,recipe,item:eligible(b,recipe)[0]};
}
function seeded(seed=12345){return ()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32)}

test('nearby years and integers have three unique neighbours within 1–3 and every numerical rank',()=>{
 for(const kind of ['date','number'] as const){
  const {b,recipe,item}=fixture(kind),random=seeded(),ranks=[0,0,0,0];
  for(let n=0;n<1200;n++){
   const wrong=nearbyNumericDistractors(b,item,recipe,random)!;
   assert.equal(wrong.length,3);assert.equal(new Set([item.answerId,...wrong.map(o=>o.id)]).size,4);
   const numbers=wrong.map(o=>Number(o.name));assert(numbers.every(v=>Math.abs(v-1801)>=1&&Math.abs(v-1801)<=3));
   ranks[numbers.filter(v=>v<1801).length]++;
  }
  assert(ranks.every(n=>n>220&&n<380),JSON.stringify(ranks));
 }
});

test('boundaries exclude zero/negative ordinals and invalid years; units stay visible',()=>{
 for(const [kind,values,unit] of [['number',[1,10,20,30],'место'],['number',[0,10,20,30],undefined],['date',[1,10,20,30],undefined],['date',[9999,10,20,30],undefined]] as const){
  const data=fixture(kind,[...values],unit);
  for(let n=0;n<50;n++){
   const wrong=nearbyNumericDistractors(data.b,data.item,data.recipe,seeded(n))!;assert.equal(wrong.length,3);
   for(const o of wrong){const value=Number(o.name.split(' ')[0]);assert(value>=(kind==='date'||values[0]>0?1:0));assert(value<=Number.MAX_SAFE_INTEGER);if(kind==='date')assert(value<=9999);if(unit)assert(o.name.endsWith(' '+unit));}
  }
 }
});

test('non-scalar dates, decimals, reverse questions and image answers never get numeric substitutes',()=>{
 const {b,recipe,item}=fixture();
 for(const datePrecision of ['day','month','range','circa'] as const){const copy=structuredClone(b);copy.facts[0].datePrecision=datePrecision;assert.equal(nearbyNumericDistractors(copy,item,recipe),undefined);}
 const range=structuredClone(b);range.facts[0].dateEnd='1802-12-31';assert.equal(nearbyNumericDistractors(range,item,recipe),undefined);
 for(const delta of [{direction:'reverse'},{format:'recall_reveal'},{format:'sort'},{answerPresentation:'image'}] as Partial<Recipe>[])assert.equal(nearbyNumericDistractors(b,item,{...recipe,...delta}),undefined);
 const decimal=fixture('number',[1.5,2.5,3.5,4.5]);assert.equal(nearbyNumericDistractors(decimal.b,decimal.item,decimal.recipe),undefined);
});

test('composer mixes real values and precision quizzes, shuffles answers and preserves grading/knowledge goals',()=>{
 for(const kind of ['date','number'] as const){
  const {b,recipe,item}=fixture(kind),memory=triagedMemory(item,'red','s',0),context=compositionContext(b),original=Math.random;
  const ranks=new Set<number>(),positions=new Set<number>();let precision=0,comparison=0,goalId:string|undefined;
  Math.random=seeded();
  try{for(let n=0;n<400;n++){
   const task=composeUnit(b,memory,'all','choice',[],n%2?context:undefined)!;assert(task);assert(preflight(task));
   assert.equal(task.items[0].targetId,item.targetId);assert.equal(task.options.length,4);
   const wrong=task.options.filter(o=>o.id!==item.answerId),numbers=wrong.map(o=>Number(o.name));
   if(numbers.every(v=>Math.abs(v-1801)<=3)){precision++;ranks.add(numbers.filter(v=>v<1801).length);positions.add(task.options.findIndex(o=>o.id===item.answerId));}
   else{comparison++;assert(wrong.every(o=>eligible(b,recipe).some(i=>i.answerId===o.id)));}
   assert.equal(assess(task,item.answerId).score,1);assert.equal(assess(task,wrong[0].id).score,0);
   const contract=compileTaskContract(b,task);goalId??=contract.primaryGoals[0].id;assert.equal(contract.primaryGoals[0].id,goalId);assert.equal(contract.response.kind,'choice');
  }}finally{Math.random=original;}
  assert(precision>140&&precision<260,JSON.stringify({precision,comparison}));assert.equal(ranks.size,4);assert.equal(positions.size,4);
 }
});
