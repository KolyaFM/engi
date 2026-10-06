import {db,type EngiDB,type SessionRow,type LocalTask,type InteractionDraft} from '../db/engi-db';
import {getSnapshot,getBundle,putBundle,contentTables} from '../db/repositories';
import {composeFeed,cooled} from '../lib/engi/session/composer';
import {saveEntity} from './knowledge-service';
import {validateImport} from '../lib/engi/validate';
import {commitReview,type AnswerInput} from './review-commit';
import {isDiscrete,discreteAnswer,timelineContext} from '../lib/engi/questions/timeline';
import {eligible} from '../lib/engi/questions/recipe-factory';

export function createTrainerService(d:EngiDB){return {
 getSnapshot:()=>getSnapshot(d),
 async startFeed(tag='all',format='mixed',mode='daily'){
  if(!['mixed','choice','recall_reveal','match','categorize','timeline','sort','missing'].includes(format))throw Error('Выберите доступный формат без ввода текста');
  const s=await getSnapshot(d),tasks=composeFeed(s.bundle,s.memories,tag,format,mode);if(!tasks.length)throw Error('Нет подходящих заданий. Добавьте знания или выберите другой формат.');
  const now=new Date().toISOString();const session:SessionRow={id:crypto.randomUUID(),tasks,currentPosition:0,results:[],mode,createdAt:now,updatedAt:now,status:'active',timeLeft:90,feed:true,tag,format,completedCount:0,cooldown:[],repairQueue:[]};
  await d.transaction('rw',d.activeSessions,async()=>{await d.activeSessions.where('status').equals('active').modify({status:'completed'});await d.activeSessions.put(session)});return session;
 },
 async advanceFeed(id:string,skip=false,expectedTaskId?:string){return d.transaction('rw',[d.activeSessions,d.reviewEvents,...contentTables(d),d.learningState],async()=>{
  const s=await d.activeSessions.get(id);if(!s?.feed||s.status!=='active')throw Error('Лента не найдена');const task=s.tasks[s.currentPosition];if(expectedTaskId&&task?.id!==expectedTaskId)return s;
  if(task){if(!skip&&!await d.reviewEvents.get(task.id))throw Error('Сначала завершите карточку');s.cooldown=[...s.cooldown??[],task].slice(-12);s.completedCount=(s.completedCount??0)+1;s.currentPosition++;s.interaction=undefined}
  const remaining=s.tasks.slice(s.currentPosition);if(remaining.length<6){const b=await getBundle(d),memories=(await d.learningState.toArray()).map(r=>r.payload);s.tasks.push(...composeFeed(b,memories,s.tag,s.format,s.mode,[...s.cooldown??[],...remaining],12-remaining.length,s.completedCount))}
  const repairs=s.repairQueue??[],ready=repairs.find(t=>(t.retryAfter??0)<=(s.completedCount??0)&&cooled(t.items[0],s.cooldown??[]));
  if(ready){const tail:LocalTask[]=[];for(const t of s.tasks.slice(s.currentPosition)){if(tail.length<3&&t.items.some(i=>!cooled(i,[ready,...tail])))continue;tail.push(t)}s.tasks=[...s.tasks.slice(0,s.currentPosition),ready,...tail];s.repairQueue=repairs.filter(t=>t.id!==ready.id)}
  if(s.currentPosition>24){s.tasks=s.tasks.slice(s.currentPosition);s.currentPosition=0}s.updatedAt=new Date().toISOString();await d.activeSessions.put(s);return s;
 })},
 async getResumableSession(){
  const s=(await d.activeSessions.where('status').equals('active').sortBy('updatedAt')).at(-1);if(!s)return;if(!s.feed){await d.activeSessions.update(s.id,{status:'completed'});return}
  let changed=false;for(const task of s.tasks){if((task.recipe.format as string)==='recall'){task.recipe={...task.recipe,format:'recall_reveal'};changed=true}if(task.recipe.format==='timeline'&&!task.timeline){task.timeline=timelineContext(eligible(await getBundle(d),task.recipe));changed=true}}
  if(changed)await d.activeSessions.put(s);return s;
 },
 async getFeedback(taskId:string){return (await d.reviewEvents.get(taskId))?.payload.feedback??null},
 async saveInteraction(sessionId:string,taskId:string,delta:Partial<Omit<InteractionDraft,'taskId'|'attemptSequence'>>){return d.transaction('rw',d.activeSessions,d.reviewEvents,async()=>{
  const s=await d.activeSessions.get(sessionId),t=s?.tasks[s.currentPosition];if(!s||s.status!=='active'||!t||t.id!==taskId)throw Error('Карточка уже сменилась');if(await d.reviewEvents.get(taskId))return s.interaction;
  const draft:InteractionDraft=s.interaction?.taskId===taskId?{...s.interaction}:{taskId,attemptSequence:[]};
  if(delta.recallElapsedMs!==undefined){if(!Number.isFinite(delta.recallElapsedMs))throw Error('Некорректное время');draft.recallElapsedMs=Math.min(5000,Math.max(draft.recallElapsedMs??0,delta.recallElapsedMs))}
  if(delta.revealed){if((draft.recallElapsedMs??0)<5000)throw Error('Ещё есть время вспомнить');draft.revealed=true}
  if(delta.timelineValue!==undefined){const scale=t.timeline;if(!scale||!Number.isInteger(delta.timelineValue)||delta.timelineValue<scale.min||delta.timelineValue>scale.max)throw Error('Значение вне шкалы');draft.timelineValue=delta.timelineValue}
  if(delta.sortOrder){if(delta.sortOrder.length!==t.items.length||new Set(delta.sortOrder).size!==t.items.length||!t.items.every(i=>delta.sortOrder!.includes(i.entityId)))throw Error('Некорректный порядок');draft.sortOrder=delta.sortOrder}
  s.interaction=draft;s.updatedAt=new Date().toISOString();await d.activeSessions.put(s);return draft;
 })},
 async answer(input:AnswerInput){return d.transaction('rw',d.learningState,d.reviewEvents,d.activeSessions,d.appMeta,async()=>{
  const duplicate=await d.reviewEvents.get(input.taskId);if(duplicate)return {pending:false as const,feedback:duplicate.payload.feedback,memories:await d.learningState.bulkGet(duplicate.targetIds),event:duplicate,results:(await d.activeSessions.get(input.sessionId))?.results??[],interaction:undefined,milestone:undefined};
  const session=await d.activeSessions.get(input.sessionId),task=session?.tasks[session.currentPosition];if(!task||!session||session.status!=='active'||task.id!==input.taskId)throw Error('Текущая карточка не найдена');
  let attempts:string[]=[];
  if(isDiscrete(task)){
   if(typeof input.answer!=='string'||!task.options.some(o=>o.id===input.answer))throw Error('Выберите один из вариантов');
   const draft=session.interaction?.taskId===task.id?session.interaction:{taskId:task.id,attemptSequence:[]};if(!draft.attemptSequence.includes(input.answer))draft.attemptSequence.push(input.answer);attempts=draft.attemptSequence;
   if(input.answer!==discreteAnswer(task)){session.interaction=draft;session.updatedAt=new Date().toISOString();await d.activeSessions.put(session);return {pending:true as const,feedback:null,memories:[],event:undefined,results:session.results,interaction:draft,milestone:undefined}}
  }
  if(task.recipe.format==='recall_reveal'&&(typeof input.answer!=='boolean'||!session.interaction?.revealed||(session.interaction.recallElapsedMs??0)<5000))throw Error('Сначала дождитесь раскрытия ответа');
  if(task.recipe.format==='timeline'){const scale=task.timeline,value=(input.answer as Record<string,unknown>)?.[task.items[0].entityId];if(!scale||!Number.isInteger(value)||Number(value)<scale.min||Number(value)>scale.max)throw Error('Подтвердите значение на шкале')}
  return commitReview(d,session,task,input,attempts);
 })},
 async importBundle(input:unknown){return d.transaction('rw',contentTables(d),async()=>{const b=validateImport(input,await getBundle(d));if(b.media.some(m=>!m.url.startsWith('engi-media://')))throw Error('Изображения нужны внутри пакета .engi');await putBundle(d,b);return {entities:b.entities.length,facts:b.facts.length,excluded:b.facts.filter(f=>!['direct','verified','user_confirmed'].includes(f.verification)).length}})},
 async editEntity(input:{entityId:string;name:string;facts:any[]}){const b=await getBundle(d),e=b.entities.find(e=>e.id===input.entityId);if(!e)throw Error('Объект не найден');const facts=input.facts.map(change=>{const f=b.facts.find(x=>x.id===change.id);if(!f)throw Error('Факт не найден');const next={...f,...change};if(f.valueKind==='date'&&change.year!==undefined&&String(change.year)!==f.dateStart?.slice(0,4)){const y=Number(change.year);if(!Number.isInteger(y)||y<1||y>2100)throw Error('Неверный год');next.dateStart=String(y).padStart(4,'0')+'-01-01';next.dateEnd=String(y).padStart(4,'0')+'-12-31';next.datePrecision='year'}return next});await saveEntity({...e,name:input.name},facts,b.entityTags.filter(t=>t.entityId===e.id&&!t.archived).map(t=>t.tagId),d);return {ok:true}},
 async reportQuestion(taskId:string,reason:string){if(!reason.trim())throw Error('Укажите причину');await d.reviewEvents.add({id:crypto.randomUUID(),timestamp:new Date().toISOString(),recipe:'report',level:'report',targetIds:[],payload:{taskId,reason:reason.slice(0,1000)}})},
 async resolveReport(reportId:string){return d.transaction('rw',d.reviewEvents,async()=>{if(!(await d.reviewEvents.get(reportId)))throw Error('Сообщение не найдено');if(!(await d.reviewEvents.get('resolved:'+reportId)))await d.reviewEvents.add({id:'resolved:'+reportId,timestamp:new Date().toISOString(),recipe:'report_resolved',level:'report',targetIds:[],payload:{reportId}})})}
}}
export const trainerService=createTrainerService(db);
