import type {Bundle,Recipe,Memory} from '../types';
export function allowedMedia(b:Bundle,entityId:string,r:Recipe){
 const roles=r.mediaRoles??(b.entities.find(e=>e.id===entityId)?.type==='artwork'?['primary','artwork','painting','image']:['primary','portrait','photo','image']);
 return b.media.filter(m=>m.entityId===entityId&&!m.archived&&m.learningExemplar!==false&&roles.includes(m.role));
}
export function selectExemplar(b:Bundle,entityId:string,r:Recipe,m?:Memory){const pool=allowedMedia(b,entityId,r);return pool.find(x=>!m?.recentMediaIds?.slice(-3).includes(x.id))??pool.find(x=>x.id!==m?.recentMediaIds?.at(-1))??pool[0]}
