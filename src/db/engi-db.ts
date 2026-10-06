import Dexie,{type Table} from 'dexie';
import type {Bundle,Memory,Task} from '../lib/engi/types';
import {storesV1,APP_DB_VERSION} from './migrations';
export type ReviewEventRow={id:string;timestamp:string;recipe:string;level:string;payload:any;targetIds:string[]};
export type LearningRow={id:string;payload:Memory;dueAt:string;stability:number;covered:number};
export type PackRow={packId:string;packVersion:number;name:string;createdAt:string;files:{path:string;bytes:number;sha256:string;mime:string}[];entityIds:string[];factIds:string[];mediaIds:string[];tagIds:string[];entityTags:Bundle['entityTags'];installedAt:string};
export type LocalTask=Task&{sequence?:({name:string;entityId:string}|null)[];retryOf?:string};
export type SessionRow={id:string;tasks:LocalTask[];currentPosition:number;results:number[];mode:string;createdAt:string;updatedAt:string;status:'active'|'completed';timeLeft:number;remainingMs?:number};
export class EngiDB extends Dexie {
 entities!:Table<Bundle['entities'][number],string>;facts!:Table<Bundle['facts'][number],string>;tags!:Table<Bundle['tags'][number],string>;entityTags!:Table<Bundle['entityTags'][number],[string,string]>;media!:Table<Bundle['media'][number]&{hash?:string},string>;
 learningState!:Table<LearningRow,string>;reviewEvents!:Table<ReviewEventRow,string>;installedPacks!:Table<PackRow,string>;activeSessions!:Table<SessionRow,string>;appMeta!:Table<{key:string;value:any},string>;
 constructor(name='engi'){super(name);this.version(APP_DB_VERSION).stores(storesV1)}
}
export const db=new EngiDB();
