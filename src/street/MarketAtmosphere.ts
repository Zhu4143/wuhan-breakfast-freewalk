import * as T from 'three';
import {PaperWorkshop} from '../atelier/PaperWorkshop';
import {shopPlots} from './layout';
import {clampMorning,shopOpening,smooth} from './marketTime';
import {StreetSunlight} from './StreetSunlight';

type Lamp={group:T.Group;old:T.Group;today:T.Group;bulb:T.MeshStandardMaterial;light:T.PointLight;halo:T.ShaderMaterial;pool:T.ShaderMaterial};
type Door={id:string;old:T.Group;today:T.Group;leaves:T.Group[]};
const mix=(a:string,b:string,t:number)=>new T.Color(a).lerp(new T.Color(b),t);

/** Physical lamps, opening shutters and the shared dawn palette, all in world space. */
export class MarketAtmosphere{
 readonly root=new T.Group();
 private lamps:Lamp[]=[];private doors:Door[]=[];
 private hemi:T.HemisphereLight[]=[];private fill:T.DirectionalLight[]=[];
 private lastProgress=-1;private lastEra=-1;
 private sunlight:StreetSunlight;
 constructor(private scene:T.Scene,private sun:T.DirectionalLight,private renderer:T.WebGLRenderer,
  private sky:T.Mesh,private disc:T.Mesh,private glow:T.Mesh,w:PaperWorkshop,sockets:Map<string,T.Group>){
  this.root.name='morning-lamps-and-opening-doors';this.root.userData.animationRoot=true;scene.add(this.root);
  scene.children.forEach(o=>{if(o instanceof T.HemisphereLight)this.hemi.push(o);if(o instanceof T.DirectionalLight&&o!==sun)this.fill.push(o);});
  this.sunlight=new StreetSunlight(w,this.root);
  for(const plot of shopPlots){
   // The frontage runs along Z. Stand in the gap beyond its edge, clear of the shop.
   const lampZ=plot.z+plot.width/2+.8;
   this.lamp(w,plot.x<0?-5.15:5.15,lampZ,plot.x<0?1:-1);
   const socket=sockets.get(plot.id);if(socket)this.door(w,socket,plot.id);
  }
 }
 private lightWash(w:PaperWorkshop,ground=false){
  return w.ownMaterial(new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
   uniforms:{strength:{value:0},tint:{value:new T.Color('#ffb768')}},
   vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:`varying vec2 v;uniform float strength;uniform vec3 tint;void main(){float r=length((v-.5)*2.);float a=${ground?'pow(max(0.,1.-r),2.)':'pow(max(0.,sin(v.x*3.14159)),3.)*pow(v.y,1.6)'};gl_FragColor=vec4(tint,a*strength);}`
  }));
 }
 private lamp(w:PaperWorkshop,x:number,z:number,side:number){
  const group=new T.Group();group.position.set(x,0,z);group.name='street-lamp-'+this.lamps.length;group.userData.animationRoot=true;this.root.add(group);
  const old=new T.Group(),today=new T.Group();old.name='enamel-lantern';today.name='modern-street-lamp';group.add(old,today);
  // Bent iron + enamel shade in the old street, a clean timber-and-metal fitting today.
  for(const [era,g] of [old,today].entries()){
   w.cylinder(g,era?.055:.045,4.9,[0,2.5,0],era?'#4c6c69':'#5e5142',10,'metal');
   w.box(g,[.28,.12,.28],[0,.14,0],era?'#87978b':'#72634f','stone');
   w.line(g,[new T.Vector3(0,4.82,0),new T.Vector3(side*.25,5.02,0),new T.Vector3(side*.7,4.87,0)],era?'#46665f':'#62533f',.04);
   if(era){w.box(g,[.65,.13,.39],[side*.7,4.77,0],'#658579','metal');}
   else {
    w.mesh(g,new T.ConeGeometry(.42,.25,16,1,true),w.material('#4e6f62','metal'),[side*.7,4.78,0]);
    w.cylinder(g,.18,.18,[side*.7,4.91,0],'#807057',12,'metal');
   }
   w.batchStatic(g);w.batchScenery(g);
  }
  const bulb=w.ownMaterial(new T.MeshStandardMaterial({color:'#fff0c5',emissive:'#ffc579',emissiveIntensity:3,roughness:.55}));
  const glass=w.mesh(group,new T.SphereGeometry(.16,10,8),bulb,[side*.7,4.57,0]);glass.castShadow=false;
  const light=new T.PointLight('#ffc074',24,12,2);light.position.set(side*.7,4.35,0);group.add(light);
  const halo=this.lightWash(w),cone=w.mesh(group,new T.CylinderGeometry(.12,1.6,4.25,16,1,true),halo,[side*.7,2.37,0]);
  cone.castShadow=false;cone.receiveShadow=false;cone.userData.noAO=true;
  const pool=this.lightWash(w,true),patch=w.mesh(group,new T.PlaneGeometry(4.8,4.8),pool,[side*.7,.14,0]);patch.rotation.x=-Math.PI/2;patch.castShadow=false;patch.receiveShadow=false;patch.userData.noAO=true;
  this.lamps.push({group,old,today,bulb,light,halo,pool});
 }
 private door(w:PaperWorkshop,socket:T.Group,id:string){
  const old=new T.Group(),today=new T.Group(),leaves:T.Group[]=[];
  old.name='morning-folding-door-'+id;today.name='morning-roller-door-'+id;
  for(const g of [old,today]){g.userData.animationRoot=true;g.position.set(0,.16,2.94);socket.add(g);}
  for(const side of [-1,1]){
   const leaf=new T.Group();leaf.position.set(side*4.16,0,0);leaf.userData.animationRoot=true;old.add(leaf);leaves.push(leaf);
   for(let n=0;n<6;n++)w.box(leaf,[.68,4.15,.09],[-side*(n+.5)*.685,2.09,0],n%2?'#85705b':'#927b61','wood');
   for(const y of [.53,3.43])w.box(leaf,[4.10,.10,.15],[-side*2.05,y,.06],'#645545','wood');
   w.box(leaf,[.065,.49,.17],[-side*3.83,2.06,.15],'#b8a074','metal');
   w.batchStatic(leaf);w.batchScenery(leaf);
  }
  w.sign(old,'清 晨 备 料 中',2.55,.56,[0,2.80,.15],'#d8c79d','#605244');
  w.box(today,[8.28,4.2,.085],[0,2.1,0],'#829b94','metal');
  for(let i=0;i<25;i++)w.box(today,[8.29,.021,.032],[0,.11+i*.167,.058],'#557c78','metal');
  w.sign(today,'早 安 · 稍 候 开 门',2.78,.52,[0,2.8,.075],'#e6e6d4','#456960');
  w.batchStatic(today);w.batchScenery(today);
  this.doors.push({id,old,today,leaves});
 }
 update(progress:number,era:number,atShop?:(id:string)=>number){
  progress=clampMorning(progress);era=clampMorning(era);
  if(Math.abs(progress-this.lastProgress)<.00005&&Math.abs(era-this.lastEra)<.0001)return;
  this.lastProgress=progress;this.lastEra=era;
  const day=smooth((progress-.035)/.82),warm=smooth(progress/.45)*(1-smooth((progress-.45)/.55));
  const skyTint=mix('#60738e','#fff9e7',day).lerp(new T.Color('#f8c391'),warm*.15).lerp(new T.Color('#c2e4e5'),era*.10);
  (this.sky.material as T.MeshBasicMaterial).color.copy(skyTint);
  this.scene.fog!.color.copy(mix('#515e76','#e4e7d2',day).lerp(new T.Color('#b8d0cb'),era*.16));
  // A stronger side light and quieter cool fill keep the whole lane dimensional.
  const y=5+progress*33;this.sun.position.set(32,y,-48);
  this.sun.intensity=.10+day*4.5;this.sun.color.copy(mix('#ed9d6a','#ffe1ac',day).lerp(new T.Color('#fff0cb'),era*.12));
  this.sunlight.update(progress,this.sun);
  this.disc.position.set(32,y,-48);this.glow.position.set(32,y,-47.8);
  const sunMaterial=this.disc.material as T.MeshBasicMaterial;sunMaterial.color.copy(mix('#c97e5f','#fff0c4',day));
  (this.glow.material as T.ShaderMaterial).uniforms.strength.value=.08+warm*.24;
  for(const hemi of this.hemi){hemi.intensity=.24+day*.34;hemi.color.copy(mix('#839abb','#cce5ef',day));hemi.groundColor.copy(mix('#605c73','#b99a72',day));}
  for(const fill of this.fill){fill.position.set(-24,14,18);fill.intensity=.13+day*1.25;fill.color.copy(mix('#7f9fc8','#f6e9d2',day));}
  this.scene.environmentIntensity=.05+day*.17;this.renderer.toneMappingExposure=.80+day*.30;
  const glow=1-smooth((progress-.14)/.46);
  for(const [index,lamp] of this.lamps.entries()){
   const local=atShop?.(shopPlots[index].id)??era;
   lamp.old.visible=local<.5;lamp.today.visible=local>=.5;
   const tint=mix('#ffc074','#ecf1cb',local);lamp.light.color.copy(tint);lamp.light.intensity=glow*(24+local*5);
   lamp.bulb.emissive.copy(tint);lamp.bulb.emissiveIntensity=.12+glow*3.1;
   lamp.halo.uniforms.strength.value=glow*.043;lamp.pool.uniforms.strength.value=glow*.18;
   lamp.halo.uniforms.tint.value.copy(tint);lamp.pool.uniforms.tint.value.copy(tint);
  }
  for(const door of this.doors){
   const open=shopOpening(door.id,progress),local=atShop?.(door.id)??era;
   door.old.visible=local<.5&&open<.999;door.today.visible=local>=.5&&open<.999;
   door.leaves.forEach((leaf,i)=>leaf.rotation.y=(i===0?1:-1)*open*1.48);
   // Keep the opening notice with the folding surface, not floating over an open shop.
   for(const child of door.old.children)if(!door.leaves.includes(child as T.Group))child.visible=open<.25;
   door.today.scale.y=1-open*.98;door.today.position.y=.16+open*4.12;
   door.old.userData.opening=open;door.today.userData.opening=open;
  }
 }
 dispose(){this.sunlight.dispose();this.root.removeFromParent();for(const door of this.doors){door.old.removeFromParent();door.today.removeFromParent();}}
}
