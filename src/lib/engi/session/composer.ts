import type {Bundle,Memory,Task,Item,Recipe} from '../types';
import {recipes,eligible} from '../questions/recipe-factory';
import {distractors} from '../questions/distractors';
import {timelineContext} from '../questions/timeline';
import {shuffle,preflight} from '../engine';

export function cooled(i:Item,recent:Task[]){return !recent.slice(-3).some((t,n,a)=>t.items.some(x=>x.targetId===i.targetId||!!i.answerEntityId&&(x.answerEntityId===i.answerEntityId||x.entityId===i.answerEntityId)||x.answerEntityId===i.entityId||(a.length-n<=2&&(x.entityId===i.entityId||!!i.factId&&x.factId===i.factId))))}

function needsObjective(m?:Memory){const c=m?.selfReport;return !!c&&c.remembered>=2&&(c.objectiveFailures>c.objectiveSuccesses||c.remembered>c.objectiveSuccesses*3+2)}

export function composeFeed(b:Bundle,memories:Memory[],tag='all',format='mixed',mode='daily',recent:Task[]=[],count=12,completed=0):Task[]{
 const mem=new Map(memories.map(m=>[m.id,m]));
 const rs=recipes(b).filter(r=>(tag==='all'?r.tag===undefined:r.tag===tag)&&(format==='mixed'||r.format===format));
 const pools=new Map(rs.map(r=>[r.id,eligible(b,r)]));
 const targets=new Map<string,{item:Item;recipes:Recipe[]}>();
 for(const r of rs.filter(r=>!r.diagnostic))for(const i of pools.get(r.id)??[]){const entry=targets.get(i.targetId)??{item:i,recipes:[]};entry.recipes.push(r);targets.set(i.targetId,entry)}
 const dueCount=[...targets.keys()].filter(id=>mem.has(id)&&new Date(mem.get(id)!.card.due).getTime()<=Date.now()).length;
 const out:Task[]=[];
 for(let n=0;n<count;n++){
  const history=[...recent,...out],lastChallenge=history.slice(-8).some(t=>t.recipe.diagnostic);
  const challenge=(format!=='mixed'&&rs.length>0&&rs.every(r=>r.diagnostic))||(format==='mixed'&&history.length>=8&&!lastChallenge);
  let built:Task|undefined;
  if(challenge)for(const r of shuffle(rs.filter(r=>r.diagnostic))){
   const pool=pools.get(r.id)??[];let raw=shuffle(pool).filter(i=>cooled(i,history));
   if(format!=='mixed'&&!raw.length)raw=shuffle(pool).filter(i=>i.targetId!==history.at(-1)?.items[0]?.targetId);
   const seen=new Set<number>(),items=raw.filter(i=>{if(i.year===undefined||seen.has(i.year))return false;seen.add(i.year);return true}).slice(0,4);
   if(r.format==='timeline'?items.length<1:items.length<3)continue;
   const t:Task={id:crypto.randomUUID(),recipe:r,items:r.format==='timeline'?[items[0]]:items,options:shuffle(items.map(i=>({id:i.entityId,name:i.name}))),reason:'challenge'};
   if(r.format==='timeline')t.timeline=timelineContext(pool);
   if(r.format==='missing')t.sequence=[...items].sort((a,c)=>a.year!-c.year!).map((i,n)=>n===1?null:{name:i.name,entityId:i.entityId});
   if(preflight(t)){built=t;break}
  }
  if(!built){
   const all=shuffle([...targets.values()]);let candidates=all.filter(x=>cooled(x.item,history));
   // A large pool can still have only three shared answers. Relax answer
   // spacing first, then shorten target spacing only when it is impossible.
   if(!candidates.length)for(let span=3;span>=0&&!candidates.length;span--){
    const window=span?history.slice(-span):[];
    candidates=all.filter(({item:i})=>!window.some((t,n,a)=>t.items.some(x=>x.targetId===i.targetId||(a.length-n<=2&&(x.entityId===i.entityId||!!i.factId&&x.factId===i.factId)))));
   }
   const groups={due:candidates.filter(x=>{const m=mem.get(x.item.targetId);return m&&new Date(m.card.due).getTime()<=Date.now()}),weak:candidates.filter(x=>{const m=mem.get(x.item.targetId);return m&&(m.attempts>m.correct||Object.values(m.confusions).some(c=>c>.2)||needsObjective(m))}),new:candidates.filter(x=>!mem.has(x.item.targetId))};
   const draw=Math.random(),prefer=mode==='weak'?'weak':mode==='explore'?'new':draw<(dueCount>30?.7:.55)?'due':draw<(dueCount>30?.85:.75)?'weak':'new';
   const order=[...new Set([prefer,'due','weak','new'])] as (keyof typeof groups)[];
   let selected=order.flatMap(k=>groups[k].map(x=>({...x,reason:k==='weak'&&Object.values(mem.get(x.item.targetId)?.confusions??{}).some(c=>c>.2)?'confusion':k})));
   if(!selected.length)selected=candidates.map(x=>({...x,reason:'practice'}));
   const allowRecall=format!=='mixed'||!history.slice(-4).some(t=>t.recipe.format==='recall_reveal');
   for(const x of selected){
    const m=mem.get(x.item.targetId),objective=needsObjective(m);
    const chooseRecall=allowRecall&&!objective&&Math.random()<.18;
    const options=shuffle(x.recipes).sort((a,c)=>{
     const rank=(r:Recipe)=>r.format==='recall_reveal'?(chooseRecall?0:4):r.format==='choice'?1:2;return rank(a)-rank(c);
    });
    const available=options.some(r=>r.format!=='recall_reveal')?options.filter(r=>r.format!=='recall_reveal'||allowRecall):options;
    for(const r of available){
     const item={...(pools.get(r.id)??[]).find(i=>i.targetId===x.item.targetId)??x.item};
     const media=b.media.filter(m=>m.entityId===item.entityId&&!m.archived&&m.learningExemplar!==false);
     if(r.cue==='image'&&media.length>1&&m?.card.stability>=7)item.image=shuffle(media)[0].url;
     const wrong=distractors(b,item,pools.get(r.id)??[],m,history);
     const twin=format==='mixed'&&r.format==='choice'&&wrong.length>0&&(m?.confusions[wrong[0].id]??0)>=1&&!history.slice(-2).some(t=>t.discrimination)&&Math.random()<.45;
     const t:Task={id:crypto.randomUUID(),recipe:{...r},items:[item],options:shuffle([{id:item.answerId,name:item.answer},...(twin?wrong.slice(0,1):wrong)]),reason:objective?'calibration':x.reason,pretest:!m,discrimination:twin};
     if(twin)t.recipe.label='Различим похожее';
     if(preflight(t)){built=t;break}
    }
    if(built)break;
   }
  }
  if(!built)break;out.push(built);
 }
 return out;
}

export function repairTask(original:Task,index:number,wrongChoices:string[]=[]):Task{
 const item=original.items[index]??original.items[0],wrong=original.options.filter(o=>wrongChoices.includes(o.id)&&o.id!==item.answerId);
 const discrimination=wrong.length>0&&original.recipe.format!=='recall_reveal';
 const format=discrimination?'choice':original.recipe.format==='recall_reveal'&&original.options.length>=3?'choice':'recall_reveal';
 return {...original,id:crypto.randomUUID(),retryOf:original.id,reason:'retry',items:[item],repairChoices:wrongChoices,discrimination,pretest:false,
  options:discrimination?shuffle([{id:item.answerId,name:item.answer},wrong[0]]):original.options,
  recipe:{...original.recipe,id:original.recipe.id+':repair',format,diagnostic:false,label:discrimination?'Различим похожее':original.recipe.label,evidence:{level:'direct',fsrsEnabled:true,gradeCap:'good',selfReport:format==='recall_reveal'},feed:{presentation:'atomic',autoAdvanceOnCorrect:true,correctHoldMs:320,maxOptions:4}}};
}
