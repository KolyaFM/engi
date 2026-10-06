import {properties} from '../knowledge/properties';
import type {Bundle,Memory,Task,Item,Recipe} from '../types';
import {recipes,eligible} from '../questions/recipe-factory';
import {distractors} from '../questions/distractors';
import {timelineContext} from '../questions/timeline';
import {shuffle,preflight} from '../engine';
import {difficultyStage} from '../learning/mastery';
import {selectExemplar} from '../questions/exemplar-selector';
import {questionPrompt} from '../questions/question-templates';
export function cooled(i:Item,recent:Task[]){return !recent.slice(-3).some(t=>t.items.some(x=>x.targetId===i.targetId||x.entityId===i.entityId||!!i.answerEntityId&&x.answerEntityId===i.answerEntityId))}
export function composeUnit(b:Bundle,m:Memory,tag='all',format='mixed',history:Task[]=[]):Task|undefined{
 const candidates=recipes(b).filter(r=>!r.diagnostic&&(tag==='all'?r.tag===undefined:r.tag===tag)&&(format==='mixed'||r.format===format)).flatMap(r=>eligible(b,r).filter(i=>i.targetId===m.id).map(i=>({r,i})));
 const stage=difficultyStage(m),objective=m.status==='triaged'||m.status==='learning'||!!m.selfReport&&(m.selfReport.remembered>m.selfReport.objectiveSuccesses*3+2||m.selfReport.objectiveFailures>m.selfReport.objectiveSuccesses);
 const recallEligible=!objective&&stage>=3&&!history.slice(-4).some(t=>t.recipe.format==='recall_reveal');
 const rank=(r:Recipe)=>r.format==='recall_reveal'?(recallEligible?0:5):r.format==='choice'?1:r.format==='categorize'?2:3;
 for(const {r,i} of shuffle(candidates).sort((a,c)=>rank(a.r)-rank(c.r))){
  const item={...i},recipe={...r},pool=eligible(b,r),exemplar=selectExemplar(b,i.entityId,r,m);if(r.cue==='image'){if(!exemplar)continue;item.image=exemplar.url;item.mediaId=exemplar.id}
  const wrong=distractors(b,item,pool,m,history),twin=r.format==='choice'&&stage>=3&&wrong.some(o=>(m.confusions[o.id]??0)>=1);
  const options=shuffle([{id:item.answerId,name:item.answer},...(twin?wrong.slice(0,1):wrong)]);
  const p=properties(b).find(p=>p.id===r.answerKey);recipe.prompt=questionPrompt(p??{id:r.answerKey,name:r.label??'Имя',learnable:true,valueKind:'text',cardinality:'one'},item.name,r.format,r.direction);
  if(r.answerKey==='created_by'&&r.cue==='image'&&!p?.promptTemplates?.forward)recipe.prompt='Кто автор этой работы?';
  if(r.answerKey==='identity')recipe.prompt='Кто или что на изображении?';
  const t:Task={id:crypto.randomUUID(),recipe,items:[item],options,reason:objective?'calibration':'due',pretest:m.attempts===0,discrimination:twin,difficultyStage:stage};
  if(preflight(t))return t;
 }
}
/** Bounded builder: main mode never creates non-due filler or duplicates. */
export function composeFeed(b:Bundle,memories:Memory[],tag='all',format='mixed',mode='daily',recent:Task[]=[],count=12):Task[]{
 const main=mode!=='practice',out:Task[]=[];
 if(['timeline','sort','missing'].includes(format)){
  for(const r of recipes(b).filter(r=>r.format===format&&(tag==='all'?r.tag===undefined:r.tag===tag))){const pool=eligible(b,r),seen=new Set<number>(),items=shuffle(pool).filter(i=>{if(i.year===undefined||seen.has(i.year))return false;seen.add(i.year);return true}).slice(0,4);if(format==='timeline'?items.length<1:items.length<3)continue;
   const t:Task={id:crypto.randomUUID(),recipe:{...r,prompt:questionPrompt(properties(b).find(p=>p.id===r.answerKey),items[0].name,r.format,r.direction)},items:format==='timeline'?[items[0]]:items,options:shuffle(items.map(i=>({id:i.entityId,name:i.name}))),reason:'challenge'};
   if(format==='timeline')t.timeline=timelineContext(pool);if(format==='missing')t.sequence=[...items].sort((a,c)=>a.year!-c.year!).map((i,n)=>n===1?null:{name:i.name,entityId:i.entityId});if(preflight(t))out.push(t);if(out.length>=count)break;
  }return out;
 }
 for(const m of shuffle(memories.filter(m=>!m.legacyOf&&m.status!=='suspended'&&(!main||new Date(m.card.due).getTime()<=Date.now())))){
  if(out.length>=count)break;if(recent.some(t=>t.items.some(i=>i.targetId===m.id)))continue;
  const t=composeUnit(b,m,tag,format,[...recent,...out]);if(t){t.practice=mode==='practice'&&new Date(m.card.due).getTime()>Date.now();out.push(t)}
 }return out;
}
export function repairTask(original:Task,index:number,wrongChoices:string[]=[]):Task{
 const item=original.items[index]??original.items[0],wrong=original.options.filter(o=>wrongChoices.includes(o.id)&&o.id!==item.answerId),discrimination=wrong.length>0&&original.recipe.format!=='recall_reveal';
 const format=discrimination?'choice':original.recipe.format==='recall_reveal'&&original.options.length>=3?'choice':'recall_reveal';
 return {...original,id:crypto.randomUUID(),retryOf:original.id,reason:'retry',items:[item],repairChoices:wrongChoices,discrimination,pretest:false,practice:false,options:discrimination?shuffle([{id:item.answerId,name:item.answer},wrong[0]]):original.options,recipe:{...original.recipe,id:original.recipe.id+':repair',format,diagnostic:false,evidence:{level:'direct',fsrsEnabled:true,gradeCap:'good',selfReport:format==='recall_reveal'},feed:{presentation:'atomic',autoAdvanceOnCorrect:true,correctHoldMs:320,maxOptions:4}}};
}

