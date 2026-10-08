import {useEffect,useRef,useState,type CSSProperties} from 'react';
import type {Task} from '../../lib/engi/types';
import type {InteractionDraft} from '../../db/engi-db';
import {KnowledgeImage} from '../knowledge/KnowledgeImage';

type Pair={entityId:string;answerId:string};
export function MatchingPairsCard({task,progress,busy,onPair,onComplete,onMediaReady,onMediaFail}:{
 task:Task;progress?:InteractionDraft['matching'];busy:boolean;
 onPair:(pair:Pair,requestId:string)=>Promise<{correct:boolean;complete:boolean}>;
 onComplete:()=>void;onMediaReady:(ready:boolean)=>void;onMediaFail:()=>void;
}){
 const [left,setLeft]=useState<string>(),[right,setRight]=useState<string>(),[flashes,setFlashes]=useState<(Pair&{correct:boolean;id:string})[]>([]),[pending,setPending]=useState(false),[loaded,setLoaded]=useState<string[]>([]),[status,setStatus]=useState('');
 const lock=useRef(false),alive=useRef(true),timers=useRef(new Set<ReturnType<typeof setTimeout>>()),request=useRef<(Pair&{id:string})|undefined>(undefined);
 const matched=progress?.matched??{},solved=new Set(task.options.filter(o=>task.items.some(i=>i.answerId===o.id)&&!task.items.some(i=>i.answerId===o.id&&!matched[i.entityId])).map(o=>o.id));
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;timers.current.forEach(clearTimeout)}},[]);
 const images=task.recipe.cue==='image'?task.items.filter(i=>i.image):[];
 useEffect(()=>{onMediaReady(images.every(i=>loaded.includes(i.entityId)))},[loaded,task,onMediaReady]);
 async function check(entityId:string,answerId:string){
  if(lock.current||busy)return;lock.current=true;setPending(true);setStatus('Проверяем пару…');
  const pair={entityId,answerId};
  if(request.current?.entityId!==entityId||request.current.answerId!==answerId)request.current={...pair,id:crypto.randomUUID()};
  try{
   const result=await onPair(pair,request.current.id);if(!alive.current)return;
   const id=request.current.id;request.current=undefined;setPending(false);setLeft(undefined);setRight(undefined);lock.current=false;
   setFlashes(previous=>[...previous,{...pair,correct:result.correct,id}]);
   setStatus(result.correct?(result.complete?'Все пары найдены':'Пара найдена'):'Эта пара не подходит. Попробуйте ещё раз.');
   const timer=setTimeout(()=>{timers.current.delete(timer);setFlashes(previous=>previous.filter(f=>f.id!==id));if(result.complete)onComplete()},result.correct?350:450);timers.current.add(timer);
  }catch{
   if(alive.current){setPending(false);setLeft(undefined);setRight(undefined);setStatus('Не удалось сохранить ответ. Попробуйте ещё раз.');lock.current=false;}
  }
 }
 function choose(side:'left'|'right',id:string){
  if(lock.current||busy)return;
  if(side==='left'){const next=left===id?undefined:id;setLeft(next);if(next&&right)void check(next,right)}
  else{const next=right===id?undefined:id;setRight(next);if(left&&next)void check(left,next)}
 }
 function tileState(side:'left'|'right',id:string){
  if((side==='left'?left:right)===id)return 'selected';
  const flash=flashes.findLast(f=>side==='left'?f.entityId===id:f.answerId===id);
  if(flash)return flash.correct?'correct':'incorrect';
  if(side==='left'?!!matched[id]:solved.has(id))return 'matched';
  return (side==='left'?left:right)===id?'selected':'idle';
 }
 const imageCue=task.recipe.cue==='image',total=task.items.length;
 const sizing={'--matching-count':Math.max(total,task.options.length)} as CSSProperties;
 return <section className={`matching-pairs ${imageCue?'has-images':''}`} style={sizing} aria-label="Соотнесение объектов и ответов" aria-busy={pending}>
  <div className="matching-heading"><h2>Найдите пары</h2><span className="matching-progress" aria-label={`Найдено ${Object.keys(matched).length} из ${total} пар`}>{Object.keys(matched).length} / {total}</span></div>
  <p className="matching-help">Выберите {imageCue?'картинку':'объект'} и {task.recipe.label?`ответ: ${task.recipe.label}`:'подходящий ответ'}</p>
  <div className="matching-columns">
   <div className="matching-column" role="group" aria-label="Объекты">{task.items.map(item=>{
    const state=tileState('left',item.entityId);
    return <button key={item.entityId} className={`matching-tile matching-object ${imageCue&&item.image?'is-image':''} ${state}`} data-entity-id={item.entityId} aria-label={imageCue?`Объект ${task.items.indexOf(item)+1}`:item.name} aria-pressed={state==='selected'} disabled={busy||pending||!!matched[item.entityId]} onClick={()=>choose('left',item.entityId)}>
     {task.recipe.cue==='image'&&item.image?<KnowledgeImage src={item.image} alt="Объект для соотнесения" onReady={()=>setLoaded(ids=>ids.includes(item.entityId)?ids:[...ids,item.entityId])} onFail={onMediaFail}/>:<span>{item.name}</span>}
     <span className="matching-mark" aria-hidden="true">{state==='correct'||state==='matched'?'✓':state==='incorrect'?'×':''}</span>
     {state==='matched'&&<span className="sr-only">Пара найдена</span>}
    </button>;
   })}</div>
   <div className="matching-column matching-answers" role="group" aria-label="Ответы">{task.options.map(option=>{
    const state=tileState('right',option.id);
    return <button key={option.id} className={`matching-tile matching-answer ${state}`} data-answer-id={option.id} aria-pressed={state==='selected'} disabled={busy||pending||solved.has(option.id)} onClick={()=>choose('right',option.id)}><span>{option.name}</span><span className="matching-mark" aria-hidden="true">{state==='correct'||state==='matched'?'✓':state==='incorrect'?'×':''}</span>{state==='matched'&&<span className="sr-only">Пара найдена</span>}</button>;
   })}</div>
  </div>
  {task.recipe.format==='categorize'&&<p className="matching-note">Один ответ может подходить к нескольким {imageCue?'картинкам':'объектам'}</p>}
  <span className="sr-only" role="status" aria-live="polite">{status}</span>
 </section>;
}
