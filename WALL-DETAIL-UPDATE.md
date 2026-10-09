# 三家新铺墙面细化

2026-10-05，本地 v11 的墙面修订，素材后缀为 v11-1。

## 原因与改动

前三家店采用细节丰富的绘本墙面，新三家主要靠纯色纸板、重复砖线和少量几何补丁，近看时缺少同等密度的窗格、木纹、墙皮与生活痕迹。修订前浏览器探针确认三家各有四片纸墙，但纸墙没有绘画纹理；隐藏纸墙的受控截图进一步隔离了这一层。

六张 1536×1024 新纹理沿用原豆皮铺的淡彩、细墨线与纸纹风格，每家有独立构图，并制作昔日与今日两个状态：

- 何记糊汤粉：青绿窗格、旧日历与挂钟、汤勺、毛巾、洗涤门洞、熏痕和水渍；今日修补墙皮并铺浅青瓷砖。
- 桂姨烧梅铺：左侧备料门洞、右侧红木窗、条纹布帘、竹筛与擀面杖、面粉痕；今日整修为浅杏墙面与米白瓷砖。
- 巷尾汤包馆：宽横窗、旧绿木门、通风口、筷筒、蒸汽留下的墙痕；今日改为修补后的灰绿瓷砖与干净布帘。

每张完整墙面按连续 UV 分配到原有四片翻转纸墙，今日纹理安装在反面。删除与绘画窗口重叠的通用几何窗，保留原本的立体食品、台面、挂架与独立店主。所有门窗位置在同一家两年代间保持一致，翻转时继续沿用原有陈设显隐与热气过渡。

## 文件与素材

- [BreakfastKitchen.ts](src/street/BreakfastKitchen.ts)：双面绘画纸墙与连续纹理映射。
- [MorningStreet.ts](src/street/MorningStreet.ts)：加载三家共六张年代墙面。
- [最终提示词与来源记录](art/six-shops/walls-v11-1/image-prompts.md)：内置 image_gen 编辑生成，原始 PNG 保存在同目录 `source-*.png`。场景为虚构艺术创作。
- `public/assets/storybook/{east-middle,west-end,east-end}-wall-{past,present}-v11-1.webp`：运行纹理，合计约 2.75 MiB。
- [prepare-kitchen-walls.cjs](tools/prepare-kitchen-walls.cjs)：将保留的原图编码为 WebP，可重复执行。
- [verify-kitchen-walls.cjs](tools/verify-kitchen-walls.cjs)：仅在开发测试响应注入探针，核对实际纹理、分辨率、四片拼接、两年代端点和动画中间帧，生成桌面与移动布局截图。
- [verify-six-shops.cjs](tools/verify-six-shops.cjs)：生产浏览器实际点击验收，增加六张墙面资源的加载检查。

## 验证

57 项现有单元测试通过；TypeScript 与生产构建通过。墙面专项浏览器检查通过，三家均有四片连续双面纹理，昔日和今日端点正确，中间状态仍隐藏年代陈设；390×844 布局没有横向溢出。已目视检查三家六个端点、翻转中间帧与手机布局。

生产预览通过实际点击和实时步行验收：六张墙面与六张人物纹理加载成功；三家新店的两年代、开门/关闭状态正确；六味收藏、下载、刷新恢复与手机重新到店均通过。浏览器运行错误为零。未注入生产场景探针，生产到店截图也已逐家目视核对。

本地证据位于仓库旁：

- [修订前图与隔离证据](../kitchen-wall-qa/before/baseline.json)
- [墙面专项报告](../kitchen-wall-qa/after/verification.json)
- [生产实际点击报告](../kitchen-wall-qa/production/verification.json)
- [何记糊汤粉 · 昔日](../kitchen-wall-qa/after/east-middle-past.png) / [今日](../kitchen-wall-qa/after/east-middle-present.png)
- [桂姨烧梅铺 · 昔日](../kitchen-wall-qa/after/west-end-past.png) / [今日](../kitchen-wall-qa/after/west-end-present.png)
- [巷尾汤包馆 · 昔日](../kitchen-wall-qa/after/east-end-past.png) / [今日](../kitchen-wall-qa/after/east-end-present.png)

复现命令（先启动 5190 开发服务和 5191 生产预览，并设置可用的 Playwright 与 Chromium 路径）：

```powershell
node --experimental-strip-types --test --test-isolation=none tests/*.test.ts
npm.cmd run build
$env:VERIFY_OUT='../kitchen-wall-qa/after'
node tools/verify-kitchen-walls.cjs
$env:VERIFY_OUT='../kitchen-wall-qa/production'
node tools/verify-six-shops.cjs
```

改动仅在本地，未推送或更新线上站点。实体手机性能尚未实测。
