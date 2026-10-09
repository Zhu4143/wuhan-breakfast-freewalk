import {WALK_BOUNDS} from './walkMath.ts';

export type WalkPoint={x:number;z:number};
export type WalkObstacle=WalkPoint&{id:string;radius:number};
export const WALKER_RADIUS=.32;
const padding=.08;
const columns=20,rows=128;
const grid:WalkPoint[]=Array.from({length:(columns+1)*(rows+1)},(_,i)=>({
 x:WALK_BOUNDS.minX+(i%(columns+1))*(WALK_BOUNDS.maxX-WALK_BOUNDS.minX)/columns,
 z:WALK_BOUNDS.minZ+Math.floor(i/(columns+1))*(WALK_BOUNDS.maxZ-WALK_BOUNDS.minZ)/rows,
}));
const distance=(a:WalkPoint,b:WalkPoint)=>Math.hypot(a.x-b.x,a.z-b.z);
const bounded=(p:WalkPoint)=>p.x>=WALK_BOUNDS.minX&&p.x<=WALK_BOUNDS.maxX&&p.z>=WALK_BOUNDS.minZ&&p.z<=WALK_BOUNDS.maxZ;

/** Swept body clearance, not just an endpoint check: thin props cannot be skipped. */
export function walkSegmentClear(a:WalkPoint,b:WalkPoint,obstacles:readonly WalkObstacle[],extra=0){
 if(!bounded(a)||!bounded(b))return false;
 return bodySegmentClear(a,b,obstacles,WALKER_RADIUS+extra);
}

/** Also used by people and sightlines; unlike player movement, these may leave the lane. */
export function bodySegmentClear(a:WalkPoint,b:WalkPoint,obstacles:readonly WalkObstacle[],radius:number){
 const dx=b.x-a.x,dz=b.z-a.z,length=dx*dx+dz*dz;
 return obstacles.every(o=>{
  const t=length?Math.max(0,Math.min(1,((o.x-a.x)*dx+(o.z-a.z)*dz)/length)):0;
  return Math.hypot(a.x+t*dx-o.x,a.z+t*dz-o.z)>=o.radius+radius-1e-7;
 });
}

/** The small lane grid is only searched when a direct path is obstructed. */
export function planWalkRoute(start:WalkPoint,wanted:WalkPoint,obstacles:readonly WalkObstacle[],look?:WalkPoint):WalkPoint[]{
 if(!walkSegmentClear(start,start,obstacles))return [];
 let goal={x:Math.max(WALK_BOUNDS.minX,Math.min(WALK_BOUNDS.maxX,wanted.x)),z:Math.max(WALK_BOUNDS.minZ,Math.min(WALK_BOUNDS.maxZ,wanted.z))};
 const clearView=(point:WalkPoint)=>!look||bodySegmentClear(point,look,obstacles,.12);
 if(walkSegmentClear(goal,goal,obstacles,padding)&&clearView(goal)&&walkSegmentClear(start,goal,obstacles))return [goal];
 const clear=grid.map(p=>walkSegmentClear(p,p,obstacles,padding));
 if(!walkSegmentClear(goal,goal,obstacles,padding)||!clearView(goal)){
  let best=Infinity,available:WalkPoint|undefined;
  grid.forEach((p,i)=>{const score=distance(p,goal)+(clearView(p)?0:3)+distance(p,start)*.0001;if(clear[i]&&score<best){best=score;available=p;}});
  if(!available)return [];
  goal=available;
 }
 if(walkSegmentClear(start,goal,obstacles))return [goal];
 const costs=new Float64Array(grid.length).fill(Infinity),parent=new Int32Array(grid.length).fill(-1);
 const closed=new Uint8Array(grid.length),open=new Set<number>();
 grid.forEach((p,i)=>{if(clear[i]&&distance(start,p)<.65&&walkSegmentClear(start,p,obstacles)){costs[i]=distance(start,p);open.add(i);}});
 while(open.size){
  let current=-1,best=Infinity;
  for(const i of open){const score=costs[i]+distance(grid[i],goal);if(score<best){current=i;best=score;}}
  open.delete(current);closed[current]=1;
  if(walkSegmentClear(grid[current],goal,obstacles)){
   const path:WalkPoint[]=[goal];for(let i=current;i!==-1;i=parent[i])path.unshift(grid[i]);
   const smooth:WalkPoint[]=[];let from=start,index=0;
   while(index<path.length){let next=path.length-1;while(next>index&&!walkSegmentClear(from,path[next],obstacles))next--;smooth.push(path[next]);from=path[next];index=next+1;}
   return smooth;
  }
  const x=current%(columns+1),z=Math.floor(current/(columns+1));
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
   if((!dx&&!dz)||x+dx<0||x+dx>columns||z+dz<0||z+dz>rows)continue;
   const next=(z+dz)*(columns+1)+x+dx;
   if(closed[next]||!clear[next]||!walkSegmentClear(grid[current],grid[next],obstacles))continue;
   const cost=costs[current]+distance(grid[current],grid[next]);
   if(cost<costs[next]){costs[next]=cost;parent[next]=current;open.add(next);}
  }
 }
 return [];
}

/** Manual takeover uses the same swept body, with sliding along a blocked side. */
export function moveWithClearance(start:WalkPoint,wanted:WalkPoint,obstacles:readonly WalkObstacle[]):WalkPoint{
 if(walkSegmentClear(start,wanted,obstacles))return wanted;
 const clip=(end:WalkPoint)=>{
  let low=0,high=1;
  for(let i=0;i<12;i++){const t=(low+high)/2,p={x:start.x+(end.x-start.x)*t,z:start.z+(end.z-start.z)*t};if(walkSegmentClear(start,p,obstacles))low=t;else high=t;}
  return {x:start.x+(end.x-start.x)*low,z:start.z+(end.z-start.z)*low};
 };
 return [clip(wanted),clip({x:wanted.x,z:start.z}),clip({x:start.x,z:wanted.z})].sort((a,b)=>distance(b,start)-distance(a,start))[0];
}
