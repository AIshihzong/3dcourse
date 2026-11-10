#!/usr/bin/env bash
# Build dist/: bundle src/ into one HTML page, wrap it with the PWA shell, add sw.js, manifest and icons.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p build dist/icons
npx esbuild src/app.js --bundle --minify --format=iife --legal-comments=none --charset=utf8 \
  --loader:.json=json --outfile=build/app.js --log-level=warning
node -e '
const fs = require("fs");
let t = fs.readFileSync("src/template.html", "utf8");
t = t.replace("/*BASE_CSS*/", () => fs.readFileSync("src/base.css", "utf8"))
     .replace("/*EXTRA_CSS*/", () => fs.readFileSync("src/extra.css", "utf8"))
     .replace("/*APP_JS*/", () => fs.readFileSync("build/app.js", "utf8").replace(/<\/script/g, "<\\/script"));
fs.writeFileSync("build/page.html", t);
const i = t.indexOf("<div");
const head = fs.readFileSync("pwa/head.html", "utf8"), tail = fs.readFileSync("pwa/tail.html", "utf8");
fs.writeFileSync("dist/index.html", head + t.slice(0, i) + "</head>\n<body>\n" + t.slice(i) + "\n" + tail);
'
VER=$(node -e 'const c=require("crypto");process.stdout.write(c.createHash("sha1").update(require("fs").readFileSync("build/page.html")).digest("hex").slice(0,10))')
sed "s/__VER__/$VER/" pwa/sw.js > dist/sw.js
cp pwa/manifest.webmanifest pwa/_headers dist/
cp pwa/icons/*.png dist/icons/
echo "built dist/ (cache g7sci-$VER)"
