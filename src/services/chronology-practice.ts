import type {Bundle,Memory,Task,Format} from '../lib/engi/types';
import {composeFeed} from '../lib/engi/session/composer';
import {compileTaskContract} from '../lib/engi/study-core/compiler';
import {selectionTie} from '../lib/engi/session/continuous-feed-policy';
/** Diagnostics use learned, enabled facts only. They never assert knowledge of exact dates. */
export function chronologyPractice(b:Bundle,enabled:Memory[],facts:Set<string>,protectedGoals:Set<string>,tag:string,format:string,history:Task[],seed:string){
 const available:Format[]=['sort'],formats=available.filter(f=>format==='mixed'||f===format||format==='timeline');
 const restricted={...b,facts:b.facts.filter(f=>facts.has(f.id))};
 const tasks=formats.flatMap(f=>composeFeed(restricted,enabled,tag,f,'practice',history,4));
 const owners=(t:Task)=>t.items.map(i=>i.factId?b.facts.find(f=>f.id===i.factId)?.entityId??i.entityId:i.entityId),last=new Set(history.at(-1)?owners(history.at(-1)!):[]);
 const rank=(t:Task)=>Number(owners(t).some(id=>last.has(id)))*100+history.slice(-5).filter(h=>h.recipe.format===t.recipe.format).length*5;
 tasks.sort((a,c)=>rank(a)-rank(c)||selectionTie(seed+a.recipe.format)-selectionTie(seed+c.recipe.format));
 for(const task of tasks){if(!task.items.every(i=>enabled.some(m=>m.id===i.targetId&&!m.legacyOf&&m.status!=='suspended')))continue;
  try{if(task.recipe.format==='sort'&&task.items.every(i=>!!i.image))task.recipe={...task.recipe,cue:'image'};task.memoryModel='goals';task.learningLifecycle=1;task.intent='practice';task.practice=true;task.reason='game';
   const contract=compileTaskContract(b,task);
   if([...contract.shownClaims,...contract.feedbackClaims].some(c=>c.revealsGoalIds.some(id=>protectedGoals.has(id))))continue;
   return task;
  }catch{continue;}
 }
}
