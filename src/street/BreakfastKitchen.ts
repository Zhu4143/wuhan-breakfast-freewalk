import * as T from 'three';
import {PaperWorkshop} from '../atelier/PaperWorkshop';
import {makeSteam} from '../atelier/Steam';
import {eraVisibility,type ShopModule} from './ShopModule';
import type {BreakfastShop} from './breakfastShops';

const V=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
export type KitchenWallArt={past:HTMLImageElement;present:HTMLImageElement};
/** Three recipes share a socket contract, but retain their own kitchen and food geometry. */
export class BreakfastKitchen implements ShopModule {
 readonly id:string;
 readonly root=new T.Group();
 readonly anchors=new Map([['food',V(-1.05,2.05,1.10)],['keeper',V(.6,2.8,-.30)]]);
 private eras=[new T.Group(),new T.Group()];
 private hinges:T.Group[]=[];
 private actors:T.Mesh[]=[];
 private steam:ReturnType<typeof makeSteam>;
 private turn=0;
 private speakingUntil=0;
 private requested=false;
 private disposed=false;
 constructor(private w:PaperWorkshop,readonly spec:BreakfastShop,portraits:HTMLImageElement[],art:KitchenWallArt,private host:HTMLDivElement){
  this.id=spec.id;const g=this.root;g.name='breakfast-kitchen-'+spec.id;g.userData.animationRoot=true;
  w.box(g,[9.2,.15,5.1],[0,.02,0],'#bcbca7','stone');
  for(const x of [-4.28,4.28])w.box(g,[.15,5.5,.18],[x,2.82,1.28],spec.accent,'wood');
  w.box(g,[8.7,.19,.24],[0,5.57,1.28],'#957451','wood');
  // A modest counter fits wholly inside the existing shop footprint.
  w.box(g,[6.4,1.38,1.40],[0,.88,1.02],'#af8e6c','wood');
  for(let n=0;n<12;n++)w.box(g,[.028,1.2,.035],[-2.93+n*.53,.89,1.741],'#886f53');
  for(const y of [.31,1.49])w.box(g,[6.48,.09,.08],[0,y,1.77],spec.accent,'wood');
  this.backWall(art);
  g.add(...this.eras);
  this.eras.forEach((era,i)=>this.furniture(era,i===0));
  portraits.forEach((img,i)=>{
   const actor=w.print(this.eras[i],img,3.30*img.width/img.height,3.30,[.65,1.75,-.26],true);
   actor.name=this.id+'-keeper-'+(i?'present':'past');actor.userData.noAO=true;this.actors.push(actor);
  });
  const food=new T.Group();food.name=this.id+'-food-model';food.position.set(-1.05,1.76,1.06);g.add(food);
  if(spec.recipe==='broth')this.broth(food);else this.steamer(food,spec.recipe==='shaomai');
  const steamRoot=new T.Group();steamRoot.userData.animationRoot=true;g.add(steamRoot);
  this.steam=makeSteam(w,steamRoot,V(-1.05,spec.recipe==='broth'?2.11:2.04,1.06));
  w.batchStatic(g);w.batchScenery(g);this.setEraProgress(0);
 }
 mount(socket:T.Group){socket.getObjectByName('removable-closure-'+this.id)?.removeFromParent();socket.add(this.root);}
 private backWall(art:KitchenWallArt){
  // The original shops use full painted walls. Slice each era continuously over four hinges.
  // Window, cracks, tiles and plaster stay on the same paper leaf through the turn.
  const w=this.w;
  for(let n=0;n<4;n++){
   const hinge=new T.Group();hinge.position.set(-3.45+n*2.3,3,-2.35);hinge.userData.animationRoot=true;hinge.name=this.id+'-hinge-'+n;this.root.add(hinge);this.hinges.push(hinge);
   w.box(hinge,[2.295,5.78,.07],[0,0,0],'#b9ad90');
   for(const [era,img] of [art.past,art.present].entries()){
    const face=w.print(hinge,img,2.30,5.76,[0,0,era?-.041:.041]);face.name=this.id+'-painted-wall-'+(era?'present':'past')+'-'+n;face.castShadow=false;
    if(era)face.rotation.y=Math.PI;
    const uv=face.geometry.getAttribute('uv');for(let i=0;i<uv.count;i++)uv.setX(i,(uv.getX(i)+n)/4);
   }
  }
 }
 private furniture(g:T.Group,past:boolean){
  const w=this.w,s=this.spec;g.name=this.id+'-era-'+(past?'past':'present');g.userData.animationRoot=true;
  w.sign(g,past?s.name:s.name+' · 今晨',7.2,.74,[0,5.06,1.40],past?s.color:'#5a8073','#f2e4c4',past?'街 坊 早 食　·　趁 热 尝':'旧 窗 新 晨　·　慢 慢 吃');
  w.box(g,[6.6,.08,1.55],[0,1.70,1.02],past?'#c4a17b':'#bccdc3',past?'wood':'metal');
  for(let n=0;n<12;n++){
   const panel=w.box(g,[.70,.027,1.22],[-3.85+n*.70,4.34,1.88],n%2?'#eadcbc':past?s.color:'#8fae9c','cloth');panel.rotation.x=.16;
   w.shape(g,[[-.35,0],[.35,0],[.35,-.20],[0,-.28],[-.35,-.2]],[-3.85+n*.70,4.26,2.47],n%2?'#eadcbc':past?s.color:'#8fae9c',.012);
  }
  const sign=w.sign(g,s.menu,1.58,1.40,[2.87,3.00,-1.93],past?'#e8d5ad':'#e0e9d7',past?'#78644d':'#547467');sign.name=this.id+'-menu';
  w.box(g,[2.55,.12,1.03],[-2.65,1.45,-1.57],past?'#b9936b':'#b8c6bb',past?'wood':'metal');
  for(const x of [-3.60,-1.70])for(const z of [-1.95,-1.17])w.box(g,[.09,1.38,.09],[x,.72,z],'#8b775a','wood');
  w.box(g,[2.70,.09,.49],[-2.70,2.82,-1.97],s.accent,'wood');
  for(let n=0;n<4;n++){
   w.cylinder(g,.20,.42,[-3.65+n*.62,3.07,-1.96],past?'#b99266':'#bfd0c2',20,past?'ceramic':'metal');
   w.cylinder(g,.21,.04,[-3.65+n*.62,3.30,-1.96],'#9a7e5b',20,'wood');
  }
  // Different rear work surfaces reveal the preparation behind each dish.
  if(s.recipe==='broth'){
   w.cylinder(g,.43,.64,[-2.68,1.92,-1.57],past?'#697768':'#b5c7bb',28,'metal');
   for(let n=0;n<3;n++)this.bowl(g,2.24+n*.29,1.78,.68,.23);
  }else{
   for(let n=0;n<5;n++)w.cylinder(g,.21,.008,[-3.3+n*.28,1.524,-1.60],'#e8dbc1',20);
   const pin=w.cylinder(g,.065,1.18,[-2.35,1.60,-1.28],'#ae825a',16,'wood');pin.rotation.z=Math.PI/2;
   for(let n=0;n<3;n++)w.cylinder(g,.41,.20,[2.24,1.89+n*.23,.66],past?'#bd9b6c':'#c6aa7a',28,'wood');
  }
  if(past){w.box(g,[.58,.32,.36],[2.80,1.95,1.18],'#e4cda1');w.sign(g,'手记 · 今日备料',1.38,.57,[-2.86,2.00,-1.98],'#e6d6b4','#756347');}
  else{
   w.box(g,[.66,.22,.47],[2.82,1.89,1.21],'#bed0c1','metal');w.box(g,[.70,.04,.51],[2.82,2.02,1.21],'#e0e6d3');
   w.box(g,[1.23,.14,.91],[-2.70,1.57,-1.57],'#849e90','metal');
   w.sign(g,'自带餐盒 · 随手记一味',2.48,.36,[1.75,1.02,1.78],'#dae4cd','#59786b');
  }
  w.sign(g,past?'今晨开灶':'今晨备餐',1.08,.37,[-2.50,1.03,1.78],past?'#e0cba5':'#d5e0c9','#706c50');
 }
 private bowl(g:T.Group,x:number,y:number,z:number,r:number){
  const w=this.w;w.mesh(g,new T.LatheGeometry([[.09,0],[r*.9,.08],[r,.22],[r-.022,.22],[.1,.025]].map(([a,b])=>new T.Vector2(a,b)),24),w.material('#e0e4ce','ceramic'),[x,y,z]);
  const rim=w.mesh(g,new T.TorusGeometry(r-.010,.012,5,24),w.material('#6d919a'),[x,y+.22,z]);rim.rotation.x=Math.PI/2;
 }
 private broth(g:T.Group){
  const w=this.w;w.mesh(g,new T.LatheGeometry([[.55,0],[.85,.04],[.99,.34],[.97,.37],[.92,.32],[.79,.085],[.55,.03]].map(([a,b])=>new T.Vector2(a,b)),36),w.material('#728271','metal'));
  for(const x of [-1.02,1.02])w.line(g,[V(x*.92,.22,-.2),V(x*1.18,.24,-.2),V(x*1.18,.24,.2),V(x*.92,.22,.2)],'#606d61',.035);
  w.cylinder(g,.9,.017,[0,.30,0],'#d2c6a5',32);
  for(let n=0;n<16;n++){const curve=Array.from({length:6},(_,j)=>V(-.64+j*.24,.317,-.58+n*.075+Math.sin(j+n)*.018));w.line(g,curve,'#e5ddbd',.017);}
  for(let n=0;n<18;n++)w.box(g,[.034,.01,.066],[Math.sin(n*9)*.70,.326,Math.cos(n*7)*.64],'#718b5a');
  this.bowl(this.root,.68,1.77,1.18,.38);w.cylinder(this.root,.33,.01,[.68,1.965,1.18],'#c6b994',24);
  const bread=new T.Group();bread.position.set(1.42,1.82,1.03);bread.rotation.y=.35;this.root.add(bread);
  for(let n=0;n<3;n++)for(const x of [-.07,.07]){const stick=w.mesh(bread,new T.CapsuleGeometry(.073,.80,4,10),w.material(n%2?'#c7a261':'#d5b273'),[x+n*.22,.07,0]);stick.rotation.x=Math.PI/2;}
  const ladle=new T.Group();ladle.name=this.id+'-old-ladle';ladle.position.set(.25,.39,.38);ladle.rotation.z=-.2;g.add(ladle);
  w.mesh(ladle,new T.SphereGeometry(.16,16,8,0,Math.PI*2,0,Math.PI/2),w.material('#8b9889','metal'));w.line(ladle,[V(0,.02,0),V(.14,.78,.04)],'#987451',.037);
 }
 private steamer(g:T.Group,shaomai:boolean){
  const w=this.w,r=shaomai?1.02:.90;
  w.cylinder(g,r,.05,[0,.025,0],'#ceb081',32,'wood');
  for(const y of [.065,.24]){const ring=w.mesh(g,new T.TorusGeometry(r,.047,6,36),w.material('#b39367','wood'),[0,y,0]);ring.rotation.x=Math.PI/2;}
  const woven=w.material('#c1a172','wood');woven.side=T.DoubleSide;
  w.mesh(g,new T.CylinderGeometry(r,r,.18,36,1,true),woven,[0,.15,0]);
  for(let n=0;n<36;n++)w.box(g,[.037,.18,.055],[Math.sin(n*Math.PI/18)*r,.15,Math.cos(n*Math.PI/18)*r],'#c0a071','wood');
  for(let n=0;n<9;n++){const z=-r*.8+n*r*.20;w.box(g,[Math.sqrt(r*r-z*z)*1.85,.012,.045],[0,.058,z],'#a8875e','wood');}
  for(let n=0;n<7;n++){
   const bun=new T.Group();bun.position.set(n?Math.sin(n*Math.PI/3)*r*.60:0,.078,n?Math.cos(n*Math.PI/3)*r*.60:0);g.add(bun);
   const geo=new T.LatheGeometry((shaomai?[[0,0],[.16,.015],[.20,.13],[.17,.24],[.21,.30],[.20,.33],[.145,.29]]:[[0,0],[.18,.02],[.22,.11],[.18,.21],[.11,.28],[.028,.33],[0,.33]]).map(([a,b])=>new T.Vector2(a,b)),32);
   const p=geo.getAttribute('position');for(let j=0;j<p.count;j++){const angle=Math.atan2(p.getZ(j),p.getX(j)),fold=1+Math.cos(angle*10)*.055;p.setXYZ(j,p.getX(j)*fold,p.getY(j),p.getZ(j)*fold);}
   geo.computeVertexNormals();w.mesh(bun,geo,w.material('#e8ddbf'));
   for(let j=0;j<10;j++){const a=j*Math.PI/5;w.line(bun,[V(Math.sin(a)*.20,.13,Math.cos(a)*.20),V(Math.sin(a)*.16,.24,Math.cos(a)*.16),V(Math.sin(a)*(shaomai?.21:.025),shaomai?.31:.33,Math.cos(a)*(shaomai?.21:.025))],'#cabda1',.007);}
   if(shaomai){w.cylinder(bun,.15,.024,[0,.28,0],'#bba476',20);for(let j=0;j<12;j++){const grain=w.mesh(bun,new T.SphereGeometry(.026,6,4),w.material(j%4?'#ded0a7':'#997859'),[Math.sin(j*5)*.12,.302,Math.cos(j*7)*.11]);grain.scale.set(1.4,.5,.65);}}
  }
  if(!shaomai){this.bowl(this.root,.73,1.78,1.30,.28);w.cylinder(this.root,.22,.009,[.73,1.975,1.30],'#735a42',24);for(let j=0;j<8;j++)w.line(this.root,[V(.60+j*.033,1.99,1.20),V(.68+j*.025,1.99,1.40)],'#d9c795',.01);}
 }
 setEraProgress(turn:number){
  this.turn=T.MathUtils.clamp(turn,0,1);const e=eraVisibility(this.turn);
  this.hinges.forEach(h=>{h.rotation.y=this.turn*Math.PI;h.position.z=-2.35-Math.sin(this.turn*Math.PI)*1.18;});
  this.eras.forEach((g,i)=>g.visible=e.furniture&&(e.present?i===1:i===0));
  this.host.setAttribute('data-'+this.id+'-era',e.present?'present':'past');
 }
 speak(){this.requested=true;}
 update(time:number,camera:T.Camera,motion:boolean){
  if(this.disposed)return;if(this.requested){this.speakingUntil=time+3;this.requested=false;}
  const greeting=motion&&time<this.speakingUntil;
  this.actors.forEach(actor=>{actor.rotation.z=greeting?Math.sin(time*2.4)*.008:0;actor.position.y=1.75+(motion?Math.sin(time*.9)*.004:0);});
  this.steam.update(time,camera,true);this.steam.meshes.forEach(m=>m.material.uniforms.strength.value=.24*eraVisibility(this.turn).steam);
  this.host.setAttribute('data-'+this.id+'-greeting',String(greeting));
 }
 dispose(){this.disposed=true;this.root.removeFromParent();this.anchors.clear();}
}
