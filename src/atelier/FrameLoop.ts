export type FrameLoopClock={
 now:()=>number;
 requestFrame:(callback:(now:number)=>void)=>number;
 cancelFrame:(handle:number)=>void;
 setTimer:(callback:()=>void,delay:number)=>number;
 clearTimer:(handle:number)=>void;
};
const browserClock:FrameLoopClock={
 now:()=>performance.now(),requestFrame:callback=>requestAnimationFrame(callback),cancelFrame:handle=>cancelAnimationFrame(handle),
 setTimer:(callback,delay)=>window.setTimeout(callback,delay),clearTimer:handle=>window.clearTimeout(handle),
};

/** rAF normally owns rendering. Explicit paired previews can recover from visible iframe rAF starvation. */
export class FrameLoop{
 private active=false;private frame:number|null=null;private timer:number|null=null;
 private lastFrame=0;private recovering=false;private healthyFrames=0;
 private readonly stallMs=150;private readonly recoveryMs=1000/30;
 private render:(now:number,fallback:boolean)=>void;private fallbackEnabled:boolean;private clock:FrameLoopClock;
 constructor(render:(now:number,fallback:boolean)=>void,fallbackEnabled=false,clock:FrameLoopClock=browserClock){this.render=render;this.fallbackEnabled=fallbackEnabled;this.clock=clock;}
 start(){
  if(this.active)return;this.active=true;this.lastFrame=this.clock.now();this.recovering=false;this.healthyFrames=0;
  this.frame=this.clock.requestFrame(this.onFrame);if(this.fallbackEnabled)this.armTimer(this.stallMs);
 }
 stop(){
  this.active=false;if(this.frame!==null)this.clock.cancelFrame(this.frame);if(this.timer!==null)this.clock.clearTimer(this.timer);
  this.frame=null;this.timer=null;
 }
 private onFrame=(now:number)=>{
  if(!this.active)return;
  const gap=now-this.lastFrame;this.lastFrame=now;
  if(this.recovering){this.healthyFrames=gap<this.stallMs?this.healthyFrames+1:0;if(this.healthyFrames>=3)this.recovering=false;}
  // Schedule before rendering; even a failed render must not strand the loop.
  this.frame=this.clock.requestFrame(this.onFrame);this.render(now,false);
 };
 private armTimer(delay:number){this.timer=this.clock.setTimer(this.watchdog,delay);}
 private watchdog=()=>{
  if(!this.active)return;const now=this.clock.now(),gap=now-this.lastFrame;
  if(gap>=this.stallMs){this.recovering=true;this.healthyFrames=0;}
  this.armTimer(this.recovering?this.recoveryMs:Math.max(this.recoveryMs,this.stallMs-gap));
  if(this.recovering)this.render(now,true);
 };
}
