import {test} from 'node:test';
import assert from 'node:assert/strict';
import {shouldIntroduce,chooseWorkLane,dueTurnsSinceFirstCheck} from '../src/lib/engi/session/continuous-feed-policy';
test('waiting confirmations do not occupy first-check capacity; admissions are paced',()=>{
 assert.equal(shouldIntroduce({firstChecks:0,firstCheckObjects:0,actionsSinceIntro:3,hasReady:true,onlyLastObject:false}),true);
 assert.equal(shouldIntroduce({firstChecks:4,firstCheckObjects:2,actionsSinceIntro:1,hasReady:true,onlyLastObject:false}),false);
 assert.equal(shouldIntroduce({firstChecks:4,firstCheckObjects:2,actionsSinceIntro:3,hasReady:true,onlyLastObject:false}),true);
 assert.equal(shouldIntroduce({firstChecks:20,firstCheckObjects:3,actionsSinceIntro:5,hasReady:true,onlyLastObject:false}),false);
});
test('repairs and introductions cannot reset first-check fairness',()=>{assert.equal(dueTurnsSinceFirstCheck(['bootstrap','due','retry','intro','confirmation']),2);assert.equal(dueTurnsSinceFirstCheck(['due','confirmation','bootstrap','retry']),0);});
test('rich objects can seed variety without an unlimited first-check backlog',()=>{
 assert.equal(shouldIntroduce({firstChecks:16,firstCheckObjects:2,actionsSinceIntro:3,hasReady:true,onlyLastObject:false}),true);
 assert.equal(shouldIntroduce({firstChecks:24,firstCheckObjects:3,actionsSinceIntro:3,hasReady:true,onlyLastObject:false}),false);
});
test('due work receives two turns then a first-check turn when both exist',()=>{
 assert.equal(chooseWorkLane(true,true,0),'due');
 assert.equal(chooseWorkLane(true,true,1),'due');
 assert.equal(chooseWorkLane(true,true,2),'first');
 assert.equal(chooseWorkLane(true,false,2),'due');
});
