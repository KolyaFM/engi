import {reconcileKnowledgeUnits} from './learning-migration';
import type {EngiDB} from './engi-db';
import type {Bundle,Memory,Snapshot} from '../lib/engi/types';
import {BUILTIN_PROPERTIES,BUILTIN_TYPES} from '../lib/engi/knowledge/properties';
export const emptyBundle=():Bundle=>({entities:[],facts:[],tags:[],entityTags:[],media:[],properties:[],entityTypes:[],missing:[],unresolved:[]});
export const contentTables=(d:EngiDB)=>[d.entities,d.facts,d.tags,d.entityTags,d.media,d.installedPacks,d.propertyDefinitions,d.entityTypes];
export async function getBundle(d:EngiDB):Promise<Bundle>{const [entities,facts,tags,entityTags,media,properties,entityTypes]=await Promise.all([d.entities.toArray(),d.facts.toArray(),d.tags.toArray(),d.entityTags.toArray(),d.media.toArray(),d.propertyDefinitions.toArray(),d.entityTypes.toArray()]);return {entities,facts,tags,entityTags,media,properties:[...new Map([...BUILTIN_PROPERTIES,...properties].map(p=>[p.id,p])).values()],entityTypes:[...new Map([...BUILTIN_TYPES,...entityTypes].map(p=>[p.id,p])).values()],missing:[],unresolved:[]}}
export async function getSnapshot(d:EngiDB):Promise<Snapshot>{await reconcileKnowledgeUnits(d);const [bundle,rows,events,daily,newLearning]=await Promise.all([getBundle(d),d.learningState.toArray(),d.reviewEvents.orderBy('timestamp').reverse().limit(1000).toArray(),d.appMeta.get('dailyLearning'),d.appMeta.get('newLearning')]);return {bundle,memories:rows.filter(r=>!r.payload.legacyOf).map(r=>r.payload),events,dailyLearning:daily?.value,newLearning:newLearning?.value}}
export async function putBundle(d:EngiDB,b:Bundle){await d.propertyDefinitions.bulkPut(b.properties??[]);await d.entityTypes.bulkPut(b.entityTypes??[]);await d.entities.bulkPut(b.entities);await d.facts.bulkPut(b.facts);await d.tags.bulkPut(b.tags);await d.entityTags.bulkPut(b.entityTags);await d.media.bulkPut(b.media.map(m=>({...m,hash:m.url.startsWith('engi-media://')?m.url.slice(13):undefined})))}
export function learningRow(m:Memory){return {id:m.id,payload:m,dueAt:new Date(m.card.due).toISOString(),stability:m.card.stability,covered:Number(!!m.firstSuccessAt)}}
export async function historyPage(d:EngiDB,offset=0,limit=50){return d.reviewEvents.orderBy('timestamp').reverse().offset(offset).limit(Math.min(limit,1000)).toArray()}

