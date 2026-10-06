export const MEDIA_CACHE='engi-media-v1';
export const hashFromUrl=(url:string)=>/^engi-media:\/\/([a-f0-9]{64})$/.exec(url)?.[1];
export const mediaKey=(hash:string)=>new URL(`/__engi_media__/${hash}`,globalThis.location?.origin??'https://engi.invalid').href;
export const mediaStore={
 async has(hash:string){return !!(await (await caches.open(MEDIA_CACHE)).match(mediaKey(hash)))},
 async put(hash:string,blob:Blob){await (await caches.open(MEDIA_CACHE)).put(mediaKey(hash),new Response(blob,{headers:{'Content-Type':blob.type,'Content-Length':String(blob.size)}}))},
 async getBlob(hash:string){const response=await (await caches.open(MEDIA_CACHE)).match(mediaKey(hash));if(!response)throw Error('Локальное изображение отсутствует. Импортируйте пакет ещё раз.');return response.blob()},
 async createObjectUrl(hash:string){return URL.createObjectURL(await this.getBlob(hash))},
 async remove(hash:string){await (await caches.open(MEDIA_CACHE)).delete(mediaKey(hash))},
 async prewarm(urls:string[]){await Promise.allSettled([...new Set(urls.map(hashFromUrl).filter(Boolean))].map(async hash=>{const url=await this.createObjectUrl(hash!);const img=new Image();img.src=url;try{await img.decode()}finally{URL.revokeObjectURL(url)}}))}
};
