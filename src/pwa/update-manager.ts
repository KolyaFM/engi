import {registerSW} from 'virtual:pwa-register';
let update:((reload?:boolean)=>Promise<void>)|undefined;
let registration:ServiceWorkerRegistration|undefined;
export async function checkUpdates(){if(registration&&navigator.onLine)await registration.update()}
export function registerUpdates(onUpdate:()=>void,onOfflineReady:()=>void){update=registerSW({onNeedRefresh:onUpdate,onOfflineReady,onRegisteredSW:(_url,r)=>{registration=r;if(r)checkUpdates().catch(()=>{})},onRegisterError:e=>console.warn('Offline shell registration:',e)});const check=()=>{if(document.visibilityState==='visible')checkUpdates().catch(()=>{})};document.addEventListener('visibilitychange',check);window.addEventListener('online',check);const timer=setInterval(check,5*60*1000);return ()=>{clearInterval(timer);document.removeEventListener('visibilitychange',check);window.removeEventListener('online',check)}}
export async function applyUpdate(){await update?.(true)}
