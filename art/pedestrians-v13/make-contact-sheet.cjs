// QA thumbnail sheet only; runtime textures remain unchanged.
const sharp=require(process.env.SHARP_MODULE||'sharp'),path=require('node:path');
(async()=>{
 const ids=['grandmother','worker','schoolgirl','commuter','neighbor','elder'],layers=[];
 for(let row=0;row<2;row++)for(let col=0;col<6;col++){
  const file=path.resolve('public/assets/storybook',`pedestrian-${ids[col]}-${row?'present':'past'}-v13.webp`);
  const {data,info}=await sharp(file).resize({height:390}).png().toBuffer({resolveWithObject:true});
  layers.push({input:data,left:col*210+Math.round((210-info.width)/2),top:row*420+15});
 }
 await sharp({create:{width:1260,height:840,channels:4,background:'#eee5d6'}}).composite(layers).png().toFile(path.resolve('art/pedestrians-v13/contact-sheet.png'));
})().catch(e=>{console.error(e);process.exitCode=1;});
