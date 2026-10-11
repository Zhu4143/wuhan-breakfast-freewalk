import type {ShopEraFrame} from '../atelier/EraSequence';
import {shopPlots} from './layout.ts';

/** Entry to lane end, alternating across the street. Stable IDs match the walking plots. */
export const eraShopOrder = ['noodle', 'doupi', 'mianwo', 'east-middle', 'west-end', 'east-end'] as const;
const shopPositions = eraShopOrder.map(id=>{const plot=shopPlots.find(p=>p.id===id)!;return [plot.x,plot.z] as const;});
export const dominoTiming = {spacing: .88, shopDuration: 1.96, panelDuration: .62, panelSpacing: .12} as const;
export const dominoDuration = (eraShopOrder.length - 1) * dominoTiming.spacing + dominoTiming.shopDuration;
const clamp = (n: number) => Math.min(1, Math.max(0, n));
const ease = (n: number) => {const t = clamp(n); return t*t*(3-2*t);};

/** One reversible playhead: reversing it reverses both the street and its internal layers. */
export function shopEraFrame(id: string, progress: number): ShopEraFrame {
  const index = eraShopOrder.indexOf(id as typeof eraShopOrder[number]);
  if(index < 0) throw new Error('Unknown era shop: ' + id);
  const elapsed = clamp(progress) * dominoDuration - index * dominoTiming.spacing;
  const panels = Array.from({length:4}, (_,i) => ease((elapsed-i*dominoTiming.panelSpacing)/dominoTiming.panelDuration));
  return {
    turn: clamp(elapsed/dominoTiming.shopDuration),
    panels,
    wall: panels.reduce((sum,p) => sum+p,0)/panels.length,
    furniture: ease((elapsed-.92)/.38),
    keeper: ease((elapsed-1.26)/.34),
    food: ease((elapsed-1.56)/.40),
  };
}

export function nearestEraShop(x: number, z: number): typeof eraShopOrder[number] {
  let best=0,distance=Infinity;
  shopPositions.forEach(([sx,sz],i)=>{const d=(x-sx)**2+(z-sz)**2;if(d<distance){distance=d;best=i;}});
  return eraShopOrder[best];
}

export function eraAtPosition(progress: number, x: number, z: number): number {
  return shopEraFrame(nearestEraShop(x,z),progress).furniture;
}

/** A changed side collapses to its seam before its replacement appears. */
export const paperSeam = (progress: number) => Math.max(.025, Math.abs(Math.cos(progress*Math.PI)));
