// usage: node stills.mjs out_dir t1,t2,... [--blur]   -> out_dir/s_<t>.png (+ prints page errors)
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const [out, list] = process.argv.slice(2);
const blur = process.argv.includes('--blur');
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on('pageerror', (e) => console.error('PAGEERROR', e.message));
p.on('console', (m) => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
await p.goto(pathToFileURL(path.resolve('index.html')).href + '?export=1');
await p.evaluate(async (bl) => { await document.fonts.load('900 40px "Inter Display"'); await document.fonts.load('800 40px "Inter Display"'); await document.fonts.load('600 40px "Inter Display"'); await document.fonts.load('800 40px "JetBrains Mono"'); await document.fonts.ready; window.__exporting = bl; }, blur);
for (const t of list.split(',').map(Number)) {
  const url = await p.evaluate((t) => { window.renderFrame(t); return document.getElementById('c').toDataURL('image/png'); }, t);
  fs.writeFileSync(path.join(out, `s_${t.toFixed(2).padStart(6, '0')}.png`), Buffer.from(url.split(',')[1], 'base64'));
}
await b.close();
console.log('ok');
