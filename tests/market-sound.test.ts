import test from 'node:test';
import assert from 'node:assert/strict';
import {marketSoundMix,acousticSource,type MarketSoundFrame} from '../src/street/marketSoundModel.ts';
const street:MarketSoundFrame={progress:0,era:0,camera:{position:{x:0,y:2.45,z:11},right:{x:1,y:0,z:0}},bicycle:null};
test('05:00 has the supplied opening bed and no busy market or unopened frying',()=>{
 const g=marketSoundMix(street).gains;assert.ok(g.dawn>.3);for(const id of ['past','present','doupi','mianwo','bicycle'] as const)assert.equal(g[id],0);
});
test('morning density fades from opening sound into the matching old or modern environment',()=>{
 const old=marketSoundMix({...street,progress:1}).gains,now=marketSoundMix({...street,progress:1,era:1}).gains;
 assert.equal(old.dawn,0);assert.ok(old.past>.25);assert.equal(old.present,0);assert.equal(now.past<1e-12,true);assert.ok(now.present>.25);
 let previous=0;for(let i=0;i<=100;i++){const current=marketSoundMix({...street,progress:i/100}).gains.past;assert.ok(current>=previous-1e-9);previous=current;}
});
test('the wall-turn midpoint contains both eras with an equal-power blend and no hard switch',()=>{
 const a=marketSoundMix({...street,progress:1,era:.499}).gains,b=marketSoundMix({...street,progress:1,era:.501}).gains,m=marketSoundMix({...street,progress:1,era:.5}).gains;
 assert.ok(m.past>0&&m.present>0);assert.ok(Math.abs(m.past-m.present)<1e-12);assert.ok(Math.abs(a.past-b.past)<.002);assert.ok(Math.abs(a.present-b.present)<.002);
});
test('a closed stall stays silent even when the camera is directly at its counter',()=>{
 const near={position:{x:5.8,y:2.45,z:3},right:{x:0,y:0,z:1}};
 assert.equal(marketSoundMix({...street,progress:.159,camera:near}).gains.doupi,0);
 assert.ok(marketSoundMix({...street,progress:.195,camera:near}).gains.doupi>.57);
 const west={position:{x:-5.8,y:2.45,z:-6},right:{x:0,y:0,z:1}};
 assert.equal(marketSoundMix({...street,progress:.299,camera:west}).gains.mianwo,0);
 assert.ok(marketSoundMix({...street,progress:.335,camera:west}).gains.mianwo>.57);
});
test('walking closer increases the correct food sound and a far-away stall cannot play in your ear',()=>{
 const near=marketSoundMix({...street,progress:1,camera:{position:{x:-3.2,y:2.45,z:-5},right:{x:0,y:0,z:1}}}).gains;
 const far=marketSoundMix({...street,progress:1,camera:{position:{x:0,y:2.45,z:-30},right:{x:1,y:0,z:0}}}).gains;
 assert.ok(near.mianwo>near.doupi*3);assert.ok(near.mianwo>.4);assert.equal(far.mianwo,0);assert.equal(far.doupi,0);
});
test('turning the camera reverses the perceived side without changing distance or recipe',()=>{
 const source={x:5,y:1.7,z:0},position={x:0,y:2.45,z:0};
 const a=acousticSource(source,{position,right:{x:1,y:0,z:0}}),b=acousticSource(source,{position,right:{x:-1,y:0,z:0}});
 assert.equal(a.gain,b.gain);assert.ok(a.pan>.8);assert.ok(b.pan<-.8);
});
test('bicycle sound requires a moving visible event and fades out of the present era',()=>{
 const bicycle={id:1,elapsed:3,position:{x:0,y:1.1,z:7},moving:true,visibility:1};
 assert.equal(marketSoundMix(street).gains.bicycle,0);assert.ok(marketSoundMix({...street,bicycle}).gains.bicycle>.2);
 assert.equal(marketSoundMix({...street,bicycle:{...bicycle,moving:false}}).gains.bicycle,0);
 assert.equal(marketSoundMix({...street,bicycle:{...bicycle,visibility:0}}).gains.bicycle,0);
 assert.ok(marketSoundMix({...street,bicycle,era:1}).gains.bicycle<1e-12);
});
test('dragging time backwards closes the correct cooking layer and bounded mixes remain finite',()=>{
 const camera={position:{x:5.8,y:2.45,z:3},right:{x:1,y:0,z:0}};
 assert.ok(marketSoundMix({...street,camera,progress:1}).gains.doupi>0);assert.equal(marketSoundMix({...street,camera,progress:0}).gains.doupi,0);
 for(const progress of [-100,0,.3,1,Infinity,NaN])for(const era of [-1,0,.5,1,Infinity,NaN])for(const value of Object.values(marketSoundMix({...street,progress,era}).gains))assert.ok(Number.isFinite(value)&&value>=0&&value<=.58);
});

