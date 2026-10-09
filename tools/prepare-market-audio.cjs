// Convert the six user-supplied WAVs; originals remain untouched.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),sourceDir=process.env.MARKET_AUDIO_SOURCE||'C:/Users/zhudo/Downloads',out=path.join(root,'public/assets/audio/market-v12');
fs.mkdirSync(out,{recursive:true});
const inputs=[
 ['bicycle','1980年代中国老街，一辆老式自行车从石.wav',-24,'Old bicycle passing; one-shot, matched to the moving bicycle.'],
 ['mianwo','武汉传统面窝早餐摊近距离制作音效。面.wav',-22,'Mianwo preparation; spatial loop at the open mianwo stall.'],
 ['dawn','武汉老街清晨早市刚刚开始营业的声音，真实.wav',-24,'Opening market; quiet dawn bed in both eras.'],
 ['doupi','武汉三鲜豆皮早餐摊近距离制作声音。铁.wav',-22,'Doupi preparation; spatial loop at the open doupi stall.'],
 ['present','当代武汉居民老街清晨早餐街的真实环境声音.wav',-24,'Present-day market; fades in with morning and present wall-turn progress.'],
 ['past','1980至1990年代武汉老街清晨早市的.wav',-24,'Old market; fades in with morning and past wall-turn progress.'],
];
const probe=file=>JSON.parse(execFileSync(process.env.FFPROBE||'ffprobe',['-v','error','-show_entries','format=duration,size:stream=codec_name,sample_rate,channels','-of','json',file],{encoding:'utf8'}));
const manifest={date:'2026-10-05',provenance:'User supplied these downloads. Descriptions follow the supplied filenames; recording place, date and rights have not been independently verified.',processing:'Full clip, no content rearrangement. Loudness normalized, 60 ms boundary fades, stereo MP3 VBR quality 4 at 44.1 kHz. Loop overlaps are scheduled at runtime.',tracks:[]};
for(const [id,name,lufs,usage] of inputs){
 const source=path.join(sourceDir,name),target=path.join(out,id+'.mp3'),meta=probe(source),duration=Number(meta.format.duration);
 execFileSync(process.env.FFMPEG||'ffmpeg',['-hide_banner','-loglevel','error','-y','-i',source,'-vn','-af','loudnorm=I='+lufs+':TP=-3:LRA=7,afade=t=in:d=0.06,afade=t=out:st='+Math.max(0,duration-.06)+':d=0.06','-ar','44100','-ac','2','-c:a','libmp3lame','-q:a','4','-map_metadata','-1',target],{stdio:['ignore','ignore','pipe']});
 const converted=probe(target);
 manifest.tracks.push({id,sourceName:name,sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),sourceBytes:fs.statSync(source).size,sourceDuration:duration,asset:'assets/audio/market-v12/'+id+'.mp3',bytes:fs.statSync(target).size,duration:Number(converted.format.duration),sampleRate:Number(converted.streams[0].sample_rate),channels:converted.streams[0].channels,targetLufs:lufs,usage});
 console.log('ENCODED',id,manifest.tracks.at(-1).bytes+' bytes');
}
manifest.sourceBytes=manifest.tracks.reduce((n,t)=>n+t.sourceBytes,0);manifest.encodedBytes=manifest.tracks.reduce((n,t)=>n+t.bytes,0);manifest.reductionPercent=Number((100*(1-manifest.encodedBytes/manifest.sourceBytes)).toFixed(1));
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({sourceBytes:manifest.sourceBytes,encodedBytes:manifest.encodedBytes,reductionPercent:manifest.reductionPercent}));

