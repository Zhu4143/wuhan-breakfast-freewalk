import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FrameLoop,type FrameLoopClock} from '../src/atelier/FrameLoop.ts';
import {FrameCadence} from '../src/atelier/FrameCadence.ts';

class Display implements FrameLoopClock{
 time=0;period=1000/60;private id=0;
 jobs=new Map<number,{at:number;callback:()=>void}>();
 now=()=>this.time;
 requestFrame=(callback:(now:number)=>void)=>this.schedule(()=>callback(this.time),(Math.floor((this.time+.001)/this.period)+1)*this.period-this.time);
 cancelFrame=(id:number)=>{this.jobs.delete(id);};
 setTimer=(callback:()=>void,delay:number)=>this.schedule(callback,delay);
 clearTimer=this.cancelFrame;
 private schedule(callback:()=>void,delay:number){const id=++this.id;this.jobs.set(id,{at:this.time+delay,callback});return id;}
 advance(to:number){let count=0;while(true){const job=[...this.jobs].sort((a,b)=>a[1].at-b[1].at)[0];if(!job||job[1].at>to)break;assert.ok(++count<10000,'scheduler must not burst indefinitely');this.time=job[1].at;this.jobs.delete(job[0]);job[1].callback();}this.time=to;}
}

test('visible paired preview continues rendering and advancing animations when iframe rAF is throttled to 1 Hz',()=>{
 const display=new Display();display.period=1000;
 const cadence=new FrameCadence(30);cadence.reset(0);let frames=0,animationTicks=0;
 const loop=new FrameLoop((now,fallback)=>{if(fallback)animationTicks++;if(cadence.advance(now)!==null)frames++;},true,display);
 loop.start();display.advance(2000);loop.stop();
 assert.ok(frames>=45,`phone rendered only ${frames} frames in 2 seconds`);
 assert.ok(animationTicks>=45,'card and era animations must also advance');
 assert.equal(display.jobs.size,0,'stopping must cancel every callback');
});

test('healthy rAF uses the ordinary cadence without timer renders; repeated resume cannot duplicate the loop',()=>{
 const display=new Display(),cadence=new FrameCadence(30);cadence.reset(0);let frames=0,fallbacks=0;
 const loop=new FrameLoop((now,fallback)=>{if(fallback)fallbacks++;if(cadence.advance(now)!==null)frames++;},true,display);
 loop.start();loop.start();display.advance(2000);loop.stop();
 assert.ok(frames>=59&&frames<=60);assert.equal(fallbacks,0);assert.equal(display.jobs.size,0);
 display.advance(5000);assert.ok(frames<=60,'hidden or disposed scene must stay stopped');
 cadence.reset(5000);loop.start();display.advance(6000);loop.stop();assert.ok(frames>=88&&frames<=90);
});

test('only the starved phone recovers while the desktop continues through its healthy rAF loop',()=>{
 const desktop=new Display(),phone=new Display();phone.period=1000;
 const desktopCadence=new FrameCadence(30),phoneCadence=new FrameCadence(30);desktopCadence.reset(0);phoneCadence.reset(0);
 let desktopFrames=0,phoneFrames=0,desktopFallbacks=0,phoneFallbacks=0;
 const desktopLoop=new FrameLoop((now,fallback)=>{if(fallback)desktopFallbacks++;if(desktopCadence.advance(now)!==null)desktopFrames++;},true,desktop);
 const phoneLoop=new FrameLoop((now,fallback)=>{if(fallback)phoneFallbacks++;if(phoneCadence.advance(now)!==null)phoneFrames++;},true,phone);
 desktopLoop.start();phoneLoop.start();desktop.advance(2000);phone.advance(2000);
 assert.equal(desktopFallbacks,0);assert.ok(desktopFrames>=59);assert.ok(phoneFrames>=45);assert.ok(phoneFallbacks>=45);
 phoneLoop.stop();desktop.advance(2500);assert.ok(desktopFrames>=74,'phone recovery must not stop or restart the desktop');desktopLoop.stop();
 assert.equal(phone.jobs.size,0);assert.equal(desktop.jobs.size,0);
});

test('preview fallback exits after healthy callbacks return and never changes ordinary standalone scenes',()=>{
 const display=new Display();display.period=1000;const fallbackTimes:number[]=[];
 const loop=new FrameLoop((now,fallback)=>{if(fallback)fallbackTimes.push(now);},true,display);
 loop.start();display.advance(1000);display.period=1000/60;display.advance(2500);loop.stop();
 assert.ok(fallbackTimes.some(t=>t<1000));assert.ok(fallbackTimes.every(t=>t<=2100),'watchdog must yield when normal animation frames resume');
 const standalone=new Display();standalone.period=1000;let calls=0;
 const ordinary=new FrameLoop((_,fallback)=>{assert.equal(fallback,false);calls++;},false,standalone);
 ordinary.start();standalone.advance(2000);ordinary.stop();assert.equal(calls,2);assert.equal(standalone.jobs.size,0);
});
