// Prueba de extremo a extremo del criterio de éxito de la primera entrega.
// Uso: node scripts/e2e.cjs http://localhost:5173/play/ [carpeta_capturas]
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:5173/play/';
const OUT = process.argv[3] || 'e2e-shots';
const fs = require('fs');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });
  const st = () => page.evaluate(() => {
    const s = window.__DREADBOUND__.getState();
    return { screen: s.screen, combat: !!s.combat, outcome: s.combat?.state.outcome ?? null, modal: s.modal?.type ?? null,
      hp: s.expedition?.hp, backpack: (s.expedition?.backpack ?? s.profile?.backpack ?? []).filter(Boolean).map((x) => x.itemId + 'x' + x.qty), gold: s.profile?.gold };
  });
  const step = async (name, fn) => { process.stdout.write(`· ${name}… `); await fn(); console.log('ok'); };
  const tp = (x, y) => page.evaluate(([x, y]) => window.__DREADBOUND__.scene().debugTeleport(x, y), [x, y]);

  await page.goto(BASE + '?debug');
  await page.waitForSelector('[data-testid=btn-play]');
  await shot('01-title');
  await step('Crear personaje', async () => {
    await page.click('[data-testid=btn-play]');
    await page.fill('[data-testid=name-input]', 'Aldric');
    await page.click('[data-testid=class-warrior]');
    await shot('02-create');
    await page.click('[data-testid=btn-create]');
    await page.click('[data-testid=btn-tutorial-ok]');
  });
  let goldBefore;
  await step('Comprar una poción', async () => {
    goldBefore = (await st()).gold;
    await page.click('[data-testid=tab-merchant]');
    await page.click('[data-testid=buy-health_potion]');
    const s = await st();
    if (s.gold !== goldBefore - 20) throw new Error('el oro no bajó: ' + s.gold);
    await shot('03-merchant');
  });
  await step('Equipo e inventario', async () => {
    await page.click('[data-testid=tab-gear]');
    await page.waitForSelector('[data-testid=slot-equip-mainHand][data-item=rusty_sword]');
    await page.hover('[data-testid=slot-equip-mainHand]');
    await page.waitForTimeout(200);
    await shot('04-gear');
  });
  await step('Entrar en la mazmorra', async () => {
    await page.click('[data-testid=tab-expedition]');
    await shot('05-expedition');
    await page.click('[data-testid=btn-enter-dungeon]');
    await page.waitForSelector('[data-testid=btn-dungeon-tutorial-ok]');
    await page.click('[data-testid=btn-dungeon-tutorial-ok]');
    await page.waitForTimeout(800);
    await shot('06-dungeon-start');
  });
  await step('Caminar con el teclado', async () => {
    const before = await page.evaluate(() => { const p = window.__DREADBOUND__.scene().player; return [p.x, p.y]; });
    await page.keyboard.down('d'); await page.waitForTimeout(700); await page.keyboard.up('d');
    const after = await page.evaluate(() => { const p = window.__DREADBOUND__.scene().player; return [p.x, p.y]; });
    if (Math.hypot(after[0] - before[0], after[1] - before[1]) < 0.3) throw new Error('no se movió ' + before + ' → ' + after);
    await page.keyboard.down('w'); await page.waitForTimeout(2500); await page.keyboard.up('w');
    const blocked = await page.evaluate(() => { const p = window.__DREADBOUND__.scene().player; return [p.x, p.y]; });
    if (blocked[0] < 1 || blocked[1] < 1) throw new Error('atravesó un muro: ' + blocked);
  });
  await step('Encontrar un enemigo y combatir', async () => {
    const pos = await page.evaluate(() => { const e = window.__DREADBOUND__.scene().enemies.find((x) => x.id === 'e_skel1'); return [e.x, e.y]; });
    await tp(Math.floor(pos[0]), Math.floor(pos[1]) - 1);
    await page.waitForSelector('[data-testid=combat]', { timeout: 8000 });
    await page.waitForTimeout(500);
    await shot('07-combat');
    for (let i = 0; i < 60; i++) {
      const s = await st();
      if (s.outcome) break;
      const myTurn = await page.$('[data-testid=act-attack]');
      if (myTurn) {
        if (s.hp < 40 && (await page.$('[data-testid=act-item]:not([disabled])'))) { await page.keyboard.press('5'); await page.click('[data-testid=use-health_potion]'); }
        else if (i === 1) await page.click('[data-testid=act-skill-0]');
        else await page.keyboard.press('1');
        if (i === 1) { await page.waitForTimeout(250); await shot('08-combat-skill'); }
      }
      await page.waitForTimeout(450);
    }
    const s = await st();
    await shot('09-combat-result');
    if (s.outcome !== 'victory') throw new Error('resultado: ' + s.outcome);
    await page.click('[data-testid=btn-combat-continue]');
  });
  await step('Abrir un cofre y coger el botín', async () => {
    await tp(18, 17);
    await page.waitForTimeout(400);
    await shot('10-near-chest');
    await page.keyboard.press('e');
    await page.waitForSelector('[data-testid=loot-modal]');
    await shot('11-chest');
    await page.click('[data-testid=btn-take-all]');
    await page.click('[data-testid=btn-close-loot]');
  });
  const carried = (await st()).backpack;
  console.log('   mochila:', carried.join(', '));
  await step('Hablar con Kael y aliarse', async () => {
    const pos = await page.evaluate(() => { const r = window.__DREADBOUND__.scene().rival; return [r.x, r.y]; });
    await tp(Math.floor(pos[0]) + 1, Math.floor(pos[1]));
    await page.waitForTimeout(300);
    await page.keyboard.press('e');
    await page.waitForSelector('[data-testid=rival-modal]');
    await page.click('[data-testid=rival-talk]');
    await page.click('[data-testid=rival-ally]');
    await shot('12-rival');
    const d = await page.evaluate(() => window.__DREADBOUND__.getState().rival.disposition);
    if (d !== 'allied') throw new Error('Kael no se alió: ' + d);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
    await shot('13-ally');
  });
  await step('Llegar al portal y extraer', async () => {
    await tp(5, 24);
    await page.waitForTimeout(400);
    await shot('14-portal');
    await page.keyboard.press('e');
    await page.waitForTimeout(1500);
    await shot('15-channel');
    await page.waitForSelector('[data-testid=summary]', { timeout: 8000 });
    await page.waitForTimeout(400);
    await shot('16-summary');
    const t = await page.textContent('[data-testid=summary-title]');
    if (!/escapado/i.test(t)) throw new Error('resumen: ' + t);
  });
  await step('El botín aparece en el inventario del lobby', async () => {
    await page.click('[data-testid=btn-back-lobby]');
    await page.click('[data-testid=tab-gear]');
    const lobbyItems = (await st()).backpack;
    console.log('\n   lobby:', lobbyItems.join(', '));
    for (const it of carried) if (!lobbyItems.includes(it)) throw new Error('falta ' + it);
    await shot('17-lobby-after');
  });
  await step('Persistencia tras recargar', async () => {
    await page.reload();
    await page.waitForSelector('[data-testid=btn-play]');
    await page.click('[data-testid=btn-play]');
    await page.click('[data-testid=tab-gear]');
    const again = (await st()).backpack;
    for (const it of carried) if (!again.includes(it)) throw new Error('tras recargar falta ' + it);
  });
  await step('Morir pierde lo transportado', async () => {
    await page.click('[data-testid=tab-expedition]');
    await page.click('[data-testid=btn-enter-dungeon]');
    await page.waitForTimeout(800);
    await page.evaluate(() => window.__DREADBOUND__.actions.trapHit(9999));
    await page.waitForSelector('[data-testid=summary]');
    await shot('18-death');
    await page.click('[data-testid=btn-back-lobby]');
    const s = await st();
    if (s.backpack.length !== 0) throw new Error('tras morir la mochila no está vacía: ' + s.backpack);
    await page.click('[data-testid=tab-gear]');
    await page.waitForSelector('[data-testid=recruit-kit]');
    await shot('19-lobby-after-death');
  });
  console.log('\nErrores de consola:', errors.length ? errors : 'ninguno');
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})().catch(async (e) => { console.error('\nFALLO:', e.message); process.exit(2); });
