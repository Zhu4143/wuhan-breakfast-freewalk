export type PreviewFrame='desktop'|'phone';
export type PreviewValues=Record<string,unknown>;
export const PREVIEW_PROTOCOL='wuhan-dual-preview-v1';
export function isPreviewFrame(value:unknown):value is PreviewFrame{return value==='desktop'||value==='phone';}
export function validPreviewValues(value:unknown):value is PreviewValues{
 return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(key=>/^(explore|clock|gallery|culture|studio|walk)\.[a-zA-Z0-9.-]+$/.test(key));
}
export type PreviewMessage={protocol:typeof PREVIEW_PROTOCOL;session:string;frame:PreviewFrame;type:'ready'|'claim'|'patch';values?:PreviewValues};
export function parsePreviewMessage(value:unknown,session:string):PreviewMessage|null{
 if(!value||typeof value!=='object')return null;
 const m=value as PreviewMessage;
 if(m.protocol!==PREVIEW_PROTOCOL||m.session!==session||!isPreviewFrame(m.frame)||!['ready','claim','patch'].includes(m.type))return null;
 if(m.type!=='claim'&&!validPreviewValues(m.values))return null;
 return m;
}
/** The parent orders updates. Only the frame with the latest real user input advances the clock and walk. */
export class PreviewCoordinator{
 driver:PreviewFrame='desktop';linked=true;revision=0;
 values:PreviewValues={};
 private peers:Record<PreviewFrame,PreviewValues>={desktop:{},phone:{}};
 receive(message:PreviewMessage):boolean{
  const {frame,type,values={}}=message;
  if(type==='ready'){
   this.peers[frame]={...this.peers[frame],...values};
   for(const key of Object.keys(values))if(!(key in this.values))this.values[key]=values[key];
  }else if(type==='claim'){
   this.driver=frame;
  }else{
   if(this.linked&&frame!==this.driver)return false;
   this.peers[frame]={...this.peers[frame],...values};
   this.values={...this.values,...values};
  }
  if(this.linked)this.peers={desktop:{...this.values},phone:{...this.values}};
  this.revision++;return true;
 }
 setLinked(linked:boolean){
  this.linked=linked;
  if(linked)this.values={...this.peers[this.driver]};
  this.revision++;
 }
}
