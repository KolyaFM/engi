import {SurfaceButton} from '../../ui/SurfaceButton';
import {useEffect,useState} from 'react';
import type {Task} from '../../lib/engi/types';
import {KnowledgeImage} from '../knowledge/KnowledgeImage';
export function MappingCard({task,initial,feedback,busy,onPersist,onSubmit,onNext,onMediaReady,onMediaFail}:{task:Task;initial?:Record<string,string>;feedback:any;busy:boolean;onPersist:(mapping:Record<string,string>)=>void;onSubmit:(mapping:Record<string,string>)=>void;onNext:()=>void;onMediaReady:(ready:boolean)=>void;onMediaFail:()=>void}){
 const [mapping,setMapping]=useState<Record<string,string>>(initial??feedback?.chosen??{}),[active,setActive]=useState(task.items[0].entityId),[loaded,setLoaded]=useState<string[]>([]);
 const images=task.recipe.cue==='image'?task.items.filter(i=>i.image):[];
 useEffect(()=>{onMediaReady(images.every(i=>loaded.includes(i.entityId)));},[loaded,task,onMediaReady]);
 function assign(value:string){
  const next={...mapping};if(task.recipe.format==='match')for(const key of Object.keys(next))if(key!==active&&next[key]===value)delete next[key];
  next[active]=value;setMapping(next);onPersist(next);
  const remaining=task.items.find(i=>!next[i.entityId]);if(remaining)setActive(remaining.entityId);
 }
 const complete=task.items.every(i=>!!mapping[i.entityId]);
 return <div className="mapping-card"><p className="muted">{task.recipe.format==='match'?'Выберите объект, затем ответ. Каждый ответ используется один раз.':'Выберите объект, затем категорию. Категории могут повторяться.'}</p>
  <div className="mapping-objects">{task.items.map((item,n)=>{
   const chosen=mapping[item.entityId],correct=chosen===item.answerId;
   return <SurfaceButton key={item.entityId} className={`mapping-object ${active===item.entityId?'is-active':''} ${feedback?correct?'answer-correct':'answer-wrong':''}`} aria-pressed={active===item.entityId} aria-label={`Объект ${n+1}${task.recipe.cue==='image'&&item.image?'':': '+item.name}`} disabled={busy||!!feedback} onClick={()=>setActive(item.entityId)}>
    {task.recipe.cue==='image'&&item.image?<KnowledgeImage src={item.image} alt={`Объект ${n+1}`} onReady={()=>setLoaded(previous=>previous.includes(item.entityId)?previous:[...previous,item.entityId])} onFail={onMediaFail}/>:<strong>{item.name}</strong>}
    <span>{task.options.find(o=>o.id===chosen)?.name??'Выберите ответ'}</span>
    {feedback&&<small>{correct?'Верно ✓':'Правильно: '+item.answer}</small>}
   </SurfaceButton>;
  })}</div>
  {!feedback&&<div className="feed-options">{task.options.map(option=><SurfaceButton className="feed-option" key={option.id} disabled={busy} aria-pressed={mapping[active]===option.id} onClick={()=>assign(option.id)}><span>{option.name}</span><span>{Object.values(mapping).includes(option.id)?'●':''}</span></SurfaceButton>)}</div>}
  {feedback?<><p role="status">Верно {task.items.filter(i=>mapping[i.entityId]===i.answerId).length} из {task.items.length}</p><SurfaceButton className="button primary" onClick={onNext}>Дальше</SurfaceButton></>:<SurfaceButton className="button primary" disabled={busy||!complete} onClick={()=>onSubmit({...mapping})}>Проверить</SurfaceButton>}
 </div>;
}

