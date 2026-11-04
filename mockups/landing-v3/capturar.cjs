// Capturas de la propuesta landing v3 (portada, menú y Mecánicas con los aliados) en los tres tamaños.
// Uso: node mockups/landing-v3/capturar.cjs [url] [carpeta]
const { chromium } = require('playwright');
const URL = process.argv[2] || 'http://localhost:5173/';
const OUT = process.argv[3] || 'mockups/landing-v3/capturas';
const SIZES = [['escritorio-1920x1080', 1920, 1080, 1], ['tableta-1180x820', 1180, 820, 1], ['movil-390x844', 390, 844, 2]];
(async () => {
  const b = await chromium.launch();
  for (const [n, w, h, d] of SIZES) {
    const phone = w < 500;
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: d, isMobile: phone, hasTouch: phone });
    const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
    await p.goto(URL, { waitUntil: 'load' });
    await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
    const H = await p.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < H; y += h / 2) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(80); }
    await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(700);
    await p.screenshot({ path: `${OUT}/${n}-1-portada.png` });
    if (phone) { await p.tap('[data-testid=nav-burger]'); await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}/${n}-2-menu.png` }); await p.tap('[data-testid=nav-burger]'); }
    else { await p.evaluate(() => scrollTo(0, document.getElementById('mecanicas').offsetTop - 56)); await p.waitForTimeout(400); await p.screenshot({ path: `${OUT}/${n}-2-menu.png`, clip: { x: 0, y: 0, width: w, height: 260 } }); }
    // Tráiler tras la portada
    await p.evaluate(() => scrollTo(0, document.getElementById('trailer').offsetTop - 56)); await p.waitForTimeout(300);
    await p.screenshot({ path: `${OUT}/${n}-3-trailer.png` });
    const shotSection = async (tag) => {
      const r = await p.evaluate(() => { const e = document.getElementById('mecanicas'); return { y: e.getBoundingClientRect().top + scrollY, h: e.offsetHeight }; });
      const step = Math.floor(7800 / d);
      for (let k = 0, y = r.y; y < r.y + r.h; k++, y += step)
        await p.screenshot({ path: `${OUT}/${n}-4-mecanicas${tag}-${k + 1}.png`, fullPage: true, clip: { x: 0, y, width: w, height: Math.min(step, r.y + r.h - y) } });
    };
    await shotSection('');
    if (phone) { await p.tap('[data-testid=btn-mechanics]'); await p.waitForTimeout(300); await shotSection('-todas'); }
    const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    console.log(n, over > 0 ? `¡desborda ${over}px!` : 'sin scroll horizontal', errs.length ? errs : 'consola limpia');
    await p.close();
  }
  await b.close();
})();
