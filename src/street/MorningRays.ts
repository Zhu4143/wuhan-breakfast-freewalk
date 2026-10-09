import * as T from 'three';
import {PaperWorkshop} from '../atelier/PaperWorkshop';
/** Restrained painted light shafts sit in world space and depth-test against buildings. */
export class MorningRays{
 private materials:T.ShaderMaterial[]=[];
 constructor(w:PaperWorkshop,parent:T.Group){
  for(const [x,z,width] of [[2,-20,.8],[-2,-9,.52],[1.5,3,.65]]){
   const top=new T.Vector3(x+3,10.3,z-12),bottom=new T.Vector3(x,.08,z+9),side=new T.Vector3(width,0,.1);
   const a=top.clone().sub(side.clone().multiplyScalar(.35)),b=top.clone().add(side.clone().multiplyScalar(.35)),c=bottom.clone().sub(side),d=bottom.clone().add(side);
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([...a.toArray(),...c.toArray(),...b.toArray(),...b.toArray(),...c.toArray(),...d.toArray()],3));geo.setAttribute('uv',new T.Float32BufferAttribute([0,1,0,0,1,1,1,1,0,0,1,0],2));geo.computeVertexNormals();
   const mat=w.ownMaterial(new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{time:{value:0},strength:{value:.075}},vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 v;uniform float time;uniform float strength;
    void main(){float sides=pow(max(0.,sin(v.x*3.14159)),2.);float ends=smoothstep(0.,.18,v.y)*(1.-smoothstep(.68,1.,v.y));float breath=.91+.09*sin(time*.18+v.y*4.);gl_FragColor=vec4(1.,.79,.40,sides*ends*strength*breath);}` }));
   const mesh=w.mesh(parent,geo,mat);mesh.castShadow=false;mesh.receiveShadow=false;mesh.userData.noAO=true;mesh.renderOrder=1;this.materials.push(mat);
  }
 }
 update(time:number,dawn:number){this.materials.forEach(m=>{m.uniforms.time.value=time;m.uniforms.strength.value=T.MathUtils.smoothstep(dawn,.12,.5)*(.09-dawn*.035);});}
}
