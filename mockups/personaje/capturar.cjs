// Capturas de Personaje (opción A, la aplicada): nivel 3, 22 (hito del nivel 20 por elegir) y 45, en los tres tamaños.
// Las de la carpeta capturas/ son del prototipo con las dos opciones; las de final/, del juego con la opción A.
// Uso: node mockups/personaje/capturar.cjs [url del juego] [carpeta]
const { chromium } = require('playwright');
const URL = process.argv[2] || 'http://localhost:5173/play/';
const OUT = process.argv[3] || 'mockups/personaje/final';
const SIZES = [['escritorio', { width: 1920, height: 1080 }, false, 1], ['tableta', { width: 1180, height: 820 }, true, 1], ['movil', { width: 844, height: 390 }, true, 2]];
const LV = {
  3: { level: 3, cs: { unlocked: ['war_cry'], equipped: 'war_cry' }, eq: {} },
  22: { level: 22, cs: { unlocked: ['war_cry'], equipped: 'war_cry' }, eq: { mainHand: 'knight_sword', offHand: 'iron_shield' } },
  45: { level: 45, cs: { unlocked: ['war_cry', 'bloodthirst', 'hold_line'], equipped: 'hold_line' }, eq: { mainHand: 'knight_sword', offHand: 'iron_shield' } },
};
(async () => {
  const b = await chromium.launch();
  for (const [n, vp, touch, dsf] of SIZES) for (const opt of ['a']) {
    for (const lv of [3, 22, 45]) {
      
      const ctx = await b.newContext({ viewport: vp, hasTouch: touch, isMobile: n === 'movil', deviceScaleFactor: dsf });
      const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
      const act = async (id) => { const s = `[data-testid=${id}]`; await p.waitForSelector(s, { timeout: 6000 }); touch ? await p.tap(s) : await p.click(s); await p.waitForTimeout(250); };
      await p.goto(URL + '?debug&noclass' + '');
      await p.evaluate(() => indexedDB.deleteDatabase('cryptraiders')); await p.reload(); await p.waitForTimeout(700);
      await act('btn-play'); await p.evaluate(() => document.fullscreenElement && document.exitFullscreen());
      await p.fill('[data-testid=name-input]', 'Beohtord'); await act('btn-create'); await act('btn-tutorial-ok');
      await p.evaluate((d) => { const G = window.__CRYPTRAIDERS__; const pr = G.getState().profile; const eq = { ...pr.equipment };
        for (const [s, id] of Object.entries(d.eq)) eq[s] = { uid: 'x' + id, itemId: id, qty: 1 };
        G.setState({ profile: { ...pr, character: { ...pr.character, level: d.level, xp: 0 }, equipment: eq, classSkills: d.cs, tutorialSeen: { ...pr.tutorialSeen, lobby: true } } }); }, LV[lv]);
      await act('tab-character'); await p.waitForTimeout(500);
      const tag = `${n}-nv${lv}`;
      if (n === 'movil') {
        await p.screenshot({ path: `${OUT}/${tag}-1-atributos.png` });
        await act('seg-atk'); await p.screenshot({ path: `${OUT}/${tag}-2-ataques.png` });
        await act('seg-class'); await p.screenshot({ path: `${OUT}/${tag}-3-habilidad.png` });
      } else {
        await p.screenshot({ path: `${OUT}/${tag}-1-ataques.png` });
        await act('seg-class'); await p.screenshot({ path: `${OUT}/${tag}-2-habilidad.png` });
      }
      console.log(tag, errs.length ? errs : 'ok');
      await ctx.close();
    }
  }
  await b.close();
})();
