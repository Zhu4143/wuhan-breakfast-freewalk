import type {FoodNote,TourStop} from './tourContent';

/** Contemporary photo artworks, shown as a street exhibition in either story era. */
export const photoZines=[
 {id:'tower-and-bridges',food:'noodle',title:'热干面',pinyin:'RE GAN MIAN',scene:'楼与桥之间',line:'一碗酱香，和桥索、飞檐一起收进这张晨光里。',alt:'热干面影笺，红色大写拼音与面碗版画结合黄鹤楼和桥梁摄影拼贴'},
 {id:'railway-and-tower',food:'doupi',title:'三鲜豆皮',pinyin:'DOU PI',scene:'列车经过的清晨',line:'金色豆皮的层次，沿着铁轨的弧线记下一段清晨。',alt:'三鲜豆皮影笺，竖排 DOU PI 与豆皮图形放在列车和黄鹤楼旁的留白处'},
 {id:'rooftops-and-tower',food:'mianwo',title:'面窝',pinyin:'MIAN WO',scene:'屋顶之上',line:'灰瓦的折线之外，留一枚金黄面窝和轻轻排下的字。',alt:'面窝影笺，竖排衬线拼音和金色面窝图形结合灰瓦民居与黄鹤楼'},
 {id:'bridge-and-spire',food:'east-middle',title:'鲜鱼糊汤粉',pinyin:'HU TANG FEN',scene:'桥里的另一座塔',line:'桥塔框住远处的塔，一碗浓汤留住胡椒的暖香。',alt:'鲜鱼糊汤粉影笺，留白处的衬线拼音与汤粉碗结合红色桥塔摄影拼贴'},
 {id:'bridge-at-blue-hour',food:'west-end',title:'重油烧梅',pinyin:'SHAO MEI',scene:'江上的蓝调时刻',line:'灯沿着桥面亮起，褶口里的软糯也留在纸上。',alt:'重油烧梅影笺，横排大写拼音和烧梅图形结合蓝调江面与桥梁灯光'},
 {id:'tower-under-sunset',food:'east-end',title:'鲜肉汤包',pinyin:'TANG BAO',scene:'晚霞还没散',line:'灯火沿路弯过来，一只汤包收住这一晨的小小记忆。',alt:'鲜肉汤包影笺，竖排拼音与汤包图形融入晚霞、江面和黄鹤楼的纸质拼贴'},
] as const;

export const photoBoardAnchor:[number,number,number]=[-5.85,3.82,-25.5];
export const photoBoardStop:TourStop={id:'photo-board',name:'街坊影笺',position:[-3.3,2.45,-22.5],look:[-5.85,2.54,-25.5],dawn:.4,pages:[]};
export const photoZineForFood=(food:FoodNote)=>photoZines.find(zine=>zine.food===food)!;
export const photoZinesForFoods=(foods:readonly FoodNote[])=>foods.map(photoZineForFood);
export const photoZineAsset=(id:string,thumbnail=false)=>import.meta.env.BASE_URL+'assets/food-zines-v2/'+id+(thumbnail?'-thumb':'')+'.webp';
