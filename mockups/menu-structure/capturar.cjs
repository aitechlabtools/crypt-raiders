// Capturas de las maquetas: node mockups/menu-structure/capturar.cjs [url base] [opciones] [pantallas]
// Ejemplo: node mockups/menu-structure/capturar.cjs http://localhost:5173/mockups/menu-structure/
const { chromium } = require('playwright');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:5173/mockups/menu-structure/';
const OPTS = (process.argv[3] || 'a,b,c').split(',');
const SCREENS = (process.argv[4] || 'jugar,clase,alijo,mercaderes,mercader,personaje').split(',');
const SIZES = { escritorio: { width: 1920, height: 1080 }, tableta: { width: 1180, height: 820, touch: true }, movil: { width: 844, height: 390, touch: true } };
(async () => {
  const b = await chromium.launch();
  const errs = [];
  for (const [dev, s] of Object.entries(SIZES)) {
    const ctx = await b.newContext({ viewport: { width: s.width, height: s.height }, hasTouch: !!s.touch, isMobile: dev === 'movil', deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errs.push(`${dev}: ${e.message}`));
    for (const o of OPTS) for (const sc of SCREENS) {
      await page.goto(`${BASE}opcion-${o}.html?s=${sc}`, { waitUntil: 'load' }); await page.waitForTimeout(150);
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => window.__mockReady && window.__mockReady());
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(__dirname, 'capturas', `opcion-${o}_${sc}_${dev}.png`) });
    }
    await ctx.close();
  }
  console.log('capturas hechas', errs.length ? errs : 'sin errores');
  await b.close();
})();
