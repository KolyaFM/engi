import type {Bundle,Memory} from '../lib/engi/types';
import type {EngiDB} from '../db/engi-db';
import {canonicalTargets} from '../lib/engi/questions/recipe-factory';
import {triagedMemory} from '../lib/engi/learning/bootstrap';
import {goalCandidates} from './goal-candidates';
import type {GoalCatalogEntry} from '../lib/engi/knowledge/goal-progress';
import {feedSpan} from './feed-performance';
// One bounded entry. Value-based identity also detects in-place edits and other DB instances.
// Goal FSRS lives in appMeta; legacy rows here configure generation, not scheduling.
let cached:{key:string;entries:GoalCatalogEntry[]}|undefined;
// Bump the version whenever goal derivation changes, even if the pack format does not.
const PERSISTED_CATALOG_KEY='studyCore:goalCatalogCache',PERSISTED_CATALOG_VERSION=1;
// The goal catalog is global. A temporary selected-deck scope changes question
// selection, not which knowledge goals exist in the package.
function catalogBundle(b:Bundle):Bundle{return b.studyScope?{...b,studyScope:undefined}:b;}
function structuralKey(b:Bundle,memories:Memory[]){return JSON.stringify([catalogBundle(b),memories.filter(m=>m.legacyOf).map(m=>[m.id,m.legacyOf]).sort()]);}
function withSuspensions(entries:GoalCatalogEntry[],memories:Memory[]){const suspended=new Set(memories.filter(m=>m.status==='suspended').map(m=>m.id));return structuredClone(entries).map(e=>({...e,suspended:e.targetIds.some(id=>suspended.has(id))}));}
export function buildGoalCatalog(b:Bundle,memories:Memory[]){
 const end=feedSpan('catalog');
 try{
 const key=structuralKey(b,memories);
 if(cached?.key!==key){const entries=buildGoalCatalogUncached(b,memories);cached={key,entries:entries.map(e=>({...e,suspended:false}))};}
 return withSuspensions(cached.entries,memories);
 }finally{end();}
}
/** Warm starts can reuse the structural catalog; live suspension is still applied per read. */
export async function loadGoalCatalog(db:EngiDB,b:Bundle,memories:Memory[]){
 const key=structuralKey(b,memories);
 if(cached?.key===key)return withSuspensions(cached.entries,memories);
 const input=new TextEncoder().encode(`${PERSISTED_CATALOG_VERSION}:${key}`),hash=await crypto.subtle.digest('SHA-256',input);
 const fingerprint=Array.from(new Uint8Array(hash),n=>n.toString(16).padStart(2,'0')).join('');
 const stored=(await db.appMeta.get(PERSISTED_CATALOG_KEY))?.value;
 if(stored?.fingerprint===fingerprint&&Array.isArray(stored.entries)&&stored.entries.every((e:GoalCatalogEntry)=>e?.goal?.id&&Array.isArray(e.targetIds))){
  cached={key,entries:stored.entries};return withSuspensions(cached.entries,memories);
 }
 const entries=buildGoalCatalog(b,memories);
 try{await db.appMeta.put({key:PERSISTED_CATALOG_KEY,value:{fingerprint,entries:cached!.entries}})}catch{/* A cache write must never block learning. */}
 return entries;
}
export function buildGoalCatalogUncached(b:Bundle,memories:Memory[]){
 b=catalogBundle(b);
 const configured=new Map(memories.map(m=>[m.id,m]));
 const configuration=canonicalTargets(b).map(i=>({...configured.get(i.targetId)??triagedMemory(i,'red','',0),status:'review' as const}));
 const catalog=new Map<string,GoalCatalogEntry>();
 for(const task of goalCandidates(b,configuration))for(const goal of task.studyContract!.primaryGoals){
  const targetIds=task.items.map(i=>i.targetId),entityIds=[...new Set(task.items.map(i=>i.factId?b.facts.find(f=>f.id===i.factId)!.entityId:i.entityId))];
  catalog.set(goal.id,{goal,targetIds,entityIds,propertyId:task.recipe.answerKey,suspended:targetIds.some(id=>configured.get(id)?.status==='suspended')});
 }
 return [...catalog.values()];
}
