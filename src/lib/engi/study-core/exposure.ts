import type { Claim } from './contracts';
export const DISCLOSURE_COOLDOWN_MS=60000;
export const INTRO_DISCLOSURE_COOLDOWN_MS=10000;
export type ExposureEpisode={id:string;attemptId:string;phase:string;startedAt:string;lastVisibleAt:string;endedAt?:string;claims:Claim[]};
export type ExposureEntry={goalId:string;lastVisibleAt:string;episodeId:string;cooldownMs?:number};
export function exposureAvailableAt(entry:ExposureEntry){return new Date(entry.lastVisibleAt).getTime()+(entry.cooldownMs===INTRO_DISCLOSURE_COOLDOWN_MS?INTRO_DISCLOSURE_COOLDOWN_MS:DISCLOSURE_COOLDOWN_MS);}
/** One continuous visibility episode is renewed, not counted as many disclosures. */
export function observeEpisode(previous:ExposureEpisode|undefined,input:Omit<ExposureEpisode,'startedAt'|'lastVisibleAt'|'endedAt'>,at:Date,event:'start'|'refresh'|'end'):ExposureEpisode{
  if(!input.id||!Number.isFinite(at.getTime()))throw Error('Invalid visibility event');
  if(previous&&(previous.attemptId!==input.attemptId||previous.phase!==input.phase||JSON.stringify(previous.claims)!==JSON.stringify(input.claims)))throw Error('Exposure episode is immutable');
  if(previous?.endedAt)return structuredClone(previous);
  const last=Math.max(previous?new Date(previous.lastVisibleAt).getTime():at.getTime(),at.getTime());
  return {...input,startedAt:previous?.startedAt??at.toISOString(),lastVisibleAt:new Date(last).toISOString(),...(event==='end'?{endedAt:new Date(last).toISOString()}: {})};
}
export function blockedByExposure(entries:ExposureEntry[],at:Date):string[]{
  return [...new Set(entries.filter(e=>at.getTime()<exposureAvailableAt(e)).map(e=>e.goalId))];
}
