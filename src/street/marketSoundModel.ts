import {clampMorning,smooth,shopOpening} from './marketTime.ts';
export type SoundPoint={x:number;y:number;z:number};
export type SoundCamera={position:SoundPoint;right:SoundPoint};
export type BicycleCue={id:number;elapsed:number;position:SoundPoint;moving:boolean;visibility:number};
export type MarketSoundFrame={progress:number;era:number;camera:SoundCamera;bicycle:BicycleCue|null};
export const loopTrackIds=['dawn','past','present','doupi','mianwo'] as const;
export type LoopTrackId=typeof loopTrackIds[number];
export type SoundMix={gains:Record<LoopTrackId|'bicycle',number>;pans:Record<'doupi'|'mianwo'|'bicycle',number>};
const kitchens={doupi:{x:5.8,y:1.7,z:3},mianwo:{x:-5.8,y:1.7,z:-6}};
/** World-space acoustic distance follows the actual camera, regardless of selected story card. */
export function acousticSource(source:SoundPoint,camera:SoundCamera){
 const dx=source.x-camera.position.x,dy=source.y-camera.position.y,dz=source.z-camera.position.z,d=Math.hypot(dx,dy,dz);
 return {gain:Math.pow(3.5/Math.max(3.5,d),1.6)*(1-smooth((d-10)/8)),
  pan:Math.max(-.9,Math.min(.9,(dx*camera.right.x+dy*camera.right.y+dz*camera.right.z)/Math.max(d,1)*.85))};
}
export function marketSoundMix(frame:MarketSoundFrame):SoundMix{
 const p=clampMorning(frame.progress),era=clampMorning(frame.era),crowd=smooth((p-.10)/.68),dawn=1-smooth((p-.12)/.52);
 const doupi=acousticSource(kitchens.doupi,frame.camera),mianwo=acousticSource(kitchens.mianwo,frame.camera);
 const dg=doupi.gain*shopOpening('doupi',p)*.58,mg=mianwo.gain*shopOpening('mianwo',p)*.58,duck=1-Math.min(.22,(dg+mg)*.22);
 const bike=frame.bicycle?acousticSource(frame.bicycle.position,frame.camera):{gain:0,pan:0};
 return {gains:{dawn:.34*dawn*duck,past:.39*crowd*Math.cos(era*Math.PI/2)*duck,present:.39*crowd*Math.sin(era*Math.PI/2)*duck,
  doupi:dg,mianwo:mg,bicycle:frame.bicycle?.moving?bike.gain*.58*frame.bicycle.visibility*Math.cos(era*Math.PI/2):0},
  pans:{doupi:doupi.pan,mianwo:mianwo.pan,bicycle:bike.pan}};
}

