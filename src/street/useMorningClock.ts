import {useCallback,useEffect,useRef} from 'react';
import {advanceMorning,clampMorning} from './marketTime';
import {usePreviewState,previewIsDriver} from '../preview/previewBridge';

export function useMorningClock(active:boolean){
 const [progress,setProgress]=usePreviewState('clock.progress',0),[paused,setPaused]=usePreviewState('clock.paused',false);
 const value=useRef(0),last=useRef(0);
 value.current=progress;
 useEffect(()=>{
  last.current=performance.now();
  const tick=()=>{const now=performance.now(),elapsed=(now-last.current)/1000;last.current=now;
   if(!previewIsDriver())return;
   value.current=advanceMorning(value.current,elapsed,active&&!paused&&!document.hidden);setProgress(value.current);
  };
  // Account for visible dwell time, including slow frames; a hidden tab adds no time.
  const visibility=()=>{last.current=performance.now();};
  const timer=window.setInterval(tick,250);document.addEventListener('visibilitychange',visibility);
  return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',visibility);};
 },[active,paused]);
 const seek=useCallback((next:number)=>{value.current=clampMorning(next);last.current=performance.now();setProgress(value.current);},[]);
 return {progress,paused,setPaused,seek};
}
