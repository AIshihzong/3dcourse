# 七年级科学 3D 实验室

浙教版七年级科学全年 36 个知识点的 3D 互动实验网站，可安装到桌面、断网可用。

- 线上地址：https://g7-science.pages.dev
- 七上 18 个知识点（301–318），七下 18 个知识点（321–338）

## 功能

- **按考试范围筛选**：七上期中、七上期末、七下期中、七下期末、全年。
- **知识点页**（`#kp-<id>`，例如 `#kp-330`）：中间是可拖动的 3D 实验，左侧公式和代入计算，右侧实时数据、3 个考点任务、图表和中考真题。
- **游戏化**：星级、经验值和等级、10 枚徽章、连续学习天数，以及 10 题限时的“考前冲刺”。
- **平板适配**：华为 MatePad 横屏三栏、竖屏上下排布；触屏控件加大。
- **Web App**：可安装到桌面，首次打开后离线可用，有新版本时提示刷新。
- 学习进度存在浏览器 localStorage（key `g7sci.v1`）。

## 目录

| 路径 | 内容 |
|---|---|
| `src/app.js` | 站点外壳：路由、进度、任务、真题、冲刺 |
| `src/kit.js` | three.js 公共工具 |
| `src/scenes/c1.js`–`c7.js` | 各章实验场景 |
| `src/kp.json` | 知识点和真题数据 |
| `src/template.html`、`base.css`、`extra.css` | 页面模板和样式 |
| `pwa/` | Web App 外壳：`head.html`、`tail.html`、`sw.js`、`manifest.webmanifest`、`_headers`、图标 |
| `scripts/build.sh` | 构建脚本 |
| `xhs/` | 小红书宣传视频的录屏、合成脚本和发布文案 |

## 构建与部署

需要 Node.js 18+。

```bash
npm install
npm run build      # 生成 dist/
npm run serve      # 本地预览 http://localhost:8080
npm run deploy     # 部署到 Cloudflare Pages 项目 g7-science（需先 npx wrangler login）
```

`dist/` 包含 `index.html`（单文件页面，three.js 已内联）、`sw.js`、`manifest.webmanifest`、`_headers` 和 `icons/`。
Service Worker 的缓存名会随页面内容自动变化，部署新版本后用户会看到“有新版本，点此刷新”。

## 宣传视频（xhs/）

1. `npm run build` 生成 `build/page.html`。
2. `node xhs/capture.js <场景名>` 逐帧录屏（需要 Playwright），场景名见脚本里的 `SCENES`。
3. 把 NotoSansSC 的 woff 字体放到 `xhs/fonts/`（或设置 `FONTS_DIR`），运行 `python3 xhs/compose.py out.mp4` 合成 1080×1920 视频（需要 Pillow 和 ffmpeg）。
