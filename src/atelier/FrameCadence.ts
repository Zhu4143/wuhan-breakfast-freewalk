/** One scene update per display callback, capped at a steady render cadence. */
export class FrameCadence{
 private last=0;private next=0;
 private interval:number;
 constructor(fps=30){this.interval=1000/fps;}
 reset(now:number){this.last=now;this.next=now+this.interval;}
 advance(now:number):number|null{
  if(now+.01<this.next)return null;
  const dt=Math.min(Math.max(0,now-this.last)/1000,1);this.last=now;
  // Keep the original deadline grid instead of discarding sub-frame remainder.
  // After a stall, skip missed slots rather than bursting several scene renders.
  this.next+=this.interval*(1+Math.floor(Math.max(0,now-this.next)/this.interval));
  return dt;
 }
}
