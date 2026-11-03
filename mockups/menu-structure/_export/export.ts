// Exporta los gráficos reales del juego (generados por código) a PNG para las maquetas de menús.
import * as Art from '../../../src/shared/art';
import { SHOWCASE_GEAR, starterEquipment } from '../../../src/shared/gearLook';
import { getItem } from '../../../src/core/data/items';
import { zoneBackdrop, ZONES } from '../../../src/game/ui/combatZones';
import type { Equipment } from '../../../src/core/types';
import { EQUIP_SLOTS } from '../../../src/core/types';
import { combatLoadout } from '../../../src/core/loadout';
import { computeStats } from '../../../src/core/stats';
import { getSkill } from '../../../src/core/data/skills';

const out: Record<string, string> = {};
const put = (k: string, c: HTMLCanvasElement) => (out[k] = c.toDataURL('image/png'));
const gear = (items: Record<string, string>): Equipment => {
  const eq = Object.fromEntries(EQUIP_SLOTS.map((s) => [s, null])) as Equipment;
  for (const [s, id] of Object.entries(items)) (eq as Record<string, unknown>)[s] = { uid: 'x' + id, itemId: id, qty: 1 };
  return eq;
};
const AP = { cloak: 0, skin: 0 };
const PLAYER = gear({ mainHand: 'knight_sword', offHand: 'iron_shield', helmet: 'knight_helm', armor: 'chainmail', gloves: 'gauntlets', boots: 'swift_boots', ring: 'copper_ring', amulet: 'bone_amulet' });
// Héroes
for (const f of [0, 1, 2, 3]) put(`hero_player_${f}`, Art.drawHumanoid(Art.heroSpec('warrior', AP, PLAYER), f));
put('hero_player_back', Art.drawHumanoidBack(Art.heroSpec('warrior', AP, PLAYER)));
const CLASS_AP: Record<string, { cloak: number; skin: number }> = { warrior: { cloak: 0, skin: 0 }, mage: { cloak: 3, skin: 1 }, rogue: { cloak: 2, skin: 0 }, cleric: { cloak: 1, skin: 1 } };
for (const c of ['warrior', 'mage', 'rogue', 'cleric'] as const) {
  for (const f of [0, 1, 2, 3]) put(`class_${c}_${f}`, Art.drawHumanoid(Art.heroSpec(c, CLASS_AP[c], SHOWCASE_GEAR[c]), f));
  put(`class_${c}_starter`, Art.drawHumanoid(Art.heroSpec(c, CLASS_AP[c], starterEquipment(c)), 0));
}
// Silueta vacía (sin equipo) para el alijo
put('hero_naked', Art.drawHumanoid(Art.heroSpec('warrior', AP, gear({})), 0));
// Retratos: la parte superior del sprite sobre fondo
const portrait = (src: HTMLCanvasElement, bg: string) => {
  const c = document.createElement('canvas'); c.width = 20; c.height = 16;
  const g = c.getContext('2d')!; g.fillStyle = bg; g.fillRect(0, 0, 20, 16);
  g.fillStyle = '#00000040'; g.fillRect(0, 12, 20, 4);
  g.drawImage(src, 0, 0, 20, 16, 0, 1, 20, 16);
  return c;
};
for (const c of ['warrior', 'mage', 'rogue', 'cleric'] as const) put(`portrait_${c}`, portrait(Art.drawHumanoid(Art.heroSpec(c, CLASS_AP[c], SHOWCASE_GEAR[c]), 0), '#1c1a22'));
for (const v of ['vendor_orvel', 'vendor_vesper', 'vendor_garra', 'vendor_brand']) {
  put(v, Art.drawHumanoid(Art.MONSTER_SPECS[v], 0));
  put(`portrait_${v}`, portrait(Art.drawHumanoid(Art.MONSTER_SPECS[v], 0), '#1c1a22'));
}
for (const m of ['skeleton', 'boss', 'wraith', 'tomb_knight', 'merc_bram', 'merc_nyx', 'rival']) put(`mon_${m}`, Art.drawHumanoid(Art.MONSTER_SPECS[m], 0));
put('mon_bat', Art.drawBat(0));
// Iconos de objetos
const ITEMS = ['knight_sword', 'iron_shield', 'knight_helm', 'chainmail', 'gauntlets', 'swift_boots', 'copper_ring', 'bone_amulet',
  'health_potion', 'mana_potion', 'antidote', 'bone_dust', 'old_coin', 'iron_key', 'bone_key', 'relic_key', 'miner_pick', 'iron_ore', 'copper_ore', 'silver_ore',
  'blessed_silver', 'golden_chalice', 'blood_gem', 'iron_sword', 'executioner_axe', 'ember_staff', 'archmage_robe', 'wizard_hat', 'leather_hood', 'padded_tunic',
  'worn_boots', 'leather_gloves', 'bastion_shield', 'arcane_tome', 'heart_of_umbravel', 'ring_of_embers', 'steel_pick', 'bat_wing', 'ancient_bone', 'sulfur', 'obsidian_shard', 'demon_blood', 'gilded_skull'];
for (const id of ITEMS) { try { const d = getItem(id); put(`item_${id}`, Art.drawIcon(d.icon)); out[`meta_${id}`] = JSON.stringify({ name: d.name, rarity: d.rarity, slot: d.slot ?? null, stats: d.stats ?? null, desc: d.description, value: d.value, stack: d.stack ?? 1, levelReq: d.levelReq ?? null }); } catch { /* no existe */ } }
for (const k of ['coin', 'key', 'potion_red', 'gem_red', 'pick', 'chalice', 'helm', 'tunic', 'sword', 'shield', 'robe_gold', 'staff_fire']) put(`icon_${k}`, Art.drawIcon(k));
put('nav_torch', Art.drawTorch(0)); put('nav_skull', Art.drawDecor('skull')); put('chest_common', Art.drawChest('common', false));
const lo = combatLoadout('warrior', PLAYER);
out.meta_loadout = JSON.stringify({ basic: lo.basicAttack, skills: lo.skills.map((id) => ({ id, ...getSkill(id) })) });
out.meta_stats = JSON.stringify({ lvl24: computeStats('warrior', 24, PLAYER), base24: computeStats('warrior', 24, gear({})) });
// Fondos de zona (320x180)
const img = (url: string) => new Promise<HTMLImageElement>((r) => { const i = new Image(); i.onload = () => r(i); i.src = url; });
const toCanvas = (i: HTMLImageElement) => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; c.getContext('2d')!.drawImage(i, 0, 0); return c; };
(async () => {
  for (const z of ['osario', 'cripta', 'cavernas', 'necropolis', 'infierno'] as const) put(`zone_${z}`, toCanvas(await img(zoneBackdrop(ZONES[z]))));
  // Escena del campamento (320x180), 4 fotogramas para el fuego
  for (let f = 0; f < 4; f++) put(`camp_${f}`, drawCamp(f));
  for (let f = 0; f < 6; f++) put(`prop_fire_${f}`, drawFire(f));
  put('prop_tent', drawTent()); put('prop_barrel', drawBarrel()); put('prop_crate', drawCrate());
  put('chest_rich', Art.drawChest('rich', false));
  put('portal', Art.drawPortal(0));
  (window as unknown as { __ASSETS__: Record<string, string> }).__ASSETS__ = out;
  document.title = 'listo';
})();

// ── Campamento (marcador provisional, minimalista): cielo, horizonte, suelo y hoguera ──
function drawCamp(frame: number): HTMLCanvasElement {
  const W = 320, H = 180;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  let seed = 4242; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  // Cielo y pocas estrellas
  for (let y = 0; y < 90; y++) { const t = y / 90; g.fillStyle = `rgb(${Math.round(9 + 12 * t)},${Math.round(8 + 8 * t)},${Math.round(14 + 12 * t)})`; g.fillRect(0, y, W, 1); }
  for (let k = 0; k < 26; k++) { g.fillStyle = rnd() > 0.7 ? '#bfb8a8' : '#4d4954'; g.fillRect(Math.floor(rnd() * W), Math.floor(rnd() * 64), 1, 1); }
  // Horizonte: una línea de colinas
  g.fillStyle = '#121017'; g.beginPath(); g.moveTo(0, 80); for (let x = 0; x <= W; x += 10) g.lineTo(x, 76 + Math.sin(x / 40) * 4); g.lineTo(W, 96); g.lineTo(0, 96); g.fill();
  // Suelo liso
  for (let y = 84; y < H; y++) { const t = (y - 84) / 96; g.fillStyle = `rgb(${Math.round(20 + 8 * t)},${Math.round(17 + 6 * t)},${Math.round(18 + 3 * t)})`; g.fillRect(0, y, W, 1); }
  // Viñeta
  const vg = g.createRadialGradient(W / 2, H / 2 + 20, 60, W / 2, H / 2, 200); vg.addColorStop(0, '#0000'); vg.addColorStop(1, '#000d'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  return c;
}

// ── Atrezo del campamento a la escala del héroe (marcadores provisionales) ──
function px(w: number, h: number) { const c = document.createElement('canvas'); c.width = w; c.height = h; return { c, g: c.getContext('2d')! }; }
function outline(c: HTMLCanvasElement) {
  const g = c.getContext('2d')!; const d = g.getImageData(0, 0, c.width, c.height); const o = g.createImageData(c.width, c.height);
  const a = (x: number, y: number) => x >= 0 && y >= 0 && x < c.width && y < c.height && d.data[(y * c.width + x) * 4 + 3] > 0;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (!a(x, y) && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) { const i = (y * c.width + x) * 4; o.data[i] = 10; o.data[i + 1] = 8; o.data[i + 2] = 12; o.data[i + 3] = 255; }
  g.putImageData(d, 0, 0); const t2 = px(c.width, c.height); t2.g.putImageData(o, 0, 0); g.drawImage(t2.c, 0, 0);
}
function drawTent(): HTMLCanvasElement {
  const { c, g } = px(44, 30);
  // lona: lado en sombra (izq) y lado iluminado por la hoguera (dcha)
  for (let y = 0; y < 26; y++) { const half = Math.round((y / 26) * 20); g.fillStyle = '#4a3a2c'; g.fillRect(22 - half, y + 3, half, 1); g.fillStyle = '#7a5a36'; g.fillRect(22, y + 3, half, 1); }
  g.fillStyle = '#a07040'; for (let y = 6; y < 29; y += 3) { const half = Math.round(((y - 3) / 26) * 20); g.fillRect(22 + half - 2, y, 2, 1); }
  // costuras
  g.fillStyle = '#3a2c20'; for (let y = 3; y < 29; y++) g.fillRect(22, y, 1, 1);
  // entrada oscura
  for (let y = 14; y < 29; y++) { const w = Math.round(((y - 14) / 15) * 6); g.fillStyle = '#120e0c'; g.fillRect(22 - w, y, w * 2, 1); }
  // mástil y banderín
  g.fillStyle = '#5a4026'; g.fillRect(21, 0, 2, 4); g.fillStyle = '#8a1c24'; g.fillRect(23, 0, 4, 2);
  // vientos y estacas
  g.fillStyle = '#6b6672'; g.fillRect(0, 29, 2, 1); g.fillRect(42, 29, 2, 1);
  outline(c); return c;
}
function drawBarrel(): HTMLCanvasElement {
  const { c, g } = px(9, 11);
  g.fillStyle = '#6b4a2a'; g.fillRect(1, 0, 7, 11); g.fillRect(0, 2, 9, 7);
  g.fillStyle = '#8a6036'; g.fillRect(5, 1, 2, 9); g.fillStyle = '#4a3420'; g.fillRect(1, 1, 2, 9);
  g.fillStyle = '#9aa4b0'; g.fillRect(0, 2, 9, 1); g.fillRect(0, 8, 9, 1);
  g.fillStyle = '#3a2a1a'; g.fillRect(2, 0, 5, 1);
  outline(c); return c;
}
function drawCrate(): HTMLCanvasElement {
  const { c, g } = px(10, 8);
  g.fillStyle = '#7a5a36'; g.fillRect(0, 0, 10, 8); g.fillStyle = '#5a4026'; g.fillRect(0, 0, 10, 1); g.fillRect(0, 7, 10, 1); g.fillRect(0, 0, 1, 8); g.fillRect(9, 0, 1, 8);
  for (let k = 0; k < 8; k++) g.fillRect(1 + k, 1 + Math.round(k * 0.75), 1, 1);
  outline(c); return c;
}
/** Hoguera animada (14×16): llamas por columnas que cambian de alto en cada fotograma, núcleo claro y chispas. */
function drawFire(f: number): HTMLCanvasElement {
  const { c, g } = px(14, 16);
  // leña y piedras
  g.fillStyle = '#4d4954'; for (const x of [0, 3, 7, 10]) g.fillRect(x, 14, 3, 2);
  g.fillStyle = '#3a2a1a'; g.fillRect(2, 13, 10, 1); g.fillStyle = '#5a4026'; g.fillRect(3, 12, 8, 1);
  const base = [0, 2, 4, 7, 9, 10, 9, 7, 5, 3, 1, 0];
  const noise = [[0, 1, 0, -1, 1, 0, 1, -1, 0, 1, 0, 0], [0, 0, 1, 1, -1, 1, 0, 1, -1, 0, 1, 0], [0, 1, -1, 0, 1, 1, -1, 0, 1, -1, 0, 0], [0, 0, 1, -1, 0, -1, 1, 1, 0, 1, -1, 0], [0, -1, 0, 1, 1, 0, 1, -1, 1, 0, 0, 0], [0, 1, 1, 0, -1, 1, 0, 1, -1, 1, 1, 0]][f];
  for (let i = 0; i < 12; i++) {
    const h = Math.max(0, base[i] + noise[i]);
    for (let y = 0; y < h; y++) {
      const r = y / Math.max(1, base[5]);
      g.fillStyle = r > 0.78 ? '#8a1c24' : r > 0.55 ? '#c4283b' : r > 0.3 ? '#e8752b' : '#ffd36a';
      g.fillRect(1 + i, 12 - y, 1, 1);
    }
  }
  g.fillStyle = '#fff2c0'; g.fillRect(6, 10, 2, 2);
  // lenguas sueltas y chispas
  const tips = [[5, 1], [8, 2], [6, 0], [7, 1], [4, 2], [9, 1]][f]; g.fillStyle = '#c4283b'; g.fillRect(tips[0], tips[1], 1, 1);
  g.fillStyle = '#ffd36a'; const sp = [[3, 3], [10, 1], [8, 4], [2, 0], [11, 3], [5, 2]]; g.fillRect(sp[f][0], sp[f][1], 1, 1);
  return c;
}
