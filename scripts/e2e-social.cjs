// Prueba de las interacciones sociales y del Mago: traición, duelo, huida y botín de Kael.
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:5173/play/';
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  const S = () => page.evaluate(() => { const s = window.__DREADBOUND__.getState(); return { rival: s.rival.disposition, combat: s.combat?.kind, outcome: s.combat?.state.outcome, screen: s.screen, bags: Object.values(s.bags).map((x) => x.label) }; });
  const fight = async (prefer) => {
    for (let i = 0; i < 80; i++) {
      const s = await S();
      if (s.outcome || !s.combat) break;
      if (prefer && i % 2 && (await page.$('[data-testid=act-skills]'))) {
        await page.click('[data-testid=act-skills]');
        const sk = await page.$(`${prefer}:not([disabled])`);
        if (sk) await sk.click(); else { await page.keyboard.press('Escape'); await page.click('[data-testid=act-attack]'); }
      } else if (await page.$('[data-testid=act-attack]')) await page.click('[data-testid=act-attack]');
      await page.waitForTimeout(350);
    }
  };
  await page.goto(BASE + '?debug');
  await page.evaluate(() => indexedDB.deleteDatabase('dreadbound'));
  await page.reload();
  await page.click('[data-testid=btn-play]');
  if (await page.$('[data-testid=btn-tutorial-ok]')) await page.click('[data-testid=btn-tutorial-ok]');
  if (!(await page.$('[data-testid=name-input]'))) { await page.goto(BASE + '?debug'); }
  await page.fill('[data-testid=name-input]', 'Morgana');
  await page.click('[data-testid=class-mage]');
  await page.click('[data-testid=btn-create]');
  await page.click('[data-testid=btn-tutorial-ok]');
  await page.click('[data-testid=tab-expedition]');
  await page.click('[data-testid=btn-enter-dungeon]');
  await page.click('[data-testid=btn-dungeon-tutorial-ok]');
  const tp = (x, y) => page.evaluate(([x, y]) => window.__DREADBOUND__.scene().debugTeleport(x, y), [x, y]);
  const r = await page.evaluate(() => { const r = window.__DREADBOUND__.scene().rival; return [r.x, r.y]; });
  await tp(Math.floor(r[0]) + 1, Math.floor(r[1]));
  await page.waitForTimeout(300);
  // Duelo
  await page.keyboard.press('e');
  await page.click('[data-testid=rival-talk]');
  await page.click('[data-testid=rival-duel]');
  await page.waitForSelector('[data-testid=combat]');
  await fight('[data-testid=skill-frost_lance]');
  console.log('duelo:', (await S()).outcome);
  await page.click('[data-testid=btn-combat-continue]');
  console.log('tras duelo, Kael:', (await S()).rival, 'pantalla:', (await S()).screen);
  // Alianza y traición del jugador
  await page.waitForTimeout(300);
  await page.keyboard.press('e');
  await page.click('[data-testid=rival-ally]');
  console.log('alianza:', (await S()).rival);
  await page.click('[data-testid=rival-betray]');
  await page.waitForSelector('[data-testid=confirm-betray]');
  await page.click('[data-testid=confirm-betray-yes]');
  await page.waitForSelector('[data-testid=combat]');
  await page.screenshot({ path: '/tmp/claude-0/betray.png' });
  await page.waitForSelector('[data-testid=act-flee]');
  console.log('huir bloqueado en la traición:', await page.$eval('[data-testid=act-flee]', (b) => b.disabled));
  // Pociones si hace falta
  for (let i = 0; i < 80; i++) {
    const s = await S();
    if (s.outcome) break;
    const hp = await page.evaluate(() => window.__DREADBOUND__.getState().expedition.hp);
    if (await page.$('[data-testid=act-attack]')) {
      if (hp < 30 && await page.$('[data-testid=act-item]:not([disabled])')) { await page.click('[data-testid=act-item]'); { const u = await page.$('[data-testid^=use-health]') ?? await page.$('[data-testid^=use-]'); if (u) await u.click(); else await page.keyboard.press('Escape'); } }
      else {
        await page.click('[data-testid=act-skills]');
        const f = await page.$('[data-testid=skill-frost_lance]:not([disabled])') ?? await page.$('[data-testid=skill-spark]:not([disabled])');
        if (f) await f.click(); else { await page.keyboard.press('Escape'); await page.click('[data-testid=act-attack]'); }
      }
    }
    await page.waitForTimeout(350);
  }
  const res = await S();
  console.log('traición:', res.outcome);
  await page.click('[data-testid=btn-combat-continue]');
  await page.waitForTimeout(500);
  console.log('estado tras traición:', JSON.stringify(await S()));
  if (res.outcome === 'victory') {
    await page.keyboard.press('e');
    await page.waitForSelector('[data-testid=loot-modal]');
    const loot = await page.$$eval('[data-testid^=slot-loot-]', (els) => els.map((e) => e.getAttribute('data-item')).filter(Boolean));
    console.log('bolsa de Kael:', loot.join(', '));
    await page.click('[data-testid=btn-take-all]');
    await page.click('[data-testid=btn-close-loot]');
    console.log('saqueo de Kael ok');
  }
  // Huida de un murciélago
  if ((await S()).screen === 'dungeon') {
    await page.evaluate(() => window.__DREADBOUND__.actions.startCombat('pve', 'e_bat1', 'bat'));
    for (let i = 0; i < 20; i++) {
      const s = await S();
      if (s.outcome) break;
      if (await page.$('[data-testid=act-flee]')) await page.click('[data-testid=act-flee]');
      await page.waitForTimeout(400);
    }
    console.log('huida:', (await S()).outcome);
    await page.click('[data-testid=btn-combat-continue]');
    console.log('pantalla final:', (await S()).screen);
  }
  console.log('Errores de consola:', errors.length ? errors : 'ninguno');
  await b.close();
  process.exit(errors.length ? 1 : 0);
})().catch((e) => { console.error('FALLO', e.message); process.exit(2); });
