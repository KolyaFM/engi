import {createPreparedMediaPool} from './prepared-media';
import {feedSpan} from '../services/feed-performance';
export const MEDIA_CACHE='engi-media-v1';
export const hashFromUrl=(url:string)=>/^engi-media:\/\/([a-f0-9]{64})$/.exec(url)?.[1];
export const mediaKey=(hash:string)=>new URL(`/__engi_media__/${hash}`,globalThis.location?.origin??'https://engi.invalid').href;
export const mediaStore={
 async has(hash:string){return !!(await (await caches.open(MEDIA_CACHE)).match(mediaKey(hash)))},
 async put(hash:string,blob:Blob){await (await caches.open(MEDIA_CACHE)).put(mediaKey(hash),new Response(blob,{headers:{'Content-Type':blob.type,'Content-Length':String(blob.size)}}))},
 async getBlob(hash:string){const response=await (await caches.open(MEDIA_CACHE)).match(mediaKey(hash));if(!response)throw Error('Локальное изображение отсутствует. Импортируйте пакет ещё раз.');return response.blob()},
 async createObjectUrl(hash:string){return URL.createObjectURL(await this.getBlob(hash))},
 async remove(hash:string){prepared.clear();await (await caches.open(MEDIA_CACHE)).delete(mediaKey(hash))},
 async clear(){prepared.clear();if(typeof caches!=='undefined')await caches.delete(MEDIA_CACHE)},
 acquire(source:string){return prepared.acquire(source)},
 async prewarm(urls:readonly string[],signal?:AbortSignal){let n=0;const sources=[...new Set(urls)].slice(0,12);await Promise.allSettled(Array.from({length:Math.min(2,sources.length)},async()=>{while(n<sources.length&&!signal?.aborted){const source=sources[n++];try{const r=await prepared.acquire(source);r.release();}catch{}}}))}
};
const prepared=createPreparedMediaPool(async source=>{
 const hash=hashFromUrl(source),blob=hash?await mediaStore.getBlob(hash):undefined,url=blob?URL.createObjectURL(blob):source;
 const dispose=()=>{if(blob)URL.revokeObjectURL(url);};
 const end=feedSpan('media.decode');try{if(typeof Image!=='undefined'){const img=new Image();img.src=url;await img.decode();}return {url,bytes:blob?.size??0,dispose};}catch(error){dispose();throw error;}finally{end();}
});
