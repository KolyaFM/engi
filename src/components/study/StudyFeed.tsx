import {MultiChoiceCard} from './MultiChoiceCard';
import {MappingCard} from './MappingCard';
import {MatchingPairsCard} from './MatchingPairsCard';
import {useStudyVisibility} from './useStudyVisibility';
import {DayPlanPanel} from './DayPlanPanel';
import {dayPlanSummary,type GoalDayPlan} from '../../lib/engi/study-core/day-plan';
import {useEffect,useRef,useState} from 'react';
import type {SessionRow,InteractionDraft} from '../../db/engi-db';
import {trainerService} from '../../services/trainer-service';
import {isDiscrete,isMapping,discreteAnswer} from '../../lib/engi/questions/timeline';
import {KnowledgeImage} from '../knowledge/KnowledgeImage';
import {mediaStore} from '../../media/media-store';
import {ChoiceCard} from './ChoiceCard';
import {RecallRevealCard} from './RecallRevealCard';
import {TimelineCard} from './TimelineCard';
import {SortChallengeCard} from './SortChallengeCard';
import {playSuccess,useReducedMotion,useStudyPreferences} from './useStudyPreferences';
import './study-feed.css';
import {ObjectIntroCard} from './ObjectIntroCard';
import {StopStudyCard} from './StopStudyCard';
import {getBundle} from '../../db/repositories';
import {db} from '../../db/engi-db';
import type {Bundle,Familiarity} from '../../lib/engi/types';
import {feedSpan,measureFeed} from '../../services/feed-performance';

const delay=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));

export function StudyFeed({initial,onExit}:{initial:SessionRow;onExit:()=>void}){
 const [introBundle,setIntroBundle]=useState<Bundle|null>(null);
 const [dayPlan,setDayPlan]=useState<GoalDayPlan>();
 const [session,setSession]=useState(initial),[feedback,setFeedback]=useState<any>(null),[storedDraft,setDraft]=useState<InteractionDraft|undefined>(initial.interaction);
 const [state,setState]=useState<'loading'|'ready'|'saving'|'feedback'|'exiting'>('loading'),[error,setError]=useState(''),[imageFailed,setImageFailed]=useState(false),[mediaReady,setMediaReady]=useState(false);
 const [details,setDetails]=useState(false),[headerHelp,setHeaderHelp]=useState(false),[reportText,setReportText]=useState(''),[notice,setNotice]=useState(''),[challengeIntro,setChallengeIntro]=useState(false);
 const {preferences}=useStudyPreferences(),reduced=useReducedMotion();
 const task=session.tasks[session.currentPosition],sessionRef=useRef(session),lock=useRef(false),advancing=useRef(false),alive=useRef(true),started=useRef(Date.now());
 // A new card mounts before the task-change effect clears the previous draft.
 const draft=storedDraft?.taskId===task?.id?storedDraft:undefined;
 const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),introTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),noticeTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),touch=useRef<number|null>(null);
 const writes=useRef<Promise<unknown>>(Promise.resolve());sessionRef.current=session;
 const detailsRef=useRef(details);detailsRef.current=details||headerHelp;
 const matchingResult=useRef<Awaited<ReturnType<typeof trainerService.answerMatchPair>>|undefined>(undefined);
 const cardLoadEnd=useRef<(()=>void)|undefined>(undefined);
 const cardLoadReadyTask=useRef<string|undefined>(undefined);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;clearTimeout(timer.current);clearTimeout(introTimer.current);clearTimeout(noticeTimer.current)}},[]);

 function showNotice(text:string){setNotice(text);clearTimeout(noticeTimer.current);noticeTimer.current=setTimeout(()=>setNotice(''),1600)}
 async function loadDayPlan(expired=false){if(session.memoryModel!=='goals')return;const p=await trainerService.getDayPlan(session.tag,session.format??'mixed');if(alive.current)setDayPlan(p);}
 useEffect(()=>{void loadDayPlan().catch(visibilityError)},[session.id,task?.id,session.exhausted,session.intro?.entityId]);
 function scheduleNext(f:any){
  clearTimeout(timer.current);
  if(detailsRef.current)return;
  if(isMapping(task)&&!f.invalidContent&&!f.matchingComplete)return;
  const auto=f.invalidContent||f.matchingComplete||isDiscrete(task)||task.recipe.format==='recall_reveal'||f.score===1;
  if(!auto)return;
  const hold=f.encoding?1600:f.repairResolved?600:f.score===1?320:480;
  timer.current=setTimeout(()=>{void advance()},Math.max(0,hold-(reduced?0:180)));
 }
 useEffect(()=>{if(!details&&!headerHelp&&feedback)scheduleNext(feedback);else if(headerHelp)clearTimeout(timer.current)},[details,headerHelp]);
 useEffect(()=>{
  let valid=true;cardLoadEnd.current?.();cardLoadReadyTask.current=undefined;cardLoadEnd.current=feedSpan('ui.cardLoad');clearTimeout(timer.current);lock.current=false;advancing.current=false;started.current=Date.now();setState('loading');setFeedback(null);setError('');setImageFailed(false);setDetails(false);
  setDraft(session.interaction?.taskId===task?.id?session.interaction:undefined);
  setMediaReady(task?.recipe.cue!=='image'||!task.items[0]?.image);setChallengeIntro(!!task?.recipe.diagnostic);
  clearTimeout(introTimer.current);if(task?.recipe.diagnostic)introTimer.current=setTimeout(()=>setChallengeIntro(false),500);
  if(!task)setState('ready');if(session.intro)void getBundle(db).then(setIntroBundle).catch(e=>setError(e.message));
  if(task)trainerService.getFeedback(task.id).then(f=>{if(!valid)return;cardLoadReadyTask.current=task.id;if(f){lock.current=true;setState('feedback');setFeedback(f);scheduleNext(f)}else setState('ready')}).catch(e=>{if(valid){setError(e.message);setState('ready')}});
  void trainerService.preloadMedia(session.id).then(urls=>mediaStore.prewarm(urls)).catch(()=>{});
  return()=>{valid=false;cardLoadEnd.current?.();cardLoadEnd.current=undefined;clearTimeout(timer.current);clearTimeout(introTimer.current)};
 },[task?.id,session.intro?.unitIds.join('|'),session.exhausted]);

 function observe(phase:'question'|'feedback'|'matched-pairs'|'answer-reveal'|'early-answer'|'details'|'source',episode:string,event:'start'|'refresh'|'end'){
  if(!task)return Promise.resolve();const id=task.id,sid=session.id;
  const write=writes.current.catch(()=>{}).then(()=>trainerService.observeVisibility(sid,id,phase,episode,event));writes.current=write;return write;
 }
 const visibilityError=(e:Error)=>{if(alive.current)setError(e.message)};
 const rendered=!!task&&state!=='loading'&&state!=='exiting'&&!imageFailed&&mediaReady&&!feedback?.invalidContent;
 useEffect(()=>{if(rendered&&cardLoadReadyTask.current===task?.id||!task){cardLoadEnd.current?.();cardLoadEnd.current=undefined;}},[rendered,task?.id]);
 useStudyVisibility(task?.id+':question',rendered&&!details,(id,event)=>observe('question',id,event),visibilityError);
 const answerPhase=task?.recipe.format==='recall_reveal'?(draft?.earlyReveal?'early-answer':'answer-reveal'):'feedback';
 const answerVisible=rendered&&!details&&(task?.recipe.format==='recall_reveal'?!!draft?.revealed:!!feedback&&!feedback.invalidContent);
 useStudyVisibility(task?.id+':'+answerPhase,answerVisible,(id,event)=>observe(answerPhase,id,event),visibilityError);
 const matchedKeys=Object.keys(draft?.matching?.matched??{}).sort().join('|');
 useStudyVisibility(task?.id+':matched:'+matchedKeys,rendered&&!details&&!!matchedKeys&&!feedback,(id,event)=>observe('matched-pairs',id,event),visibilityError);
 useStudyVisibility(session.intro?'intro:'+session.id+':'+session.intro.entityId+':'+session.intro.unitIds.join('|'):undefined,!!session.intro&&!!introBundle,(id,event)=>{
  const sid=session.id,write=writes.current.catch(()=>{}).then(()=>trainerService.observeIntroVisibility(sid,id,event));writes.current=write;return write;
 },visibilityError);
 useStudyVisibility(task?.id+':details',!!task&&details,(id,event)=>observe('details',id,event),visibilityError);

 function persist(delta:Partial<InteractionDraft>):Promise<void>{
  const id=task.id,sid=session.id;
  const write=writes.current.catch(()=>{}).then(()=>trainerService.saveInteraction(sid,id,delta));writes.current=write;
  return write.then(next=>{if(alive.current&&sessionRef.current.tasks[sessionRef.current.currentPosition]?.id===id){setDraft(next);if(delta.revealed)setError('')}}).catch(e=>{if(alive.current&&sessionRef.current.tasks[sessionRef.current.currentPosition]?.id===id)setError(e.message);throw e});
 }
 async function advance(skip=false){
  if(advancing.current)return;advancing.current=true;clearTimeout(timer.current);setState('exiting');
  const current=sessionRef.current,currentTask=current.tasks[current.currentPosition];
  try{await measureFeed('ui.advance.writeQueue',()=>writes.current.catch(()=>{}));const [next]=await Promise.all([trainerService.advanceFeed(current.id,skip,currentTask?.id),reduced?Promise.resolve():delay(180)]);if(!alive.current)return;setSession(next);
   if(next.exhausted||next.intro)setState('ready');
  }catch(e){if(alive.current){setError((e as Error).message);setState(feedback?'feedback':'ready')}}finally{advancing.current=false}
 }
 async function submit(value:any){
  if(lock.current||!task||imageFailed||!mediaReady||state!=='ready'||details||headerHelp||challengeIntro)return;
  lock.current=true;setState('saving');setError('');
  const previous=draft;
  if(isDiscrete(task)&&value!==discreteAnswer(task))setDraft({taskId:task.id,attemptSequence:[...new Set([...(draft?.attemptSequence??[]),value])]});
  const end=feedSpan('ui.submit');
  try{await measureFeed('ui.answer.writeQueue',()=>writes.current);const result=await trainerService.answer({sessionId:session.id,taskId:task.id,answer:value,latencyMs:Date.now()-started.current});if(!alive.current)return;void loadDayPlan().catch(visibilityError);
   if(result.pending){setDraft(result.interaction);setState('ready');lock.current=false;return}
   setFeedback(result.feedback);setState('feedback');
   if(result.feedback.score===1){playSuccess(preferences.sound);try{navigator.vibrate?.(10)}catch{}}
   if(result.feedback.mistakeResolved)showNotice(result.feedback.mistakeResolved>1?'Ошибки разобраны':'Ошибка разобрана');else if(result.milestone)showNotice(result.milestone);scheduleNext(result.feedback);
  }catch(e){if(alive.current){setDraft(previous);setError((e as Error).message);setState('ready');lock.current=false}}finally{end();}
 }
 async function submitPair(pair:{entityId:string;answerId:string},requestId:string){
  if(lock.current||!task||busy||imageFailed)throw Error('Проверка уже выполняется');
  lock.current=true;setState('saving');setError('');
  try{
   await writes.current;
   const result=await trainerService.answerMatchPair({sessionId:session.id,taskId:task.id,...pair,requestId});
   if(alive.current){setDraft(result.interaction);matchingResult.current=result;setState('ready');void loadDayPlan().catch(visibilityError);
    if(result.correct){playSuccess(preferences.sound);try{navigator.vibrate?.(10)}catch{}}
    if(result.mistakeResolved)showNotice('Ошибка разобрана');else if(result.milestone)showNotice(result.milestone);
    if(result.feedback?.invalidContent){setFeedback(result.feedback);setState('feedback');scheduleNext(result.feedback)}
   }
   return result;
  }catch(e){if(alive.current){setError((e as Error).message);setState('ready')}throw e}
  finally{lock.current=false}
 }
 function completeMatching(){const result=matchingResult.current;if(!result?.complete||!alive.current)return;lock.current=true;setFeedback(result.feedback);setState('feedback');scheduleNext(result.feedback)}
 async function exit(){if(state==='saving'||state==='exiting')return;clearTimeout(timer.current);setState('saving');try{await writes.current.catch(()=>{});onExit()}catch(e){setError((e as Error).message);setState('ready')}}

 const busy=state!=='ready'||challengeIntro||details||headerHelp||!mediaReady;
 const cue=<div className="feed-cue">{task?.recipe.format==='missing'?<ol className="feed-sequence">{task.sequence?.map((i,n)=><li key={n}>{i?.name??'?'}</li>)}</ol>:task?.recipe.format==='sort'?<span className="challenge-mark" aria-hidden="true">↕</span>:task?.recipe.cue==='image'&&task.items[0].image?<KnowledgeImage src={task.items[0].image} alt="Изображение для вопроса" onReady={()=>setMediaReady(true)} onFail={()=>setImageFailed(true)}/>:<h1>{task?.items[0].name}</h1>}</div>;
 async function introChoose(id:string,color:Familiarity){setState('saving');try{setSession(await trainerService.saveIntroSelection(session.id,id,color))}finally{setState('ready')}}
 async function introBatch(selections:Record<string,Familiarity>){setState('saving');try{setSession(await trainerService.saveIntroSelections(session.id,selections))}finally{setState('ready')}}
 async function introDone(){setState('saving');setError('');try{setSession(await trainerService.completeIntro(session.id))}catch(e){setError((e as Error).message)}finally{setState('ready')}}
 async function more(practice=false){if(advancing.current)return;advancing.current=true;setState('saving');setError('');try{setSession(await trainerService.openMore(session.id,practice))}catch(e){setError((e as Error).message)}finally{advancing.current=false;setState('ready')}}
 async function refresh(){if(advancing.current)return;advancing.current=true;setState('saving');setError('');try{setSession(await trainerService.refreshGoalFeed(session.id))}catch(e){setError((e as Error).message)}finally{advancing.current=false;setState('ready')}}
 async function retryMistakes(){setState('saving');setError('');try{setSession(await trainerService.retryUnavailableMistakes(session.id));await loadDayPlan()}catch(e){setError((e as Error).message)}finally{setState('ready')}}
 if(session.intro)return introBundle?<ObjectIntroCard key={session.intro.entityId} intro={session.intro} bundle={introBundle} onChoose={introChoose} onChooseAll={introBatch} onDone={()=>void introDone()} onExit={()=>void exit()} busy={state==='saving'} error={error}/>:<main className="study-feed"><p>Готовим знакомство…</p></main>;
 if(session.exhausted)return <><DayPlanPanel plan={dayPlan} onExpired={()=>void loadDayPlan(true).catch(visibilityError)}/><StopStudyCard newCardsPerDay={preferences.newCardsPerDay} unavailableMistakes={dayPlan?.unavailableMistakes??0} mistakes={dayPlan?.mistakes?.length??0} dailyPending={dayPlan?!dayPlanSummary(dayPlan).completed:false} waitingUntil={session.waitingUntil} onRetryMistakes={session.memoryModel==='goals'?()=>void retryMistakes():undefined} onRefresh={session.memoryModel==='goals'?()=>void refresh():undefined} onMore={()=>void more()} onPractice={()=>void more(true)} onExit={()=>void exit()} busy={state==='saving'} error={error}/></>;
 const prompt=task?.recipe.prompt??task?.recipe.label??'Вспомните ответ';
 return <main className={`study-feed state-${state}`}><header className="feed-header"><button className="icon-button" aria-label="Выйти из практики" disabled={state==='saving'||state==='exiting'} onClick={()=>void exit()}>×</button><DayPlanPanel inline onHelpChange={setHeaderHelp} plan={dayPlan} onExpired={()=>void loadDayPlan(true).catch(visibilityError)}/><button className="icon-button" aria-label="Подробнее о вопросе" disabled={state==='saving'||state==='exiting'} onClick={()=>{clearTimeout(timer.current);setDetails(true)}}>···</button></header>
 <div className="feed-viewport"><div className="feed-current" key={task?.id} data-task-id={task?.id}
  onPointerDown={e=>{if(!(e.target as HTMLElement).closest('button,input,.recall-swipe'))touch.current=e.clientY}}
  onPointerUp={e=>{if(touch.current!==null&&touch.current-e.clientY>65&&feedback&&task.recipe.diagnostic&&!['saving','exiting'].includes(state))void advance();touch.current=null}}>
  {(state==='loading'||!mediaReady)&&!imageFailed&&<p className="feed-game-status" role="status">Готовим вопрос…</p>}
  {task?.reason==='game'&&<p className="feed-game-status">{task.recipe.diagnostic?'Разминка':dayPlan&&(dayPlan.dailyTarget??dayPlan.newTarget)>0&&dayPlan.newGoalIds.length>=(dayPlan.dailyTarget??dayPlan.newTarget)?'План нового выполнен · играем дальше':'Играем и закрепляем'}</p>}
  <div className="feed-task-content" hidden={state==='loading'||!mediaReady}>
  {feedback?.invalidContent?<div className="feed-question"><p role="status">Содержание изменилось. Подготовим другой вопрос.</p></div>:task&&(isMapping(task)?<div className="feed-question">{task.memoryModel!=='goals'&&<h2>{prompt}</h2>}{task.memoryModel==='goals'?<MatchingPairsCard key={task.id} task={task} progress={draft?.matching} busy={busy} onPair={submitPair} onComplete={completeMatching} onMediaReady={setMediaReady} onMediaFail={()=>setImageFailed(true)}/>:<MappingCard key={task.id} task={task} initial={draft?.mapping} feedback={feedback} busy={busy} onPersist={mapping=>{void persist({mapping}).catch(()=>{})}} onSubmit={v=>void submit(v)} onNext={()=>void advance()} onMediaReady={setMediaReady} onMediaFail={()=>setImageFailed(true)}/>}</div>:task.recipe.format==='recall_reveal'?<RecallRevealCard task={task} cue={cue} draft={draft} paused={details||headerHelp||!mediaReady||imageFailed||state==='loading'} busy={state!=='ready'||headerHelp} reducedMotion={reduced} accessible={preferences.accessibleRecall} onPersist={persist} onSubmit={v=>void submit(v)}/>:
   <div className="feed-question">{cue}<div className="feed-actions"><h2>{prompt}</h2>{task.recipe.format==='multi_choice'?<MultiChoiceCard key={task.id} task={task} feedback={feedback} busy={busy} onSubmit={v=>void submit(v)} onNext={()=>void advance()}/>:isDiscrete(task)?<ChoiceCard task={task} attempts={draft?.attemptSequence??[]} feedback={feedback} busy={busy} onChoose={v=>void submit(v)}/>:task.recipe.format==='timeline'?<TimelineCard task={task} initialValue={draft?.timelineValue} feedback={feedback} busy={state==='saving'||state==='exiting'||state==='loading'||challengeIntro} onPersist={v=>{void persist({timelineValue:v}).catch(()=>{})}} onSubmit={v=>void submit(v)} onNext={()=>void advance()}/>:<SortChallengeCard task={task} initialOrder={draft?.sortOrder} feedback={feedback} busy={state==='saving'||state==='exiting'||state==='loading'||challengeIntro} onPersist={v=>{void persist({sortOrder:v}).catch(()=>{})}} onSubmit={v=>void submit(v)} onNext={()=>void advance()}/>}</div></div>)}
  </div>
  {feedback?.encoding&&<div className="encoding-moment" role="status"><strong>{task.items[0].name}</strong><span>{task.recipe.label} → {task.items[0].answer}</span>{task.items[0].summary&&<p>{task.items[0].summary.split(/(?<=[.!?])\s+/).slice(0,2).join(' ')}</p>}<small>Вернёмся к этому чуть позже</small></div>}
  {feedback?.repairResolved&&<div className="repair-closure" role="status">Разобрано ✓</div>}
  <span className="sr-only" role="status" aria-live="polite">{feedback?(feedback.invalidContent?'Вопрос пропущен без оценки':feedback.score===1?'Верно':'Связь уточнена'):draft?.attemptSequence.length?'Этот вариант не подходит. Попробуйте другой.':''}</span>
  {challengeIntro&&<div className="challenge-intro" aria-live="polite"><span>Проверим связи</span><strong>{task.recipe.format==='sort'?'Порядок':task.recipe.format==='timeline'?'Хронология':'Последовательность'}</strong></div>}
  {error&&<p className="feed-error" role="alert">{error}</p>}
  {imageFailed&&!feedback&&<div className="feed-error"><p>Изображение недоступно. Ответ не засчитан.</p><button className="button outline" onClick={()=>void advance(true)}>Пропустить</button></div>}
 </div></div>
 {notice&&<div className="feed-nudge memory-milestone" role="status">{notice}</div>}
 <footer className="feed-footer">{task?.intent==='repair'?'Разбираем ошибки · плановые проверки памяти сохраняются':feedback?.creditBlocked?'Практика без независимого зачёта · память и прогресс не изменились':task?.recipe.diagnostic?'Проверяем связи · точную дату не оцениваем':feedback?.encoding?'Новое знание. Следующая проверка будет позже.':task?.reason==='retry'?'Различаем то, что путалось':'Маленькая практика, долгая память.'}</footer>
 {details&&<div className="overlay"><section className="editor-panel" role="dialog" aria-modal="true" aria-label="Подробности вопроса"><div className="section-heading"><h2>О вопросе</h2><button className="icon-button" aria-label="Закрыть подробности" onClick={()=>{setDetails(false);if(feedback)scheduleNext(feedback)}}>×</button></div><p>{task.items[0].name}</p>{feedback&&task.items[0].summary&&<p>{task.items[0].summary}</p>}{task.items[0].sourceUrl&&<a href={task.items[0].sourceUrl} target="_blank" rel="noreferrer" onClick={()=>{void observe('source',crypto.randomUUID(),'start').catch(visibilityError)}}>Открыть источник ↗</a>}<label>Сообщить о проблеме<textarea value={reportText} onChange={e=>setReportText(e.target.value)} placeholder="Что нужно уточнить?"/></label><button className="button outline" disabled={!reportText.trim()} onClick={async()=>{try{await trainerService.reportQuestion(task.id,reportText);setReportText('');setDetails(false);showNotice('Сообщение сохранено на устройстве');if(feedback)scheduleNext(feedback)}catch(e){setError((e as Error).message)}}}>Сохранить сообщение</button><small>Таймер приостановлен, пока открыты подробности.</small></section></div>}
 </main>;
}
