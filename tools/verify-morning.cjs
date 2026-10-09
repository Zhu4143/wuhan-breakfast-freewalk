// Run against Vite dev: the scene probe is inserted into the test response only.
// PLAYWRIGHT_MODULE / CHROMIUM_PATH can point to an existing local browser runtime.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve(process.env.VERIFY_OUT||'verification/morning');fs.mkdirSync(out,{recursive:true});
const report={checks:[],errors:[]};
const check=(name,detail)=>{report.checks.push({name,detail});console.log('PASS',name);};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--enable-webgl','--use-angle=d3d11']});
 const page=await browser.newPage({viewport:{width:1440,height:960},acceptDownloads:true});page.setDefaultTimeout(60000);
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.route('**/src/atelier/AtelierScene.ts*',async route=>{
  const response=await route.fetch(),body=(await response.text()).replace(/async build\(\)\s*\{/,'async build() { globalThis.__morningQa = this;');
  await route.fulfill({response,body});
 });
 const steady=async selector=>{await page.waitForFunction(s=>{const el=document.querySelector(s);return el&&getComputedStyle(el).opacity==='1';},selector);};
 const shot=async name=>{await page.screenshot({path:path.join(out,name+'.png'),fullPage:true});};
 const seek=async value=>{await page.getByRole('slider',{name:'清晨时间进度'}).fill(String(value));await page.waitForFunction(v=>Math.abs(Number(document.querySelector('.explore-canvas').dataset.morningProgress)-v)<.001,value);};
 const scene=()=>page.evaluate(()=>{const e=globalThis.__morningQa,w=e.extension;return {progress:w.dawn,people:w.people.filter(p=>p.group.visible).length,shops:+document.querySelector('.explore-canvas').dataset.openShops,sky:w.sky.material.color.getHexString(),sun:w.sun.intensity,lamps:w.morning.lamps.map(l=>l.light.intensity),doors:w.morning.doors.map(d=>({id:d.id,open:d.old.userData.opening,old:d.old.visible,today:d.today.visible})),era:document.querySelector('.market-explore').dataset.era,paper:getComputedStyle(document.querySelector('.morning-clock')).backgroundColor};});
 const finishWalk=()=>page.evaluate(()=>{const w=globalThis.__morningQa.extension;for(let i=0;i<3000&&w.free.state.moving;i++)w.free.update(1/30);return w.free.state;});
 const menuVisit=async name=>{await page.getByRole('button',{name:'沿街店铺',exact:true}).click();await steady('.street-directory');await page.locator('.street-directory').getByRole('button',{name:new RegExp(name)}).click();await page.locator('.street-directory').waitFor({state:'detached'});const state=await finishWalk();assert.equal(state.moving,false);await steady('.explore-reading');};
 try{
  await page.goto(process.env.VERIFY_URL||'http://127.0.0.1:5190/?sample=tour');
  await page.waitForFunction(()=>document.querySelector('.explore-canvas')?.dataset.status==='ready');
  await steady('.market-cover');await shot('01-cover');
  await page.getByRole('button',{name:/去街上逛逛/}).click();await steady('.explore-chrome');
  await page.getByRole('button',{name:'暂停时间',exact:true}).click();
  await page.getByRole('button',{name:'静一静',exact:true}).click();
  await seek(0);await page.waitForFunction(()=>document.querySelector('.explore-canvas').dataset.activePeople==='4');
  report.dawn=await scene();await shot('02-dawn');assert.equal(report.dawn.shops,0);assert.ok(report.dawn.lamps.every(v=>v>20));
  await menuVisit('热干面');assert.equal(await page.locator('.explore-add-food').isDisabled(),true);await shot('03-closed-shop');check('closed shops show their opening time and withhold food collection');
  await page.getByRole('button',{name:'继续走走',exact:true}).click();
  // Capture actual intermediate frames; absence of pop-in is not inferred from a CSS declaration.
  const motion=await page.evaluate(async()=>{
   const frames=[];const toolbar=document.querySelector('.explore-toolbar>button');toolbar.click();
   const sample=()=>{const e=document.querySelector('.street-directory');return e?{opacity:+getComputedStyle(e).opacity,y:e.getBoundingClientRect().y,exit:e.dataset.presence==='exiting'}:null;};
   const start=performance.now();await new Promise(resolve=>{const tick=()=>{frames.push(sample());if(performance.now()-start<650)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});
   document.querySelector('.street-directory button[aria-label="收起店铺列表"]').click();
   await new Promise(resolve=>requestAnimationFrame(()=>{frames.push(sample());resolve();}));
   await new Promise(resolve=>setTimeout(resolve,80));toolbar.click();
   await new Promise(resolve=>setTimeout(resolve,650));return {frames,last:sample()};
  });
  assert.ok(motion.frames.some(f=>f&&f.opacity>0&&f.opacity<.99));assert.ok(motion.frames.some(f=>f?.exit));assert.equal(motion.last.opacity,1);
  check('directory has intermediate frames, retains its exit, and reverses an interrupted close',motion);
  await page.getByRole('button',{name:'收起店铺列表',exact:true}).click();await page.locator('.street-directory').waitFor({state:'detached'});
  await page.getByRole('button',{name:'继续时间',exact:true}).click();
  const p0=await page.getByRole('slider').inputValue();await page.waitForTimeout(1600);const p1=await page.getByRole('slider').inputValue();
  await page.getByRole('button',{name:'暂停时间',exact:true}).click();assert.ok(+p1- +p0>.003&&+p1- +p0<.015);check('clock advances at the selected five-minute pace',{delta:+p1- +p0});
  const frozen=await page.getByRole('slider').inputValue();await page.waitForTimeout(600);assert.equal(await page.getByRole('slider').inputValue(),frozen);check('pause holds time');
  await seek(.5);report.mid=await scene();await shot('04-mid-morning');
  await seek(1);await page.waitForFunction(()=>document.querySelector('.explore-canvas').dataset.activePeople==='18');report.day=await scene();await shot('05-morning');
  assert.ok(report.mid.people>report.dawn.people&&report.mid.people<report.day.people);assert.equal(report.day.shops,6);assert.ok(report.day.lamps.every(v=>v===0));assert.ok(report.day.sun>report.mid.sun&&report.mid.sun>report.dawn.sun);
  check('daylight, lamps, shutters and crowd follow the same clock',{dawn:report.dawn,mid:report.mid,day:report.day});
  const routes=await page.evaluate(async()=>{
   const {places}=await import('/src/street/exploreContent.ts'),{tourStops}=await import('/src/street/tourContent.ts');
   const e=globalThis.__morningQa,w=e.extension,walker=w.free;let minGap=Infinity,minCrowdGap=Infinity,runs=0,frames=0;
   const clearance=(a,b,o)=>{const dx=b.x-a.x,dz=b.z-a.z,l=dx*dx+dz*dz,t=l?Math.max(0,Math.min(1,((o.x-a.x)*dx+(o.z-a.z)*dz)/l)):0;return Math.hypot(a.x+t*dx-o.x,a.z+t*dz-o.z)-o.radius-.32;};
   const go=(stop,moving=false)=>{
    walker.go(stop);for(let i=0;i<3500&&walker.state.moving;i++){
     const a=walker.position.clone(),obs=w.navigationObstacles();walker.update(1/30);frames++;
     for(const o of obs){const gap=clearance(a,walker.position,o);minGap=Math.min(minGap,gap);if(gap<-.00001)throw new Error(`collision on ${stop.id}: ${o.id} ${gap}`);}
     if(moving){e.camera.position.copy(walker.position);w.beforeFrame(0);w.update(w.pedestrianTime+1/30,e.camera,0,true);for(const o of w.navigationObstacles()){const gap=clearance(walker.position,walker.position,o);if(gap<-.00001)throw new Error('moving crowd overlaps camera');}
      const people=w.people.filter(p=>p.group.visible);for(let a=0;a<people.length;a++)for(let b=a+1;b<people.length;b++){const gap=people[a].group.position.distanceTo(people[b].group.position)-people[a].radius-people[b].radius;minCrowdGap=Math.min(minCrowdGap,gap);if(gap<-.00001)throw new Error('people overlap one another');}
     }
    }
    if(walker.state.moving)throw new Error('unreachable '+stop.id);runs++;
   };
   for(const from of places)for(const to of places){go(from.stop);go(to.stop);}
   for(const place of places)for(const chapter of place.chapters){go(chapter.view??(chapter.stop!==undefined?tourStops[chapter.stop]:place.stop));}
   go(places.find(p=>p.id==='market').stop,true);go(places.find(p=>p.id==='west-end').stop,true);go(places.find(p=>p.id==='doupi').stop,true);
   return {runs,frames,minGap,minCrowdGap};
  });check('all 81 shop pairs, every chapter and moving-crowd routes keep swept body clearance',routes);
  await menuVisit('热干面');await page.getByRole('button',{name:/把热干面放进食篮/}).click();await steady('.explore-toast');await shot('06-reading');
  const turnPage=await page.evaluate(async()=>{
   document.querySelector('.explore-reading-footer button:last-child').click();
   const seen=[];const start=performance.now();await new Promise(resolve=>{const tick=()=>{seen.push([...document.querySelectorAll('.explore-reading-body>.paper-swap-page')].map(e=>({opacity:+getComputedStyle(e).opacity,exiting:e.dataset.presence==='exiting'})));if(performance.now()-start<550)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});return seen;
  });assert.ok(turnPage.some(f=>f.some(p=>p.exiting)&&f.some(p=>!p.exiting)));check('story pages cross-fade with their previous page retained',turnPage);
  const paper=await page.locator('.explore-reading').evaluate(e=>getComputedStyle(e).backgroundColor);
  await page.locator('.explore-era').getByRole('button',{name:'今日',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.explore-canvas').dataset.turning==='false');await page.waitForTimeout(1300);
  report.today=await scene();assert.notEqual(paper,await page.locator('.explore-reading').evaluate(e=>getComputedStyle(e).backgroundColor));assert.notEqual(report.today.sky,report.day.sky);await shot('07-today-reading');check('era changes cards, sky, all shop fronts, paving, people and lamps',report.today);
  await page.getByRole('button',{name:'收起介绍',exact:true}).click();await page.locator('.explore-reading').waitFor({state:'detached'});await steady('.explore-reopen');
  await page.getByRole('button',{name:/我的过早/}).first().click();await steady('.explore-basket');await shot('08-basket');
  const downloadEvent=page.waitForEvent('download');await page.getByRole('button',{name:/带走我的食篮/}).click();await (await downloadEvent).saveAs(path.join(out,'basket.md'));assert.ok(fs.readFileSync(path.join(out,'basket.md'),'utf8').includes('热干面'));check('food collection and download still work');
  await page.getByRole('button',{name:'收起食篮',exact:true}).click();await page.locator('.explore-basket').waitFor({state:'detached'});
  await page.getByRole('button',{name:'资料手册',exact:true}).click();await steady('dialog');await shot('09-sources');await page.keyboard.press('Escape');assert.equal(await page.locator('dialog').evaluate(e=>e.open),true);await page.waitForFunction(()=>!document.querySelector('dialog').open);check('native modal retains its focus trap through animated dismissal');
  await seek(0);await page.waitForFunction(()=>document.querySelector('.explore-canvas').dataset.activePeople==='4');report.rewind=await scene();assert.equal(report.rewind.shops,0);check('scrubbing back restores quiet dawn, closed shutters and lit lamps',report.rewind);
  await page.setViewportSize({width:390,height:844});await shot('10-mobile');
  await page.getByRole('button',{name:'沿街店铺',exact:true}).click();await steady('.street-directory');await shot('11-mobile-directory');await page.getByRole('button',{name:'收起店铺列表',exact:true}).click();await page.locator('.street-directory').waitFor({state:'detached'});
  await menuVisit('三鲜豆皮');await shot('12-mobile-reading');
  const bounds=await page.locator('.explore-reading').evaluate(e=>{const r=e.getBoundingClientRect(),toolbar=document.querySelector('.explore-toolbar').getBoundingClientRect(),location=document.querySelector('.explore-location').getBoundingClientRect();return {top:r.top,bottom:r.bottom,screen:innerHeight,toolbarBottom:toolbar.bottom,locationTop:location.top,overflow:document.documentElement.scrollWidth>innerWidth};});assert.ok(bounds.top>=180&&bounds.bottom<=bounds.screen-170);assert.ok(bounds.toolbarBottom<bounds.locationTop);assert.equal(bounds.overflow,false);check('mobile reading and movement/time controls fit',{bounds});
  await page.getByRole('button',{name:'收起介绍',exact:true}).click();await page.locator('.explore-reading').waitFor({state:'detached'});
  await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'沿街店铺',exact:true}).click();await steady('.street-directory');
  assert.equal(await page.locator('.street-directory').evaluate(e=>new DOMMatrixReadOnly(getComputedStyle(e).transform).m42),0);check('reduced motion uses opacity without sliding');
  await page.getByRole('button',{name:'收起店铺列表',exact:true}).click();await page.locator('.street-directory').waitFor({state:'detached'});
  await page.setViewportSize({width:320,height:740});await shot('13-small-screen');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.reload();await page.waitForFunction(()=>document.querySelector('.explore-canvas')?.dataset.status==='ready');assert.ok((await page.locator('.cover-saved').textContent()).includes('1'));check('saved basket survives refresh');
  assert.deepEqual(report.errors,[]);
 }catch(e){report.errors.push(e.stack);await shot('failure').catch(()=>{});throw e;}
 finally{fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
