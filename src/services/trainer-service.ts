import {db,type EngiDB,type SessionRow,type InteractionDraft} from '../db/engi-db';
import type {Familiarity} from '../lib/engi/types';
import {getSnapshot,getBundle,putBundle,contentTables,learningRow} from '../db/repositories';
import {saveEntity} from './knowledge-service';
import {validateImport} from '../lib/engi/validate';
import {commitReview,reviewReceiptKey,abandonReview,type AnswerInput} from './review-commit';
import {isDiscrete,isMapping,discreteAnswer} from '../lib/engi/questions/timeline';
import {canonicalTargets} from '../lib/engi/questions/recipe-factory';
import {pickFeed,dailyNewState} from '../lib/engi/session/candidate-pool';
import {triagedMemory,unitDue} from '../lib/engi/learning/bootstrap';
import {compileIntroContract} from '../lib/engi/study-core/compiler';
import {prepareStudyTask,feedStudyCore,auditStudyAnswer,commitInvalidStudyTask} from './study-core-bridge';
import {pickGoalFeed} from './goal-feed';
import {getGoalSnapshot} from './goal-snapshot';
import {buildGoalCatalog} from './goal-catalog';
import {ensureDayPlan} from './day-plan-service';
import {measureFeed} from './feed-performance';
import {answerMatchPair,type MatchPairInput} from './matching-service';
import {knowledgeMistakeKey} from '../lib/engi/study-core/mistakes';
import {newAdmission} from '../lib/engi/study-core/day-plan';
import {markRepairUnavailable,MISTAKE_EPISODES_KEY,type MistakeEpisode} from './mistake-episodes';
import {studyAvailability} from './study-availability-service';
import {readStudyPreferences} from './study-preferences-service';

async function selectNext(d:EngiDB,s:SessionRow){
 const b=await measureFeed('bundle.read',()=>getBundle(d)),memories=(await d.learningState.toArray()).filter(r=>!r.payload.legacyOf).map(r=>r.payload),daily=dailyNewState((await d.appMeta.get('newLearning'))?.value),introduced=(await d.appMeta.get('introducedEntities'))?.value??[];
 const next=s.memoryModel==='goals'?await measureFeed('selection',()=>pickGoalFeed(d,b,memories,s,daily,introduced)):pickFeed(b,memories,s,daily,introduced);if(next.task)await measureFeed('task.prepare',()=>prepareStudyTask(d,b,next.task));s.waitingUntil='waitingUntil' in next?next.waitingUntil as string|undefined:undefined;s.tasks=next.task?[next.task]:[];s.currentPosition=0;s.intro=next.intro;s.exhausted=!!next.exhausted;s.interaction=undefined;s.updatedAt=new Date().toISOString();await d.activeSessions.put(s);return s;
}
const sessionTables=(d:EngiDB)=>[...contentTables(d),d.learningState,d.activeSessions,d.reviewEvents,d.appMeta];
export function createTrainerService(d:EngiDB){return {
 getSnapshot:()=>getSnapshot(d),
 getGoalSnapshot:()=>getGoalSnapshot(d),
 async getDayPlan(tag='all',format?:string){return d.transaction('rw',sessionTables(d),async()=>{
  const bundle=await getBundle(d),enabled=(await d.learningState.toArray()).map(r=>r.payload),catalog=buildGoalCatalog(bundle,enabled);
  const rows=await d.appMeta.bulkGet(catalog.map(e=>'studyCore:memory:'+e.goal.id));
  const plan=await ensureDayPlan(d,catalog,rows.filter(r=>!!r).map(r=>r!.value));
  if(format){const availability=await studyAvailability(d,bundle,enabled,plan,rows.filter(r=>!!r).map(r=>r!.value),tag,format);plan.available=availability.counts;plan.nextAvailabilityAt=availability.nextAt;}
  if(tag==='all')return plan;
  const targets=new Set(canonicalTargets(bundle,tag).map(i=>i.targetId)),scoped=catalog.filter(e=>e.targetIds.every(id=>targets.has(id))),goals=scoped.filter(e=>!e.suspended).map(e=>e.goal),ids=new Set(goals.map(g=>g.id)),keys=new Set(scoped.map(e=>knowledgeMistakeKey(e.goal))),known=new Set(rows.filter(r=>!!r).map(r=>r!.value.goalId));
  const unavailableMistakes=((await d.appMeta.get(MISTAKE_EPISODES_KEY))?.value.episodes??[]).filter((e:MistakeEpisode)=>e.status==='unavailable'&&keys.has(e.key)).length;
  const newGoalIds=plan.newGoalIds.filter(id=>ids.has(id)),fresh=[...ids].filter(id=>!known.has(id)).length;
  return {...plan,scopeLabel:bundle.decks?.find(t=>t.id===tag)?.name??bundle.tags.find(t=>t.id===tag)?.name??'Выбранная подборка',repeat:plan.repeat.filter(r=>ids.has(r.goalId)),reinforce:plan.reinforce.filter(r=>ids.has(r.goalId)),mistakes:plan.mistakes?.filter(m=>keys.has(m.key)),unavailableMistakes,newGoalIds,newTarget:newGoalIds.length+Math.min(fresh,plan.newTarget-plan.newGoalIds.length)};
 })},
 async refreshGoalFeed(id:string){return d.transaction('rw',sessionTables(d),async()=>{const s=await d.activeSessions.get(id);if(!s||s.status!=='active'||s.memoryModel!=='goals'||!s.exhausted)throw Error('Сначала завершите текущую карточку');return selectNext(d,s)})},
 async retryUnavailableMistakes(id:string){return d.transaction('rw',sessionTables(d),async()=>{
  const s=await d.activeSessions.get(id);if(!s||s.status!=='active'||s.memoryModel!=='goals'||!s.exhausted)throw Error('Сначала завершите текущую карточку');
  const b=await getBundle(d),enabled=(await d.learningState.toArray()).map(r=>r.payload),targets=new Set(canonicalTargets(b,s.tag).map(i=>i.targetId));
  const keys=new Set(buildGoalCatalog(b,enabled).filter(e=>!e.suspended&&e.targetIds.every(id=>targets.has(id))).map(e=>knowledgeMistakeKey(e.goal))),row=await d.appMeta.get(MISTAKE_EPISODES_KEY);
  if(row){for(const episode of row.value.episodes as MistakeEpisode[])if(episode.status==='unavailable'&&keys.has(episode.key)){episode.status='open';episode.failedImage=undefined;episode.unavailableReason=undefined;}await d.appMeta.put(row);}
  return selectNext(d,s);
 })},
 async preloadMedia(id:string){const s=await d.activeSessions.get(id);if(!s)return [];return [...new Set(s.tasks.slice(s.currentPosition,s.currentPosition+4).flatMap(t=>t.items.map(i=>i.image).filter((url):url is string=>!!url)))];},
 async startGoalFeed(tag='all',format='mixed',mode='daily'){return createTrainerService(d).startFeed(tag,format,mode,'goals')},
 async startFeed(tag='all',format='mixed',mode='daily',memoryModel?:'goals'){
  if(!['mixed','multi_choice','choice','recall_reveal','match','categorize','timeline','sort','missing'].includes(format))throw Error('Выберите доступный формат без ввода текста');
  await getSnapshot(d);const now=new Date().toISOString(),s:SessionRow={memoryModel,id:crypto.randomUUID(),tasks:[],currentPosition:0,results:[],mode,createdAt:now,updatedAt:now,status:'active',timeLeft:90,feed:true,tag,format,completedCount:0,ordinaryCount:0,cooldown:[],repairQueue:[],diagnosticSeen:[]};
  return d.transaction('rw',sessionTables(d),async()=>{for(const receipt of await d.appMeta.where('key').startsWith('studyCore:reviewReceipt:').toArray())await abandonReview(d,receipt.value.id);for(const previous of await d.activeSessions.where('status').equals('active').toArray()){const task=previous.tasks[previous.currentPosition];if(task?.studyContract)await feedStudyCore(d).skip(task.id);}await d.activeSessions.where('status').equals('active').modify({status:'completed'});return selectNext(d,s)});
 },
 async advanceFeed(id:string,skip=false,expectedTaskId?:string){return measureFeed('advance.total',()=>d.transaction('rw',sessionTables(d),async()=>{
  const s=await d.activeSessions.get(id);if(!s?.feed||s.status!=='active')throw Error('Лента не найдена');const task=s.tasks[s.currentPosition];if(expectedTaskId&&task?.id!==expectedTaskId)return s;
  if(s.intro)throw Error('Сначала завершите знакомство');
  if(task){if(skip){await abandonReview(d,task.id);if(task.intent==='repair')await markRepairUnavailable(d,task.repairEpisodeIds??[],task.recipe.cue==='image'?task.items[0].image:undefined);if(task.studyContract)await feedStudyCore(d).skip(task.id);}if(!skip&&!await d.reviewEvents.get(task.id))throw Error('Сначала завершите карточку');s.cooldown=[...s.cooldown??[],task].slice(-30);s.completedCount=(s.completedCount??0)+1;if(!skip&&!task.recipe.diagnostic&&!task.retryOf&&task.intent!=='repair')s.ordinaryCount=(s.ordinaryCount??0)+1;if(task.recipe.diagnostic)s.diagnosticSeen=[...s.diagnosticSeen??[],task.recipe.id]}
  return selectNext(d,s);
 }))},
 async openMore(id:string,practice=false){return d.transaction('rw',sessionTables(d),async()=>{const s=await d.activeSessions.get(id);if(!s||s.status!=='active'||!s.exhausted)throw Error('Сначала завершите текущую практику');if(practice){s.mode='practice';s.format='mixed'}else{const {newCardsPerDay}=await readStudyPreferences(d);if(!newCardsPerDay)throw Error('Укажите дневной лимит новых карточек в настройках');const daily=dailyNewState((await d.appMeta.get('newLearning'))?.value);daily.extraBudget+=newCardsPerDay;await d.appMeta.put({key:'newLearning',value:daily})}return selectNext(d,s)})},
 async saveIntroSelection(id:string,unitId:string,color:Familiarity){return d.transaction('rw',d.activeSessions,async()=>{const s=await d.activeSessions.get(id);if(!s?.intro||!s.intro.unitIds.includes(unitId)||!['red','orange','yellow','green','suspended'].includes(color))throw Error('Свойство больше не доступно');s.intro.selections[unitId]=color;await d.activeSessions.put(s);return s})},
 async saveIntroSelections(id:string,selections:Record<string,Familiarity>){return d.transaction('rw',d.activeSessions,async()=>{const s=await d.activeSessions.get(id);if(!s?.intro)throw Error('Знакомство уже завершено');for(const [unitId,color] of Object.entries(selections)){if(s.intro.unitIds.includes(unitId)&&['red','orange','yellow','green','suspended'].includes(color))s.intro.selections[unitId]=color}await d.activeSessions.put(s);return s})},
 async completeIntro(id:string){return d.transaction('rw',sessionTables(d),async()=>{
  const s=await d.activeSessions.get(id);if(!s?.intro||s.status!=='active')throw Error('Знакомство уже завершено');const intro=s.intro,b=await getBundle(d),units=canonicalTargets(b).filter(i=>intro.unitIds.includes(i.targetId));
  for(const i of units)if(!await d.learningState.get(i.targetId))await d.learningState.put(learningRow(triagedMemory(i,intro.selections[i.targetId]??'red',s.id,(s.completedCount??0)+1)));
  const introduced=new Set<string>((await d.appMeta.get('introducedEntities'))?.value??[]);introduced.add(intro.entityId);await d.appMeta.put({key:'introducedEntities',value:[...introduced]});
  if(!intro.newProperty){const daily=dailyNewState((await d.appMeta.get('newLearning'))?.value);daily.introducedEntityIds=[...new Set([...daily.introducedEntityIds,intro.entityId])];await d.appMeta.put({key:'newLearning',value:daily})}
  const item=units[0];if(item)s.cooldown=[...s.cooldown??[],{id:'intro:'+crypto.randomUUID(),items:[item],options:[],reason:'intro',recipe:{id:'intro',format:'choice' as const,cue:'name' as const,answerKey:'identity',memoryKey:'intro',diagnostic:false}}].slice(-30);
  const introContract=compileIntroContract(b,intro,s.id);if(await d.appMeta.get('studyCore:attempt:'+introContract.id))await feedStudyCore(d).skip(introContract.id);
  s.completedCount=(s.completedCount??0)+1;s.intro=undefined;return selectNext(d,s);
 })},
 async getResumableSession(){const s=(await d.activeSessions.where('status').equals('active').sortBy('updatedAt')).at(-1);if(!s)return;if(!s.feed){await d.activeSessions.update(s.id,{status:'completed'});return}
  if(s.memoryModel!=='goals')return s;
  return d.transaction('rw',sessionTables(d),async()=>{
   if(s.exhausted)return selectNext(d,s);
   if(s.intro){const plan=await createTrainerService(d).getDayPlan();if(Math.min(Math.max(0,plan.newTarget-plan.newGoalIds.length),newAdmission(plan).available)===0)return selectNext(d,s);}
   const task=s.tasks[s.currentPosition];
   if(task&&task.intent!=='repair'&&!task.practice&&!task.recipe.diagnostic){
    const goals=task.studyContract?.primaryGoals??[],rows=await d.appMeta.bulkGet(goals.map(g=>'studyCore:memory:'+g.id)),fresh=rows.filter(r=>!r).length;
    if(fresh){const plan=await createTrainerService(d).getDayPlan(),slots=Math.min(Math.max(0,plan.newTarget-plan.newGoalIds.length),newAdmission(plan).available);
     if(fresh>slots){if(task.studyContract)await feedStudyCore(d).skip(task.id);return selectNext(d,s);}}
   }
   return s;
  });
 },
 async observeIntroVisibility(sessionId:string,episodeId:string,event:'start'|'refresh'|'end'){
  return d.transaction('rw',sessionTables(d),async()=>{
   const session=await d.activeSessions.get(sessionId),core=feedStudyCore(d);
   // Queued heartbeats and cleanup still belong to the object that opened this episode.
   if(event!=='start'){
    const old=(await d.appMeta.get('studyCore:episode:'+episodeId))?.value;
    if(old?.attemptId.startsWith('intro:'+sessionId+':'))return core.observe(old.attemptId,'question',episodeId,event);
   }
   if(!session?.intro||session.status!=='active')return;
   const contract=compileIntroContract(await getBundle(d),session.intro,session.id);
   await core.setContentRevisions(contract.contentRevisions);await core.open(contract,contract.id);
   return core.observe(contract.id,'question',episodeId,event);
  });
 },
 async observeVisibility(sessionId:string,taskId:string,phase:'question'|'feedback'|'matched-pairs'|'answer-reveal'|'early-answer'|'details'|'source',episodeId:string,event:'start'|'refresh'|'end'){
  return d.transaction('rw',sessionTables(d),async()=>{
   const session=await d.activeSessions.get(sessionId),task=session?.tasks[session.currentPosition];
   if(!task||task.id!==taskId||session?.status!=='active'){if(event==='end'&&(session?.tasks.some(t=>t.id===taskId)||session?.cooldown?.some(t=>t.id===taskId)))return feedStudyCore(d).observe(taskId,phase,episodeId,event);return;}
   if(!task.studyContract&&!task.studyContractIssue)await prepareStudyTask(d,await getBundle(d),task);
   if(!task.studyContract)return;
   await d.activeSessions.put(session);
   return feedStudyCore(d).observe(task.id,phase,episodeId,event);
  });
 },
 async getFeedback(taskId:string){return (await d.reviewEvents.get(taskId))?.payload.feedback??null},
 async answerMatchPair(input:MatchPairInput){return d.transaction('rw',sessionTables(d),()=>answerMatchPair(d,input))},
 async saveInteraction(sessionId:string,taskId:string,delta:Partial<Omit<InteractionDraft,'taskId'|'attemptSequence'>>){return d.transaction('rw',d.activeSessions,d.reviewEvents,d.appMeta,async()=>{
  const s=await d.activeSessions.get(sessionId),t=s?.tasks[s.currentPosition];if(!s||s.status!=='active'||!t||t.id!==taskId)throw Error('Карточка уже сменилась');if(await d.reviewEvents.get(taskId))return s.interaction;
  const draft:InteractionDraft=s.interaction?.taskId===taskId?{...s.interaction}:{taskId,attemptSequence:[]};
  if(delta.recallElapsedMs!==undefined){if(!Number.isFinite(delta.recallElapsedMs))throw Error('Некорректное время');draft.recallElapsedMs=Math.min(5000,Math.max(draft.recallElapsedMs??0,delta.recallElapsedMs))}
  if(delta.revealed){if(t.recipe.format!=='recall_reveal'||(draft.recallElapsedMs??0)<5000&&!delta.earlyReveal)throw Error('Ещё есть время вспомнить');draft.revealed=true;draft.earlyReveal=!!delta.earlyReveal;if(delta.earlyReveal&&t.studyContract)await feedStudyCore(d).hint(t.id,'early-answer')}
  if(delta.timelineValue!==undefined){const scale=t.timeline;if(!scale||!Number.isInteger(delta.timelineValue)||delta.timelineValue<scale.min||delta.timelineValue>scale.max)throw Error('Значение вне шкалы');draft.timelineValue=delta.timelineValue}
  if(delta.sortOrder){if(delta.sortOrder.length!==t.items.length||new Set(delta.sortOrder).size!==t.items.length||!t.items.every(i=>delta.sortOrder!.includes(i.entityId)))throw Error('Некорректный порядок');draft.sortOrder=delta.sortOrder}
  if(delta.mapping){const values=Object.values(delta.mapping);if(!isMapping(t)||Object.entries(delta.mapping).some(([key,value])=>!t.items.some(i=>i.entityId===key)||!t.options.some(o=>o.id===value))||t.recipe.format==='match'&&new Set(values).size!==values.length)throw Error('Некорректное сопоставление');draft.mapping={...delta.mapping};}
  s.interaction=draft;s.updatedAt=new Date().toISOString();await d.activeSessions.put(s);return draft;
 })},
 async answer(input:AnswerInput){return measureFeed('answer.total',()=>d.transaction('rw',sessionTables(d),async()=>{
  const duplicate=await d.reviewEvents.get(input.taskId);if(duplicate)return {pending:false as const,feedback:duplicate.payload.feedback,memories:duplicate.payload.memoryModel==='goals'?[]:await d.learningState.bulkGet(duplicate.targetIds),event:duplicate,results:(await d.activeSessions.get(input.sessionId))?.results??[],interaction:undefined,milestone:undefined};
  const session=await d.activeSessions.get(input.sessionId),task=session?.tasks[session.currentPosition];if(!task||!session||session.status!=='active'||task.id!==input.taskId)throw Error('Текущая карточка не найдена');
  const answeredAt=new Date();
  if(task.memoryModel==='goals'&&!await d.appMeta.get(reviewReceiptKey(task.id))){
   const catalog=buildGoalCatalog(await getBundle(d),(await d.learningState.toArray()).map(r=>r.payload));
   const rows=await d.appMeta.bulkGet(catalog.map(e=>'studyCore:memory:'+e.goal.id));await ensureDayPlan(d,catalog,rows.filter(r=>!!r).map(r=>r!.value),answeredAt);
  }
  const hasReceipt=!!await d.appMeta.get(reviewReceiptKey(task.id));
  if(task.memoryModel==='goals'&&!hasReceipt&&!task.studyContract&&!task.studyContractIssue)await prepareStudyTask(d,await getBundle(d),task,answeredAt);
  const goalBefore=task.memoryModel==='goals'&&!hasReceipt?(await d.appMeta.bulkGet((task.studyContract?.primaryGoals??[]).map(g=>'studyCore:memory:'+g.id))).filter(r=>!!r).map(r=>r!.value):[];
  if(isMapping(task)){const rows=await d.learningState.bulkGet(task.items.map(i=>i.targetId));if(rows.some(row=>!row||row.payload.status==='suspended'))return commitInvalidStudyTask(d,session,task);}
  if(!task.recipe.diagnostic&&!hasReceipt){const old=await d.learningState.get(task.items[0].targetId);if(!old||old.payload.status==='suspended')throw Error('Это знание не участвует в практике');if(task.memoryModel!=='goals'){const due=unitDue(old.payload,session.id,session.completedCount??0);if(!due&&!task.retryOf&&session.mode!=='practice')throw Error('Пока не пора повторять это знание');task.practice=session.mode==='practice'&&!due&&!task.retryOf}}
  let attempts:string[]=[];
  if(isDiscrete(task)){
   if(typeof input.answer!=='string'||!task.options.some(o=>o.id===input.answer))throw Error('Выберите один из вариантов');
   const draft=session.interaction?.taskId===task.id?session.interaction:{taskId:task.id,attemptSequence:[]};draft.firstAttemptLatencyMs??=Math.min(3600000,Math.max(0,input.latencyMs??0));if(!draft.attemptSequence.includes(input.answer))draft.attemptSequence.push(input.answer);attempts=draft.attemptSequence;
   session.interaction=draft;
   if(input.answer!==discreteAnswer(task)){const audited=await auditStudyAnswer(d,task,attempts[0],answeredAt);if(task.studyContractIssue||audited?.phase==='stale')return commitInvalidStudyTask(d,session,task);return commitReview(d,session,task,input,attempts,audited,true,goalBefore)}
  }
  if(task.recipe.format==='recall_reveal'&&(typeof input.answer!=='boolean'||!session.interaction?.revealed))throw Error('Сначала откройте ответ');
  if(task.recipe.format==='timeline'){const scale=task.timeline,value=(input.answer as Record<string,unknown>)?.[task.items[0].entityId];if(!scale||!Number.isInteger(value)||Number(value)<scale.min||Number(value)>scale.max)throw Error('Подтвердите значение на шкале')}
  const audited=await auditStudyAnswer(d,task,isDiscrete(task)?attempts[0]:input.answer,answeredAt);
  if(task.studyContractIssue||audited?.phase==='stale')return commitInvalidStudyTask(d,session,task);
  return commitReview(d,session,task,input,attempts,audited,false,goalBefore);
 }))},
 async importBundle(input:unknown){return d.transaction('rw',contentTables(d),async()=>{const b=validateImport(input,await getBundle(d));if(b.media.some(m=>!m.url.startsWith('engi-media://')))throw Error('Изображения нужны внутри пакета .engi');await putBundle(d,b);return {entities:b.entities.length,facts:b.facts.length,excluded:b.facts.filter(f=>!['direct','verified','user_confirmed'].includes(f.verification)).length}})},
 async editEntity(input:{entityId:string;name:string;facts:any[]}){const b=await getBundle(d),e=b.entities.find(e=>e.id===input.entityId);if(!e)throw Error('Объект не найден');const facts=input.facts.map(change=>{const f=b.facts.find(x=>x.id===change.id);if(!f)throw Error('Факт не найден');const next={...f,...change};if(f.valueKind==='date'&&change.year!==undefined&&String(change.year)!==f.dateStart?.slice(0,4)){const y=Number(change.year);if(!Number.isInteger(y)||y<1||y>2100)throw Error('Неверный год');next.dateStart=String(y).padStart(4,'0')+'-01-01';next.dateEnd=String(y).padStart(4,'0')+'-12-31';next.datePrecision='year'}return next});await saveEntity({...e,name:input.name},facts,b.entityTags.filter(t=>t.entityId===e.id&&!t.archived).map(t=>t.tagId),d);return {ok:true}},
 async reportQuestion(taskId:string,reason:string){if(!reason.trim())throw Error('Укажите причину');await d.reviewEvents.add({id:crypto.randomUUID(),timestamp:new Date().toISOString(),recipe:'report',level:'report',targetIds:[],payload:{taskId,reason:reason.slice(0,1000)}})},
 async resolveReport(reportId:string){return d.transaction('rw',d.reviewEvents,async()=>{if(!(await d.reviewEvents.get(reportId)))throw Error('Сообщение не найдено');if(!(await d.reviewEvents.get('resolved:'+reportId)))await d.reviewEvents.add({id:'resolved:'+reportId,timestamp:new Date().toISOString(),recipe:'report_resolved',level:'report',targetIds:[],payload:{reportId}})})}
}}
export const trainerService=createTrainerService(db);

