import {SurfaceButton} from '../../ui/SurfaceButton';
import {useState} from 'react';
import type {Task} from '../../lib/engi/types';
export function MultiChoiceCard({task,feedback,busy,onSubmit,onNext}:{task:Task;feedback:any;busy:boolean;onSubmit:(ids:string[])=>void;onNext:()=>void}){
 const [selected,setSelected]=useState<string[]>([]);
 return <><p className="muted">Можно выбрать несколько вариантов.</p><div className="feed-options">{task.options.map(o=><SurfaceButton key={o.id} aria-pressed={selected.includes(o.id)} className={`feed-option ${feedback&&task.answerSet?.includes(o.id)?'answer-correct':feedback&&selected.includes(o.id)?'answer-wrong':''}`} disabled={busy||!!feedback} onClick={()=>setSelected(selected.includes(o.id)?selected.filter(id=>id!==o.id):[...selected,o.id])}><span>{o.name}</span><span>{feedback?task.answerSet?.includes(o.id)?'✓':'':selected.includes(o.id)?'☑':'☐'}</span></SurfaceButton>)}</div>{feedback?<SurfaceButton className="button primary" onClick={onNext}>Дальше</SurfaceButton>:<SurfaceButton className="button primary" disabled={busy||!selected.length} onClick={()=>onSubmit(selected)}>Проверить</SurfaceButton>}</>
}

