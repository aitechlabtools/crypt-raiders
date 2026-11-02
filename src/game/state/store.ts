// ════════════════════════════════════════════════════════════════════
// Estado global del juego y acciones. Orquesta el núcleo (lógica pura),
// la persistencia y la comunicación con la escena de Phaser.
// ════════════════════════════════════════════════════════════════════
import { useSyncExternalStore } from 'react';
import type { Appearance, ClassId, Grid, ItemStack, Profile } from '../../core/types';
import { createProfile, grantRecruitKit, needsRecruitKit } from '../../core/profile';
import { loadProfile, saveProfile, deleteProfile } from '../persistence/db';
import { startExpedition, endExpedition, timeLeft, abandonInterruptedExpedition, type ExpeditionState, type ExpeditionSummary, type EndReason } from '../../core/expedition';
import { addManyToGrid, addToGrid, countItem, emptyGrid, gridValue, removeItem, sortGrid, transfer, quickEquip, quickMove, equippedValue, type Containers, type ContainerId, type Loc, stackAt, clearAt } from '../../core/inventory';
import { buy, sell } from '../../core/economy';
import { computeStats } from '../../core/stats';
import { createCombat, performAction, runAITurn, currentActor, getCombatant, type CombatAction, type CombatState } from '../../core/combat';
import { enemyCombatant, playerCombatant, rivalCombatant, levelScale } from '../../core/combatants';
import { getEnemy } from '../../core/data/enemies';
import { getItem } from '../../core/data/items';
import { questDef, isComplete } from '../../core/quests';
import { applyXp } from '../../core/stats';
import { rollLoot, CHEST_TABLES } from '../../core/loot';
import { makeRng, makeUid, randomSeed } from '../../core/rng';
import { initialRival, talk, proposeAlliance, rejectRival, leaveAlliance, shareLoot, evaluateBetrayal, playerBetrays, playerAttacksNeutral, type RivalState } from '../../core/social';
import { bus } from './bus';
import { CRYPTS_OF_UMBRAVEL, type DungeonDef } from '../../core/dungeon';
import { generateDungeon } from '../../core/dungeonGen';
import { sfx, setVolume } from '../audio';

export type Screen = 'boot' | 'title' | 'create' | 'lobby' | 'dungeon' | 'summary';

export interface Toast { id: number; text: string; kind: 'loot' | 'info' | 'danger' | 'social' | 'good'; icon?: string }

export type CombatKind = 'pve' | 'hostile' | 'betrayal-by-player' | 'betrayal-by-rival' | 'duel';

export interface CombatSession {
  state: CombatState;
  kind: CombatKind;
  entityId: string | null;
  title: string;
  rewards: { xp: number; gold: number; items: ItemStack[]; overflow: boolean } | null;
}

export interface LootSession {
  id: string; // id del cofre o bolsa
  source: 'chest' | 'bag';
  title: string;
  initialCount: number;
  given: string[];
  shareAsked: boolean;
}

export type Modal =
  | { type: 'loot'; session: LootSession }
  | { type: 'rival' }
  | { type: 'confirmBetray' }
  | { type: 'inventory' }
  | { type: 'pause' }
  | { type: 'interact'; options: string[] }
  | null;

export interface Bag { id: string; x: number; y: number; grid: Grid; label: string }

export interface DungeonHud {
  room: string;
  prompt: string | null;
  channel: number; // 0..1 canalizando el portal
  playerTile: [number, number];
}

export interface GameState {
  screen: Screen;
  profile: Profile | null;
  expedition: ExpeditionState | null;
  /** Mazmorra de la expedición en curso. */
  dungeon: DungeonDef | null;
  summary: ExpeditionSummary | null;
  combat: CombatSession | null;
  modal: Modal;
  toasts: Toast[];
  rival: RivalState;
  rivalLine: string | null;
  chests: Record<string, Grid>;
  bags: Record<string, Bag>;
  hud: DungeonHud;
  notice: string | null;
  now: number;
  /** Mensaje de error de inventario (p.ej. «Tu clase no puede usar este objeto»). */
  invError: string | null;
}

const initial: GameState = {
  screen: 'boot',
  profile: null,
  expedition: null,
  dungeon: null,
  summary: null,
  combat: null,
  modal: null,
  toasts: [],
  rival: initialRival(),
  rivalLine: null,
  chests: {},
  bags: {},
  hud: { room: '', prompt: null, channel: 0, playerTile: [0, 0] },
  notice: null,
  now: Date.now(),
  invError: null,
};

let state: GameState = initial;
const listeners = new Set<() => void>();

export function getState(): GameState {
  return state;
}

function set(patch: Partial<GameState> | ((s: GameState) => Partial<GameState>)) {
  const p = typeof patch === 'function' ? patch(state) : patch;
  const prevProfile = state.profile;
  state = { ...state, ...p };
  if (state.profile && state.profile !== prevProfile) scheduleSave();
  listeners.forEach((l) => l());
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useGame<T>(sel: (s: GameState) => T): T {
  return useSyncExternalStore(subscribe, () => sel(state));
}

// ── Guardado ──
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (state.profile) void saveProfile(state.profile);
  }, 150);
}
async function saveNow() {
  if (saveTimer) clearTimeout(saveTimer);
  if (state.profile) await saveProfile(state.profile);
}

// ── Notificaciones ──
let toastId = 0;
export function toast(text: string, kind: Toast['kind'] = 'info', icon?: string) {
  const id = ++toastId;
  set((s) => ({ toasts: [...s.toasts.slice(-4), { id, text, kind, icon }] }));
  setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4200);
}

// ── Contenedores para el inventario ──
export function containersFor(s: GameState, lootId?: string): Containers | null {
  if (!s.profile) return null;
  const inDungeon = s.screen === 'dungeon' && s.expedition;
  const lootGrid = lootId ? (s.chests[lootId] ?? s.bags[lootId]?.grid ?? emptyGrid(0)) : emptyGrid(0);
  return {
    backpack: inDungeon ? s.expedition!.backpack : s.profile.backpack,
    equipment: inDungeon ? s.expedition!.equipment : s.profile.equipment,
    stash: inDungeon ? emptyGrid(0) : s.profile.stash,
    loot: lootGrid,
  };
}

function applyContainers(c: Containers, lootId?: string) {
  set((s) => {
    if (!s.profile) return {};
    const patch: Partial<GameState> = {};
    if (s.screen === 'dungeon' && s.expedition) {
      const stats = computeStats(s.profile.character.classId, s.profile.character.level, c.equipment);
      patch.expedition = { ...s.expedition, backpack: c.backpack, equipment: c.equipment, hp: Math.min(s.expedition.hp, stats.maxHp), mp: Math.min(s.expedition.mp, stats.maxMp) };
    } else {
      patch.profile = { ...s.profile, backpack: c.backpack, equipment: c.equipment, stash: c.stash };
    }
    if (lootId) {
      if (s.chests[lootId]) patch.chests = { ...s.chests, [lootId]: c.loot };
      else if (s.bags[lootId]) patch.bags = { ...s.bags, [lootId]: { ...s.bags[lootId], grid: c.loot } };
    }
    patch.invError = null;
    return patch;
  });
}

function recordFound(stacks: ItemStack[]) {
  const e = state.expedition;
  if (!e || !stacks.length) return;
  set({ expedition: { ...e, found: [...e.found, ...stacks.map((x) => ({ ...x }))] } });
}

function invError(msg: string) {
  sfx('error');
  set({ invError: msg });
  toast(msg, 'danger');
}

function equipCtx() {
  const ch = state.profile!.character;
  return { classId: ch.classId, level: ch.level };
}

// ════════════════════════════════════════════════════════════════════
// Acciones
// ════════════════════════════════════════════════════════════════════
export const actions = {
  async boot() {
    const p = await loadProfile();
    if (p) {
      setVolume(p.settings.volume);
      if (p.activeExpedition) {
        const fixed = abandonInterruptedExpedition(p);
        set({ profile: fixed, screen: 'title', notice: 'Tu última expedición se interrumpió (la página se cerró o recargó). Se ha anulado sin pérdidas: conservas el equipo con el que entraste, pero no el botín que encontraste.' });
        await saveNow();
        return;
      }
    }
    set({ profile: p && needsRecruitKit(p) ? grantRecruitKit(p) : p, screen: 'title' });
  },

  goto(screen: Screen) {
    set({ screen, modal: null });
  },

  dismissNotice() {
    set({ notice: null });
  },

  async createCharacter(name: string, classId: ClassId, appearance: Appearance) {
    const p = createProfile(name, classId, appearance);
    set({ profile: p, screen: 'lobby' });
    await saveNow();
  },

  async deleteCharacter() {
    await deleteProfile();
    set({ ...initial, screen: 'title' });
  },

  setSettings(patch: Partial<Profile['settings']>) {
    const p = state.profile;
    if (patch.volume !== undefined) setVolume(patch.volume);
    if (!p) return;
    set({ profile: { ...p, settings: { ...p.settings, ...patch } } });
  },

  markTutorial(which: 'lobby' | 'dungeon') {
    const p = state.profile;
    if (!p) return;
    set({ profile: { ...p, tutorialSeen: { ...p.tutorialSeen, [which]: true } } });
  },

  // ── Inventario ──
  transfer(from: Loc, to: Loc, lootId?: string) {
    const c = containersFor(state, lootId);
    if (!c) return;
    const moving = stackAt(c, from);
    const r = transfer(c, from, to, equipCtx());
    if (!r.ok) return invError(r.error);
    sfx(to.kind === 'equip' || from.kind === 'equip' ? 'equip' : 'pickup');
    applyContainers(r.containers, lootId);
    if (moving && from.kind === 'grid' && from.container === 'loot' && !(to.kind === 'grid' && to.container === 'loot')) recordFound([moving]);
  },

  quickEquip(from: Loc) {
    const c = containersFor(state);
    if (!c) return;
    const r = quickEquip(c, from, equipCtx());
    if (!r.ok) return invError(r.error);
    sfx('equip');
    applyContainers(r.containers);
  },

  unequip(slot: Loc) {
    const c = containersFor(state);
    if (!c) return;
    const r = quickMove(c, slot, 'backpack');
    if (!r.ok) return invError('No hay espacio en la mochila.');
    sfx('equip');
    applyContainers(r.containers);
  },

  quickMove(from: Loc, target: ContainerId, lootId?: string) {
    const c = containersFor(state, lootId);
    if (!c) return;
    const moving = stackAt(c, from);
    const r = quickMove(c, from, target);
    if (!r.ok) return invError(r.error);
    sfx('pickup');
    applyContainers(r.containers, lootId);
    if (moving && from.kind === 'grid' && from.container === 'loot' && target !== 'loot') recordFound([moving]);
  },

  takeAll(lootId: string) {
    const c = containersFor(state, lootId);
    if (!c) return;
    const stacks = c.loot.filter((s): s is ItemStack => !!s);
    const r = addManyToGrid(c.backpack, stacks);
    const remaining = emptyGrid(c.loot.length);
    r.leftovers.forEach((s, i) => (remaining[i] = s));
    if (stacks.length) sfx('pickup');
    if (r.leftovers.length) invError('Tu mochila está llena. Parte del botín se queda aquí.');
    applyContainers({ ...c, backpack: r.grid, loot: remaining }, lootId);
    recordFound(stacks.filter((x) => !r.leftovers.some((l) => l.uid === x.uid)));
  },

  sortContainer(which: 'backpack' | 'stash') {
    const c = containersFor(state);
    if (!c) return;
    sfx('click');
    applyContainers({ ...c, [which]: sortGrid(c[which]) });
  },

  useItem(loc: Loc) {
    const s = state;
    const c = containersFor(s);
    if (!c || !s.profile) return;
    const st = stackAt(c, loc);
    if (!st) return;
    const def = getItem(st.itemId);
    if (!def.use) return invError('Este objeto no se puede usar.');
    if (s.screen !== 'dungeon' || !s.expedition) return invError('Las pociones solo se usan durante una expedición.');
    const stats = computeStats(s.profile.character.classId, s.profile.character.level, s.expedition.equipment);
    const exp = { ...s.expedition };
    if (def.use.kind === 'heal') {
      if (exp.hp >= stats.maxHp) return invError('Ya tienes la vida al máximo.');
      exp.hp = Math.min(stats.maxHp, exp.hp + def.use.amount);
    } else if (def.use.kind === 'mana') {
      if (exp.mp >= stats.maxMp) return invError('Ya tienes el recurso al máximo.');
      exp.mp = Math.min(stats.maxMp, exp.mp + def.use.amount);
    }
    const grid = removeItem(exp.backpack, st.itemId, 1);
    if (!grid) return;
    exp.backpack = grid;
    sfx('heal');
    set({ expedition: exp });
    toast(`Usas ${def.name}.`, 'good', def.icon);
  },

  drinkPotion() {
    const s = state;
    if (!s.expedition) return;
    const idx = s.expedition.backpack.findIndex((x) => x?.itemId === 'health_potion');
    if (idx < 0) return invError('No te quedan pociones de vida.');
    actions.useItem({ kind: 'grid', container: 'backpack', index: idx });
  },

  /** Suelta un objeto en el suelo de la mazmorra (crea o amplía una bolsa). */
  dropItem(loc: Loc) {
    const s = state;
    const c = containersFor(s);
    if (!c || !s.expedition) return;
    const st = stackAt(c, loc);
    if (!st) return;
    const [x, y] = s.hud.playerTile;
    const existing = Object.values(s.bags).find((b) => b.x === x && b.y === y);
    const bag: Bag = existing ?? { id: makeUid('bag'), x, y, grid: emptyGrid(12), label: 'Bolsa en el suelo' };
    const r = addToGrid(bag.grid, st);
    if (r.leftover) return invError('No cabe nada más en esa bolsa.');
    applyContainers(clearAt(c, loc));
    set((st2) => ({ bags: { ...st2.bags, [bag.id]: { ...bag, grid: r.grid } } }));
    bus.emit('bags-changed');
    sfx('pickup');
  },

  // ── Mercader ──
  buy(itemId: string) {
    const p = state.profile;
    if (!p) return;
    const r = buy(p, itemId);
    if (!r.ok) return invError(r.error);
    sfx('coin');
    set({ profile: r.profile });
    toast(`Compras ${getItem(itemId).name}.`, 'good', getItem(itemId).icon);
  },

  sell(container: 'backpack' | 'stash', index: number, all = false) {
    const p = state.profile;
    if (!p) return;
    const item = p[container][index];
    const r = sell(p, container, index, all);
    if (!r.ok) return invError(r.error);
    sfx('coin');
    set({ profile: r.profile });
    if (item) toast(`Vendes ${getItem(item.itemId).name} por ${r.profile.gold - p.gold} de oro.`, 'good', getItem(item.itemId).icon);
  },

  claimRecruitKit() {
    const p = state.profile;
    if (!p || !needsRecruitKit(p)) return;
    set({ profile: grantRecruitKit(p) });
    sfx('equip');
    toast('El intendente te presta un equipo de recluta.', 'info');
  },

  claimQuest(id: string) {
    const p = state.profile;
    if (!p) return;
    const q = p.quests.find((x) => x.id === id);
    if (!q || q.claimed || !isComplete(q)) return;
    const def = questDef(id);
    const xp = applyXp(p.character.level, p.character.xp, def.reward.xp);
    set({
      profile: {
        ...p,
        gold: p.gold + def.reward.gold,
        character: { ...p.character, level: xp.level, xp: xp.xp },
        quests: p.quests.map((x) => (x.id === id ? { ...x, claimed: true } : x)),
      },
    });
    sfx('victory');
    toast(`Misión completada: +${def.reward.gold} oro, +${def.reward.xp} XP${xp.levelsGained ? ' · ¡Subes de nivel!' : ''}`, 'good');
  },

  // ── Expedición ──
  async enterDungeon() {
    const p = state.profile;
    if (!p) return;
    // La primera expedición usa la cripta diseñada a mano (sirve de tutorial); después, mapas procedurales.
    const dungeon = p.stats.expeditions === 0 ? CRYPTS_OF_UMBRAVEL : generateDungeon(randomSeed());
    const { profile, expedition } = startExpedition(p, Date.now());
    set({
      profile, expedition, dungeon, screen: 'dungeon', summary: null, combat: null, modal: null,
      rival: initialRival(), rivalLine: null, chests: {}, bags: {},
      hud: { room: '', prompt: null, channel: 0, playerTile: [0, 0] },
    });
    await saveNow();
  },

  tick() {
    const s = state;
    const now = Date.now();
    if (s.screen === 'dungeon' && s.expedition && timeLeft(s.expedition, now) <= 0 && !s.summary) {
      void actions.finishExpedition('timeout');
      return;
    }
    set({ now });
  },

  setHud(patch: Partial<DungeonHud>) {
    const h = state.hud;
    const changed = (Object.keys(patch) as (keyof DungeonHud)[]).some((k) => JSON.stringify(patch[k]) !== JSON.stringify(h[k]));
    if (changed) set({ hud: { ...h, ...patch } });
  },

  async finishExpedition(reason: EndReason) {
    const s = state;
    if (!s.profile || !s.expedition) return;
    let { profile, summary } = endExpedition(s.profile, s.expedition, reason, Date.now());
    // Kit de recluta automático: si al morir no te queda ningún arma, el intendente te equipa
    if (reason !== 'extracted' && needsRecruitKit(profile)) {
      profile = grantRecruitKit(profile);
      summary = { ...summary, recruitKit: true };
    }
    set({ profile, summary, expedition: null, screen: 'summary', combat: null, modal: null });
    sfx(reason === 'extracted' ? 'victory' : 'defeat');
    await saveNow();
  },

  trapHit(damage: number) {
    const s = state;
    if (!s.expedition) return;
    const hp = Math.max(0, s.expedition.hp - damage);
    set({ expedition: { ...s.expedition, hp } });
    sfx('trap');
    toast(`¡Una trampa de pinchos! -${damage} de vida.`, 'danger');
    if (hp <= 0) void actions.finishExpedition('died');
  },

  // ── Cofres y bolsas ──
  openChest(chestId: string, table: keyof typeof CHEST_TABLES) {
    const s = state;
    if (!s.expedition) return;
    let grid = s.chests[chestId];
    let gold = 0;
    if (!grid) {
      const rng = makeRng(randomSeed());
      const loot = rollLoot(CHEST_TABLES[table], rng);
      grid = addManyToGrid(emptyGrid(12), loot.items).grid;
      gold = loot.gold;
      sfx('chest');
      if (gold) {
        set({ expedition: { ...s.expedition, goldFound: s.expedition.goldFound + gold } });
        toast(`+${gold} de oro`, 'loot', 'coin');
      }
    }
    const count = grid.filter(Boolean).length;
    const title = table === 'boss' ? 'Cofre del Señor del Osario' : table === 'rich' ? 'Cofre lacrado' : 'Cofre';
    set((st) => ({ chests: { ...st.chests, [chestId]: grid }, modal: { type: 'loot', session: { id: chestId, source: 'chest', title, initialCount: count, given: [], shareAsked: st.rival.disposition === 'allied' && count >= 2 && !st.chests[chestId] } } }));
  },

  openBag(bagId: string) {
    const b = state.bags[bagId];
    if (!b) return;
    set({ modal: { type: 'loot', session: { id: bagId, source: 'bag', title: b.label, initialCount: 0, given: [], shareAsked: false } } });
  },

  /** Da un objeto del cofre a Kael como parte del reparto. */
  giveToRival(lootId: string, index: number) {
    const s = state;
    const m = s.modal;
    if (m?.type !== 'loot') return;
    const grid = [...(s.chests[lootId] ?? [])];
    const it = grid[index];
    if (!it) return;
    grid[index] = null;
    sfx('pickup');
    set({ chests: { ...s.chests, [lootId]: grid }, modal: { type: 'loot', session: { ...m.session, given: [...m.session.given, it.itemId] } } });
  },

  closeLoot() {
    const s = state;
    const m = s.modal;
    if (m?.type === 'loot') {
      // Recogida de oro implícita en bolsas: nada. Reparto con aliado:
      if (m.session.shareAsked) {
        const r = shareLoot(s.rival, m.session.given, m.session.initialCount);
        set({ rival: r.rival });
        if (r.line) toast(r.line, m.session.given.length ? 'social' : 'danger');
      }
      // Bolsas vacías desaparecen
      if (m.session.source === 'bag') {
        const b = state.bags[m.session.id];
        if (b && !b.grid.some(Boolean)) {
          const bags = { ...state.bags };
          delete bags[m.session.id];
          set({ bags });
          bus.emit('bags-changed');
        }
      }
    }
    set({ modal: null });
  },

  openModal(modal: Modal) {
    set({ modal });
  },

  closeModal() {
    if (state.modal?.type === 'loot') return actions.closeLoot();
    set({ modal: null });
  },

  // ── Rival ──
  interactRival() {
    set({ modal: { type: 'rival' }, rivalLine: null });
  },

  rivalTalk() {
    const r = talk(state.rival);
    set({ rival: r.rival, rivalLine: r.line });
  },

  rivalPropose() {
    const r = proposeAlliance(state.rival);
    set({ rival: r.rival, rivalLine: r.line });
    if (r.accepted) {
      sfx('heal');
      toast('Kael se une a ti. Os repartiréis el botín.', 'social');
      bus.emit('rival-changed');
    }
  },

  rivalIgnore() {
    const r = rejectRival(state.rival);
    set({ rival: r.rival, rivalLine: null, modal: null });
    toast(r.line, 'social');
    bus.emit('rival-changed');
  },

  rivalLeave() {
    const r = leaveAlliance(state.rival);
    set({ rival: r.rival, rivalLine: null, modal: null });
    toast(r.line, 'social');
    bus.emit('rival-changed');
  },

  rivalDuel() {
    const r = state.rival;
    if (r.trust < 30) {
      set({ rivalLine: 'Kael: «¿Un duelo amistoso? No me fío de tus «amistades».»' });
      return;
    }
    set({ rivalLine: null, modal: null });
    actions.startCombat('duel', null);
  },

  rivalAttack() {
    set({ rival: playerAttacksNeutral(state.rival), modal: null, rivalLine: null });
    bus.emit('rival-changed');
    actions.startCombat('hostile', null);
  },

  askBetray() {
    set({ modal: { type: 'confirmBetray' } });
  },

  confirmBetray() {
    set({ rival: playerBetrays(state.rival), modal: null, rivalLine: null });
    sfx('betray');
    bus.emit('rival-changed');
    actions.startCombat('betrayal-by-player', null);
  },

  /** La escena lo llama periódicamente mientras Kael es aliado. */
  checkBetrayal(nearPortal: boolean) {
    const s = state;
    if (!s.expedition || !s.profile || s.combat || s.modal) return;
    const stats = computeStats(s.profile.character.classId, s.profile.character.level, s.expedition.equipment);
    const r = evaluateBetrayal(s.rival, {
      playerHpPct: s.expedition.hp / stats.maxHp,
      playerLootValue: gridValue(s.expedition.backpack) + equippedValue(s.expedition.equipment) * 0.3,
      nearPortal,
    });
    if (r.action === 'none') return;
    set({ rival: r.rival });
    if (r.action === 'warn') toast(r.line!, 'danger');
    if (r.action === 'betray') {
      sfx('betray');
      toast(r.line!, 'danger');
      bus.emit('rival-changed');
      actions.startCombat('betrayal-by-rival', null);
    }
  },

  // ── Combate ──
  startCombat(kind: CombatKind, entityId: string | null, enemyId?: string) {
    const s = state;
    if (!s.profile || !s.expedition || s.combat) return;
    const ch = s.profile.character;
    const player = playerCombatant(ch, s.expedition.equipment, s.expedition.hp, s.expedition.mp);
    const list = [player];
    let title = '';
    let canFlee = true;
    if (kind === 'pve' && enemyId) {
      const e = getEnemy(enemyId);
      if (s.rival.disposition === 'allied') list.push(rivalCombatant(s.rival.hp, 'A', s.rival.potions));
      list.push(enemyCombatant(enemyId, entityId ?? 'enemy', 'B', ch.level));
      title = e.boss ? `¡${e.name}!` : e.name;
      canFlee = !e.boss;
    } else {
      const rc = rivalCombatant(s.rival.hp, 'B', s.rival.potions);
      if (kind === 'betrayal-by-player') rc.statuses.push({ id: 'stun', turns: 1 });
      if (kind === 'betrayal-by-rival') player.statuses.push({ id: 'bleed', turns: 2 });
      list.push(rc);
      title = kind === 'duel' ? 'Duelo consensuado con Kael' : kind === 'hostile' ? 'Combate hostil: Kael' : kind === 'betrayal-by-player' ? 'Traición: atacas a Kael por sorpresa' : '¡Kael te traiciona!';
      // Duelo y traiciones: no hay huida posible. Solo el ataque hostil a un Kael neutral permite escapar.
      canFlee = kind === 'hostile';
    }
    const combat = createCombat(list, randomSeed(), { canFlee });
    combat.log.unshift(kind === 'pve' ? `¡${title.replace(/[¡!]/g, '')} te cierra el paso!` : kind === 'duel' ? 'Kael desenvaina con una sonrisa. Duelo hasta la rendición.' : 'Las dagas salen de sus vainas.');
    if (s.rival.disposition === 'allied' && kind === 'pve') combat.log.push('Kael combate a tu lado.');
    set({ combat: { state: combat, kind, entityId, title, rewards: null }, modal: null });
    bus.emit('cancel-channel');
  },

  combatAct(action: CombatAction) {
    const s = state;
    if (!s.combat || !s.expedition) return;
    const actor = currentActor(s.combat.state);
    if (!actor || actor.control !== 'player') return;
    if (action.type === 'item' && countItem(s.expedition.backpack, action.itemId) <= 0) return invError('No tienes ese objeto.');
    let next: CombatState;
    try {
      next = performAction(s.combat.state, action);
    } catch (e) {
      return invError((e as Error).message);
    }
    actions.afterCombatStep(next);
  },

  combatAI() {
    const s = state;
    if (!s.combat) return;
    const actor = currentActor(s.combat.state);
    if (!actor || actor.control === 'player') return;
    actions.afterCombatStep(runAITurn(s.combat.state));
  },

  afterCombatStep(next: CombatState) {
    const s = state;
    if (!s.combat || !s.expedition || !s.profile) return;
    let exp = { ...s.expedition };
    for (const ev of next.events) {
      if (ev.type === 'itemUsed' && ev.actorId === 'player') exp.backpack = removeItem(exp.backpack, ev.itemId, 1) ?? exp.backpack;
    }
    const pl = getCombatant(next, 'player');
    exp.hp = pl.hp;
    exp.mp = pl.mp;
    let rival = s.rival;
    const rc = next.combatants.find((c) => c.id === 'rival');
    if (rc) rival = { ...rival, hp: rc.hp, potions: rc.potions };
    let rewards = s.combat.rewards;

    if (next.outcome) {
      const kind = s.combat.kind;
      if (next.outcome === 'victory') {
        const rng = makeRng(randomSeed());
        let xp = 0, gold = 0;
        const items: ItemStack[] = [];
        const kills = { ...exp.kills };
        for (const c of next.combatants.filter((x) => x.side === 'B')) {
          if (c.ref && c.ref !== 'rival') {
            const e = getEnemy(c.ref);
            xp += Math.round(e.xp * levelScale(s.profile.character.level));
            const l = rollLoot(e.loot, rng);
            gold += l.gold;
            items.push(...l.items);
            kills[e.id] = (kills[e.id] ?? 0) + 1;
          }
        }
        if (rc && rc.side === 'B') {
          if (kind === 'duel') {
            gold += 25;
            xp += 20;
            rival = { ...rival, hp: Math.max(30, rival.hp), trust: Math.min(100, rival.trust + 10) };
          } else {
            xp += 60;
            gold += rival.gold;
            rival = { ...rival, disposition: 'dead' };
            // El cuerpo de Kael deja una bolsa con sus pertenencias
            const bagGrid = addManyToGrid(emptyGrid(12), rival.bagItemIds.map((id) => ({ uid: makeUid(), itemId: id, qty: 1 }))).grid;
            const [x, y] = s.hud.playerTile;
            const bag: Bag = { id: makeUid('bag'), x, y, grid: bagGrid, label: 'Pertenencias de Kael' };
            set((st) => ({ bags: { ...st.bags, [bag.id]: bag } }));
            bus.emit('bags-changed');
          }
        }
        const r = addManyToGrid(exp.backpack, items);
        exp.backpack = r.grid;
        exp.found = [...exp.found, ...items];
        exp.goldFound += gold;
        exp.xpGained += xp;
        exp.kills = kills;
        if (r.leftovers.length) {
          const [x, y] = s.hud.playerTile;
          const bag: Bag = { id: makeUid('bag'), x, y, grid: addManyToGrid(emptyGrid(12), r.leftovers).grid, label: 'Botín que no cabía' };
          set((st) => ({ bags: { ...st.bags, [bag.id]: bag } }));
          bus.emit('bags-changed');
        }
        rewards = { xp, gold, items, overflow: r.leftovers.length > 0 };
        sfx('victory');
      } else if (next.outcome === 'defeat' && kind === 'duel') {
        // Un duelo consensuado no mata: quedas fuera de combate con algo de vida.
        exp.hp = Math.max(1, Math.round(computeStats(s.profile.character.classId, s.profile.character.level, exp.equipment).maxHp * 0.25));
        rewards = { xp: 10, gold: 0, items: [], overflow: false };
        exp.xpGained += 10;
        rival = { ...rival, trust: Math.min(100, rival.trust + 5) };
      } else if (next.outcome === 'defeat') {
        sfx('defeat');
      }
      if (rc && rc.side === 'A' && rc.hp <= 0) {
        rival = { ...rival, disposition: 'dead' };
        toast('Kael ha caído en combate.', 'danger');
      }
    }
    set({ combat: { ...s.combat, state: next, rewards }, expedition: exp, rival });
  },

  closeCombat() {
    const s = state;
    if (!s.combat?.state.outcome) return;
    const { outcome } = s.combat.state;
    const kind = s.combat.kind;
    const entityId = s.combat.entityId;
    if (outcome === 'defeat' && kind !== 'duel') {
      set({ combat: null });
      void actions.finishExpedition('died');
      return;
    }
    if (kind !== 'pve' && kind !== 'duel' && outcome === 'fled') {
      // Huiste de Kael: se queda hostil.
    }
    set({ combat: null });
    bus.emit('combat-ended', { entityId, outcome, kind });
    bus.emit('rival-changed');
  },

  backToLobby() {
    set({ screen: 'lobby', summary: null });
  },
};

// Para pruebas automáticas (solo con ?debug en la URL)
export function exposeDebug(extra: Record<string, unknown> = {}) {
  if (typeof window !== 'undefined' && /[?&]debug/.test(window.location.search)) {
    (window as unknown as Record<string, unknown>).__DREADBOUND__ = { getState, actions, ...extra };
  }
}
