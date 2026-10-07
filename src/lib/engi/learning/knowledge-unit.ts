import type {Bundle,Memory,Item} from '../types';
export type KnowledgeUnit={id:string;entityId:string;propertyId:string;factId?:string;direction:'forward'|'reverse';skill:'association'|'visual';item:Item};
export type TargetMapping={legacyId:string;unitId:string};
export function knowledgeUnitId(b:Bundle,entityId:string,factId:string|undefined,direction='forward',cue='name',property='identity'){
 if(!factId)return `ku:entity:${entityId}:visual_identity`;
 return `ku:fact:${factId}:${direction}`;
}
export function legacyUnitId(id:string,b:Bundle):string|undefined{
 if(id.startsWith('ku:')){if(id.endsWith(':visual'))return id.slice(0,-7);return id;}
 const identity=/^entity:(.+):image_to_name$/.exec(id);if(identity)return `ku:entity:${identity[1]}:visual_identity`;
 const f=b.facts.find(f=>id.startsWith(`fact:${f.id}:`));if(!f)return;
 const suffix=id.slice(`fact:${f.id}:`.length),direction=suffix.includes(':reverse')?'reverse':'forward',cue=suffix.includes('image')?'image':'name';
 return knowledgeUnitId(b,f.entityId,f.id,direction,cue,f.key);
}
/** Original rows remain archived and events are never rewritten. */
export function mergeLegacyStates(input:Memory[],b:Bundle){
 const states=input.map(m=>structuredClone(m)),groups=new Map<string,Memory[]>(),mappings:TargetMapping[]=[];
 for(const m of states){const id=m.legacyOf??legacyUnitId(m.id,b);if(id&&id!==m.id)mappings.push({legacyId:m.id,unitId:id});if(!id||id===m.id||m.legacyOf)continue;groups.set(id,[...groups.get(id)??[],m]);m.legacyOf=id}
 for(const [id,legacy] of groups){const existing=states.find(m=>m.id===id),rows=[...legacy,...existing?[existing]:[]],weak=[...rows].sort((a,c)=>a.card.stability-c.card.stability)[0],merged:Memory={...structuredClone(weak),id,legacyOf:undefined,status:'review',objectiveReviews:Math.max(...rows.map(m=>m.objectiveReviews??m.card.reps??0)),attempts:Math.max(...rows.map(m=>m.attempts)),correct:Math.min(...rows.map(m=>m.correct)),confusions:{},card:{...weak.card,due:new Date(Math.min(...rows.map(m=>new Date(m.card.due).getTime()))),stability:Math.min(...rows.map(m=>m.card.stability)),difficulty:Math.max(...rows.map(m=>m.card.difficulty))}};
  for(const m of rows)for(const [wrong,count] of Object.entries(m.confusions))merged.confusions[wrong]=(merged.confusions[wrong]??0)+count;
  const first=rows.map(m=>m.firstSuccessAt).filter((d):d is string=>!!d).sort();merged.firstSuccessAt=first[0];merged.lastReviewAt=rows.map(m=>m.lastReviewAt??m.card.last_review).filter(Boolean).map(d=>new Date(d).toISOString()).sort().at(-1);
  if(existing)states.splice(states.indexOf(existing),1,merged);else states.push(merged);
 }
 return {states,mappings};
}
