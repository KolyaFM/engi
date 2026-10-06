import {useEffect,useState} from 'react';
import {db} from '../../db/engi-db';
export type StudyPreferences={sound:boolean;accessibleRecall:boolean};
export const DEFAULT_PREFERENCES:StudyPreferences={sound:false,accessibleRecall:false};
export function useStudyPreferences(){
 const [preferences,setPreferences]=useState(DEFAULT_PREFERENCES);
 useEffect(()=>{let alive=true;db.appMeta.get('studyPreferences').then(r=>{if(alive)setPreferences({...DEFAULT_PREFERENCES,...r?.value})});return()=>{alive=false}},[]);
 const save=async(next:StudyPreferences)=>{await db.appMeta.put({key:'studyPreferences',value:next});setPreferences(next)};
 return {preferences,save};
}
let audioContext:AudioContext|undefined;
/** Optional quiet success cue, initiated only by an explicit user action. */
export function playSuccess(enabled:boolean){
 if(!enabled)return;
 try{const Constructor=window.AudioContext??(window as any).webkitAudioContext;if(!Constructor)return;audioContext??=new Constructor();const c=audioContext!;void c.resume().catch(()=>{});
  const oscillator=c.createOscillator(),gain=c.createGain();oscillator.type='sine';oscillator.frequency.setValueAtTime(660,c.currentTime);gain.gain.setValueAtTime(.025,c.currentTime);gain.gain.exponentialRampToValueAtTime(.001,c.currentTime+.08);oscillator.connect(gain);gain.connect(c.destination);oscillator.start();oscillator.stop(c.currentTime+.08);
 }catch{/* Sound is progressive enhancement. */}
}
export function useReducedMotion(){const [reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);useEffect(()=>{const query=window.matchMedia('(prefers-reduced-motion: reduce)'),change=()=>setReduced(query.matches);query.addEventListener('change',change);return()=>query.removeEventListener('change',change)},[]);return reduced}
