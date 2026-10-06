import {useEffect,useRef,useState,type ReactNode} from 'react';
import type {InteractionDraft} from '../../db/engi-db';
import type {Task} from '../../lib/engi/types';

export function RecallRevealCard({task,cue,draft,paused,busy,reducedMotion,accessible,onPersist,onSubmit}:{task:Task;cue:ReactNode;draft?:InteractionDraft;paused:boolean;busy:boolean;reducedMotion:boolean;accessible:boolean;onPersist:(delta:Partial<InteractionDraft>)=>Promise<void>;onSubmit:(v:boolean)=>void}){
 const elapsedRef=useRef(Math.min(5000,draft?.recallElapsedMs??0)),[elapsed,setElapsed]=useState(elapsedRef.current),[revealed,setRevealed]=useState(!!draft?.revealed),[offset,setOffset]=useState(0),[dragging,setDragging]=useState(false);
 const callbacks=useRef({onPersist,onSubmit});callbacks.current={onPersist,onSubmit};
 const gesture=useRef<{x:number;y:number;time:number;width:number;dx:number;dy:number}|null>(null);
 const lastPersist=useRef(elapsedRef.current);
 useEffect(()=>{
  if(revealed||paused)return;
  let last=Date.now(),timer:ReturnType<typeof setTimeout>|undefined,disposed=false;
  const persist=(force=false)=>{if(force||elapsedRef.current-lastPersist.current>=500){lastPersist.current=elapsedRef.current;void callbacks.current.onPersist({recallElapsedMs:elapsedRef.current}).catch(()=>{})}};
  const tick=()=>{
   if(disposed)return;const now=Date.now();if(document.visibilityState==='visible'){elapsedRef.current=Math.min(5000,elapsedRef.current+Math.max(0,now-last));setElapsed(elapsedRef.current)}last=now;
   if(elapsedRef.current>=5000){void callbacks.current.onPersist({recallElapsedMs:5000,revealed:true}).then(()=>{if(!disposed)setRevealed(true)}).catch(()=>{if(!disposed)timer=setTimeout(tick,500)});return}
   persist();timer=setTimeout(tick,Math.min(100,5000-elapsedRef.current));
  };
  const visibility=()=>{last=Date.now();persist(true)};
  document.addEventListener('visibilitychange',visibility);timer=setTimeout(tick,Math.min(100,5000-elapsedRef.current));
  return()=>{disposed=true;clearTimeout(timer);if(document.visibilityState==='visible')elapsedRef.current=Math.min(5000,elapsedRef.current+Math.max(0,Date.now()-last));persist(true);document.removeEventListener('visibilitychange',visibility)};
 },[task.id,paused,revealed]);
 return <div className={`feed-question recall-swipe ${dragging?'is-dragging':''} ${offset>0?'remembering':offset<0?'missing-memory':''}`} style={reducedMotion?undefined:{transform:`translateX(${offset}px) rotate(${offset/35}deg)`}}
  onKeyDown={e=>{if(revealed&&!paused&&!busy&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();callbacks.current.onSubmit(e.key==='ArrowRight')}}}
  onPointerDown={e=>{
   if(!revealed||paused||busy||!e.isPrimary||(e.target as HTMLElement).closest('button,input,textarea')||e.clientX<24||e.clientX>window.innerWidth-24)return;
   gesture.current={x:e.clientX,y:e.clientY,time:Date.now(),width:e.currentTarget.getBoundingClientRect().width,dx:0,dy:0};e.currentTarget.setPointerCapture(e.pointerId);
  }}
  onPointerMove={e=>{const g=gesture.current;if(!g)return;g.dx=e.clientX-g.x;g.dy=e.clientY-g.y;if(Math.abs(g.dx)>8&&Math.abs(g.dx)>Math.abs(g.dy)*1.2){setDragging(true);setOffset(Math.max(-g.width*.8,Math.min(g.width*.8,g.dx)))}}}
  onPointerUp={()=>{const g=gesture.current;gesture.current=null;setDragging(false);setOffset(0);if(!g||paused||busy)return;
   const distance=Math.abs(g.dx),horizontal=distance>Math.abs(g.dy)*1.2,velocity=distance/Math.max(20,Date.now()-g.time);
   if(horizontal&&(distance>=g.width*.27||(distance>=g.width*.15&&velocity>=.6)))callbacks.current.onSubmit(g.dx>0);
  }} onPointerCancel={()=>{gesture.current=null;setOffset(0);setDragging(false)}}>
  {cue}<div className="feed-actions"><h2>{task.recipe.label??'Вспомните ответ'}</h2>
   {!revealed?<div className="recall-thinking"><div className="recall-time-track" role="progressbar" aria-label="Время вспомнить" aria-valuemin={0} aria-valuemax={5} aria-valuenow={Math.ceil((5000-elapsed)/1000)}><span style={{width:`${(5000-elapsed)/50}%`}}/></div><span>{Math.ceil((5000-elapsed)/1000)}</span><p>Попробуйте вспомнить. Ответ откроется сам.</p></div>:
    <><h3 className="revealed-answer" aria-live="polite">{task.items[0].answer}</h3><div className="recall-hints" aria-hidden="true"><span>← Не вспомнил</span><span>Вспомнил →</span></div>
     <div className={`recall-controls ${reducedMotion||accessible?'show-controls':''}`} aria-label="Оцените воспоминание"><button className="button outline" disabled={busy||paused} onClick={()=>onSubmit(false)}>Не вспомнил</button><button className="button outline" disabled={busy||paused} onClick={()=>onSubmit(true)}>Вспомнил</button></div>
     <span className="swipe-verdict" aria-hidden="true">{offset>20?'Вспомнил ✓':offset< -20?'Не вспомнил':''}</span></>}
  </div>
 </div>;
}
