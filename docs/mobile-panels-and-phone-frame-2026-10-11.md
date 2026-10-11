# 手机面板与横屏手机框修复

本次修复针对店铺目录仍出现深色矩形标题、白色原生滚动条，以及双端预览的横屏手机框仍沿用竖屏灵动岛的问题。

## 改动

- `src/street/ExploreExperience.tsx`：目录标题、关闭按钮和开门状态留在顶部，列表与底部入口放入独立滚动区域。
- `src/street/mobileLayout.css`：目录改为固定标题、滚动正文；移动端控件与弹窗统一使用安全区间距。横屏手机预览模拟左侧切口留白，实际设备继续使用浏览器提供的安全区。
- `src/street/sunlitGlass.css`：故事卡、对话卡、目录、食篮和影笺标题统一透明背景；面板滚动区域统一浅色细滚动条。
- `src/preview/DualPreview.tsx`、`src/preview/dualPreview.css`：灵动岛独立于状态栏。竖屏置于顶部中央，横屏旋转到左侧；横屏隐藏竖屏状态栏，适应窗口计算计入两种手机框的高度。
- `src/preview/previewBridge.ts`：仅给显式手机预览标记设备角色，用于模拟切口安全区。

## 验证

- `npm.cmd run build` 通过；保留原有 Three.js 大体积包提示。
- `npm.cmd test`：100 项通过。
- 360 × 640：目录标题透明、滚动条不再为白色；滚动列表时标题和关闭按钮位置保持不变；页面没有横向溢出。
- 812 × 375：灵动岛在左侧；摇杆、顶部菜单、食篮、影笺、创作表单和资料手册均避开切口。
- 目录、食篮、影笺、创作表单和资料手册开合正常，验收页未记录控制台错误。
- 这是浏览器尺寸预览验收，尚未进行实体 iPhone 验收。

## 画面证据

- [竖屏目录](../../culture-qa/mobile-panels-20261010/final-directory-dual.png)。
- 同目录 `final-landscape-dual.png`：横屏手机框。
- 同目录 `layout-evidence.json` 和 `panel-audit.json`：DOM 位置与样式记录。

双端预览：<http://127.0.0.1:5193/?preview=dual>。本次仅修改本地工作区，未提交或发布到 GitHub。
