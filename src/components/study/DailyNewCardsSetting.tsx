import {useEffect,useState} from 'react';
import {MAX_NEW_CARDS_PER_DAY,validDailyLimit,type StudyPreferences} from '../../services/study-preferences-service';
export function DailyNewCardsSetting({preferences,save,loaded,onSaved}:{preferences:StudyPreferences;save:(next:StudyPreferences)=>Promise<void>;loaded:boolean;onSaved?:()=>Promise<void>}){
 const [value,setValue]=useState(String(preferences.newCardsPerDay)),[saving,setSaving]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{setValue(String(preferences.newCardsPerDay));},[preferences.newCardsPerDay]);
 async function submit(){
  const count=Number(value);if(!value.trim()||!validDailyLimit(count)){setMessage(`Укажите целое число от 0 до ${MAX_NEW_CARDS_PER_DAY}`);return;}
  setSaving(true);setMessage('');try{await save({...preferences,newCardsPerDay:count});await onSaved?.();setMessage('Сохранено');}catch(error){setMessage((error as Error).message);}finally{setSaving(false);}
 }
 return <div className="daily-new-setting"><label htmlFor="daily-new-cards">Новых карточек в день</label>
  <div className="daily-new-setting-controls"><input id="daily-new-cards" type="number" min="0" max={MAX_NEW_CARDS_PER_DAY} step="1" inputMode="numeric" value={value} disabled={!loaded||saving} aria-describedby="daily-new-help" onChange={e=>{setValue(e.target.value);setMessage('');}}/>
   <button type="button" className="button outline" disabled={!loaded||saving} onClick={()=>void submit()}>{saving?'Сохраняем…':'Сохранить'}</button></div>
  <small id="daily-new-help">Лимит общий для всех подборок. 0 — только повторения и разбор ошибок. Изменение действует сразу; уже пройденные сегодня карточки сохраняются в учёте.</small>
  {message&&<small role="status">{message}</small>}
 </div>;
}
