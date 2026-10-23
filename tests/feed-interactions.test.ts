import {test} from 'node:test';import assert from 'node:assert/strict';
import {classifyFeedInteraction,FEED_FORMAT_POLICY} from '../src/services/feed-interactions';
import type {Task,Format} from '../src/lib/engi/types';
const task=(format:Format,extra:Partial<Task>={}):Task=>({id:'t',reason:'game',recipe:{id:'r',format,cue:'name',answerKey:'p',memoryKey:'p',diagnostic:false},items:[{entityId:'e',name:'E',targetId:'u',answer:'a',answerId:'a',aliases:[],sourceUrl:''}],options:[],...extra});
test('all recipe formats and actual interactions have explicit policy',()=>{
 assert.equal(Object.keys(FEED_FORMAT_POLICY).length,9);
 for(const format of Object.keys(FEED_FORMAT_POLICY) as Format[])assert(classifyFeedInteraction(task(format)).kind);
 assert.equal(classifyFeedInteraction(task('match')).kind,'atomic-choice');
 assert.equal(classifyFeedInteraction(task('categorize')).family,'objective');
 assert.equal(classifyFeedInteraction(task('match',{intervalExercise:{kind:'bands',scale:{} as never}})).kind,'period-bands');
 assert.equal(classifyFeedInteraction(task('choice',{intervalExercise:{kind:'endpoint',edge:'end'}})).kind,'period-end');
 assert.equal(classifyFeedInteraction(task('sort')).kind,'order-date');
 assert.equal(classifyFeedInteraction(task('choice',{numericChoiceMode:'nearby'})).numeric,'nearby');
 const q=task('choice');q.recipe.direction='reverse';q.recipe.answerPresentation='image';assert.equal(classifyFeedInteraction(q).answer,'image');assert.equal(classifyFeedInteraction(q).direction,'reverse');
});
