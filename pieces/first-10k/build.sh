#!/bin/sh
# assemble index.html: voice timing + sources (run from the piece dir)
set -e
{ echo '<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Первые $10 000</title>'
  echo '<style>html,body{margin:0;background:#03070f;height:100%;overflow:hidden}body{display:flex;align-items:center;justify-content:center}canvas{width:min(100vw,calc(100vh*16/9));height:auto;display:block}</style></head><body>'
  echo '<canvas id="c" width="1920" height="1080"></canvas><script>'
  printf 'window.VOICE = '; cat voice.json; echo ';'
  for f in core captions main scenes_a scenes_b scenes_c scenes_d; do cat src/$f.js; echo; done
  cat src/preview.js
  echo '</script></body></html>'; } > index.html
node -e "const s=require('fs').readFileSync('index.html','utf8');const m=s.match(/<script>([\s\S]*)<\/script>/);new (require('vm').Script)(m[1]);console.log('syntax ok',s.length)"
