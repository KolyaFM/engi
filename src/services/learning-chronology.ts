import {formatHistoricalYear} from '../lib/engi/historical-date';
import {periodStart} from '../lib/engi/questions/period-start';
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
 const definitions=new Map(properties(b).map(p=>[p.id,p])),facts=new Map(b.facts.map(f=>[f.id,f]));
 const exact=(p:GoalProposal)=>{const f=facts.get(p.items[0]?.factId??'');return p.goals.length===1&&p.goals[0].skill==='recognition'&&p.recipe.direction!=='reverse'&&p.items.length===1&&!!f&&(f.valueKind==='number'&&Number.isFinite(f.valueNumber)||f.valueKind==='date'&&(p.items[0].dateEdge==='start'?!!periodStart(b,f):f.datePrecision==='year'));};
 const dates=ready.filter(exact);
 const enabled=(p:GoalProposal,format:'sort'|'categorize')=>{const d=definitions.get(p.recipe.answerKey);return p.items[0].dateEdge==='start'?format==='sort'&&d?.learning?.periodStart?.sort!=='off':d?.learning?.[format]!=='off'&&(format!=='categorize'||d?.valueKind==='date');};
 for(const anchor of [...new Map(dates.filter(p=>enabled(p,'sort')||enabled(p,'categorize')).map(p=>[p.recipe.answerKey+':'+(p.items[0].dateEdge??''),p])).values()]){
 const property=definitions.get(anchor.recipe.answerKey),unit=facts.get(anchor.items[0].factId??'')?.unit??'';
 const compatible=(p:GoalProposal)=>exact(p)&&enabled(p,'sort')&&(property?.valueKind==='date'?facts.get(p.items[0].factId??'')?.valueKind==='date':p.recipe.answerKey===anchor.recipe.answerKey&&(facts.get(p.items[0].factId??'')?.unit??'')===unit);
 const byEntity=new Map<string,GoalProposal>();for(const p of dates.filter(compatible)){if(!byEntity.has(p.items[0].entityId))byEntity.set(p.items[0].entityId,p);}
 const label=anchor.items[0].dateEdge?property?.learning?.periodStart?.name??property?.name:property?.name??anchor.recipe.label??anchor.recipe.answerKey;
 const pool=[...byEntity.values()],boundaryPool=dates.filter(p=>p.recipe.answerKey===anchor.recipe.answerKey&&!p.items[0].dateEdge&&enabled(p,'categorize'));if(pool.length<2&&boundaryPool.length<3)continue;
 const order:GoalProposal[]=[];for(const p of pool){if(!order.some(o=>o.items[0].year===p.items[0].year))order.push(p);if(order.length===5)break;}
 const support=order.length===2?supports.find(p=>compatible(p)&&!order.some(o=>o.items[0].entityId===p.items[0].entityId||o.items[0].year===p.items[0].year)):undefined;
 const previous=history.at(-1),orderAvailable=order.length>=3||!!support;
 const useOrder=enabled(anchor,'sort')&&orderAvailable&&(!enabled(anchor,'categorize')||(previous?.contextual?.kind!=='order'&&previous?.recipe.format!=='sort')&&(previous?.contextual?.kind==='boundary'||previous?.recipe.format==='categorize'||!support));
 if(useOrder){const chosen=[...order,...(support?[support]:[])],items=shuffle(chosen.map(p=>({...p.items[0],chronologyLabel:chosen.some(p=>p.items[0].dateEdge||p.recipe.answerKey!==anchor.recipe.answerKey)?p.items[0].dateEdge?definitions.get(p.recipe.answerKey)?.learning?.periodStart?.name:definitions.get(p.recipe.answerKey)?.name:undefined})));return {id:crypto.randomUUID(),learningLifecycle:1,memoryModel:'goals',intent:'learn',reason:'context',contextual:{kind:'order',supportTargetIds:support?[support.items[0].targetId]:[]},recipe:{...anchor.recipe,orderingKind:property?.valueKind==='number'?'number':'date',id:anchor.recipe.id+':order',format:'sort',cue:items.every(i=>!!i.image)?'image':'name',diagnostic:false,label:chosen.some(p=>p.recipe.answerKey!==anchor.recipe.answerKey)?'Даты и начала периодов':label,prompt:questionPrompt(property,'', 'sort'),evidence:{level:'partial',fsrsEnabled:false,gradeCap:'good'}},items,options:items.map(i=>({id:i.entityId,name:i.name}))};}
 if(boundaryPool.length<3||new Set(boundaryPool.map(p=>p.items[0].year)).size<2||!enabled(anchor,'categorize')||property?.valueKind!=='date')continue;
 const second=boundaryPool.find(p=>p.items[0].year!==anchor.items[0].year)!,selected=[anchor,second,...boundaryPool.filter(p=>p!==anchor&&p!==second)].slice(0,6),threshold=boundary(selected.map(p=>p.items[0].year!),history),items=shuffle(selected.map(p=>({...p.items[0],answerId:p.items[0].year!<threshold?'before':'after',answer:p.items[0].year!<threshold?'До '+formatHistoricalYear(threshold):formatHistoricalYear(threshold)+' и позже',aliases:[]})));
 return {id:crypto.randomUUID(),learningLifecycle:1,memoryModel:'goals',intent:'learn',reason:'context',presentation:'conveyor',contextual:{kind:'boundary',threshold,supportTargetIds:[]},recipe:{...anchor.recipe,id:anchor.recipe.id+':boundary',format:'categorize',cue:'name',diagnostic:false,label,evidence:{level:'partial',fsrsEnabled:false,gradeCap:'good'}},items,options:[{id:'before',name:'До '+formatHistoricalYear(threshold)},{id:'after',name:formatHistoricalYear(threshold)+' и позже'}]};
}
}
