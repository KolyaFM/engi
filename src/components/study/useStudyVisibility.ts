import {useEffect,useRef} from 'react';
type Event='start'|'refresh'|'end';
/** Call only for rendered content. Preloading never uses this hook. */
export function useStudyVisibility(token:string|undefined,enabled:boolean,observe:(id:string,event:Event)=>Promise<unknown>,onError:(error:Error)=>void){
 const callbacks=useRef({observe,onError});callbacks.current={observe,onError};
 useEffect(()=>{
  if(!token||!enabled)return;
  // Cleanup belongs to the screen that created this effect, even after a new render.
  const observeEpisode=callbacks.current.observe;
  let episode:string|undefined,timer:ReturnType<typeof setInterval>|undefined,closed=false;
  const send=(id:string,event:Event)=>{void observeEpisode(id,event).catch(error=>callbacks.current.onError(error as Error));};
  const begin=()=>{if(closed||episode||document.visibilityState!=='visible')return;episode=crypto.randomUUID();send(episode,'start');
   timer=setInterval(()=>{if(episode)send(episode,'refresh')},1000);};
  const end=()=>{clearInterval(timer);if(episode){send(episode,'end');episode=undefined;}};
  const visibility=()=>document.visibilityState==='visible'?begin():end();
  document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',end);begin();
  return()=>{closed=true;end();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',end);};
 },[token,enabled]);
}
