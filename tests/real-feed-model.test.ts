import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);
test('isolated virtual-clock smoke executes the real feed, database, contracts and FSRS without changing host time',async()=>{
 const before=Date.now();
 const {stdout}=await run(process.execPath,['--import','tsx','scripts/check-real-feed.mjs','--days=2','--no-pool'],{cwd:process.cwd(),env:{...process.env,TZ:'Europe/Moscow'},maxBuffer:4*1024*1024,timeout:60000});
 const report=JSON.parse(stdout);assert.equal(report.virtualClock,true);assert.equal(report.results.length,4);assert(Date.now()>=before&&Date.now()-before<60000);
 for(const result of report.results){assert(result.answers>0);assert(result.credits>0);assert(result.maxLearning<=3);assert(result.catalogGoals>0);assert.equal(result.days,2);}
 assert(report.results.find((r:any)=>r.kind==='sets').formats.multi_choice>0);
});

