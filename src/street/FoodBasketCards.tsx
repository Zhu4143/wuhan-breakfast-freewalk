import {photoZinesForFoods,photoZineAsset} from './photoZines';
import type {FoodNote} from './tourContent';

export function FoodBasketCards({foods,onView,onRemove,onVisit}:{foods:readonly FoodNote[];onView:(id:FoodNote)=>void;onRemove:(id:FoodNote)=>void;onVisit:(id:FoodNote)=>void}){
 return <div className="basket-posters" aria-label="食篮里的影笺">{photoZinesForFoods(foods).map(zine=><article className="basket-poster-card" key={zine.food} data-food={zine.food}>
  <button className="basket-poster" onClick={()=>onView(zine.food)} aria-label={'放大食篮里的'+zine.title+'影笺'} aria-haspopup="dialog">
   <img src={photoZineAsset(zine.id,true)} alt={zine.alt} width="240" height="400" decoding="async" loading="lazy"/>
   <span><b>{zine.title}</b><small>{zine.pinyin}</small></span>
  </button>
  <div className="basket-poster-actions"><button onClick={()=>onVisit(zine.food)} aria-label={'再去'+zine.title+'的小铺'}>再去小铺 ↗</button><button className="basket-poster-remove" aria-label={'移出'+zine.title} onClick={()=>onRemove(zine.food)}>×</button></div>
 </article>)}</div>;
}
