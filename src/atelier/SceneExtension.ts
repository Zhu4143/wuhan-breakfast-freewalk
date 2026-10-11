import type * as T from 'three';
import type {PaperWorkshop} from './PaperWorkshop';
import type {Detail} from './content';
import type {EraSequence} from './EraSequence';

/** An environment adds world-space scenery while the original shop owns its details. */
export interface SceneExtension{
  readonly ownsPointer?:boolean;
  beforeFrame?(dt:number):void;
  readonly illustrated?:boolean;
  readonly eraSequence?:EraSequence;
  configure(scene:T.Scene,renderer:T.WebGLRenderer,camera:T.PerspectiveCamera,shop:T.Group):void;
  build(workshop:PaperWorkshop,scene:T.Scene,shop:T.Group):Promise<void>;
  view(detail:Detail,aspect:number,orbit:number):{position:T.Vector3;target:T.Vector3;direct?:boolean;fov?:number};
  /** turn is the era playhead (or the original wall hinge without a sequence), independent of ambient pause. */
  update(time:number,camera:T.PerspectiveCamera,turn:number,motion?:boolean):void;
  dispose():void;
}
