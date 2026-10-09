import type {Bundle,Item,Recipe,Task} from '../lib/engi/types';
import type {EngiDB} from '../db/engi-db';
import {buildIndexes} from '../lib/engi/indexes';
import {normalize} from '../lib/engi/engine';
export type GroupContext=ReturnType<typeof groupContext>;
/** Presentation affinity only. Eligibility and scheduling remain the caller's responsibility. */
export function groupContext(b:Bundle,history:Task[]=[],packs:{packId:string;entityIds:string[]}[]=[]){
 const ix=buildIndexes(b),parents=new Map(b.tags.filter(t=>!t.archived).map(t=>[t.id,t.parentId])),packIds=new Map<string,Set<string>>(),frequency=new Map<string,number>();
 for(const e of b.entities)if(e.originPackId)packIds.set(e.id,new Set([e.originPackId]));
 for(const p of packs)for(const id of p.entityIds){const ids=packIds.get(id)??new Set<string>();ids.add(p.packId);packIds.set(id,ids);}
 for(const tags of ix.tagsByEntity.values())for(const id of tags)frequency.set(id,(frequency.get(id)??0)+1);
 const ancestor=(parent:string,child:string)=>{const seen=new Set<string>();let id=parents.get(child);while(id&&!seen.has(id)){if(id===parent)return true;seen.add(id);id=parents.get(id);}return false;};
 const leaves=(tags:Set<string>)=>[...tags].filter(id=>![...tags].some(child=>ancestor(id,child)));
 const weight=(id:string)=>1+Math.log((ix.entityById.size+1)/((frequency.get(id)??0)+1));
 const tagNames=new Map(b.tags.map(t=>[t.id,normalize(t.name)])),cache=new WeakMap<Item[],{tags:Map<string,Set<string>>;pairs:Map<string,number>;labels:string[]}>();
 const cached=(answers:Item[])=>{let value=cache.get(answers);if(!value){value={tags:new Map(),pairs:new Map(),labels:answers.flatMap(i=>[i.answer,...i.aliases]).map(normalize).filter(s=>s.length>=3)};cache.set(answers,value);}return value;};
 const tagsFor=(item:Item,answers:Item[])=>{const entry=cached(answers);let tags=entry.tags.get(item.entityId);if(!tags){tags=new Set([...(ix.tagsByEntity.get(item.entityId)??[])].filter(id=>!entry.labels.some(answer=>(tagNames.get(id)??'').includes(answer))));entry.tags.set(item.entityId,tags);}return tags;};
 const signature=(item:Item,recipe:Recipe)=>{
  const e=ix.entityById.get(item.entityId);if(!e)return undefined;
  const fact=item.factId?b.facts.find(f=>f.id===item.factId):undefined,media=ix.mediaByEntity.get(item.entityId)?.find(m=>m.id===item.mediaId||!item.mediaId&&m.url===item.image);
  const image=recipe.cue==='image'&&item.image?(fact?.valueKind==='image'?'property:'+fact.key:media?.role??'image'):'text';
  const answer=ix.entityById.get(item.answerEntityId??item.answerId);
  return JSON.stringify([e.type,image,answer?.type??'scalar']);
 };
 const similarity=(a:Item,c:Item,answers:Item[])=>{
  const entry=cached(answers),key=JSON.stringify([a.entityId,c.entityId].sort()),previous=entry.pairs.get(key);if(previous!==undefined)return previous;
  const ta=tagsFor(a,answers),tc=tagsFor(c,answers),common=leaves(new Set([...ta].filter(id=>tc.has(id))));
  const denominator=leaves(ta).reduce((n,id)=>n+weight(id),0)+leaves(tc).reduce((n,id)=>n+weight(id),0);
  const tags=denominator?Math.min(1,2*common.reduce((n,id)=>n+weight(id),0)/denominator):0;
  const samePack=[...packIds.get(a.entityId)??[]].some(id=>packIds.get(c.entityId)?.has(id));
  const repeated=history.slice(-8).filter(t=>t.items.some(i=>i.entityId===a.entityId)&&t.items.some(i=>i.entityId===c.entityId)).length;
  const score=tags+Number(samePack)*.15-repeated*.2;entry.pairs.set(key,score);return score;
 };
 const rank=(item:Item,selected:Item[],answers:Item[])=>{const values=selected.map(i=>similarity(item,i,answers));return Math.min(...values)+values.reduce((n,v)=>n+v,0)/values.length;};
 return {signature,rank,similarity};
}
export async function readGroupContext(db:EngiDB,b:Bundle,history:Task[]=[]){return groupContext(b,history,await db.installedPacks.toArray());}
