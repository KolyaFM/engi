import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildIntervalGroup} from '../src/services/interval-group-composition';
import {goalProposalPool} from '../src/services/goal-proposals';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {triagedMemory} from '../src/lib/engi/learning/bootstrap';
import type {Bundle} from '../src/lib/engi/types';
import {arePeriodsClose} from '../src/lib/engi/questions/interval-proximity';

function fixture(ranges:number[][]):Bundle{return {entities:ranges.map((_,n)=>({id:'e'+n,name:'Event '+n,type:n%2?'person':'event',aliases:[],externalIds:{}})),facts:ranges.map(([start,end],n)=>({id:'f'+n,entityId:'e'+n,key:'period',valueKind:'date',datePrecision:'range',dateStart:String(start).padStart(4,'0')+'-01-01',dateEnd:String(end).padStart(4,'0')+'-12-31',verification:'verified',source:{name:'Test'}})),properties:[{id:'period',name:'Period',valueKind:'date',cardinality:'one',learnable:true}],media:[],tags:[],entityTags:[],missing:[],unresolved:[]};}
const proposals=(b:Bundle)=>goalProposalPool(b,canonicalTargets(b).map(i=>triagedMemory(i,'red','test',0)),'all','choice').proposals;

test('period groups reject distant eras even when every band is wide enough to render',()=>{
 for(const width of [240,560]){
  const b=fixture([[100,150],[1000,1050],[1900,1950]]);
  assert.equal(buildIntervalGroup(b,proposals(b),[],[],width),undefined,'readable width alone must not admit unrelated eras');
 }
});

test('a distant known reference cannot bypass temporal proximity',()=>{
 const b=fixture([[1939,1960],[1970,1990],[1500,1550]]),ready=proposals(b);
 assert.equal(buildIntervalGroup(b,ready.filter(p=>p.items[0].factId!=='f2'),ready.filter(p=>p.items[0].factId==='f2'),[],560),undefined);
});

test('group search skips early outliers and finds a smaller local cluster',()=>{
 const b=fixture([[800,850],[1400,1450],[1939,1945],[1941,1945],[1947,1950]]);
 for(const width of [240,560]){const task=buildIntervalGroup(b,proposals(b),[],[],width);assert(task);assert.equal(task.items.length,3);assert(task.items.every(i=>['f2','f3','f4'].includes(i.factId!)));}
});

test('proximity adapts to long periods and keeps custom mixed event types',()=>{
 for(const ranges of [[[100,400],[250,600],[500,800]],[[1922,1991],[1939,1945],[1955,1975],[1953,1960],[1961,1963]],[[9980,9985],[9987,9990],[9991,9999]]]){
  const b=fixture(ranges),task=buildIntervalGroup(b,proposals(b),[],[],560);assert(task);assert.equal(task.items.length,ranges.length);
 }
});

test('one huge enclosing period cannot make distant short periods comparable',()=>{
 const b=fixture([[1000,1800],[1001,1040],[1750,1789]]);
 assert.equal(buildIntervalGroup(b,proposals(b),[],[],560),undefined);
});

test('proximity uses inclusive years, handles overlap, rejects invalid bounds and does not mutate inputs',()=>{
 const periods=[{start:1902,end:1902},{start:1900,end:1900},{start:1901,end:1901}],before=structuredClone(periods);
 assert(arePeriodsClose(periods));assert.deepEqual(periods,before);
 assert(arePeriodsClose([{start:1900,end:2000},{start:1920,end:1940},{start:1930,end:1950}]));
 for(const bad of [{start:0,end:5},{start:2,end:1},{start:1,end:10000},{start:NaN,end:4},{start:2.5,end:4}])assert.equal(arePeriodsClose([periods[0],periods[1],bad]),false);
 assert.equal(arePeriodsClose(periods.slice(0,2)),false);assert.equal(arePeriodsClose([...periods,...periods]),false);
});

test('moving or scaling an era does not change the relative proximity decision',()=>{
 for(const ranges of [[[10,15],[30,35],[50,55]],[[10,15],[90,95],[170,175]]]){
  const periods=ranges.map(([start,end])=>({start,end})),expected=arePeriodsClose(periods);
  for(const factor of [1,2,10])for(const shift of [0,1000])assert.equal(arePeriodsClose(periods.map(p=>({start:(p.start-1)*factor+1+shift,end:p.end*factor+shift}))),expected);
 }
});
