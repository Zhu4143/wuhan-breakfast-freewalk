import {useCallback,useState,useSyncExternalStore,type Dispatch,type SetStateAction} from 'react';
import {PREVIEW_PROTOCOL,isPreviewFrame,validPreviewValues,type PreviewFrame,type PreviewValues} from './previewProtocol';

const query=new URLSearchParams(location.search),frame=query.get('preview-frame'),session=query.get('preview-session');
export const isPreviewChild=window.parent!==window&&isPreviewFrame(frame)&&!!session;
const role:PreviewFrame=isPreviewFrame(frame)?frame:'desktop';
let driver:PreviewFrame='desktop',linked=true,revision=-1;
let values:PreviewValues={};
const listeners=new Set<()=>void>();
let joinTimer:ReturnType<typeof setTimeout>;
const notify=()=>listeners.forEach(fn=>fn());
const send=(type:'ready'|'claim'|'patch',patch?:PreviewValues)=>{
 if(isPreviewChild)parent.postMessage({protocol:PREVIEW_PROTOCOL,session,frame:role,type,values:patch},location.origin);
};
export const previewIsDriver=()=>!isPreviewChild||!linked||driver===role;
const subscribe=(callback:()=>void)=>{listeners.add(callback);return()=>{listeners.delete(callback);};};
export function usePreviewDriver(){return useSyncExternalStore(subscribe,previewIsDriver,previewIsDriver);}
export function previewRead<T>(key:string,fallback:T):T{return key in values?values[key] as T:fallback;}
export function previewWrite(key:string,value:unknown){
 if(!isPreviewChild||!previewIsDriver()||Object.is(values[key],value))return;
 values={...values,[key]:value};notify();send('patch',{[key]:value});
}
/** Outside the explicit preview frames this is ordinary React state. Incoming updates never echo. */
export function usePreviewState<T>(key:string,initial:T|(()=>T)):[T,Dispatch<SetStateAction<T>>]{
 const [local,setLocal]=useState(initial);
 if(isPreviewChild&&!(key in values)){
  values={...values,[key]:local};
  clearTimeout(joinTimer);joinTimer=setTimeout(()=>send('ready',values),0);
 }
 const get=()=>isPreviewChild?values[key] as T:local;
 const state=useSyncExternalStore(subscribe,get,get);
 const set:Dispatch<SetStateAction<T>>=useCallback(next=>{
  if(!isPreviewChild){setLocal(next);return;}
  if(!previewIsDriver())return;
  const current=values[key] as T,result=typeof next==='function'?(next as (value:T)=>T)(current):next;
  previewWrite(key,result);
 },[key]);
 return [state,set];
}
export function previewSubscribe(callback:()=>void){return subscribe(callback);}
if(isPreviewChild){
 document.documentElement.dataset.previewFrame=role;
 addEventListener('message',event=>{
  const m=event.data;
  if(event.origin!==location.origin||event.source!==parent||m?.protocol!==PREVIEW_PROTOCOL||m.session!==session||m.type!=='snapshot'||!isPreviewFrame(m.driver)||typeof m.linked!=='boolean'||!Number.isInteger(m.revision)||m.revision<=revision||!validPreviewValues(m.values))return;
  revision=m.revision;driver=m.driver;linked=m.linked;
  if(linked)values={...values,...m.values};
  document.documentElement.dataset.previewDriver=String(previewIsDriver());notify();
 });
 const claim=()=>{if(driver===role)return;driver=role;document.documentElement.dataset.previewDriver='true';notify();send('claim');};
 for(const event of ['pointerdown','keydown','wheel','drop','input','change'])document.addEventListener(event,claim,{capture:true,passive:true});
 // Let React seed all initial state before the join, also when the other frame loads later.
 setTimeout(()=>send('ready',values),0);
}
