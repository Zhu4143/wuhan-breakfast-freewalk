import {test} from 'node:test';
import assert from 'node:assert/strict';
import {foodCultureDialogue,cultureAnswer,cultureAudio,cultureQuestions,cultureSpeaker,type CultureLine} from '../src/street/foodCultureDialogue.ts';
import {freshExplore,arriveAt,addToBasket,parseExplore,readCultureTopic} from '../src/street/exploreState.ts';
import {tourSources} from '../src/street/tourContent.ts';
import {breakfastShops} from '../src/street/breakfastShops.ts';
const doupi=foodCultureDialogue.doupi!;
const dialogues=Object.values(foodCultureDialogue);
const addedPlaces=['mianwo','east-middle','west-end','east-end','noodle'] as const;

test('all six existing food shops have short attributed replies and reachable follow-ups',()=>{
 assert.deepEqual(Object.keys(foodCultureDialogue),['doupi',...addedPlaces]);assert.equal(doupi.topics.length,8);
 const sources=new Set<string>(tourSources.map(s=>s.id));
 for(const dialogue of dialogues){
 const ids=new Set(dialogue.topics.map(t=>t.id));assert.equal(ids.size,dialogue.topics.length);
 assert.ok(dialogue.topics.filter(t=>t.kind!=='scene').length>=4);
 for(const topic of [dialogue.opening,...dialogue.topics]){
  assert.ok(topic.sourceIds.every(id=>sources.has(id)));
  if(topic.kind!=='scene')assert.ok(topic.sourceIds.length>0);
  for(const era of ['past','present'] as const){const text=cultureAnswer(topic,era);assert.ok(text.length<165);assert.ok(text.split(/[。！？]/).filter(Boolean).length<=3);}
 }
 for(const topic of dialogue.topics){
  assert.ok(topic.question.length<25);assert.ok(topic.sourceIds.every(id=>sources.has(id)));
  assert.ok(topic.next?.every(id=>ids.has(id)));
 }
 assert.equal(dialogue.firstQuestions.length,3);assert.ok(dialogue.firstQuestions.every(id=>ids.has(id)));
 }
});
test('era changes only the replies with an actual variation; common answers stay common',()=>{
 for(const id of ['skin','three-fresh','guozao','city-pace']){const line=doupi.topics.find(t=>t.id===id)!;assert.equal(cultureAnswer(line,'past'),cultureAnswer(line,'present'));}
 for(const id of ['hours','changes']){const line=doupi.topics.find(t=>t.id===id)!;assert.notEqual(cultureAnswer(line,'past'),cultureAnswer(line,'present'));}
 assert.match(cultureAnswer(doupi.topics.find(t=>t.id==='changes')!,'present'),/预包装/);
 for(const id of addedPlaces){
  const dialogue=foodCultureDialogue[id]!;
  assert.notEqual(cultureAnswer(dialogue.topics.find(t=>t.id==='hours')!,'past'),cultureAnswer(dialogue.topics.find(t=>t.id==='hours')!,'present'));
  for(const topic of dialogue.topics.filter(t=>t.kind==='fact'))assert.equal(cultureAnswer(topic,'past'),cultureAnswer(topic,'present'));
 }
});
test('speaker follows the existing old and new shopkeepers, with a shared name fallback',()=>{
 for(const shop of breakfastShops){const dialogue=foodCultureDialogue[shop.id]!;assert.equal(cultureSpeaker(dialogue,'past'),shop.keeper);assert.equal(cultureSpeaker(dialogue,'present'),shop.todayKeeper);}
 for(const dialogue of [doupi,foodCultureDialogue.mianwo!])assert.equal(cultureSpeaker(dialogue,'past'),cultureSpeaker(dialogue,'present'));
 assert.equal(cultureSpeaker(foodCultureDialogue.noodle!,'past'),'林姐');assert.equal(cultureSpeaker(foodCultureDialogue.noodle!,'present'),'小林');
});
test('three choices never repeat the current question, and cycling reaches every other topic',()=>{
 for(const dialogue of dialogues)for(const selected of [null,...dialogue.topics.map(t=>t.id)]){
  const reached=new Set<string>();
  for(let offset=0;offset<30;offset+=3){const options=cultureQuestions(dialogue,selected,['skin','hours'],offset);assert.equal(options.length,3);assert.equal(new Set(options.map(t=>t.id)).size,3);assert.ok(options.every(t=>t.id!==selected));options.forEach(t=>reached.add(t.id));}
  assert.equal(reached.size,dialogue.topics.length-(selected?1:0));
 }
});
test('legacy v1 saves preserve basket, visits and era without a dialogue field',()=>{
 const old={version:1,place:'doupi',visited:['doupi','noodle'],foods:['doupi'],era:'present'};
 const restored=parseExplore(JSON.stringify(old))!;
 assert.deepEqual(restored,{...old,cultureRead:{}});
});
test('read progress is deduplicated, persists and does not modify the food basket',()=>{
 let save=addToBasket(arriveAt(freshExplore(),'doupi'),'doupi');save=readCultureTopic(save,'doupi','guozao');
 assert.equal(readCultureTopic(save,'doupi','guozao'),save);assert.equal(readCultureTopic(save,'doupi','invented'),save);
 assert.equal(readCultureTopic(freshExplore(),'doupi','guozao').cultureRead.doupi,undefined);
 assert.deepEqual(parseExplore(JSON.stringify(save)),save);assert.deepEqual(save.foods,['doupi']);
});
test('matching topic IDs remain independent across shops and old doupi progress is retained',()=>{
 let save=readCultureTopic(addToBasket(arriveAt(freshExplore(),'doupi'),'doupi'),'doupi','guozao');
 for(const id of addedPlaces)save=arriveAt(save,id);
 save=readCultureTopic(save,'mianwo','hours');
 assert.equal(save.cultureRead['east-middle'],undefined);
 for(const id of addedPlaces)save=readCultureTopic(save,id,'hours');
 assert.deepEqual(save.cultureRead,{doupi:['guozao'],mianwo:['hours'],'east-middle':['hours'],'west-end':['hours'],'east-end':['hours'],noodle:['hours']});
 assert.deepEqual(parseExplore(JSON.stringify(save)),save);assert.deepEqual(save.foods,['doupi']);
});
test('noodle conversation keeps common facts and distinct family voices with era-specific recordings',()=>{
 const d=foodCultureDialogue.noodle!;assert.equal(d.topics.length,8);
 for(const line of [d.opening,...d.topics]){assert.match(cultureAudio(line,'past')!,/noodle\/.*-past\.mp3$/);assert.match(cultureAudio(line,'present')!,/noodle\/.*-present\.mp3$/);assert.equal(line.audio,undefined);}
 for(const id of ['opening','hours','changes']){
  const line=id==='opening'?d.opening:d.topics.find(t=>t.id===id)!;
  assert.notEqual(cultureAnswer(line,'past'),cultureAnswer(line,'present'));
 }
 assert.match(cultureAnswer(d.topics.find(t=>t.id==='changes')!,'present'),/我妈/);
 const origin=d.topics.find(t=>t.id==='origin')!;assert.match(origin.answer,/相传/);assert.deepEqual(origin.sourceIds,['T2','T4']);
 let save=addToBasket(arriveAt(freshExplore(),'noodle'),'noodle');save=readCultureTopic(save,'noodle','origin');
 assert.deepEqual(parseExplore(JSON.stringify(save)),save);assert.deepEqual(save.foods,['noodle']);assert.deepEqual(save.cultureRead.noodle,['origin']);
});
test('bad optional dialogue progress is repaired without discarding a valid basket',()=>{
 const save=addToBasket(arriveAt(freshExplore(),'doupi'),'doupi');
 for(const raw of [null,'bad',[],{noodle:['invented']},{doupi:['missing',12]}])assert.deepEqual(parseExplore(JSON.stringify({...save,cultureRead:raw})),save);
 assert.deepEqual(parseExplore(JSON.stringify({...save,cultureRead:{doupi:['guozao','guozao','missing'],mianwo:['x']}}))?.cultureRead,{doupi:['guozao']});
});
test('optional voice resolves era override and common fallback, and absent audio stays absent',()=>{
 const line:CultureLine={answer:'共用一句',sourceIds:[],kind:'scene',audio:'shared.mp3',audioPast:'past.mp3'};
 assert.equal(cultureAudio(line,'past'),'past.mp3');assert.equal(cultureAudio(line,'present'),'shared.mp3');
 const withoutAudio:CultureLine={answer:'等待配音时仍然显示原文',sourceIds:[],kind:'scene'};
 assert.equal(cultureAudio(withoutAudio,'past'),undefined);assert.equal(cultureAudio(withoutAudio,'present'),undefined);
});
