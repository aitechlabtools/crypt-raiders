import { VEINS } from '../../core/mining';
import Phaser from 'phaser';
import * as Art from '../../shared/art';
import { PAL } from '../../shared/palette';
import type { Appearance, ClassId, Equipment } from '../../core/types';

/** Texturas del héroe según su equipo. Cada versión usa claves nuevas (hero{v}_0…3) para no tocar las que están en uso. */
export function registerHeroTextures(scene: Phaser.Scene, version: number, hero: { classId: ClassId; appearance: Appearance; equipment: Equipment }) {
  for (let f = 0; f < 4; f++) {
    const key = `hero${version}_${f}`;
    if (scene.textures.exists(key)) scene.textures.remove(key);
    scene.textures.addCanvas(key, Art.drawHumanoid(Art.heroSpec(hero.classId, hero.appearance, hero.equipment), f));
  }
  // Libera la versión anterior
  for (let f = 0; f < 4; f++) {
    const old = `hero${version - 1}_${f}`;
    if (version > 0 && scene.textures.exists(old)) scene.time.delayedCall(500, () => scene.textures.exists(old) && scene.textures.remove(old));
  }
  return `hero${version}_`;
}

/** Registra en Phaser el resto de texturas generadas proceduralmente. */
export function registerTextures(scene: Phaser.Scene) {
  const tx = scene.textures;
  const add = (key: string, c: HTMLCanvasElement) => {
    if (tx.exists(key)) tx.remove(key);
    tx.addCanvas(key, c);
  };
  for (let v = 0; v < 4; v++) add(`floor${v}`, Art.drawFloor(v));
  add('wall0', Art.drawWall(0));
  add('wall1', Art.drawWall(1));
  add('door', Art.drawDoor());
  add('pillar', Art.drawPillar());
  add('trap_off', Art.drawTrap(false));
  add('trap_on', Art.drawTrap(true));
  for (const k of ['common', 'rich', 'boss'] as const) {
    add(`chest_${k}`, Art.drawChest(k, false));
    add(`chest_${k}_open`, Art.drawChest(k, true));
  }
  for (let f = 0; f < 3; f++) add(`torch${f}`, Art.drawTorch(f));
  for (const d of ['bones', 'skull', 'barrel', 'rubble'] as const) add(`decor_${d}`, Art.drawDecor(d));
  for (let f = 0; f < 6; f++) add(`portal${f}`, Art.drawPortal(f));
  add('shadow', Art.drawShadow());
  add('shadow_big', Art.drawShadow(26, 10));
  add('glow_warm', Art.drawGlow(64, 'rgba(255,170,80,0.55)'));
  add('glow_violet', Art.drawGlow(96, 'rgba(180,110,255,0.6)'));
  add('mote', Art.drawGlow(4, 'rgba(255,230,200,0.9)'));
  add('marker_ally', Art.drawMarker('#5fd19a'));
  add('marker_neutral', Art.drawMarker(PAL.gold2));
  add('marker_hostile', Art.drawMarker(PAL.threat2));
  add('bag', Art.drawBag());
  add('chains', Art.drawChains());
  for (const v of Object.values(VEINS)) add(`vein_${v.id}`, Art.drawVein(v.color, v.glint, false));
  add('vein_spent', Art.drawVein('#000', '#000', true));
  for (let f = 0; f < 4; f++) {
    for (const [name, spec] of Object.entries(Art.MONSTER_SPECS)) add(`${name}${f}`, Art.drawHumanoid(spec, f));
    for (const name of Object.keys(Art.BEAST_SPECS)) add(`${name}${f}`, Art.drawBeast(name, f));
  }
  for (let f = 0; f < 3; f++) add(`bat${f}`, Art.drawBat(f));
}
