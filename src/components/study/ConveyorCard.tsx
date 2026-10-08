import {useEffect,useRef,useState} from 'react';
import type {Task} from '../../lib/engi/types';
import type {InteractionDraft} from '../../db/engi-db';
import {KnowledgeImage} from '../knowledge/KnowledgeImage';
export function ConveyorCard({task,progress,busy,onPair,onComplete,onMediaReady,onMediaFail}:{task:Task;progress?:InteractionDraft['matching'];busy:boolean;onPair:(pair:{entityId:string;answerId:string},requestId:string)=>Promise<{correct:boolean;complete:boolean}>;onComplete:()=>void;onMediaReady:(ready:boolean)=>void;onMediaFail:()=>void}){
 const [queue,setQueue]=useState(()=>task.items.filter(i=>!progress?.matched[i.entityId]).sort((a,b)=>Number(progress?.history.some(p=>p.responseKey===a.entityId&&!p.correct))-Number(progress?.history.some(p=>p.responseKey===b.entityId&&!p.correct))).map(i=>i.entityId)),[offset,setOffset]=useState(0),[dragging,setDragging]=useState(false),[verdict,setVerdict]=useState<'correct'|'wrong'>(),[status,setStatus]=useState(''),[loaded,setLoaded]=useState<string[]>([]);
 const lock=useRef(false),alive=useRef(true),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),gesture=useRef<{x:number;y:number;dx:number;locked:boolean}|undefined>(undefined),request=useRef<{entityId:string;answerId:string;id:string}|undefined>(undefined);
 const item=task.items.find(i=>i.entityId===queue[0]),image=task.recipe.cue==='image'?item?.image:undefined;
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;clearTimeout(timer.current)}},[]);
 useEffect(()=>{onMediaReady(!image||!!item&&loaded.includes(item.entityId))},[item?.entityId,image,loaded,onMediaReady]);
 async function answer(side:number){if(!item||image&&!loaded.includes(item.entityId)||lock.current||busy||task.options.length!==2)return;lock.current=true;setDragging(false);setOffset((side===0?-1:1)*Math.max(500,window.innerWidth*1.3));setStatus('');const option=task.options[side];
  if(request.current?.entityId!==item.entityId||request.current.answerId!==option.id)request.current={entityId:item.entityId,answerId:option.id,id:crypto.randomUUID()};
  try{const result=await onPair({entityId:item.entityId,answerId:option.id},request.current.id);if(!alive.current)return;request.current=undefined;setVerdict(result.correct?'correct':'wrong');setStatus(result.correct?'Верно':`Правильная категория: ${task.options.find(o=>o.id===item.answerId)?.name}`);
   timer.current=setTimeout(()=>{if(!alive.current)return;setQueue(old=>result.correct?old.slice(1):[...old.slice(1),old[0]]);setOffset(0);setVerdict(undefined);setStatus('');lock.current=false;if(result.complete)onComplete();},result.correct?260:650);
  }catch{if(alive.current){setOffset(0);setVerdict(undefined);setStatus('Не удалось сохранить ответ. Попробуйте ещё раз.');lock.current=false;}}
 }
 if(!item)return <p role="status">Все объекты распределены</p>;
 return <section className="feed-conveyor" aria-label="Распределение свайпами"><div className="matching-heading"><h2>{task.contextual?'До или после?':'Распределите объекты'}</h2><span>{Object.keys(progress?.matched??{}).length} / {task.items.length}</span></div><p className="matching-help">{task.contextual&&task.recipe.label&&<>{task.recipe.label}. </>}Смахните объект к подходящей категории или нажмите на неё</p>
  <div className="conveyor-categories">{task.options.map((o,n)=><button key={o.id} type="button" className="conveyor-category" disabled={busy||lock.current} onClick={()=>void answer(n)}>{n===0&&'← '}<span>{o.name}</span>{n===1&&' →'}</button>)}</div>
  <div className="conveyor-stage"><div className={`conveyor-object ${dragging?'dragging':''} ${verdict??''}`} data-conveyor-id={item.entityId} tabIndex={0} style={{transform:`translateX(${offset}px) rotate(${Math.max(-10,Math.min(10,offset/25))}deg)`}} onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();void answer(e.key==='ArrowLeft'?0:1)}}}
   onPointerDown={e=>{if(busy||lock.current||!e.isPrimary)return;gesture.current={x:e.clientX,y:e.clientY,dx:0,locked:false};e.currentTarget.setPointerCapture(e.pointerId)}}
   onPointerMove={e=>{const g=gesture.current;if(!g)return;g.dx=e.clientX-g.x;const dy=e.clientY-g.y;if(!g.locked&&Math.abs(dy)>8&&Math.abs(dy)>Math.abs(g.dx)){gesture.current=undefined;setOffset(0);return;}if(Math.abs(g.dx)>8){g.locked=true;setDragging(true);setOffset(g.dx);}}}
   onPointerUp={e=>{const g=gesture.current;gesture.current=undefined;setDragging(false);try{e.currentTarget.releasePointerCapture(e.pointerId)}catch{}if(g?.locked&&Math.abs(g.dx)>=60)void answer(g.dx<0?0:1);else if(!lock.current)setOffset(0)}}
   onPointerCancel={()=>{gesture.current=undefined;setDragging(false);if(!lock.current)setOffset(0)}}>
    {image?<KnowledgeImage src={image} alt="Объект для распределения" onReady={()=>setLoaded(old=>old.includes(item.entityId)?old:[...old,item.entityId])} onFail={onMediaFail}/>:<strong>{item.name}</strong>}
    {task.contextual?.supportTargetIds.includes(item.targetId)&&<small>Ориентир</small>}
   </div></div><p className={`conveyor-status ${verdict??''}`} role="status" aria-live="polite">{status}</p>
 </section>;
}
