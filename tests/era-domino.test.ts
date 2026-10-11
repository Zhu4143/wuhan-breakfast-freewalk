import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dominoDuration,dominoTiming,eraShopOrder,shopEraFrame,nearestEraShop,eraAtPosition} from '../src/street/eraDomino.ts';

test('six shops start in walking order, with later shops waiting for the wave',()=>{
  const starts:number[]=[];
  eraShopOrder.forEach((id,i)=>{
    const before=i*dominoTiming.spacing/dominoDuration;
    assert.equal(shopEraFrame(id,before).turn,0);
    assert.ok(shopEraFrame(id,before+.0001).turn>0);
    starts.push(before);
  });
  assert.ok(starts.every((p,i)=>i===0||p>starts[i-1]));
  const mid=eraShopOrder.map(id=>shopEraFrame(id,.45).turn);
  assert.equal(mid[0],1);assert.ok(mid[2]>0&&mid[2]<1);assert.equal(mid[5],0);
});

test('paper leaves, foreground, keeper and food never swap together',()=>{
  const at=(seconds:number)=>shopEraFrame('noodle',seconds/dominoDuration);
  const wall=at(.31);assert.ok(wall.panels[0]>wall.panels[1]);assert.equal(wall.furniture,0);assert.equal(wall.keeper,0);assert.equal(wall.food,0);
  const foreground=at(1.11);assert.ok(foreground.panels.every(p=>p===1));assert.ok(foreground.furniture>0);assert.equal(foreground.keeper,0);
  const keeper=at(1.43);assert.equal(keeper.furniture,1);assert.ok(keeper.keeper>0);assert.equal(keeper.food,0);
  const food=at(1.76);assert.equal(food.keeper,1);assert.ok(food.food>0&&food.food<1);
});

test('reverse returns from the lane end without snapping completed shops',()=>{
  const earlyReverse=eraShopOrder.map(id=>shopEraFrame(id,.98));
  assert.equal(earlyReverse[0].food,1);assert.equal(earlyReverse[4].food,1);
  assert.ok(earlyReverse[5].food<1);assert.equal(earlyReverse[5].keeper,1);
  for(const id of eraShopOrder){
    for(const endpoint of [0,1]){
      const f=shopEraFrame(id,endpoint);
      assert.equal(f.turn,endpoint);assert.ok(f.panels.every(p=>p===endpoint));
      for(const layer of ['furniture','keeper','food'] as const)assert.equal(f[layer],endpoint);
    }
    let previous=1;
    for(let p=1;p>=0;p-=.01){const f=shopEraFrame(id,p);assert.ok(f.turn<=previous);previous=f.turn;}
  }
});

test('street details follow their nearest shop and saved endpoints initialize exactly',()=>{
  assert.equal(nearestEraShop(-7.6,5),'noodle');assert.equal(nearestEraShop(7.6,3),'doupi');
  assert.equal(nearestEraShop(-5.8,-17),'west-end');assert.equal(nearestEraShop(5.8,-19),'east-end');
  assert.equal(eraAtPosition(.45,-7.6,5),1);assert.equal(eraAtPosition(.45,7.6,-19),0);
  assert.equal(shopEraFrame('noodle',-1).turn,0);assert.equal(shopEraFrame('east-end',2).food,1);
});
