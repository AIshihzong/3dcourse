# 给 Autodos 团队的项目简介

这是“七年级科学 3D 实验室”：浙教版七年级科学全年 36 个知识点的 3D 互动实验网站，给学生在平板上用，可以装到桌面、断网可用。
线上地址 https://g7-science.pages.dev ，由客户本人部署，团队不碰。

## 用户是谁

七年级学生，主要在华为 MatePad 上横屏或竖屏使用，也有人在电脑上用。他们要的是：看得懂的 3D 实验、能自己动手拖、做题有反馈、复习考试范围清楚。

## 代码在哪

见 README.md 的目录表。整站构建成一个单文件 `dist/index.html`（three.js 内联），外加 Service Worker。
没有后端、没有账号，进度只在浏览器的 localStorage（`g7sci.v1`）。

## 团队怎么干活

- 基线分支 `autodos/main`，每项改动一个分支，过了检查才合入。`main` 留给客户自己，团队不直接改。
- 检查是 `bash scripts/autodos-check.sh`：构建，再用 Playwright 打开首页和 36 个知识点页，有脚本报错或 3D 画面出不来就算失败。
- 改了学生看得到的东西，要附横屏和竖屏截图（交互改动附录屏），放在 `.autodos/evidence/`。
- 进度简报写在 `autodos/status` 分支的 STATUS.md。

## 不要做的事

- 不部署，不跑 `npm run deploy` 或 wrangler。
- 不引入需要联网的资源或付费服务。
- 不改 localStorage 的键和结构而不做迁移。
- 拿不准的科学内容不要自己编，去问客户。
