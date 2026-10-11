import * as T from 'three';
import {PaperWorkshop} from '../atelier/PaperWorkshop';
import {makeSteam} from '../atelier/Steam';
import {flowerPot} from './Neighborhood';
import type {StreetMoment} from './moments';
import {photoZines,photoZineAsset} from './photoZines';

const V=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
type Leaves={mesh:T.InstancedMesh;origins:T.Vector3[]};
type Flip={past:T.Group;present:T.Group};

/** Small physical objects around the lane, kept outside every future shop volume. */
export class StreetLifeDetails{
  private flips:Flip[]=[];
  private steam:ReturnType<typeof makeSteam>[]=[];
  private curtains:T.Group[]=[];
  private scale:T.Group|null=null;
  private leaves:Leaves|null=null;
  private disposed=false;
  photoCount=0;
  readonly corners=new Map<StreetMoment,T.Group>();
  constructor(private w:PaperWorkshop,private parent:T.Group){
    this.teaCorner();this.marketDetails();this.noticeBoard();this.pavement();
  }
  private corner(id:StreetMoment,x:number,z:number){
    const g=new T.Group();g.name='street-moment-'+id;g.position.set(x,.14,z);this.parent.add(g);this.corners.set(id,g);return g;
  }
  private eraPair(parent:T.Group){
    const past=new T.Group(),present=new T.Group();
    past.name='past-life-objects';present.name='present-life-objects';
    for(const group of [past,present]){group.userData.animationRoot=true;parent.add(group);}
    this.flips.push({past,present});return {past,present};
  }
  private mug(g:T.Group,x:number,y:number,z:number,color:string){
    const w=this.w,p=new T.Group();p.position.set(x,y,z);g.add(p);
    w.mesh(p,new T.LatheGeometry([[.11,0],[.145,.025],[.15,.25],[.135,.27],[.123,.25],[.122,.04]].map(a=>new T.Vector2(...a)),24),w.material(color,'ceramic'));
    const rim=w.mesh(p,new T.TorusGeometry(.14,.013,6,24),w.material('#567f80'),[0,.26,0]);rim.rotation.x=Math.PI/2;
    const tea=w.cylinder(p,.121,.008,[0,.205,0],'#99724e',24);tea.castShadow=false;
    w.line(p,[V(.13,.21,0),V(.24,.23,0),V(.25,.075,0),V(.14,.05,0)],color,.023);
    w.box(p,[.03,.013,.015],[.096,.263,.097],'#665b4e');
    return p;
  }
  private teaCorner(){
    const w=this.w,g=this.corner('tea',7.25,14.4);g.rotation.y=-.25;
    for(let i=0;i<5;i++)w.box(g,[2.72,.095,.37],[0,1.02,-.79+i*.39],i%2?'#b58f70':'#c19a78','wood');
    for(const x of [-1.1,1.1])for(const z of [-.67,.67]){w.box(g,[.10,.98,.10],[x,.50,z],'#927457','wood');w.box(g,[.045,.03,.03],[x+.053,.86,z],'#565e54','metal');}
    w.box(g,[2.28,.07,.09],[0,.32,0],'#a68261','wood');
    for(const x of [-1.9,1.9]){
      const z=x<0?1.1:.2;
      w.box(g,[.65,.10,.63],[x,.59,z],'#b18865','wood');
      for(const a of [-.22,.22])for(const b of [-.22,.22])w.box(g,[.07,.55,.07],[x+a,.3,z+b],'#9b7958','wood');
    }
    // Tea rings and an inlaid repair visibly belong to the shared table in both eras.
    for(const [x,z] of [[-.52,.50],[.48,.3]]){const ring=w.mesh(g,new T.RingGeometry(.15,.166,32),w.material('#9f8669'),[x,1.071,z]);ring.rotation.x=-Math.PI/2;ring.castShadow=false;}
    w.box(g,[.52,.007,.105],[-.93,1.074,-.27],'#a38d70','wood');
    const {past,present}=this.eraPair(g);
    const radio=new T.Group();radio.position.set(-.52,1.072,-.42);past.add(radio);
    w.box(radio,[.88,.52,.28],[0,.27,0],'#92775b','wood');w.box(radio,[.83,.45,.025],[0,.27,.151],'#d1b991','cloth');
    for(let row=0;row<6;row++)for(let col=0;col<10;col++)w.box(radio,[.022,.012,.004],[-.34+col*.043,.105+row*.05,.17],'#6f715d');
    w.sign(radio,'FM  ▏▏▏▏',.31,.095,[.22,.405,.174],'#e5d5af','#5b6b62');
    for(const y of [.16,.29]){const knob=w.cylinder(radio,.045,.045,[.25,y,.194],'#5c685e',18);knob.rotation.x=Math.PI/2;}
    w.line(radio,[V(-.25,.53,0),V(-.25,.65,0),V(.25,.65,0),V(.25,.53,0)],'#676554',.018);
    w.line(radio,[V(.31,.5,-.06),V(.64,1.08,-.06)],'#869289',.008);
    const thermos=new T.Group();thermos.position.set(.65,1.072,-.4);past.add(thermos);
    w.cylinder(thermos,.20,.65,[0,.35,0],'#c1a878',28,'wood');
    for(let i=0;i<18;i++){const a=i*Math.PI/9;w.box(thermos,[.017,.62,.02],[Math.sin(a)*.2,.35,Math.cos(a)*.2],'#967d57','wood');}
    for(const yy of [.09,.24,.42,.62]){const band=w.mesh(thermos,new T.TorusGeometry(.204,.009,5,28),w.material('#e4cba0'),[0,yy,0]);band.rotation.x=Math.PI/2;}
    w.cylinder(thermos,.12,.12,[0,.72,0],'#ede1b9',20);w.cylinder(thermos,.074,.065,[0,.805,0],'#9f7f51',20,'wood');
    w.line(thermos,[V(.17,.61,0),V(.33,.61,0),V(.33,.18,0),V(.19,.18,0)],'#a38661',.026);
    this.mug(past,-.4,1.072,.4,'#eadcc0');this.mug(past,.35,1.072,.40,'#c6d5ca');
    const paper=w.sign(past,'清晨来信',.72,.46,[-.2,1.08,-.08],'#e4d7b9','#748171','街坊的事，坐下来慢慢说');paper.rotation.x=-Math.PI/2;paper.rotation.z=.14;
    w.cylinder(present,.17,.58,[.63,1.36,-.32],'#93b2aa',28);w.cylinder(present,.177,.10,[.63,1.70,-.32],'#567971',28);
    this.mug(present,-.45,1.072,.36,'#c6d5ca');
    const book=new T.Group();book.position.set(-.26,1.10,-.31);book.rotation.x=-Math.PI/2;book.rotation.z=-.14;present.add(book);
    w.sign(book,'巷里的\n清晨',.55,.69,[-.27,0,0],'#e7e4c9','#637b70');w.sign(book,'慢慢走\n慢慢看',.55,.69,[.29,0,.007],'#f2e9cb','#a0735c');
    for(const [x,z] of [[.56,.28],[.89,.3]])w.box(present,[.08,.05,.18],[x,1.10,z],'#b38860');
    const bag=new T.Group();bag.position.set(1.90,.66,.2);present.add(bag);
    w.box(bag,[.49,.56,.12],[0,.25,0],'#d5cdb0','cloth');
    for(const zz of [-.065,.065])w.line(bag,[V(-.13,.5,zz),V(-.11,.78,zz),V(.12,.78,zz),V(.13,.5,zz)],'#748b75',.018);
    w.sign(bag,'慢慢逛',.37,.16,[0,.32,.07],'#d5cdb0','#698571');
    const steamRoot=new T.Group();steamRoot.userData.animationRoot=true;steamRoot.position.set(-.43,1.34,.38);steamRoot.scale.set(.38,.52,.38);g.add(steamRoot);
    this.steam.push(makeSteam(w,steamRoot,V(0,0,0)));
    flowerPot(w,g,-1.43,.05,-.87,1.2);
  }
  private marketDetails(){
    const w=this.w,g=this.corner('market',-6.3,13);g.rotation.y=.12;
    const {past,present}=this.eraPair(g);
    w.box(g,[.90,.065,.67],[1.84,1.47,.08],'#b69970','wood');
    w.line(g,[V(1.28,.86,.10),V(2.16,1.43,.10)],'#9b825e',.033);
    const scale=new T.Group();scale.userData.animationRoot=true;scale.position.set(1.47,2.55,.11);past.add(scale);this.scale=scale;
    w.line(past,[V(1.70,1.50,.1),V(1.70,2.72,.1),V(1.47,2.72,.1),V(1.47,2.55,.1)],'#6f775f',.022);
    w.line(scale,[V(-.48,0,0),V(.52,0,0)],'#96744d',.019);
    for(let i=0;i<15;i++)w.box(scale,[.012,.03,.009],[-.12+i*.039,.015,.018],'#e7d2a6');
    for(const x of [-.63,-.3])w.line(scale,[V(-.47,0,0),V(x,-.5,.12)],'#7d846e',.007);
    w.line(scale,[V(-.47,0,0),V(-.47,-.5,-.15)],'#7d846e',.007);
    const pan=w.mesh(scale,new T.SphereGeometry(.24,20,8,0,Math.PI*2,Math.PI*.54,Math.PI*.43),w.material('#b1b5a1','metal'),[-.47,-.43,0]);pan.scale.y=.36;
    w.line(scale,[V(.39,0,0),V(.39,-.12,0)],'#6d735f',.015);w.box(scale,[.13,.15,.10],[.39,-.20,0],'#676f60','metal');
    w.box(present,[.82,.15,.53],[1.84,1.58,.1],'#819e99','metal');w.box(present,[.88,.045,.58],[1.84,1.68,.1],'#c8d6ca','metal');
    w.sign(present,'0.680',.37,.087,[1.84,1.59,.377],'#d3dfbf','#465f52');
    for(let i=0;i<4;i++)w.box(present,[.055,.035,.006],[1.58+i*.11,1.54,.38],i===3?'#b87860':'#d5d4b1');
    const basket=new T.Group();basket.position.set(-1.5,.04,.9);g.add(basket);
    w.mesh(basket,new T.LatheGeometry([[.21,0],[.30,.06],[.37,.46],[.36,.49]].map(a=>new T.Vector2(...a)),24),w.material('#c5ac79','wood'));
    for(let n=0;n<7;n++){const band=w.mesh(basket,new T.TorusGeometry(.25+n*.018,.011,5,24),w.material('#917953'),[0,.06+n*.061,0]);band.rotation.x=Math.PI/2;}
    for(let i=0;i<18;i++){const a=i*Math.PI/9;w.line(basket,[V(Math.sin(a)*.22,.02,Math.cos(a)*.22),V(Math.sin(a)*.36,.49,Math.cos(a)*.36)],'#9f8557',.009);}
    w.line(basket,[V(-.32,.43,0),V(-.29,.90,0),V(.29,.90,0),V(.32,.43,0)],'#9a825b',.023);
    for(let i=0;i<5;i++){const leaf=w.shape(basket,[[0,0],[-.13,.18],[-.11,.46],[.08,.53],[.14,.29]],[Math.sin(i)*.15,.35,Math.cos(i)*.10],i%2?'#9cb18a':'#7b9b7e',.007);leaf.rotation.y=i*1.2;}
    for(let n=0;n<3;n++){const parcel=w.box(past,[.38,.13,.29],[-1.01,1.2+n*.13,.15],'#d6c39f');parcel.rotation.y=n*.12;w.line(past,[V(-1.21,1.21+n*.13,.15),V(-1.01,1.275+n*.13,.15),V(-.81,1.21+n*.13,.15)],'#927b54',.005);}
    const tote=new T.Group();tote.position.set(-1.13,1.15,.13);present.add(tote);
    w.box(tote,[.38,.14,.32],[0,0,0],'#d8ddc4','cloth');w.line(tote,[V(-.14,.07,0),V(-.12,.25,0),V(.12,.25,0),V(.14,.07,0)],'#859879',.014);
  }
  private noticeBoard(){
    const w=this.w,g=this.corner('notice',-5.85,-25.5);g.rotation.y=.55;
    for(const x of [-1.02,1.02])w.box(g,[.11,3.43,.12],[x,1.73,0],'#977859','wood');
    w.box(g,[2.26,1.90,.12],[0,2.40,0],'#bcaa82','wood');
    for(const x of [-1.12,1.12])w.box(g,[.07,2.0,.08],[x,2.4,.08],'#84765c','wood');
    for(const y of [1.43,3.38])w.box(g,[2.32,.08,.18],[0,y,.08],'#8c795a','wood');
    const top=w.box(g,[2.53,.085,.55],[0,3.48,0],'#88a39b');top.rotation.x=.2;
    const exhibition=new T.Group();exhibition.name='street-photo-zines';exhibition.userData.animationRoot=true;g.add(exhibition);
    photoZines.forEach((item,index)=>{
      const paper=new T.Group();paper.position.set((index%3-1)*.69,index<3?2.90:2.00,.09);paper.rotation.z=[-.025,.018,-.015,.02,-.015,.025][index];exhibition.add(paper);
      const placeholder=w.sign(paper,'0'+(index+1),.48,.8,[0,0,0],'#efe5cd','#9c967a');
      w.mesh(paper,new T.SphereGeometry(.019,8,5),w.material('#a56e54'),[0,.375,.018]);
      const image=new Image();image.src=photoZineAsset(item.id,true);
      // The street opens independently; a late decode cannot revive disposed scene resources.
      void image.decode().then(()=>{
        if(this.disposed)return;
        const print=w.print(paper,image,.48,.8,[0,0,.004]);print.name='photo-zine-'+item.id;print.castShadow=false;
        paper.remove(placeholder);this.photoCount++;
      }).catch(()=>{/* The numbered paper remains if a thumbnail fails. */});
    });
    w.sign(exhibition,'街坊影笺 · 照片再创作',1.76,.17,[0,1.25,.08],'#e6dbc1','#6e7760');
    flowerPot(w,g,-1.35,.05,.28,1.45);flowerPot(w,g,1.36,.05,.30,.8);
  }
  balconies(sockets:Map<string,T.Group>){
    const w=this.w;
    [...sockets.values()].forEach((socket,index)=>{
      w.sign(socket,String(12+index*2)+'号',.50,.31,[-4.15,4.25,.37],'#91ada3','#f5e4bd');
      if(index%2===0){
        const rack=new T.Group();rack.position.set(-3.92,6.34,-1.9);socket.add(rack);
        for(const x of [-.37,.37])w.box(rack,[.065,1.72,.065],[x,.86,0],'#9c7f5c','wood');
        for(const y of [.16,.85,1.57]){w.box(rack,[.9,.055,.54],[0,y,0],'#b29670','wood');flowerPot(w,rack,.08,y+.03,0,.82);}
      }else{
        const cabinet=new T.Group();cabinet.position.set(3.8,6.34,-3);socket.add(cabinet);
        w.box(cabinet,[1.2,1.37,.6],[0,.7,0],'#b77f67','wood');
        for(const x of [-.28,.28]){w.box(cabinet,[.53,1.13,.045],[x,.72,.32],'#c89479','wood');w.box(cabinet,[.035,.13,.028],[x*.4,.77,.36],'#785c4a');}
        w.box(cabinet,[1.31,.08,.70],[0,1.44,0],'#d1a87f','wood');
        w.cylinder(cabinet,.17,.25,[.23,1.61,0],'#acbfc4',20,'ceramic');
      }
      // Pleated cloth is real folded geometry, not a flat rectangle over a window.
      const curtain=new T.Group();curtain.position.set(-3.42,11.3,-4.48);curtain.userData.animationRoot=true;socket.add(curtain);this.curtains.push(curtain);
      for(const side of [-1,1]){
        const geometry=new T.PlaneGeometry(.67,2.1,12,5),pos=geometry.getAttribute('position');
        for(let n=0;n<pos.count;n++){const y=pos.getY(n);pos.setXYZ(n,pos.getX(n)+side*.12*(1-(y+1.05)/2.1),y-1.05,Math.cos(pos.getX(n)*27)*.05);}
        geometry.computeVertexNormals();const cloth=w.material(index%2?'#d9b9ae':'#cad4ba','cloth');cloth.side=T.DoubleSide;w.mesh(curtain,geometry,cloth,[side*.49,0,0]);
      }
      w.line(socket,[V(-4.22,11.36,-4.44),V(-2.63,11.36,-4.44)],'#887357',.028);
      // A string of tiny red peppers adds a warm spot under alternating eaves.
      if(index%2===0)for(let n=0;n<9;n++){
        const x=4.1+Math.sin(n*2)*.045,y=10.7-n*.10;
        w.line(socket,[V(x,y,-.06),V(x+.11,y-.13,-.04),V(x+.05,y-.23,-.02)],n%3?'#ac6857':'#c78666',.025);
      }
    });
  }
  batch(){
    // Each era stays independently switchable; only its own static descendants merge.
    for(const pair of this.flips)for(const group of [pair.past,pair.present]){this.w.batchStatic(group);this.w.batchScenery(group);}
  }
  private pavement(){
    const w=this.w;
    // Fallen leaves remain sparse at the curb; the walking lane stays open.
    const shape=new T.Shape();shape.moveTo(0,-.10);shape.quadraticCurveTo(-.12,.04,0,.19);shape.quadraticCurveTo(.12,.04,0,-.10);
    const geo=new T.ShapeGeometry(shape);geo.rotateX(-Math.PI/2);w.geometries.add(geo);
    const leaves=new T.InstancedMesh(geo,w.material('#bead79'),112);const origins:T.Vector3[]=[];
    for(let i=0;i<112;i++){const side=i%2?1:-1;origins.push(V(side*(4.30+((i*37)%17)*.033),.065,18-(i%56)*.91));}
    leaves.receiveShadow=true;leaves.castShadow=false;leaves.name='curb-fallen-leaves';leaves.userData.animationRoot=true;this.parent.add(leaves);this.leaves={mesh:leaves,origins};
    for(let i=0;i<42;i++){
      const x=(i%2?1:-1)*4.90,z=16-i*1.12;
      for(let j=0;j<3;j++){const grass=w.shape(this.parent,[[0,0],[-.025,.12+j*.035],[.015,.08],[.03,0]],[x,.048,z],i%2?'#8f9e7d':'#a8ae80',.004);grass.rotation.y=j*1.04;}
    }
  }
  update(time:number,camera:T.Camera,turn:number,atPosition?:(x:number,z:number)=>number){
    const angle=T.MathUtils.clamp(turn,0,1)*Math.PI;
    for(const f of this.flips){const position=f.past.getWorldPosition(new T.Vector3()),local=atPosition?.(position.x,position.z)??turn;f.past.visible=local<.5;f.present.visible=local>=.5;f.past.rotation.y=local*Math.PI;f.present.rotation.y=(local-1)*Math.PI;}
    this.steam.forEach(s=>{s.update(time,camera,true);s.meshes.forEach(m=>m.material.uniforms.strength.value=.32*Math.pow(Math.abs(Math.cos(angle)),4));});
    if(this.scale)this.scale.rotation.z=Math.sin(time*.65)*.022;
    this.curtains.forEach((g,i)=>g.rotation.x=Math.sin(time*.47+i)*.018);
    if(this.leaves){const m=new T.Matrix4(),q=new T.Quaternion(),p=new T.Vector3();this.leaves.origins.forEach((origin,i)=>{p.copy(origin);if(i%13===0){p.z+=Math.sin(time*.26+i)*.12;p.y+=Math.max(0,Math.sin(time*.26+i))*.018;}q.setFromAxisAngle(V(0,1,0),i*2.39);m.compose(p,q,V(1,1,1));this.leaves!.mesh.setMatrixAt(i,m);});this.leaves.mesh.instanceMatrix.needsUpdate=true;}
  }
  dispose(){this.disposed=true;}
}
