import * as T from 'three';
import {PaperWorkshop} from '../atelier/PaperWorkshop';

/** Deterministic drawn stone: each era has its own joints, chips, damp and repairs. */
export class AgedPaving{
 private mix={value:0};
 private localMix={value:[0,0,0,0,0,0]};
 constructor(w:PaperWorkshop,parent:T.Group){
  const texture=(today:boolean)=>{
   const c=document.createElement('canvas');c.width=c.height=1024;const x=c.getContext('2d')!;
   let seed=21;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
   x.fillStyle=today?'#8c9187':'#565c51';x.fillRect(0,0,1024,1024);
   for(let row=0;row<8;row++)for(let col=-1;col<8;col++){
    const xx=col*144+(row%2)*72,yy=row*128,gap=today?2:4;
    const base=today?['#b8bbae','#c7c6b3','#aeb9b0','#c2c5b5']:['#8c9384','#a4a894','#939e91','#b1b09a','#8b958a'];
    x.fillStyle=base[Math.floor(rand()*base.length)];x.beginPath();x.roundRect(xx+gap,yy+gap,144-gap*2,128-gap*2,today?3:9);x.fill();
    x.strokeStyle=today?'#dddccc':'#c4c3ab';x.lineWidth=1.2;x.stroke();
    // Mineral flecks and worn edges are drawn in surface space, with no full-screen filter.
    for(let k=0;k<110;k++){x.fillStyle=rand()>.5?'#eee8cf28':'#373e351e';x.fillRect(xx+gap+rand()*(144-2*gap),yy+gap+rand()*(128-2*gap),1+rand()*4,1+rand()*2);}
    if(rand()<(today?.17:.64)){
     x.strokeStyle=today?'#83897b':'#5f685a';x.lineWidth=today?1:1.6;x.beginPath();let cx=xx+20+rand()*100,cy=yy+gap;x.moveTo(cx,cy);
     for(let k=0;k<5;k++){cx+=(rand()-.5)*18;cy+=12+rand()*9;x.lineTo(cx,cy);}x.stroke();
     x.lineWidth=.7;x.beginPath();x.moveTo(cx,cy-22);x.lineTo(cx+14,cy-29);x.lineTo(cx+23,cy-30);x.stroke();
    }
    if(!today&&rand()<.6){x.fillStyle='#4e665334';x.beginPath();x.ellipse(xx+18,yy+70,13,42,0,0,Math.PI*2);x.fill();}
    if(today&&row===5&&col===3){x.fillStyle='#9eaaa0';x.fillRect(xx+45,yy+11,70,106);x.strokeStyle='#d1d4bd';x.strokeRect(xx+45,yy+11,70,106);}
   }
   // Wide stains, cart-wheel scuffs and recessed moss at irregular edges.
   for(let n=0;n<(today?12:33);n++){x.fillStyle=today?'#737e6910':'#46574520';x.beginPath();x.ellipse(rand()*1024,rand()*1024,12+rand()*50,4+rand()*20,rand()*3,0,Math.PI*2);x.fill();}
   const t=w.ownTexture(new T.CanvasTexture(c));t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(2.1,10.8);t.anisotropy=4;return t;
  };
  const old=texture(false),now=texture(true);
  const mat=w.ownMaterial(new T.MeshStandardMaterial({map:old,roughness:.96,bumpMap:old,bumpScale:.025,color:'#ffffff'}));
  mat.onBeforeCompile=s=>{s.uniforms.eraPaving=this.localMix;s.uniforms.todayPaving={value:now};
   s.vertexShader='varying float streetPavingZ;\n'+s.vertexShader;
   s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nstreetPavingZ=(modelMatrix*vec4(transformed,1.)).z;');
   s.fragmentShader='varying float streetPavingZ;uniform float eraPaving[6];uniform sampler2D todayPaving;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
   float localEra=eraPaving[5];
   localEra=mix(localEra,eraPaving[4],smoothstep(-19.,-17.,streetPavingZ));
   localEra=mix(localEra,eraPaving[3],smoothstep(-13.5,-11.5,streetPavingZ));
   localEra=mix(localEra,eraPaving[2],smoothstep(-8.,-6.,streetPavingZ));
   localEra=mix(localEra,eraPaving[1],smoothstep(-2.5,-.5,streetPavingZ));
   localEra=mix(localEra,eraPaving[0],smoothstep(3.,5.,streetPavingZ));
   vec4 pavement=mix(texture2D(map,vMapUv),texture2D(todayPaving,vMapUv),localEra);
   diffuseColor*=pavement;
   #endif`);};mat.customProgramCacheKey=()=> 'domino-stone-to-repaired-stone-v1';
  const mesh=w.mesh(parent,new T.PlaneGeometry(9.65,57.8,1,1),mat,[0,.061,-6.8]);mesh.rotation.x=-Math.PI/2;mesh.castShadow=false;mesh.receiveShadow=true;mesh.name='era-aged-stone-pavement';mesh.userData.noAO=true;
  // A continuous line of tiny cobbles separates stone from the drainage channel.
  const geo=new T.BoxGeometry(.16,.025,.23);w.geometries.add(geo);const cobbles=new T.InstancedMesh(geo,w.material('#717969','stone'),420),m=new T.Matrix4();
  for(let i=0;i<420;i++){m.makeTranslation(i%2?4.74:-4.74,.063,21-(i>>1)*.267);cobbles.setMatrixAt(i,m);}cobbles.receiveShadow=true;cobbles.castShadow=false;parent.add(cobbles);
 }
 update(turn:number,local?:readonly number[]){this.mix.value=T.MathUtils.smoothstep(turn,0,1);this.localMix.value=local?[...local]:Array(6).fill(this.mix.value);}
}
