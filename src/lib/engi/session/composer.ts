import {properties} from '../knowledge/properties';
import type {Bundle,Memory,Task,Item,Recipe} from '../types';
import {recipes,eligible} from '../questions/recipe-factory';
import {distractors} from '../questions/distractors';
import {timelineContext} from '../questions/timeline';
import {shuffle,preflight,normalize} from '../engine';
import {difficultyStage} from '../learning/mastery';
import {selectExemplar} from '../questions/exemplar-selector';
import {questionPrompt} from '../questions/question-templates';
export function cooled(i:Item,recent:Task[]){return !recent.slice(-3).some(t=>t.items.some(x=>x.targetId===i.targetId||x.entityId===i.entityId||!!i.answerEntityId&&x.answerEntityId===i.answerEntityId))}
function distinctSetDistractors(answers:Bundle['entities']){
 const labels=new Set(answers.flatMap(e=>[e.name,...e.aliases].map(normalize))),names=new Set(answers.map(e=>normalize(e.name)));
 return (e:Bundle['entities'][number])=>{const name=normalize(e.name);if(names.has(name)||[e.name,...e.aliases].some(label=>labels.has(normalize(label))))return false;names.add(name);return true;};
}
export type CompositionContext={recipes:Recipe[];pools:Map<Recipe,Item[]>;targets:Map<string,{r:Recipe;i:Item}[]>};
export function compositionContext(b:Bundle):CompositionContext{
 const all=recipes(b),pools=new Map(all.map(r=>[r,eligible(b,r)])),targets=new Map<string,{r:Recipe;i:Item}[]>();
 for(const r of all)for(const i of pools.get(r)!){const list=targets.get(i.targetId)??[];list.push({r,i});targets.set(i.targetId,list);}
 return {recipes:all,pools,targets};
}
export function composeUnit(b:Bundle,m:Memory,tag='all',format='mixed',history:Task[]=[],context?:CompositionContext):Task|undefined{
 const poolFor=(r:Recipe)=>context?.pools.get(r)??eligible(b,r);
 const permitted=(r:Recipe)=>!r.diagnostic&&(tag==='all'?r.tag===undefined:r.tag===tag)&&(format==='mixed'||r.format===format);
 const candidates=context?(context.targets.get(m.id)??[]).filter(({r})=>permitted(r)):recipes(b).filter(permitted).flatMap(r=>poolFor(r).filter(i=>i.targetId===m.id).map(i=>({r,i})));
 const stage=difficultyStage(m),objective=m.status==='triaged'||m.status==='learning'||!!m.selfReport&&(m.selfReport.remembered>m.selfReport.objectiveSuccesses*3+2||m.selfReport.objectiveFailures>m.selfReport.objectiveSuccesses);
 const recallEligible=!objective&&stage>=3&&!history.slice(-4).some(t=>t.recipe.format==='recall_reveal');
 const rank=(r:Recipe)=>r.format==='recall_reveal'?(recallEligible?0:5):r.format==='choice'?1:r.format==='categorize'?2:3;
 for(const {r,i} of shuffle(candidates).sort((a,c)=>rank(a.r)-rank(c.r))){
  if(r.format==='multi_choice'){const facts=b.facts.filter(f=>f.entityId===i.entityId&&f.key===r.answerKey&&!f.archived&&['verified','direct','user_confirmed'].includes(f.verification));const correct=[...new Set(facts.map(f=>f.valueEntityId!))];const items=[i,...poolFor(r).filter(x=>x.entityId===i.entityId&&x.targetId!==i.targetId)];const targetCorrect=[...new Set(items.map(x=>x.answerId))];const answers=b.entities.filter(e=>targetCorrect.includes(e.id)&&!e.archived);const wrong=shuffle(b.entities.filter(e=>e.type===answers[0]?.type&&!e.archived&&!correct.includes(e.id))).filter(distinctSetDistractors(answers)).slice(0,Math.max(1,4-correct.length));const task:Task={id:crypto.randomUUID(),recipe:{...r,prompt:questionPrompt(properties(b).find(p=>p.id===r.answerKey),i.name,r.format,r.direction)+' Выберите все подходящие варианты.'},items,answerSet:targetCorrect,options:shuffle([...answers,...wrong].map(e=>({id:e.id,name:e.name}))),reason:'due'};if(preflight(task))return task;continue;}
  const item={...i},recipe={...r},pool=poolFor(r),exemplar=selectExemplar(b,i.entityId,r,m);if(r.cue==='image'){if(!exemplar)continue;item.image=exemplar.url;item.mediaId=exemplar.id}
  const wrong=distractors(b,item,pool,m,history),twin=r.format==='choice'&&stage>=3&&wrong.some(o=>(m.confusions[o.id]??0)>=1);
  const options=shuffle([{id:item.answerId,name:item.answer},...(twin?wrong.slice(0,1):wrong)]);
  if(r.answerPresentation==='image')for(const o of options){const candidate=pool.find(i=>i.answerId===o.id);Object.assign(o,{image:candidate?.answerImage,mediaId:candidate?.answerMediaId});}
  const p=properties(b).find(p=>p.id===r.answerKey);recipe.prompt=questionPrompt(p??{id:r.answerKey,name:r.label??'Имя',learnable:true,valueKind:'text',cardinality:'one'},item.name,r.format,r.direction);
  if(r.answerKey==='created_by'&&r.cue==='image'&&!p?.promptTemplates?.forward)recipe.prompt='Кто автор этой работы?';
  if(p?.valueKind==='image')recipe.prompt=r.answerPresentation==='image'?`Выберите ${p.name.toLowerCase()} для: ${item.name}`:(p.promptTemplates?.forward&&!p.promptTemplates.forward.includes('{subject}')?p.promptTemplates.forward:`Какому объекту принадлежит ${p.name.toLowerCase()}?`);
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
 if(original.recipe.format==='multi_choice')return {...original,studyContract:undefined,studyContractIssue:undefined,id:crypto.randomUUID(),retryOf:original.id,reason:'retry'};
 const item=original.items[index]??original.items[0],wrong=original.options.filter(o=>wrongChoices.includes(o.id)&&o.id!==item.answerId),discrimination=wrong.length>0&&original.recipe.format!=='recall_reveal';
 const format=discrimination?'choice':original.recipe.format==='recall_reveal'&&original.options.length>=3?'choice':'recall_reveal';
 return {...original,studyContract:undefined,studyContractIssue:undefined,id:crypto.randomUUID(),retryOf:original.id,reason:'retry',items:[item],repairChoices:wrongChoices,discrimination,pretest:false,practice:false,options:discrimination?shuffle([{id:item.answerId,name:item.answer},wrong[0]]):original.options,recipe:{...original.recipe,id:original.recipe.id+':repair',format,diagnostic:false,evidence:{level:'direct',fsrsEnabled:true,gradeCap:'good',selfReport:format==='recall_reveal'},feed:{presentation:'atomic',autoAdvanceOnCorrect:true,correctHoldMs:320,maxOptions:4}}};
}

