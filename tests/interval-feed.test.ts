import {test} from 'node:test';import assert from 'node:assert/strict';
import {intervals} from './helpers-intervals';
import {buildEndpointTask} from '../src/services/interval-composition';
import {composeUnit} from '../src/lib/engi/session/composer';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {triagedMemory} from '../src/lib/engi/learning/bootstrap';
import {compileTaskContract} from '../src/lib/engi/study-core/compiler';
test('endpoint selection alternates, respects templates and always leaves a full check next',()=>{
 const b=intervals(),i=canonicalTargets(b).find(i=>i.factId==='f0')!,exact=composeUnit(b,triagedMemory(i,'red','s',0),'all','choice')!;exact.intent='learn';exact.learningLifecycle=1;
 b.properties![0].promptTemplates={rangeEnd:'Когда завершилось событие?'};
 const partial=buildEndpointTask(b,exact,{goalId:'g',revision:'r',attemptIds:[],start:{correct:true,at:''},end:{correct:false,at:''}},[])!;assert.equal(partial.intervalExercise?.kind,'endpoint');assert.equal(partial.items[0].answerId,'1905');assert.equal(partial.recipe.prompt,'Когда завершилось событие?');assert(partial.options.every(o=>Number(o.id)>=1900));
 assert.equal(buildEndpointTask(b,exact,undefined,[partial]),undefined);assert(buildEndpointTask(b,exact,undefined,[partial,exact]));
 const c=compileTaskContract(b,partial);assert.equal(c.primaryGoals[0].precision,'range');assert(c.shownClaims.some(c=>c.revealsGoalIds.includes(compileTaskContract(b,exact).primaryGoals[0].id)));
 exact.reason='confirmation';assert.equal(buildEndpointTask(b,exact,undefined,[]),undefined);exact.reason='due';assert.equal(buildEndpointTask(b,exact,undefined,[]),undefined);
});
