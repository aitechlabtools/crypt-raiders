// Maquetas del manejo de objetos (Alijo y venta): capturas del juego real con la propuesta dibujada encima.
// Uso: node mockups/inventario/capturar.cjs [url del juego] [carpeta]
const { chromium } = require('playwright');
const URL = process.argv[2] || 'http://localhost:5173/play/';
const OUT = process.argv[3] || 'mockups/inventario/capturas';
const SIZES = [['escritorio', { width: 1920, height: 1080 }, false, 1], ['tableta', { width: 1180, height: 820 }, true, 1], ['movil', { width: 844, height: 390 }, true, 2]];
const LOOT = [['chain_axe', 'epic', ['vampire', 'bleeding']], ['knight_sword', 'rare', ['frost']], ['war_mace', 'common'], ['silver_helm', 'rare', ['hermit']],
  ['grave_boots', 'uncommon', ['swift']], ['iron_shield', 'common'], ['health_potion', null, null, 4], ['iron_ore', null, null, 6], ['bone_dust', null, null, 5], ['bat_wing', null, null, 3]];

const CSS = `
  @keyframes selpulse { 0%,100% { box-shadow: 0 0 0 3px #07060a, 0 0 0 6px #fff4c2, 0 0 14px 4px #e8b33a99 } 50% { box-shadow: 0 0 0 3px #07060a, 0 0 0 6px #fff4c2, 0 0 22px 8px #e8b33acc } }
  .mk-sel { position: relative; z-index: 5; animation: selpulse 1.1s steps(4) infinite; }
  .mk-sel::after { content: '▼'; position: absolute; top: -20px; left: 50%; transform: translateX(-50%); color: #fff4c2; font-size: 12px; text-shadow: 0 1px 0 #000; }
  .mk-ok { outline: 3px dashed #5fd19a !important; outline-offset: -3px; background: #5fd19a22 !important; position: relative; }
  .mk-ok::before { content: '✓'; position: absolute; right: 2px; top: 0; color: #5fd19a; font: 700 12px system-ui; }
  .mk-dim { opacity: .35; filter: grayscale(.6); }
  .mk-bar { position: fixed; z-index: 60; display: flex; gap: 6px; padding: 6px; background: #0d0c11f2; border: 2px solid #6b4a12; box-shadow: 0 0 0 1px #07060a, 0 10px 30px #000a; }
  .mk-bar button { min-height: 44px; padding: 0 12px; font-family: var(--font-display); font-size: 14px; letter-spacing: .04em; color: var(--color-bone); background: #15131a; border: 1px solid #3a3741; white-space: nowrap }
  .mk-bar button.gold { background: linear-gradient(#e8b33a,#9a6b1a); color: #1a1205; border-color: #07060a }
  .mk-bar button.red { color: #ff8a7a; border-color: #5a2020 }
  .mk-ghost { position: fixed; z-index: 70; pointer-events: none; transform: translate(-50%,-50%) rotate(-6deg); filter: drop-shadow(0 8px 8px #000c); opacity: .95 }
  .mk-help { position: fixed; z-index: 60; padding: 6px 12px; background: #0d0c11e6; border: 1px solid #3a3741; color: #a9a3b3; font: 13px var(--font-body); }
  .mk-help b { color: #e9e1cc; font-weight: 600 }
  .mk-toast { position: fixed; z-index: 70; padding: 8px 14px; background: #2a1414f2; border: 2px solid #c4283b; color: #ffd6d0; font: 15px var(--font-body); }
  .mk-coin { position: absolute; right: -6px; top: -6px; width: 20px; height: 20px; border-radius: 50%; background: radial-gradient(#ffe08a,#c48f22); border: 2px solid #07060a; z-index: 6 }
  .mk-sale { position: fixed; z-index: 60; background: #0d0c11f5; border: 2px solid #e8b33a; box-shadow: 0 0 0 1px #07060a, 0 12px 40px #000c; padding: 12px; font-family: var(--font-body); color: #d6d1c4 }
  .mk-sale h3 { font-family: var(--font-display); color: #e8b33a; letter-spacing: .2em; text-transform: uppercase; font-size: 13px; margin-bottom: 8px }
  .mk-sale .row { display: flex; justify-content: space-between; gap: 12px; font-size: 15px; padding: 2px 0 }
  .mk-sale .tot { border-top: 1px solid #3a3741; margin-top: 6px; padding-top: 6px; font-size: 17px; color: #fff4c2 }
  .mk-sale .chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0 }
  .mk-sale .chips button { min-height: 36px; padding: 0 10px; font-size: 13px; background: #15131a; border: 1px solid #3a3741; color: #d6d1c4 }
  .mk-sale .go { width: 100%; min-height: 48px; margin-top: 8px; font-family: var(--font-display); font-weight: 700; letter-spacing: .06em; background: linear-gradient(#e8b33a,#9a6b1a); color: #1a1205; border: 2px solid #07060a }
  .mk-sale .warn { color: #ff8a7a; font-size: 13px; margin-top: 4px }
`;

(async () => {
  const b = await chromium.launch();
  for (const [n, vp, touch, dsf] of SIZES) {
    const phone = n === 'movil';
    const ctx = await b.newContext({ viewport: vp, hasTouch: touch, isMobile: phone, deviceScaleFactor: dsf });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    const act = async (id) => { const s = `[data-testid=${id}]`; await p.waitForSelector(s, { timeout: 6000 }); touch ? await p.tap(s) : await p.click(s); await p.waitForTimeout(300); };
    await p.goto(URL + '?debug&noclass'); await p.evaluate(() => indexedDB.deleteDatabase('cryptraiders')); await p.reload(); await p.waitForTimeout(700);
    await act('btn-play'); await p.evaluate(() => document.fullscreenElement && document.exitFullscreen());
    await p.fill('[data-testid=name-input]', 'Beohtord'); await act('btn-create'); await act('btn-tutorial-ok');
    await p.evaluate((LOOT) => { const G = window.__CRYPTRAIDERS__; const pr = G.getState().profile; const bp = [...pr.backpack];
      LOOT.forEach(([id, rarity, affixes, qty], i) => { bp[i] = { uid: 'bp' + i, itemId: id, qty: qty ?? 1, ...(rarity ? { rarity } : {}), ...(affixes ? { affixes } : {}) }; });
      G.setState({ profile: { ...pr, backpack: bp, character: { ...pr.character, level: 14 }, tutorialSeen: { ...pr.tutorialSeen, lobby: true, stash: true, vendors: true } } }); }, LOOT);
    await p.addStyleTag({ content: CSS });
    await act('tab-stash'); await p.waitForTimeout(500);
    if (phone) { await p.screenshot({ path: `${OUT}/${n}-0-actual.png` }); }
    // ── 1. Objeto seleccionado: contorno, ficha y barra de acciones ──
    const slots = await p.$$('[data-testid=alijo-backpack] .slot');
    const target = slots[1];
    touch ? await target.tap() : await target.click(); await p.waitForTimeout(300);
    if (!touch) { await p.mouse.move(5, 600); await p.waitForTimeout(300); }
    if (!phone) await p.screenshot({ path: `${OUT}/${n}-0-actual.png` });
    await p.evaluate((phone) => {
      const s = document.querySelector('[data-testid=alijo-backpack] .slot.selected'); if (!s) return;
      s.classList.add('mk-sel');
      const r = s.getBoundingClientRect();
      const bar = document.createElement('div'); bar.className = 'mk-bar mk-x';
      bar.innerHTML = '<button class="gold">⚔ Equipar</button><button>⇄ Al almacén</button><button>◈ Al bolsillo</button><button class="red">✕ Soltar</button>';
      document.body.appendChild(bar);
      const bw = bar.getBoundingClientRect().width;
      bar.style.left = Math.max(8, Math.min(innerWidth - bw - 8, r.left + r.width / 2 - bw / 2)) + 'px';
      bar.style.top = (r.top - 64) + 'px';
      if (!phone) { const h = document.createElement('div'); h.className = 'mk-help mk-x'; h.style.left = '50%'; h.style.transform = 'translateX(-50%)'; h.style.bottom = '8px';
        h.innerHTML = '<b>Clic</b> elegir · <b>Arrastrar</b> mover · <b>Doble clic</b> equipar o guardar · <b>Mayús+clic</b> mochila ⇄ almacén · <b>Clic derecho</b> acciones'; document.body.appendChild(h); }
    }, phone);
    await p.waitForTimeout(200);
    await p.screenshot({ path: `${OUT}/${n}-1-seleccion.png` });
    // ── 2. Arrastre: destinos válidos en verde, el resto apagado, icono siguiendo al dedo ──
    await p.evaluate((phone) => {
      document.querySelectorAll('.mk-x').forEach((e) => e.remove());
      const sel = document.querySelector('.mk-sel'); const icon = sel?.querySelector('img');
      // Ranura del arma: la casilla grande de equipo cuyo rótulo es «Arma»
      window.__main = [...document.querySelectorAll('.slot.slot-big')][0];
      const r = sel.getBoundingClientRect();
      sel.classList.remove('mk-sel'); sel.style.opacity = '.3';
      document.querySelectorAll('.slot').forEach((s) => { if (s === sel) return; const empty = !s.querySelector('img:not(.opacity-15)');
        const inGrid = !!s.closest('[data-testid=alijo-backpack], [data-testid=alijo-storage]');
        const isMain = !inGrid && !s.closest('[data-testid=alijo-pocket]') && s === window.__main;
        if (isMain || (inGrid && empty)) s.classList.add('mk-ok'); else s.classList.add('mk-dim'); });
      const main = window.__main;
      const mr = main ? main.getBoundingClientRect() : r;
      const g = icon.cloneNode(); g.className = 'mk-ghost pixelated'; g.style.width = '56px'; g.style.height = '56px';
      g.style.left = (mr.left + mr.width / 2 + (phone ? 10 : 30)) + 'px'; g.style.top = (mr.top + mr.height / 2 - (phone ? 46 : 10)) + 'px'; document.body.appendChild(g); g.classList.add('mk-x');
      if (phone) { const d = document.createElement('div'); d.className = 'mk-x'; d.style.cssText = `position:fixed;z-index:69;width:34px;height:34px;border-radius:50%;background:#ffffff33;border:2px solid #fff8;left:${mr.left + mr.width / 2 - 7}px;top:${mr.top + mr.height / 2 - 7}px`; document.body.appendChild(d); }
      const t = document.createElement('div'); t.className = 'mk-help mk-x'; t.style.left = '50%'; t.style.transform = 'translateX(-50%)'; t.style.top = (phone ? 6 : 70) + 'px';
      t.innerHTML = 'Suelta en una casilla <b style="color:#5fd19a">✓ verde</b>. Sobre el arma que llevas, la cambia.'; document.body.appendChild(t);
    }, phone);
    await p.waitForTimeout(200);
    await p.screenshot({ path: `${OUT}/${n}-2-arrastre.png` });
    // ── 2b. Destino no válido: aviso breve ──
    await p.evaluate(() => { document.querySelectorAll('.mk-help').forEach((e) => e.remove());
      const pk = document.querySelector('[data-testid=alijo-pocket]'); const r = pk ? pk.getBoundingClientRect() : { left: 300, top: 300 };
      const t = document.createElement('div'); t.className = 'mk-toast mk-x'; t.style.left = r.left + 'px'; t.style.top = (r.top - 44) + 'px';
      t.textContent = 'En el bolsillo seguro solo caben objetos pequeños.'; document.body.appendChild(t); });
    await p.screenshot({ path: `${OUT}/${n}-3-no-valido.png` });
    // ── 3. Venta: modo Vender con varios marcados y el total ──
    await p.evaluate(() => { document.querySelectorAll('.mk-x').forEach((e) => e.remove()); document.querySelectorAll('.mk-ok,.mk-dim').forEach((e) => e.classList.remove('mk-ok', 'mk-dim')); document.querySelectorAll('.slot').forEach((s) => (s.style.opacity = '')); });
    await act('tab-merchants'); await act('vendor-orvel'); await p.waitForTimeout(300);
    const sellBtn = await p.$('[data-testid=vendor-view-sell]'); if (sellBtn) { touch ? await sellBtn.tap() : await sellBtn.click(); await p.waitForTimeout(400); }
    await p.evaluate((phone) => {
      const slots = [...document.querySelectorAll('[data-testid=sell-grids] .slot')].filter((s) => s.querySelector('img:not(.opacity-15)'));
      [2, 5, 7, 8].forEach((i) => { const s = slots[i]; if (!s) return; s.classList.add('mk-sel'); s.style.animation = 'none'; s.style.boxShadow = '0 0 0 3px #07060a, 0 0 0 6px #fff4c2'; const c = document.createElement('span'); c.className = 'mk-coin'; s.appendChild(c); });
      const z = document.createElement('div'); z.className = 'mk-sale mk-x';
      z.innerHTML = `<h3>◆ A vender</h3>
        <div class="row"><span>Maza de guerra</span><span>9</span></div>
        <div class="row"><span>Escudo de hierro</span><span>14</span></div>
        <div class="row"><span>Mena de hierro ×6</span><span>18</span></div>
        <div class="row"><span>Polvo de hueso ×5</span><span>10</span></div>
        <div class="row tot"><span>Total</span><span>51 oro</span></div>
        <div class="chips"><button>Marcar lo común</button><button>Marcar materiales</button><button>Quitar marcas</button></div>
        <button class="go">Vender 4 objetos · 51 oro</button>
        <div class="row" style="font-size:13px;color:#8c8693;margin-top:6px"><span>Recomprar lo último vendido</span><span>↺</span></div>`;
      z.style.width = phone ? '280px' : '330px'; z.style.right = '12px'; z.style.top = phone ? '58px' : '90px'; if (phone) { z.style.maxHeight = '320px'; z.style.overflow = 'hidden'; z.style.fontSize = '13px'; }
      document.body.appendChild(z);
      const m = document.createElement('div'); m.className = 'mk-help mk-x'; m.style.left = '50%'; m.style.transform = 'translateX(-50%)'; m.style.bottom = '8px';
      m.innerHTML = '<b>Modo Vender:</b> toca los objetos para marcarlos (●) o arrástralos a la zona de venta'; document.body.appendChild(m);
    }, phone);
    await p.waitForTimeout(200);
    await p.screenshot({ path: `${OUT}/${n}-4-venta.png` });
    console.log(n, errs.length ? errs : 'ok');
    await ctx.close();
  }
  await b.close();
})();
