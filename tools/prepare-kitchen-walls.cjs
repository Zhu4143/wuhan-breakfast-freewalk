// Re-encode the checked-in watercolor sources without changing their artwork.
const fs=require('node:fs'),path=require('node:path');
const sharp=require(process.env.SHARP_MODULE||'sharp');
const root=path.resolve(__dirname,'..');
(async()=>{
 const rows=[];
 for(const id of ['east-middle','west-end','east-end'])for(const era of ['past','present']){
  const source=path.join(root,'art/six-shops/walls-v11-1','source-'+id+'-'+era+'.png');
  const asset=path.join(root,'public/assets/storybook',id+'-wall-'+era+'-v11-1.webp');
  await sharp(source).resize({width:1536}).webp({quality:90,effort:6}).toFile(asset);
  const meta=await sharp(asset).metadata();rows.push({asset:path.relative(root,asset),width:meta.width,height:meta.height,bytes:fs.statSync(asset).size});
 }
 console.log(JSON.stringify(rows,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});

