import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {foodNotes} from '../src/street/tourContent.ts';
import {freshExplore,arriveAt,addToBasket,removeFromBasket,parseExplore,migrateTourBasket} from '../src/street/exploreState.ts';
import {photoZines,photoZinesForFoods} from '../src/street/photoZines.ts';

test('every food has one correctly named poster and real full/thumbnail assets',()=>{
 assert.equal(photoZines.length,foodNotes.length);
 assert.equal(new Set(photoZines.map(zine=>zine.food)).size,foodNotes.length);
 assert.equal(new Set(photoZines.map(zine=>zine.id)).size,foodNotes.length);
 for(const food of foodNotes){
  const poster=photoZinesForFoods([food.id])[0];assert.equal(poster.title,food.name);assert.match(poster.pinyin,/^[A-Z ]+$/);
  const full=new URL('../public/assets/food-zines-v2/'+poster.id+'.webp',import.meta.url),thumb=new URL('../public/assets/food-zines-v2/'+poster.id+'-thumb.webp',import.meta.url);
  for(const file of [full,thumb]){const bytes=readFileSync(file);assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');}
  assert.ok(statSync(thumb).size<statSync(full).size);assert.ok(statSync(thumb).size<40000);
 }
});

test('posters follow actual collection order, exclude uncollected visits and update after removal',()=>{
 let save=arriveAt(freshExplore(),'doupi');assert.deepEqual(photoZinesForFoods(save.foods),[]);
 save=addToBasket(arriveAt(save,'east-end'),'east-end');save=addToBasket(arriveAt(save,'noodle'),'noodle');
 assert.deepEqual(photoZinesForFoods(save.foods).map(zine=>zine.title),['鲜肉汤包','热干面']);
 save=addToBasket(save,'noodle');assert.equal(photoZinesForFoods(save.foods).length,2);
 save=removeFromBasket(save,'east-end');assert.ok(save.visited.includes('east-end'));
 assert.deepEqual(photoZinesForFoods(save.foods).map(zine=>zine.title),['热干面']);
 save=removeFromBasket(save,'noodle');assert.deepEqual(photoZinesForFoods(save.foods),[]);
});

test('existing and migrated baskets gain matching artwork without a save schema change',()=>{
 const saved={...freshExplore(),visited:['west-end','mianwo','doupi'],foods:['mianwo','west-end']};
 const restored=parseExplore(JSON.stringify(saved));assert.ok(restored);
 assert.deepEqual(photoZinesForFoods(restored.foods).map(zine=>zine.title),['面窝','重油烧梅']);
 const legacy=migrateTourBasket(JSON.stringify({version:1,stop:5,page:0,furthest:5,foods:['doupi','noodle'],era:'past',compared:true,memory:'',complete:false}));assert.ok(legacy);
 assert.deepEqual(photoZinesForFoods(legacy.foods).map(zine=>zine.title),['三鲜豆皮','热干面']);
});
