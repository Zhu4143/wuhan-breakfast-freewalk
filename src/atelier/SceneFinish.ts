import * as T from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {type PhotoOptions,makeLensPass} from './PhotoFinish';

class ContactPass extends SSAOPass{
  private excluded:T.Object3D[]=[];
  render(...args:Parameters<SSAOPass['render']>){
    this.scene.traverse(o=>{if(o.visible&&o.userData.noAO){o.visible=false;this.excluded.push(o);}});
    try{super.render(...args);}finally{this.excluded.forEach(o=>o.visible=true);this.excluded=[];}
  }
}
/** Real geometry contact shadows, linear-light composition, then one display transform. */
export class SceneFinish{
  private composer:EffectComposer;private ao:ContactPass;private output=new OutputPass();
  private ink:ShaderPass|null=null;private lens:ShaderPass|null=null;
  constructor(private renderer:T.WebGLRenderer,scene:T.Scene,camera:T.PerspectiveCamera,illustrated=false,photo?:PhotoOptions){
    const target=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,samples:4});
    this.composer=new EffectComposer(renderer,target);
    // MSAA resolves edge coverage in linear light. Unpremultiply before the display
    // transform, then restore premultiplication for the transparent browser canvas.
    this.output.material.fragmentShader=this.output.material.fragmentShader
      .replace('gl_FragColor = texture2D( tDiffuse, vUv );','gl_FragColor = texture2D( tDiffuse, vUv ); gl_FragColor.rgb /= max(gl_FragColor.a, 0.0001);')
      .replace('#endif\n\n\t\t}', '#endif\n gl_FragColor.rgb *= gl_FragColor.a;\n\t\t}');
    this.composer.addPass(new RenderPass(scene,camera));
    this.ao=new ContactPass(scene,camera,1,1,16);this.ao.kernelRadius=.36;this.ao.minDistance=.001;this.ao.maxDistance=.075;
    this.composer.addPass(this.ao);
    if(illustrated){
      this.ao.kernelRadius=.20;
      this.ink=new ShaderPass({uniforms:{tDiffuse:{value:null},normals:{value:this.ao.normalRenderTarget.texture},resolution:{value:new T.Vector2(1,1)}},
        vertexShader:'varying vec2 uvInk;void main(){uvInk=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader:`uniform sampler2D tDiffuse;uniform sampler2D normals;uniform vec2 resolution;varying vec2 uvInk;
          void main(){vec4 color=texture2D(tDiffuse,uvInk);vec2 px=1.1/resolution;
            vec3 n=texture2D(normals,uvInk).rgb;
            float edge=length(n-texture2D(normals,uvInk+vec2(px.x,0.)).rgb)+length(n-texture2D(normals,uvInk+vec2(0.,px.y)).rgb);
            float ink=smoothstep(.25,.75,edge)*.58;
            color.rgb=mix(color.rgb,vec3(.12,.10,.082)*color.a,ink);gl_FragColor=color;
          }`});this.composer.addPass(this.ink);
    }
    this.composer.addPass(this.output);
    // Grading belongs after the display transform, so the lens pass is appended last and
    // works on the same premultiplied output the browser composites.
    if(photo?.enabled){this.lens=makeLensPass(photo);this.composer.addPass(this.lens);}
  }
  resize(w:number,h:number){
    // The renderer draws at devicePixelRatio, so the whole post chain must run at drawing-buffer
    // size. Setting the composer to CSS pixels rendered every pass at less than canvas resolution
    // on HiDPI screens and scaled Windows displays, then stretched the result back up.
    const buffer=this.renderer.getDrawingBufferSize(new T.Vector2());
    const width=buffer.x||w,height=buffer.y||h;
    this.composer.setSize(width,height);
    this.ink?.uniforms.resolution.value.set(this.ao.width,this.ao.height);
    this.lens?.uniforms.resolution.value.set(width,height);
  }
  render(){if(this.lens)this.lens.uniforms.time.value=(performance.now()*.001)%1000;this.composer.render();}
  dispose(){this.lens?.dispose();this.ink?.dispose();this.ao.dispose();this.ao.ssaoMaterial.dispose();this.ao.noiseTexture.dispose();this.output.dispose();this.composer.dispose();}
}
