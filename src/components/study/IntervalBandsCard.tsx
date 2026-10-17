import {useEffect,useRef,useState,type CSSProperties} from 'react';
import type {Task} from '../../lib/engi/types';
import type {InteractionDraft} from '../../db/engi-db';
import {SurfaceButton} from '../../ui/SurfaceButton';
import {KnowledgeImage} from '../knowledge/KnowledgeImage';

export function IntervalBandsCard({task,progress,busy,onPair,onComplete,onMediaReady,onMediaFail}:{task:Task;progress?:InteractionDraft['matching'];busy:boolean;onPair:(pair:{entityId:string;answerId:string},requestId:string)=>Promise<{correct:boolean;complete:boolean}>;onComplete:()=>void;onMediaReady:(ready:boolean)=>void;onMediaFail:()=>void}){
 const exercise=task.intervalExercise;if(exercise?.kind!=='bands')throw Error('Missing interval scale');const scale=exercise.scale;
 const [object,setObject]=useState<string>(),[band,setBand]=useState<string>(),[pending,setPending]=useState(false),[status,setStatus]=useState(''),[wrong,setWrong]=useState<{entityId:string;answerId:string}>(),[complete,setComplete]=useState(false),[loaded,setLoaded]=useState<string[]>([]);
 const alive=useRef(true),lock=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),request=useRef<{entityId:string;answerId:string;id:string}|undefined>(undefined);
 const support=new Set(scale.bands.filter(b=>b.support).map(b=>b.id)),matched={...Object.fromEntries(task.items.filter(i=>support.has(i.answerId)).map(i=>[i.entityId,i.answerId])),...progress?.matched};
 const images=task.items.filter(i=>task.recipe.cue==='image'&&i.image);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;clearTimeout(timer.current)}},[]);
 useEffect(()=>{onMediaReady(images.every(i=>loaded.includes(i.entityId)))},[task.id,loaded.join('|')]);
 async function check(entityId:string,answerId:string){
  if(lock.current||busy||complete)return;lock.current=true;setPending(true);setWrong(undefined);
  if(request.current?.entityId!==entityId||request.current.answerId!==answerId)request.current={entityId,answerId,id:crypto.randomUUID()};
  try{const result=await onPair({entityId,answerId},request.current.id);if(!alive.current)return;request.current=undefined;setObject(undefined);setBand(undefined);setPending(false);lock.current=false;
   if(!result.correct){setWrong({entityId,answerId});setStatus('Пара не подходит');clearTimeout(timer.current);timer.current=setTimeout(()=>setWrong(undefined),400);}else{setStatus(result.complete?'Все периоды найдены':'Период найден');if(result.complete){setComplete(true);clearTimeout(timer.current);timer.current=setTimeout(onComplete,900);}}
  }catch{if(alive.current){lock.current=false;setPending(false);setObject(undefined);setBand(undefined);setStatus('Не удалось сохранить ответ. Попробуйте ещё раз.');}}
 }
 function chooseObject(id:string){if(lock.current||busy||complete)return;const next=object===id?undefined:id;setObject(next);if(next&&band)void check(next,band);}
 function chooseBand(id:string){if(lock.current||busy||complete)return;const next=band===id?undefined:id;setBand(next);if(next&&object)void check(object,next);}
 const position=(year:number)=>(year-scale.min)/(scale.max-scale.min)*100;
 return <section className="interval-bands" aria-label="Сопоставление периодов" aria-busy={pending}>
  <div className="matching-heading"><h2>Найдите периоды</h2><span>{Object.keys(matched).length} / {task.items.length}</span></div>
  <div className="interval-chart">
   <div className="interval-axis" aria-label={scale.mode==='anchored'?'Шкала с событием-опорой':'Годы на общей шкале'}>{scale.ticks.map((y,n)=><span key={y} className={n===0?'first':n===scale.ticks.length-1?'last':''} style={{left:position(y)+'%'}}>{y}</span>)}<span className="interval-axis-arrow" aria-hidden="true">→</span></div>
   {scale.bands.map(b=>{const item=task.items.find(i=>i.answerId===b.id)!,done=matched[item.entityId]===b.id;return <SurfaceButton key={b.id} className={`interval-band ${done?'is-matched':''} ${band===b.id?'is-selected':''} ${wrong?.answerId===b.id?'is-wrong':''}`} aria-label={`Период ${b.marker}`} aria-pressed={band===b.id} disabled={busy||pending||done||complete} onClick={()=>chooseBand(b.id)}>
    <span className="interval-band-marker">{b.marker}</span><span className="interval-band-plot"><span className="interval-band-bar" style={{left:position(b.start)+'%',width:(position(b.end+1)-position(b.start))+'%','--band-color':`var(--interval-color-${b.colorIndex%5})`} as CSSProperties}/></span>
    {done&&<span className="interval-band-name">{item.name}</span>}{complete&&<span className="interval-band-years">{b.start}–{b.end}</span>}
   </SurfaceButton>})}
  </div>
  <div className="interval-objects" role="group" aria-label="Объекты">{task.items.filter(i=>!support.has(i.answerId)).map(item=><SurfaceButton key={item.entityId} aria-label={item.name} aria-pressed={object===item.entityId} disabled={busy||pending||!!matched[item.entityId]||complete} className={`interval-object ${object===item.entityId?'is-selected':''} ${wrong?.entityId===item.entityId?'is-wrong':''} ${matched[item.entityId]?'is-matched':''}`} onClick={()=>chooseObject(item.entityId)}>{task.recipe.cue==='image'&&item.image?<KnowledgeImage src={item.image} alt={item.name} onReady={()=>setLoaded(ids=>ids.includes(item.entityId)?ids:[...ids,item.entityId])} onFail={onMediaFail}/>:item.name}</SurfaceButton>)}</div>
  <p className="interval-status" role="status">{status}</p>
 </section>;
}
