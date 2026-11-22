#!/usr/bin/env bash
# Autodos 的检查：每次改动合入前都要过。先构建，再用 Playwright 打开页面把首页和 36 个知识点都走一遍。
set -euo pipefail
cd "$(dirname "$0")/.."
[ -d node_modules ] || npm install --no-audit --no-fund
npm run build
# Playwright 可以装在项目里，也可以全局装一次（npm i -g playwright && npx playwright install chromium）。
# 这台机器上可能有好几个 Node（nvm、fnm、自带工具链），装在哪个底下都找得到。
roots=("$(npm root -g 2>/dev/null || true)")
for d in "$HOME"/.nvm/versions/node/*/lib/node_modules "$HOME"/.local/share/fnm/node-versions/*/installation/lib/node_modules \
         "$HOME"/Library/Application\ Support/fnm/node-versions/*/installation/lib/node_modules "$HOME"/.local/share/*/node*/lib/node_modules \
         /opt/homebrew/lib/node_modules /usr/local/lib/node_modules; do
  [ -d "$d/playwright" ] && roots+=("$d")
done
NODE_PATH="${NODE_PATH:-}"
for r in "${roots[@]}"; do [ -n "$r" ] && NODE_PATH="${NODE_PATH:+$NODE_PATH:}$r"; done
export NODE_PATH
if node -e 'require.resolve("playwright")' >/dev/null 2>&1; then
  node scripts/smoke.mjs build/page.html
else
  echo "autodos-check: 没装 Playwright，跳过页面走查（只做了构建）" >&2
fi
