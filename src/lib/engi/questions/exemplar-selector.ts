import type {Bundle,Recipe,Memory} from '../types';
import {indexes} from '../indexes';
export function allowedMedia(b:Bundle,entityId:string,r:Recipe){
 if(b.properties?.some(p=>p.id===r.answerKey&&p.valueKind==='image')){const ids=new Set(b.facts.filter(f=>f.entityId===entityId&&f.key===r.answerKey&&!f.archived).map(f=>f.valueMediaId));return b.media.filter(m=>ids.has(m.id)&&!m.archived);}
 const propertyImageUrls=indexes(b).propertyImageUrls;
 const roles=r.mediaRoles??(b.entities.find(e=>e.id===entityId)?.type==='artwork'?['primary','artwork','painting','image']:['primary','portrait','photo','image']);
 return b.media.filter(m=>m.entityId===entityId&&!m.archived&&m.learningExemplar!==false&&roles.includes(m.role)&&!propertyImageUrls.has(m.url));
}
export function selectExemplar(b:Bundle,entityId:string,r:Recipe,m?:Memory){const pool=allowedMedia(b,entityId,r);return pool.find(x=>!m?.recentMediaIds?.slice(-3).includes(x.id))??pool.find(x=>x.id!==m?.recentMediaIds?.at(-1))??pool[0]}
