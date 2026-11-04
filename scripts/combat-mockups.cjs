// Capturas de las maquetas de la barra de combate (mockups/combate): 3 distribuciones × 3 tamaños, y la ficha abierta.
// Uso (con el servidor de desarrollo en marcha): node scripts/combat-mockups.cjs [url base]
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:5173';
const SIZES = { escritorio: [1920, 1080], tableta: [1180, 820], movil: [844, 390] };
(async () => {
  const b = await chromium.launch();
  const out = __dirname + '/../mockups/combate/capturas';
  require('fs').mkdirSync(out, { recursive: true });
  let bad = 0;
  for (const layout of ['A', 'B', 'C']) for (const [size, [w, h]] of Object.entries(SIZES)) for (const tip of ['0', '1']) {
    if (tip === '1' && size === 'tableta') continue;
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto(`${BASE}/mockups/combate/barra.html?layout=${layout}&size=${size}&tip=${tip}`);
    await p.waitForSelector('body[data-ready]');
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(250);
    // Comprobación: botones de 44 px o más y nada fuera de la pantalla
    const r = await p.evaluate(() => {
      const cmds = [...document.querySelectorAll('.cmd')].map((e) => e.getBoundingClientRect());
      return { small: cmds.filter((c) => c.height < 44 || c.width < 44).length, out: cmds.filter((c) => c.right > innerWidth + 1 || c.bottom > innerHeight + 1).length, n: cmds.length, minH: Math.round(Math.min(...cmds.map((c) => c.height))), minW: Math.round(Math.min(...cmds.map((c) => c.width))) };
    });
    if (r.small || r.out) bad++;
    console.log(layout, size, tip === '1' ? 'ficha' : '', JSON.stringify(r));
    await p.screenshot({ path: `${out}/${layout}-${size}${tip === '1' ? '-ficha' : ''}.png` });
    await p.close();
  }
  await b.close();
  console.log(bad ? `FALLOS: ${bad}` : 'Todo bien');
})();
