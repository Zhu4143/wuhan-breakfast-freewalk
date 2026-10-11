import {useEffect,useRef,useState,type ChangeEvent,type DragEvent,type FormEvent} from 'react';
import {foodNotes,type FoodNote} from './tourContent';
import {photoZines} from './photoZines';
import {composePhotoZine,readZineImage,zineTones,MAX_ZINE_PHOTO_BYTES,type ZineTone} from './photoZineComposer';
import {isPreviewChild,usePreviewState} from '../preview/previewBridge';
import './photoZineStudio.css';

const asset=(name:string)=>import.meta.env.BASE_URL+'assets/'+name;
const sharedImageURL=(blob:Blob)=>new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);});
function PhotoIcon(){return <svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><rect x="5" y="9" width="30" height="25" rx="4" stroke="currentColor" strokeWidth="1.5"/><path d="m7 28 9-10 6 7 4-4 7 9M14 9l3-4h8l3 4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="28" cy="16" r="2" fill="currentColor"/></svg>;}

export function PhotoZineStudio({onBack}:{onBack:()=>void}){
 const [photo,setPhoto]=usePreviewState<{url:string;name:string}|null>('studio.photo',null),[food,setFood]=usePreviewState<FoodNote>('studio.food','noodle'),[tone,setTone]=usePreviewState<ZineTone>('studio.tone','vermilion'),[place,setPlace]=usePreviewState('studio.place','');
 const [result,setResult]=usePreviewState<string|null>('studio.result',null),[busy,setBusy]=usePreviewState('studio.busy',false),[loading,setLoading]=usePreviewState('studio.loading',false),[error,setError]=usePreviewState('studio.error',''),[dragging,setDragging]=useState(false);
 const upload=useRef<HTMLInputElement>(null),camera=useRef<HTMLInputElement>(null),preview=useRef<HTMLElement>(null),form=useRef<HTMLFormElement>(null),job=useRef(0);
 const zine=photoZines.find(item=>item.food===food)!;
 useEffect(()=>()=>{job.current++;},[]);
 useEffect(()=>{if(isPreviewChild){setBusy(false);setLoading(false);setError('');}},[]);
 useEffect(()=>()=>{if(photo)URL.revokeObjectURL(photo.url);},[photo]);
 useEffect(()=>()=>{if(result)URL.revokeObjectURL(result);},[result]);
 useEffect(()=>{
  if(!result)return;
  preview.current?.focus({preventScroll:true});
  if(matchMedia('(max-width:760px)').matches)preview.current?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});
 },[result]);
 const invalidate=()=>{job.current++;setResult(null);setError('');};
 const choosePhoto=async(file:File|undefined)=>{
  if(!file)return;
  const current=++job.current;setError('');setLoading(false);
  if(!file.type.startsWith('image/')){setError('请选一张照片，支持 JPG、PNG 或 WebP。');return;}
  if(file.size>MAX_ZINE_PHOTO_BYTES){setError('这张照片有些大，请选择 20 MB 以内的照片。');return;}
  setLoading(true);let url='';
  try{url=isPreviewChild?await sharedImageURL(file):URL.createObjectURL(file);await readZineImage(url);if(job.current!==current){URL.revokeObjectURL(url);return;}setPhoto({url,name:file.name});setResult(null);}
  catch{URL.revokeObjectURL(url);if(job.current===current)setError('这张照片暂时读不开，请换一张 JPG、PNG 或 WebP。');}
  finally{if(job.current===current)setLoading(false);}
 };
 const fileChange=(event:ChangeEvent<HTMLInputElement>)=>{const file=event.currentTarget.files?.[0];event.currentTarget.value='';void choosePhoto(file);};
 const drop=(event:DragEvent<HTMLDivElement>)=>{event.preventDefault();setDragging(false);if(!busy)void choosePhoto(event.dataTransfer.files[0]);};
 const make=async(event:FormEvent)=>{
  event.preventDefault();if(!photo||busy||loading)return;
  const current=++job.current;setBusy(true);setError('');
  try{
   const item=foodNotes.find(item=>item.id===food)!;
   const blob=await composePhotoZine({photoURL:photo.url,foodURL:asset(item.image),foodName:item.name,pinyin:zine.pinyin,place,tone,vertical:['doupi','mianwo','east-end'].includes(food)});
   if(job.current===current)setResult(isPreviewChild?await sharedImageURL(blob):URL.createObjectURL(blob));
  }catch{if(job.current===current)setError('影笺暂时没有排好，请再试一次。');}
  finally{if(job.current===current)setBusy(false);}
 };
 const recompose=()=>{
  setResult(null);const behavior=matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth';
  form.current?.scrollTo({top:0,behavior});form.current?.scrollIntoView({behavior,block:'start'});
  form.current?.querySelector<HTMLButtonElement>('.studio-upload button')?.focus({preventScroll:true});
 };
 return <div className="zine-studio">
  <button className="studio-back" onClick={onBack}>← 回到街坊影笺</button>
  <p className="studio-intro">把自己拍到的武汉，与喜欢的一味过早，留在同一张纸里。</p>
  <div className="studio-columns">
   <form ref={form} onSubmit={make} className="studio-form" aria-label="影笺照片与美食">
    <fieldset disabled={busy||loading}>
     <legend><span>01</span> 留下一张武汉</legend>
     <input ref={upload} className="studio-file" type="file" accept="image/*" aria-label="选择武汉照片" onChange={fileChange}/>
     <input ref={camera} className="studio-file" type="file" accept="image/*" capture="environment" aria-label="拍摄武汉照片" onChange={fileChange}/>
     <div className={'studio-upload '+(photo?'has-photo ':'')+(dragging?'is-dragging':'')} onDragOver={event=>{event.preventDefault();if(!busy)setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={drop}>
      <button type="button" onClick={()=>upload.current?.click()} aria-label={photo?'更换武汉照片':'上传武汉照片'}>
       {photo?<img src={photo.url} alt="已选择的武汉照片"/>:<PhotoIcon/>}
       <span><b>{loading?'正在展开照片…':photo?'换一张照片':'选择你拍的武汉'}</b><small>{photo?'点击更换，或把照片拖到这里':'街巷、江岸，或一瞬间的烟火'}</small></span>
      </button>
     </div>
     <div className="studio-upload-actions"><button type="button" onClick={()=>upload.current?.click()}>从相册选择 ↗</button><button type="button" className="studio-camera" onClick={()=>camera.current?.click()}><PhotoIcon/>拍一张武汉</button><small className="studio-desktop-tip">也可拖入照片 · 20 MB 以内</small></div>
     <label className="studio-place">拍摄地点 <span>选填</span><input type="text" maxLength={20} placeholder="例如：汉口江滩" value={place} onChange={event=>{setPlace(event.target.value);invalidate();}}/></label>
    </fieldset>
    <fieldset disabled={busy||loading}>
     <legend><span>02</span> 搭配一味过早</legend>
     <div className="studio-foods">{foodNotes.map(item=><label key={item.id} data-selected={food===item.id}><input type="radio" name="studio-food" value={item.id} checked={food===item.id} onChange={()=>{setFood(item.id);invalidate();}}/><img src={asset(item.image)} alt=""/><span>{item.name}</span><i aria-hidden="true">{food===item.id?'✓':'○'}</i></label>)}</div>
    </fieldset>
    <fieldset disabled={busy||loading} className="studio-tone-field"><legend><span>03</span> 一笔结构色</legend><div className="studio-tones">{zineTones.map(item=><label key={item.id} data-selected={tone===item.id}><input type="radio" name="studio-tone" value={item.id} checked={tone===item.id} onChange={()=>{setTone(item.id);invalidate();}}/><i style={{background:item.ink}}/>{item.name}</label>)}</div></fieldset>
    {error&&<p className="studio-error" role="alert">{error}</p>}
    <button className="studio-make" type="submit" disabled={!photo||busy||loading}>{busy?'正在排成影笺…':result?'再排一张影笺':'排成我的影笺'}<span aria-hidden="true">↗</span></button>
    <p className="studio-privacy">照片只在当前设备上排版，完成后可以保存。</p>
   </form>
   <section ref={preview} tabIndex={-1} className="studio-preview" aria-label="我的武汉影笺预览" aria-busy={busy}>
    <div className="studio-preview-heading"><span>我的武汉影笺</span><small>3 : 5 · 纸上留一晨</small></div>
    <div className="studio-poster">{result?<img src={result} alt={zine.title+'与自己拍摄的武汉照片组成的纸质影笺'}/>:<div className="studio-empty-poster"><small>WUHAN / YOUR MORNING</small><b style={{color:zineTones.find(item=>item.id===tone)?.ink}}>{zine.pinyin}</b><span>{zine.title}</span><div><PhotoIcon/><p>{photo?'照片已备好，排成影笺看看。':'你的武汉，在这里。'}</p></div><em>一口过早，一张武汉。</em></div>}</div>
    <div className="studio-result-actions">{result?<><a href={result} download={'我的武汉影笺-'+zine.title+'.png'}>保存影笺 <span>↓</span></a><button type="button" onClick={recompose}>重新搭配</button></>:<p>{busy?'正在把这一晨收进纸里…':'上传照片，选一味过早，就能预览。'}</p>}</div>
    <p className="studio-result-note" role="status">{result?'影笺排好了。保存下来，留住这次相遇。':''}</p>
   </section>
  </div>
 </div>;
}
