// Browser-only scene probe, injected into the dev response; production source remains untouched.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve(process.env.VERIFY_OUT||'verification/kitchen-walls');fs.mkdirSync(out,{recursive:true});
const report={shops:[],errors:[],assets:[]};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--enable-webgl','--use-angle=d3d11']});
 const page=await browser.newPage({viewport:{width:1440,height:960}});page.setDefaultTimeout(60000);
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('response',r=>{if(r.url().includes('-wall-')&&r.url().includes('-v11-1.webp'))report.assets.push({name:r.url().split('/').pop(),status:r.status()});});
 await page.route('**/src/atelier/AtelierScene.ts*',async route=>{
  const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace(/async build\(\)\s*\{/,'async build() { globalThis.__wallQa = this;')});
 });
 const shot=async name=>page.screenshot({path:path.join(out,name+'.png')});
 const eraButton=name=>page.locator('.explore-era').getByRole('button',{name,exact:true});
 const settle=async()=>{await page.waitForFunction(()=>document.querySelector('.explore-canvas').dataset.turning==='false');await page.waitForTimeout(700);};
 try{
  await page.goto(process.env.VERIFY_URL||'http://127.0.0.1:5190/');
  await page.waitForFunction(()=>document.querySelector('.explore-canvas')?.dataset.status==='ready');
  assert.equal(report.assets.length,6);assert.ok(report.assets.every(a=>a.status===200));
  await page.getByRole('button',{name:/去街上逛逛/}).click();await page.getByRole('button',{name:'暂停时间',exact:true}).click();
  await page.getByRole('slider',{name:'清晨时间进度'}).fill('1');await page.waitForFunction(()=>document.querySelector('.explore-canvas').dataset.morningProgress==='1.0000');
  await page.getByRole('button',{name:'静一静',exact:true}).click();
  for(const [label,id] of [['鲜鱼糊汤粉','east-middle'],['重油烧梅','west-end'],['鲜肉汤包','east-end']]){
   await page.getByRole('button',{name:'沿街店铺',exact:true}).click();await page.waitForTimeout(550);
   await page.locator('.street-directory').getByRole('button',{name:new RegExp(label)}).click();await page.locator('.street-directory').waitFor({state:'detached'});
   await page.evaluate(()=>{const w=globalThis.__wallQa.extension;for(let i=0;i<3500&&w.free.state.moving;i++)w.free.update(1/30);if(w.free.state.moving)throw Error('did not arrive');});
   await page.waitForTimeout(600);await page.getByRole('button',{name:'收起介绍',exact:true}).click();await page.locator('.explore-reading').waitFor({state:'detached'});
   const data=await page.evaluate(id=>{
    const engine=globalThis.__wallQa,k=engine.extension.shops.get(id);
    const leaves=k.hinges.map((h,n)=>({n,angle:h.rotation.y,faces:h.children.filter(m=>m.material?.map).map(m=>{
     const image=m.material.map.image,uv=m.geometry.getAttribute('uv'),xs=Array.from({length:uv.count},(_,i)=>uv.getX(i));
     return {name:m.name,image:image.src.split('/').pop(),width:image.width,height:image.height,minU:Math.min(...xs),maxU:Math.max(...xs),localAngle:m.rotation.y};
    })}));
    return {id,leaves,drawCalls:engine.renderer.info.render.calls,triangles:engine.renderer.info.render.triangles};
   },id);
   assert.equal(data.leaves.length,4);
   for(const leaf of data.leaves){
    assert.equal(leaf.faces.length,2);assert.ok(Math.abs(leaf.angle)<.0001);
    for(const [i,face] of leaf.faces.entries()){
     assert.equal(face.image,id+'-wall-'+(i?'present':'past')+'-v11-1.webp');
     assert.equal(face.width,1536);assert.equal(face.height,1024);
     assert.ok(Math.abs(face.minU-leaf.n/4)<.00001);assert.ok(Math.abs(face.maxU-(leaf.n+1)/4)<.00001);
     assert.ok(Math.abs(face.localAngle-(i?Math.PI:0))<.0001);
    }
   }
   await shot(id+'-past');
   await eraButton('今日').click();
   await page.waitForFunction(()=>{const e=globalThis.__wallQa,p=e.extension.eraProgress;if(p>.35&&p<.65){e.transition.pause();return true;}return false;});
   await page.waitForTimeout(120);
   const middle=await page.evaluate(id=>{const k=globalThis.__wallQa.extension.shops.get(id);return {turn:k.turn,hingeAngles:k.hinges.map(h=>h.rotation.y),furniture:k.eras.map(g=>g.visible)};},id);
   assert.ok(middle.turn>.35&&middle.turn<.65);assert.deepEqual(middle.furniture,[false,false]);await shot(id+'-turning');
   await page.evaluate(()=>globalThis.__wallQa.transition.resume());await settle();await shot(id+'-present');
   const present=await page.evaluate(id=>globalThis.__wallQa.extension.shops.get(id).hinges.map(h=>h.rotation.y),id);
   assert.ok(present.every(a=>Math.abs(a-Math.PI)<.0001));assert.equal(await page.locator('.explore-canvas').getAttribute('data-'+id+'-era'),'present');
   await eraButton('昔日').click();await settle();assert.equal(await page.locator('.explore-canvas').getAttribute('data-'+id+'-era'),'past');
   report.shops.push({...data,middle,present});console.log('PASS painted wall',id);
  }
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(800);await shot('mobile-tangbao-past');
  await eraButton('今日').click();await settle();await shot('mobile-tangbao-present');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);report.mobile=true;
  assert.deepEqual(report.errors,[]);console.log('PASS six painted textures, continuous UV, era midpoints, mobile');
 }catch(e){report.errors.push(e.stack);await shot('failure').catch(()=>{});throw e;}
 finally{fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

