import type {EngiDB} from '../db/engi-db';
const queues=new Map<string,Promise<unknown>>();
/** Serializes the DB + media-cache operation across tabs and pack-import workers. */
export async function withContentWriteLock<T>(db:EngiDB,run:()=>Promise<T>):Promise<T>{
 if(typeof navigator!=='undefined'&&navigator.locks)return navigator.locks.request('engi-content:'+db.name,run);
 const previous=queues.get(db.name)??Promise.resolve(),next=previous.catch(()=>{}).then(run);queues.set(db.name,next);
 try{return await next;}finally{if(queues.get(db.name)===next)queues.delete(db.name);}
}
