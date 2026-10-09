import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshExplore,arriveAt,addToBasket,removeFromBasket,parseExplore,migrateTourBasket} from '../src/street/exploreState.ts';
import {places} from '../src/street/exploreContent.ts';
import {foodNotes,tourSources} from '../src/street/tourContent.ts';
test('any shop can be the first stop and no previous story is required',()=>{
 for(const {id} of foodNotes){const s=arriveAt(freshExplore(),id);assert.deepEqual(s.visited,[id]);assert.deepEqual(addToBasket(s,id).foods,[id]);}
});
test('six complete breakfast visits can be collected, restored and removed independently',()=>{
 assert.equal(foodNotes.length,6);assert.equal(places.filter(p=>p.food).length,6);
 let save=freshExplore();for(const food of foodNotes){assert.equal(addToBasket(save,food.id),save);save=addToBasket(arriveAt(save,food.id),food.id);}
 assert.deepEqual(parseExplore(JSON.stringify(save)),save);
 for(const food of foodNotes){const removed=removeFromBasket(save,food.id);assert.equal(removed.foods.length,5);assert.ok(removed.visited.includes(food.id));assert.ok(!removed.foods.includes(food.id));}
});
test('placeholder-era visits stay valid and new food pages resolve to recorded sources',()=>{
 const old={...freshExplore(),place:'west-end',visited:['noodle','west-end'],foods:['noodle']};assert.deepEqual(parseExplore(JSON.stringify(old)),old);
 const sourceIds=new Set<string>(tourSources.map(s=>s.id));
 for(const id of ['east-middle','west-end','east-end']){const p=places.find(p=>p.id===id)!;assert.equal(p.food,id);assert.equal(p.chapters.length,3);assert.ok(p.chapters.some(c=>c.compare));for(const page of p.chapters.flatMap(c=>c.pages))if(page.kind==='fact')assert.ok(page.sources?.every(s=>sourceIds.has(s)));}
});
test('basket accepts only seen food, deduplicates, removes and persists',()=>{
 let s=freshExplore();assert.equal(addToBasket(s,'mianwo'),s);s=arriveAt(s,'mianwo');s=addToBasket(s,'mianwo');assert.equal(addToBasket(s,'mianwo'),s);s=arriveAt(s,'noodle');s=addToBasket(s,'noodle');assert.deepEqual(parseExplore(JSON.stringify(s)),s);s=removeFromBasket(s,'mianwo');assert.deepEqual(s.foods,['noodle']);assert.ok(s.visited.includes('mianwo'));
});
test('malformed or unseen basket entries cannot enter a restored save',()=>{
 for(const raw of ['bad','null',JSON.stringify({...freshExplore(),place:'missing'}),JSON.stringify({...freshExplore(),foods:['doupi']}),JSON.stringify({...freshExplore(),visited:['doupi','doupi']})])assert.equal(parseExplore(raw),null);
});
test('v6 food notes migrate without requiring or inventing an ordered route',()=>{
 const old={version:1,stop:5,page:0,furthest:5,foods:['noodle','doupi'],era:'present',compared:true,memory:'',complete:false};const s=migrateTourBasket(JSON.stringify(old));assert.deepEqual(s?.foods,['noodle','doupi']);assert.deepEqual(s?.visited,['noodle','doupi']);assert.equal(s?.place,null);
});
test('free-choice destinations have safe walking targets and attributable cultural pages',()=>{
 assert.equal(new Set(places.map(p=>p.id)).size,places.length);
 for(const p of places){assert.ok(Math.abs(p.stop.position[0])<=3.5);assert.equal(p.stop.position[1],2.45);for(const c of p.chapters)for(const page of c.pages)if(page.kind==='fact')assert.ok(page.sources?.length);}
});
