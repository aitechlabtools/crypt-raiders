// Capturas de la maqueta: node mockups/oro-fisico/capturar.cjs [url-base]
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:5173/mockups/oro-fisico/maqueta.html';
const OUT = __dirname + '/capturas';
const SIZES = [{ n: 'escritorio', vp: { width: 1920, height: 1080 }, t: false }, { n: 'tableta', vp: { width: 1180, height: 820 }, t: true }, { n: 'movil', vp: { width: 844, height: 390 }, t: true }];
const VIEWS = ['alijo', 'bolsillo', 'sacar', 'dividir', 'botin', 'coleccionista', 'venta-llena'];
(async () => {
  const b = await chromium.launch();
  for (const s of SIZES) {
    const ctx = await b.newContext({ viewport: s.vp, hasTouch: s.t, isMobile: s.t });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    for (const v of VIEWS) {
      await p.goto(`${BASE}?v=${v}`); await p.waitForTimeout(700);
      const over = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      await p.screenshot({ path: `${OUT}/${s.n}-${v}.png` });
      if (over) console.log('se sale en horizontal:', s.n, v);
    }
    if (errs.length) console.log(s.n, errs);
    await ctx.close();
  }
  await b.close();
})();
