import * as T from 'three';
import type {TourStop} from './tourContent';
import {walkStep,clampFov,angleDelta,EYE_HEIGHT} from './walkMath.ts';
import {planWalkRoute,walkSegmentClear,moveWithClearance,type WalkObstacle} from './walkNavigation.ts';

/** A single eye-height camera for entering, walking, looking and visiting. */
export class FreeWalk{
 readonly position=new T.Vector3(0,EYE_HEIGHT,11);
 private yaw=0;private pitch=0;private fov=74;
 private keys=new Set<string>();private stick={x:0,y:0};
 private drag:{id:number;x:number;y:number}|null=null;
 private enabled=false;private blocked=false;private manual=false;
 private route:T.Vector3[]=[];private aim:T.Vector3|null=null;private stop='street';
 private destination:T.Vector3|null=null;private retry=0;
 private host:HTMLDivElement;private onTravel:(moving:boolean)=>void;private onManual:()=>void;private obstacles:()=>readonly WalkObstacle[];
 constructor(host:HTMLDivElement,onTravel:(moving:boolean)=>void,onManual:()=>void,obstacles:()=>readonly WalkObstacle[]=()=>[]){
  this.host=host;this.onTravel=onTravel;this.onManual=onManual;this.obstacles=obstacles;
  host.addEventListener('pointerdown',this.down);host.addEventListener('pointermove',this.move);
  host.addEventListener('pointerup',this.up);host.addEventListener('pointercancel',this.up);
  host.addEventListener('wheel',this.wheel,{passive:false});
  window.addEventListener('keydown',this.keydown);window.addEventListener('keyup',this.keyup);
  window.addEventListener('blur',this.clear);document.addEventListener('visibilitychange',this.clear);
 }
 setEnabled(enabled:boolean,blocked=false){this.enabled=enabled;this.blocked=blocked;if(!enabled||blocked){this.clear();if(!enabled)this.cancel();}}
 private clear=()=>{this.keys.clear();this.stick={x:0,y:0};this.drag=null;this.manual=false;};
 private usable(){return this.enabled&&!this.blocked&&!document.hidden;}
 private keydown=(e:KeyboardEvent)=>{
  if(!this.usable()||e.ctrlKey||e.metaKey||e.altKey||!(e.code in {KeyW:1,KeyA:1,KeyS:1,KeyD:1,ArrowUp:1,ArrowDown:1,ArrowLeft:1,ArrowRight:1}))return;
  if((e.target as HTMLElement)?.closest('input,textarea,select,[contenteditable=true],dialog'))return;
  e.preventDefault();const first=!this.keys.has(e.code);this.keys.add(e.code);
  // A short tap still takes a small step even between two rendered frames.
  if(first)this.update(1/60);
 };
 private keyup=(e:KeyboardEvent)=>{this.keys.delete(e.code);};
 private down=(e:PointerEvent)=>{if(!this.usable()||e.button!==0||(e.target as HTMLElement).closest('button'))return;this.drag={id:e.pointerId,x:e.clientX,y:e.clientY};this.host.setPointerCapture(e.pointerId);};
 private move=(e:PointerEvent)=>{if(!this.drag||e.pointerId!==this.drag.id||!this.usable())return;
  this.yaw-=(e.clientX-this.drag.x)*.005;this.pitch=T.MathUtils.clamp(this.pitch+(e.clientY-this.drag.y)*.004,-1.05,1.05);
  this.drag.x=e.clientX;this.drag.y=e.clientY;
 };
 private up=(e:PointerEvent)=>{if(this.drag?.id!==e.pointerId)return;this.drag=null;if(this.host.hasPointerCapture(e.pointerId))this.host.releasePointerCapture(e.pointerId);};
 private wheel=(e:WheelEvent)=>{if(!this.usable()||(e.target as HTMLElement).closest('button'))return;e.preventDefault();this.zoom(e.deltaY*.04);};
 zoom(amount:number){this.fov=clampFov(this.fov+amount);}
 joystick(x:number,y:number){this.stick=this.usable()?{x,y}:{x:0,y:0};}
 cancel(){const moving=!!this.destination;this.route=[];this.aim=null;this.destination=null;if(moving)this.onTravel(false);}
 go(stop:TourStop){
  this.clear();this.stop=stop.id;const end=new T.Vector3(...stop.position);end.y=EYE_HEIGHT;
  this.destination=end;this.aim=new T.Vector3(...stop.look);this.replan(this.obstacles());this.onTravel(true);
 }
 private replan(obstacles:readonly WalkObstacle[]){
  this.route=planWalkRoute(this.position,this.destination!,obstacles,this.aim??undefined).map(p=>new T.Vector3(p.x,EYE_HEIGHT,p.z));this.retry=.25;
 }
 update(dt:number){
  if(!this.usable())return;
  const side=Number(this.keys.has('KeyD')||this.keys.has('ArrowRight'))-Number(this.keys.has('KeyA')||this.keys.has('ArrowLeft'))+this.stick.x;
  const forward=Number(this.keys.has('KeyW')||this.keys.has('ArrowUp'))-Number(this.keys.has('KeyS')||this.keys.has('ArrowDown'))-this.stick.y;
  if(Math.hypot(side,forward)>.04){
   if(!this.manual){this.manual=true;this.route=[];this.aim=null;this.destination=null;this.onManual();this.onTravel(false);}
   const wanted=walkStep(this.position.x,this.position.z,this.yaw,side,forward,dt),p=moveWithClearance(this.position,wanted,this.obstacles());this.position.set(p.x,EYE_HEIGHT,p.z);return;
  }
  this.manual=false;
  if(!this.destination)return;
  const obstacles=this.obstacles();this.retry-=Math.max(0,dt);
  if(!this.route.length||!walkSegmentClear(this.position,this.route[0],obstacles)){
   if(this.retry<=0)this.replan(obstacles);
   if(!this.route.length||!walkSegmentClear(this.position,this.route[0],obstacles))return;
  }
  const step=3.2*Math.min(Math.max(dt,0),.08),next=this.route[0],offset=next.clone().sub(this.position),distance=offset.length();
  if(distance<=step){this.position.copy(next);this.route.shift();}else this.position.addScaledVector(offset,step/distance);
  const target=this.route.length>1?this.route[0]:this.aim!;
  const direction=target.clone().sub(this.position);if(direction.lengthSq()>.001){
   this.yaw+=angleDelta(this.yaw,Math.atan2(direction.x,-direction.z))*Math.min(1,dt*4);
   this.pitch=T.MathUtils.lerp(this.pitch,Math.atan2(direction.y,Math.hypot(direction.x,direction.z)),Math.min(1,dt*4));
  }
  if(!this.route.length&&this.aim){const d=this.aim.clone().sub(this.position);this.yaw=Math.atan2(d.x,-d.z);this.pitch=Math.atan2(d.y,Math.hypot(d.x,d.z));this.aim=null;this.destination=null;this.onTravel(false);}
 }
 view(aspect:number){const direction=new T.Vector3(Math.sin(this.yaw)*Math.cos(this.pitch),Math.sin(this.pitch),-Math.cos(this.yaw)*Math.cos(this.pitch));return {position:this.position.clone(),target:this.position.clone().add(direction),direct:true,fov:clampFov(this.fov+(aspect<1?10:0))};}
 get state(){return {stop:this.stop,moving:!!this.destination,eye:EYE_HEIGHT,yaw:this.yaw,pitch:this.pitch,fov:this.fov};}
 dispose(){this.clear();this.host.removeEventListener('pointerdown',this.down);this.host.removeEventListener('pointermove',this.move);this.host.removeEventListener('pointerup',this.up);this.host.removeEventListener('pointercancel',this.up);this.host.removeEventListener('wheel',this.wheel);window.removeEventListener('keydown',this.keydown);window.removeEventListener('keyup',this.keyup);window.removeEventListener('blur',this.clear);document.removeEventListener('visibilitychange',this.clear);}
}
