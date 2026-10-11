import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FrameCadence} from '../src/atelier/FrameCadence.ts';

test('a 30 FPS scene stays near 30 FPS on fractional 60, 90 and 120 Hz displays instead of losing fractional frame time',()=>{
 for(const hz of [59.94,60,90,119.88,120]){
  const cadence=new FrameCadence(30);cadence.reset(0);let count=0,total=0;
  for(let callback=1;callback<=Math.floor(hz*10);callback++){
   const dt=cadence.advance(callback*1000/hz);if(dt!==null){count++;total+=dt;}
  }
  assert.ok(count>=298&&count<=300,`${hz} Hz produced ${count/10} FPS`);
  assert.ok(total>=9.93&&total<=10.01,'movement dt must include actual elapsed time');
 }
});

test('a slow frame renders once, skips overdue slots and visibility reset excludes background time',()=>{
 const cadence=new FrameCadence(30);cadence.reset(0);
 assert.equal(cadence.advance(10),null);assert.equal(cadence.advance(1250),1);
 assert.equal(cadence.advance(1250),null);assert.equal(cadence.advance(1260),null);
 assert.ok(cadence.advance(1284)!>0);cadence.reset(6000);
 assert.equal(cadence.advance(6001),null);
 assert.ok(Math.abs(cadence.advance(6034)!-.034)<1e-9);
});
