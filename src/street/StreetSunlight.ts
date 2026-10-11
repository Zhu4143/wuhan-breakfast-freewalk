import * as T from 'three';
import {PaperWorkshop} from '../atelier/PaperWorkshop';
import {smooth} from './marketTime';

/** A filtered warm fill across the lane; the shared directional sun owns the shadows. */
export class StreetSunlight{
 private light:T.SpotLight;
 constructor(w:PaperWorkshop,parent:T.Group){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;
  const ctx=canvas.getContext('2d')!;ctx.fillStyle='#000';ctx.fillRect(0,0,1024,1024);
  let seed=427;const rand=()=>{seed=seed*16807%2147483647;return seed/2147483647;};
  ctx.filter='blur(2px)';
  for(let i=0;i<110;i++){
   const x=rand()*1024,y=rand()*1024;
   for(let n=0;n<4;n++){
    ctx.fillStyle=n%2?'#fff':'#cfcfcf';ctx.beginPath();
    ctx.ellipse(x+(rand()-.5)*44,y+(rand()-.5)*44,7+rand()*14,4+rand()*9,rand()*Math.PI,0,Math.PI*2);ctx.fill();
   }
  }
  const map=w.ownTexture(new T.CanvasTexture(canvas));map.colorSpace=T.NoColorSpace;
  this.light=new T.SpotLight('#ffe3ae',0,0,.78,.18,0);
  this.light.name='street-leaf-gap-sunlight';this.light.map=map;
  // This is an art-directed fill, so it needs no second shadow render of all six shops.
  this.light.shadow.camera.near=1;this.light.shadow.camera.far=140;
  this.light.shadow.bias=-.00015;this.light.shadow.normalBias=.04;
  this.light.target.position.set(0,0,-6);parent.add(this.light,this.light.target);
 }
 update(progress:number,sun:T.DirectionalLight){
  this.light.position.copy(sun.position);this.light.color.copy(sun.color);
  this.light.intensity=smooth((progress-.20)/.55)*3.2;
 }
 dispose(){this.light.shadow.dispose();this.light.removeFromParent();this.light.target.removeFromParent();}
}
