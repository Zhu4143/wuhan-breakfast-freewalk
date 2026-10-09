export type StreetView='entry'|'market'|'sunrise'|'reverse'|'plan';
export interface ShopPlot{ id:string; name:string; status:'open'|'reserved'; x:number; z:number; rotation:number; width:number; depth:number; height:number; }
/** Local +Z always faces the street; the ground plane is local Y=0. */
export const shopPlots:ShopPlot[]=[
 {id:'noodle',name:'林记热干面',status:'open',x:-7.6,z:5,rotation:Math.PI/2,width:9.4,depth:5.2,height:6.1},
 {id:'doupi',name:'豆皮铺',status:'reserved',x:7.6,z:3,rotation:-Math.PI/2,width:9.4,depth:5.2,height:6.1},
 {id:'mianwo',name:'面窝摊',status:'reserved',x:-7.6,z:-6,rotation:Math.PI/2,width:9.4,depth:5.2,height:6.1},
 {id:'east-middle',name:'何记糊汤粉',status:'reserved',x:7.6,z:-8,rotation:-Math.PI/2,width:9.4,depth:5.2,height:6.1},
 {id:'west-end',name:'桂姨烧梅铺',status:'reserved',x:-7.6,z:-17,rotation:Math.PI/2,width:9.4,depth:5.2,height:6.1},
 {id:'east-end',name:'巷尾汤包馆',status:'reserved',x:7.6,z:-19,rotation:-Math.PI/2,width:9.4,depth:5.2,height:6.1},
];
export const streetViews:Record<StreetView,{label:string;caption:string;position:[number,number,number];target:[number,number,number]}>= {
 entry:{label:'街口',caption:'太阳刚越过屋脊，早点摊已经醒了。',position:[14,19,32],target:[-4,4,-3]},
 market:{label:'沿街',caption:'提着菜篮的人，和来看老街的人，慢慢擦肩。',position:[1.5,13,18],target:[-1,3,-4]},
 sunrise:{label:'树下',caption:'往里走，树影给清晨留了一处歇脚的地方。',position:[3,12,-12],target:[0,2,-29]},
 reverse:{label:'回望',caption:'换一个方向，看晨光落在熟悉的门窗上。',position:[-1,22,-40],target:[0,2,0]},
 plan:{label:'布局',caption:'六处铺位沿主街错落展开，街尾与两侧巷道保持通行。',position:[31,44,39],target:[0,0,-5]},
};
