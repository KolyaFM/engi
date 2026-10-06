import {indexes} from '../indexes';
import {properties,trusted,factValue} from '../knowledge/properties';
import type {Bundle,Recipe,Item,Format,PropertyDefinition} from '../types';
const builtinKey=(p:PropertyDefinition,cue:string)=>p.builtIn?(p.valueKind==='date'?`${p.id}_to_year`:`${cue}_to_${p.id}`):`property:${p.id}:forward:${cue}`;
function recipe(tag:string|undefined,type:string,key:string,cue:Recipe['cue'],memoryKey:string,format:Format,label:string,direction:'forward'|'reverse'='forward'):Recipe{const diagnostic=['sort','timeline','missing'].includes(format);return {id:`${tag??'all'}:${type}:${key}:${direction}:${format}`,tag,subjectType:type,answerKey:key,cue,memoryKey,format,label,direction,diagnostic,evidence:{level:diagnostic?'diagnostic':'direct',fsrsEnabled:!diagnostic,gradeCap:'good',selfReport:format==='recall_reveal'},countsTowardMastery:!diagnostic,feed:{presentation:format==='sort'?'challenge':['match','categorize'].includes(format)?'rapid_sequence':'atomic',autoAdvanceOnCorrect:true,correctHoldMs:280,maxOptions:4}}}
export function eligible(b:Bundle,r:Recipe):Item[]{const ix=indexes(b);const members=r.tag?ix.entitiesByTag.get(r.tag)??[]:[...ix.entityById.values()];return members.filter(e=>!r.subjectType||e.type===r.subjectType).flatMap((e):Item[]=>{
 const media=ix.mediaByEntity.get(e.id)?.find(m=>m.learningExemplar!==false);const image=media?.url;if(r.cue==='image'&&!image)return [];
 if(r.answerKey==='identity')return [{entityId:e.id,name:e.name,image,targetId:`entity:${e.id}:image_to_name`,answer:e.name,aliases:e.aliases,answerId:e.id,answerEntityId:e.id,sourceUrl:media?.sourceUrl??'',summary:e.summary}];
 const def=ix.propertyById.get(r.answerKey);if(!def||!def.learnable||def.archived)return [];
 const all=ix.factsByEntityAndKey.get(e.id)?.get(r.answerKey)??[];const values=all.filter(trusted);if(!values.length||all.some(f=>!trusted(f)))return [];
 if(new Set(values.map(factValue)).size!==1)return [];const f=values[0];const obj=ix.entityById.get(f.valueEntityId??'');if(f.valueKind==='entity'&&!obj)return [];
 const year=f.valueKind==='date'?Number(f.dateStart?.slice(0,4)):f.valueKind==='number'?f.valueNumber:undefined;
 if(f.valueKind==='date'&&!['year','day','month'].includes(f.datePrecision??''))return [];
 if(r.direction==='reverse'){
  if(!obj)return [];const related=(ix.incomingFactsByTarget.get(obj.id)??[]).filter(x=>x.key===f.key&&trusted(x));if(new Set(related.map(x=>x.entityId)).size!==1)return [];
  return [{entityId:obj.id,name:obj.name,image:ix.mediaByEntity.get(obj.id)?.[0]?.url,targetId:`fact:${f.id}:${r.memoryKey}`,answer:e.name,aliases:e.aliases,answerId:e.id,answerEntityId:e.id,factId:f.id,sourceUrl:f.source.url??''}];
 }
 const answer=obj?.name??f.valueText??(f.valueKind==='boolean'?(f.valueBoolean?'Да':'Нет'):String(f.valueNumber??year??''));if(!answer)return [];
 return [{entityId:e.id,name:e.name,image,targetId:`fact:${f.id}:${r.memoryKey}`,answer,aliases:obj?.aliases??[],answerId:obj?.id??answer,answerEntityId:obj?.id,year,factId:f.id,sourceUrl:f.source.url??'',summary:e.summary}];
})}
export function recipes(b:Bundle):Recipe[]{const ix=indexes(b);const result:Recipe[]=[];const scopes:[string|undefined,typeof b.entities][]=[[undefined,[...ix.entityById.values()]],...b.tags.filter(t=>!t.archived).map(t=>[t.id,ix.entitiesByTag.get(t.id)??[]] as [string,typeof b.entities])];
 for(const [tag,members] of scopes)for(const type of new Set(members.map(e=>e.type))){const typed=members.filter(e=>e.type===type);const image=typed.some(e=>ix.mediaByEntity.has(e.id));
 if(image){const base=recipe(tag,type,'identity','image','image_to_name','choice','Кто или что на изображении?');const pool=eligible(b,base);if(pool.length){result.push({...base,format:'recall_reveal',id:base.id.replace(/choice$/,'recall_reveal'),evidence:{...base.evidence!,selfReport:true}});if(new Set(pool.map(i=>i.answerId)).size>=3){result.push(base);if(pool.length>=3)result.push({...base,id:base.id.replace(/choice$/,'match'),format:'match',feed:{...base.feed!,presentation:'rapid_sequence'}})}}}
 for(const p of properties(b).filter(p=>p.learnable&&(!p.subjectTypes?.length||p.subjectTypes.includes(type)))){
  const cues:Recipe['cue'][]=p.valueKind==='date'||p.valueKind==='number'||!image?['name']:['image','name'];
  for(const cue of cues)for(const direction of ['forward','reverse'] as const){if(direction==='reverse'&&cue!==cues[0])continue;if(direction==='forward'&&p.learning?.forward===false)continue;if(direction==='reverse'&&(!p.inverse?.enabled||p.learning?.reverse!==true||p.valueKind!=='entity'))continue;
   const base=recipe(tag,type,p.id,direction==='reverse'?'name':cue,direction==='reverse'?`property:${p.id}:reverse`:builtinKey(p,cue),'choice',direction==='reverse'?p.inverse?.name??`${p.name}: какой объект?`:p.name,direction);const pool=eligible(b,base);if(!pool.length)continue;const unique=new Set(pool.map(i=>i.answerId));const repeated=pool.length>unique.size;
   const enabled=(f:Format)=>{const field=f==='recall_reveal'?'recallReveal':f as keyof NonNullable<PropertyDefinition['learning']>;const value=p.learning?.[field];return value!=='off'&&(p.valueKind!=='text'||value==='on')};
   const formats:Format[]=[];if(enabled('recall_reveal'))formats.push('recall_reveal');if(unique.size>=3&&enabled('choice'))formats.push('choice');if(unique.size>=3&&pool.length>=3&&p.valueKind==='entity'&&enabled('match'))formats.push('match');if(unique.size>=2&&repeated&&p.valueKind==='entity'&&enabled('categorize'))formats.push('categorize');
   if(['date','number'].includes(p.valueKind)&&direction==='forward'&&new Set(pool.map(i=>i.year)).size>=3){if(enabled('sort'))formats.push('sort');if(p.valueKind==='date'&&enabled('timeline'))formats.push('timeline');if(p.valueKind==='date'&&enabled('missing'))formats.push('missing')}
   for(const f of formats){const next=recipe(tag,type,p.id,base.cue,base.memoryKey,f,base.label!,direction);if(cue!==cues[0])next.id=next.id.replace(`:${f}`,`:${cue}:${f}`);result.push(next)}
  }
 }
 }return result;
}
export function canonicalTargets(b:Bundle,tag='all'){const out=new Map<string,Item>();for(const r of recipes(b).filter(r=>r.countsTowardMastery&&(tag==='all'?r.tag===undefined:r.tag===tag)))for(const i of eligible(b,r))out.set(i.targetId,i);return [...out.values()]}
