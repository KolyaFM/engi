import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createEmptyCard,State} from 'ts-fsrs';
import {synchronizeDayPlan,applyDayAttempt,dayPlanSummary,dayBoundary,newAdmission} from '../src/lib/engi/study-core/day-plan';
import {updateGoalMemories,type GoalMemory} from '../src/lib/engi/study-core/memory';
import type {Attempt} from '../src/lib/engi/study-core/attempts';
const at=new Date(2026,9,8,10,0,0);
function memory(id:string,state:State,due=new Date(at.getTime()-1000)):GoalMemory{return {goalId:id,card:{...createEmptyCard(at),state,due,reps:1},independentAttempts:1,independentSuccesses:1,lastCorrect:true};}
function attempt(id:string,goalId:string,correct=true,credit=true,now=at):Attempt{return {id,taskId:id,startedAt:now.toISOString(),submittedAt:now.toISOString(),phase:'submitted',ineligibleGoalIds:[],results:[{goalId,correct,credit,selfReported:false}]};}
test('day plan separates review, learning, later-today and next-day deadlines',()=>{
 const tomorrow=new Date(at);tomorrow.setDate(tomorrow.getDate()+1);
 const m=[memory('review',State.Review),memory('learn',State.Learning),memory('later',State.Review,new Date(at.getTime()+60000)),memory('tomorrow',State.Review,tomorrow)];
 const p=synchronizeDayPlan(undefined,['review','learn','later','tomorrow','new'],m,at),s=dayPlanSummary(p,at.getTime());
 assert.equal(s.repeat.total,2);assert.equal(s.repeat.ready,1);assert.equal(s.reinforce.total,1);assert.equal(s.new.total,1);assert.equal(s.nextAt,new Date(at.getTime()+60000).toISOString());
});
test('independent failure closes review and creates one timed reinforcement; correction and duplicate do nothing',()=>{
 const p=synchronizeDayPlan(undefined,['g'],[memory('g',State.Review)],at),a=attempt('first','g',false),after=memory('g',State.Relearning,new Date(at.getTime()+600000));
 const changed=applyDayAttempt(p,a,[after]),s=dayPlanSummary(changed,at.getTime());assert.equal(s.repeat.done,1);assert.equal(s.reinforce.left,1);assert.equal(s.reinforce.ready,0);assert(!s.completed);
 assert.deepEqual(applyDayAttempt(changed,a,[after]),changed);
 const second=applyDayAttempt(changed,attempt('second','g',false),[after]);assert.equal(second.reinforce.length,1);
 const good=applyDayAttempt(second,attempt('third','g'),[memory('g',State.Review,new Date(at.getTime()+86400000))]);assert(dayPlanSummary(good).completed);
});
test('a new failure consumes one first-check slot and adds reinforcement; hinted practice consumes neither',()=>{
 const p=synchronizeDayPlan(undefined,['g','h'],[],at);
 assert.deepEqual(applyDayAttempt(p,attempt('practice','g',true,false),[]),p);
 const q=applyDayAttempt(p,attempt('new','g',false),[memory('g',State.Learning,new Date(at.getTime()+60000))]);
 assert.deepEqual(q.newGoalIds,['g']);assert.equal(dayPlanSummary(q).new.left,1);assert.equal(q.reinforce.length,1);
});
test('steps after midnight are deferred, not presented as unfinished work for today',()=>{
 const late=new Date(2026,9,8,23,58),p=synchronizeDayPlan(undefined,['g'],[memory('g',State.Review)],late),future=new Date(2026,9,9,0,8);
 const q=applyDayAttempt(p,attempt('late','g',false,true,late),[memory('g',State.Relearning,future)]),s=dayPlanSummary(q,late.getTime());
 assert.equal(s.repeat.done,1);assert.equal(s.reinforce.left,0);assert.equal(s.reinforce.deferred,1);assert(s.completed);
 const tomorrow=synchronizeDayPlan(q,['g'],[memory('g',State.Relearning,future)],new Date(2026,9,9,0,0));
 assert.equal(tomorrow.day,dayBoundary(future).day);assert.equal(tomorrow.reinforce.length,1);assert.equal(tomorrow.processedAttemptIds.length,0);
});
test('suspension and revision removal explicitly exclude pending goals without claiming completion',()=>{
 const p=synchronizeDayPlan(undefined,['g'],[memory('g',State.Review)],at);
 const excluded=synchronizeDayPlan(p,[],[],at);assert.equal(dayPlanSummary(excluded).repeat.excluded,1);assert.equal(dayPlanSummary(excluded).repeat.done,0);
 const restored=synchronizeDayPlan(excluded,['g'],[memory('g',State.Review)],at);assert.equal(dayPlanSummary(restored).repeat.left,1);
});
test('new-goal budget is a hard bound and cannot silently expand through answers',()=>{
 let p=synchronizeDayPlan(undefined,['a','b','c','d'],[],at);
 for(const id of ['a','b','c'])p=applyDayAttempt(p,attempt(id,id),[memory(id,State.Learning)]);
 assert.equal(p.newBudget,3);assert.equal(p.newGoalIds.length,3);
 assert.throws(()=>applyDayAttempt(p,attempt('d','d'),[memory('d',State.Learning)]),/budget is exhausted/);
 assert.equal(p.newGoalIds.length,3);
});
test('bounded FSRS model: all 81 four-answer traces preserve balance, uniqueness and idempotency across days',()=>{
 for(let code=0;code<81;code++){
  let n=code,now=new Date(at),memories:GoalMemory[]=[],plan=synchronizeDayPlan(undefined,['g'],[],now);
  for(let step=0;step<4;step++){
   const outcome=n%3;n=Math.floor(n/3);if(memories.length)now=new Date(memories[0].card.due);
   plan=synchronizeDayPlan(plan,['g'],memories,now);const a=attempt(`${code}:${step}`,'g',outcome===0,outcome!==2,now);
   memories=updateGoalMemories(memories,a);plan=applyDayAttempt(plan,a,memories);
   assert.deepEqual(applyDayAttempt(plan,a,memories),plan);
   const s=dayPlanSummary(plan,now.getTime());for(const bucket of [s.repeat,s.reinforce,s.new])assert.equal(bucket.done+bucket.left,bucket.total);
   assert.equal(new Set(plan.newGoalIds).size,plan.newGoalIds.length);assert(plan.newGoalIds.length<=plan.newBudget);
   assert.equal(new Set(plan.repeat.map(r=>r.goalId)).size,plan.repeat.length);assert.equal(new Set(plan.reinforce.map(r=>r.goalId)).size,plan.reinforce.length);
   if(outcome===2)assert(!plan.processedAttemptIds.includes(a.id));
  }
 }
});
test('unfinished first learning carries across days and holds new admission until a goal graduates',()=>{
 const ids=['a','b','c','new'],memories=['a','b','c'].map(id=>memory(id,State.Learning));
 let p=synchronizeDayPlan(undefined,ids,memories,at);assert.equal(p.newTarget,1);assert(newAdmission(p).held);
 assert.throws(()=>applyDayAttempt(p,attempt('new','new'),[memory('new',State.Learning)]),/first-learning limit/);
 p=applyDayAttempt(p,attempt('graduate','a'),[memory('a',State.Review)]);assert.equal(newAdmission(p).available,1);
 p=applyDayAttempt(p,attempt('admit','new',false),[memory('new',State.Learning)]);assert(newAdmission(p).held);assert.deepEqual(p.newGoalIds,['new']);
});
test('suspension releases a first-learning slot; relearning does not use it; explicit extra budget expands it',()=>{
 const memories=['a','b','c'].map(id=>memory(id,State.Learning));memories.push(memory('old',State.Relearning));
 const ids=['a','b','c','old','new'],p=synchronizeDayPlan(undefined,ids,memories,at);assert.equal(newAdmission(p).active,3);
 const suspended=synchronizeDayPlan(p,ids.filter(id=>id!=='a'),memories,at);assert.equal(newAdmission(suspended).available,1);
 const extended=synchronizeDayPlan(p,ids,memories,at,5);assert.equal(newAdmission(extended).available,2);
});
test('a grouped admission cannot cross the remaining concurrent capacity or partially mutate the plan',()=>{
 const p=synchronizeDayPlan(undefined,['a','b','c','d'],[memory('a',State.Learning),memory('b',State.Learning)],at),before=structuredClone(p);
 const group=attempt('group','c');group.results!.push({...group.results![0],goalId:'d'});
 assert.throws(()=>applyDayAttempt(p,group,[memory('c',State.Learning),memory('d',State.Learning)]),/first-learning limit/);assert.deepEqual(p,before);
});
test('90 days of permanent errors keep first learning bounded and never invent graduation or a completed day',()=>{
 const ids=['a','b','c','new'];let memories:GoalMemory[]=['a','b','c'].map(id=>({...memory(id,State.Learning),independentSuccesses:0,lastCorrect:false})),plan=synchronizeDayPlan(undefined,ids,memories,at);
 for(let day=0;day<90;day++){
  const now=new Date(at.getTime()+day*86400000);plan=synchronizeDayPlan(plan,ids,memories,now);
  for(const id of ['a','b','c']){const a=attempt('permanent:'+day+':'+id,id,false,true,now);memories=updateGoalMemories(memories,a);plan=applyDayAttempt(plan,a,memories);}
  assert.equal(newAdmission(plan).active,3);assert(newAdmission(plan).held);assert.equal(plan.newGoalIds.length,0);assert(!dayPlanSummary(plan,now.getTime()).completed);assert(memories.every(m=>m.card.state===State.Learning&&m.independentSuccesses===0));
 }
});
