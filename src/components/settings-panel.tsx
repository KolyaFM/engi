import {useEffect,useState} from 'react';
import {db,type PackRow} from '../db/engi-db';
import {storageHealth,protectStorage} from '../services/storage-health';
import {saveBackup} from '../services/backup-service';
import {toast} from 'sonner';
import {useStudyPreferences} from './study/useStudyPreferences';
import {DailyNewCardsSetting} from './study/DailyNewCardsSetting';
import {resetLearningProgress,clearAllData} from '../services/learning-service';

export function SettingsPanel({revision,onImport,onRestore,onPreferencesSaved}:{revision:number;onImport:()=>void;onRestore:()=>void;onPreferencesSaved?:()=>Promise<void>}){
 const [busy,setBusy]=useState(false);
 async function handleReset(){
  if(!window.confirm('Сбросить весь прогресс обучения? Это действие удалит карточки памяти, историю повторений и активные сессии. Сами знания и объекты останутся нетронутыми.'))return;
  setBusy(true);
  try{
   await resetLearningProgress();
   toast.success('Прогресс обучения сброшен');
   if(typeof window!=='undefined'&&typeof window.location?.reload==='function')window.location.reload();
  }catch(e){
   toast.error((e as Error).message);
  }finally{
   setBusy(false);
  }
 }
 async function handleClearAll(){
  if(!window.confirm('Удалить ВСЕ данные? Это действие безвозвратно удалит все объекты, факты, колоды, изображения, установленные пакеты и историю обучения. Восстановить данные можно будет только из копии .engi-backup. Продолжить?'))return;
  setBusy(true);
  try{
   await clearAllData();
   toast.success('Все данные удалены');
   if(typeof window!=='undefined'&&typeof window.location?.reload==='function')window.location.reload();
  }catch(e){
   toast.error((e as Error).message);
  }finally{
   setBusy(false);
  }
 }
 return <>
  <BaseSettingsPanel revision={revision} onImport={onImport} onRestore={onRestore} onPreferencesSaved={onPreferencesSaved}/>
  <section className="panel storage-panel" style={{marginTop:'20px'}}>
   <h2>Сброс прогресса</h2>
   <p className="muted" style={{margin:'8px 0 16px',fontSize:'14px',color:'#697886'}}>
    Сбрасывает все карточки памяти, FSRS-расписание, историю ответов и дневной бюджет. Объекты, связи и изображения сохраняются.
   </p>
   <button type="button" className="button destructive" disabled={busy} onClick={handleReset} style={{minHeight:'44px',background:'#c74744',color:'#fff',borderColor:'#c74744'}}>
    {busy?'Сбрасываем…':'Сбросить прогресс обучения'}
   </button>
  </section>
  <section className="panel storage-panel" style={{marginTop:'20px'}}>
   <h2>Очистить все данные</h2>
   <p className="muted" style={{margin:'8px 0 16px',fontSize:'14px',color:'#697886'}}>
    Полностью удаляет все объекты, связи, изображения, установленные пакеты и прогресс обучения. База данных вернётся к исходному пустому состоянию.
   </p>
   <button type="button" className="button destructive" disabled={busy} onClick={handleClearAll} style={{minHeight:'44px',background:'#c74744',color:'#fff',borderColor:'#c74744'}}>
    {busy?'Удаляем…':'Очистить все данные'}
   </button>
  </section>
 </>;
}

function BaseSettingsPanel({revision,onImport,onRestore,onPreferencesSaved}:{revision:number;onImport:()=>void;onRestore:()=>void;onPreferencesSaved?:()=>Promise<void>}){
 const {preferences,save,loaded}=useStudyPreferences();
 const [health,setHealth]=useState<Awaited<ReturnType<typeof storageHealth>>>();const [packs,setPacks]=useState<PackRow[]>([]);
 async function refresh(){try{setHealth(await storageHealth());setPacks(await db.installedPacks.toArray())}catch(e){toast.error((e as Error).message)}}
 useEffect(()=>{refresh()},[revision]);const mb=(n:number)=>`${Math.round(n/1024/1024)} МБ`;
 return <><section className="panel study-preferences"><h2>Практика</h2><DailyNewCardsSetting preferences={preferences} save={save} loaded={loaded} onSaved={onPreferencesSaved}/><label className="check-label"><input type="checkbox" checked={preferences.sound} onChange={async e=>{try{await save({...preferences,sound:e.target.checked})}catch(error){toast.error((error as Error).message)}}}/>Тихий звук верного ответа</label><label className="check-label"><input type="checkbox" checked={preferences.accessibleRecall} onChange={async e=>{try{await save({...preferences,accessibleRecall:e.target.checked})}catch(error){toast.error((error as Error).message)}}}/>Компактные кнопки вместо свайпа для воспоминания</label><small>Ответ открывается через 5 секунд или по кнопке «Показать сейчас». Оценка доступна после раскрытия. Звук по умолчанию выключен.</small></section><section className="panel"><div className="section-heading"><h2>Наборы</h2><button className="button primary" onClick={onImport}>Импортировать пакет</button></div>{packs.length?packs.map(p=><div className="review-row" key={p.packId}><div><h3>{p.name}</h3><p className="muted">v{p.packVersion} · {p.entityIds.length} объектов · {p.factIds.length} фактов · {p.files.length} изображений</p></div></div>):<p className="muted">Пока нет наборов знаний. Выберите файл .engi из папки на ПК или приложения «Файлы».</p>}</section><section className="panel storage-panel"><h2>Хранилище</h2>{health&&<><dl><div><dt>Локальные данные</dt><dd>{health.persisted?'Защищены браузером':'Обычный режим'}</dd></div><div><dt>Использовано</dt><dd>{mb(health.usage)}</dd></div><div><dt>Доступно примерно</dt><dd>{health.quota?mb(Math.max(0,health.quota-health.usage)):'Браузер не сообщил'}</dd></div><div><dt>Пакетов</dt><dd>{health.packs}</dd></div><div><dt>Событий истории</dt><dd>{health.reviews}</dd></div><div><dt>Последняя копия</dt><dd>{health.lastBackupAt?new Date(health.lastBackupAt).toLocaleString('ru-RU'):'Ещё не сохранена'}</dd></div></dl>{health.backupNeeded&&<p className="backup-reminder">Прогресс давно не сохранялся. Сохраните копию в «Файлы» или на другой диск.</p>}<div className="import-buttons"><button className="button primary" onClick={async()=>{try{await saveBackup();await refresh()}catch(e){toast.error((e as Error).message)}}}>Сохранить резервную копию</button><button className="button outline" onClick={onRestore}>Восстановить из копии</button>{!health.persisted&&<button className="button outline" onClick={async()=>{try{const result=await protectStorage();toast.info(result?'Хранилище защищено':'Браузер не предоставил защиту. Используйте резервные копии.');refresh()}catch(e){toast.error((e as Error).message)}}}>Защитить локальные данные</button>}</div><p className="muted">Данные находятся на этом устройстве. Резервная копия сохраняет прогресс, настройки, личные знания, правки и свои изображения. Изображения из пакетов восстановите повторным импортом .engi. Очистка данных сайта удаляет локальное хранилище даже при включённой защите.</p></>}</section></>
}

