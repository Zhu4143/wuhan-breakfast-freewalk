import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {foodCultureDialogue,cultureAnswer,cultureAudio,cultureSpeaker} from '../src/street/foodCultureDialogue.ts';
import type {PlaceId} from '../src/street/exploreContent.ts';

type Clip={number:string;filename:string;shopId:PlaceId;topicId:string;era:'昔今共用'|'昔日'|'今日';speaker:string;text:string;assetPath:string};
const clips:Clip[]=JSON.parse(readFileSync(new URL('../docs/voice/voice-manifest.json',import.meta.url),'utf8')).clips;

test('accepted recordings match the current answer, speaker, era and actual packaged file',()=>{
 let accepted=0;
 for(const clip of clips){
  const dialogue=foodCultureDialogue[clip.shopId]!;
  const line=clip.topicId==='opening'?dialogue.opening:dialogue.topics.find(t=>t.id===clip.topicId)!;
  for(const era of clip.era==='昔今共用'?['past','present'] as const:[clip.era==='昔日'?'past':'present'] as const){
   assert.equal(cultureAnswer(line,era),clip.text,clip.filename+' text');
   assert.equal(cultureSpeaker(dialogue,era),clip.speaker,clip.filename+' speaker');
   const audio=cultureAudio(line,era);
   assert.equal(audio,clip.assetPath,clip.filename+' audio');
   assert.ok(!audio.startsWith('/')&&!audio.includes('..'));
   assert.equal(new URL(audio,'https://example.test/wuhan-breakfast-freewalk/').pathname,'/wuhan-breakfast-freewalk/'+clip.assetPath);
   const file=new URL('../public/'+audio,import.meta.url);
   assert.ok(existsSync(file),clip.filename+' exists');assert.ok(readFileSync(file).length>1000,clip.filename+' is not an empty placeholder');
  }
  accepted++;
 }
 assert.equal(accepted,93);
 const dir=fileURLToPath(new URL('../public/assets/audio/culture-v1/',import.meta.url));
 const files=readdirSync(dir,{recursive:true}).map(String).filter(f=>f.endsWith('.mp3')).map(f=>f.replaceAll('\\','/')).sort();
 assert.deepEqual(files,clips.map(c=>c.filename).sort());
});

test('noodle voice delivery lists every reply in each era, appended after the original 75 clip numbers',()=>{
 const noodleClips:Clip[]=JSON.parse(readFileSync(new URL('../docs/voice/noodle-voice-manifest.json',import.meta.url),'utf8')).clips;
 assert.deepEqual(noodleClips,clips.filter(c=>c.shopId==='noodle'));assert.equal(noodleClips.length,18);
 assert.equal(noodleClips[0].number,'076');assert.equal(noodleClips.at(-1)!.number,'093');
 assert.ok(clips.slice(0,75).every((c,i)=>c.shopId!=='noodle'&&c.number===String(i+1).padStart(3,'0')));
 const d=foodCultureDialogue.noodle!;
 for(const era of ['past','present'] as const)for(const line of [{...d.opening,id:'opening'},...d.topics]){
  const matches=noodleClips.filter(c=>c.era===(era==='past'?'昔日':'今日')&&c.topicId===line.id);
  assert.equal(matches.length,1);assert.equal(matches[0].text,cultureAnswer(line,era));assert.equal(matches[0].speaker,cultureSpeaker(d,era));
 }
});

test('replacement recordings resolve to the correct shopkeeper and era without sharing the other voice',()=>{
 const broth=foodCultureDialogue['east-middle']!,shaomai=foodCultureDialogue['west-end']!;
 const neighbors=broth.topics.find(t=>t.id==='neighbors')!,pepper=broth.topics.find(t=>t.id==='pepper')!;
 assert.match(cultureAudio(neighbors,'past')!,/east-middle\/neighbors-past\.mp3$/);assert.match(cultureAudio(neighbors,'present')!,/neighbors-present\.mp3$/);
 assert.match(cultureAudio(pepper,'past')!,/pepper-past\.mp3$/);assert.match(cultureAudio(pepper,'present')!,/east-middle\/pepper-present\.mp3$/);
 const rich=shaomai.topics.find(t=>t.id==='rich-oil')!,soup=shaomai.topics.find(t=>t.id==='soup')!;
 assert.match(cultureAudio(rich,'past')!,/rich-oil-past\.mp3$/);assert.match(cultureAudio(rich,'present')!,/west-end\/rich-oil-present\.mp3$/);
 assert.match(cultureAudio(soup,'past')!,/west-end\/soup-past\.mp3$/);assert.match(cultureAudio(soup,'present')!,/west-end\/soup-present\.mp3$/);
 for(const line of [neighbors,pepper,rich,soup]){assert.equal(line.audio,undefined);assert.notEqual(cultureAudio(line,'past'),cultureAudio(line,'present'));}
});
