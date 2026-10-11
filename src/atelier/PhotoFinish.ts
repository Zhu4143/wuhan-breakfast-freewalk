import * as T from 'three';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';

/**
 * Photographic finish for the paper diorama.
 *
 * The scene already renders correctly (ACES, MSAA, contact AO, PMREM, PCF shadows).
 * What it lacks is the camera: a real photograph of a paper miniature is sharp in the
 * middle, soft at the edges, slightly split-toned, grainy, and vignetted. This pass adds
 * that layer in display space, after the display transform, the way a capture LUT would.
 *
 * Everything here is opt-in. Nothing runs unless PhotoOptions.enabled is true.
 */
export type PhotoOptions = {
  enabled: boolean;
  /** Render scale multiplier on top of devicePixelRatio. 1 keeps the canvas as-is. */
  supersample: number;
  /** Film grain amount, 0.02-0.06 reads as photographic without looking noisy. */
  grain: number;
  vignette: number;
  /** Lateral chromatic aberration, in pixels at the corners. */
  aberration: number;
  /** Filmic S-curve strength. */
  contrast: number;
  /** Unsharp micro-contrast. Makes paper fibre and glaze read as texture, not as shading. */
  sharpen: number;
};

const numbers:Record<string,keyof Omit<PhotoOptions,'enabled'>>={ss:'supersample',grain:'grain',vignette:'vignette',ab:'aberration',contrast:'contrast',sharpen:'sharpen'};

/**
 * Reads ?photo=1&photo.grain=0.04&photo.ss=1.5 from a location.search string.
 * Absent or malformed values fall back to the defaults, so a bad URL never breaks the page.
 */
export function parsePhotoOptions(search:string):PhotoOptions{
  const resolved:PhotoOptions={enabled:false,supersample:1,grain:.035,vignette:.34,aberration:.55,contrast:.2,sharpen:.3};
  if(!search)return resolved;
  const params=new URLSearchParams(search.replace(/^\?/,''));
  const master=params.get('photo');
  if(master==='0'||master==='false')return resolved;
  if(master===null)return resolved;
  resolved.enabled=true;
  for(const [key,field] of Object.entries(numbers)){
    const raw=params.get('photo.'+key);
    if(raw===null)continue;
    const value=Number(raw);
    if(Number.isFinite(value))resolved[field]=value;
  }
  resolved.supersample=T.MathUtils.clamp(resolved.supersample,.75,2);
  resolved.grain=T.MathUtils.clamp(resolved.grain,0,.12);
  resolved.vignette=T.MathUtils.clamp(resolved.vignette,0,1);
  resolved.aberration=T.MathUtils.clamp(resolved.aberration,0,4);
  resolved.contrast=T.MathUtils.clamp(resolved.contrast,0,1);
  resolved.sharpen=T.MathUtils.clamp(resolved.sharpen,0,1);
  return resolved;
}

/**
 * Runs after OutputPass, so tDiffuse holds premultiplied display-referred colour.
 * Every sample is unpremultiplied before grading and re-premultiplied on output, which
 * keeps the transparent canvas working: nothing is written where alpha is zero.
 */
const lensShader={
  uniforms:{tDiffuse:{value:null},resolution:{value:new T.Vector2(1,1)},time:{value:0},
    grain:{value:.035},vignette:{value:.34},aberration:{value:.55},contrast:{value:.2},sharpen:{value:.3}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform sampler2D tDiffuse;uniform vec2 resolution;uniform float time;
    uniform float grain;uniform float vignette;uniform float aberration;uniform float contrast;uniform float sharpen;
    varying vec2 vUv;
    vec4 straight(vec2 uv){vec4 s=texture2D(tDiffuse,uv);return vec4(s.rgb/max(s.a,0.0001),s.a);}
    void main(){
      vec2 texel=1.0/resolution;vec2 dir=vUv-0.5;vec2 off=dir*dot(dir,dir)*aberration*6.0*texel;
      vec4 center=straight(vUv);
      // Sample each channel at its own radius: real glass does not focus every wavelength alike.
      vec3 col=vec3(straight(vUv+off).r,center.g,straight(vUv-off).b);
      vec4 up=straight(vUv+vec2(0.0,-texel.y*1.4)),down=straight(vUv+vec2(0.0,texel.y*1.4));
      vec4 left=straight(vUv+vec2(-texel.x*1.4,0.0)),right=straight(vUv+vec2(texel.x*1.4,0.0));
      col+=(col-(up.rgb+down.rgb+left.rgb+right.rgb)*0.25)*sharpen;
      col=clamp(col,0.0,1.0);
      col=mix(col,col*col*(3.0-2.0*col),contrast);
      // Split tone: shadows toward cool, highlights toward warm. Faint, but it removes the flat CG cast.
      float luma=dot(col,vec3(0.2126,0.7152,0.0722));
      col+=vec3(0.030,0.006,-0.026)*(1.0-luma)*0.7;
      col+=vec3(0.030,0.010,-0.020)*luma*0.7;
      col*=1.0-vignette*smoothstep(0.20,0.76,length(dir)*1.41421356);
      float noise=fract(sin(dot(vUv*resolution+time*vec2(37.0,17.0),vec2(12.9898,78.233)))*43758.5453);
      col+=(noise-0.5)*grain*(4.0*luma*(1.0-luma));
      gl_FragColor=vec4(clamp(col,0.0,1.0)*center.a,center.a);
    }`};

export function makeLensPass(options:PhotoOptions):ShaderPass{
  const pass=new ShaderPass(lensShader);
  pass.uniforms.grain.value=options.grain;
  pass.uniforms.vignette.value=options.vignette;
  pass.uniforms.aberration.value=options.aberration;
  pass.uniforms.contrast.value=options.contrast;
  pass.uniforms.sharpen.value=options.sharpen;
  return pass;
}
