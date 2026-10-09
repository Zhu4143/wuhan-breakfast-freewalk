import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {isMobileScene,sceneImageUrl} from './sceneAssets.ts';

/** Geometry supplies depth; image assets supply the painted detail. All resources belong to this workshop. */
export class PaperWorkshop {
  illustrated=false;
  readonly mobile=isMobileScene();
  onImageLoaded:((count:number)=>void)|undefined;
  private loadedImages=0;
  geometries = new Set<T.BufferGeometry>();
  materials = new Set<T.Material>();
  textures = new Set<T.Texture>();
  cache = new Map<string, T.MeshStandardMaterial>();
  private bumps=new Map<string,T.Texture>();
  private prints=new Map<string,T.MeshStandardMaterial>();
  timber:HTMLImageElement|null=null;
  ownMaterial<M extends T.Material>(m: M): M { this.materials.add(m); return m; }
  ownTexture(t: T.Texture) { this.textures.add(t); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; }
  mesh(parent: T.Object3D, geometry: T.BufferGeometry, material: T.Material | T.Material[], p: number[] = [0,0,0]) {
    this.geometries.add(geometry);
    const mesh = new T.Mesh(geometry, material); mesh.position.set(p[0],p[1],p[2]);
    mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  material(color: string, kind = 'paper') {
    const key = color+kind; if (this.cache.has(key)) return this.cache.get(key)!;
    if(this.illustrated){
      const pigment=new T.Color(color),hsl={h:0,s:0,l:0};pigment.getHSL(hsl);
      if(kind==='wood')pigment.setHSL(.065,Math.min(hsl.s,.5),Math.max(.12,hsl.l+.015));
      const mat=this.ownMaterial(new T.MeshStandardMaterial({color:pigment,roughness:1,metalness:0,emissive:pigment,emissiveIntensity:.10,envMapIntensity:.10}));
      // Fine printed strokes belong to the material, so grain follows the same geometry
      // through both close-ups and wall turns without extra image downloads.
      mat.onBeforeCompile=shader=>{
        shader.vertexShader='varying vec2 paperUV;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\n paperUV=uv;');
        shader.fragmentShader='varying vec2 paperUV; float paperHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
          float detailFade=clamp(1.-max(fwidth(paperUV.x),fwidth(paperUV.y))*150.,0.,1.);
          float fiber=paperHash(floor(paperUV*650.));
          diffuseColor.rgb*=1.-fiber*.035*detailFade;
          ${kind==='wood'?`float band=paperUV.x*27.+sin(paperUV.y*9.+floor(paperUV.x*27.))*.16;
            float line=1.-smoothstep(.025,.065,abs(fract(band)-.5));
            float broken=smoothstep(.2,.4,sin(paperUV.y*17.+floor(band)*4.3)*.5+.5);
            diffuseColor.rgb*=1.-line*broken*.17*detailFade;`:''}
        `);
      };mat.customProgramCacheKey=()=> 'storybook-printed-'+kind;
      this.cache.set(key,mat);return mat;
    }
    const c=document.createElement('canvas');const resolution=kind==='wood'||kind==='cloth'?512:256;c.width=c.height=resolution;const x=c.getContext('2d')!;x.scale(resolution/1024,resolution/1024);
    x.fillStyle=color; x.fillRect(0,0,1024,1024); let seed=815;
    const rand=()=>{seed=(seed*16807)%2147483647; return seed/2147483647;};
    for(let i=0;i<24000;i++){x.fillStyle=i%3?'#f8eed41b':'#231d1926'; x.fillRect(rand()*1024,rand()*1024,.5+rand()*2,.5+rand()*2);}
    if(kind==='wood'&&this.timber){x.globalCompositeOperation='soft-light';x.globalAlpha=.85;x.drawImage(this.timber,0,0,1024,1024);x.globalAlpha=1;x.globalCompositeOperation='source-over';}
    if(kind==='wood'){
      for(let i=0;i<110;i++){const y=rand()*512;x.strokeStyle=i%3?'#1d171733':'#f1c48524';x.lineWidth=.3+rand()*1.4;x.beginPath();x.moveTo(0,y);x.bezierCurveTo(150,y-8,330,y+8,512,y);x.stroke();}
      for(let i=0;i<24;i++){x.fillStyle='#ddbb832e';x.fillRect(rand()*512,rand()*512,20+rand()*90,1+rand()*4);}
    }
    if(kind==='cloth')for(let i=0;i<1024;i+=5){x.fillStyle=i%10?'#19181318':'#fff8e028';x.fillRect(i,0,1,1024);x.fillRect(0,i,1024,1);}
    if(kind==='stone')for(let i=0;i<70;i++){x.strokeStyle='#e5e2ce24';x.lineWidth=1+rand()*2;x.beginPath();const y=rand()*1024;x.moveTo(0,y);x.bezierCurveTo(280,y+60,710,y-50,1024,y+18);x.stroke();}
    let bump=this.bumps.get(kind);if(!bump){bump=this.ownTexture(new T.CanvasTexture(c));bump.colorSpace=T.NoColorSpace;this.bumps.set(kind,bump);}
    const mat=this.ownMaterial(new T.MeshStandardMaterial({map:this.ownTexture(new T.CanvasTexture(c)),bumpMap:bump,bumpScale:kind==='wood'?.028:kind==='stone'?.025:kind==='cloth'?.008:.004,roughness:kind==='metal'?.36:kind==='ceramic'?.28:.86,metalness:kind==='metal'?.72:0,envMapIntensity:kind==='ceramic'?.8:.28}));
    if(kind==='ceramic'){const glaze=this.ownMaterial(new T.MeshPhysicalMaterial({map:mat.map,bumpMap:mat.bumpMap,bumpScale:.004,clearcoat:.5,clearcoatRoughness:.24,roughness:.4,envMapIntensity:1.2}));this.cache.set(key,glaze);return glaze;}
    this.cache.set(key,mat); return mat;
  }
  box(parent:T.Object3D, size:number[], p:number[], color:string, kind='paper') {
    const geo=kind==='wood'||kind==='stone'?new RoundedBoxGeometry(size[0],size[1],size[2],1,Math.min(...size)*.14):new T.BoxGeometry(size[0],size[1],size[2]);
    // Align longitudinal grain to the long axis of each timber, including horizontal rails.
    if(kind==='wood'&&size[0]>size[1]){const uv=geo.getAttribute('uv');for(let i=0;i<uv.count;i++){const a=uv.getX(i);uv.setXY(i,uv.getY(i),1-a);}}
    return this.mesh(parent,geo,this.material(color,kind),p);
  }
  shape(parent:T.Object3D, points:number[][], p:number[], color:string, depth=.045) {
    const s=new T.Shape();points.forEach((a,i)=>i?s.lineTo(a[0],a[1]):s.moveTo(a[0],a[1]));s.closePath();
    return this.mesh(parent,new T.ExtrudeGeometry(s,{depth,bevelEnabled:false}),this.illustrated?this.material(color):[this.material(color),this.material('#ccba98')],p);
  }
  cylinder(parent:T.Object3D, radius:number, height:number, p:number[], color:string, sides=32,kind='paper') {
    return this.mesh(parent,new T.CylinderGeometry(radius,radius*.96,height,sides),this.material(color,kind),p);
  }
  line(parent:T.Object3D, points:T.Vector3[], color:string, radius=.018) {
    return this.mesh(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points),24,radius,5,false),this.material(color));
  }
  sign(parent:T.Object3D, text:string, w:number, h:number, p:number[], bg:string, ink:string, small='') {
    const c=document.createElement('canvas');c.width=this.mobile?512:1536;c.height=Math.round(c.width*h/w);const x=c.getContext('2d')!;
    x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);
    x.strokeStyle=ink;x.globalAlpha=.5;x.lineWidth=3;x.strokeRect(15,15,c.width-30,c.height-30);x.globalAlpha=1;
    x.textAlign='center';x.textBaseline='middle';x.fillStyle=ink;
    x.font=`${c.height*(small?.47:.68)}px "STKaiti","KaiTi",serif`;
    if(text.includes('\n')){const lines=text.split('\n');x.font=`${Math.min(c.width*.66,c.height/(lines.length+1))}px "STKaiti","KaiTi",serif`;lines.forEach((line,i)=>x.fillText(line,c.width/2,c.height*(i+1)/(lines.length+1),c.width*.9));}
    else x.fillText(text,c.width/2,c.height*(small?.43:.51),c.width*.9);
    if(small){x.font=`${c.height*.12}px "Microsoft YaHei",sans-serif`;x.fillText(small,c.width/2,c.height*.82,c.width*.9);}
    const front=this.ownMaterial(new T.MeshStandardMaterial({map:this.ownTexture(new T.CanvasTexture(c)),roughness:1}));
    const edge=this.material('#b9a17c');return this.mesh(parent,new T.BoxGeometry(w,h,h<.4?.008:.04),[edge,edge,edge,edge,front,edge],p);
  }
  async image(url:string) {
    const img=new Image();img.src=sceneImageUrl(url,this.mobile);await img.decode();this.onImageLoaded?.(++this.loadedImages);return img;
  }
  print(parent:T.Object3D, image:HTMLImageElement, w:number, h:number, p:number[], cutout=false,atlas=false) {
    let material=!cutout&&!atlas?this.prints.get(image.src):undefined;
    if(!material){
      const texture=this.ownTexture(new T.Texture(image));texture.needsUpdate=true;
      if(atlas){texture.repeat.set(1/3,1/2);texture.offset.set(0,1/2);}
      material=this.ownMaterial(new T.MeshStandardMaterial({map:texture,alphaTest:cutout?.7:0,side:T.DoubleSide,roughness:.92,emissive:'#ffffff',emissiveMap:texture,emissiveIntensity:this.illustrated?.28:.12}));
      if(!cutout&&!atlas)this.prints.set(image.src,material);
    }
    let geo:T.BufferGeometry;
    if(cutout){
      // Trace the actual alpha silhouette. The retained contour is geometry, not a rectangular billboard.
      const c=document.createElement('canvas');c.width=160;c.height=Math.round(160*(image.height/(atlas?2:1))/(image.width/(atlas?3:1)));
      const x=c.getContext('2d',{willReadFrequently:true})!;x.drawImage(image,0,0,image.width/(atlas?3:1),image.height/(atlas?2:1),0,0,c.width,c.height);
      const data=x.getImageData(0,0,c.width,c.height).data,left:number[][]=[],right:number[][]=[];
      for(let y=0;y<c.height;y+=2){let a=-1,b=-1;for(let xx=0;xx<c.width;xx++)if(data[(y*c.width+xx)*4+3]>180){if(a<0)a=xx;b=xx;}
        if(a>=0){left.push([(a/c.width-.5)*w,(.5-y/c.height)*h]);right.push([((b+1)/c.width-.5)*w,(.5-y/c.height)*h]);}}
      if(left.length<3)throw new Error('透明素材缺少有效轮廓');
      const s=new T.Shape();[...left,...right.reverse()].forEach(([a,b],i)=>i?s.lineTo(a,b):s.moveTo(a,b));s.closePath();
      geo=new T.ExtrudeGeometry(s,{depth:.035,bevelEnabled:false});const positions=geo.getAttribute('position'),uv=geo.getAttribute('uv');
      for(let i=0;i<positions.count;i++)uv.setXY(i,positions.getX(i)/w+.5,positions.getY(i)/h+.5);
      return this.mesh(parent,geo,[material,this.material('#e3d1b2')],p);
    }
    geo=new T.PlaneGeometry(w,h);return this.mesh(parent,geo,material,p);
  }
  portraitFrames(mesh:T.Mesh,frames:HTMLImageElement[],young=false){
    const mat=(mesh.material as T.MeshStandardMaterial[])[0];
    const textures=[mat.map!,...frames.map(img=>{const t=this.ownTexture(new T.Texture(img));t.needsUpdate=true;return t;})];
    const from={value:textures[0]},to={value:textures[0]},blend={value:0},blink={value:0},eyes={value:textures[5]};
    // Generated art only enters small mouth/eyelid masks, never the face outline or body.
    mat.emissiveMap=null;mat.emissive.set(0);mat.emissiveIntensity=0;
    mat.onBeforeCompile=shader=>{
      Object.assign(shader.uniforms,{mouthFrom:from,mouthTo:to,mouthBlend:blend,eyeFrame:eyes,eyeBlend:blink});
      shader.fragmentShader='uniform sampler2D mouthFrom; uniform sampler2D mouthTo; uniform sampler2D eyeFrame; uniform float mouthBlend; uniform float eyeBlend;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
        vec2 mouthUV=(vMapUv-vec2(${young?'.602,.780':'.564,.762'}))/vec2(.075,.034);
        float mouthMask=1.0-smoothstep(.70,1.0,length(mouthUV));
        vec3 mouth=mix(texture2D(mouthFrom,vMapUv).rgb,texture2D(mouthTo,vMapUv).rgb,mouthBlend);
        diffuseColor.rgb=mix(diffuseColor.rgb,mouth,mouthMask);
        vec2 eyeA=(vMapUv-vec2(${young?'.571,.849':'.549,.834'}))/vec2(.062,.026);
        vec2 eyeB=(vMapUv-vec2(${young?'.654,.845':'.633,.823'}))/vec2(.040,.023);
        float eyeMask=max(1.-smoothstep(.65,1.,length(eyeA)),1.-smoothstep(.65,1.,length(eyeB)))*eyeBlend;
        diffuseColor.rgb=mix(diffuseColor.rgb,texture2D(eyeFrame,vMapUv).rgb,eyeMask);`);
    };
    mat.customProgramCacheKey=()=>young?'portrait-young-v3':'portrait-older-v3';
    return (a:number,b:number,mix:number,blinkAmount:number)=>{from.value=textures[a];to.value=textures[b];blend.value=mix;blink.value=blinkAmount;};
  }
  portraitAtlas(mesh:T.Mesh,younger=false,profile?:{key:string;offsets:number[][];size:number;mouth:number[];eyes:number[];mouthRadius:number[];eyesRadius:number[]}){
    const mat=(mesh.material as T.MeshStandardMaterial[])[0],a={value:0},b={value:0},blend={value:0},blink={value:0};
    mat.emissiveMap=null;mat.emissive.set('#534738');mat.emissiveIntensity=.12;
    mat.onBeforeCompile=shader=>{
      const offsets=(profile?.offsets??(younger?[[0,0],[363,0],[725,0],[0,627],[362,627],[725,627]]:[[0,0],[382,0],[765,0],[0,622],[382,623],[765,622]])).map(([x,y])=>new T.Vector2(x/(profile?.size??1254),-y/(profile?.size??1254)));
      Object.assign(shader.uniforms,{mouthA:a,mouthB:b,mouthBlend:blend,blinkAmount:blink,frameOffsets:{value:offsets},mouthCenter:{value:new T.Vector2(...(profile?.mouth??[younger?.718:.677,younger?.848:.812]) as [number,number])},eyesCenter:{value:new T.Vector2(...(profile?.eyes??[younger?.70:.68,younger?.881:.849]) as [number,number])}});
      shader.fragmentShader=`uniform float mouthA;uniform float mouthB;uniform float mouthBlend;uniform float blinkAmount;
        uniform vec2 frameOffsets[6];uniform vec2 mouthCenter;uniform vec2 eyesCenter;
        vec2 cellUV(vec2 uv,float id){return uv*vec2(1./3.,.5)+vec2(0.,.5)+frameOffsets[int(id)];}
        `+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
        vec2 localUV=(vMapUv-vec2(0.,.5))*vec2(3.,2.);
        float mouthMask=1.-smoothstep(.7,1.,length((localUV-mouthCenter)/vec2(${profile?.mouthRadius.join(',')??'.048,.025'})));
        vec3 lips=mix(texture2D(map,cellUV(localUV,mouthA)).rgb,texture2D(map,cellUV(localUV,mouthB)).rgb,mouthBlend);
        diffuseColor.rgb=mix(diffuseColor.rgb,lips,mouthMask);
        float eyesMask=(1.-smoothstep(.7,1.,length((localUV-eyesCenter)/vec2(${profile?.eyesRadius.join(',')??'.077,.024'}))))*blinkAmount;
        diffuseColor.rgb=mix(diffuseColor.rgb,texture2D(map,cellUV(localUV,5.)).rgb,eyesMask);`);
    };mat.customProgramCacheKey=()=> 'storybook-portrait-atlas-v2'+(profile?.key??'');
    return (from:number,to:number,mix:number,eyes:number)=>{a.value=from;b.value=to;blend.value=mix;blink.value=eyes;};
  }
  batchStatic(parent:T.Object3D){
    // Merge only static single-material siblings. Animated groups and printed cutouts keep their identities.
    for(const child of [...parent.children])if(child instanceof T.Group)this.batchStatic(child);
    const buckets=new Map<string,T.Mesh[]>();
    for(const child of parent.children){
      if(!(child instanceof T.Mesh)||!(child.material instanceof T.MeshStandardMaterial))continue;
      const key=child.material.uuid+'-'+child.castShadow+'-'+child.receiveShadow;
      const list=buckets.get(key)||[];list.push(child);buckets.set(key,list);
    }
    for(const list of buckets.values()){
      if(list.length<3)continue;
      const geometries=list.map(m=>{m.updateMatrix();const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(m.matrix);return g;});
      const merged=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());if(!merged)continue;
      const mesh=this.mesh(parent,merged,list[0].material);mesh.castShadow=list[0].castShadow;mesh.receiveShadow=list[0].receiveShadow;mesh.name='batched-paper-parts';
      list.forEach(m=>parent.remove(m));
    }
  }
  /** Flatten static scenery across room groups; animated paper actors retain their parents. */
  batchScenery(parent:T.Object3D){
    parent.updateWorldMatrix(true,true);const inverse=parent.matrixWorld.clone().invert();
    const buckets=new Map<string,T.Mesh[]>();
    const visit=(object:T.Object3D)=>{
      if(object.userData.animationRoot)return;
      if(object instanceof T.Mesh&&object.material instanceof T.MeshStandardMaterial&&!object.userData.noAO){
        const key=object.material.uuid+'-'+object.castShadow+'-'+object.receiveShadow;
        const list=buckets.get(key)||[];list.push(object);buckets.set(key,list);
      }
      object.children.forEach(visit);
    };parent.children.forEach(visit);
    for(const list of buckets.values()){
      if(list.length<2)continue;
      const pieces=list.map(m=>{const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,m.matrixWorld));return g;});
      const geometry=mergeGeometries(pieces,false);pieces.forEach(g=>g.dispose());if(!geometry)continue;
      const merged=this.mesh(parent,geometry,list[0].material);merged.castShadow=list[0].castShadow;merged.receiveShadow=list[0].receiveShadow;merged.name='neighborhood-static-batch';list.forEach(m=>m.removeFromParent());
    }
  }
  inkContours(parent:T.Object3D){
    // Mobile keeps SceneFinish's painted edge pass; avoid constructing a second
    // full set of topology-derived lines before the street can become interactive.
    if(this.mobile)return;
    const ink=this.ownMaterial(new T.LineBasicMaterial({color:'#574e44',transparent:true,opacity:.53,depthWrite:false}));
    const meshes:T.Mesh[]=[];parent.traverse(o=>{if(o instanceof T.Mesh&&o.material instanceof T.MeshStandardMaterial&&!o.material.map&&!o.userData.noAO)meshes.push(o);});
    for(const mesh of meshes){const geo=new T.EdgesGeometry(mesh.geometry,32);this.geometries.add(geo);const line=new T.LineSegments(geo,ink);line.userData.noAO=true;line.renderOrder=1;mesh.add(line);}
  }
  dispose(){this.geometries.forEach(g=>g.dispose());this.materials.forEach(m=>m.dispose());this.textures.forEach(t=>t.dispose());}
}
