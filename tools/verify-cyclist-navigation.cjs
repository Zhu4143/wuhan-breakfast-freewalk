// Actual automatic walking while the large bicycle body occupies the lane.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve(process.env.VERIFY_OUT||'verification/cyclist-navigation');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--enable-webgl','--use-angle=d3d11']});
 const page=await browser.newPage({viewport:{width:1440,height:960}});page.setDefaultTimeout(60000);
 const report={routes:[],errors:[]};page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await page.route('**/src/atelier/AtelierScene.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace(/async build\(\)\s*\{/,'async build() { globalThis.__cyclistQa = this;')});});
 try{
  await page.goto(process.env.VERIFY_URL||'http://127.0.0.1:5190/');await page.waitForFunction(()=>document.querySelector('.explore-canvas')?.dataset.status==='ready');
  await page.getByRole('button',{name:/去街上逛逛/}).click();await page.getByRole('button',{name:'暂停时间',exact:true}).click();await page.getByRole('slider').fill('0.12');
  await page.waitForFunction(()=>+document.querySelector('.explore-canvas').dataset.morningProgress>.119);
  await page.evaluate(()=>globalThis.__cyclistQa.extension.bicyclePass.cooldown=0);await page.waitForFunction(()=>+document.querySelector('.explore-canvas').dataset.bicycleTime>1.0);
  await page.getByRole('button',{name:'静一静',exact:true}).click();
  await page.getByRole('button',{name:'声音关',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.explore-canvas').dataset.soundState==='on');
  for(const [label,id,x,z] of [['面窝','mianwo',-1.8,4],['三鲜豆皮','doupi',0,4],['鲜鱼糊汤粉','east-middle',1.8,0]]){
   // Fixed, visible vehicle positions isolate left, centre and right obstruction cases.
   await page.evaluate(({x,z})=>{const w=globalThis.__cyclistQa.extension,b=w.bicyclePass;if(Math.hypot(x-w.free.position.x,z-w.free.position.z)<b.radius+.32)throw Error('fixture would overlap viewer');b.elapsed=x+3;b.z=z;b.root.position.set(x,0,z);},{x,z});
   await page.getByRole('button',{name:'沿街店铺',exact:true}).click();await page.waitForFunction(()=>getComputedStyle(document.querySelector('.street-directory')).opacity==='1');
   await page.locator('.street-directory').getByRole('button',{name:new RegExp(label)}).click();await page.locator('.street-directory').waitFor({state:'detached'});
   const route=await page.evaluate(async()=>{
    const w=globalThis.__cyclistQa.extension;let minGap=Infinity,frames=0;const started=performance.now();
    while(w.free.state.moving){await new Promise(r=>requestAnimationFrame(r));for(const o of w.navigationObstacles())minGap=Math.min(minGap,Math.hypot(w.free.position.x-o.x,w.free.position.z-o.z)-o.radius-.32);frames++;if(performance.now()-started>55000)throw Error('route stalled');}
    return {minGap,frames,bicycle:w.bicyclePass.cue,stop:w.free.state.stop,position:w.free.position.toArray()};
   });
   assert.equal(await page.locator('.explore-canvas').getAttribute('data-walk-stop'),id);assert.ok(route.frames>0);assert.ok(route.minGap>=-.00001);assert.equal(route.bicycle.moving,false);
   report.routes.push({id,x,z,...route});await page.screenshot({path:path.join(out,id+'-with-bicycle.png')});console.log('PASS auto-walk around bicycle',id,'gap',route.minGap.toFixed(4));
  }
  assert.equal(await page.evaluate(()=>globalThis.__cyclistQa.extension.soundscape.buffers.size),6);
  const disposal=await page.evaluate(async()=>{const e=globalThis.__cyclistQa,s=e.extension.soundscape;e.dispose();s.dispose();await new Promise(r=>setTimeout(r,200));return {disposed:s.disposed,buffers:s.buffers.size,loops:s.loops.size,context:s.context.state};});
  assert.deepEqual(disposal,{disposed:true,buffers:0,loops:0,context:'closed'});report.disposal=disposal;assert.deepEqual(report.errors,[]);
 }catch(e){report.errors.push(e.stack);await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});throw e;}
 finally{fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
