import * as T from 'three';

/**
 * Realistic look mode for the atelier scene.
 *
 * The paper-diorama look is not a lighting problem, it is a material problem. PaperWorkshop's
 * painted branch forces roughness 1, metalness 0 and envMapIntensity 0.10 on every surface and
 * then multiplies the albedo by a printed-fibre pattern; the printed images additionally carry
 * an emissive term. The result reads as matte printed paper no matter how good the lighting is.
 *
 * Enabling this swaps in physical values, drops the emissive term, skips the ink contours, and
 * lights the scene with a real environment map instead of a neutral procedural room.
 *
 * Everything here is opt-in; with enabled false the scene renders exactly as before.
 */
export type RealismOptions = {
  enabled: boolean;
  /** Equirectangular HDR under BASE_URL, or '' to keep the procedural room environment. */
  environment: string;
  /** scene.environmentIntensity. The painted set uses 0.42, which barely lights anything. */
  environmentIntensity: number;
  sunIntensity: number;
  fillIntensity: number;
  /** Hemisphere fill. Realism wants the environment map to do this instead. */
  ambientIntensity: number;
};

/**
 * Defaults are deliberately much brighter than the painted set's. The paper look was partly
 * self-illuminated (every material carried emissiveIntensity 0.10 and every printed panel an
 * emissive map), so once that fake glow is removed the original light rig leaves the stall at
 * night. These values are what a real dawn key plus sky fill actually needs.
 */
const defaults:RealismOptions={enabled:false,environment:'assets/env/venetian-crossroads-512.hdr',
  environmentIntensity:1, sunIntensity:3.6, fillIntensity:.22, ambientIntensity:.28};

const numeric:Record<string,keyof Omit<RealismOptions,'enabled'|'environment'>>={
  envIntensity:'environmentIntensity',sun:'sunIntensity',fill:'fillIntensity',ambient:'ambientIntensity'};

/** Reads ?look=real&look.env=0&look.sun=2.5 from a location.search string. */
export function parseRealism(search:string):RealismOptions{
  const resolved={...defaults};
  if(!search)return resolved;
  const params=new URLSearchParams(search.replace(/^\?/,''));
  const look=params.get('look');
  if(look===null||look==='0'||look==='false'||look==='paper')return resolved;
  resolved.enabled=true;
  const environment=params.get('look.env');
  if(environment==='0'||environment==='off')resolved.environment='';
  else if(environment)resolved.environment=environment;
  for(const [key,field] of Object.entries(numeric)){
    // Number(null) is 0, so a missing parameter would otherwise zero every light in the scene.
    const raw=params.get('look.'+key);
    if(raw===null||raw==='')continue;
    const value=Number(raw);
    if(Number.isFinite(value))resolved[field]=value;
  }
  resolved.environmentIntensity=T.MathUtils.clamp(resolved.environmentIntensity,0,4);
  resolved.sunIntensity=T.MathUtils.clamp(resolved.sunIntensity,0,8);
  resolved.fillIntensity=T.MathUtils.clamp(resolved.fillIntensity,0,4);
  resolved.ambientIntensity=T.MathUtils.clamp(resolved.ambientIntensity,0,2);
  return resolved;
}
