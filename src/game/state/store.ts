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
import { buy, sell, upgradeStash } from '../../core/economy';
import { computeStats } from '../../core/stats';
import { createCombat, performAction, runAITurn, currentActor, getCombatant, type CombatAction, type CombatState } from '../../core/combat';
import { chestType } from '../../core/data/chests';
import { forge, recipe } from '../../core/forge';
import { QUALITIES } from '../../core/data/forge';
import { VENDORS, type VendorId } from '../../core/data/vendors';
import { REP_RANKS, rankOf } from '../../config/reputation';
import { knowledge, noteKill, noteSeen } from '../../core/bestiary';
import { getZone, zoneEnemyLevel, zoneLock, ZONES, type ZoneId } from '../../core/data/zones';
import { enemyCombatant, playerCombatant, rivalCombatant, enemyXp, rivalHpBack } from '../../core/combatants';
import { getEnemy } from '../../core/data/enemies';
import { getItem } from '../../core/data/items';
import { questDef, isComplete } from '../../core/quests';
import { applyXp } from '../../core/stats';
import { potionAmount } from '../../config/progression';
import { rollLoot, CHEST_TABLES } from '../../core/loot';
import { makeRng, makeUid, randomSeed } from '../../core/rng';
import { initialRival, talk, proposeAlliance, rejectRival, leaveAlliance, shareLoot, evaluateBetrayal, playerBetrays, playerAttacksNeutral, type RivalState } from '../../core/social';
import { bus } from './bus';
import { legendCosmetic, rollEliteDrop, rollReliquary, unlock, wear, getCosmetic } from '../../core/cosmetics';
import { QUEST_COSMETICS, type CosmeticSlot } from '../../core/data/cosmetics';
import { bestPick, mineYield, wearPick, type VeinId } from '../../core/mining';
import { captiveCandidate, dismiss, hire, mercBaseStats, mercCombatant, mercForExpedition, mercHpBack, rescuedMerc, setStance, settleMerc, STANCE_NAME, type MercState } from '../../core/mercenaries';
import { getMerc } from '../../core/data/mercenaries';
import { CAPTIVE_CHANCE } from '../../config/contracts';
import type { MercStance } from '../../core/types';
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
  | { type: 'chestLock'; chestId: string; table: string }
  | { type: 'interact'; options: string[] }
  | { type: 'captive'; mercId: string }
  | { type: 'merc' }
  | null;

export interface Bag { id: string; x: number; y: number; grid: Grid; label: string }

export interface DungeonHud {
  room: string;
  prompt: string | null;
  channel: number; // 0..1 canalizando el portal o picando
  /** Qué se está canalizando (portal o una veta). */
  channelLabel?: string;
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
  /** Mercenario que te acompaña en esta expedición (contratado o rescatado). */
  merc: MercState | null;
  chests: Record<string, Grid>;
  /** Vetas ya picadas en esta expedición. */
  mined: Record<string, boolean>;
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
  merc: null,
  chests: {},
  mined: {},
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
    pocket: inDungeon ? s.expedition!.pocket : s.profile.pocket,
    loot: lootGrid,
  };
}

function applyContainers(c: Containers, lootId?: string) {
  set((s) => {
    if (!s.profile) return {};
    const patch: Partial<GameState> = {};
    if (s.screen === 'dungeon' && s.expedition) {
      const stats = computeStats(s.profile.character.classId, s.profile.character.level, c.equipment);
      patch.expedition = { ...s.expedition, backpack: c.backpack, pocket: c.pocket, equipment: c.equipment, hp: Math.min(s.expedition.hp, stats.maxHp), mp: Math.min(s.expedition.mp, stats.maxMp) };
    } else {
      patch.profile = { ...s.profile, backpack: c.backpack, equipment: c.equipment, stash: c.stash, pocket: c.pocket };
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
/** Desbloquea un aspecto y lo anuncia (si ya lo tenías, no hace nada). */
function grantCosmetic(id: string | null, why: string) {
  const p = state.profile;
  if (!id || !p) return;
  const r = unlock(p, id);
  if (!r.isNew) return;
  set({ profile: r.profile });
  toast(`Nuevo aspecto (${why}): ${getCosmetic(id).name}. Póntelo en el Vestuario.`, 'loot');
}

/** Nivel de las criaturas (y de Kael) en la expedición actual: el del jugador dentro del rango de la zona. */
function combatLevel(): number {
  const s = state;
  return zoneEnemyLevel(getZone(s.dungeon?.zone), s.profile?.character.level ?? 1);
}

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
      exp.hp = Math.min(stats.maxHp, exp.hp + potionAmount(def.use.amount, stats.maxHp));
    } else if (def.use.kind === 'mana') {
      if (exp.mp >= stats.maxMp) return invError('Ya tienes el recurso al máximo.');
      exp.mp = Math.min(stats.maxMp, exp.mp + potionAmount(def.use.amount, stats.maxMp));
    } else if (def.use.kind === 'cleanse') {
      // Veneno, quemadura y sangrado solo existen dentro del combate: fuera no gastes el antídoto
      return invError('El antídoto solo sirve en combate, contra veneno, quemadura o sangrado.');
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
  buy(itemId: string, vendorId: VendorId = 'orvel') {
    const p = state.profile;
    if (!p) return;
    const r = buy(p, itemId, vendorId);
    if (!r.ok) return invError(r.error);
    sfx('coin');
    set({ profile: r.profile });
    toast(`Compras ${getItem(itemId).name}.`, 'good', getItem(itemId).icon);
  },

  forge(recipeId: string, ensure: boolean) {
    const p = state.profile;
    if (!p) return;
    const r = forge(p, recipeId, ensure, makeRng(randomSeed()));
    if (!r.ok) return invError(r.error);
    sfx('equip');
    set({ profile: r.profile });
    const res = getItem(recipe(recipeId).result);
    toast(`Maese Brand forja: ${res.name} · calidad ${QUALITIES[r.quality].name.toLowerCase()}`, r.quality === 2 ? 'loot' : 'good', res.icon);
  },

  upgradeStash() {
    const p = state.profile;
    if (!p) return;
    const r = upgradeStash(p);
    if (!r.ok) return invError(r.error);
    sfx('coin');
    set({ profile: r.profile });
    toast(`Almacén ampliado: ahora tiene ${r.profile.stash.length} casillas.`, 'good');
  },

  // ── Vestuario ──
  wearCosmetic(slot: CosmeticSlot, id: string | null) {
    const p = state.profile;
    if (!p) return;
    set({ profile: wear(p, slot, id) });
    sfx('equip');
  },

  // ── Mercenarios ──
  hireMerc(mercId: string, expeditions: number, stance: MercStance) {
    const p = state.profile;
    if (!p) return;
    const r = hire(p, mercId, expeditions, stance);
    if (!r.ok) return invError(r.error);
    sfx('coin');
    set({ profile: r.profile });
    toast(`${getMerc(mercId).name} se une a ti durante ${expeditions} ${expeditions > 1 ? 'expediciones' : 'expedición'}.`, 'good');
  },

  dismissMerc() {
    const p = state.profile;
    if (!p?.contract) return;
    const name = getMerc(p.contract.mercId).name;
    set({ profile: dismiss(p) });
    toast(`Has rescindido el contrato con ${name}.`, 'info');
  },

  setMercStance(stance: MercStance) {
    const s = state;
    if (!s.profile) return;
    const merc = s.merc ? { ...s.merc, stance } : null;
    const profile = s.merc && !s.merc.rescued ? setStance(s.profile, stance) : !s.merc ? setStance(s.profile, stance) : s.profile;
    set({ profile, merc });
    if (merc) toast(`${getMerc(merc.id).name}: actitud ${STANCE_NAME[stance].toLowerCase()}.`, 'info');
  },

  interactMerc() {
    if (state.merc?.alive) set({ modal: { type: 'merc' } });
  },

  interactCaptive(mercId: string) {
    set({ modal: { type: 'captive', mercId } });
  },

  freeCaptive(mercId: string) {
    const s = state;
    if (!s.expedition) return;
    if (s.merc?.alive) return invError('Ya te acompaña un mercenario.');
    const m = getMerc(mercId);
    set({ merc: rescuedMerc(mercId), modal: null });
    sfx('equip');
    toast(`${m.name} se une a ti. Extrae con vida para que llegue al refugio.`, 'good');
    bus.emit('merc-changed');
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
    if (!q || q.claimed || !isComplete(q, p)) return;
    const def = questDef(id);
    const xp = applyXp(p.character.level, p.character.xp, def.reward.xp);
    // Las entregas se gastan: primero de la mochila, luego del almacén
    let { backpack, stash } = p;
    if (def.type === 'deliver') {
      let left = def.count;
      const fromB = Math.min(left, countItem(backpack, def.target!));
      if (fromB) { backpack = removeItem(backpack, def.target!, fromB) ?? backpack; left -= fromB; }
      if (left) stash = removeItem(stash, def.target!, left) ?? stash;
    }
    const before = p.reputation[def.vendor] ?? 0;
    const after = before + def.reward.rep;
    set({
      profile: {
        ...p, backpack, stash,
        gold: p.gold + def.reward.gold,
        character: { ...p.character, level: xp.level, xp: xp.xp },
        reputation: { ...p.reputation, [def.vendor]: after },
        // Las repetibles vuelven a empezar; las demás quedan cobradas
        quests: p.quests.map((x) => (x.id === id ? (def.repeatable ? { ...x, progress: 0 } : { ...x, claimed: true }) : x)),
      },
    });
    sfx('victory');
    toast(`Misión completada: +${def.reward.gold} oro, +${def.reward.xp} XP, +${def.reward.rep} de reputación${xp.levelsGained ? ' · ¡Subes de nivel!' : ''}`, 'good');
    grantCosmetic(QUEST_COSMETICS[id] ?? null, 'misión');
    if (rankOf(after) >= REP_RANKS.length - 1 && rankOf(before) < REP_RANKS.length - 1) grantCosmetic(legendCosmetic(def.vendor), 'rango Leyenda');
    if (rankOf(after) > rankOf(before)) toast(`${VENDORS[def.vendor].name} te considera ahora «${REP_RANKS[rankOf(after)].name}»: ${Math.round(REP_RANKS[rankOf(after)].discount * 100)}% de descuento y mercancía nueva.`, 'good');
  },

  // ── Expedición ──
  async enterDungeon(zoneId: ZoneId = 'mazmorra') {
    const p = state.profile;
    if (!p) return;
    const lock = zoneLock(ZONES[zoneId], p.character.level, p.bossesDefeated);
    if (lock) return invError(lock);
    // La primera expedición usa la cripta diseñada a mano (sirve de tutorial); después, mapas procedurales de la zona elegida.
    const seed = randomSeed();
    const captive = makeRng(seed ^ 0x51ed).chance(CAPTIVE_CHANCE) ? captiveCandidate(p, zoneId) : null;
    const dungeon = p.stats.expeditions === 0 ? CRYPTS_OF_UMBRAVEL : generateDungeon(seed, { zone: zoneId, captive });
    const started = startExpedition(p, Date.now());
    const profile = started.profile;
    const expedition = { ...started.expedition, zone: dungeon.zone ?? 'mazmorra', chestsOpened: {}, veinsMined: 0 };
    set({
      profile, expedition, dungeon, screen: 'dungeon', summary: null, combat: null, modal: null,
      rival: initialRival(), rivalLine: null, merc: mercForExpedition(p), chests: {}, mined: {}, bags: {},
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
    const mo = settleMerc(profile, s.merc, reason === 'extracted');
    profile = mo.profile;
    if (mo.note) summary = { ...summary, mercNote: mo.note };
    // Kit de recluta automático: si al morir no te queda ningún arma, el intendente te equipa
    if (reason !== 'extracted' && needsRecruitKit(profile)) {
      profile = grantRecruitKit(profile);
      summary = { ...summary, recruitKit: true };
    }
    set({ profile, summary, expedition: null, screen: 'summary', combat: null, modal: null, merc: null });
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

  // ── Minería ──
  /** Termina de picar una veta: mineral a la mochila (o en una bolsa si no cabe) y el pico pierde un uso. */
  mineVein(veinId: string, vein: VeinId) {
    const s = state;
    if (!s.expedition || s.mined[veinId]) return;
    const pick = bestPick(s.expedition.backpack);
    if (!pick) return invError('Necesitas un pico en la mochila. Maese Brand los vende.');
    const items = mineYield(vein, makeRng(randomSeed()));
    const worn = wearPick(s.expedition.backpack, pick.index);
    const r = addManyToGrid(worn.grid, items);
    const exp = { ...state.expedition!, backpack: r.grid, found: [...s.expedition.found, ...items], veinsMined: (s.expedition.veinsMined ?? 0) + 1 };
    set({ expedition: exp, mined: { ...s.mined, [veinId]: true } });
    if (r.leftovers.length) {
      const [x, y] = s.hud.playerTile;
      const bag: Bag = { id: makeUid('bag'), x, y, grid: addManyToGrid(emptyGrid(12), r.leftovers).grid, label: 'Mineral que no cabía' };
      set((st) => ({ bags: { ...st.bags, [bag.id]: bag } }));
      bus.emit('bags-changed');
    }
    sfx('chest');
    for (const it of items) toast(`+${it.qty} ${getItem(it.itemId).name}`, 'loot', getItem(it.itemId).icon);
    if (worn.broke) toast(`Tu ${getItem(pick.stack.itemId).name.toLowerCase()} se ha roto.`, 'danger');
  },

  // ── Cofres y bolsas ──
  openChest(chestId: string, table: string, unlocked = false) {
    const s = state;
    if (!s.expedition) return;
    // Cofres con cerradura: sin la llave no se abren (se muestra la ficha con lo que necesitas)
    if (!s.chests[chestId] && chestType(table).key && !unlocked) {
      set({ modal: { type: 'chestLock', chestId, table } });
      return;
    }
    let grid = s.chests[chestId];
    let gold = 0;
    if (!grid) {
      const rng = makeRng(randomSeed());
      const loot = rollLoot(CHEST_TABLES[table], rng);
      grid = addManyToGrid(emptyGrid(12), loot.items).grid;
      gold = loot.gold;
      const opened = { ...(s.expedition.chestsOpened ?? {}), [table]: (s.expedition.chestsOpened?.[table] ?? 0) + 1 };
      if (chestType(table).look === 'boss' && s.profile) grantCosmetic(rollReliquary(s.profile, s.expedition.zone ?? 'mazmorra', rng), 'relicario');
      set({ expedition: { ...state.expedition!, chestsOpened: opened } });
      sfx('chest');
      if (gold) {
        set({ expedition: { ...state.expedition!, goldFound: state.expedition!.goldFound + gold } });
        toast(`+${gold} de oro`, 'loot', 'coin');
      }
    }
    const count = grid.filter(Boolean).length;
    const title = chestType(table).name;
    set((st) => ({ chests: { ...st.chests, [chestId]: grid }, modal: { type: 'loot', session: { id: chestId, source: 'chest', title, initialCount: count, given: [], shareAsked: st.rival.disposition === 'allied' && count >= 2 && !st.chests[chestId] } } }));
  },

  /** Gasta la llave (primero de la mochila, si no del bolsillo seguro) y abre el cofre. */
  unlockChest(chestId: string, table: string) {
    const s = state;
    const key = chestType(table).key;
    if (!s.expedition || !key) return;
    let { backpack, pocket } = s.expedition;
    if (countItem(backpack, key) > 0) backpack = removeItem(backpack, key, 1) ?? backpack;
    else if (countItem(pocket, key) > 0) pocket = removeItem(pocket, key, 1) ?? pocket;
    else return invError(`Necesitas: ${getItem(key).name}.`);
    set({ expedition: { ...s.expedition, backpack, pocket }, modal: null });
    toast(`Usas: ${getItem(key).name}`, 'info', 'key');
    actions.openChest(chestId, table, true);
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
      if (s.rival.disposition === 'allied') list.push(rivalCombatant(s.rival.hp, 'A', s.rival.potions, combatLevel()));
      if (s.merc?.alive) list.push(mercCombatant(s.merc, 'A', combatLevel()));
      list.push(enemyCombatant(enemyId, entityId ?? 'enemy', 'B', combatLevel()));
      const firstTime = knowledge(s.profile.bestiary, enemyId) === 0;
      set({ profile: { ...s.profile, bestiary: noteSeen(s.profile.bestiary, enemyId) } });
      if (firstTime) toast(`Nueva entrada en el Bestiario: ${e.name}`, 'info');
      title = e.boss ? `¡${e.name}!` : e.name;
      canFlee = !e.boss;
    } else {
      const rc = rivalCombatant(s.rival.hp, 'B', s.rival.potions, combatLevel());
      if (kind === 'betrayal-by-player') rc.statuses.push({ id: 'stun', turns: 1 });
      if (kind === 'betrayal-by-rival') player.statuses.push({ id: 'bleed', turns: 2 });
      list.push(rc);
      // En un duelo es uno contra uno; en una pelea de verdad, tu mercenario te defiende
      if (kind !== 'duel' && s.merc?.alive) list.splice(1, 0, mercCombatant(s.merc, 'A', combatLevel()));
      title = kind === 'duel' ? 'Duelo consensuado con Kael' : kind === 'hostile' ? 'Combate hostil: Kael' : kind === 'betrayal-by-player' ? 'Traición: atacas a Kael por sorpresa' : '¡Kael te traiciona!';
      // Duelo y traiciones: no hay huida posible. Solo el ataque hostil a un Kael neutral permite escapar.
      canFlee = kind === 'hostile';
    }
    const combat = createCombat(list, randomSeed(), { canFlee });
    combat.log.unshift(kind === 'pve' ? `¡${title.replace(/[¡!]/g, '')} te cierra el paso!` : kind === 'duel' ? 'Kael desenvaina con una sonrisa. Duelo hasta la rendición.' : 'Las dagas salen de sus vainas.');
    if (s.rival.disposition === 'allied' && kind === 'pve') combat.log.push('Kael combate a tu lado.');
    if (s.merc?.alive && kind !== 'duel') combat.log.push(`${getMerc(s.merc.id).name} combate a tu lado (${STANCE_NAME[s.merc.stance].toLowerCase()}).`);
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
    if (rc) rival = { ...rival, hp: rivalHpBack(rc.hp, combatLevel()), potions: rc.potions };
    let merc = s.merc;
    const mc = next.combatants.find((c) => c.id === 'merc');
    if (mc && merc) merc = { ...merc, hp: mercHpBack(mc.hp, combatLevel()), potions: mc.potions };
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
            xp += enemyXp(e.xp, combatLevel());
            if (e.boss && !state.profile!.bossesDefeated.includes(e.id)) {
              { const pr = state.profile!; set({ profile: { ...pr, bossesDefeated: [...pr.bossesDefeated, e.id] } }); }
              const next = Object.values(ZONES).find((z) => z.access.bossOf && ZONES[z.access.bossOf].boss === e.id);
              if (next) toast(`Has derrotado a ${e.name}. ${next.name} te espera más abajo (nivel ${next.access.level}).`, 'good');
            }
            const l = rollLoot(e.loot, rng);
            gold += l.gold;
            items.push(...l.items);
            kills[e.id] = (kills[e.id] ?? 0) + 1;
            if (e.elite) grantCosmetic(rollEliteDrop(state.profile!, e.id, rng), 'botín raro');
            { const pr = state.profile!; set({ profile: { ...pr, bestiary: noteKill(pr.bestiary, e.id) } }); }
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
        // Tu mercenario se venda las heridas tras cada victoria
        if (merc?.alive && mc && mc.hp > 0) { const max = mercBaseStats(getMerc(merc.id)).maxHp; merc = { ...merc, hp: Math.min(max, merc.hp + Math.round(max * 0.15)) }; }
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
      if (mc && merc && mc.hp <= 0 && merc.alive) {
        merc = { ...merc, alive: false };
        toast(`${getMerc(merc.id).name} ha caído en combate.${merc.rescued ? '' : ' El contrato se rompe.'}`, 'danger');
      }
      if (rc && rc.side === 'A' && rc.hp <= 0) {
        rival = { ...rival, disposition: 'dead' };
        toast('Kael ha caído en combate.', 'danger');
      }
    }
    set({ combat: { ...s.combat, state: next, rewards }, expedition: exp, rival, merc });
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
    bus.emit('merc-changed');
  },

  backToLobby() {
    set({ screen: 'lobby', summary: null });
  },
};

// Para pruebas automáticas (solo con ?debug en la URL)
export function exposeDebug(extra: Record<string, unknown> = {}) {
  if (typeof window !== 'undefined' && /[?&]debug/.test(window.location.search)) {
    (window as unknown as Record<string, unknown>).__DREADBOUND__ = { getState, actions, setState: (patch: Partial<GameState>) => set(patch), ...extra };
  }
}
