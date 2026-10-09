import {mobileAssetManifest} from './mobileAssetManifest.ts';

export const mobileSceneQuery='(pointer: coarse), (max-width: 700px)';
export const isMobileScene=()=>typeof matchMedia==='function'&&matchMedia(mobileSceneQuery).matches;

/** Preserve the deployment base path; only known, packaged images get a mobile variant. */
export function sceneImageUrl(url:string,mobile:boolean){
  if(!mobile)return url;
  const index=url.lastIndexOf('assets/');
  if(index<0)return url;
  const replacement=mobileAssetManifest[url.slice(index+7)];
  return replacement?url.slice(0,index+7)+replacement:url;
}
