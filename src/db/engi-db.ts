import {mergeLegacyStates,type TargetMapping} from '../lib/engi/learning/knowledge-unit';
import Dexie,{type Table} from 'dexie';
import type {Bundle,Memory,Task,PropertyDefinition,EntityTypeDefinition,Deck,DeckMember} from '../lib/engi/types';
import {storesV1,storesV2,storesV3,storesV4} from './migrations';
import {BUILTIN_PROPERTIES,BUILTIN_TYPES} from '../lib/engi/knowledge/properties';
export type ReviewEventRow={id:string;timestamp:string;recipe:string;level:string;payload:any;targetIds:string[]};
export type LearningRow={id:string;payload:Memory;dueAt:string;stability:number;covered:number};
export type PackRow={deckIds?:string[];packId:string;packVersion:number;name:string;createdAt:string;files:{path:string;bytes:number;sha256:string;mime:string}[];entityIds:string[];factIds:string[];mediaIds:string[];tagIds:string[];entityTags:Bundle['entityTags'];installedAt:string};
export type LocalTask=Task&{sequence?:({name:string;entityId:string}|null)[];retryOf?:string};
export type InteractionDraft={taskId:string;attemptSequence:string[];recallElapsedMs?:number;revealed?:boolean;timelineValue?:number;sortOrder?:string[];mapping?:Record<string,string>;earlyReveal?:boolean;firstAttemptLatencyMs?:number};
export type SessionRow={memoryModel?:'goals';waitingUntil?:string;id:string;tasks:LocalTask[];currentPosition:number;results:number[];mode:string;createdAt:string;updatedAt:string;status:'active'|'completed';timeLeft:number;remainingMs?:number;feed?:boolean;tag?:string;format?:string;completedCount?:number;cooldown?:Task[];repairQueue?:Task[];interaction?:InteractionDraft;intro?:{entityId:string;unitIds:string[];selections:Record<string,import("../lib/engi/types").Familiarity>;newProperty:boolean};exhausted?:boolean;newGranted?:number;ordinaryCount?:number;diagnosticSeen?:string[]};
export class EngiDB extends Dexie {
 entities!:Table<Bundle['entities'][number],string>;facts!:Table<Bundle['facts'][number],string>;tags!:Table<Bundle['tags'][number],string>;entityTags!:Table<Bundle['entityTags'][number],[string,string]>;media!:Table<Bundle['media'][number]&{hash?:string},string>;
 learningState!:Table<LearningRow,string>;reviewEvents!:Table<ReviewEventRow,string>;installedPacks!:Table<PackRow,string>;activeSessions!:Table<SessionRow,string>;appMeta!:Table<{key:string;value:any},string>;
 decks!:Table<Deck,string>;deckMembers!:Table<DeckMember,[string,string]>;
 targetMappings!:Table<TargetMapping,string>;propertyDefinitions!:Table<PropertyDefinition,string>;entityTypes!:Table<EntityTypeDefinition,string>;
 constructor(name='engi'){super(name);this.version(1).stores(storesV1);this.version(2).stores(storesV2).upgrade(async tx=>{await tx.table('propertyDefinitions').bulkPut(BUILTIN_PROPERTIES);await tx.table('entityTypes').bulkPut(BUILTIN_TYPES);const packs=await tx.table('installedPacks').toArray();for(const [table,key] of [['entities','entityIds'],['facts','factIds'],['media','mediaIds'],['tags','tagIds']] as const){await tx.table(table).toCollection().modify(row=>{const p=packs.find(p=>p[key]?.includes(row.id));if(p){row.origin='pack';row.originPackId=p.packId;row.originPackVersion=p.packVersion;row.userModified=true}})};await tx.table('entityTags').toCollection().modify({userModified:true,origin:'user'});await tx.table('activeSessions').toCollection().modify({status:'completed'})});this.version(3).stores(storesV3).upgrade(async tx=>{const rows=await tx.table('learningState').toArray(),merged=mergeLegacyStates(rows.map(r=>r.payload),{entities:await tx.table('entities').toArray(),facts:await tx.table('facts').toArray(),media:[],tags:[],entityTags:[],missing:[],unresolved:[]});await tx.table('learningState').bulkPut(merged.states.map(m=>({id:m.id,payload:m,dueAt:new Date(m.card.due).toISOString(),stability:m.card.stability,covered:Number(!!m.firstSuccessAt)})));await tx.table('targetMappings').bulkPut(merged.mappings);await tx.table('activeSessions').toCollection().modify({status:'completed'})});this.version(4).stores(storesV4).upgrade(async tx=>{
 for(const p of BUILTIN_PROPERTIES){const old=await tx.table('propertyDefinitions').get(p.id);if(old&&!old.userModified&&old.builtIn)await tx.table('propertyDefinitions').put({...old,cardinality:p.cardinality,subjectTypes:p.subjectTypes});}
 const legacyEntities=await tx.table('entities').toArray(),legacyFacts=await tx.table('facts').toArray();
 for(const key of new Set(legacyFacts.map(f=>f.key))){if(await tx.table('propertyDefinitions').get(key))continue;const rows=legacyFacts.filter(f=>f.key===key),base=BUILTIN_PROPERTIES.find(p=>p.id===key);await tx.table('propertyDefinitions').put({...base,id:key,name:base?.name??key,valueKind:rows[0].valueKind,cardinality:base?.cardinality??'one',learnable:base?.learnable??true,subjectTypes:[...new Set(rows.map(f=>legacyEntities.find(e=>e.id===f.entityId)?.type).filter(Boolean))],targetTypes:rows[0].valueKind==='entity'?[...new Set(rows.map(f=>legacyEntities.find(e=>e.id===f.valueEntityId)?.type).filter(Boolean))]:undefined});}
 for(const e of legacyEntities)if(!await tx.table('entityTypes').get(e.type))await tx.table('entityTypes').put(BUILTIN_TYPES.find(t=>t.id===e.type)??{id:e.type,name:e.type});
 const tags=await tx.table('tags').toArray(),links=await tx.table('entityTags').toArray();
 for(const t of tags)await tx.table('decks').put({...t,id:'deck.legacy.'+t.id,parentId:t.parentId?'deck.legacy.'+t.parentId:undefined,learning:{imageRecognition:true}});
 for(const t of tags){const descendants=new Set([t.id]);let changed=true;while(changed){changed=false;for(const tag of tags)if(tag.parentId&&descendants.has(tag.parentId)&&!descendants.has(tag.id)){descendants.add(tag.id);changed=true}}
 for(const id of new Set(links.filter(l=>!l.archived&&descendants.has(l.tagId)).map(l=>l.entityId)))await tx.table('deckMembers').put({deckId:'deck.legacy.'+t.id,entityId:id});}
 await tx.table('activeSessions').toCollection().modify({status:'completed'});
 })}
}
export const db=new EngiDB();


