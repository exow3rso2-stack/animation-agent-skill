#!/bin/bash
# usage: render_part.sh <start> <end> <name>  -> jpeg frames in out/frames/
cd "$(dirname "$0")"
npx remotion render src/index.tsx ClimbShort out/frames --sequence --image-format=jpeg --jpeg-quality=95 --frames=$1-$2 --browser-executable=/opt/pw-browsers/chromium --gl=angle --concurrency=1 --log=error --scale=0.6666666 --props='{"post":{"dpr":0.6667},"lite":{"msaa":2}}' > out/parts/$3.log 2>&1
echo done $3 $? >> out/parts/status
