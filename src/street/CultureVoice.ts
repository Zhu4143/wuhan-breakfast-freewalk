type VoiceClip={src:string;play:()=>Promise<void>;pause:()=>void;removeAttribute:(name:string)=>void;load:()=>void};

/** Only the current reply owns a clip. Ambient sound remains owned by MarketSoundscape. */
export class CultureVoice{
 private clip:VoiceClip|null=null;
 private create:()=>VoiceClip;private unavailable:()=>void;
 constructor(create:()=>VoiceClip=()=>new Audio(),unavailable:()=>void=()=>{}){this.create=create;this.unavailable=unavailable;}
 play(url?:string){
  this.stop();if(!url)return;
  try{
   const clip=this.create();this.clip=clip;clip.src=url;
   void clip.play().catch(()=>{if(this.clip===clip){this.stop();this.unavailable();}});
  }catch{this.stop();this.unavailable();}
 }
 stop(){const clip=this.clip;this.clip=null;if(clip){clip.pause();clip.removeAttribute('src');clip.load();}}
}
