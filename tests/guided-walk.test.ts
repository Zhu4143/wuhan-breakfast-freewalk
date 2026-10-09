import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FreeWalk} from '../src/street/FreeWalk.ts';
import {places} from '../src/street/exploreContent.ts';
import {WALK_BOUNDS} from '../src/street/walkMath.ts';
import {bodySegmentClear,planWalkRoute} from '../src/street/walkNavigation.ts';

type Obstacle={id:string;x:number;z:number;radius:number};
Object.defineProperty(globalThis,'window',{value:new EventTarget(),configurable:true});
Object.defineProperty(globalThis,'document',{value:Object.assign(new EventTarget(),{hidden:false}),configurable:true});
const stop=(x:number,z:number)=>({id:'test-shop',name:'shop',position:[x,2.45,z] as [number,number,number],look:[-7,2.6,z] as [number,number,number],dawn:.3,pages:[]});
function fixture(obstacles:Obstacle[]){
 const travel:boolean[]=[],manual:boolean[]=[];
 const walker=new FreeWalk(new EventTarget() as HTMLDivElement,v=>travel.push(v),()=>manual.push(true),()=>obstacles);
 walker.setEnabled(true);
 return {walker,travel,manual};
}
function advance(walker:FreeWalk,obstacles:Obstacle[],dt=1/30){
 const before=walker.position.clone();walker.update(dt);const after=walker.position;
 assert.ok(before.distanceTo(after)<=3.2*Math.min(Math.max(dt,0),.08)+1e-6,'movement must not teleport');
 for(const obstacle of obstacles){
  const dx=after.x-before.x,dz=after.z-before.z,length=dx*dx+dz*dz;
  const t=length?Math.max(0,Math.min(1,((obstacle.x-before.x)*dx+(obstacle.z-before.z)*dz)/length)):0;
  const gap=Math.hypot(before.x+t*dx-obstacle.x,before.z+t*dz-obstacle.z);
  assert.ok(gap>=obstacle.radius+.32-1e-6,`${obstacle.id}: camera segment has only ${gap.toFixed(3)} clearance`);
 }
}
function arrive(walker:FreeWalk,obstacles:Obstacle[]){
 for(let n=0;n<3000&&walker.state.moving;n++)advance(walker,obstacles);
 assert.equal(walker.state.moving,false,'a reachable shop must eventually finish');
}

test('clicking west-end stops outside the paper visitor already occupying its original stop',()=>{
 const obstacles=[{id:'pedestrian-8',x:-3.3,z:-17,radius:.7}];
 const {walker,travel}=fixture(obstacles);
 try{walker.go(places.find(p=>p.id==='west-end')!.stop);arrive(walker,obstacles);assert.deepEqual(travel,[true,false]);assert.ok(Math.hypot(walker.position.x+3.2,walker.position.z+17)<1.7);}
 finally{walker.dispose();}
});

test('automatic travel detours around a body in the centre lane',()=>{
 const obstacles=[{id:'visitor',x:0,z:0,radius:.7}],{walker}=fixture(obstacles);
 try{walker.go(stop(-2.65,-5.4));arrive(walker,obstacles);assert.ok(Math.abs(walker.position.x+2.65)<1e-6);}
 finally{walker.dispose();}
});

test('nearby shops do not take a straight shortcut through a person',()=>{
 const obstacles=[{id:'visitor',x:0,z:0,radius:.7}],{walker}=fixture(obstacles);
 try{walker.position.set(-3,2.45,0);walker.go(stop(3,0));arrive(walker,obstacles);}
 finally{walker.dispose();}
});

test('a person entering the remaining route triggers a new route, including an interrupted shop choice',()=>{
 const obstacles:Obstacle[]=[],{walker,travel}=fixture(obstacles);
 try{
  walker.go(stop(0,-8));for(let n=0;n<20;n++)advance(walker,obstacles);
  obstacles.push({id:'arriving-visitor',x:0,z:5,radius:.7});
  for(let n=0;n<70;n++)advance(walker,obstacles);
  walker.go(stop(3,2));arrive(walker,obstacles);assert.deepEqual(travel,[true,true,false]);
 }
 finally{walker.dispose();}
});

test('large frame gaps cannot tunnel through a thin street pole',()=>{
 const obstacles=[{id:'pole',x:0,z:10,radius:.06}],{walker}=fixture(obstacles);
 try{walker.go(stop(0,8));for(let n=0;n<100&&walker.state.moving;n++)advance(walker,obstacles,10);assert.equal(walker.state.moving,false);}
 finally{walker.dispose();}
});

test('automatic destinations obey the same street boundary as manual walking',()=>{
 const {walker}=fixture([]);
 try{walker.go(stop(3,-40));arrive(walker,[]);assert.ok(walker.position.z>=WALK_BOUNDS.minZ);assert.ok(walker.position.x<=WALK_BOUNDS.maxX);}
 finally{walker.dispose();}
});

test('manual takeover retains collision clearance and cancels the old arrival',()=>{
 const obstacles=[{id:'pole',x:0,z:10,radius:.06}],{walker,manual}=fixture(obstacles);
 try{walker.go(stop(0,8));walker.joystick(0,-1);for(let n=0;n<60;n++)advance(walker,obstacles);assert.equal(walker.state.moving,false);assert.equal(manual.length,1);}
 finally{walker.dispose();}
});

test('an occupied shop stop chooses a nearby space with a clear view of the facade',()=>{
 const people=[{id:'doorway-neighbor',x:-3.3,z:-17,radius:.95}];
 const look={x:-7,z:-17},path=planWalkRoute({x:0,z:11},{x:-3.2,z:-17},people,look),end=path.at(-1)!;
 assert.ok(end);assert.ok(bodySegmentClear(end,look,people,.12),'the person must not fill the arrival view');
 assert.ok(Math.hypot(end.x+3.2,end.z+17)<2,'the chosen arrival must remain close to the shop');
});

test('people outside the player lane still detect one another across the entire step',()=>{
 const person=[{id:'neighbor',x:5,z:0,radius:.8}];
 assert.equal(bodySegmentClear({x:5,z:-2},{x:5,z:2},person,.7),false);
 assert.equal(bodySegmentClear({x:7,z:-2},{x:7,z:2},person,.7),true);
});
