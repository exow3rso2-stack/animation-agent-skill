// ============================================================
//  captions.js — kinetic subtitles: each word rises in on the frame it is spoken,
//  key words in cyan, numbers set as figures. Token: TEXT@wordIndex, '*' = accent, '|' = new chunk, '_' = nbsp
// ============================================================
const CAPSPEC = {
  hook:    'ПЕРВЫЕ@0 $10_000@1 ЗАРАБОТАТЬ@4 | *СЛОЖНЕЕ,@5 ЧЕМ@6 СЛЕДУЮЩИЕ@7 *$100_000@8',
  line:    'БОЛЬШИНСТВО@0 ДУМАЕТ,@1 | ЧТО@2 ДЕНЬГИ@3 РАСТУТ@4 *ПО@5 *ПРЯМОЙ@6',
  years:   'ЕСЛИ@0 ПЕРВЫЕ@1 $10_000@2 ЗАНЯЛИ@4 *ГОД@5 | СЛЕДУЮЩИЕ@6 $100_000@7 ЗАЙМУТ@8 *ДЕСЯТЬ@9 *ЛЕТ@10',
  quit:    'ОНИ@0 СЧИТАЮТ@1 ЭТО…@2 | И@3 *СДАЮТСЯ,@4 ДАЖЕ@5 НЕ@6 НАЧАВ@7',
  break:   'НО@0 РОСТ@1 РАБОТАЕТ@2 *НЕ@3 *ТАК@4',
  start:   'ПРЕДСТАВЬ@0 ЧЕЛОВЕКА@1 НА@2 *СТАРТЕ@3 | НИ@4 *АУДИТОРИИ,@5 НИ@6 *ПРОДУКТА,@7 | НИ@8 *ДОКАЗАТЕЛЬСТВ,@9 ЧТО@10 ХОТЬ@11 ЧТО-ТО@12 РАБОТАЕТ@13',
  posts:   'ОН@0 ПОСТИТ@1 НЕДЕЛЯМИ@2 — *ТИШИНА@3',
  launch:  'ЗАПУСКАЕТ@0 ПЕРВЫЙ@1 *ПРОДУКТ@2 | И@3 ПОЛУЧАЕТ@4 *$40@5',
  stairs:  'ОТСЮДА@0 $10_000@1 КАЖУТСЯ@3 *НЕВОЗМОЖНЫМИ@4 | А@5 $100_000@6 — ПРОСТО@8 *ШУТКОЙ@9',
  blind:   'НО@0 ОН@1 ПОКА@2 НЕ@3 ВИДИТ@4 *ГЛАВНОГО@5',
  top:     'ТОТ,@0 КТО@1 ДОШЁЛ@2 ДО@3 $10_000,@4 | ПОЛУЧИЛ@6 *НЕ@7 *ПРОСТО@8 *ДЕНЬГИ@9',
  knows:   'ОН@0 ЗНАЕТ,@1 КАКОЙ@2 ПОСТ@3 *ВЫСТРЕЛИВАЕТ@4 | И@5 ЗА@6 ЧТО@7 ЛЮДИ@8 *РЕАЛЬНО@9 *ПЛАТЯТ@10',
  system:  'У@0 НЕГО@1 ЕСТЬ@2 *ПРОДУКТ,@3 *ПЕРВЫЕ@4 *КЛИЕНТЫ@5 | И@6 *СИСТЕМА,@7 КОТОРАЯ@8 БОЛЬШЕ@9 | НЕ@10 ЗАВИСИТ@11 ОТ@12 *УДАЧИ@13',
  battle:  'ПОЭТОМУ@0 ПУТЬ@1 К@2 $100_000@3 — | ЭТО@5 *НЕ@6 *НОВАЯ@7 *БИТВА@8',
  repeat:  'ЭТО@0 *ПОВТОРИТЬ@1 ТО,@2 ЧТО@3 УЖЕ@4 РАБОТАЕТ@5 | ЕЩЁ@6 *ДЕВЯТЬ@7 *РАЗ@8',
  notmoney:'ПЕРВЫЕ@0 $10_000@1 — | ЭТО@3 *НЕ@4 ПРО@5 *ДЕНЬГИ@6',
  machine: 'ЭТО@0 ПРО@1 ТО,@2 ЧТОБЫ@3 *ПОСТРОИТЬ@4 *МАШИНУ@5',
  easier:  'А@0 КОГДА@1 ОНА@2 ЕСТЬ@3 — | КАЖДЫЙ@4 СЛЕДУЮЩИЙ@5 ДОЛЛАР@6 | ДАЁТСЯ@7 *ЛЕГЧЕ@8 ПРЕДЫДУЩЕГО@9',
};
// build chunks with times
const CAPS = [];
for (const L of VOICE.lines) {
  const spec = CAPSPEC[L.id]; if (!spec) continue;
  let cur = null;
  const toks = spec.split(/\s+/);
  for (const tk of toks) {
    if (tk === '|') { cur = null; continue; }
    if (!cur) { cur = { id: L.id, words: [] }; CAPS.push(cur); }
    const m = /^(\*?)(.*?)(?:@(\d+))?$/.exec(tk);
    const idx = m[3] != null ? +m[3] : null;
    const t = idx != null ? L.words[Math.min(idx, L.words.length - 1)].t0 : (cur.words.length ? cur.words[cur.words.length - 1].t : L.t0);
    cur.words.push({ w: m[2].replace(/_/g, ' '), hl: !!m[1], t });
  }
}
CAPS.forEach((c) => (c.t0 = c.words[0].t));
CAPS.forEach((c, i) => {
  const nxt = CAPS[i + 1], L = LN(c.id);
  c.t1 = nxt ? Math.min(nxt.t0, (nxt.id === c.id ? nxt.t0 : L.t1 + 0.55)) : L.t1 + 0.6;
  if (nxt && nxt.id !== c.id) c.t1 = Math.min(nxt.t0 - 0.02, Math.max(L.t1 + 0.25, nxt.t0 - 0.25));
});
let CAP_HIDE = () => false;   // scenes can veto captions (the final title)
function captions(t) {
  const c = CAPS.find((c) => t >= c.t0 - 0.08 && t < c.t1 + 0.14);
  if (!c || CAP_HIDE(t)) return;
  const S = 50, y = 112, gap = 24;
  // layout
  const ws = c.words.map((w) => ({ ...w, wd: TW(w.w, S, 800, SANS, 0.5) }));
  let tot = ws.reduce((s, w) => s + w.wd, 0) + gap * (ws.length - 1);
  const sc = Math.min(1, 1680 / tot);
  let x = W / 2 - (tot * sc) / 2;
  const out = clamp((t - c.t1) / 0.14);                 // chunk exit
  ctx.save();
  for (const w of ws) {
    const k = clamp((t - (w.t - 0.06)) / 0.16), e = E.o(k);
    if (k > 0) {
      const yy = y + (1 - e) * 22 - out * 14, a = e * (1 - out);
      const pop = w.hl ? 1 + 0.06 * Math.sin(Math.PI * clamp((t - w.t) / 0.3)) : 1;
      const cx = x + (w.wd * sc) / 2;
      ctx.save(); ctx.translate(cx, yy); ctx.scale(sc * pop, sc * pop);
      // soft dark backing for legibility over bright scenes
      T(w.w, 0, 0, { s: S, w: 800, c: w.hl ? C.cy : C.wh, a, ls: 0.5, g: w.hl ? 22 : 0 });
      ctx.restore();
    }
    x += (w.wd + gap) * sc;
  }
  ctx.restore();
}
