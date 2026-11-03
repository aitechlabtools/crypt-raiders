// Capturas de la maqueta de skins en escritorio, tableta y móvil (Playwright, sin interfaz).
// Uso: con el servidor de desarrollo abierto (npx vite --port 5173):
//   node mockups/skins/capturar.cjs [http://localhost:5173]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const BASE = (process.argv[2] || 'http://localhost:5173') + '/mockups/skins/maqueta.html';
const OUT = path.join(__dirname, 'capturas');
fs.mkdirSync(OUT, { recursive: true });
const SIZES = [
  { n: 'escritorio', vp: { width: 1920, height: 1080 }, touch: false },
  { n: 'tableta', vp: { width: 1180, height: 820 }, touch: true },
  { n: 'movil', vp: { width: 844, height: 390 }, touch: true },
];
const VIEWS = ['alijo', 'selector', 'tienda', 'confirmar'];
(async () => {
  const b = await chromium.launch();
  const errs = [];
  for (const s of SIZES) {
    const ctx = await b.newContext({ viewport: s.vp, hasTouch: s.touch, isMobile: s.touch, deviceScaleFactor: 1 });
    for (const v of VIEWS) {
      const p = await ctx.newPage();
      p.on('pageerror', (e) => errs.push(`${s.n}/${v}: ${e.message}`));
      await p.goto(`${BASE}?vista=${v}&debug`);
      await p.waitForTimeout(900);
      await p.screenshot({ path: path.join(OUT, `${v}_${s.n}.png`) });
      const wide = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      if (wide) errs.push(`${s.n}/${v}: se sale a lo ancho`);
      await p.close();
    }
    await ctx.close();
  }
  const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}?vista=capas&debug`); await p.waitForTimeout(800);
  await p.screenshot({ path: path.join(OUT, 'capas_todas-las-clases.png'), fullPage: true });
  await b.close();
  console.log(errs.length ? 'Avisos:\n - ' + errs.join('\n - ') : 'Capturas hechas sin errores');
})();
