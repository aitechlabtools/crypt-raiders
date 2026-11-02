import { describe, expect, it } from 'vitest';
import { COSMETICS, QUEST_COSMETICS, ELITE_COSMETICS } from '../src/core/data/cosmetics';
import { dressed, fits, legendCosmetic, rollEliteDrop, rollReliquary, unlock, wear } from '../src/core/cosmetics';
import { createProfile, sanitizeProfile } from '../src/core/profile';
import { computeStats } from '../src/core/stats';
import { QUESTS } from '../src/core/data/quests';
import { ENEMIES } from '../src/core/data/enemies';
import { lookOf, lookSignature } from '../src/shared/gearLook';
import { makeRng } from '../src/core/rng';

const base = () => createProfile('Vestida', 'warrior', { cloak: 0, skin: 0 });

describe('Cosméticos', () => {
  it('cada aspecto tiene su apariencia y apunta a misiones/élites reales', () => {
    for (const c of Object.values(COSMETICS)) expect(lookOf(c.id)?.slot, c.id).toBe(c.slot);
    for (const q of Object.keys(QUEST_COSMETICS)) expect(QUESTS.some((x) => x.id === q), q).toBe(true);
    for (const e of Object.keys(ELITE_COSMETICS)) expect(ENEMIES[e]?.elite, e).toBe(true);
    for (const v of ['orvel', 'vesper', 'garra', 'brand']) expect(legendCosmetic(v), v).toBeTruthy();
  });
  it('los de la tienda no se pueden desbloquear jugando', () => {
    expect(unlock(base(), 'shop_dragon_plate').isNew).toBe(false);
  });
  it('ponerse un aspecto cambia el dibujo, nunca las estadísticas', () => {
    let p = unlock(base(), 'cos_ossuary_helm').profile;
    p = { ...p, equipment: { ...p.equipment, helmet: { uid: 'h', itemId: 'iron_helm', qty: 1 } } };
    p = wear(p, 'helmet', 'cos_ossuary_helm');
    const d = dressed(p.equipment, p.wardrobe);
    expect(d.helmet!.itemId).toBe('cos_ossuary_helm');
    expect(lookSignature(d)).not.toBe(lookSignature(p.equipment));
    expect(computeStats('warrior', 1, p.equipment)).toEqual(computeStats('warrior', 1, { ...p.equipment }));
    expect(p.equipment.helmet!.itemId).toBe('iron_helm');
    // Sin nada en la ranura, no se dibuja
    expect(dressed({ ...p.equipment, helmet: null }, p.wardrobe).helmet).toBeNull();
    // No se puede poner uno que no tienes
    expect(wear(p, 'armor', 'cos_relic_robe').wardrobe.armor).toBeUndefined();
  });
  it('las armas solo cambian de aspecto dentro de su familia', () => {
    const p = { ...base(), equipment: { ...base().equipment, mainHand: { uid: 'w', itemId: 'iron_sword', qty: 1 } } };
    expect(fits(COSMETICS.cos_umbral_blade, p.equipment)).toBe(true);
    expect(fits(COSMETICS.cos_umbral_staff, p.equipment)).toBe(false);
  });
  it('el primer relicario de una zona siempre da aspecto; los élites a veces', () => {
    const p = base();
    expect(COSMETICS[rollReliquary(p, 'cripta', makeRng(1))!].zone).toBe('cripta');
    let hits = 0;
    for (let s = 0; s < 500; s++) if (rollEliteDrop(p, 'bandit_captain', makeRng(s))) hits++;
    expect(hits).toBeGreaterThan(20);
    expect(hits).toBeLessThan(100);
  });
  it('perfiles antiguos reciben vestuario vacío y se limpian aspectos que no existen', () => {
    const raw = JSON.parse(JSON.stringify(base()));
    delete raw.cosmetics; delete raw.wardrobe;
    const p = sanitizeProfile(raw)!;
    expect(p.cosmetics).toEqual([]);
    expect(p.wardrobe).toEqual({});
    const bad = sanitizeProfile({ ...JSON.parse(JSON.stringify(base())), cosmetics: ['nope', 'shop_royal_helm', 'cos_veil_hood'], wardrobe: { helmet: 'shop_royal_helm' } })!;
    expect(bad.cosmetics).toEqual(['cos_veil_hood']);
    expect(bad.wardrobe).toEqual({});
  });
});
