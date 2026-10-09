import type {Era} from '../atelier/content.ts';
import type {PlaceId} from './exploreContent.ts';
import type {tourSources} from './tourContent.ts';
import {breakfastShops} from './breakfastShops.ts';

export type CultureLine={
 answer:string;pastAnswer?:string;presentAnswer?:string;
 sourceIds:readonly (typeof tourSources)[number]['id'][];
 kind:'fact'|'scene'|'mixed';
 audio?:string;audioPast?:string;audioPresent?:string;
};
export type CultureTopic=CultureLine&{id:string;question:string;next?:readonly string[]};
export type FoodCultureDialogue={speaker:string;presentSpeaker?:string;opening:CultureLine;firstQuestions:readonly string[];topics:readonly CultureTopic[]};
export type CultureRead=Partial<Record<PlaceId,string[]>>;

const speakers=(id:typeof breakfastShops[number]['id'])=>{
 const shop=breakfastShops.find(s=>s.id===id)!;
 return {speaker:shop.keeper,presentSpeaker:shop.todayKeeper};
};

// Stable place IDs share the same conversation UI; life scenes are labeled separately from facts.
export const foodCultureDialogue:Partial<Record<PlaceId,FoodCultureDialogue>>={
 doupi:{
  speaker:'周姨',
  opening:{audio:'assets/audio/culture-v1/doupi/opening.mp3',answer:'这一盘还热着，先看看，你有什么想问的？做法、吃法，或者这条街的过早，都能聊两句。',sourceIds:[],kind:'scene'},
  firstQuestions:['skin','guozao','hours'],
  topics:[
   {id:'skin',audio:'assets/audio/culture-v1/doupi/skin.mp3',question:'这层皮是豆子做的吗？',answer:'你看这层金黄的薄皮，是绿豆和大米磨浆后，加上鸡蛋摊出来的。里头包的是糯米，不同店家的浆料配方会有些差别。',sourceIds:['T6','T7'],kind:'fact',next:['three-fresh','eat-hot','guozao']},
   {id:'three-fresh',audio:'assets/audio/culture-v1/doupi/three-fresh.mp3',question:'“三鲜”是哪三样？',answer:'常见的一种是鲜肉、香菇和笋丁。薄皮、糯米和馅料一起入口，才吃得出层次；各家也会有自己的配料。',sourceIds:['T6'],kind:'fact',next:['eat-hot','changes','city-pace']},
   {id:'eat-hot',audio:'assets/audio/culture-v1/doupi/eat-hot.mp3',question:'怎么吃最香？',answer:'刚铲出来的时候，皮边脆，里面的糯米还是软的。豆皮过去多在早餐铺现做现吃，我这锅也照这个意思，做好就招呼你来。',sourceIds:['T6'],kind:'mixed',next:['city-pace','neighbors','three-fresh']},
   {id:'guozao',audio:'assets/audio/culture-v1/doupi/guozao.mp3',question:'为什么叫“过早”？',answer:'我问你“过早没”，就是问早饭吃了没有。清代《汉口竹枝词》里已经有这个叫法，至于这两个字最初怎么来的，咱们不能凭一个故事就下定论。',sourceIds:['T1','T2'],kind:'fact',next:['city-pace','neighbors','hours']},
   {id:'city-pace',audio:'assets/audio/culture-v1/doupi/city-pace.mp3',question:'早饭为什么也吃得这么利落？',answer:'以前汉口的码头、商埠忙，船工、工人、商人赶着出门，快一点吃饱，才好干活。过早的利落，和这种日子分不开；你不赶路，就坐一会儿。',sourceIds:['T2'],kind:'mixed',next:['eat-hot','neighbors','changes']},
   {id:'neighbors',audio:'assets/audio/culture-v1/doupi/neighbors.mp3',question:'你和来吃的街坊都熟吗？',answer:'熟客站在这儿，会顺口问一句“今天忙不忙”，等一铲豆皮的工夫，就把近况聊了。吃早饭是正事，碰见熟人也算这条街的日常。',sourceIds:[],kind:'scene',next:['hours','changes','guozao']},
   {id:'hours',audioPast:'assets/audio/culture-v1/doupi/hours-past.mp3',audioPresent:'assets/audio/culture-v1/doupi/hours-present.mp3',question:'每天几点就开始忙？',answer:'天还蒙蒙亮，我就先备米和馅料，等锅台热起来，第一拨街坊也来了。忙归忙，遇到熟人还是要打个招呼。',presentAnswer:'今天一样先备米和馅料，赶着上学、上班的客人会拿餐盒带走。点单的方式变了，锅台前还是得一份份照看。',sourceIds:[],kind:'scene',next:['neighbors','changes','city-pace']},
   {id:'changes',audioPast:'assets/audio/culture-v1/doupi/changes-past.mp3',audioPresent:'assets/audio/culture-v1/doupi/changes-present.mp3',question:'现在和以前有什么不一样？',answer:'先把皮摊匀，再铺糯米和馅，熟了用铲子切开。街坊来了，我就从这口锅里给他们盛。',presentAnswer:'摊皮、铺糯米和馅的基本层次还在。今天也有预包装豆皮，能送到更远的地方；我这间小铺里，还是一锅锅做给眼前的客人。',sourceIds:['T6'],kind:'mixed',next:['skin','neighbors','guozao']},
  ],
 },
 mianwo:{
  speaker:'面窝摊主',
  opening:{audioPast:'assets/audio/culture-v1/mianwo/opening-past.mp3',audioPresent:'assets/audio/culture-v1/mianwo/opening-present.mp3',answer:'刚捞起来这一只，边上软，中间脆。你先看，我手上忙着，嘴上也能陪你聊两句。',sourceIds:[],kind:'scene'},
  firstQuestions:['shape','batter','hours'],
  topics:[
   {id:'shape',audioPast:'assets/audio/culture-v1/mianwo/shape-past.mp3',audioPresent:'assets/audio/culture-v1/mianwo/shape-present.mp3',question:'中间怎么这么薄？',answer:'看这把铁勺，四周凹下去，中间凸起来。米浆倒进去，中间刮薄，炸出来就成了厚边、薄心，两处口感不一样。',sourceIds:['T3'],kind:'fact',next:['crisp','batter','origin']},
   {id:'batter',audioPast:'assets/audio/culture-v1/mianwo/batter-past.mp3',audioPresent:'assets/audio/culture-v1/mianwo/batter-present.mp3',question:'叫面窝，里面却没有面粉？',answer:'常见的米面窝，主要用大米磨浆，再掺黄豆浆。还有葱花、盐这些调味，叫“面窝”，并不等于用面粉做。',sourceIds:['T3'],kind:'fact',next:['shape','crisp','varieties']},
   {id:'crisp',audioPast:'assets/audio/culture-v1/mianwo/crisp-past.mp3',audioPresent:'assets/audio/culture-v1/mianwo/crisp-present.mp3',question:'想吃脆一点的，怎么挑？',answer:'喜欢脆口，就挑薄心大一点的；喜欢软口，就多吃厚边。刚出锅热着，软和脆一起吃才有意思，先小口试试。',sourceIds:['T3','T8'],kind:'mixed',next:['varieties','neighbors','shape']},
   {id:'origin',audioPast:'assets/audio/culture-v1/mianwo/origin-past.mp3',audioPresent:'assets/audio/culture-v1/mianwo/origin-present.mp3',question:'是谁最早做出来的？',answer:'我听过一些起源说法，可不能拿传说当定论。现有资料也提醒，面窝的由来缺少具体文字记载，真要问最早是谁，还得留个问号。',sourceIds:['T3'],kind:'fact',next:['shape','varieties','neighbors']},
   {id:'varieties',audioPast:'assets/audio/culture-v1/mianwo/varieties-past.mp3',audioPresent:'assets/audio/culture-v1/mianwo/varieties-present.mp3',question:'所有面窝中间都有洞吗？',answer:'不都是，你眼前这种是米面窝。还有用红薯做的“苕面窝”和豌豆窝，样子就不一定带洞，过早的选择不止这一种。',sourceIds:['T3'],kind:'fact',next:['batter','origin','hours']},
   {id:'neighbors',audioPast:'assets/audio/culture-v1/mianwo/neighbors-past.mp3',audioPresent:'assets/audio/culture-v1/mianwo/neighbors-present.mp3',question:'排队的时候也能聊起来？',answer:'当然，等下一勺出锅，有人问街坊今天去哪里，有人替家里多带一只。话不长，早上碰个面，就知道彼此还好。',sourceIds:[],kind:'scene',next:['hours','crisp','origin']},
   {id:'hours',audioPast:'assets/audio/culture-v1/mianwo/hours-past.mp3',audioPresent:'assets/audio/culture-v1/mianwo/hours-present.mp3',question:'天没亮就来炸了？',answer:'先把米浆备好，再等油锅热起来，街坊早起了才有得吃。赶时间的拿了就走，不赶的站着说两句话。',presentAnswer:'今天也先备浆、热锅，有人拎着自带餐盒来，有人赶着上班带走。我这摊还是一勺勺炸，你慢一点，别烫着。',sourceIds:[],kind:'scene',next:['neighbors','varieties','crisp']},
  ],
 },
 'east-middle':{
  ...speakers('east-middle'),
  opening:{audioPast:'assets/audio/culture-v1/east-middle/opening-past.mp3',audioPresent:'assets/audio/culture-v1/east-middle/opening-present.mp3',answer:'这碗先慢慢端，汤还热。想问鱼汤，还是想听听街上的早晨？你问，我边盛边说。',sourceIds:[],kind:'scene'},
  firstQuestions:['fish','oil-strip','hours'],
  topics:[
   {id:'fish',audioPast:'assets/audio/culture-v1/east-middle/fish-past.mp3',audioPresent:'assets/audio/culture-v1/east-middle/fish-present.mp3',question:'有鱼味，怎么看不见鱼块？',answer:'鲜味在汤底里，常见做法是用小鲫鱼长时间熬汤。粉是圆米粉，吃的时候，鱼汤和米粉一起入口。',sourceIds:['T4','T7'],kind:'fact',next:['thick','pepper','river']},
   {id:'thick',audioPast:'assets/audio/culture-v1/east-middle/thick-past.mp3',audioPresent:'assets/audio/culture-v1/east-middle/thick-present.mp3',question:'这个汤为什么是糊的？',answer:'鱼汤里还要用生米粉调糊，才有这一碗稠稠的汤底。它和清汤粉不一样，汤会裹着米粉。',sourceIds:['T7'],kind:'fact',next:['fish','oil-strip','pepper']},
   {id:'pepper',audioPast:'assets/audio/culture-v1/east-middle/pepper-past.mp3',audioPresent:'assets/audio/culture-v1/east-middle/pepper-present.mp3',question:'这股辣味不是辣椒？',answer:'这股辛香主要是胡椒，能给鱼汤去腥、提味。各家浓淡不一样，你先尝一口，再说要不要添。',sourceIds:['T7'],kind:'mixed',next:['oil-strip','thick','hours']},
   {id:'oil-strip',audioPast:'assets/audio/culture-v1/east-middle/oil-strip-past.mp3',audioPresent:'assets/audio/culture-v1/east-middle/oil-strip-present.mp3',question:'油条为什么要蘸着吃？',answer:'油条和糊汤粉搭着过早，外头蘸上鱼汤，里面还有一点脆。想吃脆的就蘸一下，想吃软的就多浸一会儿，看你喜欢。',sourceIds:['T7','T8'],kind:'mixed',next:['river','neighbors','pepper']},
   {id:'river',audioPast:'assets/audio/culture-v1/east-middle/river-past.mp3',audioPresent:'assets/audio/culture-v1/east-middle/river-present.mp3',question:'这碗和武汉的江湖有关系？',answer:'长江、汉水在这里交汇，鱼和米也进了早餐碗。把鱼汤和米粉放在一起，是鱼米之乡的一种吃法，可不能因此就认定它是哪一个码头发明的。',sourceIds:['T4','T7'],kind:'fact',next:['fish','neighbors','hours']},
   {id:'neighbors',audioPast:'assets/audio/culture-v1/east-middle/neighbors-past.mp3',audioPresent:'assets/audio/culture-v1/east-middle/neighbors-present.mp3',question:'街坊为什么喜欢坐这里？',answer:'等一碗粉，桌边正好空着，就坐下来问问近况。有人说今天要办的事，有人只说一句“吃了没”，这早晨就有人搭话了。',presentAnswer:'今天有人边等粉边看手机，也有人放下手机，和同桌说两句。熟客、新来的客人都在这张桌边坐，聊不聊都随你。',sourceIds:[],kind:'scene',next:['hours','river','oil-strip']},
   {id:'hours',audioPast:'assets/audio/culture-v1/east-middle/hours-past.mp3',audioPresent:'assets/audio/culture-v1/east-middle/hours-present.mp3',question:'看着出得快，准备也快吗？',answer:'你来时只看见我盛一碗，前头熬汤、备粉却得花工夫。街坊一早赶着干活，准备在前，出餐时才不用久等。',presentAnswer:'你看我盛得快，是前头已经把汤和粉准备好。有人拿走赶上班，有人坐着吃，锅边都得照顾到。',sourceIds:[],kind:'scene',next:['fish','neighbors','thick']},
  ],
 },
 'west-end':{
  ...speakers('west-end'),
  opening:{audioPast:'assets/audio/culture-v1/west-end/opening-past.mp3',audioPresent:'assets/audio/culture-v1/west-end/opening-present.mp3',answer:'这一笼刚揭开，先别急着伸筷子。想看馅，还是想问味道？我给你慢慢说。',sourceIds:[],kind:'scene'},
  firstQuestions:['filling','rich-oil','hours'],
  topics:[
   {id:'filling',audioPast:'assets/audio/culture-v1/west-end/filling-past.mp3',audioPresent:'assets/audio/culture-v1/west-end/filling-present.mp3',question:'里面是米饭，不是纯肉馅？',answer:'武汉重油烧麦的馅里有糯米，也搭猪肉、香菇。外面是薄面皮，里面吃的是软糯和油润。',sourceIds:['T4','T8'],kind:'fact',next:['rich-oil','pepper','soup']},
   {id:'rich-oil',audioPast:'assets/audio/culture-v1/west-end/rich-oil-past.mp3',audioPresent:'assets/audio/culture-v1/west-end/rich-oil-present.mp3',question:'“重油”吃起来是什么感觉？',answer:'重油是这种武汉烧麦的一处特点，糯米馅蒸熟后油润，和胡椒香一起入口。不是光看油多，先尝一小口，才知道你喜不喜欢。',sourceIds:['T8'],kind:'mixed',next:['pepper','filling','hot']},
   {id:'pepper',audioPast:'assets/audio/culture-v1/west-end/pepper-past.mp3',audioPresent:'assets/audio/culture-v1/west-end/pepper-present.mp3',question:'怎么有这么明显的胡椒香？',answer:'武汉重油烧麦常强调胡椒的辛香，它和糯米、肉丁、香菇放在一起，味道就比较浓。各家的分量不一定一样。',sourceIds:['T8'],kind:'fact',next:['soup','rich-oil','hot']},
   {id:'soup',audioPast:'assets/audio/culture-v1/west-end/soup-past.mp3',audioPresent:'assets/audio/culture-v1/west-end/soup-present.mp3',question:'和隔壁汤包是同一种吗？',answer:'不是同一种，这里主要吃糯米馅的油润，汤包还要吃薄皮里的鲜汤。想试哪样都行，别把这只当成一口汤。',sourceIds:['T4','T8'],kind:'mixed',next:['filling','hot','neighbors']},
   {id:'hot',audioPast:'assets/audio/culture-v1/west-end/hot-past.mp3',audioPresent:'assets/audio/culture-v1/west-end/hot-present.mp3',question:'为什么总催我趁热吃？',answer:'我想让你在笼子刚揭开时吃，闻得到馅的香气，糯米也软。赶路可以带走，眼前这几只先坐下来尝，别一边走一边急着咽。',sourceIds:[],kind:'scene',next:['neighbors','hours','rich-oil']},
   {id:'neighbors',audioPast:'assets/audio/culture-v1/west-end/neighbors-past.mp3',audioPresent:'assets/audio/culture-v1/west-end/neighbors-present.mp3',question:'你怎么记得熟客爱吃什么？',answer:'常来的，问几回就记住了，有的喜欢胡椒香，有的要少拿两只。买早饭的时候顺口说说家里的事，熟起来就是这么一点点。',presentAnswer:'今天我也得先问一句口味，不光看点单。新客、熟客都有各自习惯，记得了，下回来就少问一句。',sourceIds:[],kind:'scene',next:['hours','hot','pepper']},
   {id:'hours',audioPast:'assets/audio/culture-v1/west-end/hours-past.mp3',audioPresent:'assets/audio/culture-v1/west-end/hours-present.mp3',question:'一早就能吃，谁先忙起来？',answer:'开门前先备馅、包好、上笼，等街坊出门，才有热的端出来。你早饭吃得快，我们得把慢工夫放在前头。',presentAnswer:'今天我也是开门前先备馅、上笼，有的客人坐下吃，有的赶着上课带走。装盒方便了，笼里这一份还是要等它蒸好。',sourceIds:[],kind:'scene',next:['filling','hot','neighbors']},
  ],
 },
 'east-end':{
  ...speakers('east-end'),
  opening:{audioPast:'assets/audio/culture-v1/east-end/opening-past.mp3',audioPresent:'assets/audio/culture-v1/east-end/opening-present.mp3',answer:'来，先给你放个小碟，汤包刚上桌。吃法、蘸料，想问什么尽管问，别急着一口咬。',sourceIds:[],kind:'scene'},
  firstQuestions:['eat','dip','hours'],
  topics:[
   {id:'eat',audioPast:'assets/audio/culture-v1/east-end/eat-past.mp3',audioPresent:'assets/audio/culture-v1/east-end/eat-present.mp3',question:'怎么吃才不把汤弄洒？',answer:'轻轻夹起来，先放稳，咬个小口让热气出来，再慢慢尝汤。皮薄，里面的汤又热，一口吞可不合适。',sourceIds:['T8'],kind:'mixed',next:['thin-skin','dip','filling']},
   {id:'thin-skin',audioPast:'assets/audio/culture-v1/east-end/thin-skin-past.mp3',audioPresent:'assets/audio/culture-v1/east-end/thin-skin-present.mp3',question:'皮为什么做得这么薄？',answer:'薄皮、鲜肉和汤汁，是鲜肉汤包要一起吃的几样。你咬开后，别只顾着馅，把皮和汤也慢慢尝了。',sourceIds:['T4','T8'],kind:'mixed',next:['filling','eat','dip']},
   {id:'filling',audioPast:'assets/audio/culture-v1/east-end/filling-past.mp3',audioPresent:'assets/audio/culture-v1/east-end/filling-present.mp3',question:'鲜肉汤包里是什么馅？',answer:'常见的是猪肉馅，外皮用面粉做，吃的是肉馅和鲜汤。具体调味各家有差别，我不把一个配方说成全武汉都一样。',sourceIds:['T4'],kind:'fact',next:['dip','thin-skin','changes']},
   {id:'dip',audioPast:'assets/audio/culture-v1/east-end/dip-past.mp3',audioPresent:'assets/audio/culture-v1/east-end/dip-present.mp3',question:'旁边这碟姜丝醋怎么用？',answer:'夹稳了蘸一点就好，姜丝醋搭着鲜肉汤包吃，能添味、解腻。先尝原味，再决定蘸多少，别一下把汤的味道盖住。',sourceIds:['T4','T8'],kind:'mixed',next:['eat','changes','neighbors']},
   {id:'changes',audioPast:'assets/audio/culture-v1/east-end/changes-past.mp3',audioPresent:'assets/audio/culture-v1/east-end/changes-present.mp3',question:'后来还出现了哪些新口味？',answer:'咱们眼前先聊鲜肉这一笼，过去具体有哪些花样，不能拿今天的菜单往回套。尝完了，再说你喜欢什么味道。',presentAnswer:'今天武汉的老字号“四季美”，还有蟹黄、虾仁、香菇等汤包口味。那是资料里记录的真实店家，咱们这间巷尾小馆，眼前展示的仍是鲜肉汤包。',sourceIds:['T7'],kind:'mixed',next:['filling','neighbors','hours']},
   {id:'neighbors',audioPast:'assets/audio/culture-v1/east-end/neighbors-past.mp3',audioPresent:'assets/audio/culture-v1/east-end/neighbors-present.mp3',question:'吃早饭也算和街坊见面？',answer:'一笼汤包没吃完，隔壁熟人就进门了，问声“过早没”，顺手让个座。饭照吃，话照说，不用特意约，也能见上一面。',presentAnswer:'今天有人来拍街景，有人就是住附近，坐下来都是吃早饭。我招呼一句“这里有座”，你愿意的话，也能和同桌聊起来。',sourceIds:[],kind:'scene',next:['hours','dip','changes']},
   {id:'hours',audioPast:'assets/audio/culture-v1/east-end/hours-past.mp3',audioPresent:'assets/audio/culture-v1/east-end/hours-present.mp3',question:'过早一定得赶着吃吗？',answer:'上工的人赶早，我就先给他上热的，赶不赶得看各人的日子。你有空，坐下慢慢吃，汤包里的汤可不能急。',presentAnswer:'今天上班、上学的客人有自己的钟点，也有人特意来街上尝一笼。你在这儿能坐就坐，带走也可以，别因为赶路烫着。',sourceIds:[],kind:'scene',next:['eat','neighbors','changes']},
  ],
 },
 noodle:{
  speaker:'林姐',presentSpeaker:'小林',
  opening:{audioPresent:'assets/audio/culture-v1/noodle/opening-present.mp3',audioPast:'assets/audio/culture-v1/noodle/opening-past.mp3',answer:'面还热着，先拌两下。你想问这一碗怎么做，还是想聊聊街坊的过早？门边有凳子，不赶时间就坐一会儿。',presentAnswer:'来，面刚拌好。我妈以前就在这儿招呼街坊，现在换我守着这口锅，你想问哪一口味道？',sourceIds:[],kind:'scene'},
  firstQuestions:['mix-hot','sauce','guozao'],
  topics:[
   {id:'noodles',audioPresent:'assets/audio/culture-v1/noodle/noodles-present.mp3',audioPast:'assets/audio/culture-v1/noodle/noodles-past.mp3',question:'这个面为什么这么有劲？',answer:'热干面常用碱水面，吃起来有一点韧劲，拌了酱也不是软塌塌的。你先挑一筷子尝尝，面和酱得一起吃。',sourceIds:['T2','T4'],kind:'mixed',next:['sauce','craft','mix-hot']},
   {id:'sauce',audioPresent:'assets/audio/culture-v1/noodle/sauce-present.mp3',audioPast:'assets/audio/culture-v1/noodle/sauce-past.mp3',question:'这么香，主要放了什么酱？',answer:'主要是芝麻酱，拌开以后才裹得到每一根面。还会搭酱油、葱花、萝卜丁这些，各家调味不一样，你喜欢辣的、酸的，都可以先说。',sourceIds:['T2','T4'],kind:'mixed',next:['mix-hot','noodles','changes']},
   {id:'mix-hot',audioPresent:'assets/audio/culture-v1/noodle/mix-hot-present.mp3',audioPast:'assets/audio/culture-v1/noodle/mix-hot-past.mp3',question:'端到手里，要马上拌吗？',answer:'对，趁热把底下的面翻上来，再挑起来，让芝麻酱拌匀。放久了容易黏成一团，先拌好再慢慢尝，别只吃到上面那一层酱。',sourceIds:['T2'],kind:'mixed',next:['noodles','craft','guozao']},
   {id:'craft',audioPresent:'assets/audio/culture-v1/noodle/craft-present.mp3',audioPast:'assets/audio/culture-v1/noodle/craft-past.mp3',question:'看着出得快，功夫在哪里？',answer:'你只看见最后拌这几下，前头还有做面的功夫。讲蔡林记手艺的资料里，就分开说了轧面、掸面和调味，时间、温度都要照看。',sourceIds:['T1'],kind:'fact',next:['noodles','origin','hours']},
   {id:'origin',audioPresent:'assets/audio/culture-v1/noodle/origin-present.mp3',audioPast:'assets/audio/culture-v1/noodle/origin-past.mp3',question:'是谁最早做出热干面的？',answer:'我听过李包碰巧把油洒到面上的故事，可那篇报道写的是“相传”。来历有不同说法，咱们不能把一个好听的故事，就当成唯一的发明经过。',sourceIds:['T2','T4'],kind:'fact',next:['craft','guozao','changes']},
   {id:'guozao',audioPresent:'assets/audio/culture-v1/noodle/guozao-present.mp3',audioPast:'assets/audio/culture-v1/noodle/guozao-past.mp3',question:'武汉人为什么早上爱吃它？',answer:'说“过早”，就是吃早饭。过去汉口码头、商埠忙，船工、工人、商人赶着出门，一碗出得快、能吃饱的面，就很合这种生活节奏。',sourceIds:['T1','T2'],kind:'fact',next:['hours','mix-hot','origin']},
   {id:'hours',audioPresent:'assets/audio/culture-v1/noodle/hours-present.mp3',audioPast:'assets/audio/culture-v1/noodle/hours-past.mp3',question:'天刚亮，你就已经忙了？',answer:'天还蒙蒙亮，我就先把面和调料备好，等水烧开，街坊也陆续来了。有的赶着出门，有的坐在门边，问一句“过早没”，就搭上话了。',presentAnswer:'今天也得先备面、备调料，有人赶上班拿了就走，有人还是坐在门边吃。我妈留下的小凳子还在，熟客来了，照样能聊两句。',sourceIds:[],kind:'scene',next:['changes','guozao','craft']},
   {id:'changes',audioPresent:'assets/audio/culture-v1/noodle/changes-present.mp3',audioPast:'assets/audio/culture-v1/noodle/changes-past.mp3',question:'换了一代人，什么还没变？',answer:'这只酱罐放在我手边，门口的小凳子留给街坊坐。窗台擦旧了，熟客一来，我还是先问一句“老样子？”',presentAnswer:'我换了台面和雨棚，外带也用上纸袋，可我妈用过的酱罐没舍得换。她教我先把这一碗做好，再记住客人喜欢的口味，这两样我还在学。',sourceIds:[],kind:'scene',next:['sauce','hours','origin']},
  ],
 },
};

export const cultureSpeaker=(dialogue:FoodCultureDialogue,era:Era)=>era==='present'?dialogue.presentSpeaker??dialogue.speaker:dialogue.speaker;
export const cultureAnswer=(line:CultureLine,era:Era)=>era==='past'?line.pastAnswer??line.answer:line.presentAnswer??line.answer;
export const cultureAudio=(line:CultureLine,era:Era)=>era==='past'?line.audioPast??line.audio:line.audioPresent??line.audio;

/** Follow-ups favor unread questions; cycling still lets visitors revisit every topic. */
export function cultureQuestions(dialogue:FoodCultureDialogue,currentId:string|null,read:readonly string[],offset=0):CultureTopic[]{
 const preferred=(dialogue.topics.find(t=>t.id===currentId)?.next??dialogue.firstQuestions);
 const eligible=dialogue.topics.filter(t=>t.id!==currentId);
 const ordered=[...preferred.map(id=>eligible.find(t=>t.id===id)).filter((t):t is CultureTopic=>!!t),...eligible.filter(t=>!preferred.includes(t.id))];
 const ranked=[...ordered.filter(t=>!read.includes(t.id)),...ordered.filter(t=>read.includes(t.id))];
 return Array.from({length:Math.min(3,ranked.length)},(_,i)=>ranked[((offset%ranked.length)+ranked.length+i)%ranked.length]);
}

/** Invalid optional conversation data never throws away an otherwise valid food basket. */
export function parseCultureRead(value:unknown,visited:readonly PlaceId[]):CultureRead{
 const result:CultureRead={};if(!value||typeof value!=='object'||Array.isArray(value))return result;
 for(const [id,raw] of Object.entries(value)){
  const dialogue=foodCultureDialogue[id as PlaceId];
  if(!dialogue||!visited.includes(id as PlaceId)||!Array.isArray(raw))continue;
  const read=[...new Set(raw.filter((t):t is string=>typeof t==='string'&&dialogue.topics.some(topic=>topic.id===t)))];
  if(read.length)result[id as PlaceId]=read;
 }
 return result;
}
