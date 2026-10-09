// Preprocess generated transparent sheets; preserve the original artwork.
const sharp=require(process.env.SHARP_MODULE||'sharp');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ids=['grandmother','worker','schoolgirl','commuter','neighbor','elder'];
const root=path.resolve('art/pedestrians-v13'),manifest=[];
async function prepare(id){
 const source=path.join(root,id+'-source.png'),{data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const columns=new Uint32Array(info.width);let transparent=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const a=data[(y*info.width+x)*4+3];if(a>180)columns[x]++;if(a<10)transparent++;}
 if(transparent<info.width*info.height*.05)throw new Error(id+': expected real transparency');
 // The shoe can extend beyond the exact half. Split only through a clear alpha gap.
 const gaps=[];let begin=-1;
 for(let x=Math.floor(info.width*.4);x<info.width*.65;x++){
  if(columns[x]===0&&begin<0)begin=x;
  if(columns[x]!==0&&begin>=0){gaps.push([begin,x]);begin=-1;}
 }
 if(begin>=0)gaps.push([begin,Math.floor(info.width*.65)]);
 if(!gaps.length)throw new Error(id+': figures need a clear vertical gap');
 gaps.sort((a,b)=>Math.abs((a[0]+a[1])/2-info.width/2)-Math.abs((b[0]+b[1])/2-info.width/2));
 const split=Math.floor((gaps[0][0]+gaps[0][1])/2);
 for(let era=0;era<2;era++){
  const start=era?split:0,end=era?info.width:split;
  let left=end,right=start,top=info.height,bottom=0;
  for(let y=0;y<info.height;y++)for(let x=start;x<end;x++)if(data[(y*info.width+x)*4+3]>180){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  if(left>=right||top>=bottom)throw new Error(id+': missing figure');
  left=Math.max(start,left-12);right=Math.min(end-1,right+12);top=Math.max(0,top-12);bottom=Math.min(info.height-1,bottom+12);
  const file='pedestrian-'+id+'-'+(era?'present':'past')+'-v13.webp',target=path.resolve('public/assets/storybook',file);
  const crop={left,top,width:right-left+1,height:bottom-top+1};
  await sharp(source).extract(crop).resize({height:896}).webp({quality:88,alphaQuality:100}).toFile(target);
  const metadata=await sharp(target).metadata();
  manifest.push({id,era:era?'present':'past',source:path.relative(process.cwd(),source),sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),split,crop,file,width:metadata.width,height:metadata.height,bytes:fs.statSync(target).size});
  console.log(file,fs.statSync(target).size);
 }
}
(async()=>{for(const id of ids)await prepare(id);fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify({generator:'built-in image_gen',processing:'alpha-gap split, alpha-bounds crop, height 896, WebP quality 88',assets:manifest},null,2));})().catch(e=>{console.error(e);process.exitCode=1;});
