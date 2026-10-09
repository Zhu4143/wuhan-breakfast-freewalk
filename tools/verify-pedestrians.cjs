// Inspect actual rendered people; the scene probe exists only in this dev response.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve(process.env.VERIFY_OUT||'verification/pedestrians');fs.mkdirSync(out,{recursive:true});
const report={checks:[],errors:[]},baseline=process.env.PEDESTRIAN_BASELINE==='1';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--enable-webgl','--use-angle=d3d11']});
 const page=await browser.newPage({viewport:{width:1440,height:960}});page.setDefaultTimeout(60000);
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await page.route('**/src/atelier/AtelierScene.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace(/async build\(\)\s*\{/,'async build() { globalThis.__pedestrianQa = this;')});});
 const shot=async name=>page.screenshot({path:path.join(out,name+'.png')});
 const seek=async p=>{await page.getByRole('slider',{name:'清晨时间进度'}).fill(String(p));await page.waitForFunction(p=>Math.abs(+document.querySelector('.explore-canvas').dataset.morningProgress-p)<.001,p);};
 const census=()=>page.evaluate(()=>{
  const w=globalThis.__pedestrianQa.extension;
  return w.people.map(p=>({id:p.group.name,style:p.group.userData.pedestrianStyle,height:p.group.userData.height,radius:p.radius,visible:p.group.visible,x:p.group.position.x,z:p.group.position.z,prints:p.prints.map(m=>({visible:m.visible,asset:(Array.isArray(m.material)?m.material[0]:m.material).map.image.src.split('/').pop()}))}));
 });
 const shopClearance=async label=>{
  const hits=await page.evaluate(async()=>{
   const {shopPlots}=await import('/src/street/layout.ts'),w=globalThis.__pedestrianQa.extension,hits=[];
   // Check the entire paper body, including hidden later arrivals and both route endpoints.
   for(const p of w.people)for(const [point,position] of [['current',p.group.position],['start',p.start],['end',p.end]])for(const shop of shopPlots){
    const dx=Math.max(0,Math.abs(position.x-shop.x)-shop.depth/2),dz=Math.max(0,Math.abs(position.z-shop.z)-shop.width/2);
    if(Math.hypot(dx,dz)<p.radius+.08-1e-7)hits.push({person:p.group.name,shop:shop.id,point,gap:Math.hypot(dx,dz)-p.radius});
   }
   return hits;
  });
  assert.deepEqual(hits,[],label+': street people must stay outside shop footprints');report.checks.push(label+': all bodies and route endpoints clear six shop interiors');
 };
 try{
  await page.goto(process.env.VERIFY_URL||'http://127.0.0.1:5190/?sample=tour');await page.waitForFunction(()=>document.querySelector('.explore-canvas')?.dataset.status==='ready');
  await page.getByRole('button',{name:/去街上逛逛/}).click();await page.getByRole('button',{name:'暂停时间',exact:true}).click();await page.getByRole('button',{name:'静一静',exact:true}).click();
  await seek(0);await page.waitForFunction(()=>document.querySelector('.explore-canvas').dataset.activePeople==='4');report.dawn=await census();await shopClearance('dawn and later arrivals');await shot('01-dawn');
  await seek(1);await page.waitForFunction(()=>document.querySelector('.explore-canvas').dataset.activePeople==='18');report.past=await census();await shot('02-past-street');
  for(let era=0;era<2;era++){
   const unique=new Set(report.past.map(p=>p.prints[era].asset));assert.equal(unique.size,baseline?2:8);report.checks.push({name:era?'present variety':'past variety',count:unique.size});
  }
  if(!baseline){
   assert.equal(new Set(report.dawn.filter(p=>p.visible).map(p=>p.style)).size,4);
   const counts=Object.values(report.past.reduce((counts,p)=>(counts[p.style]=(counts[p.style]||0)+1,counts),{}));assert.ok(Math.max(...counts)<=3);
   for(const p of report.past){assert.ok(Number.isFinite(p.radius)&&p.radius>0);assert.ok(p.prints[0].visible&&!p.prints[1].visible);}
   let minGap=Infinity;for(let a=0;a<report.past.length;a++)for(let b=a+1;b<report.past.length;b++){const p=report.past[a],q=report.past[b];minGap=Math.min(minGap,Math.hypot(p.x-q.x,p.z-q.z)-p.radius-q.radius);}
   assert.ok(minGap>=0);report.checks.push({name:'distinct dawn arrivals, balanced use, safe initial silhouettes',minGap,counts});
  }
  await page.locator('.explore-era').getByRole('button',{name:'今日',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.explore-canvas').dataset.turning==='false');await page.waitForTimeout(1000);
  report.present=await census();if(!baseline)assert.ok(report.present.every(p=>!p.prints[0].visible&&p.prints[1].visible));await shopClearance('present era');await shot('03-present-street');
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);await shot('04-present-mobile');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.locator('.explore-era').getByRole('button',{name:'昔日',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.explore-canvas').dataset.turning==='false');await page.waitForTimeout(1000);await shot('05-past-mobile');
  assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report.checks));
 }catch(e){report.errors.push(e.stack);await shot('failure').catch(()=>{});throw e;}
 finally{fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
