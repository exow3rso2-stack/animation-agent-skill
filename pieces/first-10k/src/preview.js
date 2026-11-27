// live preview in a browser: plays in real time (no audio); ?t=12.5 freezes a frame
(function () {
  const q = new URLSearchParams(location.search);
  if (q.has('export')) return;
  document.fonts.ready.then(() => {
    if (q.has('t')) { renderFrame(parseFloat(q.get('t'))); return; }
    const start = performance.now();
    const tick = () => { const t = ((performance.now() - start) / 1000) % DURATION; renderFrame(Math.floor(t * FPS) / FPS); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
})();
