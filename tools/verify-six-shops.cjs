// Production-browser acceptance: actual clicks and animation frames, with no scene injection.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve(process.env.VERIFY_OUT||'verification/six-shops');fs.mkdirSync(out,{recursive:true});
const report={shops:[],errors:[],assets:[],wallAssets:[]};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--enable-webgl','--use-angle=d3d11']});
 const page=await browser.newPage({viewport:{width:1440,height:960},acceptDownloads:true});page.setDefaultTimeout(90000);
 page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{
  if(r.url().includes('-keeper-')&&r.url().includes('-v11'))report.assets.push({url:r.url().split('/').pop(),status:r.status()});
  if(r.url().includes('-wall-')&&r.url().includes('-v11-1.webp'))report.wallAssets.push({url:r.url().split('/').pop(),status:r.status()});
 });
 const steady=async selector=>page.waitForFunction(s=>{const e=document.querySelector(s);return e&&getComputedStyle(e).opacity==='1';},selector);
 const shot=async name=>page.screenshot({path:path.join(out,name+'.png'),fullPage:true});
 const seek=async value=>{await page.getByRole('slider',{name:'清晨时间进度'}).fill(String(Math.round(value*1000)/1000));await page.waitForFunction(v=>Math.abs(Number(document.querySelector('.explore-canvas').dataset.morningProgress)-v)<.001,value);};
 const era=async name=>{await page.locator('.explore-era').getByRole('button',{name,exact:true}).click();await page.waitForFunction(()=>document.querySelector('.explore-canvas').dataset.turning==='false');await page.waitForTimeout(1100);};
 const visit=async(name,id)=>{
  await page.getByRole('button',{name:'沿街店铺',exact:true}).click();await steady('.street-directory');
  const label={noodle:'热干面',doupi:'三鲜豆皮',mianwo:'面窝','east-middle':'鲜鱼糊汤粉','west-end':'重油烧梅','east-end':'鲜肉汤包'}[id];
  await page.locator('.street-directory').getByRole('button',{name:new RegExp(label)}).click();await page.locator('.street-directory').waitFor({state:'detached'});
  await page.waitForFunction(id=>document.querySelector('.explore-canvas').dataset.walkStop===id&&document.querySelector('.explore-canvas').dataset.walking==='false',id);await steady('.explore-reading');
 };
 try{
  await page.goto(process.env.VERIFY_URL||'http://127.0.0.1:5191/');await page.waitForFunction(()=>document.querySelector('.explore-canvas')?.dataset.status==='ready');
  assert.equal(await page.locator('.explore-canvas').getAttribute('data-food-counters'),'6');assert.equal(await page.locator('.explore-canvas').getAttribute('data-reserved-plots'),'0');
  assert.equal(report.assets.length,6);assert.ok(report.assets.every(a=>a.status===200));
  assert.equal(report.wallAssets.length,6);assert.ok(report.wallAssets.every(a=>a.status===200));
  await page.getByRole('button',{name:/去街上逛逛/}).click();await page.getByRole('button',{name:'暂停时间',exact:true}).click();await seek(1);await page.waitForFunction(()=>document.querySelector('.explore-canvas').dataset.activePeople==='18');
  for(const [name,id,food,opening] of [['何记糊汤粉','east-middle','鲜鱼糊汤粉',.48],['桂姨烧梅铺','west-end','重油烧梅',.64],['巷尾汤包馆','east-end','鲜肉汤包',.78]]){
   const started=Date.now();await visit(name,id);const past=await page.locator('.explore-canvas').getAttribute('data-'+id+'-era');assert.equal(past,'past');
   await shot(id+'-past-card');await page.getByRole('button',{name:'收起介绍',exact:true}).click();await page.locator('.explore-reading').waitFor({state:'detached'});await shot(id+'-past-kitchen');
   await page.getByRole('button',{name:/读读这里的故事/}).click();await steady('.explore-reading');
   await page.getByRole('button',{name:new RegExp('把'+food+'放进食篮')}).click();
   await page.getByRole('button',{name:'看今昔',exact:true}).click();await era('今日');assert.equal(await page.locator('.explore-canvas').getAttribute('data-'+id+'-era'),'present');
   await shot(id+'-today-card');await page.getByRole('button',{name:'收起介绍',exact:true}).click();await page.locator('.explore-reading').waitFor({state:'detached'});await shot(id+'-today-kitchen');
   await page.getByRole('button',{name:/读读这里的故事/}).click();await steady('.explore-reading');
   await seek(opening-.06);await page.waitForTimeout(400);assert.ok((await page.locator('.shop-waking').textContent()).includes('开门'));await shot(id+'-closed');
   await seek(opening+.06);await page.waitForTimeout(400);assert.equal(await page.locator('.shop-waking').count(),0);await era('昔日');await seek(1);
   report.shops.push({id,name,food,past,today:'present',closedBefore:opening-.06,openAfter:opening+.06,wallSeconds:(Date.now()-started)/1000});console.log('PASS',name);
  }
  for(const [name,id,food] of [['林记热干面','noodle','热干面'],['豆皮铺','doupi','三鲜豆皮'],['面窝摊','mianwo','面窝']]){await visit(name,id);await page.getByRole('button',{name:new RegExp('把'+food+'放进食篮')}).click();}
  await page.getByRole('button',{name:'收起介绍',exact:true}).click();await page.locator('.explore-reading').waitFor({state:'detached'});
  await page.getByRole('button',{name:/我的过早/}).first().click();await steady('.explore-basket');assert.equal(await page.locator('.basket-item').count(),6);await shot('six-foods-basket');
  const downloadEvent=page.waitForEvent('download');await page.getByRole('button',{name:/带走我的食篮/}).click();await (await downloadEvent).saveAs(path.join(out,'six-foods.md'));
  const note=fs.readFileSync(path.join(out,'six-foods.md'),'utf8');for(const food of ['热干面','三鲜豆皮','面窝','鲜鱼糊汤粉','重油烧梅','鲜肉汤包'])assert.ok(note.includes(food));
  await page.reload();await page.waitForFunction(()=>document.querySelector('.explore-canvas')?.dataset.status==='ready');assert.ok((await page.locator('.cover-saved').textContent()).includes('6'));
  await page.getByRole('button',{name:/去街上逛逛/}).click();await page.getByRole('button',{name:'暂停时间',exact:true}).click();await seek(1);
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(800);await visit('巷尾汤包馆','east-end');await shot('mobile-tangbao');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.ok((await page.locator('.explore-add-food').textContent()).includes('已放进'));assert.ok(await page.evaluate(()=>typeof globalThis.__morningQa==='undefined'));assert.deepEqual(report.errors,[]);
  report.basketCount=6;report.restored=true;report.mobile=true;console.log('PASS six foods, download, refresh, mobile');
 }catch(e){report.errors.push(e.stack);await shot('failure').catch(()=>{});throw e;}
 finally{fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
