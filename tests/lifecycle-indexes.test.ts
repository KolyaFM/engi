import 'fake-indexeddb/auto';import {test} from 'node:test';import assert from 'node:assert/strict';
import {EngiDB} from '../src/db/engi-db';import {associationGoal} from '../src/lib/engi/study-core/compiler';import {emptyLifecycle,admitAcquisition} from '../src/lib/engi/study-core/acquisition';import {ensureLifecycle,LIFECYCLE_KEY} from '../src/services/learning-lifecycle-service';import type {Bundle} from '../src/lib/engi/types';
test('unchanged lifecycle reconciliation scans the catalog linearly, not once for every property',async()=>{
 const b:Bundle={entities:[{id:'e',name:'E',type:'event',aliases:[],externalIds:{}}],facts:Array.from({length:500},(_,n)=>({id:'f'+n,entityId:'e',key:'year',valueKind:'number',valueNumber:n,source:{name:'Test'},verification:'verified'})),properties:[{id:'year',name:'Year',valueKind:'number',cardinality:'many',learnable:true}],media:[],tags:[],entityTags:[],missing:[],unresolved:[]};
 const goals=b.facts.map(f=>associationGoal(b,f,'recognition')),entries=goals.map(goal=>({goal,targetIds:['t'],entityIds:['e'],propertyId:'year',suspended:false}));
 const ledger=admitAcquisition(emptyLifecycle(),'e',goals,new Date(0)),db=new EngiDB('linear-'+crypto.randomUUID());try{await db.appMeta.put({key:LIFECYCLE_KEY,value:ledger});let reads=0;const catalog=new Proxy(entries,{get(t,p,r){if(typeof p==='string'&&/^\d+$/.test(p))reads++;return Reflect.get(t,p,r);}});
  const result=await ensureLifecycle(db,catalog,new Date(100));assert.deepEqual(result,ledger);assert(reads<=entries.length*20,`catalog reads must be linear: ${reads} for ${entries.length} entries`);
 }finally{db.close();await db.delete();}
});
