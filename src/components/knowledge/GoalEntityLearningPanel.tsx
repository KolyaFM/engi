import {useState} from 'react';
import type {Snapshot} from '../../lib/engi/types';
import {setUnitSuspended} from '../../services/learning-service';
import {goalRetention} from '../../lib/engi/knowledge/goal-progress';
export function GoalEntityLearningPanel({entityId,snapshot:s,onReload}:{entityId:string;snapshot:Snapshot;onReload:()=>void}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const entries=s.goalCatalog!.filter(e=>e.entityIds.includes(entityId)),mem=new Map(s.goalMemories?.map(m=>[m.goalId,m]));
 if(!entries.length)return null;
 async function toggle(ids:string[],suspended:boolean){if(busy)return;setBusy(true);setError('');try{for(const id of ids)await setUnitSuspended(id,!suspended);onReload();}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <section className="entity-learning" aria-label="Обучение по свойствам"><h3>Обучение по свойствам</h3><p>Узнавание и воспроизведение учитываются отдельно.</p>
 {entries.map(e=>{const m=mem.get(e.goal.id),property=s.bundle.properties?.find(p=>p.id===e.propertyId)?.name??'Имя',skill=e.goal.skill==='recall'?'Воспроизведение · самоотчёт':'Узнавание';return <div className="panel" key={e.goal.id}>
  <strong>{property} · {e.goal.knowledge.kind==='complete-set'?'полный набор':skill}{e.goal.direction==='reverse'?' · обратное направление':''}</strong>
  <p>{e.suspended?'★ Не учу':!m?'Нужна первая проверка':m.lastCorrect===false||m.independentSuccesses===0?'Нужно укрепить':Number(m.card.state)<2?'Учусь':'Повторяю'}</p>
  {m&&<><p>Самостоятельных проверок: {m.independentAttempts} · ошибок: {m.independentAttempts-m.independentSuccesses}</p><p>Следующая проверка: {e.suspended?'не запланирована':new Date(m.card.due).toLocaleString('ru-RU')}</p><p>Устойчивость: {Number(m.card.stability).toFixed(1)} дн. · расчётная память: {Math.round(goalRetention(m)*100)}%</p></>}
  <button className="button outline" disabled={busy} onClick={()=>void toggle(e.targetIds,e.suspended)}>{e.suspended?'Вернуть в обучение':'★ Не учить'}</button>
 </div>})}{error&&<p role="alert">{error}</p>}</section>;
}
