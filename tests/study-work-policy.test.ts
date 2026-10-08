import {test} from 'node:test';
import assert from 'node:assert/strict';
import {selectRepairCandidate} from '../src/lib/engi/session/study-work-policy';
import {defineGoal} from '../src/lib/engi/study-core/goals';
import {knowledgeMistakeKey} from '../src/lib/engi/study-core/mistakes';
import type {Task} from '../src/lib/engi/types';
const goal=(key:string)=>defineGoal({knowledge:{kind:'fact',key},skill:'recognition',direction:'forward',cueRole:'subject',precision:'value',revision:'v1'});
const candidate=(key:string,time='2026-10-08T10:00:00Z',format='choice')=>({key:knowledgeMistakeKey(goal(key)),goal:goal(key),lastAttemptAt:time,format});
const task=(key:string,intent:'learn'|'repair'='learn')=>({intent,recipe:{format:'choice'},studyContract:{primaryGoals:[goal(key)]}} as Task);
test('learning gives a fresh mistake two intervening tasks, draining never waits',()=>{
 const candidates=[candidate('a')];
 assert.equal(selectRepairCandidate(candidates,[task('a')],true),-1);
 assert.equal(selectRepairCandidate(candidates,[task('a'),task('b')],true),-1);
 assert.equal(selectRepairCandidate(candidates,[task('a'),task('b'),task('c')],true),0);
 assert.equal(selectRepairCandidate(candidates,[task('a')],false),0);
});
test('draining rotates mistakes and changes format when only one knowledge remains',()=>{
 assert.equal(selectRepairCandidate([candidate('a'),candidate('b')],[task('a','repair')],false),1);
 assert.equal(selectRepairCandidate([candidate('a'),candidate('a',undefined,'recall_reveal')],[task('a','repair')],false),1);
});
test('repair cannot monopolize learning and oldest unseen mistake wins',()=>{
 assert.equal(selectRepairCandidate([candidate('b')],[task('a','repair')],true),-1);
 assert.equal(selectRepairCandidate([candidate('a','2026-10-08T11:00:00Z'),candidate('b')],[],true),1);
});
