// Rótulos del tráiler v4 (PNG transparentes 1280x720). Sin cifras exactas: como mucho «más de X».
const { chromium } = require('playwright');
const low = (big, sub, cls = '') => `<div class="grad"></div><div class="c low"><div class="big2 ${cls}">${big}</div>${sub ? `<div class="sub">${sub}</div>` : ''}</div>`;
const cards = {
  oro: '<div class="c"><div class="mid">¿Te atreves a bajar?</div></div>',
  mapas: low('MAPA PROCEDURAL', 'uno nuevo en cada expedición'),
  clases: low('ELIGE QUIÉN BAJA', 'Guerrero y Mago · más clases en camino'),
  equipo: low('MÁS DE 30 ARMAS', 'y más de 70 piezas · tu equipo cambia tu aspecto', 'gold'),
  habilidades: low('CADA ARMA, SUS HABILIDADES', 'combate por turnos'),
  jefe: low('UN JEFE EN CADA ZONA', 'al fondo de cada bajada', 'red'),
  zonas: low('3 ZONAS · NIVEL 100', 'elige dónde bajar desde el Bastión'),
  mercenarios: low('MERCENARIOS', 'contrátalos… o rompe sus cadenas', 'gold'),
  forja: low('PICA · FORJA · MEJORA', 'minerales de cada zona para tus propias armas'),
  atuendos: low('ATUENDOS', 'con el oro del juego · solo estéticos', 'gold'),
  movil: '<div class="c" style="justify-content:flex-start;padding-top:56px"><div class="big2 gold" style="font-size:52px">TAMBIÉN EN EL MÓVIL</div><div class="sub" style="margin-top:8px">a pantalla completa, con controles táctiles</div></div>'
    + '<div style="position:absolute;left:122px;top:192px;width:1036px;height:498px;border-radius:40px;border:3px solid #3a3741;box-shadow:inset 0 0 0 15px #15131a, inset 0 0 0 18px #07060a, 0 0 60px rgba(196,40,59,.25)"></div>',
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
