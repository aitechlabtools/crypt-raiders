// Capturas de la maqueta de la landing v2 (mockups/landing-v2). Uso: node scripts/landing-v2-shots.cjs [url base]
const { chromium } = require('playwright');
const BASE = (process.argv[2] || 'http://localhost:5173') + '/mockups/landing-v2/maqueta.html';
const OUT = __dirname + '/../mockups/landing-v2/capturas';
const SIZES = [['escritorio', 1920, 1080], ['tableta', 1180, 820], ['movil', 390, 844]];
(async () => {
  const b = await chromium.launch();
  const errs = [];
  for (const [name, w, h] of SIZES) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: name === 'movil', hasTouch: name === 'movil' });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errs.push(name + ': ' + e.message));
    const shot = async (query, file, sel) => {
      await p.goto(BASE + query); await p.waitForTimeout(900);
      if (sel) { await p.evaluate((s) => { const el = document.querySelector(s); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 56); }, sel); await p.waitForTimeout(500); }
      await p.screenshot({ path: `${OUT}/${name}-${file}.png` });
    };
    await shot('?h=a', 'portada'); await shot('?h=b', 'portada-b'); await shot('?h=c', 'portada-c');
    if (name === 'movil') await shot('?menu=open', 'menu');
    await shot('', 'varkhollow', '#varkhollow');
    await shot('?cronica=open', 'cronica-a', '#varkhollow');
    await shot('?cronica=open&lore=b', 'cronica-b', '#varkhollow');
    await shot('', 'juego', '#juego'); await shot('', 'galeria', '#galeria'); await shot('', 'final', '#hoja-de-ruta');
    await p.goto(BASE); await p.waitForTimeout(900);
    const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (over > 1) errs.push(`${name}: la página se sale ${over}px en horizontal`);
    const small = await p.evaluate(() => [...document.querySelectorAll('header a, header button, .v2-chron-btn, .v2-sub-toggle')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.height < 32; }).map((e) => e.textContent.trim()));
    if (name === 'movil' && small.length) errs.push('móvil: botones bajos ' + small.join(', '));
    await p.screenshot({ path: `${OUT}/${name}-completa.png`, fullPage: true });
    await ctx.close();
  }
  console.log('avisos:', errs.length ? errs : 'ninguno');
  await b.close();
})();
