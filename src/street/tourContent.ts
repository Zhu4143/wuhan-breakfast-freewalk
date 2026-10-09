import type {Era} from '../atelier/content';
export type TourPage={label:string;title:string;text:string;kind:'fact'|'story'|'observation';sources?:string[]};
export type TourStop={id:string;name:string;position:[number,number,number];look:[number,number,number];dawn:number;pages:TourPage[]};
export const tourSources=[
 {id:'T1',title:'湖北美食上线，你“鄂”了么？',by:'中国非物质文化遗产网 · 湖北省非遗保护中心',date:'2020-05-20',url:'https://www.ihchina.cn/special2020_gdfc_detail/20947.html',note:'支持“过早”的含义与轧面、掸面、调味等技艺环节。真实项目身份不属于虚构林记。'},
 {id:'T2',title:'武汉热干面：一碗烟火气，几多江湖情',by:'中国新闻网 · 武汉市政府转载',date:'2022-12-07',url:'https://www.wuhan.gov.cn/sy/kwh/202212/t20221207_2111754.shtml',note:'报道引述《汉口竹枝词》并介绍码头生活背景；李包的起源故事在原文中标为“相传”。'},
 {id:'T3',title:'武汉面窝',by:'湖北省文化和旅游厅 · 志说湖北',date:'2016-06-06',url:'https://wlt.hubei.gov.cn/bmdt/ztzl/zshb/201912/t20191226_1799589.shtml',note:'米浆、黄豆浆与专用铁勺；明确指出起源传说缺乏具体文字记载。'},
 {id:'T4',title:'武汉十大名点',by:'武汉市政府公开资料 · PDF 第 1—15 页',date:'2025-06 · 文件目录',url:'https://www.wuhan.gov.cn/wwwz/ywwz_1/H_1/NWP/202506/P020250626403473866731.pdf',note:'采用热干面、豆皮、面窝、汤包、糊汤粉与重油烧麦的材料与形态；不据单一宣传资料判定唯一发明者。'},
 {id:'T5',title:'探寻武汉老字号的活态传承',by:'武汉市商务局',date:'2025-06-17',url:'https://sw.wuhan.gov.cn/xwdt/gzdt/202506/t20250617_2596270.shtml',note:'记录武汉图书馆举办的“过早”文化与传承讲座，支持当代文化传播的介绍。'},
 {id:'T6',title:'武汉三鲜豆皮成了“世界的味道”',by:'长江日报 · 武汉市政府转载',date:'2025-03-21',url:'https://www.wuhan.gov.cn/sy/whyw/202503/t20250321_2555376.shtml',note:'采用米浆、鸡蛋薄皮、糯米及肉、香菇、笋丁的材料与层次；不推定唯一配方、发明者或虚构豆皮铺的真实传承身份。'},
 {id:'T7',title:'跟着味蕾去旅行！在武汉“过早”是怎样一种体验',by:'武汉市商务局 · 媒体报道转载',date:'2025-10-03',url:'https://sw.wuhan.gov.cn/xwdt/mtbd/202510/t20251003_2656165.shtml',note:'支持糊汤粉的鱼汤、米粉、胡椒与油条搭配；各家配方不同。虚构的何记不是报道中的真实店铺。'},
 {id:'T8',title:'早晚微凉~武汉新生“暖身”美食指南这就奉上',by:'武汉市商务局 · 武汉商务',date:'2026-09-14',url:'https://sw.wuhan.gov.cn/xwdt/gzdt/202609/t20260914_2847335.shtml',note:'支持武汉烧麦的重油、胡椒风味与汤包的薄皮、鲜汤特点。店名、人物、年代变化与开门时刻均为创作。'},
] as const;
export const tourStops:TourStop[]=[
 {id:'gate',name:'走进清晨',position:[.4,2.45,20],look:[-.3,2.7,-3],dawn:.20,pages:[
  {label:'我 · 初到巷口',title:'早啊，进去逛逛。',text:'石板路还有一点潮，木窗已经支起来了。我们沿着这条街慢慢走，先认识武汉的“过早”，再去林记看看一碗热干面的故事。',kind:'story'},
  {label:'这趟清晨',title:'用自己的脚步，读一条街。',text:'拖动画面可以左右环顾；读完一页再往前走。你会经过八处停留点，看食物、看手艺，也看看同一间小铺的两个年代。街道与人物是艺术创作，文化资料可以随时查阅。',kind:'observation'},
 ]},
 {id:'breakfast',name:'武汉过早',position:[-2.6,2.45,13.5],look:[-6.3,1.8,12.8],dawn:.25,pages:[
  {label:'文化小札 01',title:'“过早”，就是吃早餐。',text:'在武汉的地方饮食语境里，早餐被称作“过早”。热干面是其中的经典小吃。它既是一顿饭，也把人们每天的出门、碰面和忙碌连在一起。',kind:'fact',sources:['T1']},
  {label:'历史的一页',title:'这两个字，早已写进诗里。',text:'武汉市政府转载的报道引述清代《汉口竹枝词》，其中已有“过早”的说法；报道也把快捷的街头早餐放进码头与商埠生活中理解。眼前的菜摊，是依据这些生活意象创作的场景。',kind:'fact',sources:['T2']},
 ]},
 {id:'noodle',name:'林记一碗面',position:[-3.45,2.45,5.7],look:[-6.25,2.60,4.4],dawn:.32,pages:[
  {label:'林姐 · 虚构店主',title:'“来一碗？趁热拌开。”',text:'你站到柜台前，芝麻香先一步飘了过来。林姐把碗往你面前轻轻一推：“不赶时间，就在门边坐坐。”',kind:'story'},
  {label:'文化小札 02',title:'面、酱与配料，各有位置。',text:'碱水面与芝麻酱是热干面的辨识元素；公开食单也列有酱油、醋、辣椒油、葱与萝卜丁等。不同店家有自己的调味习惯，一份食单并不是唯一的“标准答案”。',kind:'fact',sources:['T4']},
 ]},
 {id:'craft',name:'手艺与来历',position:[-3.5,2.45,6.3],look:[-6.4,2.32,6.6],dawn:.36,pages:[
  {label:'文化小札 03',title:'手艺，藏在先后与分寸里。',text:'非遗资料介绍蔡林记热干面制作时，分别谈到轧面、掸面和调味。面条的状态、时间与温度都需要照看。这里借酱罐讲述手艺，但虚构的林记并不是该非遗项目的真实商户。',kind:'fact',sources:['T1']},
  {label:'历史与传说',title:'好听的故事，也要看出处。',text:'有报道讲述李包偶然将油洒到面上的故事，并明确写作“相传”；另一些介绍采用蔡林记的起源叙述。本作保留这种差异，不把某个传说当成已经证实的唯一发明史。',kind:'fact',sources:['T2','T4']},
 ]},
 {id:'eras',name:'同一店的今昔',position:[-2.3,2.45,5.2],look:[-6.8,3.05,5.1],dawn:.42,pages:[
  {label:'昔日与今日 · 情境演绎',title:'翻过纸墙，看看今天。',text:'从“昔日”切到“今日”，留意台面、雨棚、外带物件和站在柜台后的店主。纸墙会翻转，酱罐仍留在熟悉的位置。这是一段虚构的两代人故事。',kind:'observation'},
  {label:'把故事带回现实',title:'传承，也发生在今天。',text:'2025 年，武汉图书馆的“名家论坛”以老字号与“过早”文化为题开展讲座。饮食文化会被讲述、记录，也继续出现在每天的餐桌上。林记的变化，是对这种延续的创作表达。',kind:'fact',sources:['T5']},
 ]},
 {id:'menu',name:'一街百味',position:[.45,2.45,-8],look:[-3.5,2.55,-11],dawn:.48,pages:[
  {label:'街边食单',title:'一条街，不止一碗面。',text:'三鲜豆皮常呈金色方块，包含糯米、鸡蛋和馅料；面窝则用米浆与黄豆浆制作，厚边、薄心与专用铁勺的形状有关。点开下面的食单，可以把感兴趣的一味记在手册里。',kind:'fact',sources:['T3','T4']},
  {label:'文化小札 04',title:'形状，也是手艺留下的痕迹。',text:'面窝的厚薄带来不同口感。湖北文旅的介绍同时提醒：其起源故事没有具体文字记载。认识一道食物，可以从看得见的材料、器具与做法开始。',kind:'fact',sources:['T3']},
 ]},
 {id:'neighbors',name:'街坊与日常',position:[-2.25,2.45,-25.0],look:[-5.85,2.35,-25.5],dawn:.55,pages:[
  {label:'我 · 留言板前',title:'食物之外，还有这些小事。',text:'修伞、借书、钥匙招领——街坊的纸条留在木板上。你可以再翻一次今昔，看看消息怎样变化。这些纸条与器物是情境创作，并不是历史档案的复制。',kind:'story'},
  {label:'留意身边',title:'一声招呼，也值得记住。',text:'这趟路上，有赶着出门的人，也有停下来吃面的人。热气、手艺与彼此照应的习惯，一起构成了我们想讲的清晨。走到街尾，再选一件你最想留下的记忆。',kind:'story'},
 ]},
 {id:'ending',name:'把清晨带走',position:[.4,2.45,-32.2],look:[-.7,3.1,-10],dawn:.64,pages:[
  {label:'我 · 街尾回望',title:'把清晨，留在身边。',text:'太阳高了一点。你从巷口走到了街尾，也从一碗热干面走近了“过早”的文化。回头看看，留下的是哪一部分：一口味道，手上的分寸，还是街坊间的招呼？',kind:'story'},
 ]},
];
export const foodNotes=[
 {id:'noodle',name:'热干面',image:'storybook/bowl.webp',line:'碱水面 · 芝麻酱',text:'趁热拌开，认识这一碗的酱香。',sources:['T1','T4']},
 {id:'doupi',name:'三鲜豆皮',image:'objects/doupi.svg',line:'金色外层 · 糯米与馅料',text:'从层次与形状，看看一口锅的分寸。',sources:['T4']},
 {id:'mianwo',name:'面窝',image:'objects/mianwo.svg',line:'米与黄豆 · 厚边薄心',text:'专用铁勺，把口感留在了形状里。',sources:['T3']},
 {id:'east-middle',name:'鲜鱼糊汤粉',image:'objects/hutangfen-v11.svg',line:'鱼汤与米粉 · 胡椒暖香',text:'浓汤裹住细粉，油条蘸一口清晨。',sources:['T4','T7']},
 {id:'west-end',name:'重油烧梅',image:'objects/shaomai-v11.svg',line:'糯米与肉丁 · 胡椒香',text:'褶口收住软糯，掀笼是一阵热气。',sources:['T4','T8']},
 {id:'east-end',name:'鲜肉汤包',image:'objects/tangbao-v11.svg',line:'薄皮鲜肉 · 一口汤汁',text:'小笼刚揭开，先慢慢尝这一口。',sources:['T4','T8']},
] as const;
export type FoodNote=typeof foodNotes[number]['id'];
export const memoryChoices=['这一口芝麻香','手上的分寸','街坊的一声招呼'] as const;
export const tourEraLabel:Record<Era,string>={past:'昔日 · 创作场景',present:'今日 · 创作场景'};
