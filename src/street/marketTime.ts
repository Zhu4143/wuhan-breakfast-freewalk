/** A fictional morning for this illustrated street, not real businesses' hours. */
export const MORNING_SECONDS = 5 * 60;
export const MORNING_START = 5 * 60;
export const MORNING_SPAN = 3 * 60;
export const clampMorning = (value:number) => Number.isFinite(value) ? Math.max(0,Math.min(1,value)) : 0;
export const smooth = (value:number) => {const t=clampMorning(value);return t*t*(3-2*t);};
export const OPENING_SPAN = .035;
export const openingTimes:Readonly<Record<string,number>> = {
 noodle:.035,doupi:.16,mianwo:.30,'east-middle':.48,'west-end':.64,'east-end':.78,
};
export function advanceMorning(progress:number,elapsedSeconds:number,active:boolean){
 return clampMorning(progress+(active&&Number.isFinite(elapsedSeconds)?Math.max(0,elapsedSeconds)/MORNING_SECONDS:0));
}
export function morningTime(progress:number){
 const minutes=MORNING_START+Math.round(clampMorning(progress)*MORNING_SPAN);
 return `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
}
export const shopOpening = (id:string,progress:number) => id in openingTimes?smooth((progress-openingTimes[id])/OPENING_SPAN):1;
export const shopIsOpen = (id:string,progress:number) => shopOpening(id,progress)>=.999;
export const openShopCount = (progress:number) => Object.keys(openingTimes).filter(id=>shopIsOpen(id,progress)).length;
export function shopHours(id:string,progress:number){
 if(!(id in openingTimes))return '随时逛逛';
 const opening=shopOpening(id,progress);
 return opening>=.999?'已开门':opening>0?'正在开门':`${morningTime(openingTimes[id]+OPENING_SPAN)} 开门`;
}
export function morningPhase(progress:number){
 if(progress<.18)return {name:'灯火未眠',line:'天色蒙蒙亮，第一炉火刚刚生起。'};
 if(progress<.44)return {name:'晨光入巷',line:'木门一扇扇打开，芝麻香先醒了。'};
 if(progress<.74)return {name:'烟火渐盛',line:'提篮的人多起来，街坊相互道声早。'};
 return {name:'一街早安',line:'天光铺满石板，早市正是热闹时候。'};
}
// Four early risers, then one arrival at a time. All eighteen are here before 08:00.
export const pedestrianArrival = (index:number) => index<4?-.1:.09+(index-4)*.055;
export const pedestrianPresence = (index:number,progress:number) => smooth((progress-pedestrianArrival(index))/.035);
