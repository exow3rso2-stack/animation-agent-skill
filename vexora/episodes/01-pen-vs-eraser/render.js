// node render.js stills t1,t2,...  |  node render.js video <workers>
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');
const ROOT = __dirname;
function serve() {
  return new Promise(res => {
    const srv = http.createServer((q, r) => {
      const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]) === '/' ? 'index.html' : decodeURIComponent(q.url.split('?')[0]));
      fs.readFile(p, (e, d) => { if (e) { r.statusCode = 404; return r.end(); } const ext = path.extname(p); r.setHeader('Content-Type', { '.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf' }[ext] || 'application/octet-stream'); r.end(d); });
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}
async function page(browser, port) {
  const p = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.error('PAGEERR', e.message));
  await p.goto(`http://127.0.0.1:${port}/index.html`);
  await p.evaluate(() => window.ready);
  return p;
}
const grab = (p, t) => p.evaluate(t => { renderAt(t); return document.getElementById('c').toDataURL('image/png').split(',')[1]; }, t);
(async () => {
  const mode = process.argv[2];
  const srv = await serve(); const port = srv.address().port;
  const browser = await chromium.launch({ args: ['--disable-gpu-vsync'] });
  if (mode === 'stills') {
    const ts = process.argv[3].split(',').map(Number); const out = process.argv[4] || 'stills';
    fs.mkdirSync(out, { recursive: true });
    const p = await page(browser, port);
    for (const t of ts) fs.writeFileSync(`${out}/t${t.toFixed(2).padStart(6, '0')}.png`, Buffer.from(await grab(p, t), 'base64'));
  } else if (mode === 'video') {
    const nw = +process.argv[3] || 4; const FPS = +(process.env.FPS||60); const DUR = await (await page(browser, port)).evaluate(() => DUR);
    const total = Math.round(DUR * FPS); const per = Math.ceil(total / nw);
    fs.mkdirSync('seg', { recursive: true });
    const t0 = Date.now();
    await Promise.all([...Array(nw)].map(async (_, w) => {
      const a = w * per, b = Math.min(total, a + per); const p = await page(browser, port);
      const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', String(FPS), `seg/s${w}.mp4`]);
      ff.stderr.on('data', d => process.stderr.write(d));
      for (let f = a; f < b; f++) {
        const buf = Buffer.from(await grab(p, f / FPS), 'base64');
        if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
        if (w === 0 && (f - a) % 120 === 0) console.log(`w0 ${f - a}/${b - a}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
      }
      ff.stdin.end(); await new Promise(r => ff.on('close', r));
      console.log(`worker ${w} done frames ${a}-${b - 1}`);
    }));
    fs.writeFileSync('seg/list.txt', [...Array(nw)].map((_, w) => `file 's${w}.mp4'`).join('\n'));
    console.log('total frames', total);
  }
  await browser.close(); srv.close();
})();
