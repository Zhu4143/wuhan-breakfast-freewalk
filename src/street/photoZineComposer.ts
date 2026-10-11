export const zineTones=[
 {id:'vermilion',name:'朱红',ink:'#a64930',paper:'#f5efde'},
 {id:'river',name:'江蓝',ink:'#315e76',paper:'#f1eddf'},
 {id:'pine',name:'松绿',ink:'#4f6652',paper:'#f4edda'},
] as const;
export type ZineTone=typeof zineTones[number]['id'];

type Composition={photoURL:string;foodURL:string;foodName:string;pinyin:string;place:string;tone:ZineTone;vertical:boolean};
export const MAX_ZINE_PHOTO_BYTES=20*1024*1024;

export function readZineImage(url:string):Promise<HTMLImageElement>{
 return new Promise((resolve,reject)=>{
  const image=new Image();
  image.onload=()=>image.naturalWidth&&image.naturalHeight?resolve(image):reject(new Error('无法读取照片'));
  image.onerror=()=>reject(new Error('无法读取照片'));
  image.src=url;
 });
}

/** Compose an original photo and an existing food illustration locally; no model request. */
export async function composePhotoZine(options:Composition):Promise<Blob>{
 const [photo,food]=await Promise.all([readZineImage(options.photoURL),readZineImage(options.foodURL)]);
 const canvas=document.createElement('canvas');canvas.width=960;canvas.height=1600;
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('当前浏览器暂时无法展开影笺');
 const tone=zineTones.find(item=>item.id===options.tone)??zineTones[0];
 ctx.fillStyle=tone.paper;ctx.fillRect(0,0,960,1600);
 // Subtle, reproducible paper grain; leave the uploaded photograph untouched.
 let seed=4143;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 ctx.fillStyle='#79502d';ctx.globalAlpha=.045;
 for(let i=0;i<5000;i++)ctx.fillRect(random()*960,random()*1600,1+random()*1.7,1+random()*1.7);
 ctx.globalAlpha=1;
 ctx.fillStyle='#8b785d';ctx.font='20px "SimSun",serif';ctx.fillText('武汉 / 一晨一味',78,76);
 ctx.font='18px Georgia,serif';ctx.textAlign='right';ctx.fillText('YOUR WUHAN',881,76);ctx.textAlign='left';
 ctx.strokeStyle='#9b8a6c55';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(78,95);ctx.lineTo(882,95);ctx.stroke();

 ctx.fillStyle=tone.ink;
 if(options.vertical){
  ctx.save();ctx.translate(99,305);ctx.rotate(Math.PI/2);trackedText(ctx,options.pinyin,0,0,7,'bold 58px Georgia,serif');ctx.restore();
  ctx.font='32px "KaiTi","SimSun",serif';ctx.fillText(options.foodName,180,210);
 }else{
  trackedText(ctx,options.pinyin,78,194,6,'bold 57px Arial,sans-serif');
  ctx.font='34px "KaiTi","SimSun",serif';ctx.fillText(options.foodName,80,249);
 }
 const bounds=photoBounds(photo),maxWidth=options.vertical?700:770,maxHeight=965;
 const scale=Math.min(maxWidth/bounds.width,maxHeight/bounds.height);
 const width=bounds.width*scale,height=bounds.height*scale;
 const x=(options.vertical?177:125)+(maxWidth-width)/2,y=330+(maxHeight-height)*.24;
 // A coloured structural sheet follows the photo, rather than framing every object.
 ctx.save();ctx.fillStyle=tone.ink;ctx.globalAlpha=.9;
 tornRect(ctx,x-27,y+30,width+16,height+19,random);ctx.fill();ctx.restore();
 ctx.save();tornRect(ctx,x,y,width,height,random);ctx.clip();ctx.drawImage(photo,bounds.x,bounds.y,bounds.width,bounds.height,x,y,width,height);ctx.restore();
 ctx.save();ctx.globalCompositeOperation='multiply';ctx.globalAlpha=.96;
 const foodSize=230,foodScale=Math.min(foodSize/food.naturalWidth,foodSize/food.naturalHeight);
 const fw=food.naturalWidth*foodScale,fh=food.naturalHeight*foodScale;
 ctx.drawImage(food,658+(foodSize-fw)/2,1310+(foodSize-fh)/2,fw,fh);ctx.restore();
 ctx.fillStyle=tone.ink;ctx.font='40px "KaiTi","SimSun",serif';ctx.fillText('一口过早，一张武汉。',78,1420);
 ctx.fillStyle='#705d45';ctx.font='24px "KaiTi","SimSun",serif';ctx.fillText(options.place.trim()||'武汉 · 我的清晨',80,1470,560);
 ctx.strokeStyle=tone.ink;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(80,1512);ctx.lineTo(360,1512);ctx.stroke();
 ctx.fillStyle='#8b785d';trackedText(ctx,'WUHAN / MORNING NOTES',80,1553,3,'15px Georgia,serif');
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('影笺暂时无法保存')),'image/png'));
}

/** Discard flat black screenshot margins without changing photographic content. */
function photoBounds(image:HTMLImageElement){
 const sample=document.createElement('canvas');sample.width=128;sample.height=Math.max(1,Math.round(128*image.naturalHeight/image.naturalWidth));
 // Keep the inspection bounded for unusually narrow panoramas.
 sample.height=Math.min(512,sample.height);
 const ctx=sample.getContext('2d',{willReadFrequently:true});
 const full={x:0,y:0,width:image.naturalWidth,height:image.naturalHeight};if(!ctx)return full;
 ctx.drawImage(image,0,0,sample.width,sample.height);
 const pixels=ctx.getImageData(0,0,sample.width,sample.height).data;
 const blackRow=(y:number)=>{let dark=0;for(let x=0;x<sample.width;x++){const i=(y*sample.width+x)*4;if(pixels[i]<12&&pixels[i+1]<12&&pixels[i+2]<12)dark++;}return dark/sample.width>.95;};
 let top=0,bottom=sample.height;
 while(top<sample.height*.3&&blackRow(top))top++;
 while(bottom>sample.height*.7&&blackRow(bottom-1))bottom--;
 if(top<sample.height*.03&&sample.height-bottom<sample.height*.03)return full;
 const y=Math.round(top/sample.height*image.naturalHeight),height=Math.round((bottom-top)/sample.height*image.naturalHeight);
 return {x:0,y,width:image.naturalWidth,height};
}

function trackedText(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,tracking:number,font:string){
 ctx.font=font;for(const letter of text){ctx.fillText(letter,x,y);x+=ctx.measureText(letter).width+tracking;}
}
function tornRect(ctx:CanvasRenderingContext2D,x:number,y:number,width:number,height:number,random:()=>number){
 ctx.beginPath();ctx.moveTo(x,y);
 for(let step=18;step<width;step+=18)ctx.lineTo(x+step,y+(random()-.5)*9);
 ctx.lineTo(x+width,y);
 for(let step=18;step<height;step+=18)ctx.lineTo(x+width+(random()-.5)*10,y+step);
 ctx.lineTo(x+width,y+height);
 for(let step=width-18;step>0;step-=18)ctx.lineTo(x+step,y+height+(random()-.5)*11);
 ctx.lineTo(x,y+height);
 for(let step=height-18;step>0;step-=18)ctx.lineTo(x+(random()-.5)*8,y+step);
 ctx.closePath();
}
