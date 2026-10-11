import * as T from 'three';
import {PaperWorkshop} from '../atelier/PaperWorkshop';
import {makeSteam} from '../atelier/Steam';
import type {ShopModule} from './ShopModule';
import {shopFrame, eraVisibility} from './ShopModule';
import type {ShopEraFrame} from '../atelier/EraSequence';
import {paperSeam} from './eraDomino';

const V = (x: number, y: number, z: number) => new T.Vector3(x, y, z);
export type DoupiArt = {past: HTMLImageElement; present: HTMLImageElement; keeper: HTMLImageElement; keeperToday: HTMLImageElement};

/** Dimensional paper kitchen. Printed walls never contain the animated shopkeeper. */
export class DoupiShop implements ShopModule {
  readonly id = 'doupi';
  readonly root = new T.Group();
  readonly anchors = new Map([['food', V(-.65, 1.97, 1)], ['spatula', V(2.2, 1.82, 1.24)], ['keeper', V(.3, 3.12, -.20)]]);
  private wall = new T.Group();
  private panels: T.Group[] = [];
  private eras = [new T.Group(), new T.Group()];
  private actors: T.Mesh[] = [];
  private faces: ReturnType<PaperWorkshop['portraitAtlas']>[] = [];
  private steam: ReturnType<typeof makeSteam>;
  private elapsed = 0;
  private speakingUntil = 0;
  private turn = 0;
  private foodTurn=0; private food=new T.Group();
  private disposed = false;
  private canopy = new T.Group();
  private speechRequested = false;
  constructor(private w: PaperWorkshop, art: DoupiArt, private host: HTMLDivElement) {
    const g = this.root;
    g.name = 'doupi-complete-shop'; g.userData.animationRoot = true;
    g.add(this.wall, this.canopy, ...this.eras);
    this.floor(); this.backWall(art); this.facade(); this.counter();
    this.eras.forEach((era, i) => this.furniture(era, i === 0));
    const actors = new T.Group(); actors.name = 'doupi-independent-portraits'; actors.userData.animationRoot = true; g.add(actors);
    for (const [i, img] of [art.keeper, art.keeperToday].entries()) {
      const actor = w.print(actors, img, 2.25, 3.38, [.3, 1.77, -.20 + i * .003], true, true);
      actor.name = 'doupi-keeper-' + (i ? 'present' : 'past'); actor.userData.noAO = true;
      this.actors.push(actor);
      this.faces.push(w.portraitAtlas(actor, false, {
        key: 'doupi-' + i,
        offsets: i ? [[0,0],[402,0],[795,0],[0,629],[402,629],[795,629]] : [[0,0],[401,0],[793,0],[0,628],[400,628],[793,628]],
        size: img.width, mouth: [.570,.799], eyes: [.558,.842], mouthRadius: [.050,.026], eyesRadius: [.070,.025],
      }));
    }
    const steamRoot = new T.Group(); steamRoot.userData.animationRoot = true; steamRoot.name = 'doupi-steam'; g.add(steamRoot);
    this.steam = makeSteam(w, steamRoot, V(-.65, 2.13, 1));
    // Merge within each era; never merge across the two switchable groups or hinge roots.
    w.batchStatic(g); w.batchScenery(this.food); w.batchScenery(g);
    this.setEraProgress(0);
  }
  mount(socket: T.Group) {
    socket.getObjectByName('removable-closure-' + this.id)?.removeFromParent();
    socket.add(this.root);
  }
  private floor() {
    const w = this.w, g = this.root;
    w.box(g, [9.2,.15,5.1], [0,.01,0], '#bbb9a6', 'stone');
    for(let row=0;row<6;row++)for(let col=0;col<10;col++) {
      w.box(g,[.86,.015,.77],[-4.12+col*.92,.095,-2.04+row*.84],['#c3c4b4','#b6bdae','#cdd0bd'][(col+row)%3],'stone');
    }
    // Low paper side wings supply depth without sealing the shop into a box.
    for(const side of [-1,1]) {
      w.box(g,[.13,3.75,3.1],[side*4.55,1.97,-.86],'#adbcb3','stone');
      w.box(g,[.09,3.8,.13],[side*4.48,2,.72],'#a57755','wood');
    }
    const stool = new T.Group(); stool.position.set(-3.7,0,.48); g.add(stool);
    w.box(stool,[.75,.08,.67],[0,.66,0],'#c69770','wood');
    for(const x of [-.26,.26])for(const z of [-.23,.23])w.box(stool,[.08,.57,.08],[x,.33,z],'#9a795b','wood');
    w.box(stool,[.60,.045,.07],[0,.32,.23],'#9a795b','wood');
  }
  private backWall(art: DoupiArt) {
    const w=this.w; this.wall.position.set(0,3,-2.31); this.wall.userData.animationRoot=true;
    for(let i=0;i<4;i++) {
      const panel=new T.Group(); panel.name='doupi-hinge-'+i; panel.position.x=-3.45+i*2.3; panel.userData.animationRoot=true;
      this.wall.add(panel); this.panels.push(panel);
      w.box(panel,[2.295,5.78,.07],[0,0,0],'#a59f86');
      for(const [j,img] of [art.past,art.present].entries()) {
        const face=w.print(panel,img,2.30,5.76,[0,0,j?-.041:.041]);
        face.castShadow=false; if(j)face.rotation.y=Math.PI;
        const uv=face.geometry.getAttribute('uv'); for(let k=0;k<uv.count;k++)uv.setX(k,(uv.getX(k)+i)/4);
      }
    }
  }
  private facade() {
    const w=this.w,g=this.root;
    for(const x of [-4.25,4.25])w.box(g,[.14,5.58,.17],[x,2.88,1.30],'#a8805e','wood');
    w.box(g,[8.65,.19,.23],[0,5.64,1.30],'#987353','wood');
    this.canopy.position.set(0,4.48,1.22); this.canopy.userData.animationRoot=true;
    for(let i=0;i<12;i++) {
      const stripe=w.box(this.canopy,[.702,.026,1.27],[-3.86+i*.703,-.10,.55],i%2?'#ebdbb8':'#b9a478','cloth');stripe.rotation.x=.13;
      w.shape(this.canopy,[[-.35,0],[.35,0],[.35,-.20],[.18,-.26],[0,-.22],[-.2,-.26],[-.35,-.2]],[-3.86+i*.703,-.18,1.17],i%2?'#ebdbb8':'#b9a478',.014);
    }
    const lamp=w.mesh(g,new T.SphereGeometry(.11,12,8),w.ownMaterial(new T.MeshStandardMaterial({color:'#fff1cf',emissive:'#ffdfad',emissiveIntensity:.45})),[-2.45,3.75,.38]);
    lamp.castShadow=false;w.line(g,[V(-2.45,4.42,.38),V(-2.45,3.86,.38)],'#726c56',.012);
  }
  private bowl(parent: T.Group, x: number, y: number, z: number, radius=.23) {
    const w=this.w;
    w.mesh(parent,new T.LatheGeometry([[.09,0],[.11,.025],[radius,.18],[radius-.018,.18],[.10,.04]].map(([a,b])=>new T.Vector2(a,b)),24),w.material('#d8e0d6','ceramic'),[x,y,z]);
    const rim=w.mesh(parent,new T.TorusGeometry(radius-.008,.012,5,24),w.material('#6c91a0'),[x,y+.18,z]);rim.rotation.x=Math.PI/2;
  }
  private furniture(g: T.Group, past: boolean) {
    const w=this.w;g.name='doupi-era-'+(past?'past':'present');g.userData.animationRoot=true;
    w.sign(g,past?'三 鮮 豆 皮':'三鲜豆皮 · 早铺',6.8,.79,[0,5.07,1.405],past?'#a86f50':'#6c8c7b','#f3e5bf',past?'薄 皮 包 糯 香　·　街 坊 清 晨':'旧窗还在　·　这盘仍然热着');
    w.box(g,[6.62,.07,1.55],[0,1.69,1],past?'#c39a73':'#b7c2b9',past?'wood':'metal');
    w.sign(g,past?'趁热吃':'外带 · 自带餐盒',1.64,.38,[2.22,1.1,1.77],past?'#f0dfba':'#e8eddb','#746e50');
    const shelves=new T.Group();shelves.position.set(-2.57,0,-1.96);g.add(shelves);
    for(const y of [2.52,3.42]) {
      w.box(shelves,[2.50,.085,.56],[0,y,0],'#b8936f','wood');
      for(const x of [-.96,.96])w.box(shelves,[.10,.30,.26],[x,y-.16,-.05],'#967358','wood');
      for(let j=0;j<4;j++)this.bowl(shelves,-.85+j*.57,y+.05,.10,.20);
    }
    const steamer=new T.Group();steamer.position.set(2.80,2.42,-1.9);g.add(steamer);
    for(let i=0;i<3;i++) {
      w.cylinder(steamer,.40,.24,[0,.13+i*.255,0],'#c9aa7f',28,'wood');
      for(const y of [.025+i*.255,.235+i*.255]) {const rim=w.mesh(steamer,new T.TorusGeometry(.4,.019,5,28),w.material('#9d7a56'),[0,y,0]);rim.rotation.x=Math.PI/2;}
    }
    for(let i=0;i<11;i++)w.box(steamer,[.065,.012,.69],[-.32+i*.065,.778,0],'#b18c60','wood');
    w.box(g,[2.15,.09,.55],[2.73,2.36,-1.95],'#b38b67','wood');
    for(const [j,label] of ['糯米','香菇','笋丁'].entries()) {
      w.cylinder(g,.19,.43,[2.03+j*.65,1.97,-.48],past?'#af9b77':'#c6d1c4',20,past?'ceramic':'metal');
      w.cylinder(g,.195,.035,[2.03+j*.65,2.205,-.48],'#a58b62',20,'wood');
      w.sign(g,label,.25,.12,[2.03+j*.65,2.01,-.279],'#e9dec1','#747353');
    }
    const board=new T.Group();board.position.set(2.97,2.2,-1.92);g.add(board);
    w.sign(board,past?'清晨 · 手记':'清晨 · 记一味',1.25,.73,[0,1.54,.11],past?'#e0c9a4':'#d5dfc7','#766b55');
    const bag=new T.Group();bag.position.set(-2.55,1.77,.73);g.add(bag);
    if(past) {
      w.box(bag,[.55,.43,.25],[0,.215,0],'#e5ce9f');
      w.line(bag,[V(-.22,.42,.14),V(0,.33,.14),V(.23,.42,.14)],'#9b8b6e',.006);
      w.cylinder(g,.20,.50,[-3.05,2.89,-1.84],'#ba7760',20,'metal');
    } else {
      w.box(bag,[.67,.22,.39],[0,.11,0],'#a5bcb0','metal');w.box(bag,[.70,.04,.42],[0,.24,0],'#d9e2d7','metal');
      w.box(g,[.48,.15,.68],[-2.89,1.83,.13],'#7c958d','metal');
      w.sign(g,'记一味',.34,.31,[-2.9,2.18,.33],'#ede5ce','#607566');
      const plant=new T.Group();plant.position.set(3.7,2.6,-1.94);g.add(plant);w.cylinder(plant,.18,.25,[0,0,0],'#a5b6a5',20,'ceramic');
      for(let j=0;j<7;j++)w.line(plant,[V(0,.1,0),V(Math.sin(j*2)*.18,.4+j%3*.10,Math.cos(j*2)*.09)],'#96aa83',.035);
    }
    // Era-specific towel and hooks are genuine foreground geometry.
    w.box(g,[.41,.62,.025],[1.49,3.16,-2.10],past?'#e0c6b0':'#d0deca','cloth');
    for(let j=0;j<4;j++)w.box(g,[.008,.56,.009],[1.34+j*.085,3.16,-2.081],'#aaa68c');
  }
  private counter() {
    const w=this.w,g=this.root;
    w.box(g,[6.4,1.42,1.37],[0,.91,1],'#b28a67','wood');
    for(let j=0;j<14;j++)w.box(g,[.024,1.25,.02],[-3+j*.46,.94,1.704],'#8d785c','wood');
    for(const y of [.33,1.53])w.box(g,[6.49,.09,.085],[0,y,1.745],'#a17e59','wood');
    const pan=this.food;pan.userData.animationRoot=true;pan.position.set(-.65,1.735,1);g.add(pan);
    w.mesh(pan,new T.LatheGeometry([[0,0],[1.28,.005],[1.38,.05],[1.47,.14],[1.45,.16],[1.36,.075],[1.25,.04],[0,.04]].map(([a,b])=>new T.Vector2(a,b)),40),w.material('#747c6c','metal'));
    for(const side of [-1,1])w.line(pan,[V(side*1.4,.08,-.23),V(side*1.66,.16,-.23),V(side*1.66,.16,.23),V(side*1.4,.08,.23)],'#6a7467',.035);
    // Dimensional square pieces with separate skin, irregular rice grains and filling.
    const grains=new T.SphereGeometry(.023,6,4);w.geometries.add(grains);
    const rice=new T.InstancedMesh(grains,w.material('#ecdfbb'),720);rice.castShadow=true;rice.receiveShadow=true;rice.userData.noAO=true;pan.add(rice);
    const matrix=new T.Matrix4(),q=new T.Quaternion();let grainIndex=0;
    for(let row=0;row<3;row++)for(let col=0;col<4;col++) {
      const x=-.90+col*.60,z=-.48+row*.48;
      w.box(pan,[.565,.032,.45],[x,.071,z],'#d3ad66');
      w.box(pan,[.535,.125,.425],[x,.145,z],'#d4c395');
      for(let n=0;n<60;n++) {
        const side=n%4,along=((n*17)%29)/29-.5;
        const xx=side<2?x+along*.51:x+(side===2?-.273:.273),zz=side<2?z+(side?-.218:.218):z+along*.40;
        q.setFromAxisAngle(V(0,1,0),n*2.3);
        matrix.compose(V(xx,.113+(n%3)*.035,zz),q,V(1.30,.58,.65));rice.setMatrixAt(grainIndex++,matrix);
      }
      w.box(pan,[.55,.026,.442],[x,.222,z],'#dfb768');
      for(let n=0;n<8;n++) {
        const filling=w.box(pan,[.063,.035,.052],[x-.22+(n%4)*.14,.217,z+(n<4?-.206:.206)],['#b78b63','#8d735b','#e1cfa0'][n%3]);
        filling.rotation.y=n*.54;
      }
      for(let n=0;n<5;n++)w.box(pan,[.035,.004,.065],[x-.19+n*.08,.237,z+Math.sin(n*5+row)*.14],n%2?'#cda65e':'#d2ae66');
    }
    this.bowl(g,2.17,1.78,.43,.38);
    for(let i=0;i<4;i++){const plate=w.cylinder(g,.32,.043,[2.76,1.81+i*.047,.70],'#d5dfd3',28,'ceramic');plate.receiveShadow=true;}
    // The worn spatula remains the same identifiable object across both eras.
    const spatula=new T.Group();spatula.name='doupi-old-spatula';spatula.position.set(2.15,1.83,1.21);spatula.rotation.y=-.24;g.add(spatula);
    const blade=w.shape(spatula,[[-.20,-.21],[.22,-.20],[.19,.22],[-.16,.22]],[0,0,0],'#8c998c',.026);blade.rotation.x=-Math.PI/2;
    w.box(spatula,[.065,.035,.68],[0,.033,-.55],'#a6835f','wood');
    for(let i=0;i<6;i++)w.line(spatula,[V(-.12+i*.04,.03,-.12),V(-.09+i*.04,.03,.13)],'#aeb2a0',.002);
    this.host.dataset.doupiRiceGrains=String(grainIndex);
  }
  setEraProgress(turn: number, frame?: ShopEraFrame) {
    this.turn=T.MathUtils.clamp(turn,0,1);const e=eraVisibility(this.turn);
    this.panels.forEach((p,i)=>p.rotation.y=(frame?.panels[i]??this.turn)*Math.PI);
    // Retreat just the hinged rear wall, leaving the socket and street fixed.
    this.wall.position.z=-2.31-Math.sin((frame?.wall??this.turn)*Math.PI)*1.22;
    this.canopy.rotation.x=-Math.sin((frame?.wall??this.turn)*Math.PI)*.85;
    this.eras.forEach((g,i)=>{g.visible=frame?(frame.furniture<.5?i===0:i===1):e.furniture&&(e.present?i===1:i===0);g.scale.x=frame?paperSeam(frame.furniture):1;});
    this.actors.forEach((g,i)=>{g.visible=frame?(frame.keeper<.5?i===0:i===1):e.furniture&&(e.present?i===1:i===0);g.rotation.y=frame?(frame.keeper<.5?frame.keeper:frame.keeper-1)*Math.PI:0;});
    this.foodTurn=frame?.food??this.turn;this.food.rotation.x=-Math.sin(this.foodTurn*Math.PI)*.14;
    this.host.dataset.doupiEra=(frame?.keeper??this.turn)>=.5?'present':'past';
    this.host.dataset.doupiWallAngle=((frame?.panels[0]??this.turn)*180).toFixed(1);
    this.host.dataset.doupiVisibleActors=String(this.actors.filter(a=>a.visible).length);
    this.host.dataset.doupiFurniture=String(this.eras.some(g=>g.visible));
  }
  speak(){this.speechRequested=true;}
  update(time: number, camera: T.Camera, motion: boolean) {
    if(this.disposed)return;this.elapsed=time;
    if(this.speechRequested){this.speakingUntil=this.elapsed+8;this.speechRequested=false;}
    const f=shopFrame(time,this.speakingUntil,motion);
    this.faces.forEach(face=>face(f.from,f.to,f.blend,f.blink));
    this.actors.forEach(actor=>actor.scale.y=1+(motion?Math.sin(time*1.1)*.0018:0));
    this.steam.update(time,camera,true);
    this.steam.meshes.forEach(m=>m.material.uniforms.strength.value=.24*eraVisibility(this.foodTurn).steam);
    this.host.dataset.doupiMouth=String(f.from);this.host.dataset.doupiBlink=String(f.blink>.2);this.host.dataset.doupiSpeaking=String(f.speaking);
    this.host.dataset.doupiSteamTime=time.toFixed(2);
  }
  dispose(){this.disposed=true;this.root.removeFromParent();this.anchors.clear();}
}
