import { describe, expect, it } from 'vitest';
import { createCombat, performAction, runAITurn, currentActor, turnOrder, rollDamage, getCombatant, DOOM_ROUND, type Combatant } from '../src/core/combat';
import { enemyCombatant, playerCombatant, rivalCombatant } from '../src/core/combatants';
import { createProfile, needsRecruitKit } from '../src/core/profile';
import { computeStats, applyXp, xpForNextLevel } from '../src/core/stats';
import { addToGrid, emptyGrid, transfer, sortGrid, countItem, removeItem, quickMove, type Containers } from '../src/core/inventory';
import { startExpedition, endExpedition } from '../src/core/expedition';
import { buy, sell } from '../src/core/economy';
import { makeRng } from '../src/core/rng';
import { rollLoot, CHEST_TABLES } from '../src/core/loot';
import { buildDungeon, CRYPTS_OF_UMBRAVEL, findPath } from '../src/core/dungeon';
import { initialRival, talk, proposeAlliance, shareLoot, evaluateBetrayal, betrayalScore, playerBetrays } from '../src/core/social';
import { ITEMS } from '../src/core/data/items';
import { ENEMIES } from '../src/core/data/enemies';

const warriorProfile = () => createProfile('Aldric', 'warrior', { cloak: 0, skin: 0 });

describe('Perfil y estadísticas', () => {
  it('crea un guerrero con su equipo inicial equipado', () => {
    const p = warriorProfile();
    expect(p.equipment.mainHand?.itemId).toBe('rusty_sword');
    expect(p.equipment.offHand?.itemId).toBe('wooden_shield');
    expect(countItem(p.backpack, 'health_potion')).toBe(2);
  });
  it('no permite crear clases no jugables todavía', () => {
    expect(() => createProfile('X', 'rogue', { cloak: 0, skin: 0 })).toThrow();
  });
  it('el equipamiento modifica las estadísticas', () => {
    const p = warriorProfile();
    const withGear = computeStats('warrior', 1, p.equipment);
    const naked = computeStats('warrior', 1, { ...p.equipment, mainHand: null, offHand: null, armor: null });
    expect(withGear.atk - naked.atk).toBe(ITEMS.rusty_sword.stats!.atk);
    expect(withGear.def - naked.def).toBe(ITEMS.wooden_shield.stats!.def! + ITEMS.padded_tunic.stats!.def!);
  });
  it('la experiencia sube de nivel', () => {
    const r = applyXp(1, 0, xpForNextLevel(1) + 5);
    expect(r.level).toBe(2);
    expect(r.xp).toBe(5);
  });
});

describe('Inventario', () => {
  it('apila consumibles compatibles respetando el máximo', () => {
    let g = emptyGrid(4);
    g = addToGrid(g, { uid: 'a', itemId: 'health_potion', qty: 3 }).grid;
    g = addToGrid(g, { uid: 'b', itemId: 'health_potion', qty: 4 }).grid;
    expect(g[0]?.qty).toBe(5);
    expect(g[1]?.qty).toBe(2);
    expect(countItem(g, 'health_potion')).toBe(7);
  });
  it('devuelve sobrante cuando no hay espacio', () => {
    let g = emptyGrid(1);
    g = addToGrid(g, { uid: 'a', itemId: 'iron_sword', qty: 1 }).grid;
    const r = addToGrid(g, { uid: 'b', itemId: 'chainmail', qty: 1 });
    expect(r.leftover?.itemId).toBe('chainmail');
  });
  it('mover a ranura de equipo valida clase y ranura', () => {
    const p = warriorProfile();
    const c: Containers = { backpack: addToGrid(p.backpack, { uid: 's', itemId: 'ember_staff', qty: 1 }).grid, stash: p.stash, loot: emptyGrid(0), equipment: p.equipment };
    const idx = c.backpack.findIndex((s) => s?.itemId === 'ember_staff');
    const r = transfer(c, { kind: 'grid', container: 'backpack', index: idx }, { kind: 'equip', slot: 'mainHand' }, { classId: 'warrior', level: 1 });
    expect(r.ok).toBe(false);
    const r2 = transfer(c, { kind: 'grid', container: 'backpack', index: idx }, { kind: 'equip', slot: 'helmet' }, { classId: 'mage', level: 1 });
    expect(r2.ok).toBe(false);
  });
  it('intercambia arma equipada sin perder objetos', () => {
    const p = warriorProfile();
    const bp = addToGrid(p.backpack, { uid: 'n', itemId: 'iron_sword', qty: 1 }).grid;
    const c: Containers = { backpack: bp, stash: p.stash, loot: emptyGrid(0), equipment: p.equipment };
    const idx = bp.findIndex((s) => s?.itemId === 'iron_sword');
    const r = transfer(c, { kind: 'grid', container: 'backpack', index: idx }, { kind: 'equip', slot: 'mainHand' }, { classId: 'warrior', level: 3 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.containers.equipment.mainHand?.itemId).toBe('iron_sword');
    expect(r.containers.backpack[idx]?.itemId).toBe('rusty_sword');
  });
  it('mover al almacén y ordenar conserva todo', () => {
    const p = warriorProfile();
    const c: Containers = { backpack: p.backpack, stash: p.stash, loot: emptyGrid(0), equipment: p.equipment };
    const r = quickMove(c, { kind: 'grid', container: 'backpack', index: 0 }, 'stash');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(countItem(r.containers.stash, 'health_potion')).toBe(2);
    expect(countItem(r.containers.backpack, 'health_potion')).toBe(0);
    let g = emptyGrid(6);
    for (const id of ['bone_dust', 'iron_sword', 'bone_dust', 'golden_chalice']) g = [...g.slice(0, g.indexOf(null)), { uid: id + Math.random(), itemId: id, qty: 1 }, ...g.slice(g.indexOf(null) + 1)];
    const sorted = sortGrid(g);
    expect(sorted[0]?.itemId).toBe('iron_sword');
    expect(countItem(sorted, 'bone_dust')).toBe(2);
    expect(sorted.filter(Boolean).length).toBe(3);
  });
  it('quita unidades de varias pilas', () => {
    let g = emptyGrid(3);
    g = addToGrid(g, { uid: 'a', itemId: 'health_potion', qty: 7 }).grid;
    const r = removeItem(g, 'health_potion', 6)!;
    expect(countItem(r, 'health_potion')).toBe(1);
    expect(removeItem(r, 'health_potion', 2)).toBeNull();
  });
});

describe('Economía', () => {
  it('comprar una poción descuenta oro y la añade', () => {
    const p = warriorProfile();
    const r = buy(p, 'health_potion');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.profile.gold).toBe(p.gold - ITEMS.health_potion.value);
    expect(countItem(r.profile.backpack, 'health_potion')).toBe(3);
  });
  it('no permite comprar sin oro', () => {
    const p = { ...warriorProfile(), gold: 0 };
    expect(buy(p, 'chainmail').ok).toBe(false);
  });
  it('vender da oro', () => {
    const p = warriorProfile();
    const r = sell(p, 'backpack', 0);
    expect(r.ok && r.profile.gold > p.gold).toBe(true);
  });
});

function duel(seed: number) {
  const p = warriorProfile();
  const pl = playerCombatant(p.character, p.equipment, 999, 999);
  const en = enemyCombatant('skeleton', 'e1');
  return createCombat([pl, en], seed);
}

describe('Combate por turnos', () => {
  it('el orden de turnos lo decide la velocidad', () => {
    const p = warriorProfile();
    const pl = playerCombatant(p.character, p.equipment, 999, 999); // spd 9
    const bat = enemyCombatant('bat', 'b'); // spd 17
    const sk = enemyCombatant('skeleton', 's'); // spd 7
    expect(turnOrder([pl, bat, sk])).toEqual(['b', 'player', 's']);
  });
  it('el combatiente más rápido actúa primero', () => {
    const p = warriorProfile();
    const s = createCombat([playerCombatant(p.character, p.equipment, 999, 999), enemyCombatant('bat', 'b')], 1);
    expect(currentActor(s)?.id).toBe('b');
  });
  it('es determinista con la misma semilla', () => {
    const a = performAction(duel(42), { type: 'attack', targetId: 'e1' });
    const b = performAction(duel(42), { type: 'attack', targetId: 'e1' });
    expect(a.combatants).toEqual(b.combatants);
    expect(a.log).toEqual(b.log);
  });
  it('alterna turnos y respeta el orden', () => {
    let s = duel(7);
    expect(currentActor(s)?.id).toBe('player');
    s = performAction(s, { type: 'attack', targetId: 'e1' });
    if (!s.outcome) expect(currentActor(s)?.id).toBe('e1');
    expect(() => performAction(s, { type: 'skill', skillId: 'fireball', targetId: 'player' })).toThrow();
  });
  it('las habilidades consumen recurso', () => {
    let s = duel(3);
    const before = getCombatant(s, 'player').mp;
    s = performAction(s, { type: 'skill', skillId: 'rending_slash', targetId: 'e1' });
    expect(getCombatant(s, 'player').mp).toBe(Math.min(before - 5 + 2, getCombatant(s, 'player').stats.maxMp));
  });
  it('no permite usar una habilidad sin recurso', () => {
    let s = duel(3);
    s.combatants[0].mp = 0;
    expect(() => performAction(s, { type: 'skill', skillId: 'rending_slash', targetId: 'e1' })).toThrow();
  });
  it('defender reduce a la mitad el daño', () => {
    const p = warriorProfile();
    const pl = playerCombatant(p.character, p.equipment, 999, 999);
    const en = enemyCombatant('skeleton', 'e');
    const normal = rollDamage(en, pl, 'physical', 1, makeRng(5), { ignoresEvasion: true });
    const guarded = rollDamage(en, { ...pl, defending: true }, 'physical', 1, makeRng(5), { ignoresEvasion: true });
    expect(Math.abs(guarded.amount - normal.amount / 2)).toBeLessThanOrEqual(1);
    expect(guarded.amount).toBeLessThan(normal.amount);
  });
  it('la protección reduce el daño y el sangrado hace daño cada turno', () => {
    const p = warriorProfile();
    const pl = playerCombatant(p.character, p.equipment, 999, 999);
    const en = enemyCombatant('skeleton', 'e');
    const prot = rollDamage(en, { ...pl, statuses: [{ id: 'protect', turns: 2 }] }, 'physical', 1, makeRng(9), { ignoresEvasion: true });
    const raw = rollDamage(en, pl, 'physical', 1, makeRng(9), { ignoresEvasion: true });
    expect(prot.amount).toBeLessThan(raw.amount);
    // Aplicar sangrado al esqueleto y comprobar el daño periódico
    let s = duel(11);
    s.combatants[1].statuses = [{ id: 'bleed', turns: 2 }];
    const hp0 = s.combatants[1].hp;
    s = performAction(s, { type: 'defend' }); // turno del jugador
    if (!s.outcome) s = runAITurn(s); // turno del esqueleto: al final sufre sangrado
    const dotEvents = s.events.filter((e) => e.type === 'damage' && e.source === 'dot');
    expect(dotEvents.length).toBe(1);
    expect(getCombatant(s, 'e1').hp).toBeLessThan(hp0);
  });
  it('un aturdido pierde su turno', () => {
    let s = duel(5);
    s.combatants[1].statuses = [{ id: 'stun', turns: 1 }];
    s = performAction(s, { type: 'defend' });
    expect(s.events.some((e) => e.type === 'skip' && e.actorId === 'e1')).toBe(true);
    expect(currentActor(s)?.id).toBe('player');
  });
  it('el combate termina en victoria o derrota', () => {
    for (let seed = 1; seed < 30; seed++) {
      let s = duel(seed);
      let guard = 0;
      while (!s.outcome && guard++ < 200) {
        const a = currentActor(s)!;
        s = a.control === 'player' ? performAction(s, { type: 'attack', targetId: 'e1' }) : runAITurn(s);
      }
      expect(s.outcome).toBe('victory');
    }
  });
  it('no hay combates interminables (la cripta castiga)', () => {
    const tank = (side: 'A' | 'B', id: string): Combatant => ({ ...enemyCombatant('skeleton', id, side), control: side === 'A' ? 'player' : 'ai', stats: { ...enemyCombatant('skeleton', id).stats, maxHp: 500, def: 999, res: 999 }, hp: 500 });
    let s = createCombat([tank('A', 'p'), tank('B', 'x')], 1);
    let guard = 0;
    while (!s.outcome && guard++ < 500) {
      const a = currentActor(s)!;
      s = a.control === 'player' ? performAction(s, { type: 'defend' }) : runAITurn(s);
    }
    expect(s.outcome).not.toBeNull();
    expect(s.round).toBeGreaterThanOrEqual(DOOM_ROUND);
  });
  it('no se puede huir de un jefe', () => {
    const p = warriorProfile();
    let s = createCombat([playerCombatant(p.character, p.equipment, 999, 999), enemyCombatant('ossuary_lord', 'b')], 1, { canFlee: false });
    if (currentActor(s)?.id !== 'player') s = runAITurn(s);
    s = performAction(s, { type: 'flee' });
    expect(s.outcome).not.toBe('fled');
  });
  it('un aliado de IA combate en el bando del jugador', () => {
    const p = warriorProfile();
    let s = createCombat([playerCombatant(p.character, p.equipment, 999, 999), rivalCombatant(105, 'A', 1), enemyCombatant('skeleton', 'e')], 2);
    let guard = 0;
    let rivalActed = false;
    while (!s.outcome && guard++ < 100) {
      const a = currentActor(s)!;
      if (a.id === 'rival') rivalActed = true;
      s = a.control === 'player' ? performAction(s, { type: 'attack', targetId: 'e' }) : runAITurn(s);
    }
    expect(rivalActed).toBe(true);
    expect(s.outcome).toBe('victory');
  });
});

describe('Extracción y muerte', () => {
  it('extraer conserva el botín y el oro', () => {
    const p = warriorProfile();
    const { profile, expedition } = startExpedition(p, 0);
    expedition.backpack = addToGrid(expedition.backpack, { uid: 'loot', itemId: 'golden_chalice', qty: 1 }).grid;
    expedition.goldFound = 50;
    const r = endExpedition(profile, expedition, 'extracted', 1000);
    expect(countItem(r.profile.backpack, 'golden_chalice')).toBe(1);
    expect(r.profile.gold).toBe(p.gold + 50);
    expect(r.profile.equipment.mainHand?.itemId).toBe('rusty_sword');
    expect(r.profile.activeExpedition).toBeNull();
  });
  it('morir pierde lo transportado pero no el almacén ni el oro del banco', () => {
    let p = warriorProfile();
    p = { ...p, stash: addToGrid(p.stash, { uid: 'safe', itemId: 'blood_gem', qty: 1 }).grid };
    const { profile, expedition } = startExpedition(p, 0);
    expedition.backpack = addToGrid(expedition.backpack, { uid: 'loot', itemId: 'golden_chalice', qty: 1 }).grid;
    expedition.goldFound = 50;
    expedition.xpGained = 30;
    const r = endExpedition(profile, expedition, 'died', 1000);
    expect(countItem(r.profile.backpack, 'golden_chalice')).toBe(0);
    expect(r.profile.equipment.mainHand).toBeNull();
    expect(countItem(r.profile.stash, 'blood_gem')).toBe(1);
    expect(r.profile.gold).toBe(p.gold);
    expect(r.profile.character.xp).toBe(30);
    expect(r.summary.lost.length).toBeGreaterThan(0);
    expect(needsRecruitKit(r.profile)).toBe(true);
  });
  it('morir y extraer tienen consecuencias distintas', () => {
    const p = warriorProfile();
    const a = startExpedition(p, 0);
    const b = startExpedition(p, 0);
    const ext = endExpedition(a.profile, a.expedition, 'extracted', 10).profile;
    const dead = endExpedition(b.profile, b.expedition, 'timeout', 10).profile;
    expect(JSON.stringify(ext.equipment)).not.toEqual(JSON.stringify(dead.equipment));
    expect(ext.stats.extractions).toBe(1);
    expect(dead.stats.deaths).toBe(1);
  });
  it('las misiones avanzan', () => {
    const p = warriorProfile();
    const { profile, expedition } = startExpedition(p, 0);
    expedition.kills = { skeleton: 2 };
    const r = endExpedition(profile, expedition, 'extracted', 10);
    expect(r.profile.quests.find((q) => q.id === 'q_bones')?.progress).toBe(2);
    expect(r.profile.quests.find((q) => q.id === 'q_first_escape')?.progress).toBe(1);
  });
});

describe('Botín', () => {
  it('las tablas solo producen objetos existentes', () => {
    const rng = makeRng(123);
    for (const t of [...Object.values(CHEST_TABLES), ...Object.values(ENEMIES).map((e) => e.loot)]) {
      for (let i = 0; i < 50; i++) {
        const r = rollLoot(t, rng);
        for (const it of r.items) expect(ITEMS[it.itemId]).toBeDefined();
        expect(r.gold).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('Mazmorra', () => {
  const d = buildDungeon(CRYPTS_OF_UMBRAVEL);
  const floor = (x: number, y: number) => d.tiles[y]?.[x] === 'floor';
  const solidEntities = new Set(CRYPTS_OF_UMBRAVEL.entities.filter((e) => e.kind === 'pillar').map((e) => `${e.x},${e.y}`));
  const blocked = (x: number, y: number) => !floor(x, y) || solidEntities.has(`${x},${y}`);

  it('todas las entidades están en suelo y las antorchas en muros', () => {
    for (const e of CRYPTS_OF_UMBRAVEL.entities) {
      if (e.kind === 'torch') expect(d.tiles[e.y][e.x], `antorcha ${e.x},${e.y}`).toBe('wall');
      else expect(d.tiles[e.y][e.x], `${e.kind} ${e.x},${e.y}`).toBe('floor');
    }
  });
  it('las antorchas miran a una casilla de suelo', () => {
    for (const e of CRYPTS_OF_UMBRAVEL.entities) {
      if (e.kind !== 'torch') continue;
      const [fx, fy] = e.face === 'south' ? [e.x, e.y + 1] : [e.x + 1, e.y];
      expect(d.tiles[fy][fx], `antorcha ${e.x},${e.y}`).toBe('floor');
    }
  });
  it('el portal, los cofres y el jefe son alcanzables desde el inicio', () => {
    const spawn = CRYPTS_OF_UMBRAVEL.entities.find((e) => e.kind === 'spawn')!;
    for (const e of CRYPTS_OF_UMBRAVEL.entities) {
      if (e.kind === 'portal' || e.kind === 'chest' || e.kind === 'enemy') {
        const path = findPath(d.def.width, d.def.height, blocked, [spawn.x, spawn.y], [e.x, e.y]);
        expect(path, `${e.kind} en ${e.x},${e.y}`).not.toBeNull();
      }
    }
  });
});

describe('Alianzas y traición', () => {
  it('Kael no acepta una alianza sin hablar antes, y sí después', () => {
    let r = initialRival();
    expect(proposeAlliance(r).accepted).toBe(false);
    r = talk(r).rival;
    const res = proposeAlliance(r);
    expect(res.accepted).toBe(true);
    expect(res.rival.disposition).toBe('allied');
  });
  it('no compartir el botín aumenta el riesgo de traición', () => {
    let r = proposeAlliance(talk(initialRival()).rival).rival;
    const ctx = { playerHpPct: 0.8, playerLootValue: 200, nearPortal: false };
    const fair = shareLoot(r, ['old_coin'], 3).rival;
    const greedy = shareLoot(r, [], 3).rival;
    expect(betrayalScore(greedy, ctx)).toBeGreaterThan(betrayalScore(fair, ctx));
    r = greedy;
    const near = evaluateBetrayal(shareLoot(r, [], 3).rival, { playerHpPct: 0.3, playerLootValue: 600, nearPortal: true });
    expect(near.action).toBe('betray');
    expect(near.rival.disposition).toBe('hostile');
  });
  it('un aliado tratado con justicia no traiciona en condiciones normales', () => {
    let r = proposeAlliance(talk(talk(initialRival()).rival).rival).rival;
    r = shareLoot(r, ['old_coin'], 2).rival;
    expect(evaluateBetrayal(r, { playerHpPct: 0.9, playerLootValue: 100, nearPortal: true }).action).not.toBe('betray');
  });
  it('Kael lleva equipo real que se puede saquear', () => {
    const r = initialRival();
    expect(r.bagItemIds).toEqual(expect.arrayContaining(['bone_dagger', 'leather_hood', 'swift_boots']));
    expect(r.gold).toBeGreaterThan(0);
    const after = shareLoot(proposeAlliance(talk(r).rival).rival, ['golden_chalice'], 2).rival;
    expect(after.bagItemIds).toContain('golden_chalice');
  });
  it('el jugador puede traicionar', () => {
    const r = playerBetrays(proposeAlliance(talk(initialRival()).rival).rival);
    expect(r.disposition).toBe('hostile');
    expect(r.betrayedBy).toBe('player');
  });
});
