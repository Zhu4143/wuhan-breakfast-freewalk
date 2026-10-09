import {tourStops,type TourPage,type TourStop,type FoodNote} from './tourContent.ts';
import {breakfastShops} from './breakfastShops.ts';
export type PlaceId='noodle'|'doupi'|'mianwo'|'market'|'neighbors'|'courtyard'|'east-middle'|'west-end'|'east-end';
export type Place={id:PlaceId;name:string;short:string;kind:string;food?:FoodNote;anchor:[number,number,number];stop:TourStop;stopIndex:number;chapters:{title:string;pages:TourPage[];stop?:number;view?:TourStop;compare?:boolean}[]};
const doupi:TourStop={id:'doupi',name:'豆皮铺',position:[2.65,2.45,3.2],look:[6.4,2.1,2.1],dawn:.38,pages:[
 {label:'文化小札 · 三鲜豆皮',title:'薄皮裹糯米，切开是三鲜。',text:'绿豆与大米磨成的浆，配上鸡蛋摊成金黄薄皮；里面裹着糯米和肉、香菇、笋丁。不同店家有自己的配方。看看铁盘边的切面：薄皮、米粒与馅料各有层次，一口外脆，一口软糯。',kind:'fact',sources:['T6','T4']},
 {label:'周姨 · 虚构店主',title:'“这一盘，给清晨留着。”',text:'周姨把铲子放在盘边，笑着招呼：“慢慢吃，还热着。”墙后的蒸笼里是下一锅糯米，搪瓷碗已经叠好。你可以先收进食篮，也可以换一个话题看看；逛到哪里，全由你的胃口决定。',kind:'story'},
]};
const doupiObject:TourStop={...doupi,id:'doupi-spatula',name:'盘边的旧铲',position:[3.45,2.45,5.1],look:[6.35,1.93,5.15],pages:[
 {label:'旧物近看 · 场景观察',title:'一把铲子，留着手的分寸。',text:'木柄被磨得圆润，铁面上留着几道浅痕。它是这间虚构小铺的旧物：切开、托起，再送进碗里。近看柜台上的独立铁铲，也看看旁边的蓝边碗；这些物件都有厚度，能遮挡，也能投影。',kind:'observation'},
 {label:'周姨 · 虚构对白',title:'“工具顺手，心里才有数。”',text:'“这铲子我留着，握着舒服。”周姨指了指木柄。今日的台面更容易擦洗，客人会带自己的餐盒来，盘边的铲子和那扇旧窗却还在。这里讲的是创作的生活片段，不是某家真实老字号的掌故。',kind:'story'},
]};
const doupiEras:TourStop={...doupi,id:'doupi-eras',name:'豆皮铺的今昔',position:[2.65,2.45,3.2],look:[7.1,2.55,3.3],pages:[
 {label:'今昔对照 · 情境演绎',title:'旧窗仍在，清晨换了新习惯。',text:'翻过四扇纸墙：补过的灰墙变成修整后的浅绿墙，木台面换成便于擦洗的台面，纸包旁的位置放上了可重复使用的餐盒。周姨换上豆绿围裙，蒸笼、旧窗与铁铲留在原处。两种清晨共享同一间小铺。',kind:'observation'},
]};
const mianwo:TourStop={id:'mianwo',name:'面窝摊',position:[-2.65,2.45,-5.4],look:[-6.4,2.1,-5],dawn:.42,pages:[
 {label:'文化小札 · 面窝',title:'厚边薄心，藏着一把勺。',text:'湖北文旅的介绍提到，米浆与黄豆浆倒入专用铁勺，形成厚边、薄心的面窝。不同部位带来不同口感，一道小吃的形状，也留下了器具的痕迹。',kind:'fact',sources:['T3']},
 {label:'历史与传说',title:'从看得见的手艺开始。',text:'关于面窝的起源，有流传的故事；湖北文旅的资料同时提醒，它们没有具体文字记载。本作不替传说下定论，就从眼前的米浆、铁勺和做法认识这一味。',kind:'fact',sources:['T3']},
]};
const addedPlaces:Place[]=breakfastShops.map((shop,i)=>{
 const {id,name}=shop,x=i===1?-3.2:3.2,z=[-8,-17,-19][i];
 const facts=[
  {title:'一碗鲜味，把鱼和米粉连起来。',text:'武汉市政府的食单列有米粉、鲫鱼、胡椒、生姜、小葱等材料。商务局转载的报道介绍，鱼熬成汤底，再调成糊汤，配米粉和油条。各家做法有差异，眼前的锅台是创作演绎。',sources:['T4','T7']},
  {title:'褶口之下，是软糯的米香。',text:'武汉的重油烧麦以糯米和配料形成饱满的馅，公开食单列有糯米、猪肉、香菇。武汉商务的介绍也提到重油与胡椒的风味。烧梅、烧麦的写法会在食单里遇见；这里用“烧梅”给虚构小铺命名。',sources:['T4','T8']},
  {title:'小小一笼，藏着鲜肉与汤汁。',text:'武汉的公开食单将鲜肉汤包列为名点，介绍薄皮与鲜汤的特点，列有面粉、猪肉、生姜、醋等材料。眼前的小笼与姜醋碟是依据这些元素创作的器物；这间巷尾汤包馆不是现实中的老字号。',sources:['T4','T8']},
 ][i];
 const pages:TourPage[]=[{label:'文化小札 · '+shop.food,kind:'fact',...facts},{label:shop.keeper+' · 虚构店主',title:shop.greeting,text:[
  '何叔把汤勺搭在锅沿，指了指旁边的油条：“喜欢脆的就掰一点，喜欢软的就多蘸一会儿。”胡椒罐、蓝边碗和灶边的抹布，都留着一个清晨正在忙碌的样子。',
  '桂姨揭开竹笼，热气绕过笼沿。“先别急，我把这一笼端稳。”案板上的擀面杖与一小堆面皮，让你看见蒸笼之外的那段准备。',
  '陈伯把小笼往台前挪了一点，顺手放好醋碟：“坐一会儿，汤还热。”碗碟各有位置，姜丝放在旁边，下一笼也已经准备好。',
 ][i],kind:'story'}];
 // Stand beside the street lamp, so its pole cannot bisect the counter and keeper.
 const stop:TourStop={id,name,position:[x,2.45,z+.95],look:[x<0?-6.55:6.55,2.55,z+.30],dawn:.4,pages};
 const objectText=[
  '看锅沿的长柄汤勺、汤面里的细粉和旁边两股相连的油条。汤锅有弧形锅壁与侧把，蓝边碗留在台前；这些都是独立的立体器物，近看时会彼此遮挡。',
  '竹笼里，烧梅的开口露出糯米与小块配料；每只烧梅的薄皮围成褶口。笼旁摆着擀面杖、面皮和备料罐，柜台后的包制台仍在同一位置。',
  '汤包用收拢的褶口封住馅，与隔壁开口的烧梅不同。留意小笼的竹圈、台前的蘸料碟与姜丝，以及准备下一笼的案板。',
 ][i];
 return {id,name,short:shop.food,kind:['鲜汤裹粉，胡椒暖香','糯米软香，掀笼见热气','薄皮鲜肉，一口鲜汤'][i],food:id,anchor:[x<0?-5.35:5.35,3.55,z],stop,stopIndex:10+i,chapters:[
  {title:'这一味',pages},
  {title:shop.object,pages:[{label:'器物近看 · 场景观察',title:shop.object+'，也有手的记忆。',text:objectText,kind:'observation'}]},
  {title:'看今昔',compare:true,pages:[{label:'今昔对照 · 虚构情境',title:'门还是这一扇，清晨接着开。',text:`昔日是${shop.keeper}在柜台后，今日换成${shop.todayKeeper}。翻过纸墙，旧木台面换成易擦洗的台面，灶具、收纳、餐盒与招牌一起更新；${shop.object}仍留在熟悉的位置。人物、店名和开门时刻都是本作的艺术创作。`,kind:'observation'}]},
 ]};
});
export const places:Place[]=[
 {id:'noodle',name:'林记热干面',short:'热干面',kind:'芝麻香，趁热拌',food:'noodle',anchor:[-5.35,4.1,5],stop:tourStops[2],stopIndex:2,chapters:[{title:'这一碗',pages:tourStops[2].pages,stop:2},{title:'手艺与来历',pages:tourStops[3].pages,stop:3},{title:'看今昔',pages:tourStops[4].pages,stop:4}]},
 {id:'doupi',name:'豆皮铺',short:'三鲜豆皮',kind:'金黄外层，糯米软香',food:'doupi',anchor:[5.35,4,3],stop:doupi,stopIndex:8,chapters:[{title:'这盘豆皮',pages:doupi.pages},{title:'铲边旧物',pages:doupiObject.pages,view:doupiObject},{title:'看今昔',pages:doupiEras.pages,view:doupiEras,compare:true}]},
 {id:'mianwo',name:'面窝摊',short:'面窝',kind:'厚边薄心，酥香一口',food:'mianwo',anchor:[-5.35,4,-6],stop:mianwo,stopIndex:9,chapters:[{title:'认识面窝',pages:mianwo.pages},{title:'看今昔',compare:true,pages:[{label:'面窝铺今昔 · 场景观察',title:'旧勺不换，清晨接着开门。',text:'翻过纸墙，留意同一间厨房：斑驳的旧砖墙修整成浅色瓷砖，炉台换上便于擦洗的台面，麻袋的位置放着收纳罐，旁边多了纸餐盒。柜台、雨棚和招牌一起变化，背景中的两代店主也不同。这是虚构小铺的生活演绎。',kind:'observation'}]}]},
 {id:'market',name:'巷口菜摊',short:'过早小札',kind:'听听武汉的早餐故事',anchor:[-5.8,3.4,13],stop:tourStops[1],stopIndex:1,chapters:[{title:'武汉过早',pages:tourStops[1].pages}]},
 {id:'neighbors',name:'街坊留言',short:'街坊日常',kind:'一声招呼，一张纸条',anchor:[-5.4,3.7,-25],stop:tourStops[6],stopIndex:6,chapters:[{title:'街坊日常',pages:tourStops[6].pages}]},
 {id:'courtyard',name:'巷尾树下',short:'坐一会儿',kind:'回望来路，收好记忆',anchor:[2,3.8,-30],stop:tourStops[7],stopIndex:7,chapters:[{title:'慢慢坐',pages:[{label:'我 · 巷尾回望',title:'不赶路，也是一种逛法。',text:'回头看看来时的街。有人提着菜，有人在面摊边坐下，太阳慢慢照亮木窗。你随时可以回地图再选一家，也可以打开食篮，带走今天记下的味道。',kind:'story'}]}]},
 ...addedPlaces,
];
export const placeById=(id:PlaceId)=>places.find(p=>p.id===id)!;
