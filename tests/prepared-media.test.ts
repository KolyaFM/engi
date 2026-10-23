import {test} from 'node:test';import assert from 'node:assert/strict';
import {createPreparedMediaPool} from '../src/media/prepared-media';
test('warmup and mounted consumers share URL, retain active resources and evict idle LRU',async()=>{
 let loads=0;const disposed:string[]=[];
 const pool=createPreparedMediaPool(async source=>({url:source+ ++loads,bytes:8,dispose:()=>disposed.push(source)}),{entries:2,bytes:16});
 const [a,b]=await Promise.all([pool.acquire('a'),pool.acquire('a')]);assert.equal(loads,1);assert.equal(a.url,b.url);a.release();b.release();
 const active=await pool.acquire('a');for(const key of ['b','c','d']){const r=await pool.acquire(key);r.release();}assert(!disposed.includes('a'));assert.equal(pool.stats().idle,2);active.release();assert(pool.stats().bytes<=16);
 pool.clear();assert.equal(pool.stats().idle,0);
});
test('failed loads retry and clearing in-flight warmup cannot revoke another active URL',async()=>{
 let fail=true,disposed=0;const pool=createPreparedMediaPool(async()=>{if(fail)throw Error('missing');return {url:'u',bytes:1,dispose:()=>disposed++};});
 await assert.rejects(pool.acquire('a'));fail=false;const r=await pool.acquire('a');pool.clear();assert.equal(disposed,0);r.release();assert.equal(disposed,1);r.release();assert.equal(disposed,1);
});
test('in-flight clear does not dispose a newly acquired replacement',async()=>{
 let resolve!: (r:{url:string;bytes:number;dispose:()=>void})=>void,loads=0;const disposed:string[]=[];
 const pool=createPreparedMediaPool(async()=>++loads===1?new Promise(r=>{resolve=r;}):{url:'new',bytes:1,dispose:()=>disposed.push('new')});
 const pending=pool.acquire('a');pool.clear();const replacement=await pool.acquire('a');resolve({url:'old',bytes:1,dispose:()=>disposed.push('old')});const old=await pending;old.release();assert.deepEqual(disposed,['old']);assert.equal(replacement.url,'new');replacement.release();pool.clear();assert.deepEqual(disposed,['old','new']);
});
