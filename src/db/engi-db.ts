import Dexie,{type Table} from 'dexie';
import type {Bundle,Memory,Task,PropertyDefinition,EntityTypeDefinition} from '../lib/engi/types';
import {storesV1,storesV2} from './migrations';
import {BUILTIN_PROPERTIES,BUILTIN_TYPES} from '../lib/engi/knowledge/properties';
export type ReviewEventRow={id:string;timestamp:string;recipe:string;level:string;payload:any;targetIds:string[]};
export type LearningRow={id:string;payload:Memory;dueAt:string;stability:number;covered:number};
export type PackRow={packId:string;packVersion:number;name:string;createdAt:string;files:{path:string;bytes:number;sha256:string;mime:string}[];entityIds:string[];factIds:string[];mediaIds:string[];tagIds:string[];entityTags:Bundle['entityTags'];installedAt:string};
export type LocalTask=Task&{sequence?:({name:string;entityId:string}|null)[];retryOf?:string};
export type SessionRow={id:string;tasks:LocalTask[];currentPosition:number;results:number[];mode:string;createdAt:string;updatedAt:string;status:'active'|'completed';timeLeft:number;remainingMs?:number;feed?:boolean;tag?:string;format?:string;completedCount?:number;cooldown?:Task[];repairQueue?:Task[]};
export class EngiDB extends Dexie {
 entities!:Table<Bundle['entities'][number],string>;facts!:Table<Bundle['facts'][number],string>;tags!:Table<Bundle['tags'][number],string>;entityTags!:Table<Bundle['entityTags'][number],[string,string]>;media!:Table<Bundle['media'][number]&{hash?:string},string>;
 learningState!:Table<LearningRow,string>;reviewEvents!:Table<ReviewEventRow,string>;installedPacks!:Table<PackRow,string>;activeSessions!:Table<SessionRow,string>;appMeta!:Table<{key:string;value:any},string>;
 propertyDefinitions!:Table<PropertyDefinition,string>;entityTypes!:Table<EntityTypeDefinition,string>;
 constructor(name='engi'){super(name);this.version(1).stores(storesV1);this.version(2).stores(storesV2).upgrade(async tx=>{await tx.table('propertyDefinitions').bulkPut(BUILTIN_PROPERTIES);await tx.table('entityTypes').bulkPut(BUILTIN_TYPES);const packs=await tx.table('installedPacks').toArray();for(const [table,key] of [['entities','entityIds'],['facts','factIds'],['media','mediaIds'],['tags','tagIds']] as const){await tx.table(table).toCollection().modify(row=>{const p=packs.find(p=>p[key]?.includes(row.id));if(p){row.origin='pack';row.originPackId=p.packId;row.originPackVersion=p.packVersion;row.userModified=true}})};await tx.table('entityTags').toCollection().modify({userModified:true,origin:'user'});await tx.table('activeSessions').toCollection().modify({status:'completed'})})}
}
export const db=new EngiDB();
