import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dateValue,buildImportPlan} from '../src/lib/engi/import/semantic-merge';
import {parseV3} from '../src/lib/engi/import/schema-v3';
import {formatDateFact,yearInterval} from '../src/lib/engi/questions/date-interval';
import {textValue,factValue} from '../src/lib/engi/knowledge/properties';
import {validateImport} from '../src/lib/engi/validate';
import type {Fact,Bundle} from '../src/lib/engi/types';
const empty:Bundle={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[]};
function fact(v:unknown):Fact{return {id:'f',entityId:'e',key:'period',valueKind:'date',...dateValue(v),verification:'verified',source:{kind:'manual',name:'test'}};}
test('year intervals share one compact display without rounding full dates',()=>{
 const f=fact({start:1147,end:1149});assert.deepEqual(yearInterval(f),{start:1147,end:1149});assert.equal(formatDateFact(f),'1147–1149');assert.equal(textValue(f,empty),'1147–1149');
 assert.equal(formatDateFact(fact(1945)),'1945');assert.equal(formatDateFact(fact('1945-05-09')),'09.05.1945');
 assert.equal(yearInterval(fact({start:'1941-01-01',end:'1945-12-31'})),undefined);
 assert.equal(yearInterval(fact({start:1941,end:1945,approximate:true})),undefined);
 assert.deepEqual(yearInterval({...f,dateBoundaryPrecision:undefined}),{start:1147,end:1149});
 assert.equal(yearInterval({...f,dateStart:'1147-02-01',dateBoundaryPrecision:undefined}),undefined);
 assert.equal(formatDateFact(fact({start:'1941-06-22',end:'1945-05-09'})),'22.06.1941–09.05.1945');
});
test('precision survives validation, old fact identities and repeated pack import',()=>{
 const pkg=parseV3({schemaVersion:3,name:'Periods',properties:[{name:'Period',valueType:'date'}],entities:[{name:'Event',type:'Event',facts:[{property:'Period',value:{start:1147,end:1149},verification:'verified',source:{kind:'manual',name:'test'}}]}]});
 const first=buildImportPlan(pkg,empty,{},'one'),f=first.bundle.facts[0];assert.deepEqual(f.dateBoundaryPrecision,{start:'year',end:'year'});
 const old={...f,dateBoundaryPrecision:undefined};assert.equal(factValue(old),factValue(f),'precision annotation must not reset old year-range goals');
 const valid=validateImport(first.bundle,empty);assert.deepEqual(valid.facts[0].dateBoundaryPrecision,f.dateBoundaryPrecision);
 const again=buildImportPlan(pkg,first.bundle,{},'two');assert.equal(again.bundle.facts.length,1);assert.equal(again.bundle.facts[0].id,f.id);
});
