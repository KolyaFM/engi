import {DescriptionButton} from './EntityDescription';
import {SurfaceButton} from '../../ui/SurfaceButton';
import {useHorizontalSwipe} from './useHorizontalSwipe';
import {useEffect,useRef,useState} from 'react';
import type {Task} from '../../lib/engi/types';
import type {InteractionDraft} from '../../db/engi-db';
import {KnowledgeImage} from '../knowledge/KnowledgeImage';
export function ConveyorCard({task,progress,busy,onPair,onComplete,onMediaReady,onMediaFail}:{task:Task;progress?:InteractionDraft['matching'];busy:boolean;onPair:(pair:{entityId:string;answerId:string},requestId:string)=>Promise<{correct:boolean;complete:boolean}>;onComplete:()=>void;onMediaReady:(ready:boolean)=>void;onMediaFail:()=>void}){
 const firstPending=task.items.find(i=>!progress?.matched[i.entityId]),lastPair=progress?.history.at(-1),failure=lastPair&&!lastPair.correct&&lastPair.responseKey===firstPending?.entityId?lastPair:undefined;
 const [queue,setQueue]=useState(()=>task.items.filter(i=>!progress?.matched[i.entityId]).map(i=>i.entityId)),[offset,setOffset]=useState(0),[dragging,setDragging]=useState(false),[pending,setPending]=useState(false),[verdict,setVerdict]=useState<'correct'|'wrong'|undefined>(failure?'wrong':undefined),[wrongAnswer,setWrongAnswer]=useState(failure?.answer),[status,setStatus]=useState(''),[loaded,setLoaded]=useState<string[]>([]);
 const lock=useRef(false),alive=useRef(true),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),request=useRef<{entityId:string;answerId:string;id:string}|undefined>(undefined);
 const swipe=useHorizontalSwipe({disabled:busy||lock.current,onOffset:setOffset,onDragging:setDragging,onSwipe:side=>{void answer(side)}});
 const item=task.items.find(i=>i.entityId===queue[0]),image=task.recipe.cue==='image'?item?.image:undefined;
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;clearTimeout(timer.current)}},[]);
 useEffect(()=>{onMediaReady(!image||!!item&&loaded.includes(item.entityId))},[item?.entityId,image,loaded,onMediaReady]);
 async function answer(side:number){if(!item||image&&!loaded.includes(item.entityId)||lock.current||busy||task.options.length!==2)return;lock.current=true;setPending(true);setDragging(false);setVerdict(undefined);setWrongAnswer(undefined);setStatus('');const option=task.options[side];
  if(request.current?.entityId!==item.entityId||request.current.answerId!==option.id)request.current={entityId:item.entityId,answerId:option.id,id:crypto.randomUUID()};
  try{const result=await onPair({entityId:item.entityId,answerId:option.id},request.current.id);if(!alive.current)return;request.current=undefined;setVerdict(result.correct?'correct':'wrong');setWrongAnswer(result.correct?undefined:option.id);
   setOffset(result.correct?(side===0?-1:1)*Math.max(500,window.innerWidth*1.3):0);
   timer.current=setTimeout(()=>{if(!alive.current)return;if(result.correct){setQueue(old=>old.slice(1));setOffset(0);setVerdict(undefined);setStatus('');}lock.current=false;setPending(false);if(result.complete)onComplete();},260);
  }catch{if(alive.current){setOffset(0);setVerdict(undefined);setStatus('Не удалось сохранить ответ. Попробуйте ещё раз.');lock.current=false;setPending(false);}}
 }
 if(!item)return <p role="status">Все объекты распределены</p>;
 return <section className="feed-conveyor" aria-label="Распределение свайпами"><div className="matching-heading"><h2>{task.contextual?'До или после?':'Распределите объекты'}</h2><span>{Object.keys(progress?.matched??{}).length} / {task.items.length}</span></div>

  <div className="conveyor-stage"><DescriptionButton {...item}/><div key={item.entityId} className={`conveyor-object ${dragging?'dragging':''} ${verdict??''}`} data-conveyor-id={item.entityId} tabIndex={0} style={{transform:`translateX(${offset}px) rotate(${Math.max(-10,Math.min(10,offset/25))}deg)`}} onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();void answer(e.key==='ArrowLeft'?0:1)}}}
   {...swipe}>
    {image?<KnowledgeImage src={image} alt="Объект для распределения" onReady={()=>setLoaded(old=>old.includes(item.entityId)?old:[...old,item.entityId])} onFail={onMediaFail}/>:<strong>{item.name}</strong>}
    {task.contextual?.supportTargetIds.includes(item.targetId)&&<small>Ориентир</small>}
   </div></div>
  <div className="conveyor-categories">{task.options.map((o,n)=><SurfaceButton key={o.id} type="button" className={`conveyor-category ${verdict==='wrong'?(o.id===wrongAnswer?'incorrect':o.id===item.answerId?'correct':''):''}`} aria-invalid={verdict==='wrong'&&o.id===wrongAnswer||undefined} disabled={busy||pending} onClick={()=>void answer(n)}>{n===0&&'← '}<span>{o.name}</span>{n===1&&' →'}</SurfaceButton>)}</div>
  {status&&<p className="conveyor-status" role="alert">{status}</p>}
 </section>;
}

