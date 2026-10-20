import type {Bundle,Task} from '../lib/engi/types';
import type {GoalProposal} from './goal-proposals';
import {indexes} from '../lib/engi/indexes';
import {shuffle} from '../lib/engi/engine';
import {yearInterval} from '../lib/engi/questions/date-interval';
import {buildIntervalScale} from '../lib/engi/questions/interval-scale';
import {arePeriodsClose} from '../lib/engi/questions/interval-proximity';
/** Group facts, not entities or identically named fields. Never fetch global filler. */
export function buildIntervalGroup(b:Bundle,ready:GoalProposal[],supports:GoalProposal[],history:Task[],width:number):Task|undefined{
 if(history.slice(-6).some(t=>t.intervalExercise?.kind==='bands')||history.at(-1)?.recipe.format==='sort')return;
 const ix=indexes(b),facts=new Map(b.facts.map(f=>[f.id,f])),fact=(p:GoalProposal)=>facts.get(p.items[0]?.factId??'');
 const ranges=new Map([...ready,...supports].map(p=>{const f=fact(p);return [p,f&&yearInterval(f)] as const;})),range=(p:GoalProposal)=>ranges.get(p);
 const valid=(p:GoalProposal)=>{const f=fact(p),property=f&&ix.propertyById.get(f.key);return p.goals.length===1&&p.goals[0].skill==='recognition'&&p.recipe.format==='choice'&&p.recipe.direction!=='reverse'&&p.items.length===1&&!!range(p)&&property?.learnable&&property.learning?.rangeBands!=='off'&&property.learning?.match!=='off';};
 const candidates=[...new Map(ready.filter(valid).map(p=>[p.items[0].targetId,p])).values()].slice(0,24);
 const known=[...new Map(supports.filter(valid).map(p=>[p.items[0].targetId,p])).values()].slice(0,12);
 function create(selected:GoalProposal[],support?:GoalProposal):Task|undefined{
  if(!arePeriodsClose(selected.map(p=>range(p)!)))return;
  const sorted=[...selected].sort((a,c)=>range(a)!.start-range(c)!.start||range(a)!.end-range(c)!.end||a.items[0].targetId.localeCompare(c.items[0].targetId));
  const scale=buildIntervalScale(sorted.map(p=>({id:'band:'+p.items[0].targetId,...range(p)!,...(p===support?{support:true}:{})})),'dated',width);
  if(!scale)return;
  const items=shuffle(selected).map(p=>{const i=p.items[0],f=fact(p)!,property=ix.propertyById.get(f.key)!,band=scale.bands.find(v=>v.id==='band:'+i.targetId)!;
   return {...i,answerId:band.id,answer:band.marker,interval:{...range(p)!,propertyId:f.key,propertyLabel:property.shortName?.trim()||property.name}};
  });
  return {id:crypto.randomUUID(),memoryModel:'goals',learningLifecycle:1,intent:'learn',reason:'context',intervalExercise:{kind:'bands',interaction:'quiz',scale},recipe:{...selected[0].recipe,id:selected[0].recipe.id+':bands',format:'match',cue:'name',answerPresentation:undefined,prompt:'Какой это период?',diagnostic:false},items,options:scale.bands.map(v=>({id:v.id,name:v.marker}))};
 }
 for(const anchor of candidates){
  const peers=shuffle(candidates.filter(p=>p!==anchor)).sort((a,c)=>{const x=range(anchor)!,distance=(p:GoalProposal)=>Math.abs(range(p)!.start-x.start)+Math.abs(range(p)!.end-x.end);return distance(a)-distance(c);});
  for(let size=Math.min(5,candidates.length);size>=3;size--){
   let attempts=0;
   const search=(selected:GoalProposal[],from:number):Task|undefined=>{
    if(selected.length===size){attempts++;return create(selected);}
    for(let n=from;n<peers.length&&attempts<128;n++){const p=peers[n],r=range(p)!;if(selected.some(s=>range(s)!.start===r.start&&range(s)!.end===r.end))continue;const task=search([...selected,p],n+1);if(task)return task;}
   };
   const task=search([anchor],0);if(task)return task;
  }
  // Two current goals may use one explicitly labelled known reference.
  for(const peer of peers){for(const support of known){if([anchor,peer].some(p=>p.items[0].targetId===support.items[0].targetId))continue;const task=create([anchor,peer,support],support);if(task)return task;}}
 }
}
