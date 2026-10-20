import {properties} from '../lib/engi/knowledge/properties';
import type {Bundle,Task} from '../lib/engi/types';
import type {GoalProposal} from './goal-proposals';
import {shuffle} from '../lib/engi/engine';
import {questionPrompt} from '../lib/engi/questions/question-templates';
function boundary(years:number[],history:Task[]){const min=Math.min(...years),max=Math.max(...years),recent=new Set(history.slice(-3).map(t=>t.contextual?.threshold));
 for(const step of [100,50,10,1]){const choices:number[]=[];for(let y=Math.floor(min/step)*step+step;y<=max;y+=step)choices.push(y);if(choices.length){choices.sort((a,b)=>Number(recent.has(a))-Number(recent.has(b))||Math.abs(a-(min+max)/2)-Math.abs(b-(min+max)/2));return choices[0];}}
 return max;
}
/** Caller supplies only ready target properties and non-protected known supports. */
export function buildLearningChronology(b:Bundle,ready:GoalProposal[],supports:GoalProposal[],history:Task[],seed:number):Task|undefined{
 const dates=ready.filter(p=>p.goals.length===1&&p.goals[0].skill==='recognition'&&p.recipe.direction!=='reverse'&&p.items.length===1&&b.facts.some(f=>f.id===p.items[0].factId&&(f.valueKind==='date'&&f.datePrecision==='year'||f.valueKind==='number'&&Number.isFinite(f.valueNumber))));
 const enabled=(p:GoalProposal,format:'sort'|'categorize')=>{const d=properties(b).find(d=>d.id===p.recipe.answerKey);return d?.learning?.[format]!=='off'&&(format!=='categorize'||d?.valueKind==='date');};
 for(const anchor of [...new Map(dates.filter(p=>enabled(p,'sort')||enabled(p,'categorize')).map(p=>[p.recipe.answerKey,p])).values()]){
 const property=properties(b).find(p=>p.id===anchor.recipe.answerKey),label=property?.name??anchor.recipe.label??anchor.recipe.answerKey,unit=b.facts.find(f=>f.id===anchor.items[0].factId)?.unit??'';
 const byEntity=new Map<string,GoalProposal>();for(const p of dates.filter(p=>p.recipe.answerKey===anchor.recipe.answerKey&&(b.facts.find(f=>f.id===p.items[0].factId)?.unit??'')===unit)){if(!byEntity.has(p.items[0].entityId))byEntity.set(p.items[0].entityId,p);}
 const pool=[...byEntity.values()],years=new Set(pool.map(p=>p.items[0].year));if(pool.length<2||years.size<2)continue;
 const order:GoalProposal[]=[];for(const p of pool){if(!order.some(o=>o.items[0].year===p.items[0].year))order.push(p);if(order.length===5)break;}
 const support=order.length===2?supports.find(p=>p.recipe.answerKey===anchor.recipe.answerKey&&p.items.length===1&&Number.isFinite(p.items[0].year)&&!order.some(o=>o.items[0].entityId===p.items[0].entityId||o.items[0].year===p.items[0].year)&&b.facts.some(f=>f.id===p.items[0].factId&&(f.unit??'')===unit&&(f.valueKind==='date'&&f.datePrecision==='year'||f.valueKind==='number'&&Number.isFinite(f.valueNumber)))):undefined;
 const previous=history.at(-1),orderAvailable=order.length>=3||!!support;
 const useOrder=enabled(anchor,'sort')&&orderAvailable&&(!enabled(anchor,'categorize')||(previous?.contextual?.kind!=='order'&&previous?.recipe.format!=='sort')&&(previous?.contextual?.kind==='boundary'||previous?.recipe.format==='categorize'||!support));
 if(useOrder){const chosen=[...order,...(support?[support]:[])],items=shuffle(chosen.map(p=>({...p.items[0]})));return {id:crypto.randomUUID(),learningLifecycle:1,memoryModel:'goals',intent:'learn',reason:'context',contextual:{kind:'order',supportTargetIds:support?[support.items[0].targetId]:[]},recipe:{...anchor.recipe,orderingKind:property?.valueKind==='number'?'number':'date',id:anchor.recipe.id+':order',format:'sort',cue:items.every(i=>!!i.image)?'image':'name',diagnostic:false,label,prompt:questionPrompt(property,'', 'sort'),evidence:{level:'partial',fsrsEnabled:false,gradeCap:'good'}},items,options:items.map(i=>({id:i.entityId,name:i.name}))};}
 if(pool.length<3||!enabled(anchor,'categorize')||property?.valueKind!=='date')continue;
 const second=pool.find(p=>p.items[0].year!==anchor.items[0].year)!,selected=[anchor,second,...pool.filter(p=>p!==anchor&&p!==second)].slice(0,6),threshold=boundary(selected.map(p=>p.items[0].year!),history),items=shuffle(selected.map(p=>({...p.items[0],answerId:p.items[0].year!<threshold?'before':'after',answer:p.items[0].year!<threshold?'До '+threshold:threshold+' и позже',aliases:[]})));
 return {id:crypto.randomUUID(),learningLifecycle:1,memoryModel:'goals',intent:'learn',reason:'context',presentation:'conveyor',contextual:{kind:'boundary',threshold,supportTargetIds:[]},recipe:{...anchor.recipe,id:anchor.recipe.id+':boundary',format:'categorize',cue:'name',diagnostic:false,label,evidence:{level:'partial',fsrsEnabled:false,gradeCap:'good'}},items,options:[{id:'before',name:'До '+threshold},{id:'after',name:threshold+' и позже'}]};
}
}
