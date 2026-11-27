// Render every frame i/60 of index.html to frames/f_%05d.jpg (parallel pages), and write sfx.json.
// usage: node export.mjs [--from N] [--to N] [--workers 4]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium } = createRequire(import.meta.url)('playwright');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i >= 0 ? +process.argv[i + 1] : d; };
const OUT = path.resolve('frames'); fs.mkdirSync(OUT, { recursive: true });
const url = pathToFileURL(path.resolve('index.html')).href + '?export=1';
const b = await chromium.launch({ args: ['--disable-gpu-vsync'] });
async function open() {
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', (e) => console.error('PAGEERROR', e.message));
  await p.goto(url);
  await p.evaluate(async () => { for (const w of ['900', '800', '700', '600']) { await document.fonts.load(`${w} 40px "Inter Display"`); await document.fonts.load(`${w} 40px "JetBrains Mono"`); } await document.fonts.ready; window.__exporting = true; });
  return p;
}
const p0 = await open();
const meta = await p0.evaluate(() => ({ n: NFRAMES, fps: FPS, dur: DURATION, sfx: SFX }));
fs.writeFileSync('sfx.json', JSON.stringify(meta.sfx, null, 0));
const from = arg('from', 0), to = Math.min(arg('to', meta.n), meta.n), nw = arg('workers', 4);
console.log(`frames ${from}..${to - 1} of ${meta.n} (${meta.dur}s @ ${meta.fps}), ${meta.sfx.length} sfx cues, ${nw} workers`);
const pages = [p0]; for (let i = 1; i < nw; i++) pages.push(await open());
let done = 0; const t0 = Date.now();
await Promise.all(pages.map(async (p, w) => {
  for (let f = from + w; f < to; f += nw) {
    const file = path.join(OUT, `f_${String(f).padStart(5, '0')}.jpg`);
    if (fs.existsSync(file) && !process.argv.includes('--force')) { done++; continue; }
    const data = await p.evaluate((f) => { window.renderFrame(f / FPS); return document.getElementById('c').toDataURL('image/jpeg', 0.95); }, f);
    fs.writeFileSync(file, Buffer.from(data.slice(data.indexOf(',') + 1), 'base64'));
    if (++done % 200 === 0) console.log(`${done}/${to - from}  ${((Date.now() - t0) / done).toFixed(0)} ms/frame`);
  }
}));
console.log(`done ${done} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
await b.close();
