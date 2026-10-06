import {registerSW} from 'virtual:pwa-register';
let update:((reload?:boolean)=>Promise<void>)|undefined;
export function registerUpdates(onUpdate:()=>void,onOfflineReady:()=>void){update=registerSW({onNeedRefresh:onUpdate,onOfflineReady,onRegisteredSW:(_url,registration)=>{if(registration){setInterval(()=>{if(navigator.onLine)registration.update().catch(()=>{})},60*60*1000)}},onRegisterError:e=>console.warn('Offline shell registration:',e)});}
export async function applyUpdate(){await update?.(true)}
