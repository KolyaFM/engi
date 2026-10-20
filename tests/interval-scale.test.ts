import {test} from 'node:test';import assert from 'node:assert/strict';
import {buildIntervalScale,intervalAxisTicks} from '../src/lib/engi/questions/interval-scale';

test('axis restores readable intermediate years for old sparse and anchored tasks',()=>{
 for(const width of [220,288,560]){const ticks=intervalAxisTicks(1920,2000,width);assert(ticks.length>=3);assert(ticks.some(y=>y>1920&&y<2000));assert(ticks.every((y,n)=>!n||(y-ticks[n-1])/80*width>=44));}
});
test('bands share one linear scale, have usable geometry, and never accept duplicate periods',()=>{
 const values=[{id:'a',start:1939,end:1945},{id:'b',start:1941,end:1945},{id:'c',start:1947,end:1950}];
 const scale=buildIntervalScale(values,'dated',288)!;assert(scale);assert(scale.min<=1939&&scale.max>=1951);assert.equal(scale.bands.length,3);assert(scale.ticks.length>=2);assert(scale.bands.every(b=>(b.end+1-b.start)/(scale.max-scale.min)*288>=12));
 assert(scale.ticks.every((y,n)=>!n||(y-scale.ticks[n-1])/(scale.max-scale.min)*288>=44),'year labels cannot overlap on a phone');
 assert.equal(buildIntervalScale([...values,{...values[0],id:'d'}],'dated',288),undefined);
 assert.equal(buildIntervalScale([values[0],values[1]],'dated',288),undefined);
 assert.equal(buildIntervalScale([{id:'a',start:1000,end:2000},{id:'b',start:1941,end:1941},{id:'c',start:1945,end:1945}],'dated',288),undefined);
 assert.equal(buildIntervalScale(values,'anchored',288),undefined);assert(buildIntervalScale(values.map((v,n)=>({...v,support:n===0})),'anchored',288));
 assert.equal(buildIntervalScale(values.map(v=>({...v,end:v.start-1})),'dated',288),undefined);
});
