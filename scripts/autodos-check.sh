#!/usr/bin/env bash
# Autodos 的检查：每次改动合入前都要过。先构建，再用 Playwright 打开页面把首页和 36 个知识点都走一遍。
set -euo pipefail
cd "$(dirname "$0")/.."
[ -d node_modules ] || npm install --no-audit --no-fund
npm run build
if node -e 'require.resolve("playwright")' >/dev/null 2>&1 || [ -n "${NODE_PATH:-}" ]; then
  node scripts/smoke.mjs build/page.html
else
  echo "autodos-check: 没装 Playwright，跳过页面走查（只做了构建）" >&2
fi
