import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CultureVoice} from '../src/street/CultureVoice.ts';
const fake=()=>({src:'',paused:false,loads:0,play:()=>Promise.resolve(),pause(){this.paused=true;},removeAttribute(name:string){if(name==='src')this.src='';},load(){this.loads++;}});
test('no audio creates no media element and never prevents text-only dialogue',()=>{
 let creates=0;const voice=new CultureVoice(()=>{creates++;return fake();});voice.play();voice.stop();assert.equal(creates,0);
});
test('next reply, era change and exit stop and release the preceding clip',()=>{
 const clips:ReturnType<typeof fake>[]=[];const voice=new CultureVoice(()=>{const clip=fake();clips.push(clip);return clip;});
 voice.play('first.mp3');voice.play('second.mp3');assert.equal(clips[0].paused,true);assert.equal(clips[0].src,'');assert.equal(clips[0].loads,1);assert.equal(clips[1].src,'second.mp3');
 voice.play();assert.equal(clips[1].paused,true);assert.equal(clips.length,2);voice.stop();assert.equal(clips[1].loads,1);
});
test('a late rejection from an old reply cannot stop the new voice',async()=>{
 let rejectFirst!:(reason:Error)=>void,creates=0,failures=0;const first=fake(),second=fake();first.play=()=>new Promise((_resolve,reject)=>{rejectFirst=reject;});
 const voice=new CultureVoice(()=>++creates===1?first:second,()=>failures++);voice.play('first.mp3');voice.play('second.mp3');rejectFirst(new Error('late rejection'));await Promise.resolve();
 assert.equal(second.paused,false);assert.equal(second.src,'second.mp3');assert.equal(failures,0);voice.stop();
});
test('unavailable audio releases itself and reports one failure while text can continue',async()=>{
 const clip=fake();clip.play=()=>Promise.reject(new Error('missing file'));let failures=0;
 const voice=new CultureVoice(()=>clip,()=>failures++);voice.play('missing.mp3');await Promise.resolve();assert.equal(clip.paused,true);assert.equal(clip.src,'');assert.equal(failures,1);
});
