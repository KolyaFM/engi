import {indexes} from '../indexes';
import {normalize} from '../engine';
import type {Bundle,Item} from '../types';

const contexts=new WeakMap<Bundle,ReturnType<typeof peerContext>>();
function peerContext(b:Bundle){
 const ix=indexes(b),decks=new Map<string,Set<string>>(),tags=new Map<string,Set<string>>(),frequency=new Map<string,number>(),typeCounts=new Map<string,number>();
 for(const member of b.deckMembers??[]){if(member.archived||!b.decks?.some(d=>d.id===member.deckId&&!d.archived))continue;const ids=decks.get(member.entityId)??new Set<string>();ids.add(member.deckId);decks.set(member.entityId,ids);}
 for(const e of ix.entityById.values()){
  typeCounts.set(e.type,(typeCounts.get(e.type)??0)+1);
  const leaves=new Set(ix.tagsByEntity.get(e.id)??[]);tags.set(e.id,leaves);
  for(const id of leaves){const key=JSON.stringify([e.type,id]);frequency.set(key,(frequency.get(key)??0)+1);}
 }
 return {ix,decks,tags,frequency,typeCounts,tagNames:new Map(b.tags.map(t=>[t.id,normalize(t.name)]))};
}

/** Answer entities define the cohort in reverse/identity questions; scalar answers use their subjects. */
export function answerPeers(b:Bundle,target:Item,pool:Item[]){
 let c=contexts.get(b);if(!c){c=peerContext(b);contexts.set(b,c);}
 const {ix,decks,tags,frequency,typeCounts,tagNames}=c;
 const owner=(i:Item)=>ix.entityById.get(i.answerEntityId??i.answerId)??ix.entityById.get(i.entityId);
 const anchor=owner(target);if(!anchor)return pool.map(item=>({item,affinity:0}));
 const labels=[target,...pool].flatMap(i=>[i.answer,...i.aliases]).map(normalize).filter(s=>s.length>=3);
 const answerTags=new Set([...tagNames].filter(([,name])=>labels.some(label=>name.includes(label))).map(([id])=>id));
 const tagCache=new Map<string,Set<string>>();
 const meaningful=(id:string)=>{let result=tagCache.get(id);if(!result){result=new Set([...(tags.get(id)??[])].filter(tag=>(frequency.get(JSON.stringify([anchor.type,tag]))??0)<(typeCounts.get(anchor.type)??0)&&!answerTags.has(tag)));tagCache.set(id,result);}return result;};
 const anchorTags=meaningful(anchor.id),anchorDecks=decks.get(anchor.id)??new Set<string>();
 const hasContext=anchorTags.size>0||anchorDecks.size>0||!!anchor.originPackId;
 return pool.flatMap(item=>{
  const e=owner(item);if(!e||e.type!==anchor.type)return [];
  const candidateTags=meaningful(e.id),common=[...anchorTags].filter(id=>candidateTags.has(id));
  const sameDeck=[...anchorDecks].some(id=>decks.get(e.id)?.has(id)),samePack=!!anchor.originPackId&&anchor.originPackId===e.originPackId;
  // A mixed pack is not permission to combine explicitly different subject groups.
  if(anchorTags.size&&candidateTags.size&&!common.length)return [];
  if(hasContext&&!common.length&&!sameDeck&&!samePack)return [];
  const affinity=common.reduce((n,id)=>n+1+Math.log((typeCounts.get(anchor.type)!+1)/((frequency.get(JSON.stringify([anchor.type,id]))??0)+1)),0)+Number(sameDeck)*.2+Number(samePack)*.1;
  return [{item,affinity}];
 });
}
