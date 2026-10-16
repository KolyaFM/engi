import {test} from 'node:test';import assert from 'node:assert/strict';
import {intervalDistractors} from '../src/lib/engi/questions/interval-distractors';
import {composeUnit} from '../src/lib/engi/session/composer';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {triagedMemory} from '../src/lib/engi/learning/bootstrap';
import {compileTaskContract} from '../src/lib/engi/study-core/compiler';
import {gradeResponse} from '../src/lib/engi/study-core/contracts';
import type {Bundle,Recipe} from '../src/lib/engi/types';
import {intervals,intervalRecipe} from './helpers-intervals';
test('range alternatives are unique, valid and vary each boundary and relative rank',()=>{
 for(const duration of [0,1,4,50]){const b=intervals();b.facts[0].dateEnd=(1900+duration)+'-12-31';const item=canonicalTargets(b).find(i=>i.factId==='f0')!,ranks=new Set<string>(),changes=new Set<string>();
 for(let n=0;n<300;n++){const wrong=intervalDistractors(b,item,intervalRecipe)!;assert.equal(wrong.length,3);assert.equal(new Set(wrong.map(o=>o.name)).size,3);for(const o of wrong){assert.notEqual(o.id,item.answerId);const [a,z]=o.name.split('–').map(Number);assert(a<=z);assert(a>=1);assert(z<=9999);assert(Math.abs(a-1900)<=3&&Math.abs(z-(1900+duration))<=3);changes.add((a===1900?'same':'new')+':'+(z===1900+duration?'same':'new'));}const starts=wrong.map(o=>Number(o.name.split('–')[0]));ranks.add(String(starts.filter(y=>y<1900).length));}assert(changes.has('new:same'));assert(changes.has('same:new'));assert(changes.has('new:new'));assert(ranks.size>=3);}
});
test('composed range choice uses the existing goal and grades exactly once',()=>{const b=intervals(),i=canonicalTargets(b).find(i=>i.factId==='f0')!,m=triagedMemory(i,'red','s',0);for(let n=0;n<20;n++){const t=composeUnit(b,m,'all','choice')!;assert(t);const c=compileTaskContract(b,t);assert.equal(c.primaryGoals.length,1);assert.equal(c.primaryGoals[0].precision,'range');assert(gradeResponse(c,i.answerId)[0].correct);assert(!gradeResponse(c,t.options.find(o=>o.id!==i.answerId)!.id)[0].correct);}});
