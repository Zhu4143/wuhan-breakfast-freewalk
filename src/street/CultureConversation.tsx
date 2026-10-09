import {useEffect,useRef,useState} from 'react';
import type {Era} from '../atelier/content';
import {cultureAnswer,cultureAudio,cultureQuestions,cultureSpeaker,type FoodCultureDialogue} from './foodCultureDialogue';
import {CultureVoice} from './CultureVoice';
import {PaperPresence,PaperSwap} from './PaperMotion';
import './culture.css';

type Props={dialogue:FoodCultureDialogue;era:Era;open:boolean;active:boolean;read:readonly string[];onRead:(id:string)=>void;onClose:()=>void;onSources:(ids:string[])=>void;onSpeak:()=>void;onVoiceReady:(voice:CultureVoice|null)=>void};
export function CultureConversation({dialogue,era,open,active,read,onRead,onClose,onSources,onSpeak,onVoiceReady}:Props){
 const [topicId,setTopicId]=useState<string|null>(null),[offset,setOffset]=useState(0),[voiceFailed,setVoiceFailed]=useState(false);
 const callbacks=useRef({onSpeak});callbacks.current={onSpeak};
 const voice=useRef<CultureVoice|null>(null);
 const line=dialogue.topics.find(t=>t.id===topicId)??dialogue.opening;
 const text=cultureAnswer(line,era),clip=cultureAudio(line,era),questions=cultureQuestions(dialogue,topicId,read,offset),speaker=cultureSpeaker(dialogue,era);
 useEffect(()=>{
  voice.current=new CultureVoice(undefined,()=>setVoiceFailed(true));onVoiceReady(voice.current);
  return()=>{voice.current?.stop();voice.current=null;onVoiceReady(null);};
 },[]);
 useEffect(()=>{
  setVoiceFailed(false);if(active){voice.current?.play(clip);callbacks.current.onSpeak();}
  return()=>voice.current?.stop();
 },[active,clip,topicId,era]);
 useEffect(()=>{
  if(!open)return;const frame=requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>('.culture-card .culture-questions button')?.focus());
  return()=>cancelAnimationFrame(frame);
 },[open]);
 const choose=(id:string)=>{voice.current?.stop();setTopicId(id);setOffset(0);onRead(id);requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>('.culture-card .culture-questions button')?.focus());};
 return <PaperPresence show={open}><section className="culture-card" role="region" aria-label={'和'+speaker+'聊聊'} data-topic={topicId??'opening'} data-era={era}>
  <header className="culture-heading"><div><span>柜台边 · 聊两句</span><h2>{speaker}</h2></div><button onClick={onClose} aria-label="结束交流，先逛逛">先逛逛 ×</button></header>
  <PaperSwap id={`${topicId??'opening'}:${era}`} className="culture-line"><div role="status" aria-live="polite" aria-atomic="true"><p className="culture-reply">“{text}”</p></div></PaperSwap>
  <div className="culture-questions" aria-label="想问的问题">{questions.map(topic=><button key={topic.id} onClick={()=>choose(topic.id)} disabled={!active} data-topic={topic.id} data-read={read.includes(topic.id)}><span>{topic.question}</span><i aria-label={read.includes(topic.id)?'已聊过':undefined}>{read.includes(topic.id)?'✓':'↗'}</i></button>)}</div>
  <footer className="culture-footer"><span>{line.kind==='scene'?'生活情境 · 虚构摊主':line.kind==='mixed'?'资料与生活情境':'文化资料 · 摊主口吻改写'}</span><button disabled={!active} onClick={()=>setOffset(n=>n+3)}>换几个问题 →</button>{line.sourceIds.length>0&&<button onClick={()=>onSources([...line.sourceIds])}>查看资料来源 ↗</button>}{clip&&<button disabled={!active} onClick={()=>{setVoiceFailed(false);voice.current?.play(clip);}}>再听一遍</button>}</footer>
  {voiceFailed&&<p className="culture-voice-note" role="status">这段声音暂时没能播放，文字可以继续看。</p>}
 </section></PaperPresence>;
}
