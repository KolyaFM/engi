import {useEffect,useState} from 'react';
import {DEFAULT_PREFERENCES,readStudyPreferences,saveStudyPreferences,type StudyPreferences} from '../../services/study-preferences-service';
export {DEFAULT_PREFERENCES,type StudyPreferences} from '../../services/study-preferences-service';
export function useStudyPreferences(){
 const [preferences,setPreferences]=useState(DEFAULT_PREFERENCES),[loaded,setLoaded]=useState(false);
 useEffect(()=>{let alive=true;readStudyPreferences().then(value=>{if(alive)setPreferences(value)}).catch(()=>{}).finally(()=>{if(alive)setLoaded(true)});return()=>{alive=false}},[]);
 const save=async(next:StudyPreferences)=>{setPreferences(await saveStudyPreferences(next))};
 return {preferences,save,loaded};
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
