import {useEffect,useRef,useState,type CSSProperties} from 'react';
import type {AtelierScene} from '../atelier/AtelierScene';
import type {MorningStreet} from './MorningStreet';
import {places,placeById,type PlaceId} from './exploreContent';
import {freshExplore,parseExplore,arriveAt,addToBasket,removeFromBasket,readCultureTopic,migrateTourBasket,EXPLORE_SAVE_KEY,type ExploreSave} from './exploreState';
import {tourSources,tourStops,foodNotes,type FoodNote} from './tourContent';
import {TOUR_SAVE_KEY} from './tourState';
import type {Era} from '../atelier/content';
import './street.css';
import './explore.css';
import './walk.css';
import {WalkJoystick} from './WalkJoystick';
import {EraSwitch} from './EraSwitch';
import {PaperPresence,PaperSwap,PaperDialog} from './PaperMotion';
import {useMorningClock} from './useMorningClock';
import {morningTime,morningPhase,openShopCount,shopIsOpen,shopHours} from './marketTime';
import {MarketSoundscape,type SoundState} from './MarketSoundscape';
import {foodCultureDialogue,cultureSpeaker} from './foodCultureDialogue';
import {CultureConversation} from './CultureConversation';
import {PhotoGallery} from './PhotoGallery';
import {FoodBasketCards} from './FoodBasketCards';
import {photoBoardStop} from './photoZines';
import type {CultureVoice} from './CultureVoice';
import {isPreviewChild,usePreviewState,usePreviewDriver,previewIsDriver,previewSubscribe,previewRead,previewWrite} from '../preview/previewBridge';
import {PREVIEW_POSE_INTERVAL_MS,type PreviewWalkPose} from './FreeWalk';
import './morning.css';
import './foodBasket.css';
import './amber.css';
import './amberIntegration.css';
import './mobileLayout.css';
import './sunlitGlass.css';

const asset=(name:string)=>import.meta.env.BASE_URL+'assets/'+name;
const read=():ExploreSave=>{try{return parseExplore(localStorage.getItem(EXPLORE_SAVE_KEY))??migrateTourBasket(localStorage.getItem(TOUR_SAVE_KEY))??freshExplore();}catch{return freshExplore();}};
function BasketIcon(){return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="m10 5-6 10m18-10 6 10M3 13h26l-4 15H7L3 13Zm9 5 1 6m7-6-1 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
function ConversationLabel({speaker,hint}:{speaker:string;hint:string}){return <><svg viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M23 13c0 5-4 8-9 8h-3l-5 3 1-5c-2-1-3-3-3-6 0-5 4-8 10-8s9 3 9 8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg><strong>和{speaker}聊聊</strong><span>{hint}</span><svg className="culture-entry-arrow" viewBox="0 0 16 24" fill="none" aria-hidden="true"><path d="m5 5 7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></>;}
export default function ExploreExperience(){
 const host=useRef<HTMLDivElement>(null),engine=useRef<AtelierScene|null>(null),world=useRef<MorningStreet|null>(null),markers=useRef(new Map<PlaceId,HTMLButtonElement>()),audio=useRef<MarketSoundscape|null>(null);
 const [save,setSave]=usePreviewState('explore.save',read),[mode,setMode]=usePreviewState<'cover'|'roam'|'visit'>('explore.mode','cover'),[chapter,setChapter]=usePreviewState('explore.chapter',0),[pageIndex,setPageIndex]=usePreviewState('explore.pageIndex',0),[reading,setReading]=usePreviewState('explore.reading',true),[basketOpen,setBasketOpen]=usePreviewState('explore.basketOpen',false),[shopsOpen,setShopsOpen]=usePreviewState('explore.shopsOpen',false),[cultureOpen,setCultureOpen]=usePreviewState('explore.cultureOpen',false);
 const previewDriver=usePreviewDriver();
 const [mobileToolsOpen,setMobileToolsOpen]=useState(false),[mobileClockOpen,setMobileClockOpen]=useState(false);
 const cultureVoice=useRef<CultureVoice|null>(null);
 const photoMarker=useRef<HTMLButtonElement|null>(null);
 const [galleryOpen,setGalleryOpen]=usePreviewState('explore.galleryOpen',false),[boardTrip,setBoardTrip]=usePreviewState('explore.boardTrip',false),[galleryFood,setGalleryFood]=usePreviewState<FoodNote|null>('explore.galleryFood',null),[galleryFromBasket,setGalleryFromBasket]=usePreviewState('explore.galleryFromBasket',false);
 const [status,setStatus]=useState('idle'),[sceneRequested,setSceneRequested]=usePreviewState('explore.sceneRequested',false),[loadedImages,setLoadedImages]=useState(0),[attempt,setAttempt]=useState(0),[walking,setWalking]=useState(false),[turning,setTurning]=useState(false),[shownEra,setShownEra]=useState<Era>(save.era);
 const pendingEntry=useRef(false);
 const [motion,setMotion]=usePreviewState('explore.motion',()=>!matchMedia('(prefers-reduced-motion: reduce)').matches),[soundState,setSoundState]=useState<SoundState>('off'),[sourcesOpen,setSourcesOpen]=usePreviewState('explore.sourcesOpen',false),[sourceIds,setSourceIds]=usePreviewState<string[]>('explore.sourceIds',[]),[storageOk,setStorageOk]=useState(true),[notice,setNotice]=useState('');
 const sound=soundState==='on'||soundState==='loading';
 const clock=useMorningClock(mode!=='cover'&&status==='ready'),phase=morningPhase(clock.progress);
 const latest=useRef({save,mode,motion});latest.current={save,mode,motion};
 const place=save.place?placeById(save.place):null,section=place?.chapters[chapter]??place?.chapters[0],page=section?.pages[pageIndex]??section?.pages[0];
 const dialogue=place?foodCultureDialogue[place.id]:undefined,speaker=dialogue?cultureSpeaker(dialogue,shownEra):'';
 const busy=walking||turning||status!=='ready',isOpen=!place||shopIsOpen(place.id,clock.progress);
 const drawerOpen=basketOpen||shopsOpen;
 const movementBlocked=sourcesOpen||basketOpen||shopsOpen||cultureOpen||galleryOpen;
 const uiStyle={'--morning-light':`${83+clock.progress*10}%`,'--morning-warmth':`${36+clock.progress*13}%`,'--time-progress':`${clock.progress*100}%`} as CSSProperties;
 useEffect(()=>{
  if(!sceneRequested)return;
  let alive=true,scene:AtelierScene|undefined;setStatus('loading');setLoadedImages(0);
  void Promise.all([import('../atelier/AtelierScene'),import('./MorningStreet')]).then(async([{AtelierScene},{MorningStreet}])=>{
   if(!alive)return;
   const soundscape=new MarketSoundscape(host.current!,s=>{if(alive){setSoundState(s);if(s==='error')setNotice('声音暂时没有打开，再点一次可以重试。');}});audio.current=soundscape;setSoundState('off');
   const env=new MorningStreet(host.current!,value=>{if(!alive)return;setWalking(value);const l=latest.current;if(!value&&l.mode==='visit'&&l.save.place)setSave(s=>arriveAt(s,l.save.place!));});world.current=env;env.enableFreeRoam(()=>{latest.current.mode='roam';cultureVoice.current?.stop();setMode('roam');setCultureOpen(false);setReading(false);});env.setExplorerMarkers(markers.current);env.setPhotoBoardMarker(photoMarker.current);
   env.attachSoundscape(soundscape);
   scene=new AtelierScene(host.current!,new Map(),s=>{if(alive)setStatus(s);},e=>{if(alive)setShownEra(e);},t=>{if(alive)setTurning(t);},env);engine.current=scene;
   scene.workshop.onImageLoaded=count=>{if(alive)setLoadedImages(count);};
   scene.setMotion(latest.current.motion);scene.setEra(latest.current.save.era);
   await scene.build();if(alive){scene.setFocus('welcome');if(pendingEntry.current){pendingEntry.current=false;stroll();}}
  }).catch(e=>{console.error(e);if(alive)setStatus('failed');});
  return()=>{alive=false;scene?.dispose();audio.current?.dispose();audio.current=null;engine.current=null;world.current=null;};
 },[attempt,sceneRequested]);
 useEffect(()=>{
  if(status!=='ready')return;engine.current?.setFocus('welcome');
  if(mode==='visit'&&save.place){const p=placeById(save.place),index=p.chapters[chapter]?.stop??p.stopIndex,stop=p.chapters[chapter]?.view??(index<8?tourStops[index]:p.stop);world.current?.walkTo(index,motion,stop);}
  if(isPreviewChild&&previewIsDriver()){const pose=world.current?.previewPose;if(pose)previewWrite('walk.pose',pose);}
 },[mode,save.place,chapter,status]);
 useEffect(()=>{world.current?.setMarketTime(clock.progress);},[clock.progress,status]);
 useEffect(()=>{world.current?.setExperienceActive(status==='ready'&&mode!=='cover');},[status,mode]);
 useEffect(()=>{engine.current?.setMotion(motion);},[motion]);
 useEffect(()=>{if(isPreviewChild&&!previewDriver)void audio.current?.setEnabled(false);},[previewDriver]);
 // Era animation and walking run independently; only overlays block local movement.
 useEffect(()=>{world.current?.enableControls(status==='ready'&&mode!=='cover',movementBlocked);},[status,mode,movementBlocked]);
 useEffect(()=>{if(status==='ready'&&mode==='visit'&&!walking&&!turning&&save.place==='noodle')engine.current?.setFocus('keeper');},[walking,turning,pageIndex,chapter,mode,status,save.place]);
 useEffect(()=>{if(status==='ready'&&mode==='visit'&&!walking&&!turning&&reading&&!cultureOpen&&save.place)world.current?.speakAtShop(save.place);},[walking,turning,pageIndex,chapter,mode,status,save.place,reading,cultureOpen]);
 useEffect(()=>{if(mode==='cover'||isPreviewChild)return;try{localStorage.setItem(EXPLORE_SAVE_KEY,JSON.stringify(save));setStorageOk(true);}catch{setStorageOk(false);}},[save,mode]);
 useEffect(()=>{engine.current?.setEra(save.era);},[save.era,status]);
 useEffect(()=>{
  if(!isPreviewChild||status!=='ready')return;
  const receive=()=>{world.current?.setPreviewFollower(!previewIsDriver());if(!previewIsDriver()){const pose=previewRead<PreviewWalkPose|null>('walk.pose',null);if(pose)world.current?.applyPreviewPose(pose);}};
  receive();const unsubscribe=previewSubscribe(receive);
  const timer=setInterval(()=>{if(previewIsDriver()){const pose=world.current?.previewPose;if(pose)previewWrite('walk.pose',pose);}},PREVIEW_POSE_INTERVAL_MS);
  return()=>{unsubscribe();clearInterval(timer);};
 },[status]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),2400);return()=>clearTimeout(timer);},[notice]);
 useEffect(()=>{setMobileToolsOpen(false);setMobileClockOpen(false);},[mode,save.place,reading,cultureOpen,basketOpen,shopsOpen,galleryOpen,sourcesOpen]);
 const toggleShops=()=>{setBasketOpen(false);setShopsOpen(v=>!v);};
 const toggleBasket=()=>{setShopsOpen(false);setBasketOpen(v=>!v);};
 const select=(id:PlaceId)=>{if(turning||status!=='ready')return;setGalleryOpen(false);setBoardTrip(false);cultureVoice.current?.stop();setCultureOpen(false);setChapter(0);setPageIndex(0);setReading(true);setBasketOpen(false);setShopsOpen(false);setSave(s=>({...s,place:id}));if(mode==='visit'&&save.place===id&&chapter===0){const p=placeById(id);world.current?.walkTo(p.stopIndex,true,p.stop);}setMode('visit');};
 const stroll=()=>{setGalleryOpen(false);setBoardTrip(false);latest.current.mode='roam';world.current?.cancelWalk();cultureVoice.current?.stop();setCultureOpen(false);setMode('roam');setBasketOpen(false);setShopsOpen(false);setReading(false);};
 const openGallery=()=>{stroll();setGalleryFromBasket(false);setGalleryFood(null);setGalleryOpen(true);};
 const openBasketPoster=(id:FoodNote)=>{latest.current.mode='roam';world.current?.cancelWalk();cultureVoice.current?.stop();setCultureOpen(false);setMode('roam');setReading(false);setShopsOpen(false);setBoardTrip(false);setGalleryFromBasket(true);setGalleryFood(id);setGalleryOpen(true);};
 const goToBoard=()=>{stroll();setBoardTrip(true);world.current?.walkTo(0,true,photoBoardStop);};
 const enterStreet=()=>{if(status==='ready'){stroll();return;}pendingEntry.current=true;setStatus('loading');setSceneRequested(true);if(status==='failed'||status==='lost')setAttempt(n=>n+1);};
 const startCulture=()=>{if(!dialogue||busy||!isOpen)return;world.current?.enableControls(true,true);setCultureOpen(true);};
 const closeCulture=()=>{cultureVoice.current?.stop();setCultureOpen(false);requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>('.culture-entry:not(:disabled)')?.focus());};
 const era=(e:Era)=>{if(turning||save.era===e)return;cultureVoice.current?.stop();setSave(s=>({...s,era:e}));engine.current?.setEra(e);};
 const collect=(id:FoodNote)=>{setSave(s=>addToBasket(s,id));setNotice('已放进我的过早，替你收好了。');};
 const sources=(ids:string[]=[])=>{setSourceIds(ids);setSourcesOpen(true);};
 const toggleSound=()=>{const a=audio.current;if(a)void a.setEnabled(!a.enabled);};
 const download=()=>{const text=['# 我的武汉过早食篮','',...foodNotes.filter(f=>save.foods.includes(f.id)).map(f=>`- ${f.name}：${f.line}`),'','我逛过：'+save.visited.map(id=>placeById(id).name).join('、'),'','街巷、人物与对白为艺术创作。文化介绍参考：','',...tourSources.map(s=>`- [${s.title}](${s.url})｜${s.by}`)].join('\n');const url=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='我的武汉过早食篮.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 const conversationAction=(extraClass:string)=>dialogue&&<button className={'culture-entry '+extraClass} disabled={busy||!isOpen} onClick={startCulture}><ConversationLabel speaker={speaker} hint={isOpen?'做法 · 过早 · 街坊':'等铺门开，再聊聊'}/></button>;
 return <main className="morning-street market-explore sunlit-street" style={uiStyle} data-era={shownEra} data-morning={phase.name} data-explore-mode={mode} data-place={save.place??''} data-culture-open={cultureOpen} data-drawer-open={drawerOpen} data-mobile-tools-open={mobileToolsOpen} data-reading={mode==='visit'&&!walking&&reading&&!cultureOpen} onKeyDown={e=>{if(e.key==='Escape'&&!sourcesOpen&&!galleryOpen){setMobileToolsOpen(false);setMobileClockOpen(false);setBasketOpen(false);setShopsOpen(false);if(cultureOpen)closeCulture();}}}>
  <div ref={host} className="street-canvas explore-canvas" data-status={status} aria-label="第一人称老街，WASD移动，拖动转向，滚轮缩放" tabIndex={0}>{places.map(p=><button hidden key={p.id} className={'explore-pin '+(save.visited.includes(p.id)?'is-visited':'')} data-place={p.id} data-open={shopIsOpen(p.id,clock.progress)} disabled={turning||mode==='cover'} ref={el=>{if(el)markers.current.set(p.id,el);else markers.current.delete(p.id);}} aria-label={'走去'+p.name} aria-description={shopHours(p.id,clock.progress)+(save.visited.includes(p.id)?'，已到访':'')} onClick={()=>select(p.id)}><i aria-hidden="true"/></button>)}<button hidden className="photo-board-pin" ref={el=>{photoMarker.current=el;world.current?.setPhotoBoardMarker(el);}} disabled={turning||mode==='cover'} onClick={openGallery} aria-label="打开栏板上的街坊影笺">街坊影笺 · 六味过早 ↗</button></div>
  <PaperPresence show={mode==='cover'}><section className="market-cover">
   <picture><source media="(pointer: coarse), (max-width: 700px)" srcSet={asset('mobile-v1/storybook/cover-v7.webp')}/><img className="market-cover-art" src={asset('storybook/cover-v7.webp')} fetchPriority="high" alt="淡彩插画里的武汉早餐老街，木窗、早点摊与晨光中的行人"/></picture>
   <header className="cover-header"><div className="explore-brand"><b>早</b><span>过早旧影<small>武汉 · 一街烟火</small></span></div><button onClick={()=>sources()}>关于这条街 ↗</button></header>
   <div className="cover-copy"><p className="cover-eyebrow"><span/> 五点，老街将醒</p><h1>等天亮，<br/>也等一口<span>热乎。</span></h1><p className="cover-description">灯还亮着，铺门刚刚有了动静。<br/>沿石板路走一会儿，看天色与街坊<br/>一起醒来，把喜欢的味道收进食篮。</p><button className="explore-primary cover-enter" disabled={status==='loading'} onClick={enterStreet}>{status==='idle'||status==='ready'?'去街上逛逛':status==='loading'?(loadedImages?`正在开门 · ${loadedImages} 处就绪`:'街景正在展开…'):'再试一次'}<span>→</span></button>{status==='failed'&&<button className="cover-retry" onClick={()=>setAttempt(x=>x+1)}>重新打开街景</button>}<div className="cover-notes"><span>05:00 — 08:00</span><i>·</i><span>五分钟的清晨</span></div>{save.foods.length>0&&<p className="cover-saved">食篮里，还留着你上次的 {save.foods.length} 种味道。</p>}</div>
   <footer className="cover-footer"><span>有来历的味道，有温度的日常。</span><small>武汉生活意象 · 原创虚构街巷</small></footer>
  </section></PaperPresence><PaperPresence show={mode!=='cover'}><div className="explore-chrome">
   {mobileToolsOpen&&<button className="mobile-tools-scrim" aria-label="收起更多工具" onClick={()=>setMobileToolsOpen(false)}/>}
   <header className="explore-header"><button className="explore-brand" onClick={()=>{latest.current.mode='cover';world.current?.cancelWalk();cultureVoice.current?.stop();setCultureOpen(false);setMode('cover');setBasketOpen(false);setShopsOpen(false);setGalleryOpen(false);setBoardTrip(false);}} aria-label="返回封面"><b>早</b><span>过早旧影<small>{shownEra==='past'?'旧时纸笺 · 一街烟火':'今日手记 · 老街新晨'}</small></span></button><div className="mobile-street-shortcuts"><button onClick={toggleShops} aria-expanded={shopsOpen} aria-label="沿街店铺" disabled={turning}>店铺</button><button onClick={()=>{setMobileClockOpen(false);setMobileToolsOpen(v=>!v);}} aria-expanded={mobileToolsOpen} aria-controls="street-tools" aria-label="更多老街工具">更多</button></div><div className="explore-toolbar" id="street-tools" onClick={()=>setMobileToolsOpen(false)}><button aria-expanded={shopsOpen} onClick={toggleShops} disabled={turning}>沿街店铺</button><button className="gallery-toolbar-entry" onClick={openGallery} disabled={turning} aria-haspopup="dialog">街坊影笺</button><EraSwitch value={save.era} onChange={era} disabled={turning}/><button className="explore-sound-toggle" onClick={toggleSound} aria-pressed={sound}>{soundState==='loading'?'声音准备中':sound?'声音开':'声音关'}</button><button className="explore-motion-toggle" onClick={()=>setMotion(v=>!v)} aria-pressed={!motion}>{motion?'静一静':'动起来'}</button><button className="explore-source-top" onClick={()=>sources()}>资料手册</button></div></header>
   <button className="basket-mobile-trigger" onClick={toggleBasket} aria-expanded={basketOpen} aria-label={'我的过早 '+save.foods.length}><BasketIcon/><span className="basket-trigger-label">我的过早</span><b>{save.foods.length}</b></button>
   <PaperPresence show={basketOpen}><button className="basket-scrim" aria-label="点击空白处收起食篮" onClick={()=>setBasketOpen(false)}/></PaperPresence>
   <PaperPresence show={basketOpen}><aside className="explore-basket is-open" aria-label="我的过早食篮"><div className="basket-heading"><BasketIcon/><div><h2>我的过早</h2><p>{shownEra==='past'?'收下这一味，也留下它的影笺。':'这一晨的味道，都收在纸里。'}</p></div><b>{save.foods.length}</b><button className="basket-close" aria-label="收起食篮" onClick={()=>setBasketOpen(false)}>×</button></div><PaperSwap id={save.foods.join(',')||'empty'} className="basket-items">{save.foods.length===0?<div className="basket-empty"><img src={asset('storybook/bowl.webp')} alt=""/><p>食篮还是空的。</p><small>先去一家小铺看看，<br/>遇见喜欢的，再放进来。</small></div>:<FoodBasketCards foods={save.foods} onView={openBasketPoster} onRemove={id=>setSave(s=>removeFromBasket(s,id))} onVisit={select}/>}</PaperSwap><div className="basket-bottom"><p>{isPreviewChild?'双端预览食篮，暂存在本次窗口。':storageOk?'已经替你存在这个浏览器里。':'暂时无法自动保存，可以下载食篮。'}</p><button disabled={!save.foods.length} className="basket-download" onClick={download}>带走我的食篮 <span>↓</span></button></div></aside></PaperPresence>
   <PaperPresence show={shopsOpen}><section className="street-directory">
    <div className="directory-heading"><h2>沿街慢慢逛</h2><button aria-label="收起店铺列表" onClick={()=>setShopsOpen(false)}>×</button></div>
    <p>{morningTime(clock.progress)} · {openShopCount(clock.progress)} / 6 家铺门已开</p>
    <div className="directory-body"><div className="explore-place-list" aria-label="选择想去的地点">{places.map(p=><button key={p.id} disabled={turning} onClick={()=>select(p.id)}><span><b>{p.short}</b><small>{shopHours(p.id,clock.progress)}</small></span><i>↗</i></button>)}</div><button className="directory-photo-entry" onClick={openGallery}>街坊影笺<small>六味过早影笺 ↗</small></button><div className="directory-bottom"><small className="directory-note">还没开门，也可以先去门口看看。</small><button onClick={()=>sources()}>资料手册 ↗</button></div></div>
   </section></PaperPresence>
   <button className="mobile-clock-trigger" aria-label="调整清晨时间" aria-expanded={mobileClockOpen} aria-controls="morning-time-controls" onClick={()=>{setMobileToolsOpen(false);setMobileClockOpen(v=>!v);}}><span aria-hidden="true">◷</span><time>{morningTime(clock.progress)}</time><span aria-hidden="true">{mobileClockOpen?'−':'＋'}</span></button>
   <section className="morning-clock" id="morning-time-controls" aria-label="清晨时间" data-mobile-expanded={mobileClockOpen}>
    <div className="morning-clock-top"><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M3 23h26M7 27h18M9 20a7 7 0 0 1 14 0M16 3v5M4 10l4 4m20-4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg><div><span>{phase.name}</span><time>{morningTime(clock.progress)}</time></div><p>{openShopCount(clock.progress)} / 6 家开门</p><button aria-label={clock.paused?'继续时间':'暂停时间'} onClick={()=>clock.setPaused(v=>!v)} aria-pressed={clock.paused}>{clock.paused?'▷':'Ⅱ'}</button><button className="mobile-clock-close" aria-label="收起时间条" onClick={()=>setMobileClockOpen(false)}>×</button></div>
    <label className="morning-track"><span className="sr-only">清晨时间进度</span><input type="range" min="0" max="1" step=".001" value={clock.progress} aria-valuetext={`${morningTime(clock.progress)}，${phase.name}`} onChange={e=>clock.seek(Number(e.currentTarget.value))}/></label>
    <div className="morning-clock-ticks"><span>05:00 · 黎明</span><small>{clock.progress>=1?'早安，继续慢慢逛':clock.paused?'时间已停 · 拖动可预览':'随你停留，天色渐亮'}</small><span>08:00 · 早市</span></div>
   </section>
   <div className="walk-hud"><p><span className="walk-desktop">W A S D 移动 · 拖动转向 · 滚轮缩放</span><span className="walk-mobile">左手摇杆移动 · 拖动画面转向</span></p><span>{shownEra==='past'?'旧木窗下，灯火微黄':'修补过的街巷，又一个清晨'}</span></div>
   <WalkJoystick disabled={movementBlocked} onChange={(x,y)=>world.current?.joystick(x,y)}/>
   <div className="walk-zoom" aria-label="视野缩放"><button aria-label="拉近画面" disabled={cultureOpen||galleryOpen} onClick={()=>world.current?.zoom(-6)}>＋</button><button aria-label="拉远画面" disabled={cultureOpen||galleryOpen} onClick={()=>world.current?.zoom(6)}>－</button></div>
   {place&&<><PaperPresence show={mode==='visit'}><div className="explore-location"><span>正在{walking?'走向':'看看'}</span><b>{place.name}</b><button onClick={stroll}>继续走走</button></div></PaperPresence>
    <PaperPresence show={mode==='visit'&&walking}><section className="explore-travel" role="status"><span>···</span><p>顺着石板路，去{place.name}。</p><button onClick={stroll}>停下，自己走</button></section></PaperPresence>{page&&section&&<PaperPresence show={mode==='visit'&&!walking&&reading&&!cultureOpen&&!drawerOpen}><article className="explore-reading" aria-label={place.name+'的故事'}>
     <div className="explore-reading-top"><span>{shownEra==='past'?'旧影小札':'今晨手记'} / {place.kind}</span><button onClick={()=>setReading(false)} aria-label="收起介绍">×</button></div>
     {place.chapters.length>1&&<nav className="explore-chapters" aria-label="店内话题">{place.chapters.map((c,i)=><button key={c.title} disabled={turning} aria-pressed={chapter===i} onClick={()=>{setChapter(i);setPageIndex(0);}}>{c.title}</button>)}</nav>}
     <PaperSwap id={`${place.id}:${chapter}:${pageIndex}:${shownEra}:${isOpen}`} className="explore-reading-body">{!isOpen&&<p className="shop-waking"><span>◷ {shopHours(place.id,clock.progress)}</span>铺里正在备料。先读一页小札，或者拖动时间，等这一扇门打开。</p>}<p className="explore-eyebrow">{page.label}</p><h2>{page.title}</h2><p className="explore-copy">{page.text}</p>
      {(place.id==='noodle'&&chapter===2||section.compare)&&<div className="explore-inline-era"><EraSwitch value={save.era} onChange={era} disabled={busy}/><span>{turning?'纸墙正在翻转…':'同一条老街，两种清晨'}</span></div>}
      {place.food&&<button className="explore-add-food" disabled={busy||!isOpen||save.foods.includes(place.food)||!save.visited.includes(place.id)} onClick={()=>collect(place.food!)}><img src={asset(foodNotes.find(f=>f.id===place.food)!.image)} alt=""/><span><b>{save.foods.includes(place.food)?'已放进我的过早':!isOpen?'等开门，再收下这一味':'把'+place.short+'放进食篮'}</b><small>{save.foods.includes(place.food)?'回头打开食篮，还能再看。':!isOpen?'调整清晨时间，可以等到铺门打开。':'喜欢这一味，就替自己记下来。'}</small></span><i>{save.foods.includes(place.food)?'✓':'＋'}</i></button>}
      <div className="explore-evidence"><span>{page.kind==='fact'?'文化资料':page.kind==='story'?'虚构对白':'场景观察'}</span>{page.sources&&<button onClick={()=>sources(page.sources)}>看看出处 ↗</button>}</div>{conversationAction('mobile-reading-conversation')}
     </PaperSwap>{conversationAction('desktop-reading-conversation')}<footer className="explore-reading-footer"><button disabled={busy||pageIndex===0} onClick={()=>setPageIndex(i=>i-1)}>← 前一页</button><span>{pageIndex+1} / {section.pages.length}</span><button disabled={busy} onClick={()=>pageIndex<section.pages.length-1?setPageIndex(i=>i+1):setReading(false)}>{pageIndex<section.pages.length-1?'再听一点 →':'慢慢看看 ↗'}</button></footer>
    </article></PaperPresence>}<PaperPresence show={mode==='visit'&&!walking&&!reading&&!cultureOpen&&!drawerOpen}><button className="explore-reopen" onClick={()=>setReading(true)}>读读这里的故事 ↗</button></PaperPresence>
    {dialogue&&<><PaperPresence show={mode==='visit'&&!walking&&!reading&&!cultureOpen&&!drawerOpen}><button className="culture-entry culture-entry-collapsed" disabled={busy||!isOpen} onClick={startCulture}><ConversationLabel speaker={speaker} hint={isOpen?'听一段过早的日常':'等铺门开，再聊聊'}/></button></PaperPresence><CultureConversation key={place.id} dialogue={dialogue} era={shownEra} open={mode==='visit'&&!walking&&cultureOpen&&!drawerOpen} active={mode==='visit'&&cultureOpen&&!busy&&!sourcesOpen&&!basketOpen&&!shopsOpen&&!galleryOpen} read={save.cultureRead[place.id]??[]} onRead={id=>setSave(s=>readCultureTopic(s,place.id,id))} onClose={closeCulture} onSources={sources} onSpeak={()=>place.id==='noodle'?engine.current?.speakAgain():world.current?.speakAtShop(place.id)} onVoiceReady={voice=>{cultureVoice.current=voice;}}/></>}
   </>}
   <PaperPresence show={mode==='roam'&&boardTrip&&walking}><section className="explore-travel" role="status"><p>顺着石板路，去栏板看看。</p><button onClick={stroll}>停下，自己走</button></section></PaperPresence>
   <PaperPresence show={status!=='ready'}><div className="explore-loading" role="status"><p>{status==='loading'?'街景正在展开…':'街景暂时没有展开。'}</p>{status!=='loading'&&<button onClick={()=>setAttempt(n=>n+1)}>重新打开</button>}</div></PaperPresence>
   <PaperPresence show={turning}><p className="explore-turning" role="status">老街正在换一个年代……</p></PaperPresence>
   <footer className="explore-footer"><span>{'第一人称 · 自由逛街'}</span><span>武汉生活意象 · 虚构街巷</span></footer>
  </div></PaperPresence>
  <PaperPresence show={!!notice}><p className="explore-toast" role="status">{notice}</p></PaperPresence>
  <PhotoGallery open={galleryOpen} onClose={()=>setGalleryOpen(false)} onVisit={goToBoard} foods={galleryFromBasket?save.foods:undefined} initialFood={galleryFood}/>
  <PaperDialog open={sourcesOpen} onClose={()=>setSourcesOpen(false)}><button className="explore-dialog-close" onClick={()=>setSourcesOpen(false)}>合上手册 ×</button><p className="explore-eyebrow">文化资料 / 核验于 2026-10-03</p><h2>味道有来处，故事有出处。</h2><p>这条街、店主与对白是创作；饮食介绍参考下列资料。清晨时刻、开门顺序与人流为叙事设定，不代表真实店铺营业时间。关于食物起源的传说与不同叙述，我们保留它们的差异。</p>{tourSources.filter(s=>!sourceIds.length||sourceIds.includes(s.id)).map(s=><section key={s.id}><small>{s.by} · {s.date}</small><h3><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title} ↗</a></h3><p>{s.note}</p></section>)}</PaperDialog>
 </main>;
}
