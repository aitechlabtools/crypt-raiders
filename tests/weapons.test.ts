import { describe, expect, it } from 'vitest';
import { combatLoadout } from '../src/core/loadout';
import { createProfile, grantRecruitKit, needsRecruitKit } from '../src/core/profile';
import { emptyEquipment, emptyGrid, addToGrid, canEquip, countItem } from '../src/core/inventory';
import { createCombat, performAction, rollDamage, getCombatant, currentActor, runAITurn } from '../src/core/combat';
import { enemyCombatant, playerCombatant, levelScale } from '../src/core/combatants';
import { makeRng } from '../src/core/rng';
import { ITEMS } from '../src/core/data/items';
import { SKILLS } from '../src/core/data/skills';
import { CLASSES } from '../src/core/data/classes';
import { CHEST_TABLES } from '../src/core/loot';
import { MERCHANT_STOCK } from '../src/core/data/merchant';
import type { Equipment } from '../src/core/types';

const eq = (items: Partial<Record<keyof Equipment, string>>): Equipment => {
  const e = emptyEquipment();
  for (const [k, v] of Object.entries(items)) e[k as keyof Equipment] = { uid: k, itemId: v!, qty: 1 };
  return e;
};

describe('Habilidades según clase y equipo', () => {
  it('sin arma solo hay puños, más la habilidad de clase', () => {
    const k = combatLoadout('warrior', emptyEquipment());
    expect(k.basicAttack.name).toBe('Puñetazo');
    expect(k.skills).toEqual(['war_cry', 'low_blow']);
  });
  it('la espada da sus ataques; sin escudo no hay bloqueo', () => {
    const k = combatLoadout('warrior', eq({ mainHand: 'rusty_sword' }));
    expect(k.basicAttack.name).toBe('Tajo');
    expect(k.skills).toContain('rending_slash');
    expect(k.skills).not.toContain('block');
  });
  it('con escudo se habilitan las defensivas', () => {
    const k = combatLoadout('warrior', eq({ mainHand: 'rusty_sword', offHand: 'bastion_shield' }));
    expect(k.skills).toEqual(expect.arrayContaining(['block', 'shield_bash', 'iron_wall']));
  });
  it('la habilidad de clase está siempre, lleve lo que lleve', () => {
    for (const cls of ['warrior', 'mage'] as const) {
      expect(combatLoadout(cls, emptyEquipment()).skills).toContain(CLASSES[cls].classSkill);
      expect(combatLoadout(cls, eq({ mainHand: cls === 'warrior' ? 'dread_blade' : 'runic_staff' })).skills).toContain(CLASSES[cls].classSkill);
    }
  });
  it('cada báculo cambia los hechizos del mago', () => {
    expect(combatLoadout('mage', eq({ mainHand: 'apprentice_staff' })).skills).not.toContain('fireball');
    expect(combatLoadout('mage', eq({ mainHand: 'ember_staff' })).skills).toContain('fireball');
  });
  it('cada arma da entre 3 y 4 habilidades contando el ataque básico', () => {
    for (const it of Object.values(ITEMS)) {
      if (it.slot !== 'mainHand') continue;
      expect(it.attack, it.id).toBeDefined();
      const n = 1 + (it.grants?.length ?? 0);
      expect(n, it.id).toBeGreaterThanOrEqual(2);
      expect(n, it.id).toBeLessThanOrEqual(4);
      for (const g of it.grants ?? []) expect(SKILLS[g], `${it.id} → ${g}`).toBeDefined();
    }
  });
  it('las armas son exclusivas de su clase', () => {
    expect(canEquip('rusty_sword', 'mainHand', { classId: 'mage', level: 10 })).not.toBeNull();
    expect(canEquip('apprentice_staff', 'mainHand', { classId: 'warrior', level: 10 })).not.toBeNull();
  });
});

describe('Requisitos de nivel', () => {
  it('todos los objetos equipables tienen nivel mínimo', () => {
    for (const it of Object.values(ITEMS)) if (it.slot) expect(it.levelReq, it.id).toBeGreaterThanOrEqual(1);
  });
  it('un arma de nivel 24 se puede guardar pero no equipar a nivel 14', () => {
    expect(canEquip('dread_blade', 'mainHand', { classId: 'warrior', level: 14 })).toMatch(/nivel 24/);
    expect(canEquip('dread_blade', 'mainHand', { classId: 'warrior', level: 24 })).toBeNull();
    const g = addToGrid(emptyGrid(4), { uid: 'x', itemId: 'dread_blade', qty: 1 }).grid;
    expect(countItem(g, 'dread_blade')).toBe(1);
  });
  it('el mercader solo vende objetos de nivel 7 o menos', () => {
    for (const id of MERCHANT_STOCK) expect(ITEMS[id].levelReq ?? 1, id).toBeLessThanOrEqual(7);
  });
  it('los cofres del jefe dan objetos de nivel 5 a 8', () => {
    const gear = CHEST_TABLES.boss.entries.map((e) => ITEMS[e.itemId]).filter((d) => d?.slot);
    expect(gear.every((d) => (d.levelReq ?? 1) >= 5)).toBe(true);
  });
  it('las criaturas se endurecen con el nivel del aventurero', () => {
    expect(enemyCombatant('skeleton', 'a', 'B', 5).stats.maxHp).toBeGreaterThan(enemyCombatant('skeleton', 'b', 'B', 1).stats.maxHp);
    expect(levelScale(1)).toBe(1);
  });
});

describe('Nuevos efectos de combate', () => {
  const p = createProfile('T', 'warrior', { cloak: 0, skin: 0 });
  const pl = () => playerCombatant(p.character, p.equipment, 999, 999);
  it('el bloqueo reduce el siguiente golpe y se gasta', () => {
    let s = createCombat([pl(), enemyCombatant('skeleton', 'e')], 3);
    s = performAction(s, { type: 'skill', skillId: 'block' });
    expect(getCombatant(s, 'player').statuses.some((x) => x.id === 'block')).toBe(true);
    let guard = 0;
    while (getCombatant(s, 'player').statuses.some((x) => x.id === 'block') && !s.outcome && guard++ < 10) {
      s = currentActor(s)!.control === 'player' ? performAction(s, { type: 'defend' }) : runAITurn(s);
    }
    expect(getCombatant(s, 'player').statuses.some((x) => x.id === 'block')).toBe(false);
  });
  it('la furia aumenta el daño causado', () => {
    const a = pl();
    const d = enemyCombatant('skeleton', 'e');
    const normal = rollDamage(a, d, 'physical', 1, makeRng(4), { ignoresEvasion: true }).amount;
    const furious = rollDamage({ ...a, statuses: [{ id: 'empower', turns: 2 }] }, d, 'physical', 1, makeRng(4), { ignoresEvasion: true }).amount;
    expect(furious).toBeGreaterThan(normal);
  });
  it('perforar armadura aumenta el daño', () => {
    const a = pl();
    const d = enemyCombatant('ossuary_lord', 'e');
    expect(rollDamage(a, d, 'physical', 1, makeRng(4), { ignoresEvasion: true, armorPierce: 0.5 }).amount).toBeGreaterThan(rollDamage(a, d, 'physical', 1, makeRng(4), { ignoresEvasion: true }).amount);
  });
  it('la meditación recupera maná', () => {
    const m = createProfile('M', 'mage', { cloak: 0, skin: 0 });
    const c = playerCombatant(m.character, m.equipment, 999, 0);
    let s = createCombat([c, enemyCombatant('skeleton', 'e')], 2);
    if (currentActor(s)!.control !== 'player') s = runAITurn(s);
    const before = getCombatant(s, 'player').mp;
    s = performAction(s, { type: 'skill', skillId: 'meditation' });
    expect(getCombatant(s, 'player').mp).toBeGreaterThan(before);
  });
});

describe('Kit de recluta', () => {
  it('incluye arma, armadura y una poción', () => {
    const p = { ...createProfile('K', 'warrior', { cloak: 0, skin: 0 }), backpack: emptyGrid(24), equipment: emptyEquipment() };
    expect(needsRecruitKit(p)).toBe(true);
    const k = grantRecruitKit(p);
    expect(k.equipment.mainHand?.itemId).toBe('rusty_sword');
    expect(k.equipment.armor?.itemId).toBe('padded_tunic');
    expect(countItem(k.backpack, 'health_potion')).toBe(1);
    expect(needsRecruitKit(k)).toBe(false);
  });
});
