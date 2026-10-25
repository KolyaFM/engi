import type {Bundle,Task} from '../lib/engi/types';
import type {GoalProposal} from './goal-proposals';
import {groupContext} from './group-affinity';
/** Only supplied ready targets; no unseen or future knowledge is added to fill slots. */
export function buildSelfCheck(b:Bundle,ready:GoalProposal[],affinity=groupContext(b),history:Task[]=[]):Task|undefined{
 // Both directions test the same image property. Present its own image as the
 // front even when the ordinary choice generator picked image answer buttons.
 ready=ready.filter(p=>p.recipe.direction!=='reverse'&&!p.items.some(i=>i.dateEdge)).map(p=>p.recipe.answerPresentation==='image'&&b.properties?.some(d=>d.id===p.recipe.answerKey&&d.valueKind==='image')?{...p,recipe:{...p.recipe,cue:'image',answerPresentation:undefined},items:p.items.map(i=>({...i,image:i.answerImage,mediaId:i.answerMediaId}))}:p);
 // Keep self-check history beyond the shorter ordinary object/pair cooldown.
 // Count the actual fact, so another property of the same object stays eligible.
 const key=(item:Task['items'][number],answerKey:string)=>JSON.stringify([item.entityId,item.factId??answerKey]);
 const usage=new Map<string,{count:number;last:number}>();
 history.forEach((task,index)=>{if(task.recipe.format!=='self_check')return;for(const item of task.items){const id=key(item,task.recipe.answerKey),old=usage.get(id);usage.set(id,{count:(old?.count??0)+1,last:index});}});
 const variety=(a:GoalProposal,c:GoalProposal)=>{const x=usage.get(key(a.items[0],a.recipe.answerKey)),y=usage.get(key(c.items[0],c.recipe.answerKey));return (x?.count??0)-(y?.count??0)||(x?.last??-1)-(y?.last??-1);};
 ready=[...ready].sort(variety);
 const answerItems=ready.map(p=>p.items[0]);
 for(const anchor of ready){if(anchor.recipe.format!=='choice'||anchor.recipe.answerPresentation==='image')continue;const signature=affinity.signature(anchor.items[0],anchor.recipe);if(!signature)continue;const members=ready.filter(p=>p.recipe.format==='choice'&&!p.recipe.answerPresentation&&p.recipe.answerKey===anchor.recipe.answerKey&&p.recipe.cue===anchor.recipe.cue&&p.recipe.direction===anchor.recipe.direction&&affinity.signature(p.items[0],p.recipe)===signature),seen=new Set<string>(),items:Task['items']=[];
  members.sort((a,c)=>Number(c===anchor)-Number(a===anchor));
  while(members.length){if(items.length)members.sort((a,c)=>variety(a,c)||affinity.rank(c.items[0],items,answerItems)-affinity.rank(a.items[0],items,answerItems));const p=members.shift()!;
  const item=p.items[0];if(!item||seen.has(item.entityId)||items.some(i=>(anchor.recipe.cue==='image'?i.image:i.name)===(anchor.recipe.cue==='image'?item.image:item.name)))continue;seen.add(item.entityId);items.push({...item});if(items.length===4)break;}
  if(items.length<3)continue;const property=b.properties?.find(p=>p.id===anchor.recipe.answerKey),prompt=property?.valueKind==='image'?(property.promptTemplates?.forward&&!property.promptTemplates.forward.includes('{subject}')?property.promptTemplates.forward:'Каким объектам принадлежат эти изображения?'):`Попробуйте вспомнить: ${anchor.recipe.label??anchor.recipe.answerKey}`;
  return {id:crypto.randomUUID(),memoryModel:'goals',learningLifecycle:1,presentation:'flip-grid',intent:'practice',practice:true,reason:'self-check',recipe:{...anchor.recipe,id:anchor.recipe.id+':self-check',format:'self_check',prompt,diagnostic:false,countsTowardMastery:false,evidence:{level:'partial',fsrsEnabled:false,gradeCap:'good'}},items,options:[]};
 }return;
}
