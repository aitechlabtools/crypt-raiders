// Escenarios del combate: un fondo de pixel art distinto según la zona de la mazmorra.
// Se dibujan con código (320x180) y se escalan sin suavizar; se guardan en caché.

export type ZoneId = 'cripta' | 'cavernas' | 'osario' | 'necropolis' | 'infierno';
export interface Zone { id: ZoneId; name: string; wall: string[]; floor: string[]; accent: string; light: string }

export const ZONES: Record<ZoneId, Zone> = {
  cripta: { id: 'cripta', name: 'Galerías de piedra', wall: ['#2b2a33', '#34333d', '#24232b'], floor: ['#2a2622', '#332e29'], accent: '#e8913a', light: '#ffb45a' },
  cavernas: { id: 'cavernas', name: 'Cavernas Húmedas', wall: ['#1f2a28', '#26342f', '#1a2321'], floor: ['#1d2622', '#24302a'], accent: '#5fe0d0', light: '#7ff5e6' },
  osario: { id: 'osario', name: 'El Osario', wall: ['#2e2124', '#3a2a2c', '#25191c'], floor: ['#2b2020', '#352626'], accent: '#c4283b', light: '#ff5a4a' },
  necropolis: { id: 'necropolis', name: 'La Cripta', wall: ['#262b36', '#2f3542', '#20242e'], floor: ['#22262f', '#2a2f39'], accent: '#8fb8e8', light: '#bfe0ff' },
  infierno: { id: 'infierno', name: 'El Infierno', wall: ['#1c1212', '#261616', '#140c0c'], floor: ['#1a1010', '#221414'], accent: '#ff6a2a', light: '#ff8a3a' },
};

/** Escenario de un combate según la zona de la mazmorra: el primero de la lista es el del jefe;
 *  el resto se reparte por salas (la misma sala da siempre el mismo escenario). */
export function zoneFor(backdrops: string[], room: string, seed: number | undefined, boss: boolean): Zone {
  const pick = (id: string) => ZONES[id as ZoneId] ?? ZONES.cripta;
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
    if (zone.id === 'cripta') { glow(cx, 50, 40, zone.light); g.fillStyle = '#4a3420'; g.fillRect(cx - 1, 52, 3, 10); g.fillStyle = zone.light; g.fillRect(cx - 2, 46, 5, 6); g.fillStyle = '#fff2c0'; g.fillRect(cx - 1, 48, 3, 3); }
    if (zone.id === 'cavernas') { glow(cx, 80, 36, zone.light); g.fillStyle = zone.accent; g.beginPath(); g.moveTo(cx, 62); g.lineTo(cx + 6, 88); g.lineTo(cx - 6, 88); g.fill(); g.fillStyle = '#c8fff8'; g.fillRect(cx - 1, 70, 2, 12); }
    if (zone.id === 'necropolis') { glow(cx, 70, 30, zone.light); g.fillStyle = '#3a4150'; g.fillRect(cx - 14, 80, 28, 9); g.fillStyle = '#4d5566'; g.fillRect(cx - 14, 78, 28, 3); g.fillStyle = '#e8ecf2'; for (const dx of [-12, 10]) { g.fillRect(cx + dx, 70, 2, 7); g.fillStyle = zone.light; g.fillRect(cx + dx, 67, 2, 3); g.fillStyle = '#e8ecf2'; } }
    if (zone.id === 'infierno') { glow(cx, 70, 40, zone.light); g.fillStyle = '#5a1808'; g.fillRect(cx - 30, 86, 60, 4); g.fillStyle = '#ff8a3a'; g.fillRect(cx - 26, 87, 52, 2); g.fillStyle = '#ffd36a'; for (let k = 0; k < 6; k++) g.fillRect(cx - 24 + k * 9, 87, 3, 1); }
    if (zone.id === 'osario') { glow(cx, 60, 34, zone.light); g.fillStyle = '#d9d3c1'; for (let k = 0; k < 8; k++) g.fillRect(cx - 14 + rnd() * 28, 82 + rnd() * 8, 4 + rnd() * 5, 2); g.beginPath(); g.arc(cx, 80, 4, 0, Math.PI * 2); g.fill(); g.fillStyle = '#000'; g.fillRect(cx - 2, 79, 1, 1); g.fillRect(cx + 1, 79, 1, 1); }
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
  if (zone.id === 'cripta') { g.strokeStyle = '#ffffff22'; for (const [cx, cy] of [[8, 8], [312, 8]]) for (let r = 4; r < 22; r += 6) { g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke(); } }
  if (zone.id === 'cavernas') { g.fillStyle = '#121a18'; for (let x = 0; x < W; x += 9 + rnd() * 10) { const h = 6 + rnd() * 16; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 4, 0); g.lineTo(x + 2, h); g.fill(); } g.fillStyle = '#3e6b4a'; for (let k = 0; k < 60; k++) g.fillRect(rnd() * W, horizon - 4 + rnd() * 6, 2, 1); g.fillStyle = '#7ff5e622'; for (let k = 0; k < 40; k++) g.fillRect(rnd() * W, horizon + rnd() * 80, 1, 1); }
  if (zone.id === 'osario') { for (const bx of [70, 250]) { g.fillStyle = '#5a1018'; g.fillRect(bx, 6, 14, 34); g.beginPath(); g.moveTo(bx, 40); g.lineTo(bx + 7, 34); g.lineTo(bx + 14, 40); g.fill(); g.fillStyle = '#e8b33a'; g.fillRect(bx + 5, 16, 4, 4); } g.strokeStyle = '#6b6672'; for (const cx of [30, 290]) { g.beginPath(); for (let y = 0; y < 40; y += 3) { g.moveTo(cx, y); g.lineTo(cx + 2, y + 2); } g.stroke(); } }
  if (zone.id === 'necropolis') { g.strokeStyle = '#ffffff1a'; for (const [cx, cy] of [[8, 8], [312, 8]]) for (let r = 4; r < 22; r += 6) { g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke(); } g.fillStyle = '#9fc4ff18'; for (let k = 0; k < 50; k++) g.fillRect(rnd() * W, horizon + rnd() * 80, 1, 1); }
  if (zone.id === 'infierno') {
    // grietas de lava en el suelo y cadenas colgando
    g.strokeStyle = '#ff6a2a'; g.lineWidth = 1;
    for (let k = 0; k < 9; k++) { let x = rnd() * W, y = horizon + 10 + rnd() * 70; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 4; j++) { x += (rnd() - 0.5) * 18; y += rnd() * 4; g.lineTo(x, y); } g.stroke(); }
    g.strokeStyle = '#4a3a3a'; for (const cx of [30, 130, 290]) { g.beginPath(); for (let y = 0; y < 50; y += 3) { g.moveTo(cx, y); g.lineTo(cx + 2, y + 2); } g.stroke(); }
    g.fillStyle = '#ffb34755'; for (let k = 0; k < 40; k++) g.fillRect(rnd() * W, rnd() * horizon, 1, 1);
  }
  // Polvo y viñeta
  for (let k = 0; k < 50; k++) { g.fillStyle = `rgba(255,240,210,${0.08 + rnd() * 0.15})`; g.fillRect(rnd() * W, rnd() * H * 0.8, 1, 1); }
  const vg = g.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, 200); vg.addColorStop(0, '#0000'); vg.addColorStop(1, '#000a'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  const url = cv.toDataURL();
  cache.set(zone.id, url);
  return url;
}
