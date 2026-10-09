import * as T from 'three';
import {PaperWorkshop} from '../atelier/PaperWorkshop';
import {bicycle} from './StreetProps';
import {shopOpening} from './marketTime';

type Pair={past:T.Group;present:T.Group};
/** Building maintenance, everyday objects and local material changes share one era clock. */
export class StreetEras{
 private pairs:Pair[]=[];
 private colors:{mat:T.MeshStandardMaterial;old:T.Color;now:T.Color}[]=[];
 private shutters:T.Group[]=[];
 private progress=-1;
 private morningDoors:{id:string;past:T.Object3D;present:T.Group}[]=[];
 constructor(private w:PaperWorkshop,root:T.Group,sockets:Map<string,T.Group>){
  const materialCopies=new Map<T.Material,T.Material>();
  const visit=(o:T.Object3D)=>{
   if(o.name==='doupi-complete-shop'||o.name.startsWith('breakfast-kitchen-')||o.name.startsWith('food-stall-')||o.name.startsWith('pedestrian-'))return;
   if(o instanceof T.Mesh){const convert=(m:T.Material)=>{
    if(!(m instanceof T.MeshStandardMaterial))return m;
    let copy=materialCopies.get(m);if(copy)return copy;
    const c=this.w.ownMaterial(m.clone());c.onBeforeCompile=m.onBeforeCompile;c.customProgramCacheKey=m.customProgramCacheKey;
    const old=c.color.clone(),now=old.clone();
    if(c.map)now.multiply(new T.Color('#e7f1e9'));
    else {const hsl={h:0,s:0,l:0};old.getHSL(hsl);now.setHSL(hsl.h<.2?hsl.h+.025:hsl.h,Math.max(.08,hsl.s*.72),Math.min(.86,hsl.l+.10));}
    this.colors.push({mat:c,old,now});materialCopies.set(m,c);return c;
   };o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);}
   o.children.forEach(visit);
  };visit(root);
  [...sockets.entries()].forEach(([id,socket],i)=>{
   const pair=this.pair(socket,'facade-'+id),{past,present}=pair;
   for(const side of [-1,1]){
    // Old plaster edges, brick repair, and a maintained tiled plinth at the same position.
    for(let row=0;row<8;row++)for(let col=0;col<2;col++)w.box(past,[.27,.16,.04],[side*(4.1+col*.3),.25+row*.19,.95],(row+col)%3?'#ab8d73':'#8f8774','stone');
    w.shape(past,[[-.26,0],[.20,.1],[.30,.64],[.13,.96],[-.21,.75],[-.32,.22]],[side*4.1,1.8,.96],'#b8ae91',.014);
    w.box(present,[.83,2.8,.04],[side*4.04,1.52,.97],'#ccd5c6','stone');
    for(let j=0;j<11;j++)w.box(present,[.82,.016,.013],[side*4.04,.24+j*.25,1.0],'#9baa9d');
    for(const dx of [-.26,0,.26])w.box(present,[.013,2.7,.015],[side*4.04+dx,1.53,1.0],'#9baa9d');
    for(const [era,g] of [past,present].entries()){
     const win=new T.Group();win.position.set(side*3.45,9.2,.89);win.userData.animationRoot=true;g.add(win);this.shutters.push(win);
     w.box(win,[1.25,1.88,.075],[0,0,0],era?'#a8c3b9':'#827e68','wood');
     for(const xx of [-.63,.63])w.box(win,[.065,2.0,.13],[xx,0,.07],era?'#547d77':'#735d46','wood');
     for(const yy of [-.97,0,.97])w.box(win,[1.34,.065,.13],[0,yy,.07],era?'#547d77':'#735d46','wood');
     if(era){w.box(win,[.042,1.9,.09],[0,0,.09],'#547d77');w.box(win,[1.1,.08,.22],[0,-1.03,.12],'#7d9383');}
     else for(let j=0;j<6;j++)w.box(win,[.045,1.86,.04],[-.50+j*.20,0,.06],'#b6a07a','wood');
    }
   }
   w.sign(past,`${12+i*2}号 · 街坊`,1.5,.42,[-2.3,6.71,.92],'#b4956e','#514c3a');
   w.sign(present,`${12+i*2}号 · 老街`,1.5,.42,[-2.3,6.71,.93],'#658b7c','#f0ebce');
   // Handwritten repair note becomes a compact lamp and modern street number.
   const breakfastNote:Record<string,string>={'east-middle':'鲜汤 · 油条','west-end':'糯米 · 胡椒','east-end':'汤包 · 姜醋'};
   w.sign(past,breakfastNote[id]??'修伞 · 补鞋',.85,.58,[3.35,3.75,1.00],'#d3be91','#73604b');
   w.box(present,[.83,.13,.24],[3.35,3.95,1.01],'#6d8781','metal');
   w.box(present,[.67,.035,.19],[3.35,3.86,1.01],'#ebe9ca');
   // The three occupied-by-neighbors plots gain an actual second facade.
   if((id==='east-middle'||id==='west-end'||id==='east-end')&&!socket.getObjectByName('breakfast-kitchen-'+id)){
    const closure=socket.getObjectByName('removable-closure-'+id);if(closure){closure.removeFromParent();past.add(closure);}
    const door=new T.Group();door.name='neighbor-inner-door-'+id;door.userData.animationRoot=true;present.add(door);
    for(let n=0;n<12;n++)w.box(door,[.71,4.56,.11],[-3.96+n*.72,2.5,.21],n%3?'#8ba798':'#759489','wood');
    for(const xx of [-.16,.16])w.box(door,[.055,.52,.12],[xx,2.3,.31],'#d0c9a9','metal');
    if(closure)this.morningDoors.push({id,past:closure,present:door});
    w.sign(present,['街 坊 书 屋','巷 里 人 家','邻 里 小 院'][i-3],3.2,.61,[0,4.82,.33],'#e7e6cd','#52776a');
    w.box(present,[1.9,.07,.45],[-2.9,1.1,.66],'#a88a68','wood');
    for(let n=0;n<5;n++)w.box(present,[.23,.52,.26],[-3.55+n*.31,1.40,.6],['#b89573','#839b95','#bbc7aa'][n%3]);
    // Opening the outer morning shutters also reveals an actual room, not a second closed facade.
    for(const [era,room] of [past,present].entries()){
     w.box(room,[7.9,4.6,.06],[0,2.35,-2.59],era?'#dce1c9':'#c6b697','stone');
     w.sign(room,id==='east-middle'?'清 晨 读 一 页':'街 坊 道 声 早',3.7,.6,[0,3.6,-2.53],era?'#e6ead7':'#e6d4ad',era?'#4d776a':'#786247');
     w.box(room,[4.5,.12,1.05],[0,1.2,-1.8],era?'#b0ad91':'#a8825b','wood');
     for(const x of [-1.9,1.9])for(const z of [-2.15,-1.45])w.box(room,[.1,1.16,.1],[x,.6,z],'#796a52','wood');
     for(let n=0;n<6;n++)w.box(room,[.24,.50,.31],[-.8+n*.31,1.49,-1.88],['#b09a6d','#7d9a8f','#c4b58e'][n%3]);
    }
   }
   for(const g of [past,present]){w.batchStatic(g);w.batchScenery(g);}
  });
  const mobility=this.pair(root,'street-mobility');
  bicycle(w,mobility.past,5.6,10.8,-Math.PI/2);bicycle(w,mobility.past,-5.8,-12,Math.PI/2);
  // Today's small electric utility bicycles have a battery, saddle and rear box.
  for(const [x,z] of [[5.6,10.8],[-5.8,-12]]){
   const bike=bicycle(w,mobility.present,x,z,x>0?-Math.PI/2:Math.PI/2);
   w.box(bike,[.68,.48,.33],[-.05,.60,0],'#88a99b','metal');w.box(bike,[.64,.11,.30],[-.20,1.18,0],'#596d63');
   w.box(bike,[.5,.51,.48],[-.77,1.31,0],'#d2c2a0');
  }
  const amenities=this.pair(root,'street-amenities');
  for(const z of [15,-2,-20]){
   w.cylinder(amenities.past,.34,.75,[5.8,.47,z],'#9c896b',20,'wood');
   for(let n=0;n<10;n++)w.box(amenities.past,[.026,.73,.025],[5.8+Math.sin(n*.628)*.34,.48,z+Math.cos(n*.628)*.34],'#675f4a');
   w.box(amenities.present,[.55,1.0,.53],[5.7,.56,z],'#6c9788','metal');w.box(amenities.present,[.55,1.0,.53],[6.33,.56,z],'#9ca68d','metal');
   w.sign(amenities.present,'分类',.35,.21,[5.7,.69,z+.274],'#cbd8bd','#4d7764');
  }
  for(const pair of [mobility,amenities])for(const g of [pair.past,pair.present]){w.batchStatic(g);w.batchScenery(g);}
 }
 private pair(parent:T.Object3D,id:string){const past=new T.Group(),present=new T.Group();past.name=id+'-past';present.name=id+'-present';for(const g of [past,present]){g.userData.animationRoot=true;parent.add(g);}const p={past,present};this.pairs.push(p);return p;}
 updateMorning(progress:number){for(const door of this.morningDoors){const open=shopOpening(door.id,progress);for(const group of [door.past,door.present]){group.visible=open<.999;group.scale.y=1-open*.98;group.position.y=open*5.4;}}}
 update(turn:number){
  if(Math.abs(turn-this.progress)<.0001)return;this.progress=turn;
  const smooth=T.MathUtils.smoothstep(turn,0,1);
  for(const c of this.colors)c.mat.color.lerpColors(c.old,c.now,smooth);
  for(const p of this.pairs){p.past.visible=turn<.5;p.present.visible=turn>=.5;}
  this.shutters.forEach(g=>g.rotation.y=turn<.5?turn*Math.PI:(turn-1)*Math.PI);
 }
}
