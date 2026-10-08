import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createEmptyCard,State} from 'ts-fsrs';
import {defineGoal} from '../src/lib/engi/study-core/goals';
import {applyDayAttempt,synchronizeDayPlan} from '../src/lib/engi/study-core/day-plan';
import type {GoalMemory} from '../src/lib/engi/study-core/memory';
import type {Attempt} from '../src/lib/engi/study-core/attempts';
const at=new Date(2026,9,8,10);
function memory(skill:'recognition'|'recall'='recognition',fact='f1',revision='v1',correct=true):GoalMemory{
 const goal=defineGoal({knowledge:{kind:'fact',key:fact},skill,direction:'forward',cueRole:'subject-to-value',precision:'value',revision});
 return {goal,goalId:goal.id,lastCorrect:correct,independentAttempts:1,independentSuccesses:Number(correct),card:{...createEmptyCard(at),state:State.Review,due:at}};
}
function answer(m:GoalMemory,correct:boolean,seconds=0,credit=true):Attempt{
 return {id:crypto.randomUUID(),taskId:'t',phase:'submitted',startedAt:at.toISOString(),submittedAt:new Date(+at+seconds*1000).toISOString(),ineligibleGoalIds:[],results:[{goalId:m.goalId,correct,credit,selfReported:false}]};
}
test('one knowledge mistake survives duplicate failures, corrections and midnight',()=>{
 const m=memory(),a=answer(m,false),p=synchronizeDayPlan(undefined,[m.goalId],[m],at);
 const failed=applyDayAttempt(p,a,[m]);assert.equal(failed.mistakes?.length,1);
 assert.deepEqual(applyDayAttempt(failed,a,[m]),failed);
 const twice=applyDayAttempt(failed,answer(m,false,20),[m]);assert.equal(twice.mistakes?.length,1);
 assert.equal(applyDayAttempt(twice,answer(m,true,90,false),[m]).mistakes?.length,1);
 const tomorrow=synchronizeDayPlan(twice,[m.goalId],[m],new Date(2026,9,9));assert.equal(tomorrow.mistakes?.length,1);
});
test('a different skill closes the same fact only after a fresh independent check',()=>{
 const recognition=memory(),recall=memory('recall'),p=synchronizeDayPlan(undefined,[recognition.goalId,recall.goalId],[recognition,recall],at);
 const failed=applyDayAttempt(p,answer(recognition,false),[recognition]);
 assert.equal(applyDayAttempt(failed,answer(recall,true,30),[recall]).mistakes?.length,1);
 assert.equal(applyDayAttempt(failed,answer(recall,true,61),[recall]).mistakes?.length,0);
});
test('unrelated facts and revised content cannot close a pending mistake',()=>{
 const m=memory(),other=memory('recall','f2'),edited=memory('recall','f1','v2'),p=synchronizeDayPlan(undefined,[m.goalId,other.goalId,edited.goalId],[m,other,edited],at);
 const failed=applyDayAttempt(p,answer(m,false),[m]);
 assert.equal(applyDayAttempt(failed,answer(other,true,61),[other]).mistakes?.length,1);
 assert.equal(applyDayAttempt(failed,answer(edited,true,61),[edited]).mistakes?.length,1);
 assert.equal(synchronizeDayPlan(failed,[edited.goalId],[edited],at).mistakes?.length,0);
});
test('existing failures migrate once and a resolved cross-format mistake does not reappear',()=>{
 const bad=memory('recognition','f1','v1',false),good=memory('recall'),p=synchronizeDayPlan(undefined,[bad.goalId,good.goalId],[bad,good],at);
 assert.equal(p.mistakes?.length,1);
 const resolved=applyDayAttempt(p,answer(good,true,61),[good]);
 assert.equal(synchronizeDayPlan(resolved,[bad.goalId,good.goalId],[bad,good],at).mistakes?.length,0);
});
test('practice failures do not add mistakes',()=>{
 const m=memory(),p=synchronizeDayPlan(undefined,[m.goalId],[m],at);
 assert.equal(applyDayAttempt(p,answer(m,false,0,false),[m]).mistakes?.length,0);
});
test('migration does not reopen an old failure already checked independently in another skill',()=>{
 const bad=memory('recognition','f1','v1',false),good=memory('recall');
 bad.card.last_review=at;good.card.last_review=new Date(+at+61000);
 const p=synchronizeDayPlan(undefined,[bad.goalId,good.goalId],[bad,good],new Date(+at+120000));
 assert.equal(p.mistakes?.length,0);
});
