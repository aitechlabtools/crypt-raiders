// Rótulos del tráiler v3 (PNG transparentes 1280x720)
const { chromium } = require('playwright');
const low = (big, sub, cls = '') => `<div class="grad"></div><div class="c low"><div class="big2 ${cls}">${big}</div>${sub ? `<div class="sub">${sub}</div>` : ''}</div>`;
const cards = {
  oro: '<div class="c"><div class="mid">¿Te atreves a bajar?</div></div>',
  mapas: low('MAPA PROCEDURAL', 'uno nuevo en cada expedición'),
  clases: low('2 CLASES JUGABLES', 'Guerrero y Mago · más en camino'),
  equipo: low('23 ARMAS · 66 PIEZAS', '5 rarezas · tu equipo cambia tu aspecto', 'gold'),
  habilidades: low('22 HABILIDADES', 'cada arma te da las suyas'),
  jefe: low('3 JEFES', 'uno al fondo de cada zona', 'red'),
  zonas: low('3 ZONAS · NIVEL 100', 'la Mazmorra, la Cripta y el Infierno'),
  mercenarios: low('MERCENARIOS', 'contrátalos… o rompe sus cadenas', 'gold'),
  forja: low('PICA · FORJA · MEJORA', 'minerales de cada zona para tus propias armas'),
  vestuario: low('ATUENDOS', 'trajes completos, sin ventajas', 'gold'),
  aliado: low('¿ALIADO…', 'Kael también busca el oro'),
  traidor: low('…O TRAIDOR?', 'si te traiciona, es a muerte', 'red'),
  sal: low('SAL CON VIDA', 'Si escapas, te lo quedas todo. Si caes, lo pierdes todo.'),
  final: '<div class="c"><div class="logo" style="font-size:96px">CRYPT RAIDERS</div><div class="mid gold" style="font-size:34px;margin-top:18px">Confía en tu espada. En nadie más.</div><div class="sub" style="margin-top:34px">Juega gratis en cryptraiders.es</div></div>',
};
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto('file://' + __dirname + '/../cards.html');
  await p.addStyleTag({ content: '.big2{font-family:Cinzel;font-weight:800;font-size:64px;letter-spacing:.12em;text-shadow:0 0 30px rgba(196,40,59,.55),0 4px 0 #000}.grad{position:absolute;left:0;right:0;bottom:0;height:300px;background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.78))}.low{padding-bottom:56px}' });
  await p.evaluate(() => document.fonts.ready);
  for (const [k, html] of Object.entries(cards)) {
    await p.evaluate((h) => { document.getElementById('root').innerHTML = h; }, html);
    await p.waitForTimeout(150);
    await p.screenshot({ path: `${__dirname}/${k}.png`, omitBackground: true });
  }
  await b.close();
})();
