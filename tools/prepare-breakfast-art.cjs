// Texture preprocessing only: split the generated two-person sheets, crop alpha bounds and resize.
const sharp=require(process.env.SHARP_MODULE||'sharp');
const path=require('node:path'),fs=require('node:fs');
async function prepare(source,id){
 const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(info.channels!==4)throw new Error('Expected RGBA source');
 const alpha=[];for(let i=3;i<data.length;i+=4)alpha.push(data[i]);
 if(!alpha.some(a=>a<10)||!alpha.some(a=>a>180))throw new Error('Source must contain real transparency and opaque figures');
 for(let era=0;era<2;era++){
  const start=Math.floor(info.width*era/2),end=Math.floor(info.width*(era+1)/2);
  let left=end,right=start,top=info.height,bottom=0;
  for(let y=0;y<info.height;y++)for(let x=start;x<end;x++)if(data[(y*info.width+x)*4+3]>180){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  left=Math.max(start,left-10);right=Math.min(end-1,right+10);top=Math.max(0,top-10);bottom=Math.min(info.height-1,bottom+10);
  const target=path.resolve('public/assets/storybook',id+'-keeper-'+(era?'present':'past')+'-v11.webp');
  await sharp(source).extract({left,top,width:right-left+1,height:bottom-top+1}).resize({height:896}).webp({quality:88,alphaQuality:100}).toFile(target);
  console.log(path.basename(target),fs.statSync(target).size);
 }
}
(async()=>{const sources=process.argv.slice(2);if(sources.length!==3)throw new Error('Pass three generated sheets: broth, shaomai, dumpling');for(const [i,id] of ['east-middle','west-end','east-end'].entries())await prepare(sources[i],id);})().catch(e=>{console.error(e);process.exitCode=1;});
