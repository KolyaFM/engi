import {useEffect,useState} from 'react';
import type {Task} from '../../lib/engi/types';
import {KnowledgeImage} from '../knowledge/KnowledgeImage';
import {useStudyVisibility} from './useStudyVisibility';
type Props={task:Task;initialFlipped?:string[];busy:boolean;onPersist:(ids:string[])=>Promise<void>;onReveal:(entityId:string,episode:string,event:'start'|'refresh'|'end')=>Promise<unknown>;onNext:()=>void;onMediaReady:(ready:boolean)=>void;onMediaFail:()=>void};
function Tile({task,item,flipped,busy,onFlip,onReady,onFail,onReveal,onRevealError}:{task:Task;item:Task['items'][number];flipped:boolean;busy:boolean;onFlip:()=>void;onReady:()=>void;onFail:()=>void;onReveal:Props['onReveal'];onRevealError:(e:Error)=>void}){
 useStudyVisibility(task.id+':tile:'+item.entityId,flipped&&!busy,(episode,event)=>onReveal(item.entityId,episode,event),onRevealError);
 const image=task.recipe.cue==='image'?item.image:undefined;
 return <button type="button" className={`self-check-tile ${flipped?'is-flipped':''}`} aria-label={`${flipped?'Скрыть':'Открыть'} ответ, карточка ${task.items.indexOf(item)+1}`} aria-pressed={flipped} disabled={busy} onClick={onFlip}><span className="self-check-rotation"><span className="self-check-front" aria-hidden={flipped}>{image?<KnowledgeImage src={image} alt="Объект для самопроверки" onReady={onReady} onFail={onFail}/>:<strong>{item.name}</strong>}</span><span className="self-check-back" aria-hidden={!flipped}><strong>{item.answer}</strong></span></span></button>;
}
export function SelfCheckCard({task,initialFlipped,busy,onPersist,onReveal,onNext,onMediaReady,onMediaFail}:Props){
 const [flipped,setFlipped]=useState(initialFlipped??[]),[loaded,setLoaded]=useState<string[]>([]),[error,setError]=useState('');const images=task.recipe.cue==='image'?task.items.filter(i=>i.image):[];
 useEffect(()=>{onMediaReady(images.every(i=>loaded.includes(i.entityId)))},[loaded,task.id]);
 function flip(id:string){const next=flipped.includes(id)?flipped.filter(x=>x!==id):[...flipped,id];setFlipped(next);void onPersist(next).catch(()=>setError('Не удалось сохранить положение карточек.'));}
 return <section className="self-check-card"><h2>{task.recipe.prompt??'Попробуйте вспомнить ответы'}</h2><p className="matching-help">Вспомните ответ и переверните карточку, чтобы проверить себя.</p><div className="self-check-grid">{task.items.map(item=><Tile key={item.entityId} task={task} item={item} flipped={flipped.includes(item.entityId)} busy={busy} onFlip={()=>flip(item.entityId)} onReady={()=>setLoaded(old=>old.includes(item.entityId)?old:[...old,item.entityId])} onFail={onMediaFail} onReveal={onReveal} onRevealError={()=>setError('Не удалось сохранить показ ответа.')}/>)}</div>{error&&<p role="alert">{error}</p>}<button type="button" className="button primary" disabled={busy} onClick={onNext}>Продолжить</button></section>;
}
