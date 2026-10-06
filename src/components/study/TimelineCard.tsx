import {useState} from 'react';
import type {Task} from '../../lib/engi/types';
export function TimelineCard({task,initialValue,feedback,busy,onPersist,onSubmit,onNext}:{task:Task;initialValue?:number;feedback:any;busy:boolean;onPersist:(value:number)=>void;onSubmit:(value:Record<string,number>)=>void;onNext:()=>void}){
 const i=task.items[0],scale=task.timeline??{min:1,max:2100,initial:1050},[value,setValue]=useState(initialValue??scale.initial);
 const pct=(year:number)=>(year-scale.min)/(scale.max-scale.min)*100;
 return <div className="feed-timeline"><output aria-live="off">{value}</output><div className="timeline-scale">
  <input type="range" aria-label="Выберите год" min={scale.min} max={scale.max} step={1} value={value} disabled={busy||!!feedback} onChange={e=>{const v=Number(e.target.value);setValue(v);onPersist(v)}}/>
  {feedback&&<span className="timeline-fact-marker" style={{left:`${pct(i.year!)}%`}} aria-hidden="true"/>}
 </div><div className="timeline-axis"><span>{scale.min}</span><span>{scale.max}</span></div>
 {!feedback?<><small>Приблизительный год. Можно поправить перед подтверждением.</small><button className="button primary" disabled={busy} onClick={()=>onSubmit({[i.entityId]:value})}>Подтвердить</button></>:
  <div className="timeline-result" role="status"><p><span>Ваш ответ: <strong>{value}</strong></span><span>Факт: <strong>{i.year}</strong></span></p><small>{feedback.score===1?'Близко ✓':'Посмотрите, где находится год на шкале.'}</small><button className="button outline" disabled={busy} onClick={onNext}>Далее →</button></div>}
 </div>;
}
