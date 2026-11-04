// Escenarios del combate: un fondo de pixel art distinto según la zona de la mazmorra.
// Se dibujan con código (320x180) y se escalan sin suavizar; se guardan en caché.

export type ZoneId = 'cripta' | 'cavernas' | 'osario' | 'necropolis' | 'infierno';
/** `look` elige el dibujo base (antorchas, cristales, huesos, velas o lava); `extra` añade el detalle de cada subzona. */
export interface Zone { id: string; name: string; wall: string[]; floor: string[]; accent: string; light: string; look?: ZoneId; extra?: 'sky' | 'water' | 'marble' | 'blood' | 'cells' }

export const ZONES: Record<string, Zone> = {
  cripta: { id: 'cripta', name: 'Galerías de piedra', wall: ['#2b2a33', '#34333d', '#24232b'], floor: ['#2a2622', '#332e29'], accent: '#e8913a', light: '#ffb45a' },
  cavernas: { id: 'cavernas', name: 'Cavernas Húmedas', wall: ['#1f2a28', '#26342f', '#1a2321'], floor: ['#1d2622', '#24302a'], accent: '#5fe0d0', light: '#7ff5e6' },
  osario: { id: 'osario', name: 'El Osario', wall: ['#2e2124', '#3a2a2c', '#25191c'], floor: ['#2b2020', '#352626'], accent: '#c4283b', light: '#ff5a4a' },
  necropolis: { id: 'necropolis', name: 'La Cripta', wall: ['#262b36', '#2f3542', '#20242e'], floor: ['#22262f', '#2a2f39'], accent: '#8fb8e8', light: '#bfe0ff' },
  infierno: { id: 'infierno', name: 'El Infierno', wall: ['#1c1212', '#261616', '#140c0c'], floor: ['#1a1010', '#221414'], accent: '#ff6a2a', light: '#ff8a3a' },
  // ── Subzonas ──
  afueras: { id: 'afueras', name: 'Afueras del Bastión', look: 'cripta', extra: 'sky', wall: ['#3a2a1c', '#4a3524', '#2a1c12'], floor: ['#2a2016', '#33281c'], accent: '#e8913a', light: '#ffb45a' },
  castillo: { id: 'castillo', name: 'El Bastión en ruinas', look: 'cripta', wall: ['#3a3630', '#45403a', '#2e2a26'], floor: ['#3a1416', '#441a1c'], accent: '#e8b33a', light: '#ffc46a' },
  calabozos: { id: 'calabozos', name: 'Los calabozos', look: 'cavernas', extra: 'cells', wall: ['#262b28', '#2e3530', '#1e2220'], floor: ['#1e2420', '#252c27'], accent: '#e8913a', light: '#d8a060' },
  osario_umbravel: { id: 'osario_umbravel', name: 'El Osario de Umbravel', look: 'osario', wall: ['#3a362e', '#46413a', '#2e2a24'], floor: ['#2e2a24', '#36322a'], accent: '#d6a8ff', light: '#c8b8ff' },
  catacumbas: { id: 'catacumbas', name: 'Las Catacumbas Ahogadas', look: 'necropolis', extra: 'water', wall: ['#1a2a30', '#223640', '#142026'], floor: ['#16262c', '#1c2e36'], accent: '#5fe0d0', light: '#8ff0ff' },
  panteon: { id: 'panteon', name: 'El Panteón de los Nobles', look: 'necropolis', extra: 'marble', wall: ['#6e6a62', '#7e7a70', '#5a5650'], floor: ['#4a4640', '#57524a'], accent: '#e8b33a', light: '#fff0c0' },
  carmesi: { id: 'carmesi', name: 'La Cripta Carmesí', look: 'necropolis', extra: 'blood', wall: ['#3a1a1c', '#4a2224', '#2a1214'], floor: ['#2a1214', '#341618'], accent: '#ff5a4a', light: '#ff6a5a' },
  puertas: { id: 'puertas', name: 'Las Puertas del Abismo', look: 'infierno', wall: ['#2e2220', '#3a2a28', '#201614'], floor: ['#1e1412', '#261a18'], accent: '#ff6a2a', light: '#ff8a3a' },
  rios: { id: 'rios', name: 'Los Ríos de Fuego', look: 'infierno', extra: 'water', wall: ['#2a1810', '#36201a', '#1e100a'], floor: ['#5a1808', '#6a2008'], accent: '#ffb347', light: '#ffb347' },
  trono: { id: 'trono', name: 'El Trono de las Cadenas', look: 'infierno', wall: ['#1e1620', '#2a2030', '#140e16'], floor: ['#1a1420', '#221a28'], accent: '#c4283b', light: '#ff4a5a' },
};

/** Escenario de un combate según la zona de la mazmorra: el primero de la lista es el del jefe;
 *  el resto se reparte por salas (la misma sala da siempre el mismo escenario). */
export function zoneFor(backdrops: string[], room: string, seed: number | undefined, boss: boolean): Zone {
  const pick = (id: string) => ZONES[id] ?? ZONES.cripta;
  if (boss || backdrops.length === 1) return pick(backdrops[0]);
  const rest = backdrops.slice(1);
  let h = (seed ?? 7) >>> 0;
  for (const ch of room) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
  return pick(rest[h % 3 === 0 && rest.length > 1 ? 1 : 0]);
}

const cache = new Map<string, string>();

export function zoneBackdrop(zone: Zone): string {
  const hit = cache.get(zone.id);
  if (hit) return hit;
  const W = 320, H = 180, horizon = 92;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  if (!g) return '';
  let seed = zone.id.length * 977;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  // Pared de sillares
  for (let y = 0; y < horizon; y += 8) for (let x = -((y / 8) % 2) * 8; x < W; x += 16) {
    g.fillStyle = zone.wall[Math.floor(rnd() * 3)]; g.fillRect(x, y, 15, 7);
    g.fillStyle = '#00000040'; g.fillRect(x, y + 6, 15, 1);
  }
  // Arcos y columnas
  for (const cx of [40, 160, 280]) {
    g.fillStyle = '#0c0b10'; g.fillRect(cx - 22, 30, 44, horizon - 30); g.beginPath(); g.arc(cx, 30, 22, Math.PI, 0); g.fill();
    g.fillStyle = zone.wall[1]; g.fillRect(cx - 30, 14, 6, horizon - 14); g.fillRect(cx + 24, 14, 6, horizon - 14);
  }
  // Suelo en perspectiva
  for (let y = horizon; y < H; y++) {
    const t = (y - horizon) / (H - horizon);
    g.fillStyle = zone.floor[Math.floor(y / (3 + t * 10)) % 2]; g.fillRect(0, y, W, 1);
  }
  g.strokeStyle = '#00000055';
  for (let i = -10; i <= 10; i++) { g.beginPath(); g.moveTo(W / 2 + i * 14, horizon); g.lineTo(W / 2 + i * 60, H); g.stroke(); }
  const glow = (x: number, y: number, r: number, c: string) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, c + 'aa'); gr.addColorStop(1, c + '00'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
  for (const cx of [100, 220]) {
    if ((zone.look ?? zone.id) === 'cripta') { glow(cx, 50, 40, zone.light); g.fillStyle = '#4a3420'; g.fillRect(cx - 1, 52, 3, 10); g.fillStyle = zone.light; g.fillRect(cx - 2, 46, 5, 6); g.fillStyle = '#fff2c0'; g.fillRect(cx - 1, 48, 3, 3); }
    if ((zone.look ?? zone.id) === 'cavernas') { glow(cx, 80, 36, zone.light); g.fillStyle = zone.accent; g.beginPath(); g.moveTo(cx, 62); g.lineTo(cx + 6, 88); g.lineTo(cx - 6, 88); g.fill(); g.fillStyle = '#c8fff8'; g.fillRect(cx - 1, 70, 2, 12); }
    if ((zone.look ?? zone.id) === 'necropolis') { glow(cx, 70, 30, zone.light); g.fillStyle = '#3a4150'; g.fillRect(cx - 14, 80, 28, 9); g.fillStyle = '#4d5566'; g.fillRect(cx - 14, 78, 28, 3); g.fillStyle = '#e8ecf2'; for (const dx of [-12, 10]) { g.fillRect(cx + dx, 70, 2, 7); g.fillStyle = zone.light; g.fillRect(cx + dx, 67, 2, 3); g.fillStyle = '#e8ecf2'; } }
    if ((zone.look ?? zone.id) === 'infierno') { glow(cx, 70, 40, zone.light); g.fillStyle = '#5a1808'; g.fillRect(cx - 30, 86, 60, 4); g.fillStyle = '#ff8a3a'; g.fillRect(cx - 26, 87, 52, 2); g.fillStyle = '#ffd36a'; for (let k = 0; k < 6; k++) g.fillRect(cx - 24 + k * 9, 87, 3, 1); }
    if ((zone.look ?? zone.id) === 'osario') { glow(cx, 60, 34, zone.light); g.fillStyle = '#d9d3c1'; for (let k = 0; k < 8; k++) g.fillRect(cx - 14 + rnd() * 28, 82 + rnd() * 8, 4 + rnd() * 5, 2); g.beginPath(); g.arc(cx, 80, 4, 0, Math.PI * 2); g.fill(); g.fillStyle = '#000'; g.fillRect(cx - 2, 79, 1, 1); g.fillRect(cx + 1, 79, 1, 1); }
  }
  // Niebla baja y haces de luz
  for (let y = horizon - 10; y < horizon + 22; y++) { g.fillStyle = `rgba(150,140,170,${0.05 * (1 - Math.abs(y - horizon - 4) / 18)})`; g.fillRect(0, y, W, 1); }
  g.globalCompositeOperation = 'lighter';
  for (const [x0, w] of [[118, 18], [196, 12]] as const) { const lg = g.createLinearGradient(0, 0, 0, horizon + 40); lg.addColorStop(0, zone.light + '22'); lg.addColorStop(1, zone.light + '00'); g.fillStyle = lg; g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + w, 0); g.lineTo(x0 + w + 30, horizon + 40); g.lineTo(x0 + 20, horizon + 40); g.fill(); }
  g.globalCompositeOperation = 'source-over';
  // Grietas en el suelo
  g.strokeStyle = '#0000008a'; g.lineWidth = 1;
  for (let k = 0; k < 14; k++) { let x = rnd() * W, y = horizon + 8 + rnd() * 70; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 3; j++) { x += (rnd() - 0.5) * 14; y += rnd() * 5; g.lineTo(x, y); } g.stroke(); }
  // Detalles propios de cada zona
  if ((zone.look ?? zone.id) === 'cripta') { g.strokeStyle = '#ffffff22'; for (const [cx, cy] of [[8, 8], [312, 8]]) for (let r = 4; r < 22; r += 6) { g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke(); } }
  if ((zone.look ?? zone.id) === 'cavernas') { g.fillStyle = '#121a18'; for (let x = 0; x < W; x += 9 + rnd() * 10) { const h = 6 + rnd() * 16; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 4, 0); g.lineTo(x + 2, h); g.fill(); } g.fillStyle = '#3e6b4a'; for (let k = 0; k < 60; k++) g.fillRect(rnd() * W, horizon - 4 + rnd() * 6, 2, 1); g.fillStyle = '#7ff5e622'; for (let k = 0; k < 40; k++) g.fillRect(rnd() * W, horizon + rnd() * 80, 1, 1); }
  if ((zone.look ?? zone.id) === 'osario') { for (const bx of [70, 250]) { g.fillStyle = '#5a1018'; g.fillRect(bx, 6, 14, 34); g.beginPath(); g.moveTo(bx, 40); g.lineTo(bx + 7, 34); g.lineTo(bx + 14, 40); g.fill(); g.fillStyle = '#e8b33a'; g.fillRect(bx + 5, 16, 4, 4); } g.strokeStyle = '#6b6672'; for (const cx of [30, 290]) { g.beginPath(); for (let y = 0; y < 40; y += 3) { g.moveTo(cx, y); g.lineTo(cx + 2, y + 2); } g.stroke(); } }
  if ((zone.look ?? zone.id) === 'necropolis') { g.strokeStyle = '#ffffff1a'; for (const [cx, cy] of [[8, 8], [312, 8]]) for (let r = 4; r < 22; r += 6) { g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke(); } g.fillStyle = '#9fc4ff18'; for (let k = 0; k < 50; k++) g.fillRect(rnd() * W, horizon + rnd() * 80, 1, 1); }
  if ((zone.look ?? zone.id) === 'infierno') {
    // grietas de lava en el suelo y cadenas colgando
    g.strokeStyle = '#ff6a2a'; g.lineWidth = 1;
    for (let k = 0; k < 9; k++) { let x = rnd() * W, y = horizon + 10 + rnd() * 70; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 4; j++) { x += (rnd() - 0.5) * 18; y += rnd() * 4; g.lineTo(x, y); } g.stroke(); }
    g.strokeStyle = '#4a3a3a'; for (const cx of [30, 130, 290]) { g.beginPath(); for (let y = 0; y < 50; y += 3) { g.moveTo(cx, y); g.lineTo(cx + 2, y + 2); } g.stroke(); }
    g.fillStyle = '#ffb34755'; for (let k = 0; k < 40; k++) g.fillRect(rnd() * W, rnd() * horizon, 1, 1);
  }
  // Detalles propios de cada subzona
  if (zone.extra === 'sky') {
    // Exterior de noche: cielo, luna y murallas recortadas en vez de la pared
    const sky = g.createLinearGradient(0, 0, 0, horizon); sky.addColorStop(0, '#0a0c18'); sky.addColorStop(1, '#1e2234'); g.fillStyle = sky; g.fillRect(0, 0, W, horizon);
    g.fillStyle = '#e8e4d0'; g.beginPath(); g.arc(250, 26, 9, 0, Math.PI * 2); g.fill(); g.fillStyle = '#0a0c18'; g.beginPath(); g.arc(254, 23, 8, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffffff'; for (let k = 0; k < 40; k++) g.fillRect(rnd() * W, rnd() * (horizon - 30), 1, 1);
    g.fillStyle = '#121018'; g.fillRect(0, horizon - 34, W, 34); for (let x = 0; x < W; x += 12) g.fillRect(x, horizon - 40, 7, 6);
    g.fillStyle = '#1a1420'; g.fillRect(150, horizon - 62, 26, 62); for (let x = 150; x < 176; x += 7) g.fillRect(x, horizon - 68, 4, 6);
    g.fillStyle = '#4a3524'; for (let x = 6; x < W; x += 9) { g.fillRect(x, horizon - 14, 4, 14); g.fillRect(x + 1, horizon - 17, 2, 3); }
    glow(70, horizon - 6, 30, zone.light); g.fillStyle = zone.light; g.fillRect(66, horizon - 10, 8, 6);
  }
  if (zone.extra === 'water') {
    for (let y = horizon + 30; y < H; y += 3) { g.fillStyle = `${zone.accent}${y % 2 ? '22' : '14'}`; g.fillRect(0, y, W, 1); }
    g.fillStyle = zone.accent + '55'; for (let k = 0; k < 30; k++) g.fillRect(rnd() * W, horizon + 30 + rnd() * 60, 4 + rnd() * 8, 1);
  }
  if (zone.extra === 'marble') {
    for (const sx of [24, 296]) { g.fillStyle = '#d8d4cc'; g.fillRect(sx - 6, horizon - 44, 12, 40); g.fillRect(sx - 4, horizon - 52, 8, 8); g.fillStyle = '#8a857a'; g.fillRect(sx + 4, horizon - 44, 2, 40); g.fillStyle = '#6e6a62'; g.fillRect(sx - 9, horizon - 4, 18, 6); }
    g.fillStyle = '#e8b33a33'; for (let x = 0; x < W; x += 16) g.fillRect(x, 10, 8, 2);
  }
  if (zone.extra === 'blood') {
    g.fillStyle = '#8e1c2c'; for (let k = 0; k < 14; k++) { const x = rnd() * W; g.fillRect(x, rnd() * 20, 1, 8 + rnd() * 30); }
    g.fillStyle = '#ff6a2a44'; for (let k = 0; k < 6; k++) { const x = 20 + rnd() * 280; g.fillRect(x, horizon - 2, 10 + rnd() * 20, 2); }
  }
  if (zone.extra === 'cells') {
    for (const cx of [40, 280]) { g.fillStyle = '#0a0a0c'; g.fillRect(cx - 18, 30, 36, horizon - 30); g.fillStyle = '#6d7580'; for (let x = cx - 16; x < cx + 18; x += 5) g.fillRect(x, 30, 2, horizon - 30); g.fillRect(cx - 18, 30, 36, 2); }
  }
  // Polvo y viñeta
  for (let k = 0; k < 50; k++) { g.fillStyle = `rgba(255,240,210,${0.08 + rnd() * 0.15})`; g.fillRect(rnd() * W, rnd() * H * 0.8, 1, 1); }
  const vg = g.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, 200); vg.addColorStop(0, '#0000'); vg.addColorStop(1, '#000a'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  const url = cv.toDataURL();
  cache.set(zone.id, url);
  return url;
}
