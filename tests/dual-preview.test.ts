import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PREVIEW_PROTOCOL,PreviewCoordinator,parsePreviewMessage,validPreviewValues,type PreviewMessage} from '../src/preview/previewProtocol.ts';
import {FreeWalk,type PreviewWalkPose} from '../src/street/FreeWalk.ts';
import {EYE_HEIGHT} from '../src/street/walkMath.ts';

const message=(frame:'desktop'|'phone',type:PreviewMessage['type'],values:Record<string,unknown>={}):PreviewMessage=>({protocol:PREVIEW_PROTOCOL,session:'test-session',frame,type,values});

test('preview rejects unrelated sessions, roles, message types and unsafe state keys',()=>{
 assert.equal(parsePreviewMessage(message('desktop','patch',{'clock.progress':.5}),'another-session'),null);
 assert.equal(parsePreviewMessage({...message('desktop','claim'),frame:'third-party'},'test-session'),null);
 assert.equal(parsePreviewMessage({...message('phone','patch'),type:'snapshot'},'test-session'),null);
 assert.equal(validPreviewValues(JSON.parse('{"__proto__":{}}')),false);
 assert.equal(validPreviewValues({'explore.save':{},'studio.photo':null,'walk.pose':{}}),true);
 assert.ok(parsePreviewMessage(message('phone','patch',{'explore.basketOpen':true}),'test-session'));
});

test('late phone join preserves the desktop state instead of resetting the current visit',()=>{
 const c=new PreviewCoordinator();
 c.receive(message('desktop','ready',{'explore.mode':'cover','clock.progress':0}));
 c.receive(message('desktop','patch',{'explore.mode':'visit','explore.pageIndex':1,'clock.progress':.7}));
 c.receive(message('phone','ready',{'explore.mode':'cover','explore.pageIndex':0,'clock.progress':0}));
 assert.equal(c.values['explore.mode'],'visit');assert.equal(c.values['explore.pageIndex'],1);assert.equal(c.values['clock.progress'],.7);
});

test('only the current input owner drives automatic time and walk; takeover is ordered',()=>{
 const c=new PreviewCoordinator();c.receive(message('desktop','ready',{'clock.progress':.1}));
 const revision=c.revision;
 assert.equal(c.receive(message('phone','patch',{'clock.progress':0})),false);
 assert.equal(c.revision,revision);assert.equal(c.values['clock.progress'],.1);
 c.receive(message('phone','claim'));c.receive(message('phone','patch',{'clock.progress':.8,'explore.basketOpen':true}));
 assert.equal(c.driver,'phone');assert.equal(c.values['clock.progress'],.8);assert.equal(c.values['explore.basketOpen'],true);
 assert.equal(c.receive(message('desktop','patch',{'clock.progress':.2})),false);
});

test('independent previews rejoin using the last operated frame and its complete state',()=>{
 const c=new PreviewCoordinator();
 c.receive(message('desktop','ready',{'explore.mode':'roam','clock.progress':.3,'explore.save':{foods:['doupi']}}));
 c.receive(message('phone','ready',{'explore.mode':'cover','clock.progress':0}));
 c.setLinked(false);
 c.receive(message('desktop','patch',{'clock.progress':.5}));
 c.receive(message('phone','claim'));c.receive(message('phone','patch',{'explore.save':{foods:[]},'clock.progress':.9}));
 c.setLinked(true);
 assert.equal(c.driver,'phone');assert.equal(c.values['explore.mode'],'roam');assert.equal(c.values['clock.progress'],.9);
 assert.deepEqual(c.values['explore.save'],{foods:[]});
});

test('a mirrored walker preserves route and pose, advances only after takeover and does not repeat arrivals',()=>{
 const previousWindow=Object.getOwnPropertyDescriptor(globalThis,'window'),previousDocument=Object.getOwnPropertyDescriptor(globalThis,'document');
 Object.defineProperty(globalThis,'window',{value:new EventTarget(),configurable:true});
 Object.defineProperty(globalThis,'document',{value:Object.assign(new EventTarget(),{hidden:false}),configurable:true});
 const travel:boolean[]=[],host=new EventTarget() as HTMLDivElement;
 const walk=new FreeWalk(host,moving=>travel.push(moving),()=>{});
 try{
  walk.setEnabled(true);walk.setPreviewFollower(true);
  const pose:PreviewWalkPose={position:[1,EYE_HEIGHT,8],yaw:.4,pitch:.1,fov:68,stop:'doupi',destination:[2,EYE_HEIGHT,7],aim:[6,2,2],route:[[2,EYE_HEIGHT,7]]};
  walk.applyPreviewPose(pose);walk.applyPreviewPose(pose);walk.update(.08);
  assert.deepEqual(walk.position.toArray(),pose.position);assert.deepEqual(travel,[true]);
  assert.equal(walk.view(1.6).fov,68);assert.equal(walk.view(.5).fov,78);
  walk.setPreviewFollower(false);walk.update(.08);
  assert.notDeepEqual(walk.position.toArray(),pose.position);
  assert.deepEqual(pose.route,[[2,EYE_HEIGHT,7]]);
  walk.setPreviewFollower(true);walk.applyPreviewPose({...pose,destination:null,aim:null,route:[]});
  walk.applyPreviewPose({...pose,destination:null,aim:null,route:[]});assert.deepEqual(travel,[true,false]);
 }finally{walk.dispose();for(const [key,descriptor] of [['window',previousWindow],['document',previousDocument]] as const){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}}
});

function withMirroredWalk(check:(walk:FreeWalk,travel:boolean[])=>void){
 const globals=['window','document'] as const,previous=globals.map(key=>Object.getOwnPropertyDescriptor(globalThis,key));
 Object.defineProperty(globalThis,'window',{value:new EventTarget(),configurable:true});
 Object.defineProperty(globalThis,'document',{value:Object.assign(new EventTarget(),{hidden:false}),configurable:true});
 const travel:boolean[]=[],walk=new FreeWalk(new EventTarget() as HTMLDivElement,moving=>travel.push(moving),()=>{});
 try{walk.setEnabled(true);walk.setPreviewFollower(true);check(walk,travel);}
 finally{walk.dispose();globals.forEach((key,i)=>{if(previous[i])Object.defineProperty(globalThis,key,previous[i]!);else Reflect.deleteProperty(globalThis,key);});}
}
const movingPose=(x:number,yaw=0):PreviewWalkPose=>({position:[x,EYE_HEIGHT,8],yaw,pitch:0,fov:74,stop:'doupi',destination:[4,EYE_HEIGHT,8],aim:[6,2,2],route:[[4,EYE_HEIGHT,8]]});

test('10 Hz preview packets produce a new camera position on every rendered frame without jumping or overshooting',()=>withMirroredWalk(walk=>{
 walk.applyPreviewPose(movingPose(0));
 for(let packet=1;packet<=8;packet++){
  const target=packet*.32,previous=walk.position.x,pose=movingPose(target);
  walk.applyPreviewPose(pose);assert.equal(walk.position.x,previous,'receipt must not jump the camera');
  for(let frame=1;frame<=3;frame++){
   const before=walk.position.x;walk.update(1/30);
   assert.ok(walk.position.x>before,'camera must advance between packets');assert.ok(walk.position.x<=target+1e-9);
   // Other preview state notifications reuse the same pose and must not restart interpolation.
   walk.applyPreviewPose(pose);
  }
  assert.ok(Math.abs(walk.position.x-target)<1e-9);
 }
}));

test('mirrored turns follow the short angle, settle at arrival while blocked, and can hand control back without a camera jump',()=>withMirroredWalk((walk,travel)=>{
 walk.applyPreviewPose(movingPose(0,Math.PI-.08));
 const arrival={...movingPose(.32,-Math.PI+.08),destination:null,aim:null,route:[]};
 walk.applyPreviewPose(arrival);walk.setEnabled(true,true);walk.update(.05);
 assert.ok(walk.position.x>0&&walk.position.x<.32);assert.ok(Math.abs(walk.state.yaw)>3,'turn must cross pi instead of spinning through zero');
 walk.applyPreviewPose({...arrival});walk.update(.05);
 assert.ok(Math.abs(walk.position.x-.32)<1e-9);assert.deepEqual(travel,[true,false]);
 walk.setEnabled(true);walk.applyPreviewPose(movingPose(.64));walk.update(.03);
 const displayed=walk.position.toArray();walk.setPreviewFollower(false);
 assert.deepEqual(walk.position.toArray(),displayed);walk.update(.03);assert.ok(walk.position.x>displayed[0]);
}));

test('late joins and unrelated distant preview positions snap directly instead of flying through the street',()=>withMirroredWalk(walk=>{
 walk.applyPreviewPose(movingPose(10));assert.equal(walk.position.x,10);
 walk.applyPreviewPose(movingPose(-10));assert.equal(walk.position.x,-10);
}));
