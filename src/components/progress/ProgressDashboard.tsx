import type {Snapshot} from '../../lib/engi/types';
import {progress} from '../../lib/engi/knowledge/progress';
import {todayLearning} from '../../lib/engi/knowledge/motivation';
import {canonicalTargets} from '../../lib/engi/questions/recipe-factory';
import {properties} from '../../lib/engi/knowledge/properties';
import {conflicts} from '../../services/knowledge-service';
import {saveBackup} from '../../services/backup-service';
import {ConflictResolver} from '../knowledge/ConflictResolver';
import {GoalProgressDashboard} from './GoalProgressDashboard';

export function ProgressDashboard({snapshot,onStudy,onReload}:{snapshot:Snapshot;onStudy:()=>void;onReload:()=>Promise<void>}){
 if(snapshot.goalCatalog)return <GoalProgressDashboard snapshot={snapshot} onStudy={onStudy} onReload={onReload}/>;
 const s=snapshot,p=progress(s),today=todayLearning(s),b=s.bundle,targets=canonicalTargets(b),problem=conflicts(b);
 const targetById=new Map(targets.map(t=>[t.targetId,t]));
 return <><div className="page-heading"><h1>Что остаётся в памяти?</h1><button className="button outline" onClick={()=>void saveBackup()}>Сохранить копию</button></div>
 <div className="stat-strip">{[['Охват',`${p.covered} / ${p.total}`],['Помню сейчас',p.retention===null?'—':p.retention+'%'],['Пора повторить',p.due],['Сегодня проверено',today.retrievals]].map(([label,n])=><div key={label}><span>{label}</span><strong key={String(n)}>{n}</strong></div>)}</div>
 <p>Активных знаний: {p.total} · Ещё не открыто: {p.new} · Отложено ★: {p.suspended}</p>
 <div className="stability-strip">{[[7,p.week],[30,p.month],[90,p.quarter]].map(([days,n])=><div key={days}><strong key={n}>{n}</strong><span>Закреплено ≥{days} дней</span></div>)}</div>
 {today.stability30Gains>0&&<p className="today-learning">Сегодня укреплено: +{today.stability30Gains} знаний ≥30 дней</p>}
 <div className="progress-layout"><section className="panel"><h2>По подборкам</h2>{b.tags.filter(t=>!t.archived).map(t=>{const v=progress(s,t.id);return <div className="category-row" key={t.id}><strong>{t.name}</strong><span>{v.covered} / {v.total}</span><span>Помню {v.retention??'—'}%</span></div>})}<small>Горизонт памяти — расчёт по вашим ответам. Проверки будут уточнять его.</small></section>
 <section className="panel"><h2>По полям</h2>{properties(b).filter(prop=>targets.some(i=>b.facts.find(f=>f.id===i.factId)?.key===prop.id)).map(prop=>{const ids=new Set(targets.filter(i=>b.facts.find(f=>f.id===i.factId)?.key===prop.id).map(i=>i.targetId));return <div className="review-row" key={prop.id}><strong>{prop.name}</strong><span>{s.memories.filter(m=>ids.has(m.id)&&m.status!=='suspended'&&m.attempts>0).length} / {s.memories.filter(m=>ids.has(m.id)&&m.status!=='suspended').length}</span></div>})}</section></div>
 <section className="panel"><h2>Что путается</h2>{s.memories.filter(m=>targetById.has(m.id)&&Object.values(m.confusions).some(n=>n>.1)).slice(0,20).map(m=>{const t=targetById.get(m.id)!;return <div className="review-row" key={m.id}><strong>{t.name}</strong><span>{Object.entries(m.confusions).filter(([,n])=>n>.1).map(([id])=>`${t.answer} ↔ ${b.entities.find(e=>e.id===id)?.name??id}`).join(' · ')}</span></div>})}<button className="button outline" onClick={onStudy}>Различить похожее</button></section>
 <ConflictResolver bundle={b} onReload={onReload}/>
 <section className="panel"><h2>Качество знаний</h2><p>{problem.length} фактов с неоднозначным ответом</p>{problem.slice(0,10).map(f=><p key={f.id}>{b.entities.find(e=>e.id===f.entityId)?.name} · {properties(b).find(p=>p.id===f.key)?.name}</p>)}<small>Неоднозначные факты исключены из вопросов с одним ответом.</small></section>
 <section className="panel"><h2>Последние проверки</h2>{s.events.filter(e=>e.payload.feedback).slice(0,20).map(e=><div className="history-row" key={e.id}><span>{e.payload.score===1?'✓':'✕'}</span><span>{e.payload.feedback.items?.[0]?.name??'Проверка'}</span><span>{e.payload.reason==='retry'?'Уточнение после ошибки':e.level==='direct'?'Воспоминание':'Связи'}{e.payload.metadata?.attemptCount>1?` · ${e.payload.metadata.attemptCount} попытки`:''}</span><time>{new Date(e.timestamp).toLocaleString('ru-RU')}</time></div>)}</section></>;
}
