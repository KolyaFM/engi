import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createEmptyCard,State} from 'ts-fsrs';
import {studyWorkload} from '../src/lib/engi/study-core/workload';
import {synchronizeDayPlan} from '../src/lib/engi/study-core/day-plan';
test('workload counts introduced knowledge as active before its first answer, and learning while its timer is pending',()=>{
 const now=new Date(2026,9,8,10),memory={goalId:'a',card:{...createEmptyCard(now),state:State.Learning,due:new Date(now.getTime()+600000)},independentAttempts:1,independentSuccesses:1};
 const plan=synchronizeDayPlan(undefined,['a','b','c','d','e'],[memory],now,5);plan.newGoalIds=['a'];plan.newTarget=5;
 assert.deepEqual(studyWorkload(plan,[memory],['b','b','c']),{new:2,learning:3,repeat:0,mistakes:0});
 memory.card.state=State.Review;assert.deepEqual(studyWorkload(plan,[memory],['b','c']),{new:2,learning:2,repeat:0,mistakes:0});
});
test('scope excludes learning outside the collection, while future review obligations remain visible',()=>{
 const now=new Date(2026,9,8,10),memories=['a','x'].map(goalId=>({goalId,card:{...createEmptyCard(now),state:State.Learning},independentAttempts:1,independentSuccesses:1}));
 const plan=synchronizeDayPlan(undefined,['a','b','x'],memories,now,2);plan.newGoalIds=['a'];plan.newTarget=2;plan.repeat=[{goalId:'r',dueAt:new Date(now.getTime()+600000).toISOString(),status:'pending',reason:'review'}];
 assert.deepEqual(studyWorkload(plan,memories,['b','x'],new Set(['a','b','r'])),{new:0,learning:2,repeat:1,mistakes:0});
});
