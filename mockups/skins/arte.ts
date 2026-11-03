// MAQUETA · Dibujado por capas con el código de arte actual: cuerpo (base o skin) + secundaria + arma.
// Para la maqueta se reutiliza drawHumanoid cambiando solo las partes del cuerpo: así se ve que la misma skin
// funciona con las armas de cualquier clase. En el juego real será un dibujado por capas con puntos de anclaje.
import { drawHumanoid, drawHumanoidBack, heroSpec } from '../../src/shared/art';
import type { Appearance, ClassId, Equipment } from '../../src/core/types';
import { SKIN_BY_ID } from './skins-propuesta';

export function skinSpec(classId: ClassId, ap: Appearance, eq: Equipment, skinId: string | null) {
  const base = heroSpec(classId, ap, eq);
  const sk = skinId ? SKIN_BY_ID[skinId] : null;
  if (!sk) return base;
  // Se conserva lo que NO es del traje: el color de piel del jugador, el arma y la secundaria.
  const { weapon, weaponColor, orb, offhand, shieldColor, shieldRim, shieldEmblem, tomeColor, skin, hair } = base;
  return { ...sk.placeholder, skin, hair, weapon, weaponColor, orb, offhand, shieldColor, shieldRim, shieldEmblem, tomeColor, amulet: sk.placeholder.amulet };
}

const cache = new Map<string, string>();
function up(c: HTMLCanvasElement, scale: number): string {
  const o = document.createElement('canvas');
  o.width = c.width * scale; o.height = c.height * scale;
  const g = o.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  g.drawImage(c, 0, 0, o.width, o.height);
  return o.toDataURL();
}

export function skinUrl(classId: ClassId, ap: Appearance, eq: Equipment, skinId: string | null, scale: number, frame = 0, view: 'front' | 'back' = 'front'): string {
  const key = `${classId}|${ap.cloak}|${ap.skin}|${JSON.stringify(Object.values(eq).map((x) => x?.itemId))}|${skinId}|${scale}|${frame}|${view}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const spec = skinSpec(classId, ap, eq, skinId);
  const url = up(view === 'front' ? drawHumanoid(spec, frame) : drawHumanoidBack(spec), scale);
  cache.set(key, url);
  return url;
}
