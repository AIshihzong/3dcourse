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

## 鉴识社 · 探案游戏（试玩版）

把知识点变成破案的证据：过场动画在网页里实时播放，和鉴定小游戏交替推进剧情。构建后在 `dist/play/`（部署后是 `/play/`），单文件版在 `build/game.html`。

- 试玩案件「CASE 01 实验楼失窃案」：开场过场 → 4 句证词 → 鉴定 3 件物证（331 光的折射、327 声音的传播、332 凸透镜成像）→ 每件物证的结论过场 → 推理（逐句判断证词、指认作案人）→ 对质与真相过场 → 结案报告。
- 每次鉴定是一个三阶段任务，之后是数据回放和结论验证，按 S/A/B/C 评级。结案分数 = 三次鉴定平均分 × 0.7 + 推理分（满分 300，判断错一句扣 50，指认错一人扣 100）。
- 过场的镜头用 [huashu-motion](https://github.com/alchaincyf/huashu-motion) 的相机系统（`src/game/story/camera-rig.js`，MIT 许可），镜头语言按它的规范：开场甩镜、推近细节、卡点快切、停留时缓慢漂移。字幕逐字打出；浏览器有中文语音时会配音，可在右上角关闭。
- 进度存在 localStorage（key `g7game.v2`）。案件板底部有“鉴定训练记录”（原来的任务地图）和“家长入口”。
- 七年级上学期全学科的剧情总规划（4 幕 12 案加终章）另见规划文档。

| 路径 | 内容 |
|---|---|
| `src/game/main.js` | 游戏外壳：案件板、推理、结案报告、鉴定任务流程、存档 |
| `src/game/case.js` | 案件数据：人物、证词、物证、鉴定结论、真相 |
| `src/game/story/world.js` | 夜晚校园 3D 场景：实验楼、生态池、门卫室、三个室内场景和人物 |
| `src/game/story/cut.js` | 实时过场播放器：镜头、字幕、配音、字卡、印章 |
| `src/game/story/scripts.js` | 过场剧本：开场与问询、三段鉴定结论、对质与真相 |
| `src/game/story/camera-rig.js` | huashu-motion 相机系统（MIT） |
| `src/game/sfx.js` | WebAudio 合成音效（不需要音频文件） |
| `src/game/levels/index.js` | 36 个知识点的名字和口诀，已做好关卡的任务说明和结论验证题 |
| `src/game/levels/fish.js`、`bell.js`、`lens.js` | 三个鉴定任务 |
| `src/game/game.html`、`game.css` | 页面模板和样式 |

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
