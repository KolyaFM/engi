import type {Bundle} from '../lib/engi/types';
import {canonicalTargets} from '../lib/engi/questions/recipe-factory';
import {properties} from '../lib/engi/knowledge/properties';
import type {DeckPropertySettings} from './deck-property-settings';
export type DeckStudyOption={id:string;subjectType:string;typeLabel:string;entityCount:number;propertyId:string;label:string;kind:'property'|'imageRecognition';targetIds:readonly string[];defaultEnabled:boolean};
export type DeckStudyCatalog={optionsFor:(deckId:string)=>readonly DeckStudyOption[];targetsFor:(deckIds:readonly string[],settings?:DeckPropertySettings)=>Set<string>};
export const IMAGE_RECOGNITION='__imageRecognition__';
const snapshots=new WeakMap<Bundle,DeckStudyCatalog>();
const recent:{key:string;catalog:DeckStudyCatalog}[]=[];
/** Only canonical, permissible targets enter this index; opening the sheet never builds questions. */
export function createDeckStudyCatalog(bundle:Bundle):DeckStudyCatalog{
 const existing=snapshots.get(bundle);if(existing)return existing;
 const {studyScope:_,...content}=bundle,key=JSON.stringify(content),cached=recent.find(x=>x.key===key);
 if(cached){snapshots.set(bundle,cached.catalog);return cached.catalog;}
 const facts=new Map(bundle.facts.map(f=>[f.id,f])),defs=new Map(properties(bundle).map(p=>[p.id,p]));
 const byEntity=new Map<string,Map<string,Set<string>>>(),factByTarget=new Map<string,string>();
 for(const item of canonicalTargets(content)){const fact=item.factId?facts.get(item.factId):undefined,owner=fact?.entityId??item.entityId,property=fact?.key??IMAGE_RECOGNITION;
  if(fact)factByTarget.set(item.targetId,fact.id);let groups=byEntity.get(owner);if(!groups)byEntity.set(owner,groups=new Map());let ids=groups.get(property);if(!ids)groups.set(property,ids=new Set());ids.add(item.targetId);
 }
 const members=new Map<string,string[]>();for(const m of bundle.deckMembers??[])if(!m.archived){const ids=members.get(m.deckId)??[];ids.push(m.entityId);members.set(m.deckId,ids);}
 const entities=new Map(bundle.entities.filter(e=>!e.archived&&!e.mergedInto).map(e=>[e.id,e])),types=new Map(bundle.entityTypes?.map(t=>[t.id,t.name])),byDeck=new Map<string,readonly DeckStudyOption[]>();
 for(const deck of bundle.decks??[]){if(deck.archived)continue;const groups=new Map<string,{subjectType:string;propertyId:string;ids:Set<string>}>(),counts=new Map<string,Set<string>>(),excluded=new Set(deck.learning.excludedFactIds??[]);
  for(const entityId of members.get(deck.id)??[]){const entity=entities.get(entityId);if(!entity)continue;const count=counts.get(entity.type)??new Set();count.add(entityId);counts.set(entity.type,count);for(const [propertyId,ids] of byEntity.get(entityId)??[]){const id=JSON.stringify([entity.type,propertyId]);let group=groups.get(id);if(!group)groups.set(id,group={subjectType:entity.type,propertyId,ids:new Set()});for(const target of ids)if(!excluded.has(factByTarget.get(target)??''))group.ids.add(target);}}
  const options=[...groups].filter(([,g])=>g.ids.size).map(([id,{subjectType,propertyId,ids}]):DeckStudyOption=>({id,subjectType,typeLabel:types.get(subjectType)??subjectType,entityCount:counts.get(subjectType)!.size,propertyId,label:propertyId===IMAGE_RECOGNITION?'Узнавание по изображению':defs.get(propertyId)?.name??propertyId,kind:propertyId===IMAGE_RECOGNITION?'imageRecognition':'property',targetIds:Object.freeze([...ids]),defaultEnabled:propertyId===IMAGE_RECOGNITION?deck.learning.imageRecognition:!deck.learning.propertyIds||deck.learning.propertyIds.includes(propertyId)})).sort((a,b)=>a.typeLabel.localeCompare(b.typeLabel,'ru')||a.subjectType.localeCompare(b.subjectType)|| (a.kind!==b.kind?(a.kind==='imageRecognition'?-1:1):a.label.localeCompare(b.label,'ru')||a.propertyId.localeCompare(b.propertyId)));
  byDeck.set(deck.id,Object.freeze(options.map(o=>Object.freeze(o))));
 }
 const catalog:DeckStudyCatalog={optionsFor:id=>byDeck.get(id)??[],targetsFor(ids,settings){const targets=new Set<string>();for(const id of new Set(ids))for(const option of byDeck.get(id)??[])if(!settings?option.defaultEnabled:optionEnabled(option,id,settings))for(const target of option.targetIds)targets.add(target);return targets;}};
 snapshots.set(bundle,catalog);recent.push({key,catalog});if(recent.length>4)recent.shift();return catalog;
}
export function optionEnabled(option:DeckStudyOption,deckId:string,settings:DeckPropertySettings){const personal=Object.hasOwn(settings.byDeck,deckId)?settings.byDeck[deckId]:undefined;if(personal?.optionOverrides&&Object.hasOwn(personal.optionOverrides,option.id))return personal.optionOverrides[option.id];return personal?(option.kind==='imageRecognition'?personal.imageRecognition:!personal.disabledPropertyIds.includes(option.propertyId)):option.defaultEnabled;}
