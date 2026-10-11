import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {PREVIEW_PROTOCOL,PreviewCoordinator,parsePreviewMessage,type PreviewFrame} from './previewProtocol';
import './dualPreview.css';

const phones=[{label:'iPhone 大屏',width:430,height:932},{label:'iPhone 标准',width:390,height:844},{label:'小屏手机',width:375,height:812},{label:'窄屏手机',width:360,height:640},{label:'手机横屏',width:812,height:375}];
export default function DualPreview(){
 const [session]=useState(()=>crypto.randomUUID()),[phone,setPhone]=useState(0),[desktop,setDesktop]=useState(1280),[fit,setFit]=useState(true),[size,setSize]=useState({width:document.documentElement.clientWidth,height:document.documentElement.clientHeight});
 const [linked,setLinked]=useState(true),[driver,setDriver]=useState<PreviewFrame>('desktop'),[ready,setReady]=useState({desktop:false,phone:false});
 const frames=useRef<{desktop:HTMLIFrameElement|null;phone:HTMLIFrameElement|null}>({desktop:null,phone:null}),coordinator=useRef(new PreviewCoordinator());
 const p=phones[phone],desktopHeight=800,landscape=p.width>p.height,phoneChromeHeight=landscape?34:74;
 const scale=fit?Math.max(.1,Math.min(1,(size.width-112)/(desktop+p.width+64),(size.height-220)/Math.max(desktopHeight+34,p.height+phoneChromeHeight))):1;
 const frameURL=(frame:PreviewFrame)=>{const url=new URL(location.href);url.search='';url.searchParams.set('preview-frame',frame);url.searchParams.set('preview-session',session);return url.href;};
 const broadcast=(patch=coordinator.current.values,source?:PreviewFrame)=>{
  const c=coordinator.current;
  for(const frame of ['desktop','phone'] as const)frames.current[frame]?.contentWindow?.postMessage({protocol:PREVIEW_PROTOCOL,session,type:'snapshot',driver:c.driver,linked:c.linked,revision:c.revision,values:frame===source?{}:patch},location.origin);
 };
 useEffect(()=>{
  document.title='双端对照 · 过早旧影';
  const resize=()=>setSize({width:document.documentElement.clientWidth,height:document.documentElement.clientHeight});addEventListener('resize',resize);resize();
  const receive=(event:MessageEvent)=>{
   if(event.origin!==location.origin)return;
   const message=parsePreviewMessage(event.data,session);if(!message||event.source!==frames.current[message.frame]?.contentWindow)return;
   if(!coordinator.current.receive(message))return;
   if(message.type==='ready')setReady(value=>({...value,[message.frame]:true}));
   if(message.type==='claim')setDriver(message.frame);
   if(message.type==='patch')broadcast(message.values,message.frame);
   else if(message.type==='claim')broadcast({});
   else broadcast();
  };
  addEventListener('message',receive);return()=>{removeEventListener('resize',resize);removeEventListener('message',receive);};
 },[session]);
 const toggle=()=>{const next=!linked;coordinator.current.setLinked(next);setLinked(next);broadcast();};
 const style={'--preview-scale':scale,'--desktop-width':desktop+'px','--desktop-height':desktopHeight+'px','--phone-width':p.width+'px','--phone-height':p.height+'px','--phone-chrome-height':phoneChromeHeight+'px'} as CSSProperties;
 return <main className="dual-preview" style={style}>
  <header className="dual-preview-header"><div className="dual-preview-title"><span>早</span><div><small>WUHAN / RESPONSIVE STUDIO</small><h1>一条老街，两个屏幕。</h1></div></div><a href={location.pathname}>返回完整网页 ↗</a></header>
  <section className="dual-preview-controls" aria-label="双端预览设置">
   <button className="preview-link-toggle" aria-pressed={linked} onClick={toggle}><i/>{linked?'双端同步中':'独立查看中'}</button>
   <label>电脑宽度<select aria-label="电脑预览宽度" value={desktop} onChange={event=>setDesktop(Number(event.target.value))}><option value={1280}>1280 × 800</option><option value={1440}>1440 × 800</option><option value={1024}>1024 × 800</option></select></label>
   <label>手机尺寸<select aria-label="手机预览尺寸" value={phone} onChange={event=>setPhone(Number(event.target.value))}>{phones.map((item,index)=><option key={item.width} value={index}>{item.label} · {item.width} × {item.height}</option>)}</select></label>
   <button aria-pressed={fit} onClick={()=>setFit(value=>!value)}>{fit?'适应窗口':'原尺寸查看'} · {Math.round(scale*100)}%</button>
   <span className="preview-sync-status" role="status">{!ready.desktop||!ready.phone?'正在连接两个屏幕…':linked?(driver==='desktop'?'电脑操作 → 手机同步':'手机操作 → 电脑同步'):'两边可以分别操作'}</span>
  </section>
  <div className="dual-preview-workspace">
   <section className="preview-device preview-desktop" aria-label="电脑网页预览"><div className="preview-device-caption"><span>01 / DESKTOP</span><b>{desktop} × {desktopHeight}</b></div><div className="desktop-scaled"><div className="desktop-frame"><div className="desktop-browser-bar"><span><i/><i/><i/></span><small>过早旧影 · 武汉一街烟火</small><em>WEB</em></div><iframe title="电脑端老街" ref={element=>{frames.current.desktop=element;}} src={frameURL('desktop')} style={{width:desktop,height:desktopHeight}}/></div></div></section>
   <section className="preview-device preview-phone" aria-label="手机网页预览"><div className="preview-device-caption"><span>02 / MOBILE</span><b>{p.width} × {p.height}</b></div><div className="phone-scaled" data-orientation={landscape?'landscape':'portrait'}><div className="phone-frame"><div className="phone-screen"><div className="phone-status" aria-hidden="true"><span>9:41</span><span>▮▮▮  ▰</span></div><b className="phone-island" aria-hidden="true"/><iframe title="手机端老街" ref={element=>{frames.current.phone=element;}} src={frameURL('phone')} style={{width:p.width,height:p.height}}/><div className="phone-home" aria-hidden="true"/></div></div></div></section>
  </div>
  <footer className="dual-preview-footer"><p>在任意一边操作，另一边跟着逛。关掉同步，可以单独检查布局。</p><small>手机为浏览器尺寸预览 · 预览中的食篮不会覆盖正式进度</small></footer>
 </main>;
}
