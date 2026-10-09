import * as T from 'three';
import {gsap} from 'gsap';
import {PaperWorkshop} from './PaperWorkshop';
import type {Detail,Era} from './content';
import {views,viewDistance} from './camera';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {addShopDetails} from './ShopDetails';
import {makeSteam} from './Steam';
import {SceneFinish} from './SceneFinish';
import type {SceneExtension} from './SceneExtension';

export class AtelierScene {
  readonly renderer:T.WebGLRenderer;
  readonly scene=new T.Scene(); readonly camera=new T.PerspectiveCamera(35,1,.1,80);
  readonly workshop=new PaperWorkshop(); readonly root=new T.Group();
  private disposed=false; private frame=0; private last=0; private elapsed=0;
  private pointer=new T.Vector2(); private drift=new T.Vector2(); private drag:{x:number;start:number}|null=null;
  private orbit=0; private size={w:1,h:1}; private target=new T.Vector3();
  private focus:Detail='welcome'; private focusBlend={value:1}; private focusStart=new T.Vector3(); private targetStart=new T.Vector3();
  private wall=new T.Group(); private panels:T.Group[]=[]; private canopies:T.Group[]=[]; private wallTravel={value:0}; private setPortraitFrame:((a:number,b:number,mix:number,blink:number)=>void)[]=[]; private speakingUntil=0;
  private nextBlink=4.2; private blinkUntil=0;
  private environment:T.WebGLRenderTarget|null=null; private finish:SceneFinish;
  private anchors=new Map<Detail,T.Vector3>(); private leaves:T.Group[]=[]; private steam:ReturnType<typeof makeSteam>|null=null;
  private keepers:T.Object3D[]=[]; private hanging=new T.Group(); private past=new T.Group(); private present=new T.Group();
  private era:Era='past'; private transition:gsap.core.Timeline|null=null; private cameraTween:gsap.core.Tween|null=null;
  private motion=true; private lost=false; private ready=false; private flat=false; private exploded={value:0};
  private layers:{object:T.Object3D;z:number;offset:number}[]=[]; private resizeObserver:ResizeObserver;
  private onVisibility=()=>{if(document.hidden)cancelAnimationFrame(this.frame);else{this.last=performance.now();this.tick(this.last);}};
  constructor(private host:HTMLDivElement,private markers:Map<Detail,HTMLButtonElement>,private status:(s:string)=>void,private onEra:(era:Era)=>void=()=>{},private onTurning:(turning:boolean)=>void=()=>{},private extension?:SceneExtension,illustrated=false){
    this.workshop.illustrated=illustrated||!!extension?.illustrated;
    this.renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.outputColorSpace=T.SRGBColorSpace;
    this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.02;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFShadowMap;this.renderer.shadowMap.autoUpdate=false;
    this.renderer.setClearColor('#000000',0);host.appendChild(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-label',extension?.ownsPointer?'武汉老街三维纸景，第一人称自由行走':'林记热干面三维纸景：可拖动视角，通过旁边的按钮观察旧物');
    this.scene.add(new T.HemisphereLight('#e8eef6','#695641',.24));
    const sun=new T.DirectionalLight('#ffecd0',3.25);sun.position.set(-3.8,7,6);sun.castShadow=true;
    sun.shadow.mapSize.set(3072,3072);Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-5,near:.1,far:26});sun.shadow.normalBias=.008;sun.shadow.bias=-.00008;
    const fill=new T.DirectionalLight('#ccdeeb',.28);fill.position.set(4,3,8);this.scene.add(fill);
    const environmentScene=new RoomEnvironment();const pmrem=new T.PMREMGenerator(this.renderer);
    this.environment=pmrem.fromScene(environmentScene,.05);this.scene.environment=this.environment.texture;this.scene.environmentIntensity=.42;
    environmentScene.dispose();pmrem.dispose();
    if(this.workshop.illustrated){sun.intensity=2.1;fill.intensity=.72;this.scene.environmentIntensity=.3;}
    this.scene.add(sun);this.scene.add(this.root);this.extension?.configure(this.scene,this.renderer,this.camera,this.root);this.finish=new SceneFinish(this.renderer,this.scene,this.camera,this.workshop.illustrated);
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);
    host.addEventListener('pointermove',this.move);host.addEventListener('pointerdown',this.down);host.addEventListener('pointerup',this.up);host.addEventListener('pointercancel',this.up);host.addEventListener('pointerleave',this.leave);
    this.renderer.domElement.addEventListener('webglcontextlost',this.contextLost);this.renderer.domElement.addEventListener('webglcontextrestored',this.contextRestored);
    document.addEventListener('visibilitychange',this.onVisibility);this.resize();
  }
  private contextLost=(e:Event)=>{e.preventDefault();this.lost=true;cancelAnimationFrame(this.frame);this.status('lost');};
  private contextRestored=()=>{if(this.disposed)return;this.lost=false;this.renderer.resetState();this.status('ready');this.last=performance.now();this.tick(this.last);};
  private down=(e:PointerEvent)=>{if(this.extension?.ownsPointer||(e.target as HTMLElement).closest('button'))return;this.drag={x:e.clientX,start:this.orbit};this.host.setPointerCapture(e.pointerId);};
  private up=(e:PointerEvent)=>{if(this.extension?.ownsPointer)return;this.drag=null;if(this.host.hasPointerCapture(e.pointerId))this.host.releasePointerCapture(e.pointerId);};
  private move=(e:PointerEvent)=>{if(this.extension?.ownsPointer)return;const b=this.host.getBoundingClientRect();this.pointer.set((e.clientX-b.left)/b.width-.5,(e.clientY-b.top)/b.height-.5);if(this.drag)this.orbit=T.MathUtils.clamp(this.drag.start+(e.clientX-this.drag.x)/b.width*1.1,-.35,.35);};
  private leave=()=>{this.pointer.set(0,0);};
  private layer(object:T.Object3D,offset:number){this.layers.push({object,z:object.position.z,offset});return object;}
  async build(){
    const w=this.workshop,g=this.root;
    const illustrated=w.illustrated,base=import.meta.env.BASE_URL+'assets/'+(illustrated?'storybook/':'atelier/');
    const [interior,keeper,successor,bowl,today]=await Promise.all(['interior',illustrated?'keeper-atlas':'keeper',illustrated?'successor-atlas':'successor','bowl','interior-present'].map(n=>w.image(base+n+'.webp')));
    const timber=illustrated?null:await w.image(import.meta.env.BASE_URL+'assets/atelier/timber-grain.webp');
    const [keeperSpeak,keeperBlink,successorSpeak,successorBlink,...extra]=illustrated?[]:await Promise.all(['keeper-speak','keeper-blink','successor-speak','successor-blink','keeper-closed','keeper-ee','keeper-oh','successor-closed','successor-ee','successor-oh'].map(n=>w.image(base+n+'.webp')));
    if(this.disposed)return;
    w.timber=timber;
    // A book-like plinth and irregular individually laid paving stones establish a physical miniature.
    w.box(g,[9.4,.22,5.2],[0,-.15,.25],'#bfa987');w.box(g,[9.25,.045,5.08],[0,-.008,.25],'#e6d7ba');
    const contactGround=w.mesh(g,new T.PlaneGeometry(this.extension?10:24,this.extension?6:24),w.ownMaterial(new T.ShadowMaterial({color:'#483b30',opacity:.18,depthWrite:false})),[0,-.267,0]);
    contactGround.rotation.x=-Math.PI/2;contactGround.castShadow=false;contactGround.userData.noAO=true;
    for(let row=0;row<6;row++)for(let col=0;col<12;col++){
      const stone=w.box(g,[.73,.055,.76],[-4.27+col*.77+(row%2?.11:0),.018,-1.7+row*.8],['#a9aaa0','#b8b7a8','#c6c4b1','#a3aaa2'][(row*3+col)%4],'stone');stone.rotation.y=Math.sin(row*17+col*6)*.014;
    }
    const back=new T.Group();g.add(back);this.layer(back,-1.3);
    this.wall.position.set(0,2.9,-1.1);back.add(this.wall);
    // Four hinged leaves keep the 180-degree turn visible without sweeping through the counter.
    for(let i=0;i<4;i++){
      const panel=new T.Group();panel.position.x=-2.8125+i*1.875;this.wall.add(panel);this.panels.push(panel);
      w.box(panel,[1.873,5.1,.105],[0,0,0],'#8b795f');
      for(const [j,img] of [interior,today].entries()){
        const face=w.print(panel,img,1.875,5,[0,0,j===0?.058:-.058]);
        if(j===1)face.rotation.y=Math.PI;
        const uv=face.geometry.getAttribute('uv');for(let k=0;k<uv.count;k++)uv.setX(k,(uv.getX(k)+i)/4);
      }
    }
    w.box(back,[.22,5.65,.28],[-3.88,2.84,-.78],'#483b30','wood');w.box(back,[.25,5.65,.28],[3.88,2.84,-.78],'#483b30','wood');
    for(let side of [-1,1]){const wing=new T.Group();wing.position.set(side*3.9,0,-.72);wing.rotation.y=side*Math.PI/2;g.add(wing);w.box(wing,[1.65,4.95,.09],[.75,2.5,0],'#777e75');for(let j=0;j<10;j++){w.box(wing,[1.58,.018,.012],[.75,.2+j*.49,.06],'#4d5854');}}
    const facade=new T.Group();g.add(facade);this.layer(facade,.35);
    w.box(facade,[7.98,.27,.42],[0,4.53,.32],'#4c3529','wood');
    for(const x of [-3.62,-2.43,3.5]){w.box(facade,[.19,4.46,.25],[x,2.25,.25],'#58402c','wood');w.box(facade,[.04,4.4,.05],[x-.06,2.25,.402],'#b5996a','wood');}
    // Indigo folding shutters form an entrance on the left, distinct from the service opening.
    for(let i=0;i<3;i++){const shutter=new T.Group();shutter.position.set(-3.38+i*.33,2.22,.3+(i%2)*.16);shutter.rotation.y=(i%2?-.25:.15);facade.add(shutter);
      w.box(shutter,[.31,3.85,.07],[0,0,0],'#354f55','wood');for(let k=0;k<3;k++)w.box(shutter,[.245,1.09,.025],[0,-1.21+k*1.21,.05],'#49646a','wood');
      w.box(shutter,[.022,3.7,.015],[-.09,0,.072],'#a3a88d');}
    const roof=new T.Group();g.add(roof);this.layer(roof,.65);
    w.box(roof,[8.35,.16,1.85],[0,5.64,-.27],'#39494a');
    for(let row=0;row<4;row++)for(let col=0;col<24;col++){
      const tileMat=w.material((row+col)%3?'#495954':'#354745','stone');tileMat.side=T.DoubleSide;
      const tile=w.mesh(roof,new T.CylinderGeometry(.175,.168,.53,12,1,true,Math.PI/2,Math.PI),tileMat,[-3.96+col*.346,5.61+row*.11+Math.sin(col*7+row)*.013,.42-row*.45]);tile.rotation.x=Math.PI/2+.22;tile.rotation.z=Math.sin(col*11+row)*.012;
    }
    w.box(roof,[8.6,.16,.2],[0,5.63,.7],'#293e40','wood');
    this.past.name='era-past';this.present.name='era-present';g.add(this.past,this.present);this.present.visible=false;
    for(const [index,eraGroup] of [this.past,this.present].entries()){
      const isPast=index===0;
      w.sign(eraGroup,isPast?'林 記 · 熱 干 麵':'林记 · 热干面',5.9,.82,[.5,5.16,.51],isPast?'#893c30':'#e6dcc2',isPast?'#f1dbad':'#304b4c',isPast?'清 晨 开 门　·　街 坊 老 味 道':'过 早 旧 味　·　一 碗 如 常');
      const canopy=new T.Group();canopy.position.set(.53,4.73,.44);eraGroup.add(canopy);this.canopies.push(canopy);
      for(let i=0;i<12;i++){
        const panel=w.box(canopy,[.512,.025,1.48],[-2.85+i*.518,-.13,.67],isPast?(i%2?'#963f30':'#b66140'):(i%2?'#647e75':'#e3d6b5'),'cloth');panel.rotation.x=.16;
        w.line(canopy,[new T.Vector3(-3.09+i*.518,-.015,0),new T.Vector3(-3.09+i*.518,-.245,1.39)],isPast?'#ddb77d':'#a5b5a2',.006);
        w.shape(canopy,[[-.26,0],[.26,0],[.25,-.29],[.10,-.33],[-.09,-.30],[-.26,-.32]],[-2.85+i*.518,-.245,1.41],isPast?(i%2?'#963f30':'#b66140'):(i%2?'#647e75':'#e3d6b5'),.025);
      }
      for(const x of [-2.35,3.41])w.line(eraGroup,[new T.Vector3(x,3.75,.5),new T.Vector3(x,4.20,1.72)],'#48372b',.023);
      w.box(eraGroup,[5.97,.075,1.43],[.51,1.74,1.01],isPast?'#b28151':'#adb8af',isPast?'wood':'metal');
      if(!isPast){
        const bag=new T.Group();bag.position.set(2.72,2.07,1.1);eraGroup.add(bag);w.box(bag,[.48,.64,.27],[0,0,0],'#d9bd87');w.sign(bag,'早',.34,.34,[0,0,.146],'#d9bd87','#934230');w.line(bag,[new T.Vector3(-.13,.34,0),new T.Vector3(-.13,.5,0),new T.Vector3(.13,.5,0),new T.Vector3(.13,.34,0)],'#725536',.018);
        w.sign(eraGroup,'堂食 · 外带',1.08,.28,[2.78,3.59,.23],'#dedcc8','#3d5c55');
        w.sign(eraGroup,'林记的清晨',.65,.84,[-2.99,2.14,.56],'#e6d6b9','#384e4f','今 日 营 业');
      } else w.sign(eraGroup,'开门过早',.61,.92,[-3.02,2.19,.56],'#a84534','#f1ddbd');
    }
    const counter=new T.Group();g.add(counter);this.layer(counter,1.05);
    w.box(counter,[5.85,1.45,1.12],[.51,.97,1.01],'#4d4438','wood');
    for(let i=0;i<13;i++){
      w.box(counter,[.428,1.39,.07],[-2.24+i*.46,.96,1.601],['#72503b','#866346','#69513a','#956d48'][i%4],'wood');
      for(const y of [.41,1.49]){const pin=w.cylinder(counter,.012,.007,[-2.24+i*.46,y,1.645],'#343a32',6);pin.rotation.x=Math.PI/2;}
    }
    w.box(counter,[6.05,.09,.16],[.51,.28,1.62],'#43392e','wood');w.box(counter,[6.07,.105,.13],[.51,1.65,1.64],'#aa8155','wood');
    const personGroup=new T.Group();personGroup.position.set(-.38,2.50,.26);g.add(personGroup);this.layer(personGroup,.52);
    this.keepers=[w.print(personGroup,keeper,1.73,2.60,[0,0,0],true,illustrated),w.print(personGroup,successor,1.73,2.60,[0,0,.002],true,illustrated)];this.keepers[1].visible=false;
    this.setPortraitFrame=illustrated?this.keepers.map((p,i)=>w.portraitAtlas(p as T.Mesh,i===1)):[w.portraitFrames(this.keepers[0] as T.Mesh,[keeperSpeak,...extra.slice(0,3),keeperBlink]),w.portraitFrames(this.keepers[1] as T.Mesh,[successorSpeak,...extra.slice(3),successorBlink],true)];
    const meal=new T.Group();meal.position.set(.51,0,1.56);g.add(meal);this.layer(meal,1.65);
    const mealPrint=w.print(meal,bowl,1.42,.947,[0,0,0],true);mealPrint.geometry.computeBoundingBox();
    meal.position.y=1.7775-mealPrint.geometry.boundingBox!.min.y+.004;meal.rotation.y=.10;
    this.host.dataset.bowlClearance=(meal.position.y+mealPrint.geometry.boundingBox!.min.y-1.7775).toFixed(4);
    // Dimensional ceramic jar, enamel cup, bowls, chopsticks, and bamboo basket.
    const props=new T.Group();g.add(props);this.layer(props,1.1);
    const jar=new T.Group();jar.position.set(-1.76,1.79,1.04);props.add(jar);
    const profile=[[.21,0],[.26,.025],[.292,.12],[.298,.29],[.275,.45],[.294,.49],[.304,.515],[.28,.535],[.259,.51],[.25,.47],[.25,.32]].map(([x,y])=>new T.Vector2(x,y));
    w.mesh(jar,new T.LatheGeometry(profile,64),w.material('#8e6841','ceramic'));
    w.cylinder(jar,.25,.016,[0,.465,0],'#906025',48,'ceramic');
    const rim=w.mesh(jar,new T.TorusGeometry(.29,.019,10,64,Math.PI*1.94),w.material('#d6b78d','ceramic'),[0,.519,0]);rim.rotation.x=Math.PI/2;rim.rotation.z=.27;
    for(let i=0;i<3;i++)w.line(jar,[new T.Vector3(-.08+i*.068,.529,.268),new T.Vector3(-.075+i*.063,.46-i*.022,.286),new T.Vector3(-.071+i*.06,.435-i*.025,.288)],'#a47e41',.008);
    w.sign(jar,'麻酱',.29,.23,[0,.24,.308],'#dbc9a2','#564134');
    const spoon=w.box(jar,[.032,.60,.017],[.02,.64,.045],'#9c9e8d','metal');spoon.rotation.z=-.22;
    w.mesh(props,new T.LatheGeometry([[.14,0],[.176,.02],[.18,.30],[.167,.30],[.165,.028],[0,.028]].map(([x,y])=>new T.Vector2(x,y)),48),w.material('#e5ddc2','ceramic'),[-1.09,1.78,1.19]);
    const cupRim=w.mesh(props,new T.TorusGeometry(.175,.008,8,48),w.material('#325157','ceramic'),[-1.09,2.085,1.19]);cupRim.rotation.x=Math.PI/2;
    w.cylinder(props,.161,.005,[-1.09,1.95,1.19],'#695231',48,'ceramic');
    const handle=w.mesh(props,new T.TorusGeometry(.10,.015,5,18),w.material('#3c5758'),[-.87,1.95,1.19]);handle.rotation.y=Math.PI/2;
    const stickCup=w.cylinder(props,.18,.33,[2.02,1.97,.95],'#846344');
    for(let i=0;i<11;i++){const stick=w.box(props,[.025,.59,.026],[1.9+(i%4)*.074,2.34,.87+Math.floor(i/4)*.055],'#d5b886');stick.rotation.z=(i%3-1)*.07;}
    for(let i=0;i<4;i++){
      const radius=.23+i*.009,y=1.79+i*.065;
      w.mesh(props,new T.LatheGeometry([[.115,0],[.13,.025],[radius,.12],[radius-.012,.123],[.12,.032]].map(([x,yy])=>new T.Vector2(x,yy)),40),w.material('#e1dac2','ceramic'),[1.36,y,.92]);
      const rim=w.mesh(props,new T.TorusGeometry(radius-.005,.007,6,40),w.material('#415d68','ceramic'),[1.36,y+.12,.92]);rim.rotation.x=Math.PI/2;
    }
    stickCup.name='bamboo-chopsticks';
    addShopDetails(w,props);
    // Uneven repaired stool and a small threshold are permanent anchors across eras.
    const stool=new T.Group();stool.position.set(-2.94,.03,2.08);stool.rotation.y=-.17;g.add(stool);this.layer(stool,2.1);
    w.box(stool,[.90,.08,.63],[0,.76,0],'#9b714b','wood');
    for(const x of [-.32,.32])for(const z of [-.2,.2]){const leg=w.box(stool,[.075,.73,.077],[x,.37,z],x>0&&z>0?'#c4a071':'#71533b','wood');leg.rotation.z=-x*.15;}
    w.box(stool,[.73,.06,.06],[0,.29,.22],'#816146','wood');w.box(stool,[.07,.12,.10],[.36,.18,.2],'#c7b597');
    // Hinged side flag and cord: their pivots make the motion read as paper objects.
    this.hanging.position.set(3.69,4.85,1.02);g.add(this.hanging);
    w.line(g,[new T.Vector3(3.67,5.03,.4),new T.Vector3(3.67,5.03,1.05)],'#353d35',.03);
    w.sign(this.hanging,'过\n早',.49,1.21,[0,-.68,0],'#b04834','#ecdab8');
    w.box(this.hanging,[.59,.043,.055],[0,-1.32,0],'#775331','wood');
    w.sign(g,'巷里 · 林记',.82,.29,[-3.43,4.97,.52],'#dfddc7','#3e5b59');
    // A very small planted tree, paper leaves in multiple depths, frames the roof.
    const tree=new T.Group();tree.position.set(4.18,0,-.16);g.add(tree);
    w.line(tree,[new T.Vector3(0,0,0),new T.Vector3(-.2,2.9,0),new T.Vector3(-.1,5.15,-.05),new T.Vector3(-1.2,6.45,.2)],'#555642',.075);
    for(let b=0;b<5;b++){
      const x=-.2-b*.29,y=4.25+b*.43;w.line(tree,[new T.Vector3(-.13,y-.3,0),new T.Vector3(x+.4,y+.5,.1),new T.Vector3(x+1.05,y+.65,.2)],'#5c634b',.021);
      const branch=new T.Group();branch.position.set(x+.4,y+.4,.13);tree.add(branch);this.leaves.push(branch);
      for(let j=0;j<7;j++){const leaf=w.shape(branch,[[0,-.1],[-.15,.07],[-.13,.30],[0,.46],[.13,.28],[.14,.08]],[(j%4)*.23-.27,Math.floor(j/4)*.25,j%3*.04],['#657455','#9e9d64','#718765'][j%3],.018);leaf.rotation.z=-1+j*.39;leaf.rotation.y=(j%2)*.45;}
    }
    // Bare bulb is built in space in front of the printed interior, with restrained warm light.
    w.line(g,[new T.Vector3(1.3,4.41,.23),new T.Vector3(1.29,3.89,.29)],'#3e3731',.012);
    w.cylinder(g,.065,.11,[1.29,3.88,.29],'#504b37');
    const bulbMat=w.ownMaterial(new T.MeshStandardMaterial({color:'#ffdc92',emissive:'#ffc96b',emissiveIntensity:1.1,roughness:.55}));
    w.mesh(g,new T.SphereGeometry(.105,12,8),bulbMat,[1.29,3.73,.29]);
    const lamp=new T.PointLight('#ffbd6d',3.5,4,2);lamp.position.set(1.29,3.63,.55);g.add(lamp);
    this.steam=makeSteam(w,g,new T.Vector3(.51,meal.position.y+.15,1.63));
    this.anchors.set('keeper',new T.Vector3(-.87,3.15,.5));this.anchors.set('bowl',new T.Vector3(.67,2.27,1.81));this.anchors.set('jar',new T.Vector3(-1.79,2.12,1.2));this.anchors.set('stool',new T.Vector3(-2.94,.62,2.25));
    w.batchStatic(g);
    if(illustrated)w.inkContours(g);
    if(this.extension)await this.extension.build(w,this.scene,this.root);
    if(this.disposed)return;
    // Warm both eras and facial textures while the loading card is visible, avoiding compilation stalls halfway through a turn.
    this.past.visible=this.present.visible=true;this.keepers.forEach(k=>k.visible=true);
    w.textures.forEach(texture=>this.renderer.initTexture(texture));
    await this.renderer.compileAsync(this.scene,this.camera);if(this.disposed)return;
    this.applyEra();this.panels.forEach(p=>p.rotation.y=this.era==='past'?0:Math.PI);
    this.ready=true;this.status('ready');this.resize();this.last=performance.now();this.tick(this.last);
  }
  setMotion(enabled:boolean){
    this.motion=enabled;if(!enabled){this.drift.set(0,0);this.cameraTween?.progress(1);gsap.getTweensOf(this.exploded).forEach(t=>t.progress(1));this.setPortraitFrame.forEach(f=>f(0,0,0,0));}
    this.host.dataset.motion=enabled?'on':'off';
  }
  setFocus(detail:Detail){
    if(!this.ready){this.focus=detail;this.focusBlend.value=1;return;}
    this.host.dataset.cameraSettled='false';
    this.cameraTween?.kill();this.focusStart.copy(this.camera.position);this.targetStart.copy(this.target);this.focusBlend.value=0;
    this.focus=detail;this.orbit=0;this.host.dataset.focus=detail;
    this.speakingUntil=detail==='keeper'?this.elapsed+8:0;
    this.cameraTween=gsap.to(this.focusBlend,{value:1,duration:this.motion?1.35:0,ease:'power3.inOut',onComplete:()=>{this.cameraTween=null;}});
  }
  speakAgain(){this.speakingUntil=this.elapsed+8;this.nextBlink=this.elapsed+1.8;}
  setExploded(value:boolean){gsap.killTweensOf(this.exploded);gsap.to(this.exploded,{value:value?1:0,duration:this.motion?1.2:0,ease:'power2.inOut'});this.flat=value;}
  private applyEra(){this.past.visible=this.era==='past';this.present.visible=this.era==='present';this.keepers.forEach((m,i)=>m.visible=(this.era==='past'?i===0:i===1));this.host.dataset.era=this.era;this.onEra(this.era);}
  setEra(era:Era){
    if(this.era===era)return;this.era=era;if(!this.ready)return;this.transition?.kill();this.setFocus('welcome');
    const angle=era==='past'?0:Math.PI;
    this.host.dataset.turning='true';this.onTurning(true);
    // Ambient pause does not cancel this deliberate action. UI changes at the turn's midpoint.
    this.transition=gsap.timeline({defaults:{ease:'power2.inOut'},onComplete:()=>{this.applyEra();this.host.dataset.turning='false';this.onTurning(false);this.transition=null;}})
      .to(this.wallTravel,{value:1,duration:.55},.45)
      .to(this.canopies.map(c=>c.rotation),{x:-.95,duration:.65},.45)
      .to(this.panels.map(p=>p.rotation),{y:angle,duration:1.5,stagger:.18},1)
      .call(()=>this.applyEra(),[],1.75)
      .to(this.wallTravel,{value:0,duration:.65},3.1)
      .to(this.canopies.map(c=>c.rotation),{x:0,duration:.65},3.1);
  }
  private resize(){const b=this.host.getBoundingClientRect();this.size={w:b.width,h:b.height};if(!b.width||!b.height)return;this.renderer.setSize(b.width,b.height);this.camera.aspect=b.width/b.height;this.camera.updateProjectionMatrix();this.finish.resize(b.width,b.height);}

  private tick=(now:number)=>{
    if(this.disposed||this.lost||document.hidden)return;this.frame=requestAnimationFrame(this.tick);if(now-this.last<1000/30)return;
    const dt=Math.min((now-this.last)/1000,1);this.last=now;if(this.motion)this.elapsed+=dt;const t=this.elapsed;
    this.extension?.beforeFrame?.(dt);
    const aspect=this.size.w/this.size.h;const view=views[this.focus];const distance=viewDistance(this.focus,aspect,this.camera.fov);
    this.drift.lerp(this.motion?this.pointer:new T.Vector2(),.045);
    const yaw=view.yaw+this.orbit+this.drift.x*.025;
    const custom=this.extension?.view(this.focus,aspect,this.orbit+this.drift.x*.025);
    if(custom?.fov&&this.camera.fov!==custom.fov){this.camera.fov=custom.fov;this.camera.updateProjectionMatrix();}
    const destination=custom?.position??new T.Vector3(...view.target).add(new T.Vector3(Math.sin(yaw)*Math.cos(view.elevation)*distance,Math.sin(view.elevation)*distance+this.drift.y*.035,Math.cos(yaw)*Math.cos(view.elevation)*distance));
    if(custom?.direct){this.camera.position.copy(custom.position);this.target.copy(custom.target);}
    else{this.camera.position.lerpVectors(this.focusStart,destination,this.focusBlend.value);this.target.lerpVectors(this.targetStart,custom?.target??new T.Vector3(...view.target),this.focusBlend.value);}
    this.camera.lookAt(this.target);this.camera.updateMatrixWorld();
    if(this.ready){
      this.hanging.rotation.z=this.motion?Math.sin(t*.85)*.022:0;
      this.leaves.forEach((l,i)=>{l.rotation.z=this.motion?Math.sin(t*.65+i)*.035:0;});
      this.keepers.forEach((k,i)=>{k.scale.y=1+(this.motion?Math.sin(t*1.2+i)*.0025:0);k.rotation.z=this.motion?Math.sin(t*.47+i)*.003:0;});
      const talking=this.motion&&this.focus==='keeper'&&t<this.speakingUntil;
      let blink=0;
      if(this.motion&&t>=this.nextBlink){this.blinkUntil=t+.18;this.nextBlink=t+4.7;blink=1;}
      else if(this.motion&&t<this.blinkUntil)blink=T.MathUtils.smoothstep(this.blinkUntil-t,0,.12);
      const sequence=[0,2,3,1,3,4,2,0,0,3,1,4,3,2,0,0];
      const phase=t*7.5,step=Math.floor(phase),fraction=T.MathUtils.smoothstep(phase-step,0,.45);
      const from=talking?sequence[step%sequence.length]:0,to=talking?sequence[(step+1)%sequence.length]:0;
      this.setPortraitFrame.forEach(f=>f(from,to,fraction,blink));this.host.dataset.portraitFrame=String(from);this.host.dataset.blink=String(blink>0);this.host.dataset.speaking=String(talking);
      this.wall.position.z=-1.1-this.wallTravel.value*1.15;this.wall.position.y=2.9+this.wallTravel.value*.08;
      this.host.dataset.wallAngle=(this.panels[0].rotation.y*180/Math.PI).toFixed(1);
      this.host.dataset.wallAngles=this.panels.map(p=>(p.rotation.y*180/Math.PI).toFixed(1)).join(',');
      this.steam?.update(t,this.camera,!this.flat);this.host.dataset.steamTime=t.toFixed(2);
      this.layers.forEach(l=>l.object.position.z=l.z+this.exploded.value*l.offset);
      this.extension?.update(t,this.camera,this.panels[0].rotation.y/Math.PI,this.motion);
      this.anchors.forEach((v,id)=>{const b=this.markers.get(id);if(!b)return;const p=v.clone().project(this.camera);b.style.transform=`translate(${(p.x*.5+.5)*this.size.w}px,${(-p.y*.5+.5)*this.size.h}px) translate(-50%,-50%)`;b.hidden=this.flat||this.focus!=='welcome'||p.z<0||p.z>1||Math.abs(p.x)>1||Math.abs(p.y)>1;});
    }
    this.renderer.shadowMap.needsUpdate=true;this.renderer.info.autoReset=false;this.renderer.info.reset();this.finish.render();
    this.host.dataset.drawCalls=String(this.renderer.info.render.calls);this.host.dataset.triangles=String(this.renderer.info.render.triangles);this.host.dataset.layers=String(this.layers.length);this.host.dataset.status='ready';
    this.host.dataset.cameraDistance=this.camera.position.distanceTo(this.target).toFixed(3);
    this.host.dataset.cameraSettled=String(this.focusBlend.value===1);
    this.host.dataset.cameraTarget=this.target.toArray().map(v=>v.toFixed(2)).join(',');
    this.host.dataset.cameraPosition=this.camera.position.toArray().map(v=>v.toFixed(3)).join(',');
  };
  dispose(){this.disposed=true;cancelAnimationFrame(this.frame);this.resizeObserver.disconnect();this.transition?.kill();this.cameraTween?.kill();gsap.killTweensOf(this.exploded);document.removeEventListener('visibilitychange',this.onVisibility);
    this.host.removeEventListener('pointermove',this.move);this.host.removeEventListener('pointerdown',this.down);this.host.removeEventListener('pointerup',this.up);this.host.removeEventListener('pointercancel',this.up);this.host.removeEventListener('pointerleave',this.leave);
    this.renderer.domElement.removeEventListener('webglcontextlost',this.contextLost);this.renderer.domElement.removeEventListener('webglcontextrestored',this.contextRestored);
    this.extension?.dispose();this.scene.traverse(o=>{if(o instanceof T.DirectionalLight||o instanceof T.SpotLight||o instanceof T.PointLight)o.shadow?.dispose();});this.environment?.dispose();this.finish.dispose();this.workshop.dispose();this.renderer.dispose();this.renderer.forceContextLoss();this.renderer.domElement.remove();}
}
