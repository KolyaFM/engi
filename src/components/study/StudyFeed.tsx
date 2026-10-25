import {introMediaSources,taskMediaSources} from '../../services/feed-media';
import {IntervalBandsCard} from './IntervalBandsCard';
import {IntervalEndpointCard} from './IntervalEndpointCard';
import './interval-exercises.css';
import {DescriptionButton,EntityDescriptionProvider,useEntityDescription} from './EntityDescription';
import {SelfCheckCard} from './SelfCheckCard';
import {chronologyOrder} from '../../lib/engi/questions/order-feedback';
import {MultiChoiceCard} from './MultiChoiceCard';
import {MappingCard} from './MappingCard';
import {MatchingPairsCard} from './MatchingPairsCard';
import {ConveyorCard} from './ConveyorCard';
import {useStudyVisibility} from './useStudyVisibility';
import {DayPlanPanel} from './DayPlanPanel';
import {dayPlanSummary,type GoalDayPlan} from '../../lib/engi/study-core/day-plan';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
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
import './entity-description.css';
import {ObjectIntroCard} from './ObjectIntroCard';
import {StopStudyCard} from './StopStudyCard';
import type {Familiarity} from '../../lib/engi/types';
import type {IntroPresentation} from '../../services/intro-presentation';
import {feedSpan,measureFeed} from '../../services/feed-performance';

const delay=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));

export function StudyFeed(props:{initial:SessionRow;onExit:()=>void}){return <EntityDescriptionProvider><StudyFeedContent {...props}/></EntityDescriptionProvider>;}
function StudyFeedContent({initial,onExit}:{initial:SessionRow;onExit:()=>void}){
 const {isOpen:descriptionOpen,close:closeDescription}=useEntityDescription();
 const [loadedIntro,setLoadedIntro]=useState<{id:string;view:IntroPresentation}>();
 const [dayPlan,setDayPlan]=useState<GoalDayPlan>();
 const [session,setSession]=useState(initial),[feedback,setFeedback]=useState<any>(null),[storedDraft,setDraft]=useState<InteractionDraft|undefined>(initial.interaction);
 const [state,setState]=useState<'loading'|'ready'|'saving'|'feedback'|'exiting'>('loading'),[error,setError]=useState(''),[imageFailed,setImageFailed]=useState(false),[mediaReady,setMediaReady]=useState(false);
 const [details,setDetails]=useState(false),[headerHelp,setHeaderHelp]=useState(false),[reportText,setReportText]=useState(''),[notice,setNotice]=useState(''),[challengeIntro,setChallengeIntro]=useState(false);
 const {preferences}=useStudyPreferences(),reduced=useReducedMotion();
 const introKey=session.intro?.introId??session.intro?.entityId;
 const preparedIntro=useRef<{id:string;view:IntroPresentation}|undefined>(undefined);
 const selectedIntro=trainerService.introPresentation(session);
 if(selectedIntro&&introKey)preparedIntro.current={id:introKey,view:selectedIntro};
 const introView=selectedIntro??(loadedIntro&&loadedIntro.id===introKey?loadedIntro.view:undefined)??(preparedIntro.current&&preparedIntro.current.id===introKey?preparedIntro.current.view:undefined);
 const task=session.tasks[session.currentPosition],sessionRef=useRef(session),lock=useRef(false),advancing=useRef(false),alive=useRef(true),started=useRef(Date.now());
 // A new card mounts before the task-change effect clears the previous draft.
 const draft=storedDraft?.taskId===task?.id?storedDraft:undefined;
 const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),introTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),noticeTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),touch=useRef<{pointer:number;y:number}|null>(null);
 const writes=useRef<Promise<unknown>>(Promise.resolve());sessionRef.current=session;
 const detailsRef=useRef(details);detailsRef.current=details||headerHelp||descriptionOpen;
 const descriptionStarted=useRef<number|undefined>(undefined);
 useLayoutEffect(()=>{
  if(descriptionOpen)descriptionStarted.current=Date.now();
  else if(descriptionStarted.current!==undefined){started.current+=Date.now()-descriptionStarted.current;descriptionStarted.current=undefined;}
 },[descriptionOpen]);
 const matchingResult=useRef<Awaited<ReturnType<typeof trainerService.answerMatchPair>>|undefined>(undefined);
 const cardLoadEnd=useRef<(()=>void)|undefined>(undefined);
 const cardLoadReadyTask=useRef<string|undefined>(undefined);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;clearTimeout(timer.current);clearTimeout(introTimer.current);clearTimeout(noticeTimer.current)}},[]);

 function showNotice(text:string){setNotice(text);clearTimeout(noticeTimer.current);noticeTimer.current=setTimeout(()=>setNotice(''),1600)}
 async function loadDayPlan(expired=false){if(session.memoryModel!=='goals')return;const p=await trainerService.getDayPlan(session.tag,session.format??'mixed',session.deckIds);if(alive.current)setDayPlan(p);}
 function scheduleNext(f:any){
  clearTimeout(timer.current);
  if(detailsRef.current)return;
  if((task.recipe.format==='sort'||task.intervalExercise?.kind==='bands')&&!f.invalidContent)return;
  if(isMapping(task)&&!f.invalidContent&&!f.matchingComplete)return;
  const auto=f.invalidContent||f.matchingComplete||isDiscrete(task)||task.recipe.format==='recall_reveal'||f.score===1;
  if(!auto)return;
  const hold=f.encoding?1600:f.repairResolved?600:f.score===1?320:480;
  timer.current=setTimeout(()=>{void advance()},Math.max(0,hold-(reduced?0:180)));
 }
 useEffect(()=>{if(!details&&!headerHelp&&!descriptionOpen&&feedback)scheduleNext(feedback);else if(headerHelp||descriptionOpen)clearTimeout(timer.current)},[details,headerHelp,descriptionOpen]);
 useEffect(()=>{
  let valid=true;closeDescription();cardLoadEnd.current?.();cardLoadReadyTask.current=undefined;cardLoadEnd.current=feedSpan('ui.cardLoad');clearTimeout(timer.current);lock.current=false;advancing.current=false;started.current=Date.now();setState('loading');setFeedback(null);setError('');setImageFailed(false);setDetails(false);
  setDraft(session.interaction?.taskId===task?.id?session.interaction:undefined);
  setMediaReady(task?.recipe.answerPresentation!=='image'&&(task?.recipe.cue!=='image'||!task.items[0]?.image));setChallengeIntro(!!task?.recipe.diagnostic);
  clearTimeout(introTimer.current);if(task?.recipe.diagnostic)introTimer.current=setTimeout(()=>setChallengeIntro(false),500);
  if(!task)setState('ready');if(session.intro&&!introView)void trainerService.loadIntroPresentation(session).then(view=>{if(valid&&view&&introKey)setLoadedIntro({id:introKey,view})}).catch(e=>{if(valid)setError(e.message)});
  if(task)trainerService.getFeedback(task.id).then(f=>{if(!valid)return;cardLoadReadyTask.current=task.id;if(f){lock.current=true;setState('feedback');setFeedback(f);scheduleNext(f)}else setState('ready')}).catch(e=>{if(valid){setError(e.message);setState('ready')}});
  const warmup=new AbortController();
  void (session.intro&&introView?mediaStore.prewarm(introMediaSources(introView.bundle,session.intro.entityId,introView.items),warmup.signal):trainerService.preloadMedia(session.id).then(urls=>mediaStore.prewarm(urls,warmup.signal))).then(()=>warmup.signal.aborted||session.intro?undefined:trainerService.previewFeedMedia(session.id).then(urls=>mediaStore.prewarm(urls,warmup.signal))).catch(()=>{});
  return()=>{valid=false;warmup.abort();cardLoadEnd.current?.();cardLoadEnd.current=undefined;clearTimeout(timer.current);clearTimeout(introTimer.current)};
 },[task?.id,session.intro?.unitIds.join('|'),session.exhausted]);

 function observe(phase:`card-reveal:${string}`|'question'|'feedback'|'order-reveal'|'matched-pairs'|'answer-reveal'|'early-answer'|'details'|'source',episode:string,event:'start'|'refresh'|'end'){
  if(!task)return Promise.resolve();const id=task.id,sid=session.id;
  const write=writes.current.catch(()=>{}).then(()=>trainerService.observeVisibility(sid,id,phase,episode,event));writes.current=write;return write;
 }
 const visibilityError=(e:Error)=>{if(alive.current)setError(e.message)};
 const rendered=!!task&&state!=='loading'&&state!=='exiting'&&!imageFailed&&mediaReady&&!feedback?.invalidContent;
 // A hidden incoming question must not wait behind a counter reconciliation
 // transaction. Render/decode it first; refresh counters after its first frame.
 useEffect(()=>{if(session.intro||!session.exhausted&&!rendered)return;let timer:ReturnType<typeof setTimeout>|undefined;const frame=requestAnimationFrame(()=>{timer=setTimeout(()=>void loadDayPlan().catch(visibilityError),0)});return()=>{cancelAnimationFrame(frame);clearTimeout(timer)}},[session.id,task?.id,session.exhausted,session.intro?.entityId,rendered]);
 const taskContent=useRef<HTMLDivElement>(null),enteredTask=useRef<string|undefined>(undefined);
 useLayoutEffect(()=>{const node=taskContent.current;if(!rendered||!node||enteredTask.current===task.id)return;enteredTask.current=task.id;const viewport=node.closest('.feed-viewport');if(viewport)viewport.scrollTop=0;if(reduced)return;const animation=node.animate([{transform:`translateY(${Math.round((viewport?.clientHeight??window.innerHeight)*.9)}px)`},{transform:'translateY(0)'}],{duration:280,easing:'cubic-bezier(.22,1,.36,1)'});return()=>animation.cancel();},[rendered,task?.id,reduced]);
 useEffect(()=>{if(rendered&&cardLoadReadyTask.current===task?.id||!task){cardLoadEnd.current?.();cardLoadEnd.current=undefined;}},[rendered,task?.id]);
 useStudyVisibility(task?.id+':question',rendered&&!details,(id,event)=>observe('question',id,event),visibilityError);
 const sortComplete=task?.recipe.format==='sort'&&!!feedback&&(draft?.sortCheckedOrder?draft.sortCheckedOrder.every((id,n)=>id===chronologyOrder(task)[n]):feedback.score===1);
 const answerPhase=task?.recipe.format==='sort'?'order-reveal':task?.recipe.format==='recall_reveal'?(draft?.earlyReveal?'early-answer':'answer-reveal'):'feedback';
 const answerVisible=rendered&&!details&&(task?.recipe.format==='sort'?sortComplete:task?.recipe.format==='recall_reveal'?!!draft?.revealed:!!feedback&&!feedback.invalidContent);
 useStudyVisibility(task?.id+':'+answerPhase,answerVisible,(id,event)=>observe(answerPhase,id,event),visibilityError);
 const matchedKeys=Object.keys(draft?.matching?.matched??{}).sort().join('|');
 useStudyVisibility(task?.id+':matched:'+matchedKeys,rendered&&!details&&!!matchedKeys&&!feedback,(id,event)=>observe('matched-pairs',id,event),visibilityError);
 useStudyVisibility(session.intro?'intro:'+session.id+':'+session.intro.entityId+':'+session.intro.unitIds.join('|'):undefined,!!session.intro&&!!introView,(id,event)=>{
  const sid=session.id,write=writes.current.catch(()=>{}).then(()=>trainerService.observeIntroVisibility(sid,id,event));writes.current=write;return write;
 },visibilityError);
 useStudyVisibility(task?.id+':details',!!task&&details,(id,event)=>observe('details',id,event),visibilityError);

 function persist(delta:Partial<InteractionDraft>):Promise<void>{
  const id=task.id,sid=session.id;
  const write=writes.current.catch(()=>{}).then(()=>trainerService.saveInteraction(sid,id,delta));writes.current=write;
  return write.then(next=>{if(alive.current&&sessionRef.current.tasks[sessionRef.current.currentPosition]?.id===id){setDraft(next);if(delta.revealed)setError('')}}).catch(e=>{if(alive.current&&sessionRef.current.tasks[sessionRef.current.currentPosition]?.id===id)setError(e.message);throw e});
 }
 function warmIncoming(next:SessionRow){const view=trainerService.introPresentation(next);const task=next.tasks[next.currentPosition];if(next.intro&&view)void mediaStore.prewarm(introMediaSources(view.bundle,next.intro.entityId,view.items));else if(task)void mediaStore.prewarm(taskMediaSources(task));return next;}
 async function advance(skip=false){
  if(advancing.current)return;advancing.current=true;clearTimeout(timer.current);setState('exiting');
  const current=sessionRef.current,currentTask=current.tasks[current.currentPosition];
  try{await measureFeed('ui.advance.writeQueue',()=>writes.current.catch(()=>{}));const [next]=await Promise.all([trainerService.advanceFeed(current.id,skip,currentTask?.id,window.innerWidth).then(warmIncoming),reduced?Promise.resolve():delay(180)]);if(!alive.current)return;setSession(next);
   if(next.exhausted||next.intro)setState('ready');
  }catch(e){if(alive.current){setError((e as Error).message);setState(feedback?'feedback':'ready')}}finally{advancing.current=false}
 }
 async function submit(value:any){
  if(lock.current||!task||imageFailed||!mediaReady||state!=='ready'||details||headerHelp||challengeIntro)return false;
  lock.current=true;setState('saving');setError('');
  const previous=draft;
  if(isDiscrete(task)&&value!==discreteAnswer(task))setDraft({taskId:task.id,attemptSequence:[...new Set([...(draft?.attemptSequence??[]),value])]});
  const end=feedSpan('ui.submit');
  try{await measureFeed('ui.answer.writeQueue',()=>writes.current);const result=await trainerService.answer({sessionId:session.id,taskId:task.id,answer:value,latencyMs:Date.now()-started.current});if(!alive.current)return;
   if(result.pending){void loadDayPlan().catch(visibilityError);setDraft(result.interaction);setState('ready');lock.current=false;return false}
   setFeedback(result.feedback);setState('feedback');
   if(result.feedback.score===1){playSuccess(preferences.sound);try{navigator.vibrate?.(10)}catch{}}
   scheduleNext(result.feedback);return true;
  }catch(e){if(alive.current){setDraft(previous);setError((e as Error).message);setState('ready');lock.current=false}return false}finally{end();}
 }
 async function submitPair(pair:{entityId:string;responseKey?:string;answerId:string},requestId:string){
  if(lock.current||!task||busy||imageFailed)throw Error('Проверка уже выполняется');
  lock.current=true;setState('saving');setError('');
  try{
   await writes.current;
   const result=await trainerService.answerMatchPair({sessionId:session.id,taskId:task.id,...pair,requestId});
   if(alive.current){setDraft(result.interaction);matchingResult.current=result;setState('ready');void loadDayPlan().catch(visibilityError);
    if(result.correct){playSuccess(preferences.sound);try{navigator.vibrate?.(10)}catch{}}

    if(result.feedback?.invalidContent){setFeedback(result.feedback);setState('feedback');scheduleNext(result.feedback)}
   }
   return result;
  }catch(e){if(alive.current){setError((e as Error).message);setState('ready')}throw e}
  finally{lock.current=false}
 }
 function completeMatching(){const result=matchingResult.current;if(!result?.complete||!alive.current)return;lock.current=true;setFeedback(result.feedback);setState('feedback');scheduleNext(result.feedback)}
 async function exit(){if(state==='saving'||state==='exiting')return;clearTimeout(timer.current);setState('saving');try{await writes.current.catch(()=>{});onExit()}catch(e){setError((e as Error).message);setState('ready')}}

 const busy=state!=='ready'||challengeIntro||details||headerHelp||!mediaReady;
 const cue=task?.recipe.format==='sort'?null:<div className="feed-cue">{task?.recipe.format==='missing'?<ol className="feed-sequence">{task.sequence?.map((i,n)=><li key={n}>{i?.name??'?'}</li>)}</ol>:task?.recipe.cue==='image'&&task.items[0].image?<KnowledgeImage src={task.items[0].image} alt="Изображение для вопроса" onReady={()=>setMediaReady(true)} onFail={()=>setImageFailed(true)}/>:<h1>{task?.items[0].valueCue?.text??task?.items[0].name}</h1>}{task?.items[0]&&<DescriptionButton {...task.items[0]}/>}</div>;
 async function introChoose(id:string,color:Familiarity){setSession(await trainerService.saveIntroSelection(session.id,id,color))}
 async function introDone(selections:Record<string,Familiarity>,animate=false){if(advancing.current||!session.intro)return;advancing.current=true;setState('saving');setError('');try{const [next]=await Promise.all([trainerService.completeIntro(session.id,{entityId:session.intro.entityId,introId:session.intro.introId,selections}).then(warmIncoming),delay(reduced||!animate?0:260)]);setSession(next)}catch(e){setError((e as Error).message);throw e}finally{advancing.current=false;setState('ready')}}
 async function more(practice=false){if(advancing.current)return;advancing.current=true;setState('saving');setError('');try{setSession(await trainerService.openMore(session.id,practice))}catch(e){setError((e as Error).message)}finally{advancing.current=false;setState('ready')}}
 async function refresh(){if(advancing.current)return;advancing.current=true;setState('saving');setError('');try{setSession(await trainerService.refreshGoalFeed(session.id))}catch(e){setError((e as Error).message)}finally{advancing.current=false;setState('ready')}}
 async function retryMistakes(){setState('saving');setError('');try{setSession(await trainerService.retryUnavailableMistakes(session.id));await loadDayPlan()}catch(e){setError((e as Error).message)}finally{setState('ready')}}
 async function acceptCorrectAnswer(){
  if(state==='saving'||advancing.current||!task)return;
  clearTimeout(timer.current);advancing.current=true;lock.current=true;setState('saving');setError('');
  try{await writes.current.catch(()=>{});const next=await trainerService.acceptCorrectAnswer(session.id,task.id);if(!alive.current)return;warmIncoming(next);setDetails(false);setFeedback(null);setDraft(undefined);setSession(next);setState(next.intro||next.exhausted?'ready':'loading');}
  catch(e){if(alive.current){setError((e as Error).message);setState(feedback?'feedback':'ready');}}
  finally{advancing.current=false;lock.current=false;}
 }
 if(session.intro)return introView?<ObjectIntroCard key={session.intro.introId??session.intro.entityId} intro={session.intro} bundle={introView.bundle} preparedItems={introView.items} onChoose={introChoose} onDone={introDone} onExit={()=>void exit()} busy={state==='saving'} error={error}/>:<main className="study-feed"><p>Готовим знакомство…</p></main>;
 if(session.exhausted)return <><DayPlanPanel plan={dayPlan} onExpired={()=>void loadDayPlan(true).catch(visibilityError)}/><StopStudyCard newCardsPerDay={preferences.newCardsPerDay} unavailableMistakes={dayPlan?.unavailableMistakes??0} mistakes={dayPlan?.mistakes?.length??0} dailyPending={dayPlan?!dayPlanSummary(dayPlan).completed:false} waitingUntil={session.waitingUntil} onRetryMistakes={session.memoryModel==='goals'?()=>void retryMistakes():undefined} onRefresh={session.memoryModel==='goals'?()=>void refresh():undefined} onMore={()=>void more()} onPractice={()=>void more(true)} onExit={()=>void exit()} busy={state==='saving'} error={error}/></>;
 const prompt=task?.recipe.prompt??task?.recipe.label??'Вспомните ответ';
 return <main className={`study-feed state-${state}`}><header className="feed-header"><button className="icon-button" aria-label="Выйти из практики" disabled={state==='saving'||state==='exiting'} onClick={()=>void exit()}>×</button><DayPlanPanel inline onHelpChange={setHeaderHelp} plan={dayPlan} onExpired={()=>void loadDayPlan(true).catch(visibilityError)}/><button className="icon-button" aria-label="Подробнее о вопросе" disabled={state==='saving'||state==='exiting'} onClick={()=>{clearTimeout(timer.current);setDetails(true)}}>···</button></header>
 <div className={`feed-viewport ${task?.intervalExercise?.kind==='bands'?'has-intervals':task?.recipe.format==='sort'?'has-chronology':task?.recipe.format==='recall_reveal'?'has-recall':''}`}><div className={`feed-current ${task?.recipe.answerPresentation==='image'?'has-image-answers':''}`} key={task?.id} data-task-id={task?.id}
  onPointerDown={e=>{if(e.isPrimary&&!(e.target as HTMLElement).closest('button,input,.recall-swipe,.chronology-card,.conveyor-object'))touch.current={pointer:e.pointerId,y:e.clientY}}}
  onPointerUp={e=>{if(touch.current!==null&&touch.current.pointer===e.pointerId&&touch.current.y-e.clientY>65&&feedback&&task.recipe.diagnostic&&(task.recipe.format!=='sort'||sortComplete)&&!['saving','exiting'].includes(state))void advance();if(touch.current?.pointer===e.pointerId)touch.current=null}}
  onPointerCancel={()=>{touch.current=null}} onLostPointerCapture={()=>{touch.current=null}}>
  {(state==='loading'||!mediaReady)&&!imageFailed&&<p className="feed-game-status" role="status">Готовим вопрос…</p>}
  {task?.reason==='game'&&<p className="feed-game-status">{task.recipe.diagnostic?'Разминка':dayPlan&&(dayPlan.dailyTarget??dayPlan.newTarget)>0&&dayPlan.newGoalIds.length>=(dayPlan.dailyTarget??dayPlan.newTarget)?'План нового выполнен · играем дальше':'Играем и закрепляем'}</p>}
  <div ref={taskContent} onPointerDownCapture={()=>{taskContent.current?.getAnimations().forEach(animation=>animation.cancel())}} className="feed-task-content" hidden={state==='loading'||!mediaReady}>
  {feedback?.invalidContent?<div className="feed-question"><p role="status">Содержание изменилось. Подготовим другой вопрос.</p></div>:task&&(task.recipe.format==='self_check'?<SelfCheckCard key={task.id} task={task} initialFlipped={draft?.flippedCards} busy={busy} onPersist={ids=>persist({flippedCards:ids})} onReveal={(id,episode,event)=>observe(`card-reveal:${id}`,episode,event)} onNext={()=>void advance(true)} onMediaReady={setMediaReady} onMediaFail={()=>setImageFailed(true)}/>:isMapping(task)?<div className="feed-question">{task.memoryModel!=='goals'&&<h2>{prompt}</h2>}{task.memoryModel==='goals'?(task.intervalExercise?.kind==='bands'?<IntervalBandsCard key={task.id} task={task} progress={draft?.matching} busy={busy&&state!=='feedback'} onPair={submitPair} onComplete={()=>void advance()} onMediaReady={setMediaReady} onMediaFail={()=>setImageFailed(true)}/>:task.presentation==='conveyor'?<ConveyorCard key={task.id} task={task} progress={draft?.matching} busy={busy} onPair={submitPair} onComplete={completeMatching} onMediaReady={setMediaReady} onMediaFail={()=>setImageFailed(true)}/>: <MatchingPairsCard key={task.id} task={task} progress={draft?.matching} busy={busy} onPair={submitPair} onComplete={completeMatching} onMediaReady={setMediaReady} onMediaFail={()=>setImageFailed(true)}/>):<MappingCard key={task.id} task={task} initial={draft?.mapping} feedback={feedback} busy={busy} onPersist={mapping=>{void persist({mapping}).catch(()=>{})}} onSubmit={v=>void submit(v)} onNext={()=>void advance()} onMediaReady={setMediaReady} onMediaFail={()=>setImageFailed(true)}/>}</div>:task.recipe.format==='recall_reveal'?<RecallRevealCard task={task} cue={cue} draft={draft} paused={details||headerHelp||descriptionOpen||!mediaReady||imageFailed||state==='loading'} busy={state!=='ready'||headerHelp} reducedMotion={reduced} accessible={preferences.accessibleRecall} onPersist={persist} onSubmit={submit}/>:
   <div className="feed-question">{cue}<div className="feed-actions">{task.recipe.format==='sort'?<div className="sort-heading"><h2>{(task.recipe.orderingKind??task.items[0]?.ordering?.kind)==='number'?'Порядок':'Хронология'}</h2><p>{prompt}</p></div>:<h2>{prompt}</h2>}{task.intervalExercise?.kind==='endpoint'&&<IntervalEndpointCard task={task}/>} {task.recipe.format==='multi_choice'?<MultiChoiceCard key={task.id} task={task} feedback={feedback} busy={busy} onSubmit={v=>void submit(v)} onNext={()=>void advance()}/>:isDiscrete(task)?<ChoiceCard task={task} onMediaReady={setMediaReady} onMediaFail={()=>setImageFailed(true)} attempts={draft?.attemptSequence??[]} feedback={feedback} busy={busy} onChoose={v=>void submit(v)}/>:task.recipe.format==='timeline'?<TimelineCard task={task} initialValue={draft?.timelineValue} feedback={feedback} busy={state==='saving'||state==='exiting'||state==='loading'||challengeIntro} onPersist={v=>{void persist({timelineValue:v}).catch(()=>{})}} onSubmit={v=>void submit(v)} onNext={()=>void advance()}/>:<SortChallengeCard task={task} initialOrder={draft?.sortOrder} initialCheckedOrder={draft?.sortCheckedOrder} initialDirtySlots={draft?.sortDirtySlots} feedback={feedback} busy={state==='saving'||state==='exiting'||state==='loading'||challengeIntro||details||headerHelp||!mediaReady} onMediaReady={setMediaReady} onMediaFail={()=>setImageFailed(true)} onPersist={(v,checked,dirty)=>{void persist({sortOrder:v,...(checked?{sortCheckedOrder:checked}:{}),...(dirty?{sortDirtySlots:dirty}:{})}).catch(()=>{})}} onSubmit={v=>void submit(v)} onNext={()=>void advance()}/>}</div></div>)}
  </div>
  {feedback?.encoding&&<div className="encoding-moment" role="status"><strong>{task.items[0].name}</strong><span>{task.recipe.label} → {task.items[0].answer}</span>{task.items[0].summary&&<p>{task.items[0].summary.split(/(?<=[.!?])\s+/).slice(0,2).join(' ')}</p>}<small>Вернёмся к этому чуть позже</small></div>}
  <span className="sr-only" role="status" aria-live="polite">{feedback?(feedback.invalidContent?'Вопрос пропущен без оценки':feedback.score===1?'Верно':'Связь уточнена'):draft?.attemptSequence.length?'Этот вариант не подходит. Попробуйте другой.':''}</span>
  {challengeIntro&&<div className="challenge-intro" aria-live="polite"><span>Проверим связи</span><strong>{task.recipe.format==='sort'?'Порядок':task.recipe.format==='timeline'?'Хронология':'Последовательность'}</strong></div>}
  {error&&<p className="feed-error" role="alert">{error}</p>}
  {imageFailed&&!feedback&&<div className="feed-error"><p>Изображение недоступно. Ответ не засчитан.</p><button className="button outline" onClick={()=>void advance(true)}>Пропустить</button></div>}
 </div></div>
 {notice&&<div className="feed-nudge memory-milestone" role="status">{notice}</div>}

 {details&&<div className="overlay"><section className="editor-panel" role="dialog" aria-modal="true" aria-label="Подробности вопроса"><div className="section-heading"><h2>О вопросе</h2><button className="icon-button" aria-label="Закрыть подробности" onClick={()=>{setDetails(false);if(feedback)scheduleNext(feedback)}}>×</button></div><p>{task.items[0].name}</p>{!!task.studyContract?.primaryGoals.length&&<button className="button primary" disabled={state==='saving'||state==='exiting'} onClick={()=>void acceptCorrectAnswer()}>Засчитать как правильный</button>}{error&&<p className="feed-error" role="alert">{error}</p>}{feedback&&task.items[0].summary&&<p>{task.items[0].summary}</p>}{task.items[0].sourceUrl&&<a href={task.items[0].sourceUrl} target="_blank" rel="noreferrer" onClick={()=>{void observe('source',crypto.randomUUID(),'start').catch(visibilityError)}}>Открыть источник ↗</a>}<label>Сообщить о проблеме<textarea value={reportText} onChange={e=>setReportText(e.target.value)} placeholder="Что нужно уточнить?"/></label><button className="button outline" disabled={!reportText.trim()} onClick={async()=>{try{await trainerService.reportQuestion(task.id,reportText);setReportText('');setDetails(false);showNotice('Сообщение сохранено на устройстве');if(feedback)scheduleNext(feedback)}catch(e){setError((e as Error).message)}}}>Сохранить сообщение</button><small>Таймер приостановлен, пока открыты подробности.</small></section></div>}
 </main>;
}
