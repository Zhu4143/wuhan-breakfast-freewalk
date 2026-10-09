import {loopTrackIds,marketSoundMix,type LoopTrackId,type MarketSoundFrame,type SoundMix} from './marketSoundModel';
export type SoundState='off'|'loading'|'on'|'error';
type Voice={source:AudioBufferSourceNode;envelope:GainNode};
type Loop={gain:GainNode;pan:StereoPannerNode;buffer:AudioBuffer;next:number;overlap:number;voices:Set<Voice>};
type CueVoice=Voice&{id:number;offset:number;lastTime:number;moving:boolean};
const files=[...loopTrackIds,'bicycle'] as const;
const curve=(up:boolean)=>Float32Array.from({length:64},(_,i)=>Math.sin((up?i/63:1-i/63)*Math.PI/2));
/** One owner for decoded clips, scheduled overlaps, frame mixing and gesture/visibility lifetime. */
export class MarketSoundscape{
 private context:AudioContext|null=null;private master:GainNode|null=null;private compressor:DynamicsCompressorNode|null=null;
 private analyser:AnalyserNode|null=null;private samples=new Float32Array(1024);
 private buffers=new Map<string,AudioBuffer>();private loading:Promise<void>|null=null;private abort=new AbortController();
 private loops=new Map<LoopTrackId,Loop>();private bicycleGain:GainNode|null=null;private bicyclePan:StereoPannerNode|null=null;private cue:CueVoice|null=null;
 private wanted=false;private active=false;private ready=false;private disposed=false;private epoch=0;private life=0;
 private suspendTimer:number|undefined;private state:SoundState='off';private lastMeter=0;
 private frame:MarketSoundFrame={progress:0,era:0,camera:{position:{x:0,y:2.45,z:11},right:{x:1,y:0,z:0}},bicycle:null};
 constructor(private host:HTMLDivElement,private onState:(s:SoundState)=>void){
  document.addEventListener('visibilitychange',this.visibility);this.publish();
 }
 get enabled(){return this.wanted;}
 get audible(){return this.wanted&&this.ready&&this.active&&!document.hidden&&this.context?.state==='running';}
 private visibility=()=>{this.syncActivity();};
 private publish(){
  this.host.dataset.soundState=this.state;this.host.dataset.soundContext=this.context?.state??'uninitialized';
  this.host.dataset.soundActive=String(this.audible);this.host.dataset.soundTracks=String(this.buffers.size);
 }
 private change(state:SoundState){if(this.disposed)return;this.state=state;this.publish();this.onState(state);}
 private ensureContext(){
  if(this.context)return this.context;
  const context=new AudioContext();this.context=context;this.master=context.createGain();this.master.gain.value=0;
  this.compressor=context.createDynamicsCompressor();this.compressor.threshold.value=-5;this.compressor.knee.value=7;this.compressor.ratio.value=8;this.compressor.attack.value=.005;this.compressor.release.value=.2;
  this.analyser=context.createAnalyser();this.analyser.fftSize=2048;
  this.master.connect(this.compressor);this.compressor.connect(this.analyser);this.analyser.connect(context.destination);
  this.bicycleGain=context.createGain();this.bicycleGain.gain.value=0;this.bicyclePan=context.createStereoPanner();this.bicycleGain.connect(this.bicyclePan);this.bicyclePan.connect(this.master);
  context.onstatechange=()=>{if(!this.disposed)this.publish();};return context;
 }
 private async load(){
  const context=this.ensureContext();
  await Promise.all(files.map(async id=>{
   const response=await fetch(import.meta.env.BASE_URL+'assets/audio/market-v12/'+id+'.mp3',{signal:this.abort.signal});
   if(!response.ok)throw Error('Sound asset unavailable: '+id);
   const buffer=await context.decodeAudioData(await response.arrayBuffer());if(this.disposed)return;
   this.buffers.set(id,buffer);
  }));
  if(!this.disposed){this.ready=true;this.host.dataset.soundDecodedSeconds=[...this.buffers.values()].reduce((n,b)=>n+b.duration,0).toFixed(2);}
 }
 async setEnabled(enabled:boolean){
  if(this.disposed)return;this.wanted=enabled;const epoch=++this.epoch;
  if(!enabled){this.change('off');this.syncActivity();return;}
  this.change('loading');
  try{
   // Resume is invoked synchronously in the user's click, before any fetch/decode awaits.
   const context=this.ensureContext(),resume=context.resume();
   if(!this.loading)this.loading=this.load().catch(e=>{this.loading=null;throw e;});
   await Promise.all([resume,this.loading]);
   if(this.disposed||epoch!==this.epoch||!this.wanted)return;
   this.makeLoops();this.change('on');this.syncActivity();this.update(this.frame);
  }catch(e){
   if(this.disposed||epoch!==this.epoch)return;console.error(e);this.wanted=false;this.change('error');this.syncActivity();
  }
 }
 setActive(active:boolean){if(this.active===active)return;this.active=active;this.syncActivity();}
 private syncActivity(){
  if(this.disposed||!this.context||!this.master)return;
  const life=++this.life,context=this.context;window.clearTimeout(this.suspendTimer);
  const play=this.wanted&&this.ready&&this.active&&!document.hidden;
  this.master.gain.setTargetAtTime(play?.82:0,context.currentTime,.06);this.publish();
  if(play){
   void context.resume().then(()=>{if(this.disposed||life!==this.life)return;this.publish();}).catch(e=>{
    if(this.disposed||life!==this.life)return;console.error(e);this.wanted=false;this.change('error');this.syncActivity();
   });
  }else{
   this.stopCue();
   // Stop immediately on tab hide; fade the reversible cover/mute action before suspending.
   if(document.hidden)void context.suspend().catch(()=>{});
   else this.suspendTimer=window.setTimeout(()=>{if(!this.disposed&&life===this.life)void context.suspend().catch(()=>{});},180);
  }
 }
 private makeLoops(){
  if(this.loops.size||!this.context||!this.master)return;const c=this.context;
  for(const id of loopTrackIds){
   const gain=c.createGain(),pan=c.createStereoPanner(),buffer=this.buffers.get(id)!;gain.gain.value=0;gain.connect(pan);pan.connect(this.master!);
   this.loops.set(id,{gain,pan,buffer,next:c.currentTime+.03,overlap:id==='mianwo'?.55:id==='doupi'?1:1.4,voices:new Set()});
  }
 }
 private schedule(loop:Loop){
  const context=this.context!,now=context.currentTime;
  // While suspended, AudioContext time and all scheduled loop positions are frozen together.
  while(loop.next<=now+.30){
   const start=Math.max(loop.next,now+.006),end=start+loop.buffer.duration,fade=Math.min(loop.overlap,loop.buffer.duration/3);
   const source=context.createBufferSource(),envelope=context.createGain(),voice={source,envelope};source.buffer=loop.buffer;source.connect(envelope);envelope.connect(loop.gain);
   envelope.gain.setValueAtTime(0,start);envelope.gain.setValueCurveAtTime(curve(true),start,fade);
   envelope.gain.setValueAtTime(1,end-fade);envelope.gain.setValueCurveAtTime(curve(false),end-fade,fade);
   source.onended=()=>{source.disconnect();envelope.disconnect();loop.voices.delete(voice);};loop.voices.add(voice);source.start(start);source.stop(end+.005);
   loop.next=start+loop.buffer.duration-fade;
  }
 }
 private stopCue(){if(!this.cue)return;try{this.cue.source.stop();}catch{}this.cue.source.disconnect();this.cue.envelope.disconnect();this.cue=null;}
 private updateCue(mix:SoundMix){
  const cue=this.frame.bicycle,context=this.context!;
  if(!cue||cue.visibility<=.001){this.stopCue();return;}
  const now=context.currentTime,buffer=this.buffers.get('bicycle')!;
  if(cue.elapsed>=buffer.duration-.01){this.stopCue();return;}
  if(this.cue){
   const expected=this.cue.offset+(this.cue.moving?now-this.cue.lastTime:0);
   if(this.cue.id!==cue.id||Math.abs(expected-cue.elapsed)>.12)this.stopCue();
   else{this.cue.offset=expected;this.cue.lastTime=now;this.cue.moving=cue.moving;}
  }
  if(!this.cue){
   const source=context.createBufferSource(),envelope=context.createGain();source.buffer=buffer;envelope.gain.value=1;source.connect(envelope);envelope.connect(this.bicycleGain!);
   const voice:CueVoice={source,envelope,id:cue.id,offset:cue.elapsed,lastTime:now,moving:cue.moving};this.cue=voice;
   source.onended=()=>{source.disconnect();envelope.disconnect();if(this.cue===voice)this.cue=null;};source.start(now+.005,cue.elapsed);
  }
  this.cue.source.playbackRate.setValueAtTime(cue.moving?1:0,now);
  this.bicycleGain!.gain.setTargetAtTime(mix.gains.bicycle,now,.04);this.bicyclePan!.pan.setTargetAtTime(mix.pans.bicycle,now,.08);
 }
 update(frame:MarketSoundFrame){
  this.frame=frame;if(this.disposed)return;
  const mix=marketSoundMix(frame),on=this.audible;
  for(const [id,value] of Object.entries(mix.gains))this.host.setAttribute('data-sound-'+id,(on?value:0).toFixed(4));
  if(!on||!this.context){this.publish();return;}
  const now=this.context.currentTime;
  this.loops.forEach((loop,id)=>{this.schedule(loop);loop.gain.gain.setTargetAtTime(mix.gains[id],now,.16);if(id==='doupi'||id==='mianwo')loop.pan.pan.setTargetAtTime(mix.pans[id],now,.12);});
  this.updateCue(mix);
  if(this.analyser&&now-this.lastMeter>.20){
   this.lastMeter=now;this.analyser.getFloatTimeDomainData(this.samples);let energy=0,peak=0;
   for(const sample of this.samples){energy+=sample*sample;peak=Math.max(peak,Math.abs(sample));}
   this.host.dataset.soundRms=Math.sqrt(energy/this.samples.length).toFixed(5);this.host.dataset.soundPeak=peak.toFixed(5);
   this.host.dataset.soundVoices=String([...this.loops.values()].reduce((n,l)=>n+l.voices.size,0)+(this.cue?1:0));
  }
  this.publish();
 }
 dispose(){
  if(this.disposed)return;this.disposed=true;this.wanted=false;++this.epoch;++this.life;this.abort.abort();window.clearTimeout(this.suspendTimer);
  document.removeEventListener('visibilitychange',this.visibility);this.stopCue();
  this.loops.forEach(l=>{l.voices.forEach(v=>{try{v.source.stop();}catch{}v.source.disconnect();v.envelope.disconnect();});l.gain.disconnect();l.pan.disconnect();});this.loops.clear();this.buffers.clear();
  this.master?.disconnect();this.compressor?.disconnect();this.analyser?.disconnect();this.bicycleGain?.disconnect();this.bicyclePan?.disconnect();if(this.context){this.context.onstatechange=null;void this.context.close().catch(()=>{});}
 }
}

