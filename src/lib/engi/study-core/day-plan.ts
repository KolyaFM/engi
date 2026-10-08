import type {GoalMemory} from './memory';
import type {Attempt} from './attempts';
import {applyMistakes,synchronizeMistakes,type KnowledgeMistake} from './mistakes';
export const DEFAULT_NEW_GOALS_PER_DAY=3;
export type DayObligation={goalId:string;dueAt:string;status:'pending'|'done'|'excluded'|'deferred';reason:'review'|'learning'|'mistake'};
export type GoalDayPlan={scopeLabel?:string;nextAvailabilityAt?:string;day:string;endsAt:string;newBudget:number;newTarget:number;newGoalIds:string[];learningGoalIds?:string[];mistakes?:KnowledgeMistake[];unavailableMistakes?:number;available?:{repeat:number;reinforce:number;new:number};repeat:DayObligation[];reinforce:DayObligation[];processedAttemptIds:string[]};
export function newAdmission(plan:GoalDayPlan){const active=new Set(plan.learningGoalIds??[]).size,limit=plan.newBudget;return {active,limit,available:Math.max(0,limit-active),held:active>=limit};}
export function dayBoundary(now:Date){
 const day=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
 const end=new Date(now);end.setHours(24,0,0,0);return {day,endsAt:end.toISOString()};
}
/** Synchronization may add newly available obligations, but never invents a successful answer. */
export function synchronizeDayPlan(previous:GoalDayPlan|undefined,activeIds:string[],memories:GoalMemory[],now:Date,newBudget=DEFAULT_NEW_GOALS_PER_DAY):GoalDayPlan{
 const boundary=dayBoundary(now),plan:GoalDayPlan=previous?.day===boundary.day?structuredClone(previous):{...boundary,newBudget,newTarget:0,newGoalIds:[],repeat:[],reinforce:[],processedAttemptIds:[]};
 plan.newBudget=Math.max(plan.newGoalIds.length,Math.max(0,Math.floor(newBudget)));
 const active=new Set(activeIds),known=new Map(memories.filter(m=>active.has(m.goalId)).map(m=>[m.goalId,m]));
 plan.mistakes=synchronizeMistakes(previous?.mistakes,[...known.values()],now);
 plan.learningGoalIds=[...known.values()].filter(m=>m.independentAttempts>0&&Number(m.card.state)===1).map(m=>m.goalId);
 for(const list of [plan.repeat,plan.reinforce])for(const row of list){
  if(!active.has(row.goalId)&&row.status==='pending')row.status='excluded';
  else if(active.has(row.goalId)&&row.status==='excluded')row.status='pending';
 }
 for(const m of known.values()){
  if(!m.independentAttempts||new Date(m.card.due).getTime()>=new Date(plan.endsAt).getTime())continue;
  const list=Number(m.card.state)===2?plan.repeat:plan.reinforce;
  const existing=list.find(r=>r.goalId===m.goalId);
  if(!existing)list.push({goalId:m.goalId,dueAt:new Date(m.card.due).toISOString(),status:'pending',reason:list===plan.repeat?'review':m.lastCorrect===false?'mistake':'learning'});
  else if(existing.status==='pending')existing.dueAt=new Date(m.card.due).toISOString();
 }
 const fresh=activeIds.filter(id=>!known.has(id)&&!plan.newGoalIds.includes(id)).length;
 plan.newTarget=Math.min(plan.newBudget,plan.newGoalIds.length+fresh);
 return plan;
}
/** Call atomically with the first credited answer and its new FSRS memory. */
export function applyDayAttempt(previous:GoalDayPlan,attempt:Attempt,after:GoalMemory[]):GoalDayPlan{
 const plan=structuredClone(previous);
 if(attempt.phase!=='submitted'||plan.processedAttemptIds.includes(attempt.id))return plan;
 const results=attempt.results?.filter(r=>r.credit)??[];
 if(!results.length)return plan;
 plan.processedAttemptIds.push(attempt.id);
 plan.mistakes=applyMistakes(plan.mistakes??[],attempt,after);
 const memory=new Map(after.map(m=>[m.goalId,m]));
 for(const result of results){
  const repeat=plan.repeat.find(r=>r.goalId===result.goalId),reinforce=plan.reinforce.find(r=>r.goalId===result.goalId);
  if(repeat?.status==='pending')repeat.status='done';
  if(!repeat&&!reinforce&&!plan.newGoalIds.includes(result.goalId)){
   if(plan.newGoalIds.length>=plan.newBudget)throw Error('Daily new-goal budget is exhausted');
   if(newAdmission(plan).held)throw Error('Concurrent first-learning limit is exhausted');
   plan.newGoalIds.push(result.goalId);
  }
  const m=memory.get(result.goalId);if(!m)throw Error('Credited answer has no goal memory');
  const learning=new Set(plan.learningGoalIds??[]);if(Number(m.card.state)===1)learning.add(m.goalId);else learning.delete(m.goalId);plan.learningGoalIds=[...learning];
  if(Number(m.card.state)===2&&result.correct){if(reinforce)reinforce.status='done';}
  else{
   const row:DayObligation={goalId:result.goalId,dueAt:new Date(m.card.due).toISOString(),status:new Date(m.card.due).getTime()<new Date(plan.endsAt).getTime()?'pending':'deferred',reason:result.correct?'learning':'mistake'};
   if(reinforce)Object.assign(reinforce,row);else plan.reinforce.push(row);
  }
 }
 plan.newTarget=Math.max(plan.newTarget,plan.newGoalIds.length);
 return plan;
}
export function dayPlanSummary(plan:GoalDayPlan,now=Date.now(),goalIds?:Set<string>){
 const bucket=(rows:DayObligation[])=>{
  const relevant=rows.filter(r=>!goalIds||goalIds.has(r.goalId)),active=relevant.filter(r=>r.status!=='excluded'&&r.status!=='deferred'),pending=active.filter(r=>r.status==='pending');
  return {total:active.length,done:active.filter(r=>r.status==='done').length,left:pending.length,ready:pending.filter(r=>new Date(r.dueAt).getTime()<=now).length,excluded:relevant.filter(r=>r.status==='excluded').length,deferred:relevant.filter(r=>r.status==='deferred').length};
 };
 const repeat=bucket(plan.repeat),reinforce=bucket(plan.reinforce),fresh={total:plan.newTarget,done:plan.newGoalIds.length,left:Math.max(0,plan.newTarget-plan.newGoalIds.length)};
 const dates=[...plan.repeat,...plan.reinforce].filter(r=>r.status==='pending'&&(!goalIds||goalIds.has(r.goalId))).map(r=>new Date(r.dueAt).getTime()).filter(t=>t>now);
 return {repeat,reinforce,new:fresh,admission:newAdmission(plan),completed:repeat.left===0&&reinforce.left===0&&fresh.left===0,nextAt:dates.length?new Date(Math.min(...dates)).toISOString():undefined};
}
