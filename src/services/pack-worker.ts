import {importPackDirect} from './pack-service';
self.onmessage=async(e:MessageEvent<Blob>)=>{try{const result=await importPackDirect(e.data,progress=>self.postMessage({progress}));self.postMessage({result})}catch(e){self.postMessage({error:(e as Error).message})}};
