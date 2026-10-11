import * as T from 'three';
import {PaperWorkshop} from '../atelier/PaperWorkshop';
import {makeSteam} from '../atelier/Steam';
import type {ShopEraFrame} from '../atelier/EraSequence';
import {paperSeam} from './eraDomino';
const V=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
/** Two kitchens share a counter, four physical wall hinges and one clock. */
export class FoodStalls{
 private steam:ReturnType<typeof makeSteam>;
 private panels:T.Group[]=[];private wall=new T.Group();private eras=[new T.Group(),new T.Group()];
 private food=new T.Group();
 constructor(w:PaperWorkshop,sockets:Map<string,T.Group>,interiors:HTMLImageElement[],private host?:HTMLDivElement){
  const socket=sockets.get('mianwo')!;socket.getObjectByName('removable-closure-mianwo')?.removeFromParent();
  const g=new T.Group();g.name='food-stall-mianwo';g.userData.animationRoot=true;socket.add(g);
  this.wall.position.set(0,3,-2.35);this.wall.userData.animationRoot=true;g.add(this.wall,...this.eras);
  for(let i=0;i<4;i++){
   const hinge=new T.Group();hinge.position.x=-3.45+i*2.3;hinge.userData.animationRoot=true;this.wall.add(hinge);this.panels.push(hinge);
   w.box(hinge,[2.295,5.9,.07],[0,0,0],'#b9ad90');
   for(let era=0;era<2;era++){const face=w.print(hinge,interiors[era],2.3,5.9,[0,0,era?-.041:.041]);face.castShadow=false;if(era)face.rotation.y=Math.PI;const uv=face.geometry.getAttribute('uv');for(let n=0;n<uv.count;n++)uv.setX(n,(uv.getX(n)+i)/4);}
  }
  w.box(g,[8.8,.22,3.9],[0,.03,-.4],'#bbb7a3','stone');
  for(const x of [-4.2,4.2])w.box(g,[.16,5.6,.16],[x,2.8,1.18],'#9a7553','wood');
  w.box(g,[8.7,.16,.21],[0,5.48,1.18],'#87674a','wood');
  w.box(g,[6.4,1.46,1.4],[0,.93,1],'#8d9c83','wood');
  for(let n=0;n<14;n++)w.box(g,[.024,1.36,.02],[-3+n*.46,.94,1.72],'#696b52','wood');
  for(const [era,objects] of this.eras.entries()){
   objects.userData.animationRoot=true;objects.name='mianwo-era-'+(era?'present':'past');
   w.sign(objects,era?'面 窝 · 早 食':'现 炸 面 窝',5.9,.88,[0,4.76,1.21],era?'#658e88':'#9a8055','#f2e4bf',era?'旧 勺 还 在 · 清 晨 接 着 开 门':'厚 边 薄 心 · 早 起 一 口');
   for(let i=0;i<12;i++){const awning=w.box(objects,[.69,.045,2.2],[-3.8+i*.69,4.07,1.43],i%2?'#eee0c2':era?'#8dafad':'#b9a172','cloth');awning.rotation.x=.16;w.box(objects,[.69,.27,.03],[-3.8+i*.69,3.78,2.53],i%2?'#eee0c2':era?'#8dafad':'#b9a172','cloth');}
   w.box(objects,[6.68,.12,1.64],[0,1.73,1],era?'#b9cdc3':'#b99773',era?'metal':'wood');
   w.sign(objects,era?'自带餐盒 · 趁热吃':'一口酥香',2.0,.45,[1.65,1.07,1.73],era?'#d8e3d0':'#e8d7b1','#63715b');
   if(era){
    w.box(objects,[1.85,.12,1.28],[-1.13,1.87,1],'#637e77','metal');
    for(let i=0;i<3;i++)w.box(objects,[.58,.15,.46],[2.1,1.9+i*.16,1.24],'#e1d7b9');
    w.cylinder(objects,.3,.7,[2.75,2.17,.45],'#c0cdc6',24,'metal');
   }else{
    w.box(objects,[1.66,.27,1.1],[-1.13,1.93,1],'#817a61','stone');
    w.cylinder(objects,.3,.54,[2.75,2.08,.45],'#a88c61',24,'wood');
    w.box(objects,[.61,.41,.30],[2.1,2.0,1.20],'#d6c298');
   }
   w.batchStatic(objects);w.batchScenery(objects);
  }
  const counter=this.food;counter.userData.animationRoot=true;counter.position.set(0,0,1);g.add(counter);
  const pan=w.mesh(counter,new T.SphereGeometry(.81,32,16,0,Math.PI*2,0,Math.PI/2),w.material('#626d61','metal'),[-1.13,2.13,-.03]);pan.rotation.x=Math.PI;pan.scale.y=.22;
  w.cylinder(counter,.75,.012,[-1.13,2.07,-.03],'#b29450',32);
  for(let j=0;j<5;j++){
   const food=new T.Group();food.position.set(-1.48+(j%2)*.59,2.18,-.39+Math.floor(j/2)*.36);counter.add(food);
   const rim=w.mesh(food,new T.TorusGeometry(.19,.083,8,22),w.material(j%2?'#c49350':'#d6ae62'));rim.rotation.x=-Math.PI/2;rim.scale.z=.65;
   w.cylinder(food,.17,.013,[0,-.016,0],'#b99050',22);
  }
  w.line(counter,[V(-.4,2.13,-.1),V(.1,2.30,-.36),V(.35,2.35,-.45)],'#798b7a',.037);w.box(counter,[.1,.08,.40],[.35,2.37,-.53],'#a87850','wood');
  for(let i=0;i<4;i++)w.cylinder(counter,.38,.065,[1.65,1.84+i*.075,.02],'#d8decc',28,'ceramic');
  const steamParent=new T.Group();steamParent.userData.animationRoot=true;counter.add(steamParent);this.steam=makeSteam(w,steamParent,V(-1,2.23,0));
  w.batchStatic(g);w.batchScenery(this.food);w.batchScenery(g);
 }
 update(time:number,camera:T.Camera,turn=0,frame?:ShopEraFrame){
  this.panels.forEach((p,i)=>p.rotation.y=(frame?.panels[i]??turn)*Math.PI);this.wall.position.z=-2.35-Math.sin((frame?.wall??turn)*Math.PI)*1.2;
  const furniture=frame?.furniture??turn,food=frame?.food??turn;
  this.eras.forEach((g,i)=>{g.visible=(furniture<.5?i===0:i===1);g.scale.x=frame?paperSeam(furniture):1;g.scale.y=.96+.04*Math.abs(Math.cos(furniture*Math.PI));});
  this.food.rotation.x=-Math.sin(food*Math.PI)*.10;
  this.steam.update(time,camera,true);this.steam.meshes.forEach(m=>m.material.uniforms.strength.value=.30*Math.pow(Math.abs(Math.cos(food*Math.PI)),4));
  if(this.host){this.host.dataset.mianwoEra=furniture>=.5?'present':'past';this.host.dataset.mianwoWallAngle=((frame?.panels[0]??turn)*180).toFixed(1);}
 }
}
