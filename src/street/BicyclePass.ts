import * as T from 'three';
import type {PaperWorkshop} from '../atelier/PaperWorkshop';
import {bodySegmentClear,type WalkObstacle} from './walkNavigation';
import {smooth} from './marketTime';
import type {BicycleCue} from './marketSoundModel';
/** A six-second paper cyclist supplies the visible event for the supplied passing clip. */
export class BicyclePass{
 readonly root=new T.Group();private sprite:T.Mesh;private materials:T.Material[];private elapsed=0;
 private serial=0;private cooldown=8;private crossing=false;private moving=false;private visibility=0;private z=0;
 readonly radius=1.8;
 constructor(w:PaperWorkshop,parent:T.Group,image:HTMLImageElement){
  this.root.name='passing-old-bicycle';this.root.userData.animationRoot=true;this.root.visible=false;parent.add(this.root);
  this.sprite=w.print(this.root,image,3.75,2.50,[0,0,0],true);this.sprite.geometry.computeBoundingBox();
  this.sprite.position.y=.06-this.sprite.geometry.boundingBox!.min.y;
  const materials=Array.isArray(this.sprite.material)?this.sprite.material:[this.sprite.material];
  this.materials=materials.map(m=>{const clone=w.ownMaterial(m.clone());clone.transparent=true;return clone;});this.sprite.material=this.materials;
 }
 get obstacle():WalkObstacle|null{return this.root.visible?{id:this.root.name,x:this.root.position.x,z:this.root.position.z,radius:this.radius}:null;}
 get cue():BicycleCue|null{return this.crossing?{id:this.serial,elapsed:this.elapsed,position:{x:this.root.position.x,y:1.1,z:this.z},moving:this.moving,visibility:this.visibility}:null;}
 update(dt:number,progress:number,era:number,motion:boolean,active:boolean,camera:T.PerspectiveCamera,obstacles:readonly WalkObstacle[]){
  this.moving=false;
  if(!active){this.crossing=false;this.cooldown=8;this.root.visible=false;return;}
  if(era>=.5){this.crossing=false;this.root.visible=false;this.cooldown=35;return;}
  if(!this.crossing){
   if(!motion||era>.01||progress<.04)return;this.cooldown-=Math.min(dt,.1);if(this.cooldown>0)return;
   const zs=[camera.position.z-4,camera.position.z-7,camera.position.z+4,camera.position.z+7].map(z=>T.MathUtils.clamp(z,-25,14));
   const z=zs.find(z=>{const screen=new T.Vector3(0,1.3,z).project(camera);return screen.z>0&&screen.z<1&&Math.abs(screen.x)<.7&&Math.abs(screen.y)<.8&&bodySegmentClear({x:-3,z},{x:3,z},obstacles,this.radius);});
   if(z===undefined){this.cooldown=2;return;}
   this.crossing=true;this.elapsed=0;this.z=z;++this.serial;this.root.position.set(-3,0,z);
  }
  if(motion&&era<.01){
   const nextElapsed=Math.min(6,this.elapsed+Math.min(Math.max(dt,0),.1)),next={x:-3+nextElapsed,z:this.z};
   if(bodySegmentClear(this.root.position,next,obstacles,this.radius)){this.elapsed=nextElapsed;this.root.position.x=next.x;this.moving=true;}
  }
  if(this.elapsed>=6){this.crossing=false;this.root.visible=false;this.cooldown=52;return;}
  this.visibility=smooth(this.elapsed/.55)*(1-smooth((this.elapsed-5.45)/.55))*(1-smooth(era/.20));
  this.materials.forEach(m=>m.opacity=this.visibility);this.root.visible=this.visibility>.001;
  this.root.rotation.y=Math.atan2(camera.position.x-this.root.position.x,camera.position.z-this.z);
  const right=camera.matrixWorld.elements;this.sprite.scale.x=right[0]>=0?1:-1;
  this.sprite.rotation.z=this.moving?Math.sin(this.elapsed*4)*.004:0;
 }
 dispose(){this.crossing=false;this.root.removeFromParent();}
}
