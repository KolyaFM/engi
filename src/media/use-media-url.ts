import {useEffect,useState} from 'react';
import {hashFromUrl,mediaStore} from './media-store';
export function useMediaUrl(source?:string){
 const [state,setState]=useState<{source?:string;url?:string;failed:boolean}>({failed:false});
 useEffect(()=>{
  let cancelled=false,release:(()=>void)|undefined;setState({source,failed:false});
  if(!source||!hashFromUrl(source)&&!(/^(https?:|blob:|data:)/.test(source))){setState({source,failed:!!source});return;}
  mediaStore.acquire(source).then(resource=>{release=resource.release;if(cancelled)release();else setState({source,url:resource.url,failed:false});}).catch(()=>{if(!cancelled)setState({source,failed:true});});
  return()=>{cancelled=true;release?.();};
 },[source]);return state.source===source?state:{source,failed:false};
}
