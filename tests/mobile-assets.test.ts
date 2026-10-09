import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {sceneImageUrl} from '../src/atelier/sceneAssets.ts';
import {mobileAssetManifest} from '../src/atelier/mobileAssetManifest.ts';

test('mobile scene images preserve the base URL and have actual lighter packaged derivatives',()=>{
 const rows=JSON.parse(readFileSync(new URL('../docs/mobile-assets.json',import.meta.url),'utf8')) as {original:string;mobile:string;originalBytes:number;mobileBytes:number;originalPixels:number;mobilePixels:number}[];
 assert.ok(rows.length>30);
 for(const row of rows){
  assert.equal(mobileAssetManifest[row.original],row.mobile);
  assert.equal(sceneImageUrl('/wuhan-breakfast-freewalk/assets/'+row.original,true),'/wuhan-breakfast-freewalk/assets/'+row.mobile);
  assert.equal(sceneImageUrl('assets/'+row.original,false),'assets/'+row.original);
  assert.ok(existsSync(new URL('../public/assets/'+row.mobile,import.meta.url)));
  assert.ok(row.mobilePixels<=row.originalPixels);
 }
 assert.ok(rows.reduce((n,r)=>n+r.mobileBytes,0)<rows.reduce((n,r)=>n+r.originalBytes,0)*.3);
 assert.equal(sceneImageUrl('/assets/unlisted.png',true),'/assets/unlisted.png');
 assert.equal(sceneImageUrl('data:image/png;base64,AA',true),'data:image/png;base64,AA');
});
