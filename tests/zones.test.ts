import { describe, expect, it } from 'vitest';
import { ZONES, ZONE_ORDER, zoneLock, zoneEnemyLevel } from '../src/core/data/zones';
import { ENEMIES, getEnemy } from '../src/core/data/enemies';
import { ITEMS } from '../src/core/data/items';
import { CHEST_TABLES } from '../src/core/loot';
import { generateDungeon, validateDungeon } from '../src/core/dungeonGen';
import { GEAR_LOOKS } from '../src/shared/gearLook';

describe('Zonas: datos coherentes', () => {
  for (const id of ZONE_ORDER) {
    const z = ZONES[id];
    it(`${z.name}: criaturas, élite, jefe y cofres existen`, () => {
      for (const e of z.enemies) expect(ENEMIES[e.id], e.id).toBeTruthy();
      expect(getEnemy(z.elite).elite).toBe(true);
      expect(getEnemy(z.boss).boss).toBe(true);
      for (const t of Object.values(z.chests)) {
        expect(CHEST_TABLES[t], t).toBeTruthy();
        for (const e of CHEST_TABLES[t].entries) if (e.itemId !== 'nothing') expect(ITEMS[e.itemId], `${t} → ${e.itemId}`).toBeTruthy();
      }
    });
  }
  it('todo el botín de las criaturas existe', () => {
    for (const e of Object.values(ENEMIES)) for (const l of e.loot.entries) if (l.itemId !== 'nothing') expect(ITEMS[l.itemId], `${e.id} → ${l.itemId}`).toBeTruthy();
  });
  it('cada pieza de equipo tiene aspecto en el personaje', () => {
    for (const it of Object.values(ITEMS)) if (it.slot && it.classes?.some((c) => c === 'warrior' || c === 'mage')) expect(GEAR_LOOKS[it.id], it.id).toBeTruthy();
  });
  it('el equipo de cada zona pide niveles de su rango', () => {
    const range = (lv: number) => (lv >= 60 ? 'infierno' : lv >= 30 ? 'cripta' : 'mazmorra');
    expect(range(ITEMS.sepulchral_sword.levelReq!)).toBe('cripta');
    expect(range(ITEMS.hellforged_blade.levelReq!)).toBe('infierno');
  });
});

describe('Acceso a las zonas', () => {
  it('la Mazmorra está siempre abierta', () => expect(zoneLock(ZONES.mazmorra, 1, [])).toBeNull());
  it('la Cripta pide nivel 30 y al Señor del Osario', () => {
    expect(zoneLock(ZONES.cripta, 29, ['ossuary_lord'])).toMatch(/nivel 30/);
    expect(zoneLock(ZONES.cripta, 30, [])).toMatch(/jefe/);
    expect(zoneLock(ZONES.cripta, 30, ['ossuary_lord'])).toBeNull();
  });
  it('el Infierno pide nivel 60 y a la Reina Velada', () => {
    expect(zoneLock(ZONES.infierno, 70, ['ossuary_lord'])).toMatch(/jefe/);
    expect(zoneLock(ZONES.infierno, 60, ['ossuary_lord', 'veiled_queen'])).toBeNull();
  });
  it('las criaturas toman tu nivel dentro del rango de la zona', () => {
    expect(zoneEnemyLevel(ZONES.mazmorra, 50)).toBe(30);
    expect(zoneEnemyLevel(ZONES.cripta, 20)).toBe(30);
    expect(zoneEnemyLevel(ZONES.infierno, 75)).toBe(75);
  });
});

describe('Mapas por zona', () => {
  for (const id of ZONE_ORDER) {
    it(`${ZONES[id].name}: 20 mapas válidos con sus criaturas y su jefe`, () => {
      for (let seed = 1; seed <= 20; seed++) {
        const d = generateDungeon(seed * 9973, { zone: id });
        expect(validateDungeon(d).ok).toBe(true);
        expect(d.zone).toBe(id);
        const enemies = d.entities.filter((e) => e.kind === 'enemy') as { enemyId: string }[];
        expect(enemies.some((e) => e.enemyId === ZONES[id].boss)).toBe(true);
        const allowed = new Set([...ZONES[id].enemies.map((e) => e.id), ZONES[id].elite, ZONES[id].boss]);
        for (const e of enemies) expect(allowed.has(e.enemyId), e.enemyId).toBe(true);
      }
    });
  }
});
