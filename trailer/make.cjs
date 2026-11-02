const { chromium } = require('playwright');
const cards = {
  'oro': '<div class="c"><div class="mid">Bajas a por oro.</div></div>',
  'explora': '<div class="c low"><div class="big">EXPLORA</div></div>',
  'saquea': '<div class="c low"><div class="big gold">SAQUEA</div></div>',
  'lucha': '<div class="c low"><div class="big red">LUCHA</div></div>',
  'solo': '<div class="c"><div class="mid">Pero no bajas solo.</div></div>',
  'nadie': '<div class="c"><div class="mid red">No te fíes de nadie.</div></div>',
  'traicion': '<div class="c low"><div class="big red">TRAICIÓN</div></div>',
  'sal': '<div class="c low"><div class="big">SAL CON VIDA</div><div class="sub">Si escapas, te lo quedas todo. Si caes, lo pierdes todo.</div></div>',
  'final': '<div class="c"><div class="logo">DREADBOUND</div><div class="mid gold" style="font-size:34px;margin-top:18px">Confía en tu espada. En nadie más.</div><div class="sub" style="margin-top:34px">Juega gratis en dreadbound.es</div></div>',
};
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto('file://' + __dirname + '/cards.html'); await p.evaluate(() => document.fonts.ready);
  for (const [k, html] of Object.entries(cards)) {
    await p.evaluate((h) => { document.getElementById('root').innerHTML = h; }, html);
    await p.waitForTimeout(150);
    await p.screenshot({ path: `${__dirname}/${k}.png`, omitBackground: true });
  }
  await b.close();
})();
