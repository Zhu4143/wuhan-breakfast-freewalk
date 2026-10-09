/** Stable plot IDs preserve saved visits, marker keys and safe walking routes. */
export const breakfastShops = [
 {id:'east-middle',name:'何记糊汤粉',food:'鲜鱼糊汤粉',recipe:'broth',keeper:'何叔',todayKeeper:'小何',color:'#789a93',accent:'#c3aa79',menu:'鲜鱼糊汤粉\n油条 · 胡椒 · 葱花',object:'长柄汤勺',greeting:'“汤熬好了，油条蘸着吃。”'},
 {id:'west-end',name:'桂姨烧梅铺',food:'重油烧梅',recipe:'shaomai',keeper:'桂姨',todayKeeper:'阿诚',color:'#a87865',accent:'#d5bb8e',menu:'重油烧梅\n糯米 · 肉丁 · 香菇',object:'竹笼与擀面杖',greeting:'“刚揭笼，坐下慢慢吃。”'},
 {id:'east-end',name:'巷尾汤包馆',food:'鲜肉汤包',recipe:'dumpling',keeper:'陈伯',todayKeeper:'小陈',color:'#6d9181',accent:'#c6c4a4',menu:'鲜肉汤包\n姜丝 · 陈醋 · 小碟',object:'小笼与蘸料碟',greeting:'“先放一放，小心里面的汤。”'},
] as const;
export type BreakfastShop = typeof breakfastShops[number];
