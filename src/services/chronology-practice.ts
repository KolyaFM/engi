import type {Bundle,Memory,Task,Format} from '../lib/engi/types';
import {composeFeed,compositionContext} from '../lib/engi/session/composer';
import {orderingTargets} from '../lib/engi/questions/ordering';
import {compileTaskContract} from '../lib/engi/study-core/compiler';
import {selectionTie} from '../lib/engi/session/continuous-feed-policy';
/** Diagnostics use learned, enabled facts only. They never assert knowledge of exact dates. */
export function chronologyPractice(b:Bundle,enabled:Memory[],facts:Set<string>,protectedGoals:Set<string>,tag:string,format:string,history:Task[],seed:string,onlyStandalone=false){
 const available:Format[]=['sort'],formats=available.filter(f=>format==='mixed'||f===format||format==='timeline');
 const context=compositionContext(b),standalone=context.standaloneOrderingTargets,knownTargets=new Set([...facts].map(id=>`ku:fact:${id}:forward`));
 const allowed=new Set(enabled.filter(m=>!m.legacyOf&&m.status!=='suspended'&&(standalone.has(m.id)||knownTargets.has(m.id))).map(m=>m.id));
 const tasks=formats.flatMap(f=>composeFeed(b,enabled,tag,f,'practice',history,Math.max(4,context.recipes.filter(r=>r.format==='sort').length),allowed)).filter(t=>!onlyStandalone||t.items.some(i=>orderingTargets(i).some(id=>standalone.has(id))));
 const owners=(t:Task)=>t.items.map(i=>i.factId?b.facts.find(f=>f.id===i.factId)?.entityId??i.entityId:i.entityId),last=new Set(history.at(-1)?owners(history.at(-1)!):[]);
 const rank=(t:Task)=>Number(owners(t).some(id=>last.has(id)))*100+history.slice(-5).filter(h=>h.recipe.answerKey===t.recipe.answerKey).length*20;
 tasks.sort((a,c)=>rank(a)-rank(c)||selectionTie(seed+a.recipe.id)-selectionTie(seed+c.recipe.id));
 for(const task of tasks){if(!task.items.every(i=>orderingTargets(i).every(id=>allowed.has(id))))continue;
  try{if(task.recipe.format==='sort'&&task.items.every(i=>!!i.image))task.recipe={...task.recipe,cue:'image'};task.memoryModel='goals';task.learningLifecycle=1;task.intent='practice';task.practice=true;task.reason='game';
   const contract=compileTaskContract(b,task);
   if([...contract.shownClaims,...contract.feedbackClaims].some(c=>c.revealsGoalIds.some(id=>protectedGoals.has(id))))continue;
   return task;
  }catch{continue;}
 }
}
