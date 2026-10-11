import type * as T from 'three';
import type {ShopEraFrame} from '../atelier/EraSequence';

/** Shops share the renderer and resources; their era layers receive independent local progress. */
export interface ShopModule {
  readonly id: string;
  readonly root: T.Group;
  readonly anchors: ReadonlyMap<string, T.Vector3>;
  mount(socket: T.Group): void;
  setEraProgress(turn: number, frame?: ShopEraFrame): void;
  speak(): void;
  update(time: number, camera: T.Camera, motion: boolean): void;
  dispose(): void;
}

export type ShopFrame = {from: number; to: number; blend: number; blink: number; speaking: boolean};

/** Ambient time freezes on pause; a deliberate era turn remains independent. */
export function shopFrame(time: number, until: number, motion: boolean): ShopFrame {
  const speaking = motion && time < until;
  const sequence = [0, 1, 2, 4, 3, 1, 0, 2, 3, 4, 0, 0];
  const phase = time * 6.8, step = Math.floor(phase), f = Math.min(1, (phase - step) / .55);
  const blinkPhase = ((time + .6) % 4.3);
  return {from: speaking ? sequence[step % sequence.length] : 0,
    to: speaking ? sequence[(step + 1) % sequence.length] : 0,
    blend: f * f * (3 - 2 * f),
    blink: motion && blinkPhase < .22 ? Math.sin(Math.PI * blinkPhase / .22) : 0, speaking};
}

export const eraVisibility = (turn: number) => ({
  present: turn >= .5,
  // Hide foreground era objects while the back wall passes edge-on.
  furniture: turn < .18 || turn > .82,
  steam: Math.pow(Math.abs(Math.cos(turn * Math.PI)), 4),
});
