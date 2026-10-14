import type {EngiDB,SessionRow} from '../db/engi-db';
import type {Bundle,Memory} from '../lib/engi/types';
import type {GoalMemory} from '../lib/engi/study-core/memory';
import {knowledgeMistakeKey} from '../lib/engi/study-core/mistakes';
import {selectRepairCandidate} from '../lib/engi/session/study-work-policy';
import {goalProposalPool,materializeGoalProposal} from './goal-proposals';
import {MISTAKE_EPISODES_KEY,markRepairUnavailable,type MistakeEpisode} from './mistake-episodes';
import {compileTaskContract} from '../lib/engi/study-core/compiler';
import {buildGoalCatalog} from './goal-catalog';
import {canonicalTargets} from '../lib/engi/questions/recipe-factory';
export async function selectRepairWork(db:EngiDB,b:Bundle,enabled:Memory[],session:SessionRow,memories:ReadonlyMap<string,GoalMemory>,hasLearning:boolean,options:{excludedKeys?:ReadonlySet<string>;format?:string}={}){
 if(session.mode==='practice')return;
 const ledger=await db.appMeta.get(MISTAKE_EPISODES_KEY),episodes=(ledger?.value.episodes??[]).filter((e:MistakeEpisode)=>e.status==='open'||e.status==='unavailable'&&e.unavailableReason) as MistakeEpisode[];
 if(!episodes.length)return;
 const pool=goalProposalPool(b,enabled,session.tag,'mixed'),byKey=new Map(episodes.map(e=>[e.key,e]));
 const dueReview=(goals:typeof pool.proposals[number]['goals'])=>goals.every(g=>{const memory=memories.get(g.id);return memory&&new Date(memory.card.due).getTime()<=Date.now();});
 const owners=new Map(b.facts.map(f=>[f.id,f.entityId])),owner=(item:typeof pool.proposals[number]['items'][number])=>item.factId?owners.get(item.factId)??item.entityId:item.entityId;
 const selector=await db.appMeta.get('studyCore:goalSelector');
 const lastObjects=new Set<string>(session.cooldown?.at(-1)?.items.map(owner)??selector?.value.recent?.at(-1)?.objectIds??[]);
 const format=options.format;
 const requestedKeys=new Set(pool.proposals.filter(p=>p.goals.length===1&&p.recipe.format===session.format).map(p=>knowledgeMistakeKey(p.goals[0])));
 // Ready errors have priority even when the same goal also has ordinary work.
 // Otherwise regular variety ranking can postpone their correction indefinitely.
 const candidates=pool.proposals.filter(p=>p.goals.length===1&&byKey.has(knowledgeMistakeKey(p.goals[0]))&&!options.excludedKeys?.has(knowledgeMistakeKey(p.goals[0]))&&(!format||format==='mixed'||p.recipe.format===format)&&(!requestedKeys.has(knowledgeMistakeKey(p.goals[0]))||p.recipe.format===session.format)&&!(hasLearning&&dueReview(p.goals)&&p.items.some(i=>lastObjects.has(owner(i))))).map(proposal=>({proposal,episode:byKey.get(knowledgeMistakeKey(proposal.goals[0]))!}));
 const targets=new Set(canonicalTargets(b,session.tag).map(i=>i.targetId)),scopedKeys=new Set(buildGoalCatalog(b,enabled).filter(e=>!e.suspended&&e.targetIds.every(id=>targets.has(id))).map(e=>knowledgeMistakeKey(e.goal)));
 const atomicKeys=new Set(pool.proposals.filter(p=>p.goals.length===1).map(p=>knowledgeMistakeKey(p.goals[0])));
 await markRepairUnavailable(db,episodes.filter(e=>scopedKeys.has(e.key)&&!atomicKeys.has(e.key)).map(e=>e.id));
 const blocked=new Set<string>();
 while(candidates.length){
  const preferred=candidates.filter(c=>c.proposal.recipe.format===session.format),considered=preferred.length?preferred:candidates;
  const selected=selectRepairCandidate(considered.map(c=>({key:c.episode.key,lastAttemptAt:c.episode.lastAttemptAt,goal:c.proposal.goals[0],format:c.proposal.recipe.format})),session.cooldown??[],hasLearning);
  if(selected<0)return;const index=candidates.indexOf(considered[selected]);
  const {proposal,episode}=candidates[index],task=materializeGoalProposal(b,enabled,proposal,pool.context,session.tag??'all',session.cooldown??[],false,memories);
  if(!task||episode.failedImage&&task.recipe.cue==='image'&&task.items.some(i=>i.image===episode.failedImage)){blocked.add(episode.id);candidates.splice(index,1);continue;}
  // An actual due review must retain ordinary FSRS rights. An extra repair
  // before its due date only clears the error and cannot reschedule memory.
  const due=dueReview(proposal.goals);
  task.intent=due?'learn':'repair';task.repairEpisodeIds=due?undefined:[episode.id];task.reason=due?'due':'retry';task.studyContract=undefined;
  const contract=compileTaskContract(b,task),shown=new Set(contract.shownClaims.flatMap(c=>c.revealsGoalIds));
  if(contract.primaryGoals.some(g=>shown.has(g.id))){blocked.add(episode.id);candidates.splice(index,1);continue;}
  if(episode.status==='unavailable'){const current=await db.appMeta.get(MISTAKE_EPISODES_KEY),stored=current?.value.episodes.find((e:MistakeEpisode)=>e.id===episode.id);if(stored){stored.status='open';stored.unavailableReason=undefined;await db.appMeta.put({key:current!.key,value:current!.value});}}
  // Repairs also occupy the feed. Keep presentation history across visits so
  // the regular selector does not immediately repeat the last repaired object.
  if(selector?.value.version===1){const objectIds=[...new Set(task.items.map(owner))];await db.appMeta.put({key:selector.key,value:{...selector.value,recent:[...selector.value.recent,{objectIds,format:task.recipe.format}].slice(-3)}});}
  return task;
 }
 if(blocked.size)await markRepairUnavailable(db,[...blocked]);
}
