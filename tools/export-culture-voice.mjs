import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {foodCultureDialogue,cultureAnswer,cultureSpeaker} from '../src/street/foodCultureDialogue.ts';
import {breakfastShops} from '../src/street/breakfastShops.ts';

// Offline export only. It does not populate audio URLs before real clips exist.
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'docs','voice');
const exportedAt='2026-10-08';
const commonDirection='像在武汉早市柜台边向一位游客说话，声音近、自然、克制，保留句间短停顿，普通话清楚，可以有轻微地方语感。只朗读正文，不加新句子，不读编号、文件名、问题或提示词。不加背景音乐、环境声、油锅声和多余音效，不用播音腔、广告腔或夸张方言。同一人物所有片段固定同一个音色。';
const roles=[
 {id:'doupi-shared',place:'doupi',name:'周姨',era:'昔今共用',voice:'成年女声，熟练、直接、温和；语速自然略利落，像一边照看豆皮锅一边回答游客。',lines:'shared'},
 {id:'doupi-past',place:'doupi',name:'周姨',era:'昔日',voice:'使用与周姨共用片段完全相同的女声音色，熟练、直接、温和；讲清晨备料的日常。',lines:'different'},
 {id:'doupi-present',place:'doupi',name:'周姨',era:'今日',voice:'使用与周姨共用片段完全相同的女声音色，熟练、直接、温和；说起今日生活时自然，不像介绍新产品。',lines:'different'},
 {id:'mianwo-past',place:'mianwo',name:'面窝摊主',era:'昔日',voice:'老年男声，爽快、朴实，音色温厚，有轻微年长质感；说话利落，避免刻意沙哑和夸张笑声。'},
 {id:'mianwo-present',place:'mianwo',name:'面窝摊主',era:'今日',voice:'成年男声，比昔日摊主年轻，温和、爽快、清楚；像边炸面窝边与客人闲聊。'},
 {id:'broth-past',place:'east-middle',name:'何叔',era:'昔日',voice:'年长男声，温厚、沉稳，语速稍慢，喜欢慢慢说老街的事情；句间留一点停顿，不拖长每个字。'},
 {id:'broth-present',place:'east-middle',name:'小何',era:'今日',voice:'成年女声，清楚、温和、从容，语速自然；保留糊汤粉店慢一点聊天的节奏。'},
 {id:'shaomai-past',place:'west-end',name:'桂姨',era:'昔日',voice:'年长女声，温柔、细致，节奏稍慢，像认真讲解一笼烧梅；有生活气，不刻意模仿苍老嗓音。'},
 {id:'shaomai-present',place:'west-end',name:'阿诚',era:'今日',voice:'成年男声，稳当、细致、亲切，语速适中；像认真照看蒸笼的人，不用兴奋的推销语气。'},
 {id:'dumpling-past',place:'east-end',name:'陈伯',era:'昔日',voice:'年长男声，热络、亲切，带一点轻微笑意，语速适中；提醒烫嘴时关切，讲街坊时自然。'},
 {id:'dumpling-present',place:'east-end',name:'小陈',era:'今日',voice:'成年女声，热络、亲切、清楚，带轻微笑意；像招呼客人坐下吃汤包，不用甜腻或客服语气。'},
 // Append roles so all previously delivered clip numbers and filenames stay stable.
 {id:'noodle-past',place:'noodle',name:'林姐',era:'昔日',voice:'成熟女声，温厚、熟练、利落，像守着面锅招呼熟客；普通话清楚，带一点自然的街坊语感，不刻意沙哑、不用播音腔。'},
 {id:'noodle-present',place:'noodle',name:'小林',era:'今日',voice:'年轻成年女声，清楚、亲切、稳当；比林姐年轻，像接过母亲的小铺与游客交谈，不用少女卖萌或客服语气。'},
];
const shops={doupi:'豆皮铺',mianwo:'面窝摊',...Object.fromEntries(breakfastShops.map(s=>[s.id,s.name])),noodle:'林记热干面'};
const rows=[];
for(const role of roles){
 const dialogue=foodCultureDialogue[role.place];
 const era=role.era==='今日'?'present':'past';
 assert.equal(cultureSpeaker(dialogue,era),role.name);
 const lines=[{...dialogue.opening,id:'opening',question:'开场招呼'},...dialogue.topics];
 for(const line of lines){
  const different=cultureAnswer(line,'past')!==cultureAnswer(line,'present');
  if(role.lines==='shared'&&different||role.lines==='different'&&!different)continue;
  const suffix=role.era==='昔今共用'?'':era==='past'?'-past':'-present';
  const file=`${role.place}/${line.id}${suffix}.mp3`;
  rows.push({number:String(rows.length+1).padStart(3,'0'),role:role.id,shopId:role.place,shop:shops[role.place],speaker:role.name,era:role.era,voice:role.voice,topicId:line.id,question:line.question,text:cultureAnswer(line,era),filename:file,audioField:role.era==='昔今共用'?'audio':era==='past'?'audioPast':'audioPresent',assetPath:'assets/audio/culture-v1/'+file,sourceIds:[...line.sourceIds],kind:line.kind});
 }
}

// Verify every opening/reply in both eras maps to one matching exported recording.
for(const [place,dialogue] of Object.entries(foodCultureDialogue))for(const line of [{...dialogue.opening,id:'opening'},...dialogue.topics])for(const era of ['past','present']){
 const candidates=rows.filter(r=>r.shopId===place&&r.topicId===line.id&&(r.era==='昔今共用'||r.era===(era==='past'?'昔日':'今日')));
 assert.equal(candidates.length,1,`${place}/${line.id}/${era}: exactly one clip required`);
 assert.equal(candidates[0].text,cultureAnswer(line,era));assert.equal(candidates[0].speaker,cultureSpeaker(dialogue,era));
}
assert.equal(new Set(rows.map(r=>r.filename)).size,rows.length);
assert.ok(rows.every(r=>r.text&&r.text.length<165));
const shopCount=Object.keys(foodCultureDialogue).length,topicCount=Object.values(foodCultureDialogue).reduce((n,d)=>n+d.topics.length,0);

const md=[
 '# 武汉早市人物配音完整清单',
 '',
 `导出日期：${exportedAt}。台词逐字取自当前 \`foodCultureDialogue.ts\`，与网页文字一致；共 ${rows.length} 个独立音频文件，覆盖 ${shopCount} 家店的 ${shopCount} 段开场、${topicCount} 个问题及必要的昔今人物 / 回答版本。`,
 '',
 '原来的 001—075 编号、文件名和正文保留。热干面新增 076—093；热干面这 18 段现已收到并接入，已有其他店音频不用重做。此前待补的四句 / 五个文件已核对接入。',
 '',
 '每一条单独生成。将本组的“音色提示”放到生成工具的风格 / 指令栏，只把条目代码框里的“朗读正文”放进语音正文栏。问题仅用于定位，不生成游客声音。生成后按文件名保存；同一人物使用固定音色。',
 '',
 '统一风格提示：',
 '',
 '```text',commonDirection,'```',
 '',
 '声音干净、不混环境声；建议导出单声道 MP3，保留 WAV 原稿也可以。先试 001、002、010 三条周姨音频，满意后再批量生成。',
 '',
 '豆皮周姨共用一个音色，共 11 段。面窝画面的两位男性分别用老年 / 成年男声，各 8 段。糊汤粉、烧梅、汤包、热干面的昔今各是不同人物，即使正文相同，也分别生成。热干面对应场景已有的林姐和小林，使用两位不同年龄的女声，各 9 段；“面窝摊主”沿用通用称呼，不额外编姓名。',
 '',
 '| 店铺 | 声音安排 | 文件数 |',
 '| --- | --- | ---: |',
 '| 豆皮铺 | 周姨共用女声；时代差异单独文件 | 11 |',
 '| 面窝摊 | 昔日老年男声 / 今日成年男声 | 16 |',
 '| 何记糊汤粉 | 何叔男声 / 小何女声 | 16 |',
 '| 桂姨烧梅铺 | 桂姨女声 / 阿诚男声 | 16 |',
 '| 巷尾汤包馆 | 陈伯男声 / 小陈女声 | 16 |',
 '| 林记热干面 | 林姐成熟女声 / 小林年轻成年女声 | 18 |',
 '',
 '下面开始是全部生成条目。',
 ];
for(const role of roles){
 const entries=rows.filter(r=>r.role===role.id);
 md.push('',`## ${shops[role.place]} · ${role.name} · ${role.era}`,'',`音色提示：${role.voice} 同时遵循上面的统一风格提示。`,'');
 for(const row of entries)md.push(`### ${row.number} · ${row.question}`,'',`文件名：\`${row.filename}\``,'','朗读正文：','','```text',row.text,'```','');
}
md.push('## 交付时的文件安排','','按照清单里的目录和文件名保存即可，保留一个人物音色从头到尾的一致性。不要把多个问题合成一条长音频，以免点击下一题时无法对应。','','音频准备好后放到项目 `public/assets/audio/culture-v1/`，每条的接入字段与相对路径已记录在 CSV / JSON 清单中。导出工具不修改网页的实际音频 URL；已接入 93 段人物配音；未来没有实录文件的条目仍可显示文字，不请求占位音频。','','台词中的历史与制作事实保留原数据的来源关联，音色和说法是虚构人物演绎。生成工具不要续写历史、加新配料或改时代内容。');

const columns=[['编号','number'],['文件名','filename'],['店铺','shop'],['时代','era'],['人物','speaker'],['音色提示','voice'],['对应问题（不朗读）','question'],['朗读正文','text'],['接入字段','audioField'],['接入相对路径','assetPath'],['店铺ID','shopId'],['话题ID','topicId']];
const quote=v=>'"'+String(v).replaceAll('"','""')+'"';
const csvFor=entries=>'\uFEFF'+[columns.map(([h])=>quote(h)).join(','),...entries.map(r=>columns.map(([,key])=>quote(r[key])).join(','))].join('\r\n')+'\r\n';
const manifest={version:1,exportedAt,description:'Offline production checklist. Existing recordings are retained; the exporter does not attach missing audio.',commonDirection,roles:roles.map(r=>({...r,count:rows.filter(row=>row.role===r.id).length})),clips:rows};
const noodleRows=rows.filter(r=>r.shopId==='noodle');
const noodleMd=[
 '# 林记热干面 · AI 配音台词',
 '',
 `导出日期：${exportedAt}。本次新增 ${noodleRows.length} 段，编号 ${noodleRows[0].number}—${noodleRows.at(-1).number}。昔日林姐、今日小林各一段开场和八段回答；这 18 段已收到并接入，本文件保留用于核对和未来替换，其他店音频不用重做。`,
 '',
 '每条独立生成。只把代码框里的正文放进朗读栏；标题里的游客问题、编号、文件名、时代和音色提示都不朗读。生成工具不要改写、补句、加笑声或环境声。同一人物始终使用同一音色，两位店主分别使用不同音色，即使部分正文相同也要分别生成。',
 '',
 '统一风格提示（放在生成工具的风格 / 指令栏）：',
 '',
 '```text',commonDirection,'```',
 '',
 '建议每段导出单声道 MP3，保留 WAV 原稿；人声单独录制，网页会独立播放街道环境声。先各生成一段林姐和小林的开场，确认人物年龄感和聊天节奏，再批量生成。注意“碱水面”“轧面”“掸面”等词的发音，逐段试听，保持正文与网页逐字一致。',
 ];
for(const role of roles.filter(r=>r.place==='noodle')){
 noodleMd.push('',`## ${role.era} · ${role.name}`,'',`音色提示：${role.voice}`,'');
 for(const row of noodleRows.filter(r=>r.role===role.id))noodleMd.push(`### ${row.number} · ${row.question}`,'',`文件名：\`${row.filename}\``,'','朗读正文：','','```text',row.text,'```','');
}
noodleMd.push('## 交付方式','','保留 `noodle/` 目录，把这 18 个 MP3 压成一个 ZIP 发回即可。网页里的热干面对话已接入这 18 段 MP3，按人物、时代和话题对应；080 / 089 的“轧面、掸面”仍需人工确认读音，清单正文保持不变。','','历史与制作内容可从网页的“查看资料来源”追溯。林姐、小林、母女接班及店中日常是现有场景的虚构演绎，配音工具不要续写为真实商户的历史。');
await mkdir(out,{recursive:true});
await writeFile(path.join(out,'人物配音完整清单.md'),md.join('\n')+'\n','utf8');
await writeFile(path.join(out,'人物配音清单.csv'),csvFor(rows),'utf8');
await writeFile(path.join(out,'voice-manifest.json'),JSON.stringify(manifest,null,2)+'\n','utf8');
await writeFile(path.join(out,'热干面配音清单.md'),noodleMd.join('\n')+'\n','utf8');
await writeFile(path.join(out,'热干面配音清单.csv'),csvFor(noodleRows),'utf8');
await writeFile(path.join(out,'noodle-voice-manifest.json'),JSON.stringify({...manifest,description:'18 supplied hot dry noodles recordings attached; craft pronunciation flagged for human listening.',roles:manifest.roles.filter(r=>r.place==='noodle'),clips:noodleRows},null,2)+'\n','utf8');
const checked=JSON.parse(await readFile(path.join(out,'voice-manifest.json'),'utf8'));
assert.equal(checked.clips.length,rows.length);assert.deepEqual(checked.clips,rows);
console.log(JSON.stringify({clips:rows.length,uniqueTexts:new Set(rows.map(r=>r.text)).size,byShop:Object.fromEntries(Object.keys(foodCultureDialogue).map(id=>[id,rows.filter(r=>r.shopId===id).length])),output:out,coverage:'every opening and question, past and present, exact text and speaker, unique filenames'}));
