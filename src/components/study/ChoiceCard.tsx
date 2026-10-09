import {SurfaceButton} from '../../ui/SurfaceButton';
import {useEffect,useRef} from 'react';
import {KnowledgeImage} from '../knowledge/KnowledgeImage';
import type {Task} from '../../lib/engi/types';
import {discreteAnswer} from '../../lib/engi/questions/timeline';
export function ChoiceCard({task,attempts,feedback,busy,onChoose,onMediaReady,onMediaFail}:{task:Task;attempts:string[];feedback:any;busy:boolean;onChoose:(id:string)=>void;onMediaReady?:(ready:boolean)=>void;onMediaFail?:()=>void}){
 const loaded=useRef(new Set<string>()),images=task.recipe.answerPresentation==='image'?task.options.filter(o=>o.image):[];useEffect(()=>{if(images.length)onMediaReady?.(false)},[task.id]);
 const correctId=discreteAnswer(task),completed=!!feedback;
 return <div className={`feed-options ${task.discrimination?'near-twin-options':''} ${task.recipe.answerPresentation==='image'?'image-answer-options':''}`}>
  {task.options.map((o,n)=>{const wrong=attempts.includes(o.id)&&o.id!==correctId,right=completed&&o.id===correctId;return <SurfaceButton key={o.id} className={`feed-option ${wrong?'answer-wrong':''} ${right?'answer-correct':''}`} disabled={busy||completed||wrong} onClick={()=>onChoose(o.id)}>
   {task.recipe.answerPresentation==='image'&&o.image?<KnowledgeImage src={o.image} alt={`Вариант ${n+1}`} onReady={()=>{loaded.current.add(o.id);if(images.every(i=>loaded.current.has(i.id)))onMediaReady?.(true)}} onFail={onMediaFail}/>:<span>{o.name}</span>}<span aria-hidden="true">{right?'✓':wrong?'✕':''}</span><span className="sr-only">{wrong?' — неверный вариант':right?' — верно':''}</span>
  </SurfaceButton>})}
 </div>;
}

