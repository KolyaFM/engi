import type {EngiDB} from './engi-db';
import type {Bundle,Memory,Snapshot} from '../lib/engi/types';
export const emptyBundle=():Bundle=>({entities:[],facts:[],tags:[],entityTags:[],media:[],missing:[],unresolved:[]});
export const contentTables=(d:EngiDB)=>[d.entities,d.facts,d.tags,d.entityTags,d.media,d.installedPacks];
export async function getBundle(d:EngiDB):Promise<Bundle>{const [entities,facts,tags,entityTags,media]=await Promise.all([d.entities.toArray(),d.facts.toArray(),d.tags.toArray(),d.entityTags.toArray(),d.media.toArray()]);return {entities,facts,tags,entityTags,media,missing:[],unresolved:[]}}
export async function getSnapshot(d:EngiDB):Promise<Snapshot>{const [bundle,rows,events]=await Promise.all([getBundle(d),d.learningState.toArray(),d.reviewEvents.orderBy('timestamp').reverse().limit(1000).toArray()]);return {bundle,memories:rows.map(r=>r.payload),events}}
export async function putBundle(d:EngiDB,b:Bundle){await d.entities.bulkPut(b.entities);await d.facts.bulkPut(b.facts);await d.tags.bulkPut(b.tags);await d.entityTags.bulkPut(b.entityTags);await d.media.bulkPut(b.media.map(m=>({...m,hash:m.url.startsWith('engi-media://')?m.url.slice(13):undefined})))}
export function learningRow(m:Memory){return {id:m.id,payload:m,dueAt:new Date(m.card.due).toISOString(),stability:m.card.stability,covered:Number(!!m.firstSuccessAt)}}
export async function historyPage(d:EngiDB,offset=0,limit=50){return d.reviewEvents.orderBy('timestamp').reverse().offset(offset).limit(Math.min(limit,1000)).toArray()}
