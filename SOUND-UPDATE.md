# v12 · 六段早市声音接入

2026-10-05。以用户提供的六个 WAV 为声音来源；原文件保留在 Downloads，不覆盖、不删除。录制地点、年代与授权来源尚未独立核实，内容对应关系按用户文件标注安排。当前工具不能直接听辨录音内容，以下验证针对解码、混音信号与播放生命周期，不能替代实际扬声器试听。

## 场景顺序与对应

声音随实际渲染帧中的清晨进度、纸墙翻转比例、相机位置和自行车进度更新，不按卡片按钮直接切一段录音，也不把六段顺次整段排队播放。每段内部的声音顺序保留。

| 输入片段 | 时长 | 使用位置与时机 |
| --- | --- | --- |
| 清晨早市刚刚开始营业 | 55 秒 | 05:00 的轻声开市底层，随后逐步淡出，两年代共用 |
| 1980 至 1990 年代武汉老街早市 | 45 秒 | 昔日早市环境，随天色、人流增长逐步增强 |
| 当代武汉居民老街早餐街 | 30 秒 | 今日早市环境；与昔日按真实翻墙角度交叠渐变 |
| 三鲜豆皮近距离制作 | 30 秒 | 豆皮铺门开始打开后，走近才明显，离开后变远 |
| 面窝近距离制作 | 10 秒 | 面窝摊门开始打开后，走近才明显，按空间位置和相机方向调整左右声道 |
| 老式自行车经过石板路 | 6 秒 | 昔日中可见的纸绘自行车经过；位置、远近、声道和音频进度与动作一致 |

05:00—08:00 仍是五分钟体验的虚构清晨。环境声在约 05:18 后逐渐繁盛；制作声随原有开门动画渐入，而非全街始终播放近距离油锅声。三家新增店铺保留周围环境声，不套用不对应的豆皮或面窝制作声。

自行车按六秒一次经过，间隔至少约 52 秒，只在昔日、环境动作开启、街道身体间距足够且经过区域在视野内时出现。车辆与相机、行人共用碰撞避让；路径被占用会等候。暂停动作时，经过音轨进度冻结并淡下，恢复后继续；今昔切换时自行车与对应声音淡出。

## 播放与处理

- 默认声音关闭，用户点击“声音关”后才创建 AudioContext 并下载六段 MP3；加载时显示“声音准备中”。
- 每个录音完整保留，做响度整理、60 毫秒边界渐变、44.1 kHz 双声道 MP3 VBR quality 4 编码。原 WAV 合计 28,161,452 字节，运行声音合计 2,452,594 字节，缩小 91.3%。
- 五段环境/制作音轨用相邻播放副本交叠循环，避免直接在首尾切断。总混音保留余量并设峰值压缩保护。
- 静音、回到封面或隐藏页面会停止声音输出并挂起处理；重新进入时平滑恢复。快速开关期间晚到的解码结果不会擅自重新打开声音。
- 刷新重新以静音状态进入，加载失败可点击重试。组件释放时取消下载、停止播放节点并关闭 AudioContext。

## 改动与来源

- [声音素材清单](public/assets/audio/market-v12/manifest.json)：六段原文件名、SHA-256、时长、编码参数与大小。
- [prepare-market-audio.cjs](tools/prepare-market-audio.cjs)：本地 FFmpeg 转码，可用 `MARKET_AUDIO_SOURCE` 指定原 WAV 文件夹。
- [marketSoundModel.ts](src/street/marketSoundModel.ts)：清晨、年代、距离与声道的计算。
- [MarketSoundscape.ts](src/street/MarketSoundscape.ts)：用户手势解锁、解码、交叠循环、混音、单次经过与生命周期。
- [BicyclePass.ts](src/street/BicyclePass.ts)：安全的六秒纸绘经过动作。
- [MorningStreet.ts](src/street/MorningStreet.ts)：从真实相机和场景帧驱动声音，并接入车辆身体避让。
- [ExploreExperience.tsx](src/street/ExploreExperience.tsx)：沿用声音按钮，更新加载反馈与封面暂停。
- [自行车图像提示词](art/market-audio-v12/image-prompt.md)：内置 image_gen 生成；原 PNG 保存在同目录，运行透明纹理为 `public/assets/storybook/bicycle-passing-v12.webp`。该角色为虚构艺术创作。

## 验证

65 项单元测试通过，包含开门前静音、年代中间帧交叠、远近声、转向声道、经过事件门控与时间回退。TypeScript 与生产构建通过。

开发浏览器 14 项检查通过：实际点击开关、快速取消后不复活、六段 176 秒音频解码、非零实际混音输出、经过动作及暂停续播、车辆与行人/相机间距、真实翻墙帧、实际步行到豆皮与面窝、实际循环接缝、页面隐藏的生命周期接缝、封面/静音、移动布局与刷新。循环接缝采样仍有连续声音，采样峰值最大 0.18209，未达到数字削波上限。页面隐藏项通过测试注入的 visibilitychange 状态执行，其余动作由真实界面点击触发。

生产浏览器另有 10 项检查通过，完全不注入场景探针：六个音频资源均加载成功，通过实际点击开关、真实自动步行、今昔按钮、时间回退、返回封面及 390×844 布局确认声音输出与停止。运行及控制台错误均为零。

车辆导航专项将同一可见车辆固定在安全的左、中、右测试位置，通过真实点击与实时行走分别到达面窝、豆皮、糊汤粉铺；三条路线身体间距均保持非负。测试结束释放已经启用的声音，六段缓冲与循环节点清空、AudioContext 关闭；重复释放没有报错。

- [开发浏览器报告](../market-audio-qa/dev/verification.json)
- [无场景探针的生产报告](../market-audio-qa/production/verification.json)
- [车辆绕行与声音释放报告](../market-audio-qa/navigation/verification.json)
- [自行车经过画面](../market-audio-qa/dev/bicycle-passing.png)
- [实际浏览器自行车混音录音](../market-audio-qa/dev/bicycle-output.mp3)
- [豆皮混音录音](../market-audio-qa/dev/doupi-output.webm)
- [面窝混音录音](../market-audio-qa/dev/mianwo-output.webm)

测试截图与音频输出位于仓库旁，未作为生产页面的额外素材打包。实体手机性能、Safari/iOS 解锁行为与扬声器听感尚未实测。本地改动尚未推送或发布到线上。

复现声音验收（先启动 5190 开发服务和 5191 生产预览，并设置现有 Playwright / Chromium 的路径）：

```powershell
node --experimental-strip-types --test --test-isolation=none tests/*.test.ts
npm.cmd run build
$env:VERIFY_OUT='../market-audio-qa/dev'
$env:AUDIO_PRODUCTION='0'
node tools/verify-market-audio.cjs
$env:VERIFY_OUT='../market-audio-qa/production'
$env:AUDIO_PRODUCTION='1'
node tools/verify-market-audio.cjs
$env:VERIFY_OUT='../market-audio-qa/navigation'
node tools/verify-cyclist-navigation.cjs
```
