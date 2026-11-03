// Capturas de página completa de la landing (borrador) en los tres tamaños.
// Uso: node mockups/landing/capturar.cjs [url] [carpeta]
const { chromium } = require('playwright');
const URL = process.argv[2] || 'http://localhost:5173/';
const OUT = process.argv[3] || 'mockups/landing/capturas';
const SIZES = [
  ['escritorio-1920x1080', { width: 1920, height: 1080 }, 1],
  ['tableta-1180x820', { width: 1180, height: 820 }, 1],
  ['movil-390x844', { width: 390, height: 844 }, 2],
];
(async () => {
  const b = await chromium.launch();
  for (const [name, viewport, dsf] of SIZES) {
    const p = await b.newPage({ viewport, deviceScaleFactor: dsf, isMobile: viewport.width < 500, hasTouch: viewport.width < 500 });
    await p.goto(URL, { waitUntil: 'load' });
    await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
    // Recorre la página para que carguen las imágenes diferidas
    const h = await p.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < h; y += viewport.height / 2) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(120); }
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(800);
    // Página completa en trozos de 7800 px (las imágenes de más de 8000 px no se pueden enviar)
    const full = await p.evaluate(() => document.documentElement.scrollHeight);
    const step = Math.floor(7800 / dsf);
    for (let k = 0, y = 0; y < full; k++, y += step) {
      await p.screenshot({ path: `${OUT}/${name}-completa-${k + 1}.png`, fullPage: true, clip: { x: 0, y, width: viewport.width, height: Math.min(step, full - y) } });
    }
    // Además, cada sección nueva a tamaño de pantalla
    for (const id of ['varkhollow', 'capturas', 'demo', 'hoja-de-ruta']) {
      await p.evaluate((id) => { const e = document.getElementById(id); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 56); }, id); await p.waitForTimeout(500);
      await p.screenshot({ path: `${OUT}/${name}-${id}.png` });
    }
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    console.log(name, 'alto', h, overflow > 0 ? `¡desborda ${overflow}px!` : 'sin scroll horizontal');
  }
  await b.close();
})();
