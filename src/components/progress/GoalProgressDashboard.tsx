import type {Snapshot} from '../../lib/engi/types';
import {progress} from '../../lib/engi/knowledge/progress';
import {summarizeGoals} from '../../lib/engi/knowledge/goal-progress';
import type {createDeckTargetIndex} from '../../services/deck-overview';
import {todayLearning} from '../../lib/engi/knowledge/motivation';
import {saveBackup} from '../../services/backup-service';
import {ConflictResolver} from '../knowledge/ConflictResolver';
import {properties} from '../../lib/engi/knowledge/properties';
import {DayPlanPanel} from '../study/DayPlanPanel';
export function GoalProgressDashboard({snapshot:s,targetIndex,onStudy,onReload}:{snapshot:Snapshot;targetIndex:ReturnType<typeof createDeckTargetIndex>;onStudy:()=>void;onReload:()=>Promise<void>}){
 const p=progress(s),today=todayLearning(s);
 return <><div className="page-heading"><h1>Статистика</h1><button className="button outline" onClick={()=>void saveBackup()}>Сохранить копию</button></div>
 <div className="stat-strip">{[['Проверено целей',`${p.covered} / ${p.total}`],['Оценка памяти',p.retention===null?'—':p.retention+'%'],['Пора повторить',p.due],['Сегодня проверок',today.retrievals]].map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
 <DayPlanPanel plan={s.dayPlan} onExpired={()=>void onReload()}/>
 <p>Узнавание и воспроизведение — отдельные цели. Полный набор считается одной целью. Проверенная цель может требовать укрепления после ошибки.</p>
 <p>Без первой проверки: {p.new} · Отключено: {p.suspended}</p>
 <div className="stability-strip">{[[7,p.week],[30,p.month],[90,p.quarter]].map(([days,n])=><div key={days}><strong>{n}</strong><span>Устойчивость ≥{days} дней</span></div>)}</div>
 <div className="progress-layout"><section className="panel"><h2>По способу проверки</h2>{(['recognition','recall'] as const).map(skill=>{const v=summarizeGoals(s,s.goalCatalog!.filter(e=>e.goal.skill===skill));return <div className="category-row" key={skill}><strong>{skill==='recall'?'Воспроизведение · самоотчёт':'Узнавание · ответ с вариантами'}</strong><span>{v.covered} / {v.total} проверено</span><span>Повторить: {v.due}</span></div>})}<small>Оценка памяти рассчитана по ответам. Самоотчёт не является объективной проверкой воспроизведения.</small></section>
 <section className="panel"><h2>По полям</h2>{properties(s.bundle).map(prop=>{const entries=s.goalCatalog!.filter(e=>e.propertyId===prop.id);if(!entries.length)return null;const v=summarizeGoals(s,entries);return <div className="category-row" key={prop.id}><strong>{prop.name}</strong><span>{v.covered} / {v.total} целей</span></div>})}</section></div>
 <section className="panel"><h2>По подборкам</h2>{(s.bundle.decks??[]).filter(d=>!d.archived).map(d=>{const targets=targetIndex.targetsFor([d.id]),v=summarizeGoals(s,s.goalCatalog!.filter(e=>e.targetIds.every(id=>targets.has(id))));return <div className="category-row" key={d.id}><strong>{d.name}</strong><span>{v.covered} / {v.total} целей</span></div>})}<button className="button outline" onClick={onStudy}>Продолжить повторение</button></section>
 <ConflictResolver bundle={s.bundle} onReload={onReload}/>
 <section className="panel"><h2>Последние проверки</h2>{s.events.filter(e=>e.payload.memoryModel==='goals').slice(0,20).map(e=><div className="history-row" key={e.id}><span>{e.payload.score===1?'✓':'✕'}</span><span>{e.payload.feedback?.items?.[0]?.name??'Проверка'}</span><span>{e.payload.targets?.some((t:{independent:boolean})=>t.independent)?'Самостоятельная проверка':'Практика без зачёта'}{e.payload.metadata?.completion==='abandoned'?' · исправление не завершено':''}</span><time>{new Date(e.timestamp).toLocaleString('ru-RU')}</time></div>)}</section></>;
}
