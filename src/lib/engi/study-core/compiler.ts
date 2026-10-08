import type { Bundle, Fact, Item, Task } from '../types';
import { factValue, trusted, properties } from '../knowledge/properties';
import { defineGoal, type LearningGoal } from './goals';
import { validateContract, type Claim, type TaskContract } from './contracts';
import { discreteAnswer } from '../questions/timeline';
const version = (values: unknown[]) => JSON.stringify(values);
export function entityRevision(b: Bundle, id: string) {
  const e = b.entities.find(e => e.id === id && !e.archived && !e.mergedInto);
  if (!e) throw Error('Entity is unavailable');
  return version([e.id, e.type, e.name]);
}
export function factRevision(b: Bundle, f: Fact) {
  if (!trusted(f)) throw Error('Fact is unavailable');
  return version([f.entityId, f.key, factValue(f)]);
}
function factFor(b: Bundle, item: Item): Fact {
  const f = b.facts.find(f => f.id === item.factId);
  if (!f) throw Error('Fact is missing');
  factRevision(b, f);
  if(f.learnable===false)throw Error('Fact is not enabled for study');
  return f;
}
export function identityGoal(b: Bundle, entityId: string, skill: LearningGoal['skill']) {
  return defineGoal({ knowledge: {kind:'identity',key:entityId}, skill, direction:'forward', cueRole:'image-to-name',
    precision:'name', revision:entityRevision(b,entityId) });
}
export function associationGoal(b: Bundle, f: Fact, skill: LearningGoal['skill'], direction: LearningGoal['direction']='forward') {
  return defineGoal({ knowledge:{kind:'fact',key:f.id},skill,direction,cueRole:direction==='reverse'?'value-to-subject':'subject-to-value',
    precision:f.valueKind==='date'?f.datePrecision??'year':'value',revision:factRevision(b,f) });
}
export function completeSetGoal(b: Bundle, entityId: string, propertyId: string) {
  const rows=b.facts.filter(f=>f.entityId===entityId&&f.key===propertyId&&!f.archived);
  if (!rows.length || rows.some(f=>!trusted(f)||!f.completeSet||f.valueKind!=='entity'||f.learnable===false)) throw Error('Complete set is not confirmed');
  return defineGoal({knowledge:{kind:'complete-set',key:version([entityId,propertyId])},skill:'recognition',direction:'forward',cueRole:'subject',precision:'complete-set',
    revision:version([...new Set(rows.map(f=>factRevision(b,f)))].sort())});
}
export function claimForName(b: Bundle, id: string): Claim {
  return {key:`entity:${id}`,revision:entityRevision(b,id),revealsGoalIds:['recognition','recall'].map(skill=>identityGoal(b,id,skill as LearningGoal['skill']).id)};
}
export function claimForFact(b: Bundle, f: Fact): Claim {
  return {key:`fact:${f.id}`,revision:factRevision(b,f),revealsGoalIds:f.learnable===false?[]:['recognition','recall'].flatMap(skill=>['forward','reverse'].map(direction=>associationGoal(b,f,skill as LearningGoal['skill'],direction as LearningGoal['direction']).id))};
}
/** Compiles the information actually rendered by the current StudyFeed, not every field in Item. */
export function compileTaskContract(b: Bundle, task: Task): TaskContract {
  if (!task.items.length) throw Error('Empty task');
  const fmt=task.recipe.format, first=task.items[0], skill=fmt==='recall_reveal'?'recall':'recognition';
  const revisions: Record<string,string>={}, addClaim=(claim:Claim)=>{revisions[claim.key]=claim.revision;return claim;};
  for(const item of task.items){
    revisions[`entity:${item.entityId}`]=entityRevision(b,item.entityId);
    if(item.factId){const f=factFor(b,item);revisions[`fact:${f.id}`]=factRevision(b,f);
      // The graph may change even while the cached task still contains the old answer.
      const expected=task.recipe.direction==='reverse'?f.entityId:f.valueEntityId;
      if(f.valueKind==='entity'&&item.answerId!==expected)throw Error('Task answer disagrees with the graph');
    }
    if(item.answerEntityId)revisions[`entity:${item.answerEntityId}`]=entityRevision(b,item.answerEntityId);
    if(item.mediaId){const m=b.media.find(m=>m.id===item.mediaId&&!m.archived);if(!m||m.url!==item.image||m.entityId!==item.entityId)throw Error('Media is unavailable');revisions[`media:${m.id}`]=version([m.entityId,m.url,m.role,m.learningExemplar]);}
  }
  const p=properties(b).find(p=>p.id===task.recipe.answerKey);
  if(p)revisions[`property:${p.id}`]=version([p.valueKind,p.cardinality,p.learnable,p.learning,p.promptTemplates,p.inverse]);
  const goals:LearningGoal[]=[];
  const goalFor=(i:Item)=>i.factId?associationGoal(b,factFor(b,i),skill,task.recipe.direction??'forward'):identityGoal(b,i.entityId,skill);
  let response:TaskContract['response'],actionFamily:TaskContract['actionFamily'],practice=!!task.practice||task.recipe.diagnostic;
  if(fmt==='multi_choice'){
    const g=completeSetGoal(b,first.entityId,task.recipe.answerKey),rows=b.facts.filter(f=>f.entityId===first.entityId&&f.key===task.recipe.answerKey&&!f.archived);
    const expected=[...new Set(rows.map(f=>f.valueEntityId!))].sort();
    if(!task.answerSet||version([...task.answerSet].sort())!==version(expected))throw Error('A partial set cannot be presented as all values');
    for(const f of rows)revisions[`fact:${f.id}`]=factRevision(b,f);
    revisions[`set:${first.entityId}:${task.recipe.answerKey}`]=g.revision;
    goals.push(g);response={kind:'set',goalId:g.id,options:task.options.map(o=>o.id),expected,complete:true};actionFamily='select-set';
  }else if(fmt==='sort'){
    if(task.items.some(i=>!Number.isFinite(i.year))||new Set(task.items.map(i=>i.year)).size!==task.items.length)throw Error('Order is not strict');
    response={kind:'order',entities:task.items.map(i=>i.entityId),expected:[...task.items].sort((a,c)=>a.year!-c.year!).map(i=>i.entityId),relations:[]};actionFamily='order';practice=true;
  }else if(fmt==='missing'){
    response={kind:'practice-choice',options:task.options.map(o=>o.id),expected:discreteAnswer(task)};actionFamily='select';practice=true;
  }else if(fmt==='timeline'){
    if(!task.timeline||!Number.isFinite(first.year))throw Error('Timeline is missing');
    response={kind:'practice-number',expected:first.year!,tolerance:15,min:task.timeline.min,max:task.timeline.max};actionFamily='place-date';practice=true;
  }else if(fmt==='recall_reveal'){
    if(task.items.length!==1)throw Error('Grouped self report is unsupported');const g=goalFor(first);goals.push(g);response={kind:'self-report',goalId:g.id};actionFamily='recall';
  }else if((fmt==='match'||fmt==='categorize')&&task.items.length>1){
    goals.push(...task.items.map(goalFor));response={kind:'mapping',bindings:task.items.map((i,n)=>({responseKey:i.entityId,goalId:goals[n].id,expected:i.answerId})),options:task.options.map(o=>o.id),bijective:fmt==='match'};actionFamily=fmt==='match'?'match':'categorize';
  }else{
    const g=goalFor(first);goals.push(g);response={kind:'choice',goalId:g.id,options:task.options.map(o=>o.id),expected:first.answerId};actionFamily='select';
  }
  for(const g of goals)revisions[g.semanticKey]=g.revision;
  const shownClaims:Claim[]=[];
  // The feed shows a text cue unless it displays an image or a sorting/missing cue.
  if(fmt==='sort')task.items.forEach(i=>shownClaims.push(addClaim(claimForName(b,i.entityId))));
  else if(fmt==='missing')task.sequence?.filter(i=>!!i).forEach(i=>shownClaims.push(addClaim(claimForName(b,i!.entityId))));
 else if((fmt==='match'||fmt==='categorize')&&task.items.length>1){
   for(const item of task.items)if(task.recipe.cue==='name'||!item.image)shownClaims.push(addClaim(claimForName(b,item.entityId)));
 }
 else if(task.recipe.cue==='name'||!first.image)shownClaims.push(addClaim(claimForName(b,first.entityId)));
  // Custom prompts sometimes interpolate the subject even with an image cue.
  if(task.recipe.cue==='image'&&task.recipe.answerKey!=='identity'&&task.recipe.prompt?.includes(first.name))shownClaims.push(addClaim(claimForName(b,first.entityId)));
  const feedbackClaims:Claim[]=[];
  if(fmt!=='missing')for(const item of task.items){
    if(item.factId){
      const fact=factFor(b,item),claim=claimForFact(b,fact);
      // Diagnostic UI shows years, not full day/month answers. Correct sorts show no years.
      if(fmt==='sort'||fmt==='timeline'){
        if(fact.valueKind==='date'&&fact.datePrecision&&fact.datePrecision!=='year')claim.revealsGoalIds=[];
        if(fmt==='sort')claim.when='incorrect';
      }
      feedbackClaims.push(addClaim(claim));
    }else feedbackClaims.push(addClaim(claimForName(b,item.entityId)));
  }
  if(fmt==='multi_choice')feedbackClaims.push({key:`set:${first.entityId}:${task.recipe.answerKey}`,revision:goals[0].revision,revealsGoalIds:[goals[0].id]});
  // The detail panel renders the source object's name before submission.
  const hintClaims=[addClaim({...claimForName(b,first.entityId),key:`details:${first.entityId}`})];
  hintClaims.push({key:'source',revision:version(Object.values(revisions).sort()),revealsGoalIds:goals.map(g=>g.id)});
  if(fmt==='recall_reveal')hintClaims.push({key:'early-answer',revision:goals[0].revision,revealsGoalIds:[goals[0].id]});
  const visibleEntities=[...new Set([...task.items.map(i=>i.entityId),...task.options.filter(o=>b.entities.some(e=>e.id===o.id)).map(o=>o.id)])];
  for(const id of visibleEntities)revisions[`entity:${id}`]=entityRevision(b,id);
  const contract:TaskContract={id:task.id,primaryGoals:goals,supportGoalIds:[],actionFamily,visibleEntities,
    shownClaims:[...new Map(shownClaims.map(c=>[c.key,c])).values()],hintClaims,feedbackClaims,
    contentRevisions:revisions,response,practice,...(task.intent?{intent:task.intent,repairEpisodeIds:task.repairEpisodeIds}:{})};
  validateContract(contract);return contract;
}
/** Re-read dependencies from the current graph; absent or invalidated data is a new revision. */
export function taskContentRevisions(b:Bundle, task:Task, original:TaskContract):Record<string,string>{
  try{return compileTaskContract(b,task).contentRevisions;}catch{return Object.fromEntries(Object.keys(original.contentRevisions).map(k=>[k,'unavailable']));}
}
export function contractAnswer(task:Task,answer:unknown):unknown{
  if(task.recipe.format==='timeline')return (answer as Record<string,unknown>)?.[task.items[0].entityId];
  return answer;
}

export function compileIntroContract(b:Bundle,intro:{entityId:string;unitIds:string[];newProperty:boolean},sessionId:string):TaskContract{
  const shownClaims:Claim[]=[claimForName(b,intro.entityId)];
  const rows=b.facts.filter(f=>f.entityId===intro.entityId&&trusted(f));
  const visible=rows.filter(f=>!intro.newProperty||intro.unitIds.some(id=>id.startsWith(`ku:fact:${f.id}:`)));
  for(const f of visible){
    const claim=claimForFact(b,f);
    // Intro currently collapses even precise same-year dates to a year label.
    if(f.valueKind==='date'&&f.datePrecision!=='year')claim.revealsGoalIds=[];
    shownClaims.push(claim);
  }
  for(const propertyId of new Set(visible.map(f=>f.key))){
    const all=rows.filter(f=>f.key===propertyId);
    if(all.length&&all.every(f=>visible.includes(f)&&f.completeSet&&f.valueKind==='entity'&&f.learnable!==false)){
      const g=completeSetGoal(b,intro.entityId,propertyId);
      shownClaims.push({key:`set:${intro.entityId}:${propertyId}`,revision:g.revision,revealsGoalIds:[g.id]});
    }
  }
  const contentRevisions=Object.fromEntries(shownClaims.map(c=>[c.key,c.revision]));
  return {id:`intro:${sessionId}:${intro.entityId}:${JSON.stringify([...intro.unitIds].sort())}`,primaryGoals:[],supportGoalIds:[],
    actionFamily:'select',visibleEntities:[intro.entityId],shownClaims,hintClaims:[],feedbackClaims:[],contentRevisions,
    response:{kind:'practice-choice',options:['next','leave'],expected:'next'},practice:true};
}
