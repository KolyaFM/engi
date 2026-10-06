import type {Task} from '../../lib/engi/types';
import {discreteAnswer} from '../../lib/engi/questions/timeline';
export function ChoiceCard({task,attempts,feedback,busy,onChoose}:{task:Task;attempts:string[];feedback:any;busy:boolean;onChoose:(id:string)=>void}){
 const correctId=discreteAnswer(task),completed=!!feedback;
 return <div className={`feed-options ${task.discrimination?'near-twin-options':''}`}>
  {task.options.map(o=>{const wrong=attempts.includes(o.id)&&o.id!==correctId,right=completed&&o.id===correctId;return <button key={o.id} className={`feed-option ${wrong?'answer-wrong':''} ${right?'answer-correct':''}`} disabled={busy||completed||wrong} onClick={()=>onChoose(o.id)}>
   <span>{o.name}</span><span aria-hidden="true">{right?'✓':wrong?'✕':''}</span><span className="sr-only">{wrong?' — неверный вариант':right?' — верно':''}</span>
  </button>})}
 </div>;
}
