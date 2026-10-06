import {useState} from 'react';
import type {Bundle} from '../../lib/engi/types';
import {packConflicts,type ConflictTable} from '../../lib/engi/knowledge/conflicts';
import {textValue} from '../../lib/engi/knowledge/properties';
import {resolvePackConflict} from '../../services/knowledge-service';
import {KnowledgeImage} from './KnowledgeImage';

export function ConflictResolver({bundle,onReload}:{bundle:Bundle;onReload:()=>Promise<void>}){
 const rows=packConflicts(bundle),[selected,setSelected]=useState<{table:ConflictTable;id:string}|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const conflict=rows.find(c=>c.table===selected?.table&&c.row.id===selected.id);
 if(!rows.length)return null;
 const label=(table:ConflictTable,row:any)=>table==='facts'?`${bundle.entities.find(e=>e.id===row.entityId)?.name??'Объект'} · ${bundle.properties?.find(p=>p.id===row.key)?.name??'Поле'}`:table==='media'?`Изображение · ${bundle.entities.find(e=>e.id===row.entityId)?.name??'Объект'}`:row.name;
 const version=(row:any)=>conflict?.table==='facts'?textValue(row,bundle):row.name??row.role??'Версия изображения';
 const typeName=(id:string)=>bundle.entityTypes?.find(t=>t.id===id)?.name??id;
 function details(row:any):[string,string][]{
  if(conflict?.table==='entities')return [['Тип',typeName(row.type)],['Другие названия',row.aliases?.join(', ')||'Нет']];
  if(conflict?.table==='facts')return [['Объект',bundle.entities.find(e=>e.id===row.entityId)?.name??row.entityId],['Поле',bundle.properties?.find(p=>p.id===row.key)?.name??row.key],['Проверка',({verified:'Проверено',direct:'Прямое подтверждение',user_confirmed:'Подтверждено лично',unverified:'Не проверено',ambiguous:'Неоднозначно',conflict:'Противоречие',rejected:'Отклонено'} as Record<string,string>)[row.verification]??row.verification],...(row.dateStart?[['Период',`${row.dateStart} — ${row.dateEnd??row.dateStart}`] as [string,string]]:[])];
  if(conflict?.table==='media')return [['Лицензия',row.license],['Основное',row.primary?'Да':'Нет'],['Для обучения',row.learningExemplar===false?'Нет':'Да'],['Источник изображения',row.sourceUrl??'Личное изображение']];
  if(conflict?.table==='tags')return [['Родительская подборка',bundle.tags.find(t=>t.id===row.parentId)?.name??'Нет']];
  if(conflict?.table==='entityTypes')return [['Множественное число',row.pluralName??'Не задано'],['Значок',row.icon??'Нет']];
  return [['Вид значения',({entity:'Связь с объектом',text:'Текст',number:'Число',date:'Дата',boolean:'Да / Нет'} as Record<string,string>)[row.valueKind]??row.valueKind],['Типы объектов',row.subjectTypes?.map(typeName).join(', ')||'Все'],['Типы ответов',row.targetTypes?.map(typeName).join(', ')||'Все'],['Обратная связь',row.inverse?.enabled?row.inverse.name??'Включена':'Выключена']];
 }
 async function resolve(choice:'mine'|'pack'){if(!conflict||busy)return;setBusy(true);setError('');try{await resolvePackConflict(conflict.table,conflict.row.id,choice);setSelected(null);await onReload()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <section className="panel"><h2>Ваши правки и обновления пакетов</h2><p className="muted">{rows.length} расхождений. Ваши изменения сохранены — выберите, какую версию оставить.</p><div className="conflict-list">{rows.map(c=><button className="button outline" key={c.table+c.row.id} onClick={()=>{setError('');setSelected({table:c.table,id:c.row.id})}}>{label(c.table,c.row)} <span>Сравнить →</span></button>)}</div>
 {conflict&&<div className="overlay"><section className="editor-panel" role="dialog" aria-modal="true" aria-label="Выбор версии"><div className="section-heading"><h2>{label(conflict.table,conflict.row)}</h2><button className="icon-button" aria-label="Закрыть сравнение" disabled={busy} onClick={()=>setSelected(null)}>×</button></div><div className="conflict-comparison">{[[conflict.row,'Ваша версия'],[conflict.upstream,'Версия пакета']].map(([row,name]:any)=><div key={name}><h3>{name}</h3>{conflict.table==='media'&&<KnowledgeImage src={row.url}/>}<p>{version(row)}</p><dl>{details(row).map(([field,value])=><div key={field}><dt>{field}</dt><dd>{value}</dd></div>)}</dl>{row.archived&&<small>В архиве</small>}{row.summary&&<p>{row.summary}</p>}{row.source&&<dl><dt>Источник</dt><dd>{row.source.name}</dd>{row.source.url&&<dd><a href={row.source.url} target="_blank" rel="noreferrer">Открыть источник ↗</a></dd>}</dl>}{conflict.table==='properties'&&<p>{row.learnable?'Участвует в обучении':'Без обучения'} · {row.cardinality==='many'?'Несколько значений':'Одно значение'}</p>}</div>)}</div>{error&&<p role="alert">{error}</p>}<div className="import-buttons"><button className="button outline" disabled={busy} onClick={()=>void resolve('mine')}>Оставить мою</button><button className="button primary" disabled={busy} onClick={()=>void resolve('pack')}>Принять из пакета</button></div><small>Если изменится значение факта, заново проверим только это знание. История ответов сохраняется.</small></section></div>}
 </section>;
}

