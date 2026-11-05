import { withGold } from './helpers';
import { describe, expect, it } from 'vitest';
import { VENDORS, VENDOR_ORDER } from '../src/core/data/vendors';
import { QUESTS } from '../src/core/data/quests';
import { ITEMS } from '../src/core/data/items';
import { ENEMIES } from '../src/core/data/enemies';
import { REP_RANKS, rankOf } from '../src/config/reputation';
import { buy, buyPrice } from '../src/core/economy';
import { createProfile } from '../src/core/profile';
import { boardQuests, updateQuests, isComplete, initialQuests, readyQuestCount, acceptQuest, abandonQuest, togglePin, afterClaim, activeQuests, isOldQuest, migrateQuests, pinnedQuests } from '../src/core/quests';
import { MAX_ACTIVE_QUESTS } from '../src/core/data/quests';
const acceptAll = (qs: ReturnType<typeof initialQuests>): ReturnType<typeof initialQuests> => qs.map((q) => ({ ...q, accepted: true }));
import { addToGrid } from '../src/core/inventory';

describe('Vendedores y reputación', () => {
  it('toda la mercancía existe y cada vendedor tiene misiones', () => {
    for (const id of VENDOR_ORDER) {
      for (const s of VENDORS[id].stock) expect(ITEMS[s.itemId], `${id} → ${s.itemId}`).toBeTruthy();
      // El Coleccionista no da encargos (solo comercia)
      if (id !== 'coleccionista') expect(QUESTS.filter((q) => q.vendor === id).length, id).toBeGreaterThanOrEqual(4);
    }
  });
  it('las misiones apuntan a criaturas y objetos que existen', () => {
    for (const q of QUESTS) {
      if (q.type === 'kill' || q.type === 'kill_boss') expect(ENEMIES[q.target!], q.id).toBeTruthy();
      if (q.type === 'deliver') expect(ITEMS[q.target!], q.id).toBeTruthy();
    }
  });
  it('los rangos bajan el precio', () => {
    expect(rankOf(0)).toBe(0);
    expect(rankOf(320)).toBe(2);
    expect(buyPrice('iron_sword', 0)).toBe(Math.round(ITEMS.iron_sword.value / 10));
    expect(buyPrice('iron_sword', 1500)).toBe(Math.round(ITEMS.iron_sword.value / 10 * (1 - REP_RANKS[4].discount)));
  });
  it('lo bueno pide rango: sin reputación no te lo venden', () => {
    const p = withGold(createProfile('A', 'warrior', { cloak: 0, skin: 0 }), 10_000);
    expect(buy(p, 'bone_key', 'vesper').ok).toBe(false);
    expect(buy({ ...p, reputation: { vesper: 300 } }, 'bone_key', 'vesper').ok).toBe(true);
    expect(buy(p, 'bone_key', 'orvel').ok).toBe(false);
  });
});

describe('Misiones de los vendedores', () => {
  it('el tablón enseña todas las de tu nivel, primero las de tu zona', () => {
    const p = createProfile('A', 'warrior', { cloak: 0, skin: 0 });
    for (const id of VENDOR_ORDER) {
      const o = boardQuests(p, id);
      expect(o.length).toBe(QUESTS.filter((q) => q.vendor === id && (q.minLevel ?? 1) <= 1).length);
    }
    const hi = { ...p, character: { ...p.character, level: 45 } };
    expect(boardQuests(hi, 'vesper')[0].id).not.toBe('q_bones');
    expect(isOldQuest('q_bones', 45)).toBe(true);
    expect(isOldQuest('q_bones', 30)).toBe(false);
  });
  it('aceptar (máximo 5), dejar (pierde lo hecho), fijar y cobrar', () => {
    let p = createProfile('A', 'warrior', { cloak: 0, skin: 0 });
    const ids = QUESTS.filter((q) => (q.minLevel ?? 1) <= 1).map((q) => q.id);
    for (const id of ids.slice(0, MAX_ACTIVE_QUESTS)) { const r = acceptQuest(p, id); if (!r.ok) throw new Error(r.error); p = r.profile; }
    expect(activeQuests(p).length).toBe(MAX_ACTIVE_QUESTS);
    expect(acceptQuest(p, ids[MAX_ACTIVE_QUESTS]).ok).toBe(false);
    // Solo avanzan las aceptadas
    p = { ...p, quests: updateQuests(p.quests, { extracted: true, kills: {}, extractedValue: 0 }) };
    expect(p.quests.find((q) => q.id === 'q_first_escape')!.progress).toBe(1);
    const notAccepted = ids.slice(MAX_ACTIVE_QUESTS).find((id) => QUESTS.find((q) => q.id === id)!.type === 'extract');
    if (notAccepted) expect(p.quests.find((q) => q.id === notAccepted)!.progress).toBe(0);
    p = togglePin(p, 'q_first_escape');
    expect(pinnedQuests(p).map((q) => q.id)).toEqual(['q_first_escape']);
    expect(readyQuestCount(p)).toBe(1);
    const left = abandonQuest(p, 'q_first_escape');
    expect(left.quests.find((q) => q.id === 'q_first_escape')).toMatchObject({ accepted: false, pinned: false, progress: 0 });
    const claimed = afterClaim(p, 'q_first_escape');
    expect(claimed.quests.find((q) => q.id === 'q_first_escape')).toMatchObject({ claimed: true, accepted: false });
  });
  it('las partidas antiguas: las misiones empezadas pasan a aceptadas', () => {
    const old = [{ id: 'q_bones', progress: 2, claimed: false }, { id: 'q_lord', progress: 0, claimed: false }, { id: 'q_first_escape', progress: 1, claimed: true }];
    const m = migrateQuests(old);
    expect(m.map((q) => q.accepted)).toEqual([true, false, false]);
    expect(migrateQuests(m)).toBe(m);
  });
  it('extraer desde una zona y abrir cofres cuentan', () => {
    let qs = acceptAll(initialQuests());
    qs = updateQuests(qs, { extracted: true, kills: {}, extractedValue: 0, zone: 'cripta', chestsOpened: { rich: 2 } });
    expect(qs.find((q) => q.id === 'q_brand_crypt')!.progress).toBe(1);
    expect(qs.find((q) => q.id === 'q_orvel_iron')!.progress).toBe(2);
  });
  it('las entregas se completan con lo que tienes', () => {
    const p = createProfile('A', 'warrior', { cloak: 0, skin: 0 });
    const q = p.quests.find((x) => x.id === 'q_brand_bone')!;
    expect(isComplete(q, p)).toBe(false);
    const rich = { ...p, stash: addToGrid(p.stash, { uid: 'd', itemId: 'bone_dust', qty: 10 }).grid };
    expect(isComplete(q, rich)).toBe(true);
  });
});

describe('Aviso de misiones listas', () => {
  it('solo cuenta las aceptadas y completas', () => {
    const p = createProfile('Aldric', 'warrior', { cloak: 0, skin: 0 });
    const done = p.quests.map((q) => (q.id === 'q_garra_bandits' ? { ...q, progress: 5 } : q));
    expect(readyQuestCount({ ...p, quests: done })).toBe(0);
    const acc = done.map((q) => (q.id === 'q_garra_bandits' ? { ...q, accepted: true } : q));
    expect(readyQuestCount({ ...p, quests: acc })).toBe(1);
    expect(readyQuestCount({ ...p, quests: acc }, 'garra')).toBe(1);
    expect(readyQuestCount({ ...p, quests: acc }, 'orvel')).toBe(0);
  });
});
