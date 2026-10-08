import type {Bundle,Memory,Task} from '../lib/engi/types';
import {compileTaskContract} from '../lib/engi/study-core/compiler';
import {composeUnit,composeFeed,compositionContext} from '../lib/engi/session/composer';
import {feedSpan} from './feed-performance';
/** Transitional builder: old rows only configure enabled units, never their schedule. */
export function goalCandidates(b:Bundle,enabled:Memory[],tag='all',format='mixed',history:Task[]=[],targetFilter?:Set<string>):Task[]{
 const end=feedSpan('candidates');try{
 const formats=format==='mixed'?['choice','multi_choice','recall_reveal','match','categorize']:[format];
 const tasks:Task[]=[],seen=new Set<string>(),activeIds=new Set(enabled.filter(m=>!m.legacyOf&&m.status!=='suspended').map(m=>m.id));
 const context=compositionContext(b);
 for(const m of enabled.filter(m=>!m.legacyOf&&m.status!=='suspended'&&(!targetFilter||targetFilter.has(m.id))))for(const fmt of formats){
  const task=composeUnit(b,{...m,status:'review',bootstrap:undefined},tag,fmt,history,context);
  if(!task||task.items.some(i=>!activeIds.has(i.targetId)))continue;
  task.memoryModel='goals';
  try{const contract=compileTaskContract(b,task),key=JSON.stringify([contract.primaryGoals.map(g=>g.id).sort(),contract.actionFamily,task.recipe.format]);
   if(!contract.primaryGoals.length||seen.has(key))continue;
   seen.add(key);task.studyContract=contract;tasks.push(task);
  }catch{continue;}
 }
 if(['timeline','sort','missing'].includes(format))for(const t of composeFeed(b,enabled,tag,format,'practice',history,1)){t.memoryModel='goals';tasks.push(t);}
 return tasks;
 }finally{end();}
}
