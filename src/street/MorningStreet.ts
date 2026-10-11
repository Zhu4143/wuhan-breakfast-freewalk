import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import type {SceneExtension} from '../atelier/SceneExtension';
import {PaperWorkshop} from '../atelier/PaperWorkshop';
import {views,viewDistance} from '../atelier/camera';
import type {Detail} from '../atelier/content';
import {shopPlots,streetViews,type StreetView} from './layout';
import {bench,bicycle,marketCart,umbrella} from './StreetProps';
import {buildNeighborhood,upperRoomDetails,latticeWindow} from './Neighborhood';
import {StreetLifeDetails} from './StreetLifeDetails';
import {streetMoments,type StreetMoment} from './moments';
import {FirstPersonWalk} from './FirstPersonWalk';
import {MorningRays} from './MorningRays';
import {gsap} from 'gsap';
import type {TourStop} from './tourContent';
import {places,type PlaceId} from './exploreContent';
import {FoodStalls} from './FoodStalls';
import {DoupiShop} from './DoupiShop';
import {BreakfastKitchen} from './BreakfastKitchen';
import {breakfastShops} from './breakfastShops';
import type {ShopModule} from './ShopModule';
import {addStreetPatina} from './StreetPatina';
import {FreeWalk,type PreviewWalkPose} from './FreeWalk';
import {AgedPaving} from './AgedPaving';
import {StreetEras} from './StreetEras';
import {bodySegmentClear,type WalkObstacle} from './walkNavigation';
import {MarketAtmosphere} from './MarketAtmosphere';
import {clampMorning,openShopCount,pedestrianPresence,morningTime} from './marketTime';
import type {MarketSoundscape} from './MarketSoundscape';
import {BicyclePass} from './BicyclePass';
import {pedestrianProfiles} from './pedestrianProfiles';
import {photoBoardAnchor} from './photoZines';
import {dominoDuration,eraShopOrder,shopEraFrame,nearestEraShop} from './eraDomino';

const V=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
type Pedestrian={group:T.Group;print:T.Mesh;prints:T.Mesh[];materials:T.Material[];presence:number;start:T.Vector3;end:T.Vector3;phase:number;speed:number;moving:boolean;radius:number;time:number;};

export class MorningStreet implements SceneExtension{
  readonly illustrated=true;
  readonly eraSequence={duration:dominoDuration,frame:(progress:number)=>shopEraFrame('noodle',progress)};
  readonly scenery=new T.Group();readonly planning=new T.Group();readonly sockets=new Map<string,T.Group>();
  private disposed=false;private shop!:T.Group;private scene!:T.Scene;private sun!:T.DirectionalLight;
  private sky:T.Mesh|null=null;private sunDisc:T.Mesh|null=null;private sunGlow:T.Mesh|null=null;
  private people:Pedestrian[]=[];private branches:T.Group[]=[];private laundry:T.Group[]=[];
  private marker:HTMLButtonElement|null=null;private viewId:StreetView='entry';private dawn=.36;
  private dust:T.Points|null=null;private selectedPlot:string|null=null;
  private activeDetail:Detail="welcome";
  private shopOverview=false;private birds:T.Group[]=[];private trees:T.Group[]=[];
  private cutawayWalls:{group:T.Group;socket:T.Group;side:number}[]=[];
  private life:StreetLifeDetails|null=null;private moment:StreetMoment|null=null;
  private walk:FirstPersonWalk|null=null;private rays:MorningRays|null=null;
  private dawnTween:gsap.core.Tween|null=null;
  private walkMap=false;private explorerMarkers=new Map<PlaceId,HTMLButtonElement>();
  private photoBoardMarker:HTMLButtonElement|null=null;
  private foodStalls:FoodStalls|null=null;
  private shops=new Map<string,ShopModule>();
  private free:FreeWalk|null=null;private paving:AgedPaving|null=null;private eras:StreetEras|null=null;private markerEnabled=false;
  private walkProps:WalkObstacle[]=[];private pedestrianTime=0;
  private morning:MarketAtmosphere|null=null;private morningTarget=0;private renderer!:T.WebGLRenderer;private eraProgress=0;private frameDt=0;
  private soundscape:MarketSoundscape|null=null;private bicyclePass:BicyclePass|null=null;private experienceActive=false;
  attachSoundscape(sound:MarketSoundscape){this.soundscape=sound;}
  setExperienceActive(active:boolean){this.experienceActive=active;this.soundscape?.setActive(active);}
  get ownsPointer(){return !!this.free;}
  enableFreeRoam(onManual:()=>void){this.free=new FreeWalk(this.host,v=>this.onTravel?.(v),onManual,()=>this.navigationObstacles());this.dawn=0;this.host.dataset.walkMode='first-person';}
  private navigationObstacles():WalkObstacle[]{const bike=this.bicyclePass?.obstacle;return [...this.walkProps,...this.people.filter(p=>p.group.visible).map(p=>({id:p.group.name,x:p.group.position.x,z:p.group.position.z,radius:p.radius})),...(bike?[bike]:[])];}
  private blockWalkProp(object:T.Object3D,id:string){
    object.updateWorldMatrix(true,true);const box=new T.Box3().setFromObject(object),center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3());
    this.walkProps.push({id,x:center.x,z:center.z,radius:Math.hypot(size.x,size.z)/2});
  }
  enableControls(enabled:boolean,blocked=false){this.markerEnabled=enabled&&!blocked;this.free?.setEnabled(enabled,blocked);}
  joystick(x:number,y:number){this.free?.joystick(x,y);}
  zoom(delta:number){this.free?.zoom(delta);}
  cancelWalk(){this.free?.cancel();}
  setPreviewFollower(value:boolean){this.free?.setPreviewFollower(value);}
  get previewPose(){return this.free?.previewPose??null;}
  applyPreviewPose(value:PreviewWalkPose){this.free?.applyPreviewPose(value);}
  beforeFrame(dt:number){this.frameDt=Math.min(Math.max(dt,0),1);if(this.morning)this.dawn=T.MathUtils.damp(this.dawn,this.morningTarget,4,this.frameDt);this.free?.update(dt);}
  setMarketTime(progress:number){this.morningTarget=clampMorning(progress);}
  constructor(private host:HTMLDivElement,private onTravel?:(moving:boolean)=>void){if(onTravel)this.walk=new FirstPersonWalk(onTravel);}
  walkTo(index:number,animate:boolean,custom?:TourStop){if(this.free&&custom)this.free.go(custom);else this.walk?.go(index,animate,custom);}
  setWalkMap(value:boolean){this.walkMap=value;this.host.dataset.walkMode=this.free?'first-person':value?'map':'first-person';}
  setExplorerMarkers(markers:Map<PlaceId,HTMLButtonElement>){this.explorerMarkers=markers;}
  setPhotoBoardMarker(marker:HTMLButtonElement|null){this.photoBoardMarker=marker;}
  speakAtShop(id:PlaceId){this.shops.get(id)?.speak();}
  finishWalk(){this.walk?.finish();this.dawnTween?.progress(1);}
  configure(scene:T.Scene,renderer:T.WebGLRenderer,camera:T.PerspectiveCamera,shop:T.Group){
    this.scene=scene;this.shop=shop;this.renderer=renderer;
    scene.fog=new T.FogExp2('#d6e6df',.003);camera.fov=39;camera.far=260;camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio,matchMedia('(pointer:coarse)').matches?1.25:1.75));renderer.toneMappingExposure=.94;
    scene.children.forEach(o=>{
      if(o instanceof T.HemisphereLight){o.color.set('#e4eeea');o.groundColor.set('#d2bfa0');o.intensity=.88;}
      if(o instanceof T.DirectionalLight&&o.castShadow){this.sun=o;o.position.set(18,19,-58);o.target.position.set(0,0,-6);scene.add(o.target);o.color.set('#ffd18f');o.intensity=3.2;const shadowSize=matchMedia('(pointer: coarse), (max-width: 700px)').matches?2048:4096;o.shadow.mapSize.set(shadowSize,shadowSize);Object.assign(o.shadow.camera,{left:-27,right:27,top:28,bottom:-28,near:1,far:130});o.shadow.camera.updateProjectionMatrix();o.shadow.normalBias=.025;o.shadow.bias=-.00004;}
      else if(o instanceof T.DirectionalLight){o.position.set(-12,13,14);o.intensity=.60;o.color.set('#e4e8da');}
    });
    const plot=shopPlots[0];shop.position.set(plot.x,.10,plot.z);shop.rotation.y=plot.rotation;shop.updateMatrixWorld();
    this.scenery.name='morning-street-environment';this.planning.name='shop-development-boundaries';this.planning.visible=false;
    scene.add(this.scenery,this.planning);
  }
  async build(w:PaperWorkshop){
    const base=import.meta.env.BASE_URL+'assets/storybook/';
    // Start independent image batches together; geometry and era behavior are unchanged.
    const bikeImage=this.free?w.image(base+'bicycle-passing-v12.webp'):null;
    const stallImages=this.explorerMarkers.size?Promise.all(['doupi-wall-past-v8.webp','doupi-wall-present-v8.webp','doupi-keeper-v8.webp','doupi-keeper-present-v8.webp','mianwo-interior-v7.png','mianwo-present-v9.png'].map(n=>w.image(base+n))):null;
    const kitchenImages=this.explorerMarkers.size?Promise.all([
      Promise.all(breakfastShops.map(s=>Promise.all(['past','present'].map(era=>w.image(base+s.id+'-keeper-'+era+'-v11.webp'))))),
      Promise.all(breakfastShops.map(s=>Promise.all(['past','present'].map(era=>w.image(base+s.id+'-wall-'+era+'-v11-1.webp'))))),
    ]):null;
    // Observe every speculative batch immediately, including failure or unmount during another batch.
    const pendingImages=Promise.all([bikeImage,stallImages,kitchenImages]);void pendingImages.catch(()=>{});
    const names=['dawn-panorama','residential-ochre','residential-indigo','plane-tree','courtyard-row','vine-cluster'];
    const [images,portraits]=await Promise.all([
      Promise.all(names.map(n=>w.image(base+n+'.webp'))),
      Promise.all(pedestrianProfiles.map(p=>Promise.all([w.image(base+p.past),w.image(base+p.present)]))),
    ]);if(this.disposed)return;
    const [sky,ochre,indigo,tree,row,vine]=images;
    this.ground(w);this.architecture(w,ochre,indigo);this.streetLife(w,portraits);this.atmosphere(w,sky);
    const [image,stalls,kitchens]=await pendingImages;if(this.disposed)return;
    if(image)this.bicyclePass=new BicyclePass(w,this.scenery,image);
    if(stalls&&kitchens){
      const [past,present,keeper,keeperToday,mianwo,mianwoToday]=stalls;
      if(this.disposed)return;
      const doupi=new DoupiShop(w,{past,present,keeper,keeperToday},this.host);
      doupi.mount(this.sockets.get('doupi')!);this.shops.set(doupi.id,doupi);
      this.foodStalls=new FoodStalls(w,this.sockets,[mianwo,mianwoToday],this.host);
      const [portraits,walls]=kitchens;
      if(this.disposed)return;
      breakfastShops.forEach((spec,i)=>{const kitchen=new BreakfastKitchen(w,spec,portraits[i],{past:walls[i][0],present:walls[i][1]},this.host);kitchen.mount(this.sockets.get(spec.id)!);this.shops.set(spec.id,kitchen);});
    }
    addStreetPatina(w,this.scenery,this.sockets);
    this.sockets.forEach((socket,id)=>upperRoomDetails(w,socket,shopPlots.findIndex(p=>p.id===id),vine));
    const neighborhood=buildNeighborhood(w,this.scenery,tree,row);this.trees=neighborhood.sway;this.birds=neighborhood.birds;
    this.life=new StreetLifeDetails(w,this.scenery);this.life.balconies(this.sockets);this.life.batch();
    this.rays=new MorningRays(w,this.scenery);
    const menu=new T.Group();menu.position.set(-4.7,0,-10.8);menu.rotation.y=Math.PI/2;this.scenery.add(menu);
    w.box(menu,[2.6,2.8,.10],[0,2.22,0],'#809e8c','wood');w.sign(menu,'一 街 百 味',2.4,.60,[0,3.19,.065],'#eee0be','#657c66');
    w.sign(menu,'热干面 · 三鲜豆皮\n面窝 · 鲜鱼糊汤粉\n烧梅 · 鲜肉汤包',1.96,1.43,[0,2.14,.072],'#eee0be','#826d50');
    w.sign(menu,'过早小札 · 慢慢认识',2.20,.23,[0,1.19,.07],'#eee0be','#657c66');
    for(const x of [-1.15,1.15])w.box(menu,[.09,3.64,.12],[x,1.83,-.08],'#997959','wood');
    // A cutaway wall must keep its identity, but its window lattice and flowerpots can
    // share draws inside that wall. Do this before the whole street's static batch.
    this.eras=new StreetEras(w,this.scenery,this.sockets);
    this.paving=new AgedPaving(w,this.scenery);
    if(this.free)this.morning=new MarketAtmosphere(this.scene,this.sun,this.renderer,this.sky!,this.sunDisc!,this.sunGlow!,w,this.sockets);
    this.cutawayWalls.forEach(({group})=>{w.batchStatic(group);w.batchScenery(group);});
    this.people.forEach(p=>p.group.userData.animationRoot=true);
    [...this.branches,...this.laundry].forEach(g=>g.userData.animationRoot=true);
    w.batchStatic(this.scenery);w.batchScenery(this.scenery);w.inkContours(this.scenery);this.setDawn(this.dawn);
    this.host.dataset.reservedPlots=String(this.explorerMarkers.size?0:shopPlots.filter(p=>p.status==='reserved').length);
    this.host.dataset.streetPeople=String(this.people.length);this.host.dataset.streetView=this.viewId;
    this.host.dataset.streetAssets=String(images.length);
    this.host.dataset.foodCounters=this.foodStalls?'6':'1';this.host.dataset.pavingWear='380';this.host.dataset.eraBuildings='6';this.host.dataset.pedestrianHeight='3.15';this.host.dataset.pavingDetail='stone-grain-cracks-moss-repairs';
  }
  private ground(w:PaperWorkshop){
    const g=this.scenery;
    w.box(g,[145,.18,145],[0,-.20,-10],'#c3cdb4','stone');
    w.box(g,[10.2,.10,60],[0,-.055,-4],'#676f6a','stone');
    const geo=new RoundedBoxGeometry(.95,.075,.88,1,.018);w.geometries.add(geo);
    const tiles=new T.InstancedMesh(geo,w.material('#bdc0ae','stone'),620),matrix=new T.Matrix4(),q=new T.Quaternion();
    for(let row=0;row<62;row++)for(let col=0;col<10;col++){
      const i=row*10+col;q.setFromAxisAngle(V(0,1,0),Math.sin(i*17)*.009);
      matrix.compose(V(-4.5+col+(row%2)*.12,.004+Math.sin(i*11)*.006,22-row*.93),q,V(1,1,1));tiles.setMatrixAt(i,matrix);
      const variant=Math.floor((Math.sin(i*12.73)*43758.2%1+1)%1*5);
      tiles.setColorAt(i,new T.Color(['#c6d0c2','#aebfba','#c7cbba','#d3d4bf','#bac9c3'][variant]));
    }
    tiles.receiveShadow=true;tiles.castShadow=false;tiles.name='620-individual-paving-stones';g.add(tiles);
    for(const side of [-1,1]){
      w.box(g,[5.45,.20,55],[side*7.78,.015,-4.5],'#a6a99c','stone');
      for(let row=0;row<45;row++)w.box(g,[.25,.20,1.18],[side*5.12,.10,19-row*1.22],row%4?'#9d9e8e':'#b8b4a0','stone');
      w.box(g,[.19,.016,55],[side*4.94,-.005,-4.5],'#4d5954');
      for(const z of [11,-.5,-12,-23]){
        w.box(g,[.27,.015,.8],[side*4.89,.014,z],'#5b6259','metal');
        for(let i=0;i<7;i++)w.box(g,[.23,.022,.024],[side*4.89,.023,z-.32+i*.105],'#b1ae97','metal');
      }
    }
    // A few damp patches catch dawn light without turning the lane into a mirror.
    const puddle=w.ownMaterial(new T.MeshPhysicalMaterial({color:'#9eaa9c',roughness:.19,metalness:.32,clearcoat:1,transparent:true,opacity:.39,depthWrite:false}));
    for(const [x,z,s] of [[-2.8,13,1.2],[3.4,5,.8],[-3.1,-7,1.1],[1.5,-19,.8]]){const p=w.mesh(g,new T.CircleGeometry(s,18),puddle,[x,.051,z]);p.rotation.x=-Math.PI/2;p.scale.y=.33;p.castShadow=false;p.userData.noAO=true;}
    // Cross lane at the far end and threshold at the entrance stay clear of all shop volumes.
    w.box(g,[28,.035,5],[0,.01,-29],'#acae9e','stone');
    for(let i=0;i<20;i++)w.box(g,[1.1,.03,.32],[-11+i*1.14,.04,-27],'#c1bba4','stone');
  }
  private architecture(w:PaperWorkshop,ochre:HTMLImageElement,indigo:HTMLImageElement){
    for(const [index,plot] of shopPlots.entries()){
      const socket=new T.Group();socket.name='shop-socket-'+plot.id;socket.position.set(plot.x,.10,plot.z);socket.rotation.y=plot.rotation;this.scenery.add(socket);this.sockets.set(plot.id,socket);
      const shell=new T.Group();shell.name='residential-shell-'+plot.id;socket.add(shell);
      const height=5.8+(index%3)*.24,width=9.4;
      w.box(shell,[width,height,.16],[0,6.22+height/2,-4.7],index%2?'#a6c4bf':'#e0b990','stone');
      const face=w.print(shell,index%2?indigo:ochre,width,height,[0,6.22+height/2,-4.60]);face.castShadow=false;
      const rear=w.print(shell,indigo,width,height,[0,6.22+height/2,-4.79]);rear.rotation.y=Math.PI;rear.castShadow=false;
      for(const side of [-1,1]){
        const wall=new T.Group();wall.userData.animationRoot=true;shell.add(wall);this.cutawayWalls.push({group:wall,socket,side});
        w.box(wall,[.14,height,4.6],[side*4.68,6.22+height/2,-2.4],index%2?'#a6c4bf':'#e0b990','stone');
        const flank=w.print(wall,indigo,4.6,height,[side*4.76,6.22+height/2,-2.4]);flank.rotation.y=side*Math.PI/2;flank.castShadow=false;
        for(const z of [-3.2,-.85])latticeWindow(w,wall,side*4.595,9.1,z,-side*Math.PI/2);
      }
      const lowerRear=w.print(shell,indigo,9.4,6,[0,3,-2.83]);lowerRear.rotation.y=Math.PI;lowerRear.castShadow=false;
      w.box(shell,[width+.3,.20,5.8],[0,6.22,-2.05],'#b58a65','wood');
      for(let j=0;j<15;j++)w.box(shell,[width,.018,.019],[0,6.33,.65-j*.37],'#846149','wood');
      for(const y of [6.52,7.38])w.box(shell,[width,.10,.10],[0,y,.80],'#946149','wood');
      for(let i=0;i<20;i++)w.box(shell,[.062,.84,.062],[-4.4+i*.46,6.96,.80],'#a67651','wood');
      for(const xx of [-4.5,4.5])w.box(shell,[.15,height+.06,.15],[xx,6.3+height/2,.79],'#ae7955','wood');
      // Open room: physical furniture sits in front of the illustrated rear wall.
      for(const xx of [-2.35,2.35]){
        const table=new T.Group();table.position.set(xx,6.34,-1.65);shell.add(table);
        w.box(table,[2.2,.09,1.4],[0,1.0,0],'#c18b63','wood');
        for(const a of [-.87,.87])for(const b of [-.5,.5])w.box(table,[.075,.95,.075],[a,.5,b],'#946449','wood');
        for(const a of [-.55,.55]){w.cylinder(table,.24,.06,[a,1.09,0],'#acc9cb',24,'ceramic');w.cylinder(table,.12,.14,[a,1.18,0],'#f0dfbe',24,'ceramic');w.box(table,[.5,.016,.026],[a,1.13,.31],'#714f3c','wood');}
        for(const zz of [-1.12,1.10]){w.box(table,[1.45,.07,.40],[0,.56,zz],'#a26950','wood');for(const a of [-.55,.55])w.box(table,[.08,.55,.10],[a,.28,zz],'#956446','wood');}
      }
      for(const xx of [-2.3,2.3]){w.cylinder(shell,.014,1.08,[xx,6.22+height-.51,-1.75],'#715e4a');const lamp=w.mesh(shell,new T.ConeGeometry(.37,.23,16,1,true),w.material('#91b4bc'),[xx,6.22+height-1.13,-1.75]);(lamp.material as T.Material).side=T.DoubleSide;}
      for(const x of [-4.55,4.55])w.box(shell,[.14,height,.23],[x,6.22+height/2,-4.52],'#a97c55','wood');
      for(const side of [-1,1]){
        const roof=new T.Group();roof.position.set(0,6.45+height,-3.25+side*.85);roof.rotation.x=side*.27;shell.add(roof);
        w.box(roof,[width+.55,.12,1.85],[0,0,0],'#6e8282');
        for(let row=0;row<2;row++)for(let c=0;c<28;c++){
          const tile=w.mesh(roof,new T.CylinderGeometry(.175,.17,1.02,7,1,true,Math.PI/2,Math.PI),w.material((c+row)%3?'#809590':'#9ba29a','stone'),[-4.73+c*.35,.13,.45-row*.94]);(tile.material as T.Material).side=T.DoubleSide;tile.rotation.x=Math.PI/2;
        }
      }
      const ridge=w.cylinder(shell,.18,width+.5,[0,6.78+height,-3.25],'#627b79',12);ridge.rotation.z=Math.PI/2;
      const downpipe=w.cylinder(shell,.048,12.3,[4.35,6.2,-.05],'#879a94',10,'metal');downpipe.name='rainwater-downpipe';
      for(const yy of [1,4.2,7.1])w.box(shell,[.14,.065,.16],[4.35,yy,-1.1],'#514f42','metal');
      // Side walls and back wall belong to the permanent streetscape, outside the reserved build volume.
      for(const side of [-1,1]){
        w.box(shell,[.18,1.48,4.8],[side*4.83,.76,-.2],index%2?'#a6b8ae':'#c3b49a','stone');
        w.box(shell,[.24,.09,4.9],[side*4.83,1.54,-.2],'#8a9e96','stone');
        for(let row=0;row<4;row++)for(let j=0;j<7;j++)w.box(shell,[.184,.012,.58],[side*4.83,.23+row*.31,-2.15+j*.66+(row%2)*.15],'#8a998e');
      }
      w.box(shell,[9.4,6,.14],[0,3,-2.75],'#817e6b','stone');
      if(plot.status==='reserved'){
        const closure=new T.Group();closure.name='removable-closure-'+plot.id;closure.userData.animationRoot=true;socket.add(closure);
        for(let i=0;i<16;i++)w.box(closure,[.55,4.6,.12],[-4.26+i*.57,2.45,.18],index%2?(i%3?'#5b7168':'#728177'):(i%3?'#755a41':'#886e51'),'wood');
        for(const yy of [.52,4.43])w.box(closure,[9.2,.17,.12],[0,yy,.29],'#514c3d','wood');
        w.box(closure,[9.36,.32,.58],[0,5.24,.17],'#625c48','wood');
        w.sign(closure,'街 坊 人 家',2.4,.49,[0,4.78,.28],'#b99a6d','#514a38');
        for(const xx of [-.18,.18]){const handle=w.mesh(closure,new T.TorusGeometry(.09,.016,6,15),w.material('#5f6256','metal'),[xx,2.25,.28]);handle.name='door-ring';}
        const blind=new T.Group();blind.position.set(1.65,4.22,.34);closure.add(blind);this.laundry.push(blind);
        for(let i=0;i<32;i++)w.box(blind,[2.18,.038,.023],[0,-i*.042,0],i%3?'#b39a6a':'#897751','wood');
        for(const xx of [-.85,.85])w.box(blind,[.015,1.4,.024],[xx,-.65,.017],'#735e40');
        w.box(closure,[9.3,.13,.53],[0,.08,.43],'#918f7b','stone');
      }
      const boundary=new T.Group();boundary.position.copy(socket.position);boundary.rotation.copy(socket.rotation);this.planning.add(boundary);
      const fill=w.mesh(boundary,new T.BoxGeometry(plot.width,.07,plot.depth),w.ownMaterial(new T.MeshBasicMaterial({color:plot.status==='open'?'#bf6b3b':'#4c8b82',transparent:true,opacity:.6,depthTest:false,depthWrite:false})),[0,.30,0]);fill.renderOrder=20;fill.castShadow=false;fill.receiveShadow=false;fill.userData.noAO=true;
      const outlineGeo=new T.EdgesGeometry(new T.BoxGeometry(plot.width,plot.height,plot.depth));w.geometries.add(outlineGeo);
      const outline=new T.LineSegments(outlineGeo,w.ownMaterial(new T.LineBasicMaterial({color:'#f9ddb0',transparent:true,opacity:.8,depthTest:false})));outline.position.y=plot.height/2;outline.renderOrder=21;boundary.add(outline);
    }
    // Power wires, wash lines and street lamps connect the separate buildings into a neighborhood.
    for(const z of [14,-.5,-11.5,-29]){
      const poleX=z===14?5.5:-5.55;
      w.cylinder(this.scenery,.10,10.1,[poleX,5,z],'#727668',10);w.box(this.scenery,[1.6,.11,.11],[poleX,9.55,z],'#565b50','wood');
      for(const off of [-.55,.55]){w.cylinder(this.scenery,.085,.14,[poleX+off,9.69,z],'#b7c0aa',10,'ceramic');}
      w.line(this.scenery,[V(poleX,8.1,z),V(poleX*.84,8.13,z),V(poleX*.78,7.8,z)],'#55675f',.035);
      const shade=w.mesh(this.scenery,new T.ConeGeometry(.32,.15,14,1,true),w.material('#456359','metal'),[poleX*.78,7.72,z]);(shade.material as T.Material).side=T.DoubleSide;
      w.mesh(this.scenery,new T.SphereGeometry(.075,8,6),w.ownMaterial(new T.MeshStandardMaterial({color:'#ffdfa0',emissive:'#ffb958',emissiveIntensity:1.4})),[poleX*.78,7.64,z]);
    }
    for(let j=0;j<3;j++)w.line(this.scenery,[V(5.0+j*.32,9.6,14),V(-.5,8.15,7),V(-5.9+j*.33,9.5,-.5),V(-5.85+j*.33,8.5,-6),V(-5.9+j*.33,9.5,-11.5),V(-5.9+j*.33,8.5,-20.25),V(-5.9+j*.33,9.5,-29)],'#4c554d',.009);
    w.line(this.scenery,[V(-8.8,7,-6),V(-.2,6,-7),V(8.8,7,-8)],'#625b47',.013);
    for(let i=0;i<5;i++){
      const cloth=new T.Group();cloth.position.set(-3.5+i*1.7,6.2+Math.abs(i-2)*.18,-6.7);this.scenery.add(cloth);this.laundry.push(cloth);
      if(i===1||i===3){w.shape(cloth,[[-.16,0],[-.36,-.08],[-.53,-.34],[-.32,-.43],[-.23,-.29],[-.23,-.96],[.23,-.96],[.23,-.29],[.32,-.43],[.53,-.34],[.36,-.08],[.16,0],[.10,-.12],[-.10,-.12]],[0,0,0],i===1?'#c9adb0':'#94b4b3',.018);}
      else {w.box(cloth,[.75,1.06,.025],[0,-.53,0],['#d1c9a8','#bdad87','#afc5c5','#9f7357','#e0d6b3'][i],'cloth');for(let stripe=0;stripe<3;stripe++)w.box(cloth,[.74,.018,.029],[0,-.83-stripe*.05,0],'#8b9d98');}
      for(const xx of [-.28,.28])w.box(cloth,[.035,.12,.055],[xx,0,.025],'#896c42','wood');
    }
    w.sign(this.scenery,'巷 口 早 市',2.8,.68,[-4.2,3.6,17.2],'#31534f','#e9d9b5','清 晨 过 早　·　慢 慢 逛');
    for(const x of [-5.35,-3.05])this.blockWalkProp(w.box(this.scenery,[.12,3.9,.13],[x,1.93,17.16],'#746046','wood'),'street-entry-post-'+x);
  }
  private streetLife(w:PaperWorkshop,portraits:HTMLImageElement[][]){
    const g=this.scenery;marketCart(w,g,-6.3,13);umbrella(w,g,-6.3,12.5,'#a96848');
    this.blockWalkProp(bench(w,g,-6.0,-27.5,.25),'west-bench');this.blockWalkProp(bench(w,g,3.2,-29,-.3),'east-bench');
    umbrella(w,g,6.2,-25.2,'#6e8272');
    for(const [x,z] of [[-5.8,10.1],[6.1,8],[-5.7,-1],[5.8,-4.4],[-5.8,-22],[5.9,-27.3]]){
      const plant=new T.Group();plant.position.set(x,.15,z);g.add(plant);
      w.mesh(plant,new T.LatheGeometry([[.20,0],[.30,.43],[.32,.46],[.29,.46]].map(([a,b])=>new T.Vector2(a,b)),20),w.material('#916e4e','ceramic'));
      for(let j=0;j<7;j++){const leaf=w.shape(plant,[[0,0],[-.13,.25],[-.09,.55],[.05,.7],[.15,.43],[.10,.15]],[0,.3,0],j%2?'#7b895a':'#516f55',.009);leaf.rotation.set(.15,j*.88,Math.sin(j)*.5);}
    }
    const routes=[
      {image:0,a:[-2.8,0,13],b:[-2.8,0,-24],phase:.08,speed:.33,moving:true},
      {image:2,a:[2.5,0,-25],b:[2.5,0,16],phase:.31,speed:.27,moving:true},
      {image:3,a:[-.6,0,-9],b:[-.6,0,-31],phase:.5,speed:.23,moving:true},
      {image:4,a:[3.6,0,-29],b:[3.6,0,-13],phase:.6,speed:.20,moving:true},
      {image:5,a:[3.4,0,10.8],b:[3.4,0,10.8],phase:.1,speed:0,moving:false},
      {image:6,a:[4.1,0,12.1],b:[4.1,0,12.1],phase:.6,speed:0,moving:false},
      {image:7,a:[-7.9,0,12.8],b:[-7.9,0,12.8],phase:0,speed:0,moving:false},
      {image:1,a:[1.8,0,-24],b:[1.8,0,-24],phase:1.2,speed:0,moving:false},
      {image:6,a:[-3.3,0,-17],b:[-3.3,0,-17],phase:1.8,speed:0,moving:false},
      {image:4,a:[3.3,0,18],b:[3.3,0,-21],phase:.39,speed:.24,moving:true},
      {image:5,a:[-3.2,0,-29],b:[-3.2,0,15],phase:.17,speed:.31,moving:true},
      {image:2,a:[1.7,0,17],b:[1.7,0,-19],phase:.57,speed:.23,moving:true},
      {image:0,a:[-1.8,0,-31],b:[-1.8,0,16],phase:.74,speed:.28,moving:true},
      {image:3,a:[3.1,0,-10],b:[3.1,0,19],phase:.69,speed:.26,moving:true},
      // Standing customers stay on the pavement, with room for both era silhouettes.
      {image:1,a:[4.1,0,6.8],b:[4.1,0,6.8],phase:.4,speed:0,moving:false},
      {image:2,a:[-4.1,0,-4.2],b:[-4.1,0,-4.2],phase:.2,speed:0,moving:false},
      {image:7,a:[4.1,0,-23],b:[4.1,0,-23],phase:.6,speed:0,moving:false},
      {image:4,a:[1.1,0,-28],b:[1.1,0,-28],phase:.8,speed:0,moving:false},
    ];
    for(const route of routes){
      const person=new T.Group();person.name='pedestrian-'+this.people.length;person.userData.animationRoot=true;g.add(person);
      const profile=pedestrianProfiles[route.image];
      const height=profile.height*(1+(this.people.length%4-1.5)*.027),prints:T.Mesh[]=[];
      person.userData.pedestrianStyle=profile.id;person.userData.height=height;
      for(let era=0;era<2;era++){
        const image=portraits[route.image][era];
        const paper=w.print(person,image,height*image.width/image.height,height,[0,0,0],true);paper.geometry.computeBoundingBox();
        const box=paper.geometry.boundingBox!,scale=height/(box.max.y-box.min.y);paper.scale.setScalar(scale);paper.position.y=.06-box.min.y*scale;
        paper.name='pedestrian-'+(era?'present':'past');prints.push(paper);
      }
      const start=new T.Vector3(...route.a),end=new T.Vector3(...route.b);
      // Both era silhouettes must fit even while the paper turns to face the viewer.
      const radius=Math.max(...prints.map(p=>Math.max(Math.abs(p.geometry.boundingBox!.min.x*p.scale.x),Math.abs(p.geometry.boundingBox!.max.x*p.scale.x))));
      person.position.lerpVectors(start,end,route.moving?route.phase:0);
      // Reserve distinct initial standing spaces, including people who arrive later.
      // This keeps the two neighbors at the entrance and intersecting walking lanes from starting overlapped.
      const occupied=this.people.map(p=>({id:p.group.name,x:p.group.position.x,z:p.group.position.z,radius:p.radius+.08}));
      const initial=person.position.clone();let phase=route.phase;
      for(const offset of [0,.8,-.8,1.6,-1.6,2.4,-2.4,3.2,-3.2,4,-4,4.8,-4.8]){
        const candidate=initial.clone();candidate.z=T.MathUtils.clamp(initial.z+offset,-31,18);
        if(bodySegmentClear(candidate,candidate,occupied,radius)){
          person.position.copy(candidate);
          if(route.moving)phase=(candidate.z-start.z)/(end.z-start.z);
          else{start.copy(candidate);end.copy(candidate);}
          break;
        }
      }
      // The edge material is shared by printed scenery, so give fading people their own copies.
      const materials:T.Material[]=[];
      for(const print of prints){const source=Array.isArray(print.material)?print.material:[print.material];print.material=source.map(m=>{const copy=w.ownMaterial(m.clone());copy.transparent=true;materials.push(copy);return copy;});}
      const presence=this.free?pedestrianPresence(this.people.length,0):1;person.visible=presence>0;materials.forEach(m=>m.opacity=presence);
      this.people.push({group:person,print:prints[0],prints,materials,presence,start,end,phase,speed:route.speed,moving:route.moving,radius,time:0});
    }
  }
  private atmosphere(w:PaperWorkshop,image:HTMLImageElement){
    const texture=w.ownTexture(new T.Texture(image));texture.needsUpdate=true;texture.wrapS=T.RepeatWrapping;
    const skyMat=w.ownMaterial(new T.MeshBasicMaterial({map:texture,side:T.BackSide,fog:false,depthWrite:false}));
    // Fade the panorama's varying top edge to one clear-sky color before the cap.
    // This keeps the horizon while avoiding a circular seam or radial texture streaks overhead.
    skyMat.onBeforeCompile=shader=>{
      shader.vertexShader='varying float skyHeight;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nskyHeight=position.y;');
      shader.fragmentShader='varying float skyHeight;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
        diffuseColor.rgb=mix(diffuseColor.rgb,diffuse*texture2D(map,vec2(.5,1.)).rgb,smoothstep(-25.,20.,skyHeight));`);
    };
    skyMat.customProgramCacheKey=()=> 'closed-morning-sky-v1';
    // Keep the illustrated horizon at its original height. Extend only the clear
    // upper sky, with both caps closed so looking straight up never exposes the page.
    const skyGeometry=new T.CylinderGeometry(82,82,210,96,8,false);
    const skyPositions=skyGeometry.getAttribute('position'),skyUV=skyGeometry.getAttribute('uv');
    for(let i=0;i<skyUV.count;i++)skyUV.setY(i,T.MathUtils.clamp((skyPositions.getY(i)+75)/50,0,1));
    this.sky=w.mesh(this.scenery,skyGeometry,skyMat,[0,75,-8]);this.sky.rotation.y=Math.PI;this.sky.castShadow=false;this.sky.receiveShadow=false;this.sky.userData.noAO=true;this.sky.renderOrder=-100;
    const env=w.ownTexture(new T.Texture(image));env.mapping=T.EquirectangularReflectionMapping;env.needsUpdate=true;this.scene.environment=env;this.scene.environmentIntensity=.24;
    this.sunDisc=w.mesh(this.scenery,new T.CircleGeometry(1.48,48),w.ownMaterial(new T.MeshBasicMaterial({color:'#fff4ce',fog:false})),[18,19,-58]);this.sunDisc.castShadow=false;this.sunDisc.receiveShadow=false;this.sunDisc.userData.noAO=true;
    const glow=w.ownMaterial(new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{strength:{value:.24}},vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 v;uniform float strength;void main(){float r=length(v-.5)*2.;float a=pow(max(0.,1.-r),3.)*strength;gl_FragColor=vec4(1.,.67,.29,a);}'}));
    this.sunGlow=w.mesh(this.scenery,new T.PlaneGeometry(19,19),glow,[18,19,-57.8]);this.sunGlow.castShadow=false;this.sunGlow.receiveShadow=false;this.sunGlow.userData.noAO=true;
    const geo=new T.BufferGeometry();const p=new Float32Array(72*3);for(let i=0;i<72;i++){p[i*3]=Math.sin(i*12.77)*4.4;p[i*3+1]=.5+(i%17)*.29;p[i*3+2]=16-(i%31)*1.3;}geo.setAttribute('position',new T.BufferAttribute(p,3));w.geometries.add(geo);
    const mat=w.ownMaterial(new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0}},vertexShader:'uniform float time;void main(){vec3 p=position;p.x+=sin(time*.13+position.z)*.18;p.y+=sin(time*.2+position.x)*.12;vec4 v=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*v;gl_PointSize=clamp(17./-v.z,1.,2.5);}',fragmentShader:'void main(){float a=1.-smoothstep(.1,.5,length(gl_PointCoord-.5));gl_FragColor=vec4(1.,.87,.61,a*.36);}'}));this.dust=new T.Points(geo,mat);this.scenery.add(this.dust);
  }
  setView(id:StreetView){this.viewId=id;this.moment=null;this.host.dataset.streetMoment='';this.shopOverview=false;this.selectedPlot=null;this.planning.visible=id==='plan';this.host.dataset.streetView=id;}
  setMoment(id:StreetMoment|null){this.moment=id;this.shopOverview=false;this.selectedPlot=null;this.host.dataset.streetMoment=id??'';}
  setShopOverview(value:boolean){this.shopOverview=value;if(value){this.selectedPlot=null;this.planning.visible=false;}}
  setPlot(id:string){this.selectedPlot=id;this.viewId='plan';this.planning.visible=true;this.host.dataset.streetView='plot-'+id;}
  setMarker(marker:HTMLButtonElement|null){this.marker=marker;}
  setDawn(value:number,animate=false){
    const end=T.MathUtils.clamp(value,0,1);this.dawnTween?.kill();
    if(animate){this.dawnTween=gsap.to(this,{dawn:end,duration:3,ease:'sine.inOut',onUpdate:()=>this.applyDawn(),onComplete:()=>{this.dawnTween=null;}});}
    else{this.dawnTween=null;this.dawn=end;this.applyDawn();}
  }
  private applyDawn(){if(!this.sun)return;if(this.morning){this.morning.update(this.dawn,this.eraProgress);return;}const y=14+this.dawn*13;this.sun.position.set(12,y,-58);this.sun.intensity=2.75+this.dawn*.9;this.sun.color.copy(new T.Color('#ffc17e').lerp(new T.Color('#ffe9c2'),this.dawn));this.sunDisc?.position.set(12,y,-58);this.sunGlow?.position.set(12,y,-57.8);this.scene.fog!.color.copy(new T.Color('#d5dfce').lerp(new T.Color('#e5e8ce'),this.dawn));this.host.dataset.dawn=this.dawn.toFixed(2);this.host.dataset.sunHeight=y.toFixed(2);}
  view(detail:Detail,aspect:number,orbit:number){
    this.activeDetail=detail;
    if(this.free)return this.free.view(aspect);
    if(this.walk&&this.walkMap){const target=V(aspect<1?0:-3,1,-6),position=V(25,40,40);if(aspect<1)position.sub(target).multiplyScalar(1.70).add(target);return {target,position,fov:43};}
    if(this.walk)return this.walk.view(orbit,aspect);
    if(this.moment){
      const m=streetMoments[this.moment],target=new T.Vector3(...m.position),offset=new T.Vector3(...m.offset).applyAxisAngle(V(0,1,0),orbit);
      if(aspect<1){offset.multiplyScalar(1.13);target.y-=1.38;}else target.add(V(offset.z,0,-offset.x).normalize().multiplyScalar(1.15));
      return {target,position:target.clone().add(offset)};
    }
    if(detail!=='welcome'||this.shopOverview){
      const v=views[detail],d=viewDistance(detail,aspect,39),yaw=v.yaw+orbit;
      const target=new T.Vector3(...v.target);if(aspect<1)target.y-=d*.13;
      return {target:this.shop.localToWorld(target.clone()),position:this.shop.localToWorld(target.clone().add(V(Math.sin(yaw)*Math.cos(v.elevation)*d,Math.sin(v.elevation)*d,Math.cos(yaw)*Math.cos(v.elevation)*d)))};
    }
    if(this.selectedPlot){const p=shopPlots.find(p=>p.id===this.selectedPlot)!;const target=V(p.x,2.8,p.z);return {target,position:V(p.x+(p.x<0?11:-11),7.5,p.z+8)};}
    const v=streetViews[this.viewId],target=new T.Vector3(...v.target),position=new T.Vector3(...v.position);
    if(this.viewId==='plan'&&aspect<1)position.copy(target).add(position.clone().sub(target).multiplyScalar(1.48));
    position.sub(target).applyAxisAngle(V(0,1,0),orbit).add(target);
    return {position,target};
  }
  update(time:number,camera:T.PerspectiveCamera,turn:number,motion=true){
    this.eraProgress=turn;
    const frames=new Map<string,ReturnType<typeof shopEraFrame>>(eraShopOrder.map(id=>[id,shopEraFrame(id,turn)]));
    const localEra=(id:string)=>frames.get(id)!.furniture;
    const atPosition=(x:number,z:number)=>localEra(nearestEraShop(x,z));
    const ambientEra=eraShopOrder.reduce((sum,id)=>sum+frames.get(id)!.turn,0)/eraShopOrder.length;
    this.morning?.update(this.dawn,ambientEra,localEra);
    if(this.morning){this.host.dataset.morningProgress=this.dawn.toFixed(4);this.host.dataset.marketClock=morningTime(this.dawn);this.host.dataset.openShops=String(openShopCount(this.dawn));this.host.dataset.dawn=this.dawn.toFixed(3);this.host.dataset.sunHeight=this.sun.position.y.toFixed(2);}
    const mianwo=frames.get('mianwo')!;
    this.foodStalls?.update(time,camera,mianwo.turn,mianwo);this.eras?.update(turn,atPosition);this.paving?.update(turn,eraShopOrder.map(localEra));
    if(this.morning)this.eras?.updateMorning(this.dawn);
    this.host.dataset.wholeStreetEra=turn===0?'past':turn===1?'present':'changing';this.host.dataset.pedestrianEra=this.host.dataset.wholeStreetEra;
    this.host.dataset.shopEraProgress=eraShopOrder.map(id=>frames.get(id)!.turn.toFixed(3)).join(',');
    this.host.dataset.shopEraPhases=JSON.stringify(eraShopOrder.map(id=>({id,...frames.get(id)!})));
    this.host.dataset.eraOrder=eraShopOrder.join(',');
    this.shops.forEach(shop=>{const frame=frames.get(shop.id)!;shop.setEraProgress(frame.turn,frame);shop.update(time,camera,motion);});
    const bounds=this.host.getBoundingClientRect();
    const occupied:{x:number;y:number}[]=[];
    this.explorerMarkers.forEach((button,id)=>{
      const place=places.find(p=>p.id===id)!;
      const anchor=new T.Vector3(...place.anchor);anchor.y=this.free?3.55:anchor.y;
      const distance=anchor.distanceTo(camera.position),point=anchor.project(camera);
      const active=this.free?this.markerEnabled:this.walkMap;
      button.hidden=!active||distance>35||point.z<0||point.z>1||Math.abs(point.x)>.92||Math.abs(point.y)>.76;
      let x=(point.x*.5+.5)*bounds.width,y=(-point.y*.5+.5)*bounds.height;
      if(!button.hidden){
        // The visible dot is small; reserve the full 44px touch target around it.
        let overlap:typeof occupied[number]|undefined;
        while((overlap=occupied.find(other=>Math.abs(x-other.x)<44&&Math.abs(y-other.y)<44)))y=overlap.y+48;
        if(y>bounds.height-135)button.hidden=true;else occupied.push({x,y});
      }
      button.style.transform='translate('+x+'px,'+y+'px) translate(-50%,-50%)';
      button.dataset.distance=distance.toFixed(1);
    });
    if(this.photoBoardMarker){
      const anchor=new T.Vector3(...photoBoardAnchor),distance=anchor.distanceTo(camera.position),point=anchor.project(camera),button=this.photoBoardMarker;
      button.hidden=!this.markerEnabled||distance>35||point.z<0||point.z>1||Math.abs(point.x)>.84||Math.abs(point.y)>.72;
      button.style.transform='translate('+((point.x*.5+.5)*bounds.width)+'px,'+((-point.y*.5+.5)*bounds.height)+'px) translate(-50%,-50%)';
    }
    this.host.dataset.photoBoardCount=String(this.life?.photoCount??0);
    this.life?.update(time,camera,ambientEra,atPosition);this.host.dataset.streetTurn=turn.toFixed(3);
    this.rays?.update(time,this.dawn);
    if(this.free||this.walk){const state=this.free?.state??this.walk!.state;this.host.dataset.walkStop=state.stop;this.host.dataset.walking=String(state.moving);this.host.dataset.eyeHeight=state.eye.toFixed(3);if(this.free){this.host.dataset.walkMode='first-person';this.host.dataset.walkYaw=this.free.state.yaw.toFixed(3);this.host.dataset.walkPitch=this.free.state.pitch.toFixed(3);this.host.dataset.walkFov=this.free.state.fov.toFixed(1);}}
    this.sunDisc?.quaternion.copy(camera.quaternion);this.sunGlow?.quaternion.copy(camera.quaternion);
    this.cutawayWalls.forEach(({group,socket,side})=>{group.visible=socket.worldToLocal(camera.position.clone()).x*side<0;});
    this.trees.forEach((g,i)=>g.rotation.z=Math.sin(time*.32+i)*.0035);
    this.birds.forEach((g,i)=>{g.position.set(Math.sin(time*.065+i*1.2)*12,13.3+i*.7+Math.sin(time*.3+i)*.15,-14+Math.cos(time*.065+i*1.2)*7);g.rotation.y=-time*.065-i*1.2;g.children.filter(c=>c.userData.side).forEach(c=>c.rotation.y=Math.sin(time*3.4+i)*.55*c.userData.side);});
    this.branches.forEach((b,i)=>b.rotation.z=Math.sin(time*.4+i)*.025);this.laundry.forEach((b,i)=>b.rotation.x=Math.sin(time*.55+i)*.045);
    const pedestrianDt=Math.max(0,time-this.pedestrianTime);this.pedestrianTime=time;
    this.people.forEach((p,i)=>{
      let desired=this.morning?pedestrianPresence(i,this.dawn):1;
      const viewer=this.free?.position;
      const nearby=this.people.filter(other=>other!==p&&other.group.visible).map(other=>({id:other.group.name,x:other.group.position.x,z:other.group.position.z,radius:other.radius+.04}));
      const bike=this.bicyclePass?.obstacle;if(bike)nearby.push(bike);
      if(viewer)nearby.push({id:'viewer',x:viewer.x,z:viewer.z,radius:.40});
      // A new arrival waits if the viewer occupies its space. Time scrubbing cannot spawn a body through the camera.
      if(!p.group.visible&&!bodySegmentClear(p.group.position,p.group.position,nearby,p.radius))desired=0;
      p.presence=T.MathUtils.damp(p.presence,desired,3.5,this.frameDt);
      p.group.visible=p.presence>.002;p.materials.forEach(m=>m.opacity=p.presence);
      if(!p.group.visible)return;
      const nextTime=this.free?p.time+pedestrianDt:time,length=p.start.distanceTo(p.end),phase=p.moving?(p.phase+nextTime*p.speed/Math.max(length,1))%2:0;
      const progress=phase<=1?phase:2-phase,next=p.start.clone().lerp(p.end,progress);
      // A passer-by yields to the viewer; resuming advances its own clock, never jumps ahead.
      if(!p.moving||bodySegmentClear(p.group.position,next,nearby,p.radius)){p.time=nextTime;p.group.position.copy(next);}
      p.group.position.y=p.moving?Math.abs(Math.sin(p.time*2.25+i))*.018:0;
      p.group.rotation.y=Math.atan2(camera.position.x-p.group.position.x,camera.position.z-p.group.position.z)*.78;
      const personEra=frames.get(nearestEraShop(p.group.position.x,p.group.position.z))!.keeper;
      p.prints.forEach((print,era)=>{print.visible=personEra<.5?era===0:era===1;print.rotation.z=Math.sin(time*(p.moving?2.25:.55)+i)*(p.moving?.012:.004);print.rotation.y=(personEra<.5?personEra:personEra-1)*Math.PI;});
    });
    this.host.dataset.activePeople=String(this.people.filter(p=>p.group.visible).length);
    if(this.bicyclePass){
      const obstacles=this.navigationObstacles().filter(o=>o.id!=='passing-old-bicycle');if(this.free)obstacles.push({id:'viewer',x:this.free.position.x,z:this.free.position.z,radius:.40});
      this.bicyclePass.update(this.frameDt,this.dawn,atPosition(this.bicyclePass.root.position.x,this.bicyclePass.root.position.z),motion,this.experienceActive,camera,obstacles);
      this.host.dataset.bicycleVisible=String(this.bicyclePass.root.visible);this.host.dataset.bicycleMoving=String(this.bicyclePass.cue?.moving??false);this.host.dataset.bicycleTime=(this.bicyclePass.cue?.elapsed??0).toFixed(3);
    }
    const right=camera.matrixWorld.elements;
    this.soundscape?.update({progress:this.dawn,era:atPosition(camera.position.x,camera.position.z),camera:{position:camera.position,right:{x:right[0],y:right[1],z:right[2]}},bicycle:this.bicyclePass?.cue??null});
    if(this.dust)(this.dust.material as T.ShaderMaterial).uniforms.time.value=time;
    if(this.marker){const point=V(-5.6,3.0,5.6).project(camera);const b=this.host.getBoundingClientRect();this.marker.style.transform=`translate(${(point.x*.5+.5)*b.width}px,${(-point.y*.5+.5)*b.height}px) translate(-50%,-50%)`;this.marker.hidden=!!this.moment||this.shopOverview||this.activeDetail!=='welcome'||this.viewId==='plan'||point.z<0||point.z>1||Math.abs(point.x)>.94||Math.abs(point.y)>.82;}
    this.host.dataset.pedestrianZ=this.people[0]?.group.position.z.toFixed(3)??'';this.host.dataset.streetTime=time.toFixed(2);
  }
  dispose(){this.disposed=true;this.life?.dispose();if(this.photoBoardMarker)this.photoBoardMarker.hidden=true;this.photoBoardMarker=null;this.free?.dispose();this.walk?.dispose();this.dawnTween?.kill();this.morning?.dispose();this.bicyclePass?.dispose();this.soundscape?.dispose();this.shops.forEach(shop=>shop.dispose());this.shops.clear();this.scene.remove(this.scenery,this.planning);this.marker=null;}
}



