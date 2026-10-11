import {useLayoutEffect,useMemo,useRef,useState} from 'react';
import {PaperDialog} from './PaperMotion';
import {photoZines,photoZinesForFoods,photoZineAsset} from './photoZines';
import type {FoodNote} from './tourContent';
import {PhotoZineStudio} from './PhotoZineStudio';
import {usePreviewState} from '../preview/previewBridge';
import './photoGallery.css';

type GalleryProps={open:boolean;onClose:()=>void;onVisit:()=>void;foods?:readonly FoodNote[];initialFood?:FoodNote|null};
export function PhotoGallery({open,onClose,onVisit,foods,initialFood}:GalleryProps){
 const entries=useMemo(()=>foods?photoZinesForFoods(foods):photoZines,[foods]);
 const [selected,setSelected]=usePreviewState<string|null>('gallery.selected',null),[ready,setReady]=useState(''),[failed,setFailed]=useState(''),[retry,setRetry]=useState(0);
 const [studio,setStudio]=usePreviewState('gallery.studio',false);
 const content=useRef<HTMLDivElement>(null),back=useRef<HTMLButtonElement>(null);
 const index=entries.findIndex(entry=>entry.id===selected),item=entries[index]??null;
 const basket=foods!==undefined,title=basket?'我的过早影笺':'街坊影笺';
 useLayoutEffect(()=>{
  if(open){setSelected(initialFood?photoZines.find(entry=>entry.food===initialFood)?.id??null:null);setReady('');setFailed('');setRetry(0);setStudio(false);}
 },[open,initialFood]);
 useLayoutEffect(()=>{if(!open)return;const dialog=content.current?.closest('dialog');if(dialog)dialog.scrollTop=0;if(studio)content.current?.querySelector<HTMLButtonElement>('.studio-back')?.focus({preventScroll:true});else if(item)back.current?.focus({preventScroll:true});},[open,selected,item,studio]);
 const choose=(next:number)=>{setReady('');setFailed('');setRetry(0);setSelected(entries[next]?.id??null);};
 const close=()=>{onClose();setSelected(null);setStudio(false);};
 return <PaperDialog open={open} onClose={close} className={'photo-gallery'+(studio?' photo-zine-studio':'')} label={studio?'制作我的武汉影笺':title}>
  {open&&<div ref={content} className="photo-gallery-content" onKeyDown={e=>{if(studio||!item||entries.length<2)return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();choose((index+(e.key==='ArrowRight'?1:entries.length-1))%entries.length);}}}>
   <header className="photo-gallery-header"><div><p>武汉 · 一味一张影笺</p><h2>{studio?'制作我的武汉影笺':title}</h2></div><button className="photo-gallery-close" onClick={close} aria-label="合上影笺">×</button></header>
   {studio?<PhotoZineStudio onBack={()=>setStudio(false)}/>:item?<>
    <div className="photo-gallery-nav"><button ref={back} onClick={()=>setSelected(null)}>{basket?'← 看食篮里的影笺':'← 看全部'}</button><span aria-live="polite">{index+1} / {entries.length} · {item.title}</span></div>
    <figure className="photo-gallery-detail">
     <div className="photo-gallery-image" aria-busy={ready!==item.id&&failed!==item.id}>
      <img key={item.id+retry} src={photoZineAsset(item.id)+(retry?'?retry='+retry:'')} alt={item.alt} width="960" height="1600" decoding="async" onLoad={()=>setReady(item.id)} onError={()=>setFailed(item.id)} data-loaded={ready===item.id}/>
      {ready!==item.id&&failed!==item.id&&<span role="status">影笺正在展开…</span>}
      {failed===item.id&&<div role="alert"><p>这张影笺暂时没有展开。</p><button onClick={()=>{setFailed('');setRetry(n=>n+1);}}>再试一次</button></div>}
     </div><figcaption><b>{item.pinyin}</b><span>{item.scene} · {item.line}</span></figcaption>
    </figure>
    {entries.length>1&&<nav className="photo-gallery-pages" aria-label="逐张看影笺"><button onClick={()=>choose((index+entries.length-1)%entries.length)}>← 上一张</button><button onClick={()=>choose((index+1)%entries.length)}>下一张 →</button></nav>}
   </>:<>
    <p className="photo-gallery-intro">{basket?'这一晨收下的 '+entries.length+' 种味道，也收进了这几张纸里。点一张，慢慢看。':'六味过早，六张武汉小景。遇见喜欢的味道，放进食篮，它的影笺也会一起留下。'}</p>
    <div className="photo-gallery-grid">{entries.map((zine,i)=><button key={zine.id} onClick={()=>choose(i)} aria-label={'放大'+zine.title}><img src={photoZineAsset(zine.id,true)} alt={zine.alt} width="240" height="400" loading="lazy" decoding="async"/><span><small>0{i+1}</small>{zine.title}</span><em>{zine.pinyin}</em></button>)}</div>
    {!basket&&<section className="photo-gallery-create" aria-label="留下自己的武汉影笺"><svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><rect x="5" y="9" width="30" height="25" rx="4" stroke="currentColor" strokeWidth="1.5"/><path d="m7 28 9-10 6 7 4-4 7 9M14 9l3-4h8l3 4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg><div><small>YOUR WUHAN, YOUR MORNING</small><h3>你的武汉，也有一席。</h3><p>一张自己拍的照片，配一味喜欢的过早。</p></div><button onClick={()=>setStudio(true)}>制作我的影笺 ↗</button></section>}
    <footer className="photo-gallery-footer"><p>{basket?'这里只留着食篮里的味道。移出食物，对应的影笺也会收起。':'由提供的武汉照片创作，保留景物关系，在纸面留白里记下一味过早。'}</p><button onClick={()=>{close();if(!basket)onVisit();}}>{basket?'放回食篮 ↗':'去栏板看看 ↗'}</button></footer>
   </>}
  </div>}
 </PaperDialog>;
}
