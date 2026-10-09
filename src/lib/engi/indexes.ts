import type {Bundle,Entity,Fact,Media} from './types';
import {properties} from './knowledge/properties';
const contexts=new WeakMap<Bundle,ReturnType<typeof buildIndexes>>();
export function buildIndexes(b:Bundle){
 const entityById=new Map(b.entities.filter(e=>!e.archived).map(e=>[e.id,e]));const factsByEntity=new Map<string,Fact[]>(),factsByProperty=new Map<string,Fact[]>(),incomingFactsByTarget=new Map<string,Fact[]>();const factsByEntityAndKey=new Map<string,Map<string,Fact[]>>();const mediaByEntity=new Map<string,Media[]>();const tagsByEntity=new Map<string,Set<string>>();const entitiesByTag=new Map<string,Entity[]>(),entitiesByType=new Map<string,Entity[]>();
 const append=<T>(map:Map<string,T[]>,key:string,value:T)=>map.set(key,[...map.get(key)??[],value]);
 for(const e of entityById.values())append(entitiesByType,e.type,e);
 for(const f of b.facts.filter(f=>!f.archived)){append(factsByEntity,f.entityId,f);append(factsByProperty,f.key,f);if(f.valueEntityId)append(incomingFactsByTarget,f.valueEntityId,f);const keys=factsByEntityAndKey.get(f.entityId)??new Map<string,Fact[]>();append(keys,f.key,f);factsByEntityAndKey.set(f.entityId,keys)}
 for(const m of b.media.filter(m=>!m.archived)){append(mediaByEntity,m.entityId,m)}for(const list of mediaByEntity.values())list.sort((a,c)=>Number(!!c.primary)-Number(!!a.primary));
 const tagById=new Map(b.tags.filter(t=>!t.archived).map(t=>[t.id,t]));for(const t of b.entityTags.filter(t=>!t.archived)){const tags=tagsByEntity.get(t.entityId)??new Set<string>();let id:string|undefined=t.tagId;const seen=new Set<string>();while(id&&!seen.has(id)){seen.add(id);tags.add(id);id=tagById.get(id)?.parentId}tagsByEntity.set(t.entityId,tags)}
 for(const [id,tags] of tagsByEntity){const e=entityById.get(id);if(e)for(const tag of tags)append(entitiesByTag,tag,e)}
 const entitiesByDeck=new Map<string,Entity[]>();for(const member of b.deckMembers??[]){const e=entityById.get(member.entityId);if(e&&!member.archived&&b.decks?.some(d=>d.id===member.deckId&&!d.archived))append(entitiesByDeck,member.deckId,e)}
 const entitiesByScope=new Map([...entitiesByTag,...entitiesByDeck]);if(b.decks){const memberIds=new Set([...entitiesByDeck.values()].flat().map(e=>e.id));entitiesByScope.set('__untagged__',[...entityById.values()].filter(e=>!memberIds.has(e.id)))}
 if(b.studyScope)entitiesByScope.set(b.studyScope.id,b.studyScope.entityIds.flatMap(id=>{const e=entityById.get(id);return e?[e]:[]}));
 if(b.studyScope)entitiesByScope.set(b.studyScope.id,b.studyScope.entityIds.flatMap(id=>{const e=entityById.get(id);return e?[e]:[]}));
 const searchByEntity=new Map<string,string>();for(const e of entityById.values())searchByEntity.set(e.id,[e.name,...e.aliases,e.type,...[...tagsByEntity.get(e.id)??[]].map(id=>tagById.get(id)?.name??''),...(factsByEntity.get(e.id)??[]).map(f=>entityById.get(f.valueEntityId??'')?.name??f.valueText??f.valueNumber??'')].join(' ').toLowerCase().replace(/ё/g,'е'));
 return {entityById,factsByEntity,factsByEntityAndKey,factsByProperty,incomingFactsByTarget,mediaByEntity,tagsByEntity,entitiesByTag,entitiesByDeck,entitiesByScope,entitiesByType,propertyById:new Map(properties(b).map(p=>[p.id,p])),searchByEntity};
}
export function indexes(b:Bundle){let context=contexts.get(b);if(!context){context=buildIndexes(b);contexts.set(b,context)}return context}
