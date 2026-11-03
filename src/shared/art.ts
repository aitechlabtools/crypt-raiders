// ════════════════════════════════════════════════════════════════════
// Generador de pixel art procedural de Crypt Raiders.
// Todo el arte de la demo se dibuja por código: es original, no depende de
// archivos externos y se comparte entre el juego (Phaser), la interfaz y la web.
// Son placeholders coherentes: ver docs/ASSETS.md para su sustitución.
// ════════════════════════════════════════════════════════════════════
import { PAL, shade, CLOAK_COLORS, SKIN_COLORS } from './palette';
import type { Appearance, ClassId, Equipment } from '../core/types';
import { EQUIP_SLOTS } from '../core/types';
import { lookOf, lookSignature, starterEquipment } from './gearLook';

export type Canvas = HTMLCanvasElement;

function canvas(w: number, h: number): [Canvas, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

/** Hash determinista para ruido de texturas. */
function hash(x: number, y: number, s: number): number {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

class Pix {
  c: Canvas;
  ctx: CanvasRenderingContext2D;
  constructor(public w: number, public h: number) {
    [this.c, this.ctx] = canvas(w, h);
  }
  px(x: number, y: number, col: string) {
    this.ctx.fillStyle = col;
    this.ctx.fillRect(x, y, 1, 1);
  }
  rect(x: number, y: number, w: number, h: number, col: string) {
    this.ctx.fillStyle = col;
    this.ctx.fillRect(x, y, w, h);
  }
  /** Contorno oscuro de 1px alrededor de los píxeles opacos. */
  outline(col = PAL.outline) {
    const img = this.ctx.getImageData(0, 0, this.w, this.h);
    const d = img.data;
    const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < this.w && y < this.h && d[(y * this.w + x) * 4 + 3] > 0;
    const out: [number, number][] = [];
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++)
        if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) out.push([x, y]);
    for (const [x, y] of out) this.px(x, y, col);
    return this;
  }
  mirror(): Canvas {
    const [c, ctx] = canvas(this.w, this.h);
    ctx.translate(this.w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(this.c, 0, 0);
    return c;
  }
}

// ── Personajes ────────────────────────────────────────────────────────

export interface HumanoidSpec {
  skin: string;
  hair?: string;
  torso: string;
  trim: string;
  legs: string;
  boots: string;
  cape?: string;
  head: 'helmet' | 'hood' | 'wizard' | 'hair' | 'skull' | 'crown' | 'hoodskull';
  headColor?: string;
  /** Cinta del sombrero. */
  hatTrim?: string;
  weapon: 'sword' | 'axe' | 'staff' | 'dagger' | 'mace' | 'greatsword' | 'none';
  /** Color de la hoja (espadas, hachas, dagas) o del asta (báculos). */
  weaponColor?: string;
  orb?: string;
  offhand?: 'shield' | 'dagger' | 'tome' | 'none';
  shieldColor?: string;
  shieldRim?: string;
  shieldEmblem?: string;
  tomeColor?: string;
  /** Estilo del torso: túnica/jubón, cota de malla o túnica larga que tapa las piernas. */
  torsoStyle?: 'tunic' | 'mail' | 'robe' | 'shirt';
  /** Color de las manos si lleva guantes. */
  hands?: string;
  /** Colgante visible en el pecho. */
  amulet?: string;
  ribs?: boolean;
  eye?: string;
}

export const HUM_W = 20;
export const HUM_H = 26;

/** Dibuja un humanoide frontal. frame 0 = reposo, 1/3 = paso, 2 = reposo alterno. */
export function drawHumanoid(s: HumanoidSpec, frame = 0, pose: 'idle' | 'attack' | 'hurt' = 'idle'): Canvas {
  const p = new Pix(HUM_W, HUM_H);
  const bob = frame === 1 || frame === 3 ? -1 : 0;
  const lLeg = frame === 1 ? -1 : 0;
  const rLeg = frame === 3 ? -1 : 0;
  const armSwing = frame === 1 ? 1 : frame === 3 ? -1 : 0;
  const y0 = bob;
  const skinShade = shade(s.skin, -0.25);

  // Capa (detrás)
  if (s.cape) {
    p.rect(6, 11 + y0, 8, 10, s.cape);
    p.rect(6, 20 + y0, 8, 1, shade(s.cape, -0.3));
    p.rect(13, 11 + y0, 1, 10, shade(s.cape, -0.25));
  }
  // Piernas
  const legCol = s.ribs ? s.skin : s.legs;
  const legW = s.ribs ? 1 : 2;
  p.rect(7 + (s.ribs ? 1 : 0), 18 + y0 + lLeg, legW, 5 - lLeg - y0, legCol);
  p.rect(11, 18 + y0 + rLeg, legW, 5 - rLeg - y0, legCol);
  p.rect(7, 22 + lLeg, 2, 2, s.boots);
  p.rect(11, 22 + rLeg, 2, 2, s.boots);
  // Torso
  if (s.torsoStyle === 'robe' && !s.ribs) {
    p.rect(6, 17 + y0, 8, 5 - y0, s.torso);
    p.rect(13, 17 + y0, 1, 5 - y0, shade(s.torso, -0.3));
    p.rect(6, 21, 8, 1, shade(s.torso, -0.2));
    p.rect(9, 17 + y0, 1, 5 - y0, s.trim);
  }
  if (s.ribs) {
    p.rect(9, 11 + y0, 2, 8, s.skin); // columna
    for (let r = 0; r < 3; r++) p.rect(7, 12 + r * 2 + y0, 6, 1, s.skin);
    p.rect(7, 18 + y0, 6, 1, skinShade); // pelvis
    if (s.torso !== s.skin) {
      p.rect(6, 11 + y0, 8, 2, s.torso); // hombreras / harapos
      p.rect(6, 16 + y0, 8, 2, s.torso);
    }
  } else {
    p.rect(6, 11 + y0, 8, 8, s.torso);
    p.rect(6, 11 + y0, 1, 8, shade(s.torso, 0.15));
    p.rect(13, 11 + y0, 1, 8, shade(s.torso, -0.3));
    p.rect(7, 11 + y0, 6, 1, s.trim);
    p.rect(6, 17 + y0, 8, 1, s.trim);
    p.px(10, 17 + y0, PAL.gold2);
    if (s.torsoStyle === 'mail') {
      // Anillas: punteado claro sobre el metal
      for (let yy = 12; yy < 17; yy++) for (let xx = 7; xx < 13; xx++) if ((xx + yy) % 2 === 0) p.px(xx, yy + y0, shade(s.torso, 0.3));
    } else if (s.torsoStyle === 'robe') {
      p.rect(9, 12 + y0, 1, 5, s.trim);
    } else if (s.torsoStyle === 'shirt') {
      p.rect(9, 11 + y0, 2, 2, shade(s.torso, -0.25)); // cuello abierto
    }
    if (s.amulet) {
      p.px(8, 12 + y0, PAL.gold1);
      p.px(11, 12 + y0, PAL.gold1);
      p.rect(9, 13 + y0, 2, 2, s.amulet);
      p.px(9, 13 + y0, shade(s.amulet, 0.45));
    }
  }
  // Brazos
  const sleeve = s.ribs ? s.skin : shade(s.torso, -0.1);
  const attackLift = pose === 'attack' ? -3 : 0;
  p.rect(5, 12 + y0 - armSwing, 1, 5, sleeve);
  p.rect(14, 12 + y0 + armSwing + attackLift, 1, 5, sleeve);
  const hand = s.hands ?? s.skin;
  p.px(5, 17 + y0 - armSwing, hand);
  p.px(14, 17 + y0 + armSwing + attackLift, hand);
  if (s.hands) {
    p.px(5, 16 + y0 - armSwing, shade(s.hands, -0.2));
    p.px(14, 16 + y0 + armSwing + attackLift, shade(s.hands, -0.2));
  }
  // Cabeza
  const hy = 5 + y0;
  p.rect(7, hy, 6, 6, s.skin);
  p.rect(12, hy, 1, 6, skinShade);
  const eye = s.eye ?? PAL.outline;
  if (s.head === 'skull' || s.head === 'crown' || s.head === 'hoodskull') {
    p.rect(8, hy + 2, 2, 2, PAL.outline);
    p.rect(11, hy + 2, 1, 2, PAL.outline);
    p.px(8, hy + 3, eye);
    p.px(11, hy + 3, eye);
    p.rect(8, hy + 5, 4, 1, skinShade);
    p.px(9, hy + 5, PAL.outline);
    p.px(11, hy + 5, PAL.outline);
  } else {
    p.px(8, hy + 3, eye);
    p.px(11, hy + 3, eye);
    p.px(10, hy + 4, skinShade);
  }
  const hc = s.headColor ?? s.hair ?? PAL.earth1;
  switch (s.head) {
    case 'hair':
      p.rect(7, hy - 1, 6, 2, hc);
      p.px(7, hy + 1, hc);
      p.px(12, hy + 1, hc);
      p.rect(6, hy, 1, 4, hc);
      break;
    case 'helmet':
      p.rect(6, hy - 2, 8, 4, hc);
      p.rect(6, hy + 2, 1, 4, hc);
      p.rect(13, hy + 2, 1, 4, shade(hc, -0.3));
      p.rect(7, hy - 2, 2, 1, shade(hc, 0.4));
      p.rect(8, hy + 2, 4, 1, PAL.outline);
      p.rect(10, hy + 2, 1, 3, hc);
      p.rect(13, hy - 2, 1, 4, shade(hc, -0.3));
      p.px(10, hy - 3, PAL.threat2);
      break;
    case 'hood':
    case 'hoodskull':
      p.rect(6, hy - 2, 8, 3, hc);
      p.rect(6, hy + 1, 1, 5, hc);
      p.rect(13, hy + 1, 1, 5, shade(hc, -0.3));
      p.rect(7, hy + 1, 6, 1, shade(s.skin, -0.5));
      p.px(9, hy - 3, hc);
      p.px(10, hy - 3, hc);
      break;
    case 'wizard':
      p.rect(5, hy, 10, 1, hc);
      p.rect(7, hy - 2, 6, 2, hc);
      p.rect(8, hy - 4, 4, 2, hc);
      p.rect(9, hy - 5, 2, 1, hc);
      p.px(11, hy - 6, hc);
      p.rect(7, hy - 1, 6, 1, s.hatTrim ?? s.trim);
      p.px(9, hy - 3, PAL.gold3);
      p.rect(12, hy - 2, 1, 2, shade(hc, -0.3));
      break;
    case 'crown':
      p.rect(7, hy - 2, 6, 2, PAL.gold2);
      p.px(7, hy - 3, PAL.gold2);
      p.px(9, hy - 3, PAL.gold2);
      p.px(12, hy - 3, PAL.gold2);
      p.px(10, hy - 2, PAL.threat2);
      p.rect(12, hy - 2, 1, 2, PAL.gold1);
      break;
    case 'skull':
      break;
  }
  // Arma (mano derecha, x≈15)
  const wy = 12 + y0 + armSwing + attackLift;
  switch (s.weapon) {
    case 'sword': {
      const blade = s.weaponColor ?? PAL.steel2;
      p.rect(15, wy - 7, 1, 10, blade);
      p.px(15, wy - 8, shade(blade, 0.4));
      p.rect(14, wy + 3, 3, 1, PAL.gold1);
      p.rect(15, wy + 4, 1, 2, PAL.earth1);
      break;
    }
    case 'axe': {
      const head = s.weaponColor ?? PAL.steel2;
      p.rect(15, wy - 6, 1, 12, PAL.earth1);
      p.rect(16, wy - 6, 2, 4, head);
      p.rect(16, wy - 7, 1, 1, head);
      p.rect(16, wy - 2, 1, 1, head);
      p.px(17, wy - 5, shade(head, 0.4));
      break;
    }
    case 'greatsword':
      p.rect(15, wy - 10, 2, 13, PAL.bone1);
      p.rect(15, wy - 10, 1, 13, PAL.bone2);
      p.rect(13, wy + 3, 6, 1, PAL.magic1);
      p.rect(15, wy + 4, 2, 2, PAL.earth0);
      break;
    case 'staff':
      p.rect(15, wy - 9, 1, 19, s.weaponColor ?? PAL.earth2);
      p.rect(14, wy - 12, 3, 3, s.orb ?? PAL.magic2);
      p.px(14, wy - 12, PAL.bone3);
      break;
    case 'dagger':
      p.rect(15, wy - 2, 1, 4, s.weaponColor ?? PAL.steel2);
      p.px(15, wy - 3, shade(s.weaponColor ?? PAL.steel2, 0.4));
      p.rect(14, wy + 2, 3, 1, PAL.earth1);
      break;
    case 'mace':
      p.rect(15, wy - 3, 1, 8, PAL.earth2);
      p.rect(14, wy - 6, 3, 3, PAL.gold2);
      p.px(14, wy - 6, PAL.gold3);
      break;
  }
  // Mano izquierda
  if (s.offhand === 'shield') {
    const sc = s.shieldColor ?? PAL.earth2;
    p.rect(2, 12 + y0 - armSwing, 4, 6, sc);
    p.rect(2, 12 + y0 - armSwing, 4, 1, s.shieldRim ?? PAL.steel1);
    p.rect(3, 17 + y0 - armSwing, 2, 1, sc);
    p.px(3, 14 + y0 - armSwing, s.shieldEmblem ?? PAL.gold2);
    p.px(4, 14 + y0 - armSwing, s.shieldEmblem ?? PAL.gold2);
    p.rect(2, 13 + y0 - armSwing, 1, 4, shade(sc, 0.2));
    if (s.shieldRim) p.rect(5, 13 + y0 - armSwing, 1, 4, s.shieldRim);
  } else if (s.offhand === 'tome') {
    const tc = s.tomeColor ?? PAL.magic1;
    p.rect(2, 14 + y0 - armSwing, 4, 4, tc);
    p.rect(3, 14 + y0 - armSwing, 3, 1, PAL.bone3);
    p.px(3, 16 + y0 - armSwing, PAL.gold2);
  } else if (s.offhand === 'dagger') {
    p.rect(4, 15 + y0 - armSwing, 1, 4, PAL.steel2);
  }
  if (pose === 'hurt') {
    const img = p.ctx.getImageData(0, 0, p.w, p.h);
    for (let i = 0; i < img.data.length; i += 4) {
      if (img.data[i + 3] === 0) continue;
      img.data[i] = Math.min(255, img.data[i] * 0.6 + 120);
      img.data[i + 1] *= 0.55;
      img.data[i + 2] *= 0.55;
    }
    p.ctx.putImageData(img, 0, 0);
  }
  p.outline();
  return p.c;
}

/** El mismo personaje visto de espaldas (para el combate en primer plano): sin cara, con la capa y el pelo/casco por detrás. */
export function drawHumanoidBack(s: HumanoidSpec, pose: 'idle' | 'attack' | 'hurt' = 'idle'): Canvas {
  const p = new Pix(HUM_W, HUM_H);
  const attackLift = pose === 'attack' ? -3 : 0;
  // Arma (sujeta en la mano derecha, que de espaldas queda a la derecha de la pantalla)
  const wy = 12 + attackLift;
  const blade = s.weaponColor ?? PAL.steel2;
  switch (s.weapon) {
    case 'sword': p.rect(15, wy - 7, 1, 10, blade); p.px(15, wy - 8, shade(blade, 0.4)); p.rect(14, wy + 3, 3, 1, PAL.gold1); break;
    case 'axe': p.rect(15, wy - 6, 1, 12, PAL.earth1); p.rect(16, wy - 6, 2, 4, shade(blade, -0.15)); break;
    case 'greatsword': p.rect(15, wy - 10, 2, 13, PAL.bone2); p.rect(13, wy + 3, 6, 1, PAL.magic1); break;
    case 'staff': p.rect(15, wy - 9, 1, 19, s.weaponColor ?? PAL.earth2); p.rect(14, wy - 12, 3, 3, s.orb ?? PAL.magic2); break;
    case 'dagger': p.rect(15, wy - 2, 1, 4, blade); break;
    case 'mace': p.rect(15, wy - 3, 1, 8, PAL.earth2); p.rect(14, wy - 6, 3, 3, PAL.gold2); break;
  }
  // Piernas y botas
  const legCol = s.ribs ? s.skin : s.legs;
  p.rect(7, 18, 2, 5, legCol); p.rect(11, 18, 2, 5, legCol);
  p.rect(7, 22, 2, 2, shade(s.boots, -0.1)); p.rect(11, 22, 2, 2, shade(s.boots, -0.1));
  // Espalda
  p.rect(6, 11, 8, 8, shade(s.torso, -0.08));
  p.rect(6, 11, 1, 8, shade(s.torso, 0.1)); p.rect(13, 11, 1, 8, shade(s.torso, -0.3));
  if (s.torsoStyle === 'mail') for (let yy = 12; yy < 18; yy++) for (let xx = 7; xx < 13; xx++) if ((xx + yy) % 2 === 0) p.px(xx, yy, shade(s.torso, 0.22));
  if (s.torsoStyle === 'robe') { p.rect(6, 17, 8, 5, shade(s.torso, -0.08)); p.rect(13, 17, 1, 5, shade(s.torso, -0.3)); }
  p.rect(6, 17, 8, 1, s.trim);
  // Brazos
  const sleeve = shade(s.torso, -0.15);
  p.rect(5, 12, 1, 5, sleeve); p.rect(14, 12 + attackLift, 1, 5, sleeve);
  const hand = s.hands ?? s.skin;
  p.px(5, 17, hand); p.px(14, 17 + attackLift, hand);
  // Capa: de espaldas es lo que más se ve
  if (s.cape) {
    p.rect(7, 12, 6, 9, s.cape);
    p.rect(6, 14, 1, 7, s.cape); p.rect(13, 14, 1, 7, s.cape);
    p.rect(7, 12, 6, 1, shade(s.cape, 0.2));
    p.rect(9, 12, 1, 8, shade(s.cape, -0.18)); p.rect(12, 12, 1, 8, shade(s.cape, -0.18));
    p.rect(6, 20, 8, 1, shade(s.cape, -0.3));
    p.rect(13, 14, 1, 7, shade(s.cape, -0.28));
  }
  // Cabeza por detrás: nuca, pelo, casco, capucha o sombrero
  const hy = 5;
  const hc = s.headColor ?? s.hair ?? PAL.earth1;
  p.rect(7, hy, 6, 6, shade(s.skin, -0.2)); // nuca
  switch (s.head) {
    case 'helmet':
      p.rect(6, hy - 2, 8, 8, hc); p.rect(13, hy - 2, 1, 8, shade(hc, -0.3)); p.rect(7, hy - 2, 2, 1, shade(hc, 0.4));
      p.rect(9, hy - 1, 2, 6, shade(hc, -0.15)); p.px(10, hy - 3, PAL.threat2); p.px(10, hy - 4, PAL.threat2);
      break;
    case 'hood': case 'hoodskull':
      p.rect(6, hy - 2, 8, 8, hc); p.rect(13, hy - 1, 1, 7, shade(hc, -0.3)); p.rect(8, hy + 5, 4, 2, hc); p.px(9, hy - 3, hc); p.px(10, hy - 3, hc);
      break;
    case 'wizard':
      p.rect(7, hy + 1, 6, 4, s.hair ?? PAL.bone1);
      p.rect(5, hy, 10, 1, hc); p.rect(7, hy - 2, 6, 2, hc); p.rect(8, hy - 4, 4, 2, hc); p.rect(9, hy - 5, 2, 1, hc); p.px(8, hy - 6, hc);
      p.rect(7, hy - 1, 6, 1, s.hatTrim ?? s.trim); p.rect(12, hy - 2, 1, 2, shade(hc, -0.3));
      break;
    case 'crown':
      p.rect(7, hy, 6, 5, s.skin); p.rect(7, hy - 2, 6, 2, PAL.gold2); p.px(7, hy - 3, PAL.gold2); p.px(12, hy - 3, PAL.gold2);
      break;
    default: // pelo
      p.rect(6, hy - 1, 8, 6, hc); p.rect(7, hy - 1, 5, 1, shade(hc, 0.25)); p.rect(13, hy, 1, 5, shade(hc, -0.3)); p.rect(8, hy + 5, 4, 1, hc);
  }
  // Escudo o tomo por detrás (en la mano izquierda)
  if (s.offhand === 'shield') {
    const sc = shade(s.shieldColor ?? PAL.earth2, -0.25);
    p.rect(2, 12, 4, 6, sc); p.rect(2, 12, 4, 1, s.shieldRim ?? PAL.steel1); p.rect(3, 17, 2, 1, sc);
    p.rect(3, 13, 2, 1, PAL.earth0); p.rect(3, 15, 2, 1, PAL.earth0); // correas
  } else if (s.offhand === 'tome') {
    p.rect(2, 14, 4, 4, shade(s.tomeColor ?? PAL.magic1, -0.2)); p.rect(2, 14, 1, 4, PAL.gold1);
  } else if (s.offhand === 'dagger') {
    p.rect(4, 15, 1, 4, PAL.steel2);
  }
  if (pose === 'hurt') {
    const img = p.ctx.getImageData(0, 0, p.w, p.h);
    for (let i = 0; i < img.data.length; i += 4) {
      if (img.data[i + 3] === 0) continue;
      img.data[i] = Math.min(255, img.data[i] * 0.6 + 120); img.data[i + 1] *= 0.55; img.data[i + 2] *= 0.55;
    }
    p.ctx.putImageData(img, 0, 0);
  }
  p.outline();
  return p.c;
}

const CLASS_HAIR: Record<ClassId, string> = { warrior: PAL.earth1, mage: PAL.bone1, rogue: PAL.earth0, cleric: PAL.gold1 };

/**
 * Aspecto del héroe a partir de lo que lleva equipado.
 * Sin equipo: camisa, pantalón, pelo al aire, manos vacías y sandalias.
 * Si no se indica equipo, se usa el equipo inicial de la clase.
 */
export function heroSpec(classId: ClassId, ap: Appearance, equipment?: Equipment): HumanoidSpec {
  const eq = equipment ?? starterEquipment(classId);
  const cloak = CLOAK_COLORS[ap.cloak % CLOAK_COLORS.length];
  const skin = SKIN_COLORS[ap.skin % SKIN_COLORS.length];
  const spec: HumanoidSpec = {
    skin, hair: CLASS_HAIR[classId], torso: '#8a7d68', trim: '#5c5244', legs: PAL.earth1, boots: '#3a2a1e',
    cape: cloak, head: 'hair', headColor: CLASS_HAIR[classId], weapon: 'none', offhand: 'none', torsoStyle: 'shirt',
  };
  for (const slot of EQUIP_SLOTS) {
    const it = eq[slot];
    const look = it ? lookOf(it.itemId) : null;
    if (!look) continue;
    switch (look.slot) {
      case 'mainHand':
        spec.weapon = look.shape;
        spec.weaponColor = look.color;
        spec.orb = look.orb;
        break;
      case 'offHand':
        if (look.shape === 'shield') Object.assign(spec, { offhand: 'shield', shieldColor: look.color, shieldRim: look.rim, shieldEmblem: look.emblem });
        else Object.assign(spec, { offhand: 'tome', tomeColor: look.color });
        break;
      case 'helmet':
        spec.head = look.shape;
        spec.headColor = look.color;
        spec.hatTrim = look.trim;
        break;
      case 'armor':
        spec.torsoStyle = look.style;
        spec.torso = look.color;
        spec.trim = look.trim;
        if (look.style === 'robe') spec.legs = shade(look.color, -0.3);
        break;
      case 'gloves':
        spec.hands = look.color;
        break;
      case 'boots':
        spec.boots = look.color;
        break;
      case 'amulet':
        spec.amulet = look.color;
        break;
    }
  }
  return spec;
}

export const MONSTER_SPECS: Record<string, HumanoidSpec> = {
  skeleton: { skin: PAL.bone2, torso: PAL.earth1, trim: PAL.earth1, legs: PAL.bone2, boots: PAL.bone1, head: 'skull', weapon: 'sword', offhand: 'shield', shieldColor: PAL.earth1, ribs: true, eye: PAL.threat3 },
  boss: { skin: PAL.bone2, torso: PAL.magic0, trim: PAL.magic1, legs: PAL.bone2, boots: PAL.bone1, cape: PAL.threat0, head: 'crown', weapon: 'greatsword', ribs: true, eye: PAL.magic3 },
  rival: { skin: SKIN_COLORS[1], torso: PAL.earth1, trim: PAL.earth3, legs: PAL.stone1, boots: PAL.earth0, cape: PAL.moss0, head: 'hood', headColor: PAL.moss1, weapon: 'dagger', offhand: 'dagger', eye: PAL.gold3 },
  // ── Vendedores del refugio ──
  vendor_orvel: { skin: SKIN_COLORS[0], torso: PAL.earth2, trim: PAL.gold1, legs: PAL.earth1, boots: PAL.earth0, cape: PAL.earth1, head: 'hair', headColor: PAL.bone1, weapon: 'none', torsoStyle: 'tunic', amulet: PAL.gold2 },
  vendor_vesper: { skin: SKIN_COLORS[0], torso: PAL.night1, trim: PAL.bone2, legs: PAL.night1, boots: PAL.night0, cape: PAL.bone1, head: 'hood', headColor: PAL.bone2, weapon: 'staff', weaponColor: PAL.bone1, orb: PAL.ice, torsoStyle: 'robe', eye: PAL.ice },
  vendor_garra: { skin: SKIN_COLORS[1], torso: PAL.steel1, trim: PAL.threat2, legs: PAL.stone2, boots: PAL.earth0, cape: PAL.threat1, head: 'hair', headColor: PAL.threat1, weapon: 'sword', weaponColor: PAL.steel3, offhand: 'shield', shieldColor: PAL.threat1, shieldRim: PAL.steel2, torsoStyle: 'mail' },
  vendor_brand: { skin: SKIN_COLORS[2], torso: PAL.earth1, trim: PAL.fire1, legs: PAL.stone1, boots: PAL.earth0, head: 'hair', headColor: PAL.outline, weapon: 'mace', torsoStyle: 'tunic', hands: PAL.steel1 },
  // ── Mercenarios de Garra Roja ──
  merc_bram: { skin: SKIN_COLORS[1], torso: PAL.moss1, trim: PAL.earth1, legs: PAL.earth1, boots: PAL.earth0, head: 'hair', headColor: PAL.earth3, weapon: 'axe', weaponColor: PAL.steel2, torsoStyle: 'shirt', hands: PAL.earth2 },
  merc_lysa: { skin: SKIN_COLORS[0], torso: PAL.earth2, trim: PAL.moss2, legs: PAL.stone2, boots: PAL.earth0, cape: PAL.moss0, head: 'hood', headColor: PAL.moss1, weapon: 'dagger', weaponColor: PAL.steel3, offhand: 'dagger', torsoStyle: 'tunic', eye: PAL.gold3 },
  merc_tobias: { skin: SKIN_COLORS[0], torso: PAL.earth1, trim: PAL.fire1, legs: PAL.earth1, boots: PAL.earth0, head: 'wizard', headColor: PAL.earth2, hatTrim: PAL.fire1, weapon: 'staff', weaponColor: PAL.earth2, orb: PAL.fire2, torsoStyle: 'robe' },
  merc_ysolde: { skin: SKIN_COLORS[0], torso: '#cfd8e3', trim: PAL.ice, legs: PAL.steel1, boots: PAL.steel0, cape: PAL.night1, head: 'helmet', headColor: '#dfe5ec', weapon: 'sword', weaponColor: '#e8ecf2', offhand: 'shield', shieldColor: '#cfd8e3', shieldRim: PAL.gold2, shieldEmblem: PAL.ice, torsoStyle: 'mail' },
  merc_corvin: { skin: SKIN_COLORS[2], torso: '#2f3542', trim: PAL.bone2, legs: '#2a3240', boots: PAL.night0, cape: '#3d4a5c', head: 'hood', headColor: '#3d4a5c', weapon: 'axe', weaponColor: '#b9c7d6', torsoStyle: 'tunic', eye: PAL.ice },
  merc_mirra: { skin: SKIN_COLORS[1], torso: '#e8ecf2', trim: PAL.gold2, legs: '#e8ecf2', boots: PAL.earth0, head: 'hood', headColor: '#e8ecf2', weapon: 'mace', weaponColor: PAL.gold2, offhand: 'tome', tomeColor: PAL.gold1, torsoStyle: 'robe', amulet: PAL.gold3 },
  merc_draven: { skin: SKIN_COLORS[1], torso: '#4a1a1a', trim: PAL.fire1, legs: PAL.stone1, boots: '#2a1010', cape: '#3a0a0a', head: 'hair', headColor: PAL.outline, weapon: 'greatsword', weaponColor: '#3a2a3a', torsoStyle: 'mail', eye: PAL.fire2 },
  merc_nyx: { skin: SKIN_COLORS[0], torso: '#3a1418', trim: PAL.fire2, legs: '#2a1010', boots: PAL.night0, cape: PAL.fire0, head: 'hair', headColor: PAL.fire1, weapon: 'staff', weaponColor: PAL.earth0, orb: PAL.fire2, offhand: 'tome', tomeColor: PAL.fire0, torsoStyle: 'robe', eye: PAL.fire2 },
  merc_ulric: { skin: SKIN_COLORS[2], torso: PAL.stone2, trim: '#6b6672', legs: PAL.stone1, boots: PAL.earth0, head: 'hair', headColor: PAL.stone1, weapon: 'mace', weaponColor: '#6b6672', torsoStyle: 'shirt', hands: '#6b6672' },
  // ── Mazmorra ──
  bandit: { skin: SKIN_COLORS[0], torso: PAL.earth2, trim: PAL.earth0, legs: PAL.stone2, boots: PAL.earth0, head: 'hood', headColor: PAL.threat1, weapon: 'dagger', offhand: 'none', torsoStyle: 'tunic', eye: PAL.outline },
  archer: { skin: SKIN_COLORS[1], torso: PAL.moss1, trim: PAL.earth1, legs: PAL.earth1, boots: PAL.earth0, cape: PAL.moss0, head: 'hood', headColor: PAL.moss2, weapon: 'staff', weaponColor: PAL.earth2, orb: PAL.earth1, torsoStyle: 'tunic' },
  captain: { skin: SKIN_COLORS[0], torso: PAL.steel1, trim: PAL.threat1, legs: PAL.stone2, boots: PAL.earth0, cape: PAL.threat1, head: 'hair', headColor: PAL.earth0, weapon: 'sword', weaponColor: PAL.steel3, offhand: 'shield', shieldColor: PAL.threat1, shieldRim: PAL.gold1, torsoStyle: 'mail' },
  // ── Cripta ──
  wraith: { skin: '#b9c7d6', torso: '#5c6b80', trim: '#8fa8c8', legs: '#3d4a5c', boots: '#2a3240', cape: '#3d4a5c', head: 'hoodskull', headColor: '#6f7f96', weapon: 'none', torsoStyle: 'robe', eye: PAL.ice },
  ghoul: { skin: '#7d8f6a', torso: PAL.stone2, trim: PAL.stone1, legs: '#7d8f6a', boots: PAL.stone1, head: 'skull', weapon: 'none', ribs: true, eye: PAL.threat3, hands: '#5a6b48' },
  tomb_guardian: { skin: PAL.bone1, torso: PAL.steel0, trim: PAL.gold0, legs: PAL.steel0, boots: PAL.stone1, head: 'helmet', headColor: PAL.steel1, weapon: 'axe', weaponColor: PAL.steel2, offhand: 'shield', shieldColor: PAL.stone3, shieldRim: PAL.steel2, shieldEmblem: PAL.bone2, torsoStyle: 'mail', eye: PAL.ice },
  necro_priest: { skin: PAL.bone2, torso: PAL.night1, trim: PAL.magic2, legs: PAL.night0, boots: PAL.night0, head: 'hoodskull', headColor: PAL.night0, weapon: 'staff', weaponColor: PAL.bone1, orb: PAL.moss2, torsoStyle: 'robe', eye: '#7cff9a' },
  bone_archer: { skin: PAL.bone1, torso: PAL.earth0, trim: PAL.earth1, legs: PAL.bone1, boots: PAL.bone0, head: 'skull', weapon: 'staff', weaponColor: PAL.bone0, orb: PAL.bone1, ribs: true, eye: PAL.ice },
  tomb_knight: { skin: PAL.bone2, torso: PAL.steel1, trim: PAL.ice, legs: PAL.bone2, boots: PAL.steel0, cape: PAL.night1, head: 'helmet', headColor: PAL.steel2, weapon: 'greatsword', ribs: true, eye: PAL.ice },
  veiled_queen: { skin: '#cfd8e3', torso: '#e8ecf2', trim: PAL.ice, legs: '#cfd8e3', boots: '#9fb0c4', cape: '#6f7f96', head: 'crown', weapon: 'staff', weaponColor: '#9fb0c4', orb: PAL.ice, torsoStyle: 'robe', eye: PAL.ice },
  // ── Infierno ──
  imp: { skin: PAL.threat2, torso: PAL.threat1, trim: PAL.fire1, legs: PAL.threat1, boots: PAL.threat0, head: 'skull', weapon: 'dagger', weaponColor: PAL.fire2, eye: PAL.fire3, hands: PAL.threat0 },
  temptress: { skin: '#c9786a', torso: PAL.threat0, trim: PAL.gold2, legs: '#c9786a', boots: PAL.threat0, cape: PAL.threat1, head: 'hair', headColor: '#1a0e14', weapon: 'dagger', weaponColor: PAL.threat2, torsoStyle: 'robe', eye: PAL.fire2 },
  hell_knight: { skin: PAL.threat1, torso: '#2a1414', trim: PAL.fire1, legs: '#2a1414', boots: PAL.outline, cape: PAL.threat0, head: 'helmet', headColor: '#3a1a1a', weapon: 'sword', weaponColor: PAL.fire1, offhand: 'shield', shieldColor: '#3a1a1a', shieldRim: PAL.fire1, shieldEmblem: PAL.fire2, torsoStyle: 'mail', eye: PAL.fire2 },
  sulfur_caller: { skin: '#d9c06a', torso: '#4a3a10', trim: '#e8d24a', legs: '#2a2008', boots: '#1a1404', head: 'hood', headColor: '#6b5a14', weapon: 'staff', weaponColor: PAL.earth0, orb: '#e8d24a', torsoStyle: 'robe', eye: '#ffef6a' },
  chain_warden: { skin: PAL.stone3, torso: PAL.steel0, trim: PAL.fire1, legs: PAL.stone2, boots: PAL.outline, head: 'helmet', headColor: PAL.stone2, weapon: 'mace', offhand: 'shield', shieldColor: PAL.stone2, shieldRim: PAL.steel1, torsoStyle: 'mail', eye: PAL.fire2 },
  belzar: { skin: PAL.threat1, torso: '#1a0a0a', trim: PAL.gold2, legs: '#2a1010', boots: PAL.outline, cape: PAL.threat0, head: 'crown', weapon: 'greatsword', torsoStyle: 'mail', eye: PAL.fire3, hands: PAL.outline },
};

/** Criaturas de cuatro patas (rata, can del abismo): 4 fotogramas de trote. */
export const BEAST_SPECS: Record<string, { body: string; belly: string; eye: string; big: boolean }> = {
  rat: { body: '#5a4a44', belly: '#8a7a6c', eye: PAL.threat3, big: false },
  hound: { body: '#3a1414', belly: PAL.fire1, eye: PAL.fire3, big: true },
};
export function drawBeast(kind: string, frame: number, hurt = false): Canvas {
  const b = BEAST_SPECS[kind] ?? BEAST_SPECS.rat;
  const p = new Pix(24, 18);
  const body = hurt ? PAL.threat2 : b.body, belly = hurt ? PAL.threat3 : b.belly;
  const h = b.big ? 7 : 5, w = b.big ? 14 : 11, x0 = 5, y0 = 17 - 3 - h;
  const step = frame % 2 === 0 ? 0 : 1;
  // patas
  for (const [lx, ph] of [[x0 + 1, step], [x0 + 3, 1 - step], [x0 + w - 4, 1 - step], [x0 + w - 2, step]] as const) p.rect(lx, 17 - 3 + ph, 1, 3 - ph, shade(body, -0.25));
  // cuerpo y vientre
  p.rect(x0, y0, w, h, body);
  p.rect(x0 + 1, y0 + h - 1, w - 2, 1, belly);
  p.rect(x0, y0, w, 1, shade(body, 0.2));
  // cabeza
  const hx = x0 + w - 1, hy = y0 - (b.big ? 3 : 1);
  p.rect(hx, hy, b.big ? 5 : 4, b.big ? 5 : 4, body);
  p.rect(hx + (b.big ? 4 : 3), hy + 2, 2, 2, shade(body, 0.1));
  p.px(hx + (b.big ? 3 : 2), hy + 1, b.eye);
  p.px(hx + 1, hy - 1, shade(body, -0.2));
  if (b.big) { p.px(hx + 3, hy - 1, shade(body, -0.2)); p.px(hx + 5, hy + 4, PAL.bone3); }
  // cola
  p.rect(x0 - 3, y0 + 1 + step, 3, 1, b.big ? belly : '#c49a8a');
  p.outline();
  return p.c;
}

/** Murciélago: 3 fotogramas de aleteo. */
export function drawBat(frame: number, hurt = false): Canvas {
  const p = new Pix(22, 16);
  const body = hurt ? PAL.threat2 : '#3b2a3a';
  const wing = hurt ? PAL.threat1 : '#2a1d2c';
  const wingL = '#4e3a50';
  p.rect(9, 6, 4, 5, body);
  p.rect(9, 5, 1, 1, body);
  p.rect(12, 5, 1, 1, body);
  p.px(10, 7, PAL.threat3);
  p.px(11, 7, PAL.threat3);
  p.px(10, 9, PAL.bone3);
  const up = frame === 0, mid = frame === 1;
  for (let i = 0; i < 8; i++) {
    const yy = up ? 6 - Math.floor(i / 2) : mid ? 7 : 7 + Math.floor(i / 3);
    const hgt = up ? 2 + (i % 3 === 0 ? 1 : 0) : mid ? 2 : 2 + (i % 2);
    p.rect(8 - i, yy, 1, hgt, i % 3 === 0 ? wingL : wing);
    p.rect(13 + i, yy, 1, hgt, i % 3 === 0 ? wingL : wing);
  }
  p.outline();
  return p.c;
}

// ── Escenario isométrico ─────────────────────────────────────────────

export const TILE_W = 32;
export const TILE_H = 16;
export const WALL_H = 22;

function inDiamond(x: number, y: number, w = TILE_W, h = TILE_H): boolean {
  const dx = Math.abs(x + 0.5 - w / 2) / (w / 2);
  const dy = Math.abs(y + 0.5 - h / 2) / (h / 2);
  return dx + dy <= 1;
}

function stoneColor(n: number): string {
  if (n < 0.15) return PAL.stone1;
  if (n < 0.7) return PAL.stone2;
  if (n < 0.93) return PAL.stone3;
  return PAL.stone4;
}

export function drawFloor(variant: number): Canvas {
  const p = new Pix(TILE_W, TILE_H);
  for (let y = 0; y < TILE_H; y++) {
    for (let x = 0; x < TILE_W; x++) {
      if (!inDiamond(x, y)) continue;
      const a = (x / 16 + y / 8) / 2;
      const b = (x / 16 - y / 8) / 2 + 0.5;
      const seam = Math.abs(a - 0.5) < 0.035 || Math.abs(b - 0.5) < 0.035;
      const edge = a < 0.06 || b < 0.06 || a > 0.96 || b > 0.96;
      const stone = (a > 0.5 ? 1 : 0) + (b > 0.5 ? 2 : 0);
      const n = hash(x, y, variant * 7 + stone);
      let col = stoneColor(n * 0.6 + hash(stone, variant, 3) * 0.4);
      if (seam || edge) col = PAL.stone1;
      if (!seam && variant === 2 && stone === 1 && n > 0.55) col = n > 0.8 ? PAL.moss2 : PAL.moss1;
      if (!seam && variant === 3 && Math.abs(a - b + 0.1) < 0.03 && stone === 3) col = PAL.stone0;
      p.px(x, y, col);
    }
  }
  return p.c;
}

interface BlockOpts {
  height: number;
  top: (x: number, y: number) => string;
  left: (u: number, v: number) => string;
  right: (u: number, v: number) => string;
}

function drawBlock(o: BlockOpts): Canvas {
  const H = o.height;
  const p = new Pix(TILE_W, TILE_H + H);
  for (let x = 0; x < TILE_W; x++) {
    const topEdge = x < 16 ? 8 + x * 0.5 : 16 - (x - 16) * 0.5;
    for (let y = 0; y < TILE_H + H; y++) {
      if (inDiamond(x, y)) {
        p.px(x, y, o.top(x, y));
      } else if (y >= Math.floor(topEdge) && y < topEdge + H) {
        const v = y - Math.floor(topEdge);
        if (x < 16) p.px(x, y, o.left(x, v));
        else p.px(x, y, o.right(x - 16, v));
      }
    }
  }
  return p.c;
}

function brick(u: number, v: number, light: string, mid: string, dark: string, mortar: string, seed: number) {
  const row = Math.floor(v / 5);
  if (v % 5 === 4) return mortar;
  if ((u + (row % 2) * 4) % 8 === 0) return mortar;
  const n = hash(Math.floor((u + (row % 2) * 4) / 8), row, seed);
  return n < 0.25 ? dark : n > 0.85 ? light : mid;
}

export function drawWall(variant: number): Canvas {
  return drawBlock({
    height: WALL_H,
    top: (x, y) => {
      const n = hash(x, y, 91 + variant);
      return n > 0.85 ? PAL.stone5 : n < 0.2 ? PAL.stone3 : PAL.stone4;
    },
    left: (u, v) => {
      const c = brick(u, v, PAL.stone4, PAL.stone3, PAL.stone2, PAL.stone1, variant * 13);
      if (variant === 1 && v > WALL_H - 6 && hash(u, v, 5) > 0.6) return PAL.moss1;
      return v === WALL_H - 1 ? PAL.stone1 : c;
    },
    right: (u, v) => {
      const c = brick(u, v, PAL.stone3, PAL.stone2, PAL.stone1, PAL.stone0, variant * 17 + 1);
      return v === WALL_H - 1 ? PAL.stone0 : c;
    },
  });
}

export function drawDoor(): Canvas {
  const wood = (u: number, v: number, base: string) => {
    if (v === 3 || v === 14) return PAL.steel1;
    if (u % 4 === 0) return PAL.earth0;
    return hash(u, v, 77) > 0.85 ? shade(base, 0.15) : base;
  };
  return drawBlock({
    height: WALL_H - 2,
    top: () => PAL.earth2,
    left: (u, v) => (u === 8 && v === 9 ? PAL.gold2 : wood(u, v, PAL.earth2)),
    right: (u, v) => wood(u, v, PAL.earth1),
  });
}

export function drawPillar(): Canvas {
  const H = 34;
  const p = new Pix(TILE_W, TILE_H + H);
  const cx = 16;
  // base
  for (let y = 0; y < TILE_H; y++) for (let x = 6; x < 26; x++) if (inDiamond(x - 6, y + 2, 20, 12)) p.px(x, y + H - 2, PAL.stone2);
  for (let y = 4; y < H + 8; y++) {
    for (let x = cx - 6; x <= cx + 6; x++) {
      const t = (x - (cx - 6)) / 12;
      const ring = y % 9 === 0;
      let col = t < 0.25 ? PAL.stone4 : t < 0.6 ? PAL.stone3 : t < 0.85 ? PAL.stone2 : PAL.stone1;
      if (ring) col = PAL.stone1;
      if (hash(x, y, 4) > 0.94) col = PAL.stone1;
      p.px(x, y, col);
    }
  }
  for (let x = cx - 7; x <= cx + 7; x++) {
    p.px(x, 3, PAL.stone5);
    p.px(x, 4, PAL.stone4);
  }
  p.outline(PAL.stone0);
  return p.c;
}

export function drawTrap(armed: boolean): Canvas {
  const p = new Pix(TILE_W, TILE_H);
  for (let y = 0; y < TILE_H; y++) for (let x = 0; x < TILE_W; x++) if (inDiamond(x, y)) {
    const inner = Math.abs(x + 0.5 - 16) / 12 + Math.abs(y + 0.5 - 8) / 6 <= 1;
    if (inner) p.px(x, y, hash(x, y, 9) > 0.5 ? PAL.stone1 : PAL.stone0);
  }
  const spikes: [number, number][] = [[12, 6], [19, 6], [12, 10], [19, 10], [16, 5], [16, 11], [9, 8], [22, 8]];
  for (const [x, y] of spikes) {
    if (armed) {
      p.px(x, y - 2, PAL.steel3);
      p.px(x, y - 1, PAL.steel2);
      p.px(x, y, PAL.steel1);
    } else {
      p.px(x, y, PAL.steel0);
    }
  }
  return p.c;
}

/** Afloramiento de roca con vetas de mineral, apoyado en la pared. Agotada: solo roca. */
export function drawVein(color: string, glint: string, depleted: boolean): Canvas {
  const p = new Pix(18, 16);
  const rock = [PAL.stone2, PAL.stone3, PAL.stone4];
  // Silueta irregular de la roca
  const rows: [number, number][] = [[7, 11], [5, 13], [4, 14], [3, 15], [2, 15], [2, 16], [1, 16], [1, 17], [1, 17], [1, 17], [2, 16], [2, 16]];
  rows.forEach(([a, b], i) => { for (let x = a; x < b; x++) p.px(x, 3 + i, rock[(x * 3 + i * 5) % 3]); });
  for (let x = 2; x < 16; x++) p.px(x, 14, PAL.stone1);
  if (!depleted) {
    for (const [x, y] of [[6, 6], [7, 7], [10, 5], [11, 6], [12, 9], [4, 10], [5, 11], [9, 11], [13, 12], [8, 9]] as const) p.px(x, y, color);
    for (const [x, y] of [[7, 6], [11, 5], [5, 10], [13, 11]] as const) p.px(x, y, glint);
  } else {
    for (const [x, y] of [[6, 7], [10, 9], [5, 11]] as const) p.px(x, y, PAL.stone1);
  }
  p.outline();
  return p.c;
}

export function drawChest(kind: 'common' | 'rich' | 'boss', open: boolean): Canvas {
  const p = new Pix(20, 18);
  const wood = kind === 'boss' ? PAL.magic1 : kind === 'rich' ? PAL.threat1 : PAL.earth2;
  const woodD = shade(wood, -0.35);
  const band = kind === 'common' ? PAL.steel1 : PAL.gold2;
  // cuerpo
  p.rect(3, 9, 14, 7, wood);
  p.rect(3, 15, 14, 1, woodD);
  p.rect(15, 9, 2, 7, woodD);
  p.rect(5, 9, 1, 7, band);
  p.rect(14, 9, 1, 7, band);
  if (open) {
    p.rect(3, 4, 14, 4, woodD);
    p.rect(4, 5, 12, 2, shade(wood, -0.55));
    p.rect(4, 8, 12, 1, PAL.gold3);
    p.px(7, 7, PAL.gold3);
    p.px(11, 7, PAL.gold2);
    p.px(9, 6, PAL.gold3);
    p.rect(3, 8, 14, 1, PAL.gold2);
  } else {
    p.rect(3, 5, 14, 4, shade(wood, 0.1));
    p.rect(4, 4, 12, 1, shade(wood, 0.1));
    p.rect(3, 8, 14, 1, band);
    p.rect(5, 4, 1, 5, band);
    p.rect(14, 4, 1, 5, band);
    p.rect(9, 8, 2, 3, PAL.gold2);
    p.px(9, 10, PAL.outline);
  }
  p.outline();
  return p.c;
}

export function drawTorch(frame: number): Canvas {
  const p = new Pix(8, 16);
  p.rect(3, 9, 2, 6, PAL.earth2);
  p.rect(2, 9, 4, 1, PAL.steel1);
  const flick = [0, 1, -1][frame % 3];
  p.rect(2, 5, 4, 4, PAL.fire1);
  p.rect(3 + (flick > 0 ? 1 : 0), 3, 2, 3, PAL.fire2);
  p.px(3 + flick, 2, PAL.fire2);
  p.rect(3, 6, 2, 3, PAL.fire3);
  p.outline(PAL.fire0);
  return p.c;
}

export function drawDecor(kind: 'bones' | 'skull' | 'barrel' | 'rubble'): Canvas {
  const p = new Pix(16, 14);
  if (kind === 'bones') {
    p.rect(3, 10, 8, 1, PAL.bone2);
    p.px(2, 9, PAL.bone2); p.px(2, 11, PAL.bone2); p.px(11, 9, PAL.bone2); p.px(11, 11, PAL.bone2);
    p.rect(6, 8, 1, 5, PAL.bone1);
    p.rect(9, 12, 4, 1, PAL.bone1);
  } else if (kind === 'skull') {
    p.rect(5, 7, 6, 5, PAL.bone2);
    p.rect(6, 12, 4, 1, PAL.bone1);
    p.px(6, 9, PAL.outline); p.px(9, 9, PAL.outline);
    p.rect(10, 7, 1, 5, PAL.bone1);
  } else if (kind === 'barrel') {
    p.rect(4, 2, 8, 11, PAL.earth2);
    p.rect(4, 2, 8, 1, PAL.earth3);
    p.rect(4, 4, 8, 1, PAL.steel1);
    p.rect(4, 10, 8, 1, PAL.steel1);
    p.rect(10, 2, 2, 11, PAL.earth1);
  } else {
    p.rect(3, 10, 4, 3, PAL.stone3);
    p.rect(8, 9, 3, 4, PAL.stone2);
    p.rect(11, 11, 3, 2, PAL.stone4);
  }
  p.outline();
  return p.c;
}

export function drawPortal(frame: number): Canvas {
  const W = 28, H = 40;
  const p = new Pix(W, H);
  const cx = W / 2, cy = H / 2;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = (x + 0.5 - cx) / (W / 2 - 1);
      const dy = (y + 0.5 - cy) / (H / 2 - 1);
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r > 1) continue;
      const ang = Math.atan2(dy, dx);
      const swirl = Math.sin(ang * 3 + r * 9 - frame * (Math.PI / 3));
      let col: string;
      if (r > 0.86) col = PAL.magic2;
      else if (r > 0.78) col = PAL.magic3;
      else if (swirl > 0.55) col = PAL.magic3;
      else if (swirl > -0.1) col = PAL.magic2;
      else if (r < 0.3) col = '#f3e6ff';
      else col = PAL.magic1;
      p.px(x, y, col);
    }
  }
  p.outline(PAL.magic0);
  return p.c;
}

export function drawShadow(w = 14, h = 6): Canvas {
  const [c, ctx] = canvas(w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

export function drawGlow(size: number, color: string): Canvas {
  const [c, ctx] = canvas(size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

export function drawBag(): Canvas {
  const p = new Pix(12, 12);
  p.rect(3, 4, 6, 7, PAL.earth2);
  p.rect(2, 6, 8, 4, PAL.earth2);
  p.rect(8, 5, 2, 6, PAL.earth1);
  p.rect(4, 2, 4, 2, PAL.earth3);
  p.rect(4, 4, 4, 1, PAL.gold1);
  p.px(4, 6, PAL.earth3);
  p.outline();
  return p.c;
}

/** Cadenas y grilletes en el suelo, para los prisioneros. */
export function drawChains(): Canvas {
  const p = new Pix(28, 10);
  // Argolla clavada al suelo y dos tramos de cadena
  p.rect(12, 6, 4, 3, PAL.stone2);
  p.rect(13, 7, 2, 1, PAL.stone4);
  for (let i = 0; i < 5; i++) { p.rect(2 + i * 2, 4 + (i % 2), 2, 1, i % 2 ? PAL.steel1 : PAL.steel2); p.rect(16 + i * 2, 4 + ((i + 1) % 2), 2, 1, i % 2 ? PAL.steel1 : PAL.steel2); }
  p.rect(0, 2, 3, 3, PAL.steel2); p.px(1, 3, PAL.outline);
  p.rect(25, 2, 3, 3, PAL.steel2); p.px(26, 3, PAL.outline);
  p.outline();
  return p.c;
}

export function drawMarker(color: string): Canvas {
  const p = new Pix(7, 6);
  p.rect(1, 0, 5, 2, color);
  p.rect(2, 2, 3, 1, color);
  p.px(3, 3, color);
  p.outline();
  return p.c;
}

// ── Iconos de objetos (12x12, con contorno automático) ───────────────

const ICON_SHAPES: Record<string, string[]> = {
  sword: ['............', '..........w.', '.........wa.', '........wa..', '.......wa...', '......wa....', '..g..wa.....', '...gwa......', '...Bg.......', '..B..g......', '.B..........', '............'],
  axe: ['............', '......aaa...', '.....aaaaa..', '....bBwaaaa.', '....bB.waaa.', '....bB..aa..', '....bB......', '....bB......', '....bB......', '....bB......', '....gg......', '............'],
  staff: ['............', '......ha....', '.....haaa...', '.....aaaA...', '......AA....', '......bB....', '.....bB.....', '.....bB.....', '....bB......', '....bB......', '...bB.......', '............'],
  dagger: ['............', '............', '........w...', '.......wa...', '......wa....', '.....wa.....', '...g.a......', '....g.......', '...B.g......', '..B.........', '............', '............'],
  shield: ['............', '..gggggggg..', '..gaaaaaAg..', '..gaaaaaAg..', '..gaaggaAg..', '..gaaggaAg..', '..gaaaaaAg..', '...gaaaAg...', '....gaAg....', '.....gg.....', '............', '............'],
  tome: ['............', '...AAAAAAA..', '..Aaaaaaaw..', '..Aaagaaaw..', '..Aaggga.w..', '..Aaagaaaw..', '..Aaaaaaaw..', '..Aaaaaaaw..', '..AAAAAAAw..', '...wwwwwww..', '............', '............'],
  hood: ['............', '....aaaa....', '...aaaaaa...', '..aaAkkAaa..', '..aaAkkkAa..', '..aAkkkkAa..', '..aAkkkkAa..', '..aaAkkAaa..', '..aaaaaaaa..', '...aaaaaa...', '............', '............'],
  helm: ['............', '....aaaa....', '...awaaaa...', '..awaaaaaA..', '..aaaaaaaA..', '..aakkkkaA..', '..aaaakaaA..', '..aa.ak.aA..', '..aA.aA.aA..', '............', '............', '............'],
  hat: ['............', '........a...', '.......aa...', '......aaA...', '.....aaaA...', '.....aaaA...', '....aaaaaA..', '....ggggg...', '..aaaaaaaaA.', '...AAAAAAA..', '............', '............'],
  tunic: ['............', '...aa..aa...', '..aaawwaaa..', '.aaaaaaaaaA.', '.aa.aaaa.aA.', '....aaaaA...', '....aaaaA...', '....ggggg...', '....aaaaA...', '....aaaaA...', '............', '............'],
  robe: ['............', '....a..a....', '...aaaaaa...', '..aaagaaaA..', '..a.agaa.A..', '....agaaA...', '...aagaaaA..', '...aagaaaA..', '..aaagaaaaA.', '..aaaaaaaaA.', '............', '............'],
  gloves: ['............', '............', '...a.a.a....', '...a.a.a.a..', '...aaaaaaa..', '...aaaaaaA..', '..aaaaaaaA..', '..aaaaaaA...', '...AaaaaA...', '....gggg....', '....aaaa....', '............'],
  boots: ['............', '....aaaA....', '....aaaA....', '....aaaA....', '....aaaA....', '....aaaaA...', '....aaaaaaA.', '...gggggggg.', '...AAAAAAAA.', '............', '............', '............'],
  ring: ['............', '............', '.....aa.....', '....ahaa....', '....gaag....', '...g....g...', '...g....g...', '...g....g...', '....g..g....', '.....gg.....', '............', '............'],
  amulet: ['............', '..g......g..', '...g....g...', '....g..g....', '.....gg.....', '....gaag....', '...gahaag...', '...gaaaag...', '....gaag....', '.....gg.....', '............', '............'],
  potion: ['............', '.....bb.....', '.....ww.....', '.....ww.....', '....waaw....', '...wahaaw...', '...waaaaw...', '...waaaaw...', '...wAaaAw...', '....wwww....', '............', '............'],
  dust: ['............', '............', '............', '............', '............', '.....e......', '....eeE.....', '...eewEE....', '..eeeeeEE...', '.EEEEEEEEE..', '............', '............'],
  wing: ['............', '..a.........', '..aa........', '..aAa.......', '..aAaa......', '..aAAaa.....', '..aAaAaa....', '..aaAaAaa...', '...a.a.aaa..', '............', '............', '............'],
  coin: ['............', '............', '....gggg....', '...gyyyyG...', '..gyygGyyG..', '..gygGgyyG..', '..gyygGyyG..', '..gyyyyyyG..', '...gGGGGG...', '............', '............', '............'],
  chalice: ['............', '..gggggggg..', '..gyrrrryG..', '..gyyyyyyG..', '...gyyyyG...', '....gyyG....', '.....gG.....', '.....gG.....', '....gyyG....', '...gggggG...', '............', '............'],
  gem: ['............', '............', '....aaaa....', '...ahhaaA...', '..ahaaaaAA..', '..aaaaaaAA..', '...aaaaAA...', '....aaAA....', '.....AA.....', '............', '............', '............'],
  mace: ['............', '.......aaa..', '......ahaaA.', '......aaaaA.', '.......aAA..', '......bB....', '.....bB.....', '.....bB.....', '....bB......', '....bB......', '...gg.......', '............'],
  ore: ['............', '............', '............', '....AAA.....', '...AahAA....', '..AaaahaA...', '..AaghaaaA..', '.AaaaagaaA..', '.AaaaaaaaA..', '..AAAAAAA...', '............', '............'],
  pick: ['............', '..aaaa......', '.a....aa....', '......bAa...', '.....bB..a..', '....bB....a.', '...bB......', '..bB........', '.bB.........', 'bB..........', '............', '............'],
  key: ['............', '............', '..ggg.......', '.g...g......', '.g...gggggg.', '.g...g..g.g.', '..ggg...g.g.', '............', '............', '............', '............', '............'],
};

interface IconVariant { shape: string; a: string; A?: string; h?: string; g?: string }

const ICONS: Record<string, IconVariant> = {
  sword: { shape: 'sword', a: PAL.steel2 },
  axe: { shape: 'axe', a: PAL.steel2, g: PAL.gold2 },
  axe_exec: { shape: 'axe', a: PAL.steel3, A: PAL.steel1, g: PAL.threat2 },
  axe_bone: { shape: 'axe', a: PAL.bone2, A: PAL.bone0, g: PAL.magic2 },
  sword_knight: { shape: 'sword', a: PAL.steel3, g: PAL.gold3 },
  sword_dread: { shape: 'sword', a: PAL.threat2, A: PAL.threat0, g: PAL.magic2 },
  staff_frost: { shape: 'staff', a: PAL.ice, h: '#ffffff', A: '#3d7be0' },
  mace: { shape: 'mace', a: PAL.gold2, A: PAL.gold1, h: PAL.gold3 },
  shield_steel: { shape: 'shield', a: PAL.steel2, A: PAL.steel1, g: PAL.steel0 },
  tome_dark: { shape: 'tome', a: PAL.outline, A: PAL.magic0, g: PAL.magic2 },
  helm_knight: { shape: 'helm', a: PAL.steel3, A: PAL.gold1 },
  plate: { shape: 'tunic', a: PAL.steel3, A: PAL.steel1, g: PAL.gold2 },
  robe_gold: { shape: 'robe', a: PAL.night1, A: PAL.night0, g: PAL.gold2 },
  staff: { shape: 'staff', a: PAL.ice, h: PAL.bone3 },
  staff_fire: { shape: 'staff', a: PAL.fire1, h: PAL.fire3, A: PAL.fire0 },
  staff_rune: { shape: 'staff', a: PAL.magic2, h: PAL.magic3, A: PAL.magic1 },
  dagger: { shape: 'dagger', a: PAL.bone2, g: PAL.bone1 },
  shield: { shape: 'shield', a: PAL.earth2, A: PAL.earth1, g: PAL.steel1 },
  shield_iron: { shape: 'shield', a: PAL.steel1, A: PAL.steel0, g: PAL.gold2 },
  tome: { shape: 'tome', a: PAL.magic1, A: PAL.magic0, g: PAL.gold2 },
  hood: { shape: 'hood', a: PAL.earth2, A: PAL.earth1 },
  helm: { shape: 'helm', a: PAL.steel2, A: PAL.steel1 },
  hat: { shape: 'hat', a: PAL.night2, A: PAL.night1, g: PAL.gold2 },
  tunic: { shape: 'tunic', a: PAL.earth3, A: PAL.earth2, g: PAL.earth1 },
  chainmail: { shape: 'tunic', a: PAL.steel2, A: PAL.steel1, g: PAL.steel0 },
  robe: { shape: 'robe', a: PAL.bone1, A: PAL.bone0, g: PAL.night2 },
  robe_dark: { shape: 'robe', a: PAL.magic1, A: PAL.magic0, g: PAL.magic3 },
  gloves: { shape: 'gloves', a: PAL.earth3, A: PAL.earth2, g: PAL.earth1 },
  gauntlets: { shape: 'gloves', a: PAL.steel2, A: PAL.steel1, g: PAL.gold1 },
  boots: { shape: 'boots', a: PAL.earth2, A: PAL.earth1, g: PAL.earth0 },
  boots_swift: { shape: 'boots', a: PAL.night2, A: PAL.night1, g: PAL.ice },
  ring: { shape: 'ring', a: PAL.moss2, h: PAL.bone3, g: '#b8763a' },
  ring_red: { shape: 'ring', a: PAL.threat2, h: PAL.threat3, g: PAL.gold2 },
  amulet: { shape: 'amulet', a: PAL.bone2, h: PAL.bone3, g: PAL.bone1 },
  amulet_heart: { shape: 'amulet', a: PAL.threat2, h: PAL.threat3, g: PAL.gold2 },
  potion_red: { shape: 'potion', a: PAL.threat2, A: PAL.threat1, h: PAL.threat3 },
  potion_blue: { shape: 'potion', a: '#3d7be0', A: '#1f3f80', h: PAL.ice },
  potion_green: { shape: 'potion', a: PAL.moss2, A: PAL.moss1, h: '#c8f0a0' },
  dust: { shape: 'dust', a: PAL.bone2 },
  wing: { shape: 'wing', a: '#4e3a50', A: '#2a1d2c' },
  coin: { shape: 'coin', a: PAL.gold2 },
  chalice: { shape: 'chalice', a: PAL.gold2 },
  gem_red: { shape: 'gem', a: PAL.threat2, A: PAL.threat1, h: '#ff9aa8' },
  key: { shape: 'key', a: PAL.steel2, g: PAL.steel2 },
  ore_copper: { shape: 'ore', a: PAL.stone3, A: PAL.stone1, h: '#e08a4a', g: '#5fbf8a' },
  ore_iron: { shape: 'ore', a: PAL.stone2, A: PAL.stone0, h: '#a8b4c0', g: '#6a4a3a' },
  ore_silver: { shape: 'ore', a: PAL.stone3, A: PAL.stone1, h: '#f2f6fa', g: '#cfd8e3' },
  pick: { shape: 'pick', a: PAL.steel2, A: PAL.steel1 },
  pick_steel: { shape: 'pick', a: PAL.steel3, A: PAL.ice },
};

export function drawIcon(key: string): Canvas {
  const v = ICONS[key] ?? ICONS.coin;
  const shape = ICON_SHAPES[v.shape];
  const pal: Record<string, string> = {
    a: v.a, A: v.A ?? shade(v.a, -0.35), h: v.h ?? shade(v.a, 0.45), g: v.g ?? PAL.gold2, G: PAL.gold1, y: PAL.gold3,
    w: PAL.steel3, b: PAL.earth2, B: PAL.earth1, k: PAL.outline, r: PAL.threat1, e: PAL.bone2, E: PAL.bone1,
  };
  if (v.shape === 'potion') pal.w = '#c9d6e3';
  const p = new Pix(12, 12);
  shape.forEach((row, y) => [...row].forEach((ch, x) => ch !== '.' && p.px(x, y, pal[ch] ?? v.a)));
  p.outline();
  return p.c;
}

// ── Caché de imágenes para la interfaz (React) ───────────────────────

const urlCache = new Map<string, string>();

export function scaled(c: Canvas, scale: number): Canvas {
  const [o, ctx] = canvas(c.width * scale, c.height * scale);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(c, 0, 0, o.width, o.height);
  return o;
}

export function cachedUrl(key: string, make: () => Canvas, scale = 1): string {
  const k = `${key}@${scale}`;
  let u = urlCache.get(k);
  if (!u) {
    u = scaled(make(), scale).toDataURL();
    urlCache.set(k, u);
  }
  return u;
}

export function iconUrl(icon: string, scale = 3): string {
  return cachedUrl(`icon:${icon}`, () => drawIcon(icon), scale);
}

export function heroUrl(classId: ClassId, ap: Appearance, scale = 4, frame = 0, pose: 'idle' | 'attack' | 'hurt' = 'idle', equipment?: Equipment): string {
  const eq = equipment ?? starterEquipment(classId);
  return cachedUrl(`hero:${classId}:${ap.cloak}:${ap.skin}:${lookSignature(eq)}:${frame}:${pose}`, () => drawHumanoid(heroSpec(classId, ap, eq), frame, pose), scale);
}

/** Héroe de espaldas (combate). */
export function heroBackUrl(classId: ClassId, ap: Appearance, scale = 4, pose: 'idle' | 'attack' | 'hurt' = 'idle', equipment?: Equipment): string {
  const eq = equipment ?? starterEquipment(classId);
  return cachedUrl(`heroback:${classId}:${ap.cloak}:${ap.skin}:${lookSignature(eq)}:${pose}`, () => drawHumanoidBack(heroSpec(classId, ap, eq), pose), scale);
}

/** Kael de espaldas, cuando lucha a tu lado. */
export function rivalBackUrl(scale = 4, pose: 'idle' | 'attack' | 'hurt' = 'idle'): string {
  return cachedUrl(`rivalback:${pose}`, () => drawHumanoidBack(MONSTER_SPECS.rival, pose), scale);
}

/** Cualquier compañero humanoide (Kael, mercenarios) de espaldas. */
export function allyBackUrl(sprite: string, scale = 4, pose: 'idle' | 'attack' | 'hurt' = 'idle'): string {
  const spec = MONSTER_SPECS[sprite];
  if (!spec) return monsterUrl(sprite, scale, pose);
  return cachedUrl(`allyback:${sprite}:${pose}`, () => drawHumanoidBack(spec, pose), scale);
}

export function monsterUrl(sprite: string, scale = 4, pose: 'idle' | 'attack' | 'hurt' = 'idle'): string {
  if (sprite === 'bat') return cachedUrl(`bat:${pose}`, () => drawBat(pose === 'attack' ? 0 : 1, pose === 'hurt'), scale);
  if (BEAST_SPECS[sprite]) return cachedUrl(`beast:${sprite}:${pose}`, () => drawBeast(sprite, pose === 'attack' ? 1 : 0, pose === 'hurt'), scale);
  const spec = MONSTER_SPECS[sprite] ?? MONSTER_SPECS.skeleton;
  return cachedUrl(`mon:${sprite}:${pose}`, () => drawHumanoid(spec, 0, pose), scale);
}
