import type {Bundle,Task} from '../lib/engi/types';
import type {GoalProposal} from './goal-proposals';
import {indexes} from '../lib/engi/indexes';
import {shuffle} from '../lib/engi/engine';
import {yearInterval} from '../lib/engi/questions/date-interval';
import {buildIntervalScale} from '../lib/engi/questions/interval-scale';
/** The caller supplies current obligations and at most optional known supports, never global filler. */
export function buildIntervalGroup(b:Bundle,ready:GoalProposal[],supports:GoalProposal[],history:Task[],width:number):Task|undefined{
 if(history.slice(-6).some(t=>t.intervalExercise?.kind==='bands')||history.at(-1)?.recipe.format==='sort')return;
 const ix=indexes(b),rangeFor=(p:GoalProposal)=>{const i=p.items[0],f=i&&ix.factsByEntityAndKey.get(i.entityId)?.get(p.recipe.answerKey)?.find(f=>f.id===i.factId);return f?yearInterval(f):undefined;},valid=(p:GoalProposal)=>p.goals.length===1&&p.goals[0].skill==='recognition'&&p.recipe.format==='choice'&&p.recipe.direction!=='reverse'&&p.items.length===1&&!!rangeFor(p)&&ix.propertyById.get(p.recipe.answerKey)?.learning?.rangeBands!=='off'&&ix.propertyById.get(p.recipe.answerKey)?.learning?.match!=='off';
 const candidates=ready.filter(valid).slice(0,24),max=width<500?3:5;
 for(const anchor of candidates){
  const selected:GoalProposal[]=[],used=new Set<string>();
  const add=(p:GoalProposal)=>{const i=p.items[0],r=yearInterval(ix.factsByEntityAndKey.get(i.entityId)!.get(p.recipe.answerKey)!.find(f=>f.id===i.factId)!);if(!r||used.has(i.entityId)||selected.some(s=>{const j=s.items[0],rr=yearInterval(ix.factsByEntityAndKey.get(j.entityId)!.get(s.recipe.answerKey)!.find(f=>f.id===j.factId)!)!;return rr.start===r.start&&rr.end===r.end;}))return false;selected.push(p);used.add(i.entityId);return true;};
  for(const p of [anchor,...shuffle(candidates.filter(p=>p!==anchor&&p.recipe.answerKey===anchor.recipe.answerKey))]){add(p);if(selected.length===max)break;}
  if(selected.length<2)continue;
  let support:GoalProposal|undefined;if(selected.length===2){support=supports.filter(valid).find(p=>p.recipe.answerKey===anchor.recipe.answerKey&&add(p));}
  if(selected.length<3)continue;
  const shuffled=shuffle(selected),raw=shuffled.map(p=>{const i=p.items[0],f=ix.factsByEntityAndKey.get(i.entityId)!.get(p.recipe.answerKey)!.find(f=>f.id===i.factId)!;return {id:'band:'+i.entityId,...yearInterval(f)!,...(p===support?{support:true}:{})};});
  const previous=history.filter(t=>t.intervalExercise?.kind==='bands').at(-1),mode=support?'anchored':previous?.intervalExercise?.kind==='bands'&&previous.intervalExercise.scale.mode==='dated'?'sparse':'dated';
  const scale=buildIntervalScale(raw,mode,width);if(!scale)continue;
  const items=shuffle(shuffled.map(p=>{const i=p.items[0],band=scale.bands.find(b=>b.id==='band:'+i.entityId)!;return {...i,answerId:band.id,answer:band.marker,interval:{start:band.start,end:band.end}};}));
  return {id:crypto.randomUUID(),memoryModel:'goals',learningLifecycle:1,intent:'learn',reason:'context',intervalExercise:{kind:'bands',scale},recipe:{...anchor.recipe,id:anchor.recipe.id+':bands',format:'match',cue:'name',answerPresentation:undefined,prompt:'Сопоставьте объекты с периодами',diagnostic:false},items,options:scale.bands.map(b=>({id:b.id,name:b.marker}))};
 }
}
