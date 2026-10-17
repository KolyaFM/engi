import type {Task} from '../../lib/engi/types';
export function IntervalEndpointCard({task}:{task:Task}){
 const range=task.intervalExercise;if(range?.kind!=='endpoint')return null;
 const other=task.items[0].interval;
 if(!other)return null;
 return <div className="interval-endpoint" aria-label={range.edge==='start'?'Начало периода скрыто':'Конец периода скрыт'}><span className={range.edge==='start'?'is-hidden':''}>{range.edge==='start'?'?':other.start}</span><span aria-hidden="true">—</span><span className={range.edge==='end'?'is-hidden':''}>{range.edge==='end'?'?':other.end}</span></div>;
}
