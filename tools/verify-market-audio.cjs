const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve(process.env.VERIFY_OUT||'verification/market-audio');fs.mkdirSync(out,{recursive:true});
const probe=process.env.AUDIO_PRODUCTION!=='1',report={probe,checks:[],assets:[],errors:[]};
const check=(name,detail)=>{report.checks.push({name,detail});console.log('PASS',name);};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--enable-webgl','--use-angle=d3d11']});
 const page=await browser.newPage({viewport:{width:1440,height:960}});page.setDefaultTimeout(60000);
 page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.url().includes('/market-v12/')&&r.url().endsWith('.mp3'))report.assets.push({name:r.url().split('/').pop(),status:r.status()});});
 page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 if(probe)await page.route('**/src/atelier/AtelierScene.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace(/async build\(\)\s*\{/,'async build() { globalThis.__audioQa = this;')});});
 const data=()=>page.locator('.explore-canvas').evaluate(e=>({...e.dataset}));
 const shot=async name=>page.screenshot({path:path.join(out,name+'.png')});
 const soundButton=()=>page.locator('.explore-toolbar>button').filter({hasText:/声音/});
 const seek=async value=>{await page.getByRole('slider',{name:'清晨时间进度'}).fill(String(value));await page.waitForFunction(v=>Math.abs(+document.querySelector('.explore-canvas').dataset.morningProgress-v)<.001,value);await page.waitForTimeout(350);};
 const era=async name=>{await page.locator('.explore-era').getByRole('button',{name,exact:true}).click();await page.waitForFunction(()=>document.querySelector('.explore-canvas').dataset.turning==='false');await page.waitForTimeout(500);};
 const visit=async name=>{
  await page.getByRole('button',{name:'沿街店铺',exact:true}).click();await page.waitForFunction(()=>getComputedStyle(document.querySelector('.street-directory')).opacity==='1');
  await page.locator('.street-directory').getByRole('button',{name:new RegExp(name)}).click();await page.locator('.street-directory').waitFor({state:'detached'});
  await page.waitForFunction(()=>document.querySelector('.explore-canvas').dataset.walking==='false');await page.waitForTimeout(800);
 };
 const record=async(name,ms)=>{
  if(!probe)return;
  const bytes=await page.evaluate(async ms=>{
   const sound=globalThis.__audioQa.extension.soundscape,stream=sound.context.createMediaStreamDestination();sound.analyser.connect(stream);
   const recorder=new MediaRecorder(stream.stream,{mimeType:'audio/webm;codecs=opus'}),chunks=[];recorder.ondataavailable=e=>chunks.push(e.data);recorder.start();
   await new Promise(r=>setTimeout(r,ms));await new Promise(r=>{recorder.onstop=r;recorder.stop();});sound.analyser.disconnect(stream);
   return Array.from(new Uint8Array(await new Blob(chunks,{type:'audio/webm'}).arrayBuffer()));
  },ms);fs.writeFileSync(path.join(out,name+'.webm'),Buffer.from(bytes));
 };
 try{
  await page.goto(process.env.VERIFY_URL||(probe?'http://127.0.0.1:5190/':'http://127.0.0.1:5191/'));
  await page.waitForFunction(()=>document.querySelector('.explore-canvas')?.dataset.status==='ready'||document.querySelector('.cover-retry'));
  assert.equal((await data()).status,'ready');
  assert.equal(report.assets.length,0);assert.equal((await data()).soundContext,'uninitialized');check('no audio download or playback before the sound gesture');
  await page.getByRole('button',{name:/去街上逛逛/}).click();await page.getByRole('button',{name:'暂停时间',exact:true}).click();
  // Exercise a late decode after the human changes their mind, through the real toolbar.
  await page.route('**/market-v12/*.mp3',async route=>{await new Promise(r=>setTimeout(r,500));await route.continue();});
  await soundButton().click();await page.waitForFunction(()=>document.querySelector('.explore-canvas').dataset.soundState==='loading');
  await soundButton().click();await page.waitForFunction(()=>document.querySelector('.explore-canvas').dataset.soundState==='off');
  await page.waitForFunction(()=>document.querySelector('.explore-canvas').dataset.soundTracks==='6');await page.waitForTimeout(500);
  assert.equal((await data()).soundContext,'suspended');assert.equal((await data()).soundState,'off');check('a late load cannot turn sound back on after a rapid mute');
  await page.unroute('**/market-v12/*.mp3');await soundButton().click();
  await page.waitForFunction(()=>document.querySelector('.explore-canvas').dataset.soundState==='on'&&document.querySelector('.explore-canvas').dataset.soundActive==='true');
  await seek(0);await page.waitForFunction(()=>+document.querySelector('.explore-canvas').dataset.soundRms>.001);
  const dawn=await data();assert.ok(+dawn.soundDawn>.3);assert.equal(+dawn.soundPast,0);assert.equal(+dawn.soundPresent,0);assert.equal(+dawn.soundDoupi,0);assert.equal(+dawn.soundMianwo,0);
  assert.equal(new Set(report.assets.map(a=>a.name)).size,6);assert.ok(report.assets.every(a=>a.status===200));check('six clips decode and the dawn bed outputs nonzero browser audio',dawn);await record('dawn-output',2400);
  if(probe){
   await seek(.12);await page.evaluate(()=>globalThis.__audioQa.extension.bicyclePass.cooldown=0);
   await page.waitForFunction(()=>document.querySelector('.explore-canvas').dataset.bicycleVisible==='true'&&+document.querySelector('.explore-canvas').dataset.bicycleTime>.65);
   const before=await page.evaluate(()=>{const w=globalThis.__audioQa.extension,c=w.bicyclePass.cue,s=w.soundscape;return {cue:c,x:w.bicyclePass.root.position.x,pan:s.bicyclePan.pan.value,rate:s.cue?.source.playbackRate.value,mediaCursor:s.cue?.offset};});
   await shot('bicycle-passing');assert.equal(before.rate,1);assert.ok(Math.abs(before.mediaCursor-before.cue.elapsed)<.16);
   await page.getByRole('button',{name:'静一静',exact:true}).click();await page.waitForTimeout(250);
   const frozen=(await data()).bicycleTime;await page.waitForTimeout(500);assert.equal((await data()).bicycleTime,frozen);assert.equal(+(await data()).soundBicycle,0);
   assert.equal(await page.evaluate(()=>globalThis.__audioQa.extension.soundscape.cue.source.playbackRate.value),0);
   await page.getByRole('button',{name:'动起来',exact:true}).click();await record('bicycle-output',2600);
   const after=await page.evaluate(()=>{const w=globalThis.__audioQa.extension,c=w.bicyclePass.cue;return {cue:c,x:w.bicyclePass.root.position.x,pan:w.soundscape.bicyclePan.pan.value};});
   assert.ok(after.x>before.x+1.5);assert.ok(after.pan>before.pan);check('bicycle clip follows a visible six-second pass, direction, and an interrupted motion pause',{before,after});
   const clearance=await page.evaluate(async()=>{
    const w=globalThis.__audioQa.extension;let minGap=Infinity,frames=0;
    for(let i=0;i<90&&w.bicyclePass.cue;i++){await new Promise(r=>requestAnimationFrame(r));const b=w.bicyclePass.obstacle;if(!b)continue;
     const viewer=w.free.position;minGap=Math.min(minGap,Math.hypot(b.x-viewer.x,b.z-viewer.z)-b.radius-.32);
     for(const p of w.people.filter(p=>p.group.visible))minGap=Math.min(minGap,Math.hypot(b.x-p.group.position.x,b.z-p.group.position.z)-b.radius-p.radius);frames++;
    }return {minGap,frames};
   });assert.ok(clearance.minGap>=-.00001);check('the cyclist preserves body clearance from the viewer and pedestrians',clearance);
  }
  await seek(1);const old=await data();assert.equal(+old.soundDawn,0);assert.ok(+old.soundPast>.2);assert.equal(+old.soundPresent,0);
  await page.locator('.explore-era').getByRole('button',{name:'今日',exact:true}).click();
  const blends=[];for(let i=0;i<15;i++){await page.waitForTimeout(180);const d=await data();blends.push({old:+d.soundPast,now:+d.soundPresent});}
  await page.waitForFunction(()=>document.querySelector('.explore-canvas').dataset.turning==='false');
  assert.ok(blends.some(b=>b.old>.03&&b.now>.03));const today=await data();assert.ok(+today.soundPresent>.2);assert.ok(+today.soundPast<.001);check('old and modern ambience cross-fade along real wall-animation frames',blends);
  await era('昔日');
  await visit('三鲜豆皮');await page.waitForFunction(()=>+document.querySelector('.explore-canvas').dataset.soundDoupi>.35);
  const doupi=await data();assert.ok(+doupi.soundDoupi>+doupi.soundMianwo*2);check('actual auto-walk raises the doupi sound at the correct open stall',doupi);await record('doupi-output',2200);await shot('doupi-sound');
  await seek(.10);assert.equal(+(await data()).soundDoupi,0);await seek(1);
  await visit('面窝');await page.waitForFunction(()=>+document.querySelector('.explore-canvas').dataset.soundMianwo>.35);
  const mianwo=await data();assert.ok(+mianwo.soundMianwo>+mianwo.soundDoupi*2);check('the mianwo layer replaces the close food sound by distance, and rewind closes it',mianwo);
  if(probe){
   const overlap=await page.evaluate(async()=>{
    const s=globalThis.__audioQa.extension.soundscape;let overlap=false,minRms=Infinity,maxPeak=0;const start=performance.now();
    while(performance.now()-start<12500){await new Promise(r=>setTimeout(r,60));const loop=s.loops.get('mianwo');if(loop.voices.size===2){overlap=true;minRms=Math.min(minRms,+s.host.dataset.soundRms);}maxPeak=Math.max(maxPeak,+s.host.dataset.soundPeak);}
    return {overlap,minRms,maxPeak};
   });assert.equal(overlap.overlap,true);assert.ok(overlap.minRms>.0002);assert.ok(overlap.maxPeak<1);check('a real cooking-loop boundary overlaps with live output and no clipping',overlap);await record('mianwo-output',2200);
   await page.evaluate(()=>{globalThis.__testHidden=true;Object.defineProperty(document,'hidden',{configurable:true,get:()=>globalThis.__testHidden});document.dispatchEvent(new Event('visibilitychange'));});
   await page.waitForFunction(()=>document.querySelector('.explore-canvas').dataset.soundContext==='suspended');check('visibility-change seam suspends the real AudioContext');
   await page.evaluate(()=>{globalThis.__testHidden=false;document.dispatchEvent(new Event('visibilitychange'));});
   await page.waitForFunction(()=>document.querySelector('.explore-canvas').dataset.soundContext==='running');
   await page.evaluate(()=>{delete document.hidden;delete globalThis.__testHidden;});
  }else assert.ok(await page.evaluate(()=>typeof globalThis.__audioQa==='undefined'));
  await page.getByRole('button',{name:'返回封面',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.explore-canvas').dataset.soundContext==='suspended');check('returning to cover suspends sound');
  await page.getByRole('button',{name:/去街上逛逛/}).click();await page.waitForFunction(()=>document.querySelector('.explore-canvas').dataset.soundActive==='true');
  await soundButton().click();await page.waitForFunction(()=>document.querySelector('.explore-canvas').dataset.soundContext==='suspended');assert.equal((await data()).soundState,'off');check('mute stops output and suspends processing');
  await page.setViewportSize({width:390,height:844});await soundButton().click();await page.waitForFunction(()=>document.querySelector('.explore-canvas').dataset.soundActive==='true');await page.waitForTimeout(600);assert.ok(+(await data()).soundRms>.001);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await shot('mobile-sound');check('mobile-sized layout enables real audio without overflow');
  await page.reload();await page.waitForFunction(()=>document.querySelector('.explore-canvas')?.dataset.status==='ready');assert.equal((await data()).soundContext,'uninitialized');check('reload starts muted and tears down the previous owner');
  assert.deepEqual(report.errors,[]);
 }catch(e){report.errors.push(e.stack);await shot('failure').catch(()=>{});throw e;}
 finally{fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
