// Comprueba la landing en escritorio, tableta y móvil: menú, anclas, crónica, sin scroll horizontal ni «demo».
// Uso: node scripts/landing-check.cjs [url base] [carpeta]
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:5173/';
const OUT = process.argv[3] || '/tmp/claude-0/landing';
(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch(); const errs = [];
  for (const [name, w, h] of [['escritorio', 1920, 1080], ['tableta', 1180, 820], ['movil', 390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: name === 'movil', hasTouch: name === 'movil' });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errs.push(`${name}: ${e.message}`));
    await p.goto(BASE); await p.waitForTimeout(1200);
    await p.screenshot({ path: `${OUT}/${name}-portada.png` });
    const text = await p.evaluate(() => document.body.innerText);
    if (/\bdemo\b/i.test(text)) errs.push(`${name}: aparece «demo»`);
    const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (over > 1) errs.push(`${name}: scroll horizontal de ${over}px`);
    const broken = await p.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')).filter((h) => h.length > 1 && !document.getElementById(h.slice(1))));
    if (broken.length) errs.push(`${name}: anclas rotas ${broken.join(', ')}`);
    if (name === 'movil') {
      await p.tap('[data-testid=nav-burger]'); await p.waitForTimeout(200);
      await p.screenshot({ path: `${OUT}/${name}-menu.png` });
      await p.tap('[data-testid=nav-menu] a[href="#varkhollow"]'); await p.waitForTimeout(900);
    } else {
      await p.click('header a[href="#varkhollow"]'); await p.waitForTimeout(900);
      const on = await p.evaluate(() => document.querySelector('header a.is-on')?.textContent);
      if (on !== 'VarkHollow') errs.push(`${name}: el menú no resalta VarkHollow (${on})`);
    }
    await p.screenshot({ path: `${OUT}/${name}-varkhollow.png` });
    await p.click('[data-testid=btn-chronicle]'); await p.waitForTimeout(200);
    if (!(await p.isVisible('[data-testid=chronicle]'))) errs.push(`${name}: la crónica no se despliega`);
    await p.screenshot({ path: `${OUT}/${name}-cronica.png` });
    for (const id of ['trailer', 'mecanicas', 'galeria', 'hoja-de-ruta']) { await p.evaluate((id) => document.getElementById(id).scrollIntoView(), id); await p.waitForTimeout(400); await p.screenshot({ path: `${OUT}/${name}-${id}.png` }); }
    await p.screenshot({ path: `${OUT}/${name}-completa.png`, fullPage: true });
    await ctx.close();
  }
  console.log(errs.length ? errs.join('\n') : 'Todo bien');
  await b.close(); process.exit(errs.length ? 1 : 0);
})();
