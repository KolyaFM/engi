type Resource={url:string;bytes:number;dispose:()=>void};
type Entry={promise:Promise<Resource>;refs:number;used:number;resource?:Resource;stale?:boolean};
/** Shares decode work and URL ownership between invisible warmup and visible media. */
export function createPreparedMediaPool(load:(source:string)=>Promise<Resource>,limits={entries:24,bytes:12*1024*1024}){
 const entries=new Map<string,Entry>();let clock=0;
 const dispose=(key:string,e:Entry)=>{if(entries.get(key)===e)entries.delete(key);e.stale=true;if(e.resource){e.resource.dispose();e.resource=undefined;}};
 const trim=()=>{const idle=[...entries].filter(([,e])=>!e.refs&&!!e.resource).sort((a,b)=>a[1].used-b[1].used);let bytes=idle.reduce((sum,[,e])=>sum+e.resource!.bytes,0),count=idle.length;for(const [key,e]of idle){if(count<=limits.entries&&bytes<=limits.bytes)break;count--;bytes-=e.resource!.bytes;dispose(key,e);}};
 return {
  async acquire(source:string){
   let e=entries.get(source);if(!e){e={refs:0,used:++clock,promise:undefined!};const created=e;created.promise=load(source).then(resource=>{created.resource=resource;return resource;}).catch(error=>{if(entries.get(source)===created)entries.delete(source);throw error;});entries.set(source,e);}
   e.refs++;e.used=++clock;const entry=e;
   let resource:Resource;try{resource=await entry.promise;}catch(error){entry.refs--;throw error;}
   let released=false;return {url:resource.url,release(){if(released)return;released=true;entry.refs--;entry.used=++clock;if(!entry.refs&&entry.stale)dispose(source,entry);trim();}};
  },
  clear(){for(const [key,e]of entries){e.stale=true;entries.delete(key);if(!e.refs)dispose(key,e);}},
  stats(){const idle=[...entries.values()].filter(e=>!e.refs&&!!e.resource);return {idle:idle.length,bytes:idle.reduce((sum,e)=>sum+e.resource!.bytes,0)};},
 };
}
