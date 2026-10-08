import {test} from 'node:test';
import assert from 'node:assert/strict';
import {feedPerformance,feedSpan,measureFeed} from '../src/services/feed-performance';
test('latency tracing is opt-in, bounded and records failures without changing results',async()=>{
 feedPerformance.stop();feedSpan('disabled')();feedPerformance.start();assert.deepEqual(feedPerformance.report(),[]);
 assert.equal(await measureFeed('ok',async()=>42),42);
 await assert.rejects(measureFeed('failed',async()=>{throw Error('failure');}),/failure/);
 assert.deepEqual(feedPerformance.report().map(r=>r.stage),['ok','failed']);
 const report=feedPerformance.report();report[0].stage='tampered';assert.equal(feedPerformance.report()[0].stage,'ok');
 for(let n=0;n<1100;n++)feedSpan('bounded')();assert.equal(feedPerformance.report().length,1000);
 assert(feedPerformance.report().every(r=>r.ms>=0));feedPerformance.stop();
});
