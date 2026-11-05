// Prueba del tutorial de la primera expedición: recorre los 11 pasos, comprueba que caer no hace perder nada,
// que Osric traiciona y se le vence, y que al extraer llegan las recompensas. También «Repetir el tutorial».
// Uso: node scripts/e2e-tutorial.cjs [url] [carpeta] [dispositivo de Playwright]
const { chromium, devices } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:5173/play/';
const OUT = process.argv[3] || '/tmp/claude-0/tutorial';
const DEVICE = process.argv[4];
(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const ctx = DEVICE ? await b.newContext({ ...devices[DEVICE] }) : await b.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  const touch = !!DEVICE;
  const tap = async (sel) => { await page.waitForSelector(sel, { timeout: 8000 }); if (touch) await page.tap(sel); else await page.click(sel); await page.waitForTimeout(150); };
  const G = (fn, a) => page.evaluate(fn, a);
  const ok = (c, msg) => { if (!c) throw new Error(msg); console.log('✓', msg); };
  const step = () => G(() => window.__CRYPTRAIDERS__.getState().tutorial?.step ?? -1);
  const IDS = ['move', 'fight', 'gold', 'box', 'rich', 'equip', 'pocket', 'potion', 'talk', 'ally', 'together', 'betrayal', 'extract'];
  const stepId = async () => IDS[await step()] ?? null;
  const waitStep = async (id, ms = 6000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if ((await stepId()) === id) return true; await page.waitForTimeout(150); } return false; };
  const tp = (x, y) => G(([x, y]) => window.__CRYPTRAIDERS__.scene().debugTeleport(x, y), [x, y]);
  const fight = async () => {
    for (let i = 0; i < 80; i++) {
      const s = await G(() => { const c = window.__CRYPTRAIDERS__.getState().combat; return c ? c.state.outcome ?? 'on' : null; });
      if (s === null) break;
      if (s !== 'on') {
        await tap('[data-testid=btn-combat-continue]');
        // Oro físico: tras ganar se abre el saco del botín; se coge todo y se cierra
        await page.waitForTimeout(300);
        if (await page.$('[data-testid=loot-modal]')) { await tap('[data-testid=btn-take-all]'); await tap('[data-testid=btn-close-loot]'); }
        break;
      }
      if (await page.$('[data-testid=act-attack]:not([disabled])')) await tap('[data-testid=act-attack]:not([disabled])');
      await page.waitForTimeout(250);
    }
  };
  const use = async () => { if (touch) await tap('[data-testid=touch-action]'); else await page.keyboard.press('e'); await page.waitForTimeout(300); };

  await page.goto(BASE + '?debug&tutorial');
  await G(() => indexedDB.deleteDatabase('cryptraiders'));
  await G(() => { try { localStorage.removeItem('cryptraiders.tutorialDone'); } catch {} });
  await page.reload();
  await tap('[data-testid=btn-play]');
  await G(() => document.fullscreenElement && document.exitFullscreen());
  ok(!(await page.$('[data-testid=skip-tutorial]')), 'la primera vez no se puede saltar el tutorial');
  await page.fill('[data-testid=name-input]', 'Novata');
  await tap('[data-testid=btn-create]');
  await tap('[data-testid=btn-tutorial-ok]');
  await tap('[data-testid=btn-enter-dungeon]');
  await page.waitForSelector('[data-testid=tutorial-guide]');
  ok((await G(() => window.__CRYPTRAIDERS__.getState().dungeon.id)) === 'tutorial', 'la primera expedición es el tutorial (mapa a mano en las Afueras)');
  ok((await G(() => window.__CRYPTRAIDERS__.getState().rival.who)) === 'osric', 'el mercenario del tutorial es Osric, no Kael');
  const txt = await page.textContent('[data-testid=tutorial-text]');
  ok(touch ? /toca|joystick/i.test(txt) : /WASD|clic/i.test(txt), `las indicaciones se adaptan al dispositivo (${touch ? 'toca' : 'teclado y ratón'})`);
  ok((await page.textContent('[data-testid=hud-timer]')).includes('Tutorial'), 'en el tutorial no corre el reloj');
  await page.screenshot({ path: `${OUT}/01-moverse.png` });

  // 1 · Moverse
  const r = (i) => [1 + i * 9 + 2, 4];
  await tp(...r(1)); ok(await waitStep('fight'), 'paso 1: moverse');
  // 2 · Combate fácil
  await page.screenshot({ path: `${OUT}/02-rata.png` });
  await tp(1 + 9 + 2, 4);
  await page.waitForSelector('[data-testid=combat]', { timeout: 8000 });
  await fight();
  ok(await waitStep('box'), 'paso 2: vence a la rata');
  // 3 · Baúl con la llave
  await tp(1 + 18 + 1, 4); await use();
  await page.waitForSelector('[data-testid=loot-modal]');
  await tap('[data-testid=btn-take-all]'); await tap('[data-testid=btn-close-loot]');
  ok(await waitStep('rich'), 'paso 3: el baúl da la llave');
  // 4 · Cofre con llave
  await tp(1 + 18 + 4, 4); await use();
  if (await page.waitForSelector('[data-testid=btn-unlock]', { timeout: 1500 }).catch(() => null)) await tap('[data-testid=btn-unlock]');
  await page.waitForSelector('[data-testid=loot-modal]');
  await tap('[data-testid=btn-take-all]'); await tap('[data-testid=btn-close-loot]');
  ok(await waitStep('equip'), 'paso 4: abre el cofre de hierro con la llave');
  ok(await G(() => document.querySelector('[data-testid=btn-inventory]').classList.contains('tut-pulse')), 'el botón de inventario se resalta');
  await page.screenshot({ path: `${OUT}/04-equipar.png` });
  // 5 · Equiparse la capucha
  await G(() => { const d = window.__CRYPTRAIDERS__; const i = d.getState().expedition.backpack.findIndex((x) => x?.itemId === 'leather_hood'); d.actions.quickEquip({ kind: 'grid', container: 'backpack', index: i }); });
  ok(await waitStep('pocket'), 'paso 5: equiparse la capucha');
  // 5b · Oro físico: monedas al saquito y saquito al bolsillo seguro
  await G(() => { const d = window.__CRYPTRAIDERS__; const bp = d.getState().expedition.backpack;
    const c = bp.findIndex((x) => x?.itemId === 'gold_coins'); const pch = bp.findIndex((x) => x?.itemId === 'gold_pouch');
    d.actions.transfer({ kind: 'grid', container: 'backpack', index: c }, { kind: 'grid', container: 'backpack', index: pch });
    const i = d.getState().expedition.backpack.findIndex((x) => x?.itemId === 'gold_pouch'); d.actions.quickMove({ kind: 'grid', container: 'backpack', index: i }, 'pocket'); });
  ok(await waitStep('potion'), 'paso 5b: monedas al saquito y saquito al bolsillo seguro');
  // 6 · Poción tras la trampa
  await tp(1 + 27 + 3, 4);
  await page.waitForTimeout(800);
  const hurt = await G(() => window.__CRYPTRAIDERS__.getState().expedition.hp);
  if (touch) await tap('[data-testid=touch-potion]'); else await page.keyboard.press('q');
  await page.waitForTimeout(400);
  ok((await G(() => window.__CRYPTRAIDERS__.getState().expedition.hp)) > hurt, 'paso 6: la trampa hiere y la poción cura');
  ok(await waitStep('talk'), 'pasa a hablar con el mercenario');
  // 7 · Hablar con Osric y 8 · aliarse
  const os = await G(() => { const r = window.__CRYPTRAIDERS__.scene().rival; return [Math.floor(r.x), Math.floor(r.y)]; });
  await tp(os[0] - 1, os[1]); await use();
  await page.waitForSelector('[data-testid=rival-modal]');
  ok(await waitStep('ally'), 'paso 7: hablar con Osric');
  ok(await G(() => document.querySelector('[data-testid=rival-ally]').classList.contains('tut-pulse')), 'el botón Aliarse se resalta');
  await page.screenshot({ path: `${OUT}/07-osric.png` });
  await tap('[data-testid=rival-ally]');
  await page.keyboard.press('Escape').catch(() => {});
  await G(() => window.__CRYPTRAIDERS__.actions.closeModal());
  ok(await waitStep('together'), 'paso 8: aliarse');
  // 9 · Dos bandidos con Osric
  for (const id of ['t_band1', 't_band2']) {
    await G((id) => { const d = window.__CRYPTRAIDERS__; const e = d.getState().dungeon.entities.find((x) => x.id === id); d.actions.startCombat('pve', id, e.enemyId); }, id);
    await page.waitForSelector('[data-testid=combat]');
    ok(await G(() => window.__CRYPTRAIDERS__.getState().combat.state.combatants.some((c) => c.id === 'rival' && c.side === 'A')), `Osric lucha a tu lado (${id})`);
    await fight();
    await G((id) => { const sc = window.__CRYPTRAIDERS__.scene(); const e = sc.enemies.find((x) => x.id === id); if (e && !e.dead) { e.dead = true; e.sprite.destroy(); e.shadow.destroy(); } }, id);
  }
  ok(await waitStep('betrayal'), 'paso 9: combatir juntos');
  // Caer no hace perder nada: se fuerza una derrota
  const before = await G(() => JSON.stringify(window.__CRYPTRAIDERS__.getState().expedition.backpack));
  await G(() => window.__CRYPTRAIDERS__.actions.finishExpedition('died'));
  await page.waitForTimeout(500);
  const after = await G(() => { const s = window.__CRYPTRAIDERS__.getState(); return { screen: s.screen, bp: JSON.stringify(s.expedition.backpack), step: s.tutorial?.step }; });
  ok(after.screen === 'dungeon' && after.bp === before, 'si caes en el tutorial, vuelves al último punto seguro sin perder nada');
  // 10 · Traición de Osric en la brecha
  await tp(1 + 54 + 2, 4);
  await page.waitForSelector('[data-testid=combat]', { timeout: 8000 });
  ok((await G(() => window.__CRYPTRAIDERS__.getState().combat.kind)) === 'betrayal-by-rival', 'paso 10: Osric avisa y traiciona');
  await page.screenshot({ path: `${OUT}/10-traicion.png` });
  await fight();
  ok(await waitStep('extract'), 'Osric es fácil de vencer');
  // 11 · Extraer
  await tp(1 + 63 + 2, 4);
  await page.waitForTimeout(400);
  await use();
  await page.waitForSelector('[data-testid=summary]', { timeout: 15000 }).catch(() => {});
  await page.waitForSelector('[data-testid=tutorial-note]', { timeout: 15000 });
  await page.screenshot({ path: `${OUT}/11-resumen.png` });
  const p = await G(() => window.__CRYPTRAIDERS__.getState().profile);
  ok(p.tutorialDone && p.gold >= 10, 'al extraer: tutorial completado, oro y equipo básico');
  ok(p.kael.missStreak === 0, 'el tutorial no cuenta para la aparición de Kael');
  await tap('[data-testid=btn-back-lobby]');

  // Repetir desde Ajustes: sin recompensas ni cambios en el inventario
  const snap = await G(() => JSON.stringify({ g: window.__CRYPTRAIDERS__.getState().profile.gold, bp: window.__CRYPTRAIDERS__.getState().profile.backpack }));
  await G(() => window.__CRYPTRAIDERS__.actions.replayTutorial());
  await page.waitForSelector('[data-testid=tutorial-guide]');
  await G(() => window.__CRYPTRAIDERS__.actions.finishExpedition('extracted'));
  await page.waitForSelector('[data-testid=tutorial-note]');
  const snap2 = await G(() => JSON.stringify({ g: window.__CRYPTRAIDERS__.getState().profile.gold, bp: window.__CRYPTRAIDERS__.getState().profile.backpack }));
  ok(snap === snap2, 'repetir el tutorial no cambia el oro ni el inventario');
  await tap('[data-testid=btn-back-lobby]');
  // Un personaje nuevo en este navegador ya puede saltarlo
  await G(() => window.__CRYPTRAIDERS__.actions.deleteCharacter());
  await page.waitForTimeout(400);
  await tap('[data-testid=btn-play]');
  await G(() => document.fullscreenElement && document.exitFullscreen());
  ok(!!(await page.$('[data-testid=skip-tutorial]')), 'con el tutorial hecho una vez, un personaje nuevo puede saltarlo');
  console.log('errores:', errors.length ? errors : 'ninguno');
  await b.close();
  process.exit(errors.length ? 1 : 0);
})().catch((e) => { console.error('FALLO', e.message); process.exit(1); });
