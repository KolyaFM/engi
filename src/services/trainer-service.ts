import {db,type EngiDB,type SessionRow,type InteractionDraft} from '../db/engi-db';
import type {Familiarity} from '../lib/engi/types';
import {getSnapshot,getBundle,putBundle,contentTables,learningRow} from '../db/repositories';
import {saveEntity} from './knowledge-service';
import {validateImport} from '../lib/engi/validate';
import {commitReview,type AnswerInput} from './review-commit';
import {isDiscrete,discreteAnswer} from '../lib/engi/questions/timeline';
import {canonicalTargets} from '../lib/engi/questions/recipe-factory';
import {pickFeed,dailyNewState} from '../lib/engi/session/candidate-pool';
import {triagedMemory,unitDue} from '../lib/engi/learning/bootstrap';

async function selectNext(d:EngiDB,s:SessionRow){
 const b=await getBundle(d),memories=(await d.learningState.toArray()).filter(r=>!r.payload.legacyOf).map(r=>r.payload),daily=dailyNewState((await d.appMeta.get('newLearning'))?.value),introduced=(await d.appMeta.get('introducedEntities'))?.value??[];
 const next=pickFeed(b,memories,s,daily,introduced);s.tasks=next.task?[next.task]:[];s.currentPosition=0;s.intro=next.intro;s.exhausted=!!next.exhausted;s.interaction=undefined;s.updatedAt=new Date().toISOString();await d.activeSessions.put(s);return s;
}
const sessionTables=(d:EngiDB)=>[...contentTables(d),d.learningState,d.activeSessions,d.reviewEvents,d.appMeta];
export function createTrainerService(d:EngiDB){return {
 getSnapshot:()=>getSnapshot(d),
 async preloadMedia(id:string){const s=await d.activeSessions.get(id);if(!s)return [];const b=await getBundle(d),rows=await d.learningState.toArray(),ids=canonicalTargets(b,s.tag).filter(i=>rows.some(r=>r.id===i.targetId&&unitDue(r.payload,s.id,s.completedCount??0))).slice(0,4).map(i=>i.entityId);return b.media.filter(m=>ids.includes(m.entityId)&&!m.archived&&m.learningExemplar!==false).slice(0,4).map(m=>m.url)},
 async startFeed(tag='all',format='mixed',mode='daily'){
  if(!['mixed','choice','recall_reveal','match','categorize','timeline','sort','missing'].includes(format))throw Error('Выберите доступный формат без ввода текста');
  await getSnapshot(d);const now=new Date().toISOString(),s:SessionRow={id:crypto.randomUUID(),tasks:[],currentPosition:0,results:[],mode,createdAt:now,updatedAt:now,status:'active',timeLeft:90,feed:true,tag,format,completedCount:0,ordinaryCount:0,cooldown:[],repairQueue:[],diagnosticSeen:[]};
  return d.transaction('rw',sessionTables(d),async()=>{await d.activeSessions.where('status').equals('active').modify({status:'completed'});return selectNext(d,s)});
 },
 async advanceFeed(id:string,skip=false,expectedTaskId?:string){return d.transaction('rw',sessionTables(d),async()=>{
  const s=await d.activeSessions.get(id);if(!s?.feed||s.status!=='active')throw Error('Лента не найдена');const task=s.tasks[s.currentPosition];if(expectedTaskId&&task?.id!==expectedTaskId)return s;
  if(s.intro)throw Error('Сначала завершите знакомство');
  if(task){if(!skip&&!await d.reviewEvents.get(task.id))throw Error('Сначала завершите карточку');s.cooldown=[...s.cooldown??[],task].slice(-30);s.completedCount=(s.completedCount??0)+1;if(!skip&&!task.recipe.diagnostic&&!task.retryOf)s.ordinaryCount=(s.ordinaryCount??0)+1;if(task.recipe.diagnostic)s.diagnosticSeen=[...s.diagnosticSeen??[],task.recipe.id]}
  return selectNext(d,s);
 })},
 async openMore(id:string,practice=false){return d.transaction('rw',sessionTables(d),async()=>{const s=await d.activeSessions.get(id);if(!s||s.status!=='active'||!s.exhausted)throw Error('Сначала завершите текущую практику');if(practice){s.mode='practice';s.format='mixed'}else{const daily=dailyNewState((await d.appMeta.get('newLearning'))?.value);daily.extraBudget+=2;await d.appMeta.put({key:'newLearning',value:daily})}return selectNext(d,s)})},
 async saveIntroSelection(id:string,unitId:string,color:Familiarity){return d.transaction('rw',d.activeSessions,async()=>{const s=await d.activeSessions.get(id);if(!s?.intro||!s.intro.unitIds.includes(unitId)||!['red','orange','yellow','green','suspended'].includes(color))throw Error('Свойство больше не доступно');s.intro.selections[unitId]=color;await d.activeSessions.put(s);return s})},
 async saveIntroSelections(id:string,selections:Record<string,Familiarity>){return d.transaction('rw',d.activeSessions,async()=>{const s=await d.activeSessions.get(id);if(!s?.intro)throw Error('Знакомство уже завершено');for(const [unitId,color] of Object.entries(selections)){if(s.intro.unitIds.includes(unitId)&&['red','orange','yellow','green','suspended'].includes(color))s.intro.selections[unitId]=color}await d.activeSessions.put(s);return s})},
 async completeIntro(id:string){return d.transaction('rw',sessionTables(d),async()=>{
  const s=await d.activeSessions.get(id);if(!s?.intro||s.status!=='active')throw Error('Знакомство уже завершено');const intro=s.intro,b=await getBundle(d),units=canonicalTargets(b).filter(i=>intro.unitIds.includes(i.targetId));
  for(const i of units)if(!await d.learningState.get(i.targetId))await d.learningState.put(learningRow(triagedMemory(i,intro.selections[i.targetId]??'red',s.id,(s.completedCount??0)+1)));
  const introduced=new Set<string>((await d.appMeta.get('introducedEntities'))?.value??[]);introduced.add(intro.entityId);await d.appMeta.put({key:'introducedEntities',value:[...introduced]});
  if(!intro.newProperty){const daily=dailyNewState((await d.appMeta.get('newLearning'))?.value);daily.introducedEntityIds=[...new Set([...daily.introducedEntityIds,intro.entityId])];await d.appMeta.put({key:'newLearning',value:daily})}
  const item=units[0];if(item)s.cooldown=[...s.cooldown??[],{id:'intro:'+crypto.randomUUID(),items:[item],options:[],reason:'intro',recipe:{id:'intro',format:'choice' as const,cue:'name' as const,answerKey:'identity',memoryKey:'intro',diagnostic:false}}].slice(-30);
  s.completedCount=(s.completedCount??0)+1;s.intro=undefined;return selectNext(d,s);
 })},
 async getResumableSession(){const s=(await d.activeSessions.where('status').equals('active').sortBy('updatedAt')).at(-1);if(!s)return;if(!s.feed){await d.activeSessions.update(s.id,{status:'completed'});return}return s},
 async getFeedback(taskId:string){return (await d.reviewEvents.get(taskId))?.payload.feedback??null},
 async saveInteraction(sessionId:string,taskId:string,delta:Partial<Omit<InteractionDraft,'taskId'|'attemptSequence'>>){return d.transaction('rw',d.activeSessions,d.reviewEvents,async()=>{
  const s=await d.activeSessions.get(sessionId),t=s?.tasks[s.currentPosition];if(!s||s.status!=='active'||!t||t.id!==taskId)throw Error('Карточка уже сменилась');if(await d.reviewEvents.get(taskId))return s.interaction;
  const draft:InteractionDraft=s.interaction?.taskId===taskId?{...s.interaction}:{taskId,attemptSequence:[]};
  if(delta.recallElapsedMs!==undefined){if(!Number.isFinite(delta.recallElapsedMs))throw Error('Некорректное время');draft.recallElapsedMs=Math.min(5000,Math.max(draft.recallElapsedMs??0,delta.recallElapsedMs))}
  if(delta.revealed){if(t.recipe.format!=='recall_reveal'||(draft.recallElapsedMs??0)<5000&&!delta.earlyReveal)throw Error('Ещё есть время вспомнить');draft.revealed=true;draft.earlyReveal=!!delta.earlyReveal}
  if(delta.timelineValue!==undefined){const scale=t.timeline;if(!scale||!Number.isInteger(delta.timelineValue)||delta.timelineValue<scale.min||delta.timelineValue>scale.max)throw Error('Значение вне шкалы');draft.timelineValue=delta.timelineValue}
  if(delta.sortOrder){if(delta.sortOrder.length!==t.items.length||new Set(delta.sortOrder).size!==t.items.length||!t.items.every(i=>delta.sortOrder!.includes(i.entityId)))throw Error('Некорректный порядок');draft.sortOrder=delta.sortOrder}
  s.interaction=draft;s.updatedAt=new Date().toISOString();await d.activeSessions.put(s);return draft;
 })},
 async answer(input:AnswerInput){return d.transaction('rw',sessionTables(d),async()=>{
  const duplicate=await d.reviewEvents.get(input.taskId);if(duplicate)return {pending:false as const,feedback:duplicate.payload.feedback,memories:await d.learningState.bulkGet(duplicate.targetIds),event:duplicate,results:(await d.activeSessions.get(input.sessionId))?.results??[],interaction:undefined,milestone:undefined};
  const session=await d.activeSessions.get(input.sessionId),task=session?.tasks[session.currentPosition];if(!task||!session||session.status!=='active'||task.id!==input.taskId)throw Error('Текущая карточка не найдена');
  if(!task.recipe.diagnostic){const old=await d.learningState.get(task.items[0].targetId);if(!old||old.payload.status==='suspended')throw Error('Это знание не участвует в практике');const due=unitDue(old.payload,session.id,session.completedCount??0);if(!due&&!task.retryOf&&session.mode!=='practice')throw Error('Пока не пора повторять это знание');task.practice=session.mode==='practice'&&!due&&!task.retryOf}
  let attempts:string[]=[];
  if(isDiscrete(task)){
   if(typeof input.answer!=='string'||!task.options.some(o=>o.id===input.answer))throw Error('Выберите один из вариантов');
   const draft=session.interaction?.taskId===task.id?session.interaction:{taskId:task.id,attemptSequence:[]};draft.firstAttemptLatencyMs??=Math.min(3600000,Math.max(0,input.latencyMs??0));if(!draft.attemptSequence.includes(input.answer))draft.attemptSequence.push(input.answer);attempts=draft.attemptSequence;
   session.interaction=draft;
   if(input.answer!==discreteAnswer(task)){session.updatedAt=new Date().toISOString();await d.activeSessions.put(session);return {pending:true as const,feedback:null,memories:[],event:undefined,results:session.results,interaction:draft,milestone:undefined}}
  }
  if(task.recipe.format==='recall_reveal'&&(typeof input.answer!=='boolean'||!session.interaction?.revealed))throw Error('Сначала откройте ответ');
  if(task.recipe.format==='timeline'){const scale=task.timeline,value=(input.answer as Record<string,unknown>)?.[task.items[0].entityId];if(!scale||!Number.isInteger(value)||Number(value)<scale.min||Number(value)>scale.max)throw Error('Подтвердите значение на шкале')}
  return commitReview(d,session,task,input,attempts);
 })},
 async importBundle(input:unknown){return d.transaction('rw',contentTables(d),async()=>{const b=validateImport(input,await getBundle(d));if(b.media.some(m=>!m.url.startsWith('engi-media://')))throw Error('Изображения нужны внутри пакета .engi');await putBundle(d,b);return {entities:b.entities.length,facts:b.facts.length,excluded:b.facts.filter(f=>!['direct','verified','user_confirmed'].includes(f.verification)).length}})},
 async editEntity(input:{entityId:string;name:string;facts:any[]}){const b=await getBundle(d),e=b.entities.find(e=>e.id===input.entityId);if(!e)throw Error('Объект не найден');const facts=input.facts.map(change=>{const f=b.facts.find(x=>x.id===change.id);if(!f)throw Error('Факт не найден');const next={...f,...change};if(f.valueKind==='date'&&change.year!==undefined&&String(change.year)!==f.dateStart?.slice(0,4)){const y=Number(change.year);if(!Number.isInteger(y)||y<1||y>2100)throw Error('Неверный год');next.dateStart=String(y).padStart(4,'0')+'-01-01';next.dateEnd=String(y).padStart(4,'0')+'-12-31';next.datePrecision='year'}return next});await saveEntity({...e,name:input.name},facts,b.entityTags.filter(t=>t.entityId===e.id&&!t.archived).map(t=>t.tagId),d);return {ok:true}},
 async reportQuestion(taskId:string,reason:string){if(!reason.trim())throw Error('Укажите причину');await d.reviewEvents.add({id:crypto.randomUUID(),timestamp:new Date().toISOString(),recipe:'report',level:'report',targetIds:[],payload:{taskId,reason:reason.slice(0,1000)}})},
 async resolveReport(reportId:string){return d.transaction('rw',d.reviewEvents,async()=>{if(!(await d.reviewEvents.get(reportId)))throw Error('Сообщение не найдено');if(!(await d.reviewEvents.get('resolved:'+reportId)))await d.reviewEvents.add({id:'resolved:'+reportId,timestamp:new Date().toISOString(),recipe:'report_resolved',level:'report',targetIds:[],payload:{reportId}})})}
}}
export const trainerService=createTrainerService(db);

