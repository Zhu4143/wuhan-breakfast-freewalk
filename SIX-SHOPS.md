# v11 · 把三个空位补成早餐铺

原先完整餐铺为热干面、豆皮、面窝，另外三个铺位是书屋、人家、小院占位。现在三个占位都拥有独立食物与厨房模型，默认自由逛街入口共有六家早餐铺。

| 稳定铺位编号 | 新店 | 模型与近看话题 | 开门完成时刻 |
| --- | --- | --- | --- |
| east-middle | 何记糊汤粉 | 汤锅、米粉、双股油条、汤勺、蓝边碗 | 06:33 |
| west-end | 桂姨烧梅铺 | 开口薄皮、糯米颗粒、竹笼、面皮与擀面杖 | 07:02 |
| east-end | 巷尾汤包馆 | 收口褶纹汤包、小笼、醋碟、姜丝 | 07:27 |

以上店名、人物、开门时间与今昔情境均为创作。食品介绍采用武汉市政府《武汉十大名点》和商务局公开资料，页面的“查阅出处”与资料手册可访问对应来源；不将虚构商户写作真实老字号或非遗传承人。

三家店都接入店铺目录、街上标记、自动绕行、三组话题、六味食篮、下载与浏览器保存。保留原铺位编号和 v1 保存格式，旧食篮与占位浏览记录仍可恢复。模型保持在原有铺位宽度内，到店观赏点避开正对灯杆的位置。

昔日与今日分别拥有不同店主、招牌、雨棚配色、台面、罐具、备料台与餐盒。四扇纸墙随同一今昔进度翻转，隐藏中间翻转时的年代陈设，热气连续淡出淡入。三家店共用已有街灯与黎明系统，05:00—08:00 按停留五分钟推进；可暂停和拖动预览。

## 实现与素材

2026-10-05 的墙面补绘进一步统一新三家与原三家的细节密度，见 [墙面细化记录](WALL-DETAIL-UPDATE.md)。三家各有独立的昔日/今日水彩墙面，保留原四片纸墙翻转。

- `src/street/BreakfastKitchen.ts`：独立厨房、三种食物、店主招呼与年代生命周期。
- `src/street/breakfastShops.ts`：三家店的统一配置。
- `MorningStreet.ts` 与 `StreetEras.ts`：安装厨房，移除原占位房间，保留楼上建筑的今昔维护变化。
- `exploreContent.ts`、`tourContent.ts`、`ExploreExperience.tsx`：章节、出处、六味收藏、店主触发。
- `public/assets/storybook/{east-middle,west-end,east-end}-keeper-{past,present}-v11.webp`：六张透明人物纹理，合计约 614 KB。
- `public/assets/objects/{hutangfen,shaomai,tangbao}-v11.svg`：遵循原有食物图标的 SVG 素材。
- [内置 imagegen 最终提示词与生成记录](art/six-shops/image-prompts.md)：三张双人透明原图保存在同目录 `source-*.png`；`tools/prepare-breakfast-art.cjs` 只执行纹理裁切、缩放与 WebP 编码，保留透明通道。

## 复现验收

```powershell
node --experimental-strip-types --test --test-isolation=none tests/*.test.ts
npm.cmd run build
npm.cmd run dev -- --port 5190 --strictPort
npm.cmd run preview -- --port 5191 --strictPort
# 另开终端，设置现有 Playwright、Chromium 的位置：
$env:PLAYWRIGHT_MODULE='你的 Playwright 模块路径'
$env:CHROMIUM_PATH='你的 Chromium 程序路径'
$env:VERIFY_OUT='../six-shops-qa/morning'
node tools/verify-morning.cjs
$env:VERIFY_OUT='../six-shops-qa/production'
node tools/verify-six-shops.cjs
```

第一份浏览器脚本仅在测试响应中注入场景探针，检查导航身体间距、晨光、灯具、卡片中间帧与移动布局。第二份脚本访问生产构建，通过实际点击与实时自动行走逐家验收新店的昔日、今日、关闭和开门状态，收藏全部六味并下载、刷新恢复，在 390×844 布局中重新到达汤包馆。生产脚本不注入探针。

2026-10-05 最终验收：57 项单元测试通过；TypeScript 与生产构建通过（保留原有 Three.js 大包提示）。清晨回归 14 项检查通过，覆盖 81 组地点组合、所有话题与移动人流，共 185 次导航、28,198 个移动步骤；身体间距未出现负值。生产实际点击回归通过，六张人物纹理成功加载、三家新店两年代与开门状态正确、六味下载与刷新恢复成功、390×844 页面没有横向溢出，浏览器运行错误为零。最终截图已逐家目视核对，并将新店街灯移至门侧，避免挡住店主与食物。

本地证据：[清晨与导航报告](../six-shops-qa/morning/verification.json) · [生产浏览器报告](../six-shops-qa/production/verification.json) · [六味食篮](../six-shops-qa/production/six-foods-basket.png) · [何记糊汤粉](../six-shops-qa/production/east-middle-past-kitchen.png) · [桂姨烧梅铺](../six-shops-qa/production/west-end-past-kitchen.png) · [巷尾汤包馆](../six-shops-qa/production/east-end-today-kitchen.png)。证据目录位于仓库旁，运行上面的命令可重新生成。

实体手机性能、多指操作尚未实测。本地改动未推送 GitHub，也未更新线上站点。
