// ════════════════════════════════════════════════════════════════════
// MAQUETAS de la nueva estructura de menús (no es el juego).
// Cada opción es la misma página con otra clase en <body>: opcion-a.html, opcion-b.html, opcion-c.html.
// Pantalla: #jugar o ?s=jugar | clase | alijo | mercaderes | mercader | personaje (las demás pestañas muestran un aviso).
// ════════════════════════════════════════════════════════════════════
(() => {
  const REAL = document.body.dataset.opt; // a | b | c | d
  // La opción D (mi propuesta) parte de la A: rail lateral de la B en móvil y alijo con segmentos.
  const OPT = REAL === 'd' ? 'a' : REAL;
  const RAWS = location.hash.slice(1) || new URLSearchParams(location.search).get('s') || 'jugar';
  const S = RAWS === 'alijo-almacen' ? 'alijo' : RAWS;
  const ALIJO_VIEW = RAWS === 'alijo-almacen' ? 1 : 0;
  addEventListener('hashchange', () => location.reload());
  const A = (k) => `assets/${k}.png`;
  const I = window.ITEMS;
  const RAR = { common: ['Común', '#b8b2a6'], uncommon: ['Poco común', '#5fbf4a'], rare: ['Rara', '#4a8fe0'], epic: ['Épica', '#a35ae0'], legendary: ['Legendaria', '#e8913a'] };
  const STATN = { maxHp: 'Vida', maxMp: 'Aguante', atk: 'Ataque', def: 'Defensa', mag: 'Poder mágico', res: 'Resist. mágica', spd: 'Velocidad', crit: 'Crítico %', eva: 'Evasión %' };

  // ── Ayudas ──
  const img = (k, s, cls = '', extra = '') => `<img class="px ${cls}" src="${A(k)}" data-s="${s}" alt="" draggable="false" ${extra}>`;
  const slot = (id, opts = {}) => {
    const d = id ? I[id] : null;
    const cls = ['slot', opts.big ? 'big' : '', d ? `r-${d.rarity}` : 'empty', opts.sel ? 'sel' : ''].join(' ');
    return `<div class="${cls}" title="${d ? d.name : ''}">${d ? img('item_' + id, opts.big ? 'icon-big' : 'icon') : opts.ghost ? img(opts.ghost, 'icon', 'ghost') : ''}${opts.qty > 1 ? `<span class="qty">${opts.qty}</span>` : ''}${opts.lbl ? `<span class="lbl">${opts.lbl}</span>` : ''}</div>`;
  };
  const gridOf = (list, cols, size) => `<div class="grid" style="grid-template-columns:repeat(${cols},var(--slot))">${Array.from({ length: size }, (_, i) => { const x = list[i]; return x ? slot(x[0], { qty: x[1], sel: x[2] }) : slot(null); }).join('')}</div>`;
  const bar = (v, max, col = 'var(--gold)') => `<div class="bar"><i style="width:${Math.round((v / max) * 100)}%;background:${col}"></i></div>`;
  const goldAmt = (n) => `<span class="gold-amt">${img('icon_coin', 2)}${n.toLocaleString('es-ES')}</span>`;

  // ── Datos de ejemplo (los del juego) ──
  const HERO = { name: 'Aldric', cls: 'Guerrero', lvl: 24, gold: 4860 };
  const EQUIP = { mainHand: 'knight_sword', offHand: 'iron_shield', helmet: 'knight_helm', armor: 'chainmail', gloves: 'gauntlets', boots: 'swift_boots', ring: 'copper_ring', amulet: 'bone_amulet' };
  const BACKPACK = [['health_potion', 4], ['mana_potion', 2], ['antidote', 1], ['miner_pick', 1], ['iron_key', 1], ['iron_ore', 6], ['copper_ore', 4], ['bone_dust', 9], ['old_coin', 3], ['blood_gem', 1], ['golden_chalice', 1]];
  const POCKET = [['relic_key', 1], ['bone_key', 1]];
  const STASH = [['executioner_axe', 1], ['iron_sword', 1], ['bastion_shield', 1], ['wizard_hat', 1], ['padded_tunic', 1], ['leather_hood', 1], ['worn_boots', 1], ['leather_gloves', 1],
    ['ring_of_embers', 1], ['heart_of_umbravel', 1], ['silver_ore', 7], ['blessed_silver', 3], ['ancient_bone', 8], ['bat_wing', 6], ['health_potion', 5], ['steel_pick', 1], ['obsidian_shard', 2], ['gilded_skull', 1]];
  const VENDORS = [
    { id: 'orvel', name: 'Orvel el Quincallero', role: 'Comerciante', color: '#e8b33a', rank: 'De confianza', rep: 412, next: 700, base: 300, disc: 10, ready: 1, services: ['Tienda', 'Misiones', 'Vender'], quote: 'Todo tiene un precio. Hasta lo que traes del fondo.' },
    { id: 'vesper', name: 'Hermana Vesper', role: 'Reliquia de la orden', color: '#bfe0ff', rank: 'Conocido', rep: 180, next: 300, base: 100, disc: 5, ready: 0, services: ['Tienda', 'Misiones'], quote: 'Los muertos no descansan solos. Ayúdame a acostarlos.' },
    { id: 'garra', name: 'Garra Roja', role: 'Capitana de mercenarios', color: '#ff6a5a', rank: 'Aliado', rep: 820, next: 1500, base: 700, disc: 15, ready: 2, services: ['Tienda', 'Misiones', 'Contratos'], quote: 'Mis espadas se alquilan, no se regalan.' },
    { id: 'brand', name: 'Maese Brand', role: 'Herrero de la forja', color: '#ff8a3a', rank: 'De confianza', rep: 455, next: 700, base: 300, disc: 10, ready: 0, services: ['Tienda', 'Misiones', 'Forja'], quote: 'Tráeme metal del fondo y te haré algo que no se rompa.' },
  ];
  const TABS = [
    ['jugar', 'Jugar', 'nav_torch'], ['personaje', 'Personaje', 'icon_helm'], ['alijo', 'Alijo', 'chest_common'], ['mercaderes', 'Mercaderes', 'icon_coin'],
    ['misiones', 'Misiones', 'icon_chalice'], ['bestiario', 'Bestiario', 'nav_skull'], ['vestuario', 'Vestuario', 'icon_tunic'], ['tienda', 'Tienda', 'icon_gem_red'],
  ];
  const NAVS = { chest_common: 1, nav_torch: 1, nav_skull: 2 };
  const activeTab = S === 'mercader' ? 'mercaderes' : S;

  // ── Barra de navegación ──
  function topnav() {
    const tabs = TABS.map(([id, label, ico]) => `<a class="tab ${activeTab === id ? 'on' : ''}" href="#${id}"><span class="ico">${img(ico, NAVS[ico] || 'nav')}</span><span class="tl">${label}</span>${id === 'misiones' ? '<span class="badge nb">3</span>' : ''}</a>`).join('');
    return `<header class="topnav">
      <div class="left m-hide"><div class="chip"><div class="pt">${img('hero_player_0', 2)}</div><div><div class="nm">${HERO.name}</div><div class="muted" style="font-size:12px">${HERO.cls} · Nv ${HERO.lvl}</div><div class="bar" style="width:110px;margin-top:4px;height:5px"><i style="width:62%;background:var(--arcane)"></i></div></div></div></div>
      <nav class="tabs">${tabs}</nav>
      <div class="right">${goldAmt(HERO.gold)}<button class="iconbtn" title="Pantalla completa" aria-label="Pantalla completa">⛶</button><button class="iconbtn" title="Ajustes" aria-label="Ajustes">⚙</button></div>
    </header>`;
  }
  // Opción B en móvil: barra lateral de iconos
  function rail() {
    return `<nav class="rail m-only">${TABS.map(([id, label, ico]) => `<a class="rtab ${activeTab === id ? 'on' : ''}" href="#${id}">${img(ico, NAVS[ico] || 'nav')}<span>${label}</span>${id === 'misiones' ? '<span class="badge">3</span>' : ''}</a>`).join('')}</nav>`;
  }
  const subtabs = (list, on) => `<div class="subtabs">${list.map((t, i) => `<button class="stab ${i === on ? 'on' : ''}">${t}</button>`).join('')}</div>`;
  const seg = (list, on) => `<div class="seg">${list.map((t, i) => `<button class="${i === on ? 'on' : ''}">${t}</button>`).join('')}</div>`;

  // ════════════════ Pantallas ════════════════

  function zoneCard(compact) {
    return `<div class="panel gold zonecard ${compact ? 'compact' : ''}">
      <div class="img">${img('zone_osario', 'zone')}<span class="tag gold" style="position:absolute;left:8px;top:8px;background:#000a">Jefe derrotado ✓</span></div>
      <div class="info"><div><div class="name">La Mazmorra</div><div class="muted" style="font-size:12px">Niveles 1–30 · mapa nuevo cada vez</div></div><button class="btn ghost">Mapa de zonas</button></div>
    </div>`;
  }
  function quickBtns() {
    const q = [['icon_chalice', 'Misiones', 3], ['icon_coin', 'Reputación'], ['nav_skull', 'Bestiario'], ['icon_sword', 'Contrato']];
    return `<div class="quick">${q.map(([ic, l, b]) => `<button class="panel qbtn">${img(ic, 2)}<span>${l}</span>${b ? `<span class="badge">${b}</span>` : ''}</button>`).join('')}</div>`;
  }
  // Escena de Jugar, minimalista: el héroe centrado, un círculo a sus pies y un haz de luz desde arriba.
  const sceneHTML = () => `<div class="scene" id="scene"><div class="spot" id="spot"></div>
    <div class="hero" id="campHero"><div class="nametag"><span class="lv">Nv ${HERO.lvl}</span>${HERO.name}</div>${img('hero_player_0', 'scene', '', 'id="heroImg"')}<div class="pedestal"></div></div></div>`;

  function jugar() {
    if (REAL === 'd') return `<div class="view lobby lobby-d">${sceneHTML()}
      <div class="ld-card">${zoneCard(true)}</div>
      <div class="ld-exp panel gold"><div class="ld-exp-hd disp">Expedición</div><div class="body ld-exp-tx"><span>La Mazmorra · Nv 1–30</span><span class="muted">4 pociones · 1.240 de oro en riesgo · Bram te acompaña</span></div><button class="btn gold cta">Descender</button></div>
      <div class="ld-level"><div class="ring" style="--p:62"><span class="disp">${HERO.lvl}</span></div><span>Nivel</span></div>
      <div class="ld-quick">${quickBtns()}</div></div>`;
    if (OPT === 'a') return `<div class="view lobby">${sceneHTML()}
      <div class="lob-title"><span>Campamento del Bastión</span></div>
      <div class="lob-bl">${zoneCard()}<button class="btn gold cta">Descender</button></div>
      <div class="lob-br">${quickBtns()}</div></div>`;
    if (OPT === 'b') {
      const zones = [['zone_osario', 'La Mazmorra', 'Niveles 1–30', '', true], ['zone_necropolis', 'La Cripta', 'Niveles 30–60', 'Nivel 30 y el Señor del Osario', false], ['zone_infierno', 'El Infierno', 'Niveles 60–100', 'Nivel 60 y la Reina Velada', false]];
      return `<div class="view lobby lobby-b">
        <section class="panel gold lb-left col">
          <div class="ptitle">Expedición</div>
          <div class="zlist">${zones.map(([z, n, l, lock, on], i) => `<button class="zrow ${on ? 'on' : ''} ${lock ? 'locked' : ''}"><div class="zthumb">${img(z, 'zone-sm')}</div><div class="grow" style="text-align:left"><div class="disp">${n}</div><div class="muted" style="font-size:11px">${lock ? '🔒 ' + lock : l}</div></div></button>`).join('')}</div>
          <div class="prep body"><div class="statrow"><span>Vida</span><b>258 / 258</b></div><div class="statrow"><span>Pociones</span><b>4</b></div><div class="statrow"><span>Valor en riesgo</span><b class="gold-t">1.240</b></div><div class="statrow"><span>Mercenario</span><b class="heal-t">Bram · 2 exp.</b></div></div>
          <button class="btn gold cta">Descender</button>
        </section>
        <section class="panel lb-scene">${sceneHTML()}</section>
        <section class="panel lb-right col m-hide">
          <div class="ptitle">Diario</div>
          <div class="journal body">${[['Huesos para el temple', 'Maese Brand', 6, 10], ['Limpieza de nichos', 'Garra Roja', 6, 6], ['Manos a la roca', 'Maese Brand', 3, 4]].map(([q, v, p, c]) => `<div class="jq"><div class="row" style="justify-content:space-between;gap:8px"><span>${q}</span><span class="${p >= c ? 'heal-t' : 'muted'}" style="font-size:13px">${p}/${c}</span></div><div class="muted" style="font-size:12px">${v}</div>${bar(p, c, p >= c ? 'var(--heal)' : 'var(--gold)')}</div>`).join('')}</div>
          <div class="ptitle">Reputación</div>
          <div class="body">${VENDORS.map((v) => `<div class="statrow"><span>${v.name.split(' ')[0] === 'Hermana' ? 'Vesper' : v.name.split(' ')[0] === 'Maese' ? 'Brand' : v.name.split(' ')[0] === 'Garra' ? 'Garra Roja' : 'Orvel'}</span><b class="gold-t">${v.rank}</b></div>`).join('')}</div>
        </section>
        <button class="btn m-only lb-diario">Diario <span class="badge" style="position:static">3</span></button>
      </div>`;
    }
    // C
    const zones = [['zone_osario', 'La Mazmorra', 'Niveles 1–30', '', true], ['zone_necropolis', 'La Cripta', 'Niveles 30–60', 'Nivel 30 + Señor del Osario', false], ['zone_infierno', 'El Infierno', 'Niveles 60–100', 'Nivel 60 + Reina Velada', false]];
    return `<div class="view lobby lobby-c">
      <section class="lc-scene">${sceneHTML()}</section>
      <section class="lc-bottom">
        <div class="lc-zones">${zones.map(([z, n, l, lock, on]) => `<button class="panel zc ${on ? 'gold on' : ''} ${lock ? 'locked' : ''}"><div class="zimg">${img(z, 'zone-sm')}</div><div class="zi"><div class="disp">${n}</div><div class="muted" style="font-size:11px">${lock ? '🔒 ' + lock : l}</div></div></button>`).join('')}</div>
        <div class="panel lc-prep">
          <div class="lc-prep-grid body"><div class="statrow"><span>Vida</span><b>258</b></div><div class="statrow"><span>Pociones</span><b>4</b></div><div class="statrow"><span>En riesgo</span><b class="gold-t">1.240</b></div><div class="statrow"><span>Mercenario</span><b class="heal-t">Bram</b></div></div>
          <div class="row" style="gap:8px">${quickBtns()}</div>
          <button class="btn gold cta">Descender</button>
        </div>
      </section></div>`;
  }

  function clase() {
    const classes = [['warrior', 'Guerrero', true], ['mage', 'Mago', true], ['rogue', 'Pícaro', false], ['cleric', 'Clérigo', false]];
    const sel = 'mage';
    const grid = `<div class="cgrid">${classes.map(([id, n, ok]) => `<button class="cport ${id === sel ? 'on' : ''} ${ok ? '' : 'locked'}"><span class="cn">${n}</span><span class="cimg">${img('portrait_' + id, 'portrait')}</span>${ok ? '' : '<span class="soon">Próximamente</span>'}</button>`).join('')}</div>`;
    const swatch = (cols, on) => `<div class="sw">${cols.map((c, i) => `<button class="swc ${i === on ? 'on' : ''}" style="background:${c}"></button>`).join('')}</div>`;
    const looks = `<div class="looks"><div class="muted lab">Capa</div>${swatch(['#5a1018', '#2f4a6b', '#3a4a2a', '#4a2a5a', '#6b4a12', '#2a2830'], 3)}<div class="muted lab">Piel</div>${swatch(['#e8b896', '#b8825a', '#7a4e32'], 1)}</div>`;
    const info = `<div class="body cinfo">
      <p>Daño elemental devastador a cambio de poca resistencia. Gestiona bien tu maná o caerás.</p>
      <p><span class="gold-t disp" style="font-size:.85em">Arma preferida</span><br>Bastón y grimorio</p>
      <div class="pros"><div>+ Bola de fuego, ventisca y nova oscura</div><div>+ Meditación: recupera maná sin pociones</div><div>+ Quema y congela a sus enemigos</div></div>
      <div class="cons"><div>− Poca vida</div><div>− Poco daño físico</div><div>− Sin maná, está perdido</div></div>
      <div class="muted" style="font-size:.8em;margin-top:8px">Equipo inicial</div><div class="row" style="gap:4px">${slot('ember_staff')}${slot('arcane_tome')}${slot('wizard_hat')}${slot('health_potion', { qty: 2 })}</div>
    </div>`;
    const statsPrev = `<div class="cstats body">${[['Vida', 62], ['Ataque', 30], ['Magia', 92], ['Defensa', 35]].map(([n, v]) => `<div class="row" style="align-items:center;gap:8px"><span style="width:70px;font-size:.8em" class="muted">${n}</span><div class="bar grow"><i style="width:${v}%"></i></div></div>`).join('')}</div>`;
    const center = `<div class="ccenter"><div class="muted disp csel">Elige tu clase</div><div class="disp ctitle"><span class="gold-t">M</span>ago</div><div class="body clema">«El conocimiento quema.»</div><div class="chero">${img('class_mage_0', 'hero-xl')}</div></div>`;
    const bottom = `<div class="cbottom"><button class="btn">Volver</button><div class="cname"><div class="muted disp" style="font-size:12px;letter-spacing:.12em">NOMBRE DEL PERSONAJE</div><input class="nameinput" value="Ysolde" maxlength="18"></div><button class="btn gold">Confirmar</button></div>`;
    if (OPT === 'c') return `<div class="view create create-c">
      <section class="panel cl col"><div class="ptitle">Clases</div><div class="clist">${classes.map(([id, n, ok]) => `<button class="crow ${id === sel ? 'on' : ''} ${ok ? '' : 'locked'}">${img('portrait_' + id, 'portrait')}<div style="text-align:left"><div class="disp">${n}</div><div class="muted" style="font-size:11px">${ok ? (id === 'warrior' ? 'Acero, cicatrices y paciencia.' : 'El conocimiento quema.') : 'Próximamente'}</div></div></button>`).join('')}</div>${looks}</section>
      ${center}
      <section class="panel cr col"><div class="ptitle">La clase</div><div class="scroll grow">${statsPrev}${info}</div></section>${bottom}</div>`;
    return `<div class="view create create-${OPT}">
      <section class="panel cl col"><div class="ptitle">Clases</div>${grid}${looks}</section>
      ${center}
      <section class="panel cr col"><div class="ptitle">Sobre la clase</div><div class="scroll grow">${info}</div></section>${bottom}</div>`;
  }

  function equipBlock() {
    return `<div class="equip">
      <div class="ecol">${slot(EQUIP.mainHand, { big: true, sel: true, lbl: 'Arma' })}${slot(EQUIP.gloves, { lbl: 'Manos' })}</div>
      <div class="ecol mid">${img('hero_naked', 'hero-sm', 'esil')}${slot(EQUIP.helmet, { lbl: 'Cabeza' })}${slot(EQUIP.armor, { lbl: 'Torso' })}${slot(EQUIP.boots, { lbl: 'Pies' })}</div>
      <div class="ecol">${slot(EQUIP.offHand, { big: true, lbl: 'Secundaria' })}${slot(EQUIP.amulet, { lbl: 'Amuleto' })}${slot(EQUIP.ring, { lbl: 'Anillo' })}</div>
    </div>`;
  }
  function statList(long) {
    const s = window.STATS.lvl24, b = window.STATS.base24;
    const rows = Object.keys(STATN).map((k) => `<div class="statrow"><span>${STATN[k]}</span><b>${k === 'maxHp' ? `${s[k]} / ${s[k]}` : s[k]}${s[k] - b[k] ? ` <span class="plus">(+${s[k] - b[k]})</span>` : ''}</b></div>`).join('');
    if (!long) return `<div class="body stats">${rows}</div>`;
    const prog = [['Expediciones', 37], ['Extracciones', 22], ['Muertes', 15], ['Criaturas derrotadas', 312], ['Jefes derrotados', 'Señor del Osario']].map(([n, v]) => `<div class="statrow"><span>${n}</span><b>${v}</b></div>`).join('');
    const det = Object.keys(STATN).map((k) => `<div class="statrow sub"><span class="muted">${STATN[k]}: base ${b[k]} · equipo +${s[k] - b[k]}</span></div>`).join('');
    return `<div class="body stats"><div class="lvbox"><div class="row" style="justify-content:space-between"><span class="disp">Nivel 24</span><span class="muted" style="font-size:13px">1.840 / 2.960 XP</span></div>${bar(62, 100, 'var(--arcane)')}</div>${rows}<div class="ptitle small">Desglose</div>${det}<div class="ptitle small">Trayectoria</div>${prog}</div>`;
  }
  function itemCard(id) {
    const d = I[id];
    return `<div class="panel itemcard"><div class="row" style="gap:10px;align-items:center">${slot(id)}<div><div class="nm" style="color:${RAR[d.rarity][1]}">${d.name}</div><div class="muted" style="font-size:12px">${RAR[d.rarity][0]} · Arma · Nv ${d.levelReq}</div></div></div>
      <div class="body" style="font-size:.85em;margin:6px 0">${Object.entries(d.stats || {}).map(([k, v]) => `<span class="heal-t">+${v} ${STATN[k] || k}</span>`).join(' · ')} · <span class="arc-t">Tajo desgarrador, Estocada, Golpe de pomo</span></div>
      <div class="row wrap" style="gap:6px"><button class="btn">Quitar</button><button class="btn">Al almacén</button></div></div>`;
  }
  const charPanel = (titleRight = '') => `<section class="panel al-left col"><div class="ptitle">Aventurero</div><div class="arch">${img('hero_player_0', 'hero', 'archhero')}<span class="ph-note" style="left:8px;top:8px">marco provisional</span></div><div class="disp" style="text-align:center;color:var(--gold)">◆ ${HERO.cls} ◆</div><div class="scroll grow">${statList(false)}</div><a class="btn ghost" href="#personaje">Ver detalles ${titleRight}</a></section>`;
  const bagPanel = () => `<div class="bag">${OPT === 'b' ? `<div class="m-only b-seg">${seg(['Mochila', 'Almacén', 'Bolsillo'], 0)}</div>` : ''}<div class="row hd"><span class="disp">Mochila · ${BACKPACK.length}/24</span><button class="btn ghost small">Ordenar</button></div>${gridOf(BACKPACK, 6, 24)}
      <div class="row hd" style="margin-top:8px"><span class="disp">Bolsillo seguro · 2/3</span><span class="muted" style="font-size:11px">no se pierde al morir</span></div>${gridOf(POCKET, 3, 3)}</div>`;
  const stashPanel = (cols = 8) => `<section class="panel al-right col"><div class="ptitle">Almacén · 40</div><div class="scroll grow" style="padding:10px">${gridOf(STASH, cols, 40)}</div><div class="row" style="padding:10px;gap:8px;justify-content:space-between"><button class="btn ghost">Ordenar</button><button class="btn">Ampliar (+8) · 500 oro</button></div></section>`;

  function alijo() {
    const center = `<section class="panel al-center col"><div class="ptitle">Equipo</div><div class="al-c-inner">${equipBlock()}${bagPanel()}</div><div class="al-foot">${itemCard('knight_sword')}<div class="panel goldbox">Oro total ${goldAmt(HERO.gold)}</div></div></section>`;
    if (REAL === 'd') return `<div class="view three alijo alijo-d ${ALIJO_VIEW ? 'ver-almacen' : ''}"><div class="m-only d-seg">${seg(['Equipo', 'Almacén'], ALIJO_VIEW).replace('<button class="', '<a href="#alijo" class="').replace('<button class="', '<a href="#alijo-almacen" class="').replace(/<\/button>/g, '</a>')}</div>${charPanel()}${center}${stashPanel()}</div>`;
    if (OPT === 'a') return `<div class="view three alijo">${charPanel()}${center}${stashPanel()}
      <button class="drawer-btn left m-only">◂ Atributos</button><button class="drawer-btn right m-only">Almacén ▸</button></div>`;
    if (OPT === 'b') return `<div class="view three alijo alijo-b">${charPanel()}${center}${stashPanel()}
      </div>`;
    return `<div class="view three alijo alijo-c"><div class="m-only c-seg">${seg(['Personaje', 'Equipo', 'Almacén'], 1)}</div>${charPanel()}${center}${stashPanel()}</div>`;
  }

  function mercaderes() {
    const svc = (v) => v.services.map((s) => `<span class="tag ${s === 'Forja' || s === 'Contratos' ? 'gold' : ''}">${s}</span>`).join('');
    if (OPT === 'a') return `<div class="view merch merch-a"><div class="mtitle disp"><span>◆</span> Mercaderes del campamento <span>◆</span></div>
      <div class="mcards">${VENDORS.map((v) => `<div class="panel mcard ${v.id === 'brand' ? 'gold' : ''}"><div class="mname disp">${v.name}</div><div class="mimg">${img('vendor_' + v.id, 'vendor')}${v.ready ? `<span class="badge">${v.ready}</span>` : ''}</div>
        <div class="mrole" style="color:${v.color}">${v.role}</div><div class="mrep"><span class="gold-t">${v.rank}</span><span class="muted">${v.rep - v.base}/${v.next - v.base}</span></div>${bar(v.rep - v.base, v.next - v.base)}
        <div class="msvc">${svc(v)}</div><a class="btn ${v.id === 'brand' ? 'gold' : ''}" href="#mercader">Hablar</a></div>`).join('')}</div></div>`;
    if (OPT === 'b') return `<div class="view merch merch-b"><div class="mtitle disp"><span>◆</span> Mercaderes del campamento <span>◆</span></div>
      <div class="mgrid">${VENDORS.map((v) => `<div class="panel mwide ${v.id === 'brand' ? 'gold' : ''}"><div class="mimg">${img('vendor_' + v.id, 'vendor')}</div><div class="col grow" style="gap:6px">
        <div class="row" style="justify-content:space-between;align-items:baseline"><span class="disp mname">${v.name}</span>${v.ready ? `<span class="tag" style="border-color:var(--heal);color:var(--heal)">${v.ready} lista${v.ready > 1 ? 's' : ''}</span>` : ''}</div>
        <div style="color:${v.color};font-size:13px">${v.role}</div><div class="body muted m-hide" style="font-style:italic;font-size:.85em">«${v.quote}»</div>
        <div class="mrep"><span class="gold-t">${v.rank} · −${v.disc}%</span><span class="muted">${v.rep - v.base}/${v.next - v.base}</span></div>${bar(v.rep - v.base, v.next - v.base)}
        <div class="row wrap" style="gap:6px;justify-content:space-between;align-items:center"><div class="msvc">${svc(v)}</div><a class="btn ${v.id === 'brand' ? 'gold' : ''}" href="#mercader">Hablar</a></div></div></div>`).join('')}</div></div>`;
    return `<div class="view merch merch-c"><section class="panel col grow"><div class="ptitle">Mercaderes del campamento</div><div class="scroll grow">
      ${VENDORS.map((v) => `<div class="mrow"><div class="mimg">${img('portrait_vendor_' + v.id, 'portrait')}</div><div class="minfo"><div class="disp">${v.name}</div><div style="color:${v.color};font-size:12px">${v.role}</div></div>
        <div class="mrepc"><div class="mrep"><span class="gold-t">${v.rank}</span><span class="muted">−${v.disc}%</span></div>${bar(v.rep - v.base, v.next - v.base)}</div>
        <div class="mbtns">${v.services.map((s) => `<a class="btn ${s === 'Forja' || s === 'Contratos' ? 'gold' : ''}" href="#mercader">${s}${s === 'Misiones' && v.ready ? ` <span class="badge" style="position:static">${v.ready}</span>` : ''}</a>`).join('')}</div></div>`).join('')}
    </div></section></div>`;
  }

  function mercader() {
    const v = VENDORS[3];
    const recipes = [['tempered_sword', 'Espada templada', [['iron_ore', 6, 6], ['bone_dust', 4, 9]], 120, true], ['tempered_axe', 'Hacha templada', [['iron_ore', 6, 6], ['copper_ore', 4, 4]], 130, true], ['cavern_staff', 'Báculo de cristal de caverna', [['bat_wing', 6, 6], ['copper_ore', 6, 4]], 120, false],
      ['silver_forged_sword', 'Espada de plata forjada', [['silver_ore', 8, 7], ['blessed_silver', 2, 3], ['ancient_bone', 4, 8]], 600, false], ['bone_bulwark', 'Baluarte de hueso antiguo', [['ancient_bone', 10, 8], ['silver_ore', 4, 7]], 550, false], ['obsidian_greatblade', 'Gran hoja de obsidiana', [['obsidian_shard', 10, 2], ['demon_blood', 3, 0]], 2200, 'lock']];
    const iconOf = { tempered_sword: 'iron_sword', tempered_axe: 'executioner_axe', cavern_staff: 'ember_staff', silver_forged_sword: 'iron_sword', bone_bulwark: 'bastion_shield', obsidian_greatblade: 'executioner_axe' };
    const rec = recipes.map(([id, n, mats, gold, ok]) => `<div class="panel recipe ${ok === 'lock' ? 'locked' : ''}"><div class="row" style="gap:8px;align-items:center">${slot(iconOf[id])}<div class="grow"><div class="disp" style="font-size:.95em">${n}</div><div class="muted" style="font-size:11px">${ok === 'lock' ? '🔒 Rango «Aliado» con Brand' : 'Calidad al azar: tosca, buena o magistral'}</div></div></div>
      ${ok === 'lock' ? '' : `<div class="mats">${mats.map(([m, need, have]) => `<span class="${have >= need ? 'heal-t' : 'blood-t'}">${img('item_' + m, 'icon-sm')}${have}/${need}</span>`).join('')}<span class="${HERO.gold >= gold ? 'gold-t' : 'blood-t'}">${img('icon_coin', 'icon-sm')}${gold}</span></div><button class="btn ${ok ? 'gold' : ''}" ${ok ? '' : 'disabled'}>Forjar</button>`}</div>`).join('');
    const left = `<section class="panel vd-left col"><div class="vd-img">${img('vendor_brand', 'vendor')}</div><div class="disp" style="font-size:1.1em;text-align:center">${v.name}</div><div style="color:${v.color};text-align:center;font-size:13px">${v.role}</div>
      <div class="body m-hide" style="font-style:italic;text-align:center;font-size:.9em;padding:0 10px">«${v.quote}»</div><div style="padding:0 12px"><div class="mrep"><span class="gold-t">${v.rank} · −${v.disc}%</span><span class="muted">${v.rep - v.base}/${v.next - v.base}</span></div>${bar(v.rep - v.base, v.next - v.base)}</div>
      <div class="vd-svc">${['Tienda', 'Misiones', 'Forja'].map((s, i) => `<button class="btn ${i === 2 ? 'gold' : ''}">${s}</button>`).join('')}</div><a class="btn ghost" href="#mercaderes">◂ Volver</a></section>`;
    const center = `<section class="panel vd-center col"><div class="ptitle">Forja de Maese Brand</div><div class="row vd-opts"><label class="btn ghost small"><input type="checkbox"> Asegurar calidad buena (×1,5 materiales)</label></div><div class="scroll grow"><div class="recipes">${rec}</div></div></section>`;
    const right = `<section class="panel vd-right col"><div class="ptitle">Tus materiales</div><div class="scroll grow" style="padding:10px">${gridOf([['iron_ore', 6], ['copper_ore', 4], ['bone_dust', 9], ['silver_ore', 7], ['blessed_silver', 3], ['ancient_bone', 8], ['bat_wing', 6], ['obsidian_shard', 2]], 4, 16)}<div class="body muted" style="font-size:.8em;margin-top:8px">De la mochila y del almacén.</div></div><div class="panel goldbox">Oro ${goldAmt(HERO.gold)}</div></section>`;
    return `<div class="view three vendor vendor-${OPT}">${left}${center}${right}${OPT === 'a' ? '<button class="drawer-btn right m-only">Materiales ▸</button>' : ''}${OPT === 'c' ? `<div class="m-only c-seg">${seg(['Brand', 'Forja', 'Materiales'], 1)}</div>` : ''}</div>`;
  }

  function personaje() {
    const sk = window.LOADOUT.skills;
    const FX = { slash: ['⟋', '#c9d2dc'], smash: ['✸', '#e8913a'], shield: ['⛨', '#9fe3ff'], holy: ['✦', '#e8b33a'], fire: ['🜂', '#e8752b'], frost: ['❄', '#9fe3ff'], dark: ['◉', '#a35ae0'], poison: ['☣', '#5fd19a'], bite: ['⌇', '#c4283b'] };
    const src = { war_cry: 'Guerrero', rending_slash: 'Espada del caballero', thrust: 'Espada del caballero', pommel_strike: 'Espada del caballero', block: 'Escudo de hierro', shield_bash: 'Escudo de hierro' };
    const ico = (s) => `<span class="skico" style="--c:${(FX[s.fx] || FX.slash)[1]}">${(FX[s.fx] || FX.slash)[0]}</span>`;
    const ring = [{ name: 'Tajo', fx: 'slash', basic: true }, ...sk];
    const slots = ring.map((s, i) => `<div class="skslot s${i}" title="${s.name}">${ico(s)}<span class="sklbl">${s.name}</span></div>`).join('');
    const groups = {}; sk.forEach((s) => (groups[src[s.id] || 'Clase'] = groups[src[s.id] || 'Clase'] || []).push(s));
    const list = Object.entries(groups).map(([g, l]) => `<div class="skgroup"><div class="muted disp" style="font-size:12px;letter-spacing:.1em;text-transform:uppercase">${g}</div>${l.map((s) => `<div class="skrow">${ico(s)}<div class="grow"><div class="row" style="justify-content:space-between"><span class="disp" style="font-size:.95em">${s.name}</span><span class="muted" style="font-size:12px">${s.cost ? s.cost + ' aguante' : 'sin coste'}</span></div><div class="body muted" style="font-size:.85em;line-height:1.25">${s.description}</div></div></div>`).join('')}</div>`).join('');
    const left = `<section class="panel ps-left col"><div class="ptitle">Atributos</div><div class="scroll grow" style="padding:4px 12px">${statList(true)}</div></section>`;
    const center = `<section class="ps-center"><div class="psring">${img('hero_player_0', 'hero', 'pshero')}${slots}<div class="arcline"></div></div><div class="body muted pshint">Tus habilidades vienen de tu clase y de lo que empuñas. Cambia de arma o de secundaria y cambiarán.</div></section>`;
    const right = `<section class="panel ps-right col"><div class="ptitle">Habilidades</div><div class="scroll grow" style="padding:6px 12px">${list}</div></section>`;
    const sub = subtabs(['Atributos', 'Habilidades'], 1);
    if (OPT === 'a') return `<div class="view pers pers-a">${sub}<div class="three grow">${left}${center}${right}</div><button class="drawer-btn left m-only">◂ Atributos</button></div>`;
    if (OPT === 'b') return `<div class="view pers pers-b">${sub}<div class="three grow">${left}${center}${right}</div></div>`;
    return `<div class="view pers pers-c"><div class="row" style="align-items:center;gap:8px;justify-content:center">${sub}<div class="m-only c-seg inline">${seg(['Atributos', 'Personaje', 'Habilidades'], 1)}</div></div><div class="three grow">${left}${center}${right}</div></div>`;
  }

  function pending(name) {
    return `<div class="view" style="display:flex;align-items:center;justify-content:center;padding:var(--pad)"><div class="panel" style="max-width:640px;padding:24px;text-align:center"><div class="ptitle">${name}</div><p class="body">Esta pestaña ya existe en el juego. En esta maqueta solo se muestran las cinco pantallas pedidas; al implementar la opción elegida se pasará a la misma estructura.</p></div></div>`;
  }

  // ── Montaje ──
  const SCREENS = { jugar, clase, alijo, mercaderes, mercader, personaje };
  const body = SCREENS[S] ? SCREENS[S]() : pending(TABS.find((t) => t[0] === S)?.[1] || S);
  const withNav = S !== 'clase';
  document.getElementById('app').innerHTML = withNav ? `${OPT === 'b' ? rail() : ''}<div class="main">${topnav()}${body}</div>` : `<div class="main">${body}</div>`;
  document.getElementById('app').className = `app opt-${OPT} ${REAL === 'd' ? 'opt-d' : ''} s-${S}`;
  if (REAL === 'd') document.querySelector('.topnav')?.classList.add('pills');

  // ── Escalado entero del pixel art ──
  const cssNum = (name, fallback) => { const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--s-' + name)); return Number.isFinite(v) ? v : fallback; };
  const SCALE_EXTRA = { 'hero-xl': () => cssNum('hero', 8) + 2, 'hero-sm': () => cssNum('hero-sm', 4), zone: () => (innerHeight <= 520 ? 1 : 2), 'zone-sm': () => (innerHeight <= 520 ? 1 : innerWidth >= 1280 ? 2 : 1), 'icon-big': () => cssNum('icon', 3) + 1, 'icon-sm': () => Math.max(1, cssNum('icon', 3) - 1) };
  function scaleOf(s) { if (/^\d+$/.test(s)) return +s; if (SCALE_EXTRA[s]) return SCALE_EXTRA[s](); return cssNum(s, 2); }
  function applyScales() {
    document.querySelectorAll('img.px[data-s]').forEach((im) => {
      const set = () => { if (im.dataset.s === 'scene') return; const k = scaleOf(im.dataset.s); im.style.width = im.naturalWidth * k + 'px'; im.style.height = im.naturalHeight * k + 'px'; };
      im.complete ? set() : im.addEventListener('load', set, { once: true });
    });
    placeScene();
  }
  // La escena se escala al menor múltiplo entero que cubre su contenedor; el héroe usa la misma escala.
  function placeScene() {
    const sc = document.getElementById('scene'); if (!sc) return;
    const hero = document.getElementById('campHero'), him = document.getElementById('heroImg'), spot = document.getElementById('spot');
    const r = sc.getBoundingClientRect();
    const hk = Math.max(3, Math.floor((r.height * 0.5) / 26)); // el héroe ocupa ~la mitad del alto, a escala entera
    const w = 20 * hk, h = 26 * hk, feet = Math.round(r.height * 0.84);
    him.style.width = w + 'px'; him.style.height = h + 'px';
    hero.style.left = r.width / 2 + 'px';
    hero.style.top = feet - h * 0.96 - hero.querySelector('.nametag').offsetHeight - 6 + 'px';
    spot.style.left = r.width / 2 - w * 1.1 + 'px'; spot.style.width = w * 2.2 + 'px'; spot.style.height = feet + w * 0.2 + 'px';
  }
  addEventListener('resize', applyScales);
  document.fonts?.ready.then(applyScales);
  applyScales();
  window.__mockReady = () => Promise.all([...document.images].map((i) => i.complete ? 1 : new Promise((r) => (i.onload = i.onerror = r)))).then(() => { applyScales(); return true; });
})();
