import {test} from 'node:test';
import assert from 'node:assert/strict';
import {advanceMorning,morningTime,openShopCount,pedestrianPresence,openingTimes,shopIsOpen,OPENING_SPAN} from '../src/street/marketTime.ts';

test('the morning counts visible dwell time, can pause, and stops at 08:00',()=>{
 assert.equal(advanceMorning(0,150,true),.5);
 assert.equal(advanceMorning(.5,900,false),.5);
 assert.equal(advanceMorning(.5,-10,true),.5);
 assert.equal(advanceMorning(.5,900,true),1);
 assert.deepEqual([0,.5,1].map(morningTime),['05:00','06:30','08:00']);
});
test('each of the six doors opens in order and can be previewed backwards',()=>{
 assert.equal(openShopCount(0),0);assert.equal(openShopCount(1),6);
 for(const [id,start] of Object.entries(openingTimes)){
  assert.equal(shopIsOpen(id,start),false);assert.equal(shopIsOpen(id,start+OPENING_SPAN+.00001),true);
  assert.equal(shopIsOpen(id,0),false);
 }
 for(let i=1;i<=100;i++)assert.ok(openShopCount(i/100)>=openShopCount((i-1)/100));
});
test('four early risers grow gradually to eighteen with no abrupt opacity change',()=>{
 assert.equal(Array.from({length:18},(_,i)=>pedestrianPresence(i,0)).filter(Boolean).length,4);
 assert.equal(Array.from({length:18},(_,i)=>pedestrianPresence(i,1)).filter(v=>v===1).length,18);
 assert.ok(pedestrianPresence(4,.1075)>.4&&pedestrianPresence(4,.1075)<.6);
});
