import type {Era} from '../atelier/content';
import './eraSwitch.css';

/** One glass thumb moves between both labels instead of recoloring two separate buttons. */
export function EraSwitch({value,onChange,disabled=false}:{value:Era;onChange:(era:Era)=>void;disabled?:boolean}){
 return <div className="explore-era era-switch" data-selected={value} role="group" aria-label="老街年代" onClick={event=>event.stopPropagation()}>
  <span className="era-switch-thumb" aria-hidden="true"/>
  <button type="button" onClick={()=>onChange('past')} aria-pressed={value==='past'} disabled={disabled}>昔日</button>
  <button type="button" onClick={()=>onChange('present')} aria-pressed={value==='present'} disabled={disabled}>今日</button>
 </div>;
}
