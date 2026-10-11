import {cloneElement,useLayoutEffect,useRef,useState,type ReactElement,type ReactNode} from 'react';
import {gsap} from 'gsap';

/** Retain the actual card through its exit; reversing an exit starts at its live position. */
export function PaperPresence({show,children,onExited}:{show:boolean;children:ReactElement;onExited?:()=>void}){
 const [mounted,setMounted]=useState(show),node=useRef<HTMLElement|null>(null),lastChild=useRef(children);
 const latest=useRef({show,onExited});latest.current={show,onExited};
 const context=useRef<gsap.Context|null>(null),tween=useRef<gsap.core.Tween|null>(null);
 if(show)lastChild.current=children;
 useLayoutEffect(()=>{if(show)setMounted(true);},[show]);
 useLayoutEffect(()=>{
  if(!mounted||!node.current)return;
  context.current=gsap.context(()=>gsap.set(node.current,{opacity:0,y:matchMedia('(prefers-reduced-motion: reduce)').matches?0:14}),node.current);
  return()=>{context.current?.revert();context.current=null;};
 },[mounted]);
 useLayoutEffect(()=>{
  if(!mounted||!node.current)return;
  tween.current?.kill();const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  context.current?.add(()=>{tween.current=gsap.to(node.current,{opacity:show?1:0,y:show||reduced?0:14,duration:reduced?.16:show?.48:.28,ease:show?'power3.out':'power2.in',overwrite:true,onComplete:()=>{
   if(!latest.current.show){setMounted(false);latest.current.onExited?.();}
  }});});
  return()=>{tween.current?.kill();};
 },[show,mounted]);
 if(!mounted)return null;
 return cloneElement(lastChild.current as ReactElement<Record<string,unknown>>,{ref:(element:HTMLElement|null)=>{node.current=element;},'data-presence':show?'entered':'exiting','aria-hidden':show?undefined:true,inert:show?undefined:true});
}

/** Outgoing and incoming paper occupy the same grid cell, keeping the page's layout steady. */
export function PaperSwap({id,children,className=''}:{id:string;children:ReactNode;className?:string}){
 const [previous,setPrevious]=useState<{id:string;node:ReactNode}|null>(null);
 const container=useRef<HTMLDivElement>(null),height=useRef(0),resize=useRef<gsap.core.Tween|null>(null);
 const current=useRef({id,node:children});
 if(current.current.id!==id){const old=current.current;current.current={id,node:children};setPrevious(old);}
 else current.current.node=children;
 useLayoutEffect(()=>{
  const node=container.current;if(!node)return;
  resize.current?.kill();
  const incoming=node.lastElementChild as HTMLElement|null;if(!incoming)return;
  const style=getComputedStyle(node),next=incoming.offsetHeight+parseFloat(style.paddingTop)+parseFloat(style.paddingBottom);
  const from=height.current?node.getBoundingClientRect().height:next;
  if(height.current&&Math.abs(next-from)>1){
   gsap.set(node,{height:from});resize.current=gsap.to(node,{height:next,duration:matchMedia('(prefers-reduced-motion: reduce)').matches?.16:.4,ease:'power2.inOut',onComplete:()=>{gsap.set(node,{clearProps:'height'});}});
  }
  height.current=next;
  return()=>{resize.current?.kill();};
 },[id]);
 return <div ref={container} className={'paper-swap '+className}>
  {previous&&<PaperPresence key={previous.id} show={false} onExited={()=>setPrevious(null)}><div className="paper-swap-page">{previous.node}</div></PaperPresence>}
  <PaperPresence key={id} show><div className="paper-swap-page">{children}</div></PaperPresence>
 </div>;
}

export function PaperDialog({open,onClose,children,className='explore-sources',label}:{open:boolean;onClose:()=>void;children:ReactNode;className?:string;label?:string}){
 const ref=useRef<HTMLDialogElement>(null),animation=useRef<gsap.core.Timeline|null>(null);
 const latest=useRef(open);latest.current=open;
 useLayoutEffect(()=>{
  const node=ref.current;if(!node)return;
  const ctx=gsap.context(()=>gsap.set(node,{opacity:0,y:matchMedia('(prefers-reduced-motion: reduce)').matches?0:14,'--veil':0}),node);
  return()=>{animation.current?.kill();node.close();ctx.revert();};
 },[]);
 useLayoutEffect(()=>{
  const node=ref.current;if(!node)return;
  animation.current?.kill();
  if(open&&!node.open)node.showModal();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  animation.current=gsap.timeline({defaults:{duration:reduced?.16:open?.45:.26,ease:'power2.out'},onComplete:()=>{if(!latest.current)node.close();}})
   .to(node,{opacity:open?1:0,y:open||reduced?0:14,'--veil':open?1:0},0);
  return()=>{animation.current?.kill();};
 },[open]);
 return <dialog className={className} aria-label={label} ref={ref} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>{children}</dialog>;
}
