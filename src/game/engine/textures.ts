import Phaser from 'phaser';
import * as Art from '../../shared/art';
import { PAL } from '../../shared/palette';
import type { Appearance, ClassId } from '../../core/types';

/** Registra en Phaser todas las texturas generadas proceduralmente. */
export function registerTextures(scene: Phaser.Scene, hero: { classId: ClassId; appearance: Appearance }) {
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
  for (let f = 0; f < 4; f++) {
    add(`hero${f}`, Art.drawHumanoid(Art.heroSpec(hero.classId, hero.appearance), f));
    add(`skeleton${f}`, Art.drawHumanoid(Art.MONSTER_SPECS.skeleton, f));
    add(`rival${f}`, Art.drawHumanoid(Art.MONSTER_SPECS.rival, f));
    add(`boss${f}`, Art.drawHumanoid(Art.MONSTER_SPECS.boss, f));
  }
  for (let f = 0; f < 3; f++) add(`bat${f}`, Art.drawBat(f));
}
