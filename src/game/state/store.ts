// ════════════════════════════════════════════════════════════════════
// Estado global del juego y acciones. Orquesta el núcleo (lógica pura),
// la persistencia y la comunicación con la escena de Phaser.
// ════════════════════════════════════════════════════════════════════
import { useSyncExternalStore } from 'react';
import type { Appearance, ClassId, Grid, ItemStack, Profile, Rarity } from '../../core/types';
import { AFFIXES, RARITY_RULES, rollStacks } from '../../core/data/rarity';
import { createProfile, grantRecruitKit, needsRecruitKit } from '../../core/profile';
import { clearUndo, loadSave, loadUndo, saveSave, saveUndo } from '../persistence/db';
import { backupFileName, backupStatus, backupToCode, backupToJson, buildBackup, totalExpeditions, type BackupStatus } from '../../core/backup';
import { STASH_PAGE_SIZE } from '../../config/stash';
import { addCharacter, applyProfile, composeProfile, currentCharacterId, emptySave, MAX_CHARACTERS, removeCharacter, type SaveData } from '../../core/save';
import { startExpedition, endExpedition, timeLeft, abandonInterruptedExpedition, type ExpeditionState, type ExpeditionSummary, type EndReason } from '../../core/expedition';
import { addManyToGrid, addToGrid, anchorIndex, countItem, emptyGrid, isMulti, LAYOUTS, removeItem, sortGrid, transfer, quickEquip, quickMove, type Containers, type ContainerId, type Loc, stackAt, clearAt } from '../../core/inventory';
import { buy, sell } from '../../core/economy';
import { addToPage, buySharedPage, buyStashPage, joinPages, pageCount, pageSlice as pageSliceOf, sortPage, splitPages, type StashPage } from '../../core/stashPages';
import { equipBag } from '../../core/bag';
import { coins as coinsStack, gridGold, groupGold, splitCoins, withdrawCoins } from '../../core/gold';
import { earnGoldSafe, NO_ROOM_FOR_GOLD, putCoinsPartial, setGoldExactly, syncGold, takeCoins } from '../../core/wallet';
import { COIN_ID } from '../../config/gold';
import { computeStats } from '../../core/stats';
import { createCombat, performAction, runAITurn, currentActor, getCombatant, type CombatAction, type CombatState } from '../../core/combat';
import { chestType } from '../../core/data/chests';
import { forge, recipe } from '../../core/forge';
import { QUALITIES } from '../../core/data/forge';
import { VENDORS, type VendorId } from '../../core/data/vendors';
import { REP_RANKS, rankOf } from '../../config/reputation';
import { knowledge, noteKill, noteSeen } from '../../core/bestiary';
import { areaDef, defaultSubzone, subzoneLock, zoneEnemyLevel, ZONES, type SubzoneId, type ZoneId } from '../../core/data/zones';
import { getSubzone, isSubzoneId, subzonesOf, SUBZONE_ORDER } from '../../core/data/subzones';
import { overlevelPenalty } from '../../config/subzones';
import { enemyCombatant, playerCombatant, rivalCombatant, enemyXp, rivalHpBack } from '../../core/combatants';
import { getEnemy } from '../../core/data/enemies';
import { getItem } from '../../core/data/items';
import { CLASSES } from '../../core/data/classes';
import { equipClassSkill, unlockClassSkill } from '../../core/classSkills';
import { getSkill } from '../../core/data/skills';
import { questDef, isComplete } from '../../core/quests';
import { applyXp } from '../../core/stats';
import { potionAmount } from '../../config/progression';
import { rollLoot, adaptDrops, CHEST_TABLES, subzoneChestTable } from '../../core/loot';
import { makeRng, makeUid, randomSeed } from '../../core/rng';
import { noRival, initialRival, talk, greetLine, proposeAlliance, rejectRival, leaveAlliance, shareLoot, evaluateBetrayal, playerBetrays, playerAttacksNeutral, rollEncounter, goldShare, type RivalState } from '../../core/social';
import { getWanderer } from '../../core/data/wanderers';
import { TUTORIAL_MAP, TUTORIAL_REWARD, TUTORIAL_STEPS, tutorialRoomCenter, tutorialRoomOf } from '../../core/data/tutorial';
import { GOLD_SHARE, ROB_ITEMS } from '../../config/wanderers';
import { bus } from './bus';
import { buySkin, equipSkin } from '../../core/skins';
import { getSkin } from '../../core/data/skins';
import { bestPick, mineYield, wearPick, type VeinId } from '../../core/mining';
import { captiveCandidate, dismiss, hire, mercBaseStats, mercCombatant, mercForExpedition, mercHpBack, rescuedMerc, setStance, settleMerc, STANCE_NAME, type MercState } from '../../core/mercenaries';
import { getMerc } from '../../core/data/mercenaries';
import { CAPTIVE_CHANCE } from '../../config/contracts';
import type { MercStance } from '../../core/types';
import { CRYPTS_OF_UMBRAVEL, type DungeonDef } from '../../core/dungeon';
import { generateDungeon } from '../../core/dungeonGen';
import { sfx, setVolume } from '../audio';

export type Screen = 'boot' | 'title' | 'select' | 'backup' | 'create' | 'lobby' | 'dungeon' | 'summary';

/** Un personaje en la pantalla de selección (lo justo para dibujarlo y describirlo). */
export interface RosterEntry {
  id: string; slot: number; name: string; classId: ClassId; level: number; gold: number; lastPlayedAt: number;
  appearance: Appearance; equipment: Profile['equipment']; skin: string | null;
}

export interface Toast { id: number; text: string; kind: 'loot' | 'info' | 'danger' | 'social' | 'good'; icon?: string }

export type CombatKind = 'pve' | 'hostile' | 'betrayal-by-player' | 'betrayal-by-rival';

export interface CombatSession {
  state: CombatState;
  kind: CombatKind;
  entityId: string | null;
  title: string;
  rewards: { xp: number; gold: number; items: ItemStack[]; overflow: boolean; /** Saco del suelo con el botín. */ bagId?: string | null } | null;
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

/** Tutorial en curso (primera expedición, o repetido desde Ajustes). */
export interface TutorialRun {
  step: number;
  /** Repetido desde Ajustes: sin recompensas, y al acabar se devuelve el perfil tal como estaba. */
  replay: Profile | null;
  /** Pociones que llevabas al empezar el paso de la poción. */
  potionsAt?: number;
  betrayalStarted?: boolean;
}

export interface GameState {
  screen: Screen;
  tutorial: TutorialRun | null;
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
  /** Pantalla en vertical en un móvil: la escena se congela hasta que se gire (el reloj sigue, como en el menú de pausa). */
  suspended: boolean;
  /** Mensaje de error de inventario (p.ej. «Tu clase no puede usar este objeto»). */
  invError: string | null;
  /** Personajes de la partida (hasta 4) y cuál está activo. */
  roster: RosterEntry[];
  activeId: string | null;
  /** El tutorial ya se jugó con algún personaje (los siguientes pueden saltarlo). */
  accountTutorialDone: boolean;
  /** Hueco elegido en la selección para el personaje que se está creando. */
  createSlot: number | null;
  /** Página del almacén que se está viendo (0 = la primera, 'shared' = «Compartido»). */
  stashPage: StashPage;
  /** Título del aviso de la pantalla de título (por defecto, «Expedición interrumpida»). */
  noticeTitle: string | null;
  /** Estado de las copias de seguridad (última copia, recordatorio). */
  backup: BackupStatus | null;
  /** Mercader con el que se está hablando (decide qué compra y a qué precio al vender). */
  activeVendor: VendorId | null;
  /** Bloque que se destaca al abrir la copia de seguridad («Tengo una copia» → cargar). */
  backupFocus: 'load' | null;
  /** Hay una partida guardada de antes de la última importación (para deshacerla): cuándo se importó. */
  undoAt: number | null;
  /** El navegador conserva los datos de forma persistente (true), no lo garantiza (false) o no se sabe (null). */
  persisted: boolean | null;
}

const initial: GameState = {
  screen: 'boot',
  profile: null,
  expedition: null,
  dungeon: null,
  summary: null,
  tutorial: null,
  combat: null,
  modal: null,
  suspended: false,
  toasts: [],
  rival: noRival(),
  rivalLine: null,
  merc: null,
  chests: {},
  mined: {},
  bags: {},
  hud: { room: '', prompt: null, channel: 0, playerTile: [0, 0] },
  notice: null,
  now: Date.now(),
  invError: null,
  roster: [],
  activeId: null,
  accountTutorialDone: false,
  createSlot: null,
  stashPage: 0,
  noticeTitle: null,
  backup: null,
  activeVendor: null,
  backupFocus: null,
  undoAt: null,
  persisted: null,
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
  if (state.profile && state.profile !== prevProfile) state = { ...state, profile: syncGold(state.profile) };
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
// La partida (cuenta + hasta 4 personajes) vive aquí; el juego trabaja con `state.profile`, que es el personaje
// activo montado con los datos de la cuenta. Al guardar, el perfil se reparte de nuevo en la partida.
let save: SaveData | null = null;
let activeId: string | null = null;
export function getSave(): SaveData | null { return save; }
export function getActiveCharacterId(): string | null { return activeId; }

function syncSave() {
  if (save && activeId && state.profile) save = applyProfile(save, state.profile, activeId);
}
function rosterOf(sv: SaveData | null): RosterEntry[] {
  if (!sv) return [];
  return sv.characters.map((c) => ({
    id: c.id, slot: c.slot, name: c.character.name, classId: c.character.classId, level: c.character.level, gold: c.gold,
    lastPlayedAt: c.lastPlayedAt, appearance: c.character.appearance, equipment: c.equipment,
    skin: c.skinEquipped && sv.account.skinsOwned.includes(c.skinEquipped) ? c.skinEquipped : null,
  }));
}
/** Pone al día la lista de personajes que ve la interfaz. */
function refreshRoster() {
  set({ roster: rosterOf(save), activeId, accountTutorialDone: !!save?.account.tutorialDone, backup: save && save.characters.length ? backupStatus(save) : null });
}

/** Lo que se conserva al cambiar de personaje o de partida (no depende del personaje). */
function kept(): Partial<GameState> {
  return { undoAt: state.undoAt, persisted: state.persisted, toasts: state.toasts };
}

/** Pide al navegador que no borre los datos del juego por su cuenta (si lo permite). */
async function requestPersist() {
  try {
    const st = typeof navigator !== 'undefined' ? navigator.storage : undefined;
    if (!st?.persist) return;
    const already = st.persisted ? await st.persisted() : false;
    set({ persisted: already || (await st.persist()) });
  } catch { /* sin soporte: no pasa nada */ }
}
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    syncSave();
    if (save) void saveSave(save);
    refreshRoster();
  }, 150);
}
async function saveNow() {
  if (saveTimer) clearTimeout(saveTimer);
  syncSave();
  if (save) await saveSave(save);
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
    shared: inDungeon ? emptyGrid(0) : (s.profile.shared ?? emptyGrid(0)),
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
      patch.profile = { ...s.profile, backpack: c.backpack, equipment: c.equipment, stash: c.stash, shared: s.profile.shared ? c.shared : null, pocket: c.pocket };
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
/** Nivel de las criaturas (y de Kael) en la expedición actual: el del jugador dentro del rango de la zona. */
/** Nivel de una criatura concreta: el de la subzona más lo que sume su sala (más honda, élite o jefe). */
function enemyLevel(entityId: string | null): number {
  const s = state;
  const e = s.dungeon?.entities.find((x) => x.kind === 'enemy' && x.id === entityId) as { lvl?: number } | undefined;
  const area = areaDef(s.dungeon?.subzone, s.dungeon?.zone);
  return Math.min(area.levels[1] + 3, combatLevel() + (e?.lvl ?? 0));
}

function combatLevel(): number {
  const s = state;
  return zoneEnemyLevel(areaDef(s.dungeon?.subzone, s.dungeon?.zone), s.profile?.character.level ?? 1);
}

export const actions = {
  async boot() {
    save = await loadSave();
    void requestPersist();
    void loadUndo().then((u) => set({ undoAt: u?.at ?? null }));
    activeId = save ? currentCharacterId(save) : null;
    const p = save && activeId ? composeProfile(save, activeId) : null;
    if (save) setVolume(save.account.settings.volume);
    // Avisos de una sola vez (p. ej., el oro devuelto al pasar el almacén a páginas)
    const notes = save?.account.notes ?? [];
    if (save && notes.length) {
      save = { ...save, account: { ...save.account, notes: [] } };
      await saveSave(save);
      set({ notice: notes.join(' '), noticeTitle: 'El almacén tiene páginas' });
    }
    if (p) {
      if (p.activeExpedition) {
        const fixed = abandonInterruptedExpedition(p);
        refreshRoster();
        set({ profile: fixed, screen: 'title', notice: 'Tu última expedición se interrumpió (la página se cerró o recargó). Se ha anulado sin pérdidas: conservas el equipo con el que entraste, pero no el botín que encontraste.' });
        await saveNow();
        return;
      }
    }
    set({ profile: p && needsRecruitKit(p) ? grantRecruitKit(p) : p, screen: 'title' });
    refreshRoster();
  },

  goto(screen: Screen) {
    set({ screen, modal: null });
  },

  dismissNotice() {
    set({ notice: null, noticeTitle: null });
  },

  // ── Copia de seguridad ──
  /** Pantalla «Copia de seguridad». Con 'load' (desde «Tengo una copia»), destaca el bloque de cargar. */
  async openBackup(focus: 'load' | null = null) {
    await saveNow();
    refreshRoster();
    set({ screen: 'backup', modal: null, backupFocus: focus });
  },

  /** Prepara la copia (archivo y código) y apunta la fecha como última copia. */
  async exportBackup(): Promise<{ json: string; code: string; fileName: string } | null> {
    await saveNow();
    if (!save || !save.characters.length) { toast('Aún no hay ninguna partida que guardar.', 'danger'); return null; }
    const now = Date.now();
    const b = buildBackup(save, now);
    save = { ...save, account: { ...save.account, backup: { ...save.account.backup, lastAt: now, expeditionsAt: totalExpeditions(save) } } };
    await saveSave(save);
    refreshRoster();
    return { json: backupToJson(b), code: backupToCode(b), fileName: backupFileName(now) };
  },

  /** Sustituye la partida entera por la de una copia. Antes guarda la actual para poder deshacerlo. */
  async importSave(next: SaveData) {
    await saveNow();
    if (save && save.characters.length) { await saveUndo(save); set({ undoAt: Date.now() }); }
    save = next;
    activeId = currentCharacterId(save);
    let p = activeId ? composeProfile(save, activeId) : null;
    if (p?.activeExpedition) p = abandonInterruptedExpedition(p);
    await saveSave(save);
    set({ ...initial, ...kept(), profile: p, screen: 'backup', undoAt: state.undoAt, persisted: state.persisted, toasts: state.toasts });
    refreshRoster();
    if (p) setVolume(p.settings.volume);
    toast('Partida cargada.', 'good');
  },

  /** Vuelve a la partida que había antes de la última importación. */
  async undoImport() {
    const u = await loadUndo();
    if (!u) return;
    save = u.save;
    activeId = currentCharacterId(save);
    const p = activeId ? composeProfile(save, activeId) : null;
    await saveSave(save);
    await clearUndo();
    set({ ...initial, ...kept(), profile: p, screen: 'backup', undoAt: null, persisted: state.persisted, toasts: state.toasts });
    refreshRoster();
    toast('Se ha recuperado la partida de antes de cargar la copia.', 'good');
  },

  /** Crea un personaje en el hueco indicado (o en el primero libre) y entra con él al refugio. */
  async createCharacter(name: string, classId: ClassId, appearance: Appearance, skipTutorial = false, slot?: number) {
    await saveNow();
    const base = save ?? emptySave();
    const p0 = createProfile(name, classId, appearance);
    // Los atuendos comprados y los ajustes son de la cuenta: el personaje nuevo también los tiene
    const p1 = { ...p0, skins: { owned: [...base.account.skinsOwned], equipped: null }, settings: { ...base.account.settings }, shared: base.account.shared.owned ? [...base.account.shared.grid] : null };
    // Saltar el tutorial (otro personaje ya lo jugó): también se saltan los avisos de bienvenida
    const p = skipTutorial ? { ...p1, tutorialDone: true, tutorialSeen: { lobby: true, dungeon: true } } : p1;
    const r = addCharacter(base, p, slot ?? state.createSlot ?? undefined);
    if (!r) { toast('Ya tienes 4 personajes: borra uno para crear otro.', 'danger'); return; }
    save = r.save; activeId = r.id;
    set({ ...initial, ...kept(), profile: p, screen: 'lobby', createSlot: null });
    refreshRoster();
    await saveNow();
  },

  /** Abre la creación de personaje para un hueco concreto de la selección. */
  newCharacter(slot?: number) {
    if (save && save.characters.length >= MAX_CHARACTERS) { toast('Ya tienes 4 personajes: borra uno para crear otro.', 'danger'); return; }
    set({ screen: 'create', createSlot: slot ?? null });
  },

  /** Pantalla «Elige quién baja». */
  async openSelect() {
    await saveNow();
    refreshRoster();
    set({ screen: 'select', modal: null });
  },

  /** Entra al refugio con otro personaje (guarda antes el actual). */
  async selectCharacter(id: string) {
    if (!save || !save.characters.some((c) => c.id === id)) return;
    await saveNow();
    let p = composeProfile(save, id);
    if (!p) return;
    if (p.activeExpedition) p = abandonInterruptedExpedition(p);
    if (needsRecruitKit(p)) p = grantRecruitKit(p);
    activeId = id;
    save = applyProfile(save, p, id); // pasa a ser el último usado
    set({ ...initial, ...kept(), profile: p, screen: 'lobby', roster: state.roster, toasts: state.toasts });
    refreshRoster();
    if (p.settings) setVolume(p.settings.volume);
    await saveNow();
  },

  /** Borra un personaje y todo lo suyo. Los demás, los atuendos y la página «Compartido» se quedan. */
  async deleteCharacterById(id: string) {
    if (!save) return;
    await saveNow();
    save = removeCharacter(save, id);
    const wasActive = activeId === id;
    if (wasActive) activeId = currentCharacterId(save);
    await saveSave(save);
    if (wasActive) {
      const p = activeId ? composeProfile(save, activeId) : null;
      set({ ...initial, ...kept(), profile: p, screen: state.screen === 'select' ? 'select' : 'title', toasts: state.toasts });
    }
    refreshRoster();
  },

  /** Borra el personaje activo (se mantiene por compatibilidad con las pruebas). */
  async deleteCharacter() {
    if (activeId) await actions.deleteCharacterById(activeId);
    set({ screen: 'title' });
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
    // «Al almacén» va a la página que se está viendo (o a «Compartido» si es la abierta); si no cabe, a cualquier otra propia
    if (target === 'stash' && !lootId && state.screen === 'lobby') {
      const pg = state.stashPage;
      const c0 = containersFor(state);
      const src0 = c0 && stackAt(c0, from);
      if (c0 && src0) {
        if (pg === 'shared' && state.profile?.shared) return actions.moveToPage(from, 'shared');
        if (typeof pg === 'number') {
          const r0 = addToPage(c0.stash, pg, src0);
          if (!r0.leftover) return actions.moveToPage(from, pg);
        }
      }
    }
    const c = containersFor(state, lootId);
    if (!c) return;
    const moving = stackAt(c, from);
    // Monedas a la mochila: primero a los saquitos y sacos con hueco
    if (moving?.itemId === COIN_ID && target === 'backpack' && from.kind === 'grid') {
      const pc = putCoinsPartial(c.backpack, moving.qty);
      if (pc.left === moving.qty) return invError('Tu mochila está llena: las monedas se quedan aquí.');
      const n = { ...c, backpack: pc.grid, [from.container]: [...c[from.container]] };
      n[from.container][from.index] = pc.left ? { ...moving, qty: pc.left } : null;
      sfx('coin');
      applyContainers(n, lootId);
      if (pc.left) invError(`Tu mochila está llena: ${pc.left} monedas se quedan aquí.`);
      return;
    }
    const r = quickMove(c, from, target);
    if (!r.ok) return invError(r.error);
    sfx('pickup');
    applyContainers(r.containers, lootId);
    if (moving && from.kind === 'grid' && from.container === 'loot' && target !== 'loot') recordFound([moving]);
  },

  /** «Coger el oro»: solo las monedas del saco o cofre (primero a tus saquitos y sacos). */
  takeGold(lootId: string) {
    const c = containersFor(state, lootId);
    if (!c) return;
    const n = c.loot.filter((x) => x?.itemId === COIN_ID).reduce((a, x) => a + x!.qty, 0);
    if (!n) return;
    const pc = putCoinsPartial(c.backpack, n);
    if (pc.left === n) return invError('Tu mochila está llena: las monedas se quedan aquí.');
    const loot = c.loot.map((x) => (x?.itemId === COIN_ID ? null : x));
    if (pc.left) { const i = loot.indexOf(null); if (i >= 0) loot[i] = coinsStack(pc.left); }
    sfx('coin');
    applyContainers({ ...c, backpack: pc.grid, loot }, lootId);
    if (pc.left) invError(`Tu mochila está llena: ${pc.left} monedas se quedan aquí.`);
  },

  takeAll(lootId: string) {
    const c = containersFor(state, lootId);
    if (!c) return;
    const stacks = c.loot.filter((s): s is ItemStack => !!s);
    // Las monedas, primero a los saquitos y sacos con hueco de la mochila; luego sueltas
    const coinsIn = stacks.filter((x) => x.itemId === COIN_ID).reduce((n, x) => n + x.qty, 0);
    const pc = putCoinsPartial(c.backpack, coinsIn);
    const r = addManyToGrid(pc.grid, stacks.filter((x) => x.itemId !== COIN_ID), LAYOUTS.backpack);
    if (pc.left) r.leftovers.push(coinsStack(pc.left));
    const remaining = emptyGrid(c.loot.length);
    r.leftovers.forEach((s, i) => (remaining[i] = s));
    if (stacks.length) sfx('pickup');
    if (r.leftovers.length) invError('Tu mochila está llena. Parte del botín se queda aquí.');
    applyContainers({ ...c, backpack: r.grid, loot: remaining }, lootId);
    recordFound(stacks.filter((x) => !r.leftovers.some((l) => l.uid === x.uid)));
  },

  /** Ordena la mochila, o la página del almacén que se está viendo (solo esa). */
  sortContainer(which: 'backpack' | 'stash') {
    const c = containersFor(state);
    if (!c) return;
    sfx('click');
    if (which === 'backpack') return applyContainers({ ...c, backpack: sortGrid(c.backpack, LAYOUTS.backpack) });
    const pg = state.stashPage;
    if (pg === 'shared') applyContainers({ ...c, shared: sortGrid(c.shared, LAYOUTS.shared) });
    else applyContainers({ ...c, stash: sortPage(c.stash, pg) });
  },

  // ── Oro físico ──
  /** Saca `n` monedas de un saquito o saco a su misma rejilla (de 10 en 10). */
  withdrawGold(loc: Loc, n: number) {
    const c = containersFor(state);
    if (!c || loc.kind !== 'grid') return;
    const r = withdrawCoins(c[loc.container], loc.index, n, LAYOUTS[loc.container]);
    if (!r.ok) return invError(r.error);
    sfx('coin');
    applyContainers({ ...c, [loc.container]: r.grid });
    if (r.moved < n) toast(`Solo había sitio para ${r.moved} monedas.`, 'info');
  },
  /** Separa `n` monedas de un montón a una casilla libre cercana. */
  splitGold(loc: Loc, n: number) {
    const c = containersFor(state);
    if (!c || loc.kind !== 'grid') return;
    const r = splitCoins(c[loc.container], loc.index, n);
    if (!r.ok) return invError(r.error);
    sfx('coin');
    applyContainers({ ...c, [loc.container]: r.grid });
  },
  /** «Agrupar oro»: monedas sueltas a los sacos con hueco y el resto en montones de 10. En el almacén, la página vista. */
  groupGold(which: 'backpack' | 'stash') {
    const c = containersFor(state);
    if (!c) return;
    if (which === 'backpack') {
      const r = groupGold(c.backpack);
      sfx('coin'); applyContainers({ ...c, backpack: r.grid });
      return;
    }
    const pg = state.stashPage;
    if (pg === 'shared') { const r = groupGold(c.shared); sfx('coin'); return applyContainers({ ...c, shared: r.grid }); }
    const page = pageSliceOf(c.stash, pg);
    const r = groupGold(page);
    const stash = [...c.stash];
    r.grid.forEach((x, i) => (stash[pg * STASH_PAGE_SIZE + i] = x));
    sfx('coin');
    applyContainers({ ...c, stash });
  },

  setActiveVendor(v: VendorId | null) { set({ activeVendor: v }); },

  /** Se pone otra mochila (solo en el refugio). La que llevabas ocupa su sitio. */
  equipBag(loc: Loc) {
    const p = state.profile;
    if (!p || state.screen !== 'lobby' || loc.kind !== 'grid' || !['backpack', 'stash', 'shared'].includes(loc.container)) return;
    const r = equipBag(p, loc.container as 'backpack' | 'stash' | 'shared', loc.index);
    if (!r.ok) return invError(r.error);
    sfx('equip');
    set({ profile: r.profile });
    toast(`Te pones la ${getItem(r.profile.bag.itemId).name.toLowerCase()}: ${r.profile.backpack.length} casillas.`, 'good');
  },

  /** Cambia la página del almacén que se ve. */
  setStashPage(page: StashPage) {
    const p = state.profile;
    if (!p) return;
    if (page === 'shared' ? !p.shared : page < 0 || page >= pageCount(p.stash)) return;
    set({ stashPage: page });
  },

  /**
   * Lleva un objeto a una página del almacén (arrastrándolo a su pestaña, o tocándolo y luego la pestaña).
   * Se apila primero; si no cabe entero, lo que sobra se queda donde estaba.
   */
  moveToPage(from: Loc, page: StashPage) {
    const c = containersFor(state);
    if (!c) return;
    const src = stackAt(c, from);
    if (!src) return;
    if (page === 'shared') {
      if (!state.profile?.shared) return invError('Aún no tienes la página «Compartido».');
      const r = quickMove(c, from, 'shared');
      if (!r.ok) return invError('No hay espacio en la página «Compartido».');
      sfx('pickup');
      return applyContainers(r.containers);
    }
    // Si ya está en esa página, no hay nada que hacer
    const from1 = from.kind === 'grid' ? { ...from, index: anchorIndex(c[from.container], from.index) } : from;
    if (from1.kind === 'grid' && from1.container === 'stash' && Math.floor(from1.index / STASH_PAGE_SIZE) === page) return;
    // Se saca de donde está y se mete en la página; lo que no quepa vuelve a su sitio
    const n = clearAt(c, from1);
    const r = addToPage(n.stash, page, src);
    if (r.leftover && r.leftover.qty === src.qty) return invError(isMulti(src) ? `No hay hueco de 2×2 en la página ${page + 1}.` : `No hay espacio en la página ${page + 1}.`);
    n.stash = r.stash;
    if (r.leftover) {
      if (from1.kind === 'equip') n.equipment[from1.slot] = r.leftover;
      else n[from1.container][from1.index] = r.leftover;
    }
    sfx('pickup');
    applyContainers(n);
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
      const cls = CLASSES[s.profile.character.classId];
      if (def.resource && def.resource !== cls.resource) return invError(`Esto no te sirve: tú usas ${cls.resourceName.toLowerCase()}.`);
      if (exp.mp >= stats.maxMp) return invError(`Ya tienes el ${cls.resourceName.toLowerCase()} al máximo.`);
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

  /** Compra la siguiente página propia del almacén (la confirmación la pide el Alijo). */
  buyStashPage() {
    const p = state.profile;
    if (!p) return;
    const r = buyStashPage(p);
    if (!r.ok) return invError(r.error);
    sfx('coin');
    const page = pageCount(r.profile.stash) - 1;
    set({ profile: r.profile, stashPage: page });
    toast(`Página ${page + 1} del almacén comprada.`, 'good');
  },

  /** Compra la página «Compartido» (una vez, para todos los personajes). */
  buySharedPage() {
    const p = state.profile;
    if (!p) return;
    const r = buySharedPage(p);
    if (!r.ok) return invError(r.error);
    sfx('coin');
    set({ profile: r.profile, stashPage: 'shared' });
    void saveNow();
    toast('Página «Compartido» comprada: todos tus personajes pueden usarla.', 'good');
  },

  // ── Atuendos (Tienda) ──
  /** Compra un atuendo con oro (la confirmación la pide la Tienda antes de llamar aquí). */
  buySkin(id: string): boolean {
    const p = state.profile;
    if (!p) return false;
    const r = buySkin(p, id);
    if (!r.ok) { toast(r.error, 'danger'); return false; }
    sfx('coin');
    set({ profile: r.profile });
    toast(`Atuendo comprado: ${getSkin(id).name}. Es tuyo para siempre.`, 'loot');
    return true;
  },
  /** Ponerse un atuendo o quitárselo (null). Solo cambia el aspecto. */
  equipSkin(id: string | null) {
    const p = state.profile;
    if (!p) return;
    set({ profile: equipSkin(p, id) });
    sfx('equip');
  },

  // ── Habilidades de clase ──
  /** Elegir qué habilidad de clase desbloquear (si hay un desbloqueo pendiente). */
  unlockClassSkill(id: string) {
    const p = state.profile;
    if (!p) return false;
    const next = unlockClassSkill(p, id);
    if (!next) return false;
    set({ profile: next });
    sfx('magic');
    toast(`Nueva habilidad de clase: ${getSkill(id).name}`, 'good');
    return true;
  },
  /** Llevar equipada otra habilidad de clase (fuera de combate). */
  equipClassSkill(id: string) {
    const p = state.profile;
    if (!p || state.combat) return;
    const next = equipClassSkill(p, id);
    if (!next) return;
    set({ profile: next });
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
    const vendor = state.activeVendor ?? 'orvel';
    let r = sell(p, container, index, all, vendor);
    // Sin sitio para el oro: se prueba a agrupar las monedas sueltas de cada página en sus sacos y se vuelve a intentar
    if (!r.ok && r.error === NO_ROOM_FOR_GOLD) {
      const grouped = joinPages(splitPages(p.stash).map((pg) => groupGold(pg).grid));
      const r2 = sell({ ...p, stash: grouped }, container, index, all, vendor);
      if (r2.ok) { r = r2; toast('Se han agrupado tus monedas sueltas para hacer sitio.', 'info'); }
    }
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
        ...earnGoldSafe({ ...p, backpack, stash }, def.reward.gold),
        character: { ...p.character, level: xp.level, xp: xp.xp },
        reputation: { ...p.reputation, [def.vendor]: after },
        // Las repetibles vuelven a empezar; las demás quedan cobradas
        quests: p.quests.map((x) => (x.id === id ? (def.repeatable ? { ...x, progress: 0 } : { ...x, claimed: true }) : x)),
      },
    });
    sfx('victory');
    toast(`Misión completada: +${def.reward.gold} oro, +${def.reward.xp} XP, +${def.reward.rep} de reputación${xp.levelsGained ? ' · ¡Subes de nivel!' : ''}`, 'good');
    if (rankOf(after) > rankOf(before)) toast(`${VENDORS[def.vendor].name} te considera ahora «${REP_RANKS[rankOf(after)].name}»: ${Math.round(REP_RANKS[rankOf(after)].discount * 100)}% de descuento y mercancía nueva.`, 'good');
  },

  // ── Expedición ──
  /** Bajar a una subzona concreta, o a una zona (entonces, a la subzona más honda abierta para tu nivel). */
  async enterDungeon(target: ZoneId | SubzoneId = 'mazmorra') {
    const p = state.profile;
    if (!p) return;
    const sub = isSubzoneId(target) ? getSubzone(target) : defaultSubzone(target in ZONES ? (target as ZoneId) : 'mazmorra', p.character.level, p.bossesDefeated);
    const zoneId = sub.zone;
    const lock = p.stats.expeditions === 0 ? null : subzoneLock(sub, p.character.level, p.bossesDefeated);
    if (lock) return invError(lock);
    // La primera expedición usa la cripta diseñada a mano (sirve de tutorial); después, mapas procedurales de la zona elegida.
    const seed = randomSeed();
    const captive = makeRng(seed ^ 0x51ed).chance(CAPTIVE_CHANCE) ? captiveCandidate(p, zoneId) : null;
    // Primera expedición de una partida nueva: el tutorial guiado (salvo si se saltó)
    if (p.stats.expeditions === 0 && !p.tutorialDone && !dev.skipTutorial) return actions.startTutorial(null);
    // Mercenario errante: Kael (solo en la Mazmorra, 1 de cada 3 con garantía) u otro de la zona
    const first = p.stats.expeditions === 0;
    const enc = first ? { who: 'kael', risk: 'kael' as const, hostile: false, kaelStreak: p.kael.missStreak } : rollEncounter(makeRng(seed ^ 0x7a31), sub, p.kael.missStreak);
    if (dev.forceKael && sub.zone === 'mazmorra') Object.assign(enc, { who: 'kael', risk: 'kael', hostile: false, kaelStreak: 0 });
    if (dev.forceWanderer) Object.assign(enc, { who: dev.forceWanderer, hostile: !!dev.forceHostile });
    const dungeon = first ? CRYPTS_OF_UMBRAVEL : generateDungeon(seed, { zone: zoneId, subzone: sub.id, captive, wanderer: !!enc.who });
    const started = startExpedition(p, Date.now());
    const kael = { ...p.kael, missStreak: first || sub.zone !== 'mazmorra' ? p.kael.missStreak : enc.kaelStreak };
    const profile = first ? started.profile : { ...started.profile, lastSubzone: sub.id, kael };
    const expedition = { ...started.expedition, zone: dungeon.zone ?? 'mazmorra', subzone: dungeon.subzone, chestsOpened: {}, veinsMined: 0 };
    set({
      profile, expedition, dungeon, screen: 'dungeon', summary: null, combat: null, modal: null,
      rival: enc.who ? initialRival(enc.who, enc.risk, enc.hostile) : noRival(), rivalLine: null, merc: mercForExpedition(p), chests: {}, mined: {}, bags: {},
      hud: { room: '', prompt: null, channel: 0, playerTile: [0, 0] },
    });
    await saveNow();
  },

  /** Empieza el tutorial. `replay`: el perfil a devolver al acabar (se repite desde Ajustes sin tocar tu inventario). */
  async startTutorial(replay: Profile | null) {
    const p0 = state.profile;
    if (!p0) return;
    // Al repetirlo, bajas con el equipo inicial de tu clase; tu inventario de verdad se guarda aparte
    const p = replay ? { ...createProfile(p0.character.name, p0.character.classId, p0.character.appearance), character: p0.character } : p0;
    const started = startExpedition(p, Date.now());
    const expedition = { ...started.expedition, durationMs: 24 * 3600_000, zone: 'mazmorra', subzone: 'afueras', chestsOpened: {}, veinsMined: 0 };
    const rival = { ...initialRival('osric', 'low'), traitor: true };
    set({
      profile: replay ? { ...p0 } : started.profile, expedition, dungeon: TUTORIAL_MAP, screen: 'dungeon', summary: null, combat: null, modal: null,
      rival, rivalLine: null, merc: null, chests: {}, mined: {}, bags: {}, tutorial: { step: 0, replay },
      hud: { room: '', prompt: null, channel: 0, playerTile: [0, 0] },
    });
    if (!replay) await saveNow();
  },

  /** En el tutorial no se pierde: si caes, vuelves al último punto seguro; al extraer, recompensas y fin. */
  async finishTutorial(reason: EndReason) {
    const s = state;
    const t = s.tutorial;
    if (!t || !s.profile || !s.expedition) return;
    if (reason !== 'extracted') {
      const max = computeStats(s.profile.character.classId, s.profile.character.level, s.expedition.equipment);
      const [x, y] = tutorialRoomCenter(TUTORIAL_STEPS[t.step]?.checkpoint ?? 0);
      set({ combat: null, modal: null, expedition: { ...s.expedition, hp: max.maxHp, mp: max.maxMp } });
      bus.emit('tutorial-revive', { x, y });
      toast('Caes… y despiertas en el último punto seguro. En el tutorial no pierdes nada.', 'info');
      return;
    }
    if (t.replay) {
      // Repetido desde Ajustes: tu personaje vuelve exactamente como estaba
      const { summary } = endExpedition(s.profile, s.expedition, 'extracted', Date.now());
      set({ profile: t.replay, tutorial: null, expedition: null, screen: 'summary', combat: null, modal: null, merc: null,
        summary: { ...summary, tutorialNote: 'Tutorial repetido. Tu personaje y tu inventario no han cambiado.' } });
      return;
    }
    let { profile, summary } = endExpedition(s.profile, s.expedition, 'extracted', Date.now());
    // Recompensa: oro y objetos para empezar (config en data/tutorial.ts)
    let stash = profile.backpack;
    for (const it of TUTORIAL_REWARD.items) stash = addToGrid(stash, { uid: makeUid(), itemId: it.itemId, qty: it.qty }).grid;
    profile = { ...earnGoldSafe({ ...profile, backpack: stash }, TUTORIAL_REWARD.gold), tutorialDone: true, tutorialSeen: { lobby: true, dungeon: true } };
    summary = { ...summary, tutorialNote: `Has sobrevivido a tu primera bajada. El intendente te da ${TUTORIAL_REWARD.gold} monedas de oro (están en tu almacén), 3 pociones y unos guantes de cuero.` };
    markTutorialDoneOnDevice();
    set({ profile, summary, tutorial: null, expedition: null, screen: 'summary', combat: null, modal: null, merc: null });
    await saveNow();
  },

  /** Repetir el tutorial desde Ajustes (sin recompensas y sin tocar tu inventario). */
  replayTutorial() {
    const p = state.profile;
    if (!p) return;
    void actions.startTutorial(JSON.parse(JSON.stringify(p)));
  },

  /** Comprueba si el paso del tutorial está cumplido y pasa al siguiente (se llama con el reloj de la mazmorra). */
  tutorialCheck() {
    const s = state;
    const t = s.tutorial;
    if (!t || !s.expedition || s.screen !== 'dungeon') return;
    const step = TUTORIAL_STEPS[t.step];
    if (!step) return;
    const e = s.expedition;
    const room = tutorialRoomOf(s.hud.playerTile[0]);
    const potions = countItem(e.backpack, 'health_potion');
    let done = false;
    switch (step.id) {
      case 'move': done = room >= 1; break;
      case 'fight': done = (e.kills.ossuary_rat ?? 0) >= 1 && !s.combat; break;
      case 'gold': done = gridGold(e.backpack) > 0 && !s.modal; break;
      case 'pocket': done = e.pocket.some((x) => x?.itemId === 'gold_pouch' && (x.gold ?? 0) > 0) && !s.modal; break;
      case 'box': done = !!s.chests.t_box && !s.modal && (countItem(e.backpack, 'iron_key') > 0 || !!s.chests.t_rich); break;
      case 'rich': done = !!s.chests.t_rich && !s.modal; break;
      case 'equip': done = e.equipment.helmet?.itemId === 'leather_hood' && !s.modal; break;
      case 'potion': {
        // Al llegar a la hoguera, la trampa (o el camino) te deja herido para practicar con la poción
        if (t.potionsAt === undefined) {
          if (room < 3) return;
          const max = computeStats(s.profile!.character.classId, s.profile!.character.level, e.equipment).maxHp;
          if (e.hp > max * 0.7) { set({ expedition: { ...e, hp: Math.round(max * 0.55) } }); sfx('trap'); toast('¡Una trampa de pinchos! Te has hecho daño.', 'danger'); }
          set({ tutorial: { ...t, potionsAt: countItem(state.expedition!.backpack, 'health_potion') } });
          return;
        }
        done = potions < t.potionsAt;
        break;
      }
      case 'talk': done = s.rival.greeted; break;
      case 'ally': done = s.rival.disposition === 'allied' && !s.modal; break;
      case 'together': done = (e.kills.bandit ?? 0) >= 2 && !s.combat; break;
      case 'betrayal': {
        // Guion: al llegar a la brecha, Osric avisa y traiciona
        if (!t.betrayalStarted && room >= 6 && s.rival.disposition === 'allied' && !s.combat && !s.modal) {
          set({ tutorial: { ...t, betrayalStarted: true }, rival: { ...s.rival, warned: true } });
          toast(getWanderer('osric').lines.warn, 'danger');
          bus.emit('rival-warn');
          setTimeout(() => {
            const st = state;
            if (!st.tutorial || st.combat) return;
            set({ rival: { ...st.rival, disposition: 'hostile', betrayed: true, betrayedBy: 'rival' } });
            sfx('betray');
            toast(`${getWanderer('osric').lines.betray} ¡Osric te traiciona!`, 'danger');
            bus.emit('rival-changed');
            actions.startCombat('betrayal-by-rival', null);
          }, 1600);
        }
        done = s.rival.disposition === 'dead' && !s.combat;
        break;
      }
      default: break;
    }
    if (done && t.step < TUTORIAL_STEPS.length - 1) { set({ tutorial: { ...t, step: t.step + 1, potionsAt: undefined } }); sfx('click'); }
  },

  tick() {
    const s = state;
    const now = Date.now();
    if (s.tutorial) actions.tutorialCheck();
    if (s.screen === 'dungeon' && s.expedition && !s.tutorial && timeLeft(s.expedition, now) <= 0 && !s.summary) {
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
    if (s.tutorial) return actions.finishTutorial(reason);
    // El errante aliado que extrae contigo se lleva su parte del oro encontrado desde que os aliasteis
    // (oro físico: su parte son monedas de tu mochila, de las que has cogido desde que os aliasteis)
    const carried = gridGold(s.expedition.backpack);
    const share0 = reason === 'extracted' ? Math.min(carried, goldShare(s.rival, carried, GOLD_SHARE)) : 0;
    const paidBp = share0 ? takeCoins(s.expedition.backpack, share0) : null;
    const share = paidBp ? share0 : 0;
    const expDone = paidBp ? { ...s.expedition, backpack: paidBp } : s.expedition;
    let { profile, summary } = endExpedition(s.profile, expDone, reason, Date.now());
    if (reason === 'extracted' && s.rival.disposition === 'allied' && s.rival.hp > 0) {
      const w = getWanderer(s.rival.who);
      summary = { ...summary, wandererNote: `${w.lines.farewell}${share ? ` ${w.name.split(' ')[0]} se lleva su parte: ${share} de oro.` : ''}` };
    }
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
      const sub = s.dungeon?.subzone ? getSubzone(s.dungeon.subzone) : null;
      const base = CHEST_TABLES[table];
      const loot = rollLoot(sub ? subzoneChestTable(base, sub.levels, subzonesOf(sub.zone).indexOf(sub), sub.id) : base, rng);
      const ct = chestType(table);
      const found = rollStacks(adaptDrops(loot.items, s.profile!.character.classId), getItem, { depth: subzoneDepth(), bonus: ct.look === 'boss' ? 2 : ct.key ? 1 : 0 }, () => rng.next());
      gold = loot.gold;
      // El oro del cofre son monedas dentro del cofre: hay que cogerlas
      grid = addManyToGrid(emptyGrid(12), [...found, ...(gold > 0 ? [coinsStack(gold)] : [])]).grid;
      const opened = { ...(s.expedition.chestsOpened ?? {}), [table]: (s.expedition.chestsOpened?.[table] ?? 0) + 1 };
      set({ expedition: { ...state.expedition!, chestsOpened: opened } });
      sfx('chest');
      if (gold) set({ expedition: { ...state.expedition!, goldFound: state.expedition!.goldFound + gold } });
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
        const r = shareLoot(s.rival, m.session.given, m.session.initialCount, makeRng(randomSeed()));
        set({ rival: r.rival });
        if (r.line) toast(r.line, m.session.given.length ? 'social' : 'danger');
        bus.emit('rival-changed');
      }
      // Abrir un cofre con llave o de jefe es un momento de debilidad: un errante traidor puede aprovecharlo
      if (m.session.source === 'chest' && s.rival.disposition === 'allied') {
        const ent = s.dungeon?.entities.find((e) => e.kind === 'chest' && e.id === m.session.id) as { table?: string } | undefined;
        if (ent?.table && chestType(ent.table).key) setTimeout(() => actions.checkBetrayal(false, true), 300);
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

  setSuspended(v: boolean) {
    if (state.suspended !== v) set({ suspended: v });
  },

  closeModal() {
    if (state.modal?.type === 'loot') return actions.closeLoot();
    set({ modal: null });
  },

  // ── Rival ──
  interactRival() {
    const s = state;
    if (s.rival.greeted || !s.profile) { set({ modal: { type: 'rival' }, rivalLine: null }); return; }
    // Primer encuentro: su presentación (Kael recuerda cuántas veces os habéis visto)
    const met = s.rival.who === 'kael' ? s.profile.kael.met ?? 0 : 0;
    set({ modal: { type: 'rival' }, rivalLine: greetLine(s.rival, met), rival: { ...s.rival, greeted: true } });
    if (s.rival.who === 'kael') set({ profile: { ...s.profile, kael: { ...s.profile.kael, met: met + 1 } } });
  },

  rivalTalk() {
    const r = talk(state.rival);
    set({ rival: r.rival, rivalLine: r.line });
  },

  rivalPropose() {
    const r = proposeAlliance(state.rival, makeRng(randomSeed()), Date.now(), gridGold(state.expedition?.backpack ?? []));
    if (dev.forceBetrayal) r.rival.traitor = true;
    set({ rival: r.rival, rivalLine: r.line });
    if (r.accepted) {
      sfx('heal');
      toast(`${getWanderer(state.rival.who).name.split(' ')[0]} se une a ti. Os repartiréis el botín.`, 'social');
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

  /**
   * Comprueba si el errante aliado traiciona: la escena lo llama cada poco (cerca del portal), y también tras ganar un
   * combate y al abrir un cofre con llave o de jefe. Solo actúa un traidor, y siempre avisa antes.
   */
  checkBetrayal(nearPortal: boolean, richChest = false) {
    const s = state;
    if (!s.expedition || !s.profile || s.combat || s.modal || !s.dungeon || s.tutorial) return;
    const stats = computeStats(s.profile.character.classId, s.profile.character.level, s.expedition.equipment);
    const rng = makeRng(randomSeed());
    const r = evaluateBetrayal(s.rival, { now: Date.now(), playerHpPct: s.expedition.hp / stats.maxHp, nearPortal, richChest, zone: s.dungeon.zone ?? 'mazmorra' }, rng);
    if (r.action === 'none') return;
    set({ rival: r.rival });
    if (r.action === 'warn') { toast(r.line!, 'danger'); bus.emit('rival-warn'); }
    if (r.action === 'betray') {
      sfx('betray');
      toast(r.line!, 'danger');
      bus.emit('rival-changed');
      actions.startCombat('betrayal-by-rival', null);
    }
    if (r.action === 'rob') {
      // Roba 1 o 2 objetos de tu mochila y huye hacia el portal: si lo alcanzas, combate y lo recuperas
      const backpack = [...s.expedition.backpack];
      const filled = backpack.map((x, i) => (x ? i : -1)).filter((i) => i >= 0);
      const n = Math.min(filled.length, rng.int(ROB_ITEMS[0], ROB_ITEMS[1]));
      const stolen: string[] = [];
      for (let k = 0; k < n; k++) {
        const idx = filled.splice(rng.int(0, filled.length - 1), 1)[0];
        const it = backpack[idx]!;
        for (let q = 0; q < it.qty; q++) stolen.push(it.itemId);
        backpack[idx] = null;
      }
      set({ expedition: { ...state.expedition!, backpack }, rival: { ...r.rival, bagItemIds: [...r.rival.bagItemIds, ...stolen] } });
      sfx('betray');
      toast(`${r.line} ¡Alcánzalo antes de que llegue al portal!`, 'danger');
      bus.emit('rival-changed');
    }
  },

  /** Kael aparece: un aviso especial (el encuentro es raro, 1 de cada 3 bajadas a la Mazmorra). */
  announceKael() {
    sfx('portal');
    toast('Una linterna verde brilla en la penumbra. Es Kael el Errante.', 'social');
  },

  /** El errante que huía con lo robado ha llegado al portal: se lo lleva. */
  rivalEscaped() {
    const s = state;
    if (s.rival.disposition !== 'fleeing') return;
    toast(`${getWanderer(s.rival.who).name} cruza el portal con lo que te robó.`, 'danger');
    set({ rival: { ...s.rival, disposition: 'departed', bagItemIds: [] } });
    bus.emit('rival-changed');
  },

  // ── Combate ──
  startCombat(kind: CombatKind, entityId: string | null, enemyId?: string) {
    const s = state;
    if (!s.profile || !s.expedition || s.combat) return;
    const ch = s.profile.character;
    const player = playerCombatant(ch, s.expedition.equipment, s.expedition.hp, s.expedition.mp, s.expedition.cooldowns, s.profile.classSkills.equipped);
    const list = [player];
    let title = '';
    let canFlee = true;
    if (kind === 'pve' && enemyId) {
      const e = getEnemy(enemyId);
      if (s.rival.disposition === 'allied') list.push(rivalCombatant(s.rival.who, s.rival.hp, 'A', s.rival.potions, combatLevel()));
      if (s.merc?.alive) list.push(mercCombatant(s.merc, 'A', combatLevel()));
      list.push(enemyCombatant(enemyId, entityId ?? 'enemy', 'B', enemyLevel(entityId)));
      const firstTime = knowledge(s.profile.bestiary, enemyId) === 0;
      set({ profile: { ...s.profile, bestiary: noteSeen(s.profile.bestiary, enemyId) } });
      if (firstTime) toast(`Nueva entrada en el Bestiario: ${e.name}`, 'info');
      title = e.boss ? `¡${e.name}!` : e.name;
      canFlee = !e.boss;
    } else {
      const rc = rivalCombatant(s.rival.who, s.rival.hp, 'B', s.rival.potions, combatLevel());
      const name = getWanderer(s.rival.who).name;
      if (kind === 'betrayal-by-player') rc.statuses.push({ id: 'stun', turns: 1 });
      // Si te traiciona atacando, empiezas sangrando; si te robó y lo alcanzas, no
      if (kind === 'betrayal-by-rival' && s.rival.disposition !== 'fleeing') player.statuses.push({ id: 'bleed', turns: 2 });
      list.push(rc);
      // Tu mercenario de Garra Roja siempre te defiende
      if (s.merc?.alive) list.splice(1, 0, mercCombatant(s.merc, 'A', combatLevel()));
      title = kind === 'hostile' ? `Combate hostil: ${name}` : kind === 'betrayal-by-player' ? `Traición: atacas a ${name} por sorpresa` : s.rival.disposition === 'fleeing' ? `¡Alcanzas a ${name}!` : `¡${name} te traiciona!`;
      // Traiciones: no hay huida posible. Solo el combate hostil (atacar a un neutral o un errante hostil) permite escapar.
      canFlee = kind === 'hostile';
    }
    const combat = createCombat(list, randomSeed(), { canFlee });
    combat.log.unshift(kind === 'pve' ? `¡${title.replace(/[¡!]/g, '')} te cierra el paso!` : s.rival.disposition === 'hostile' && !s.rival.betrayed && getWanderer(s.rival.who).lines.hostile ? getWanderer(s.rival.who).lines.hostile! : 'Las armas salen de sus vainas.');
    if (s.rival.disposition === 'allied' && kind === 'pve') combat.log.push(`${getWanderer(s.rival.who).name} combate a tu lado.`);
    if (s.merc?.alive) combat.log.push(`${getMerc(s.merc.id).name} combate a tu lado (${STANCE_NAME[s.merc.stance].toLowerCase()}).`);
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
    exp.cooldowns = { ...(pl.cooldowns ?? {}) };
    let rival = s.rival;
    const rc = next.combatants.find((c) => c.id === 'rival');
    if (rc) rival = { ...rival, hp: rivalHpBack(rc.hp, combatLevel()), potions: rc.potions };
    let merc = s.merc;
    const mc = next.combatants.find((c) => c.id === 'merc');
    if (mc && merc) merc = { ...merc, hp: mercHpBack(mc.hp, combatLevel()), potions: mc.potions };
    let rewards = s.combat.rewards;

    if (next.outcome) {
      if (next.outcome === 'victory') {
        const rng = makeRng(randomSeed());
        let xp = 0, gold = 0;
        const items: ItemStack[] = [];
        const kills = { ...exp.kills };
        for (const c of next.combatants.filter((x) => x.side === 'B')) {
          if (c.ref && c.ref !== 'rival') {
            const e = getEnemy(c.ref);
            xp += enemyXp(e.xp, enemyLevel(c.id));
            if (e.boss && !state.profile!.bossesDefeated.includes(e.id)) {
              { const pr = state.profile!; set({ profile: { ...pr, bossesDefeated: [...pr.bossesDefeated, e.id] } }); }
              const next = Object.values(ZONES).find((z) => z.access.bossOf && ZONES[z.access.bossOf].boss === e.id);
              if (next) toast(`Has derrotado a ${e.name}. ${next.name} te espera más abajo (nivel ${next.access.level}).`, 'good');
            }
            const l = rollLoot(e.loot, rng);
            gold += l.gold;
            items.push(...rollStacks(adaptDrops(l.items, state.profile!.character.classId), getItem, { depth: subzoneDepth(), bonus: e.boss ? 2 : e.elite ? 1 : 0 }, () => rng.next()));
            kills[e.id] = (kills[e.id] ?? 0) + 1;
            { const pr = state.profile!; set({ profile: { ...pr, bestiary: noteKill(pr.bestiary, e.id) } }); }
          }
        }
        if (rc && rc.side === 'B') {
          {
            xp += 60;
            const rivalCoins = rival.gold;
            rival = { ...rival, disposition: 'dead' };
            // El cuerpo del errante deja una bolsa con sus pertenencias (y lo que te robó o le diste)
            const bagGrid = addManyToGrid(emptyGrid(12), [...rival.bagItemIds.map((id) => ({ uid: makeUid(), itemId: id, qty: 1 })), ...(rivalCoins > 0 ? [coinsStack(rivalCoins)] : [])]).grid;
            const [x, y] = s.hud.playerTile;
            const bag: Bag = { id: makeUid('bag'), x, y, grid: bagGrid, label: `Pertenencias de ${getWanderer(rival.who).name.split(' ')[0]}` };
            set((st) => ({ bags: { ...st.bags, [bag.id]: bag } }));
            bus.emit('bags-changed');
          }
        }
        // Subzonas muy por debajo de tu nivel: menos experiencia y oro (config/subzones.ts)
        if (s.dungeon?.subzone) {
          const pen = overlevelPenalty(getSubzone(s.dungeon.subzone).levels[1], s.profile.character.level);
          if (pen) { xp = Math.round(xp * pen.xp); gold = Math.round(gold * pen.gold); }
        }
        // En el tutorial, la rata siempre suelta algo de oro (para practicar con el saco del botín)
        if (s.tutorial && gold < 4) gold = 4;
        // Oro físico: el botín (objetos y monedas) cae en un saco en el suelo; tú decides qué te llevas
        const dropped = [...items, ...(gold > 0 ? [coinsStack(gold)] : [])];
        exp.goldFound += gold;
        exp.xpGained += xp;
        exp.kills = kills;
        let bagId: string | null = null;
        if (dropped.length) {
          const [x, y] = s.hud.playerTile;
          const foe = next.combatants.find((c) => c.side === 'B' && c.ref && c.ref !== 'rival');
          const bag: Bag = { id: makeUid('bag'), x, y, grid: addManyToGrid(emptyGrid(Math.max(12, dropped.length)), dropped).grid, label: foe ? `Saco de ${getEnemy(foe.ref!).name}` : 'Saco del combate' };
          bagId = bag.id;
          set((st) => ({ bags: { ...st.bags, [bag.id]: bag } }));
          bus.emit('bags-changed');
        }
        rewards = { xp, gold, items, overflow: false, bagId };
        // Tu mercenario se venda las heridas tras cada victoria
        if (merc?.alive && mc && mc.hp > 0) { const max = mercBaseStats(getMerc(merc.id)).maxHp; merc = { ...merc, hp: Math.min(max, merc.hp + Math.round(max * 0.15)) }; }
        sfx('victory');
      } else if (next.outcome === 'defeat') {
        sfx('defeat');
      }
      if (mc && merc && mc.hp <= 0 && merc.alive) {
        merc = { ...merc, alive: false };
        toast(`${getMerc(merc.id).name} ha caído en combate.${merc.rescued ? '' : ' El contrato se rompe.'}`, 'danger');
      }
      if (rc && rc.side === 'A' && rc.hp <= 0) {
        rival = { ...rival, disposition: 'dead' };
        toast(`${getWanderer(rival.who).name} ha caído en combate.`, 'danger');
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
    if (outcome === 'defeat') {
      set({ combat: null });
      void actions.finishExpedition('died');
      return;
    }
    const lootBag = outcome === 'victory' ? s.combat.rewards?.bagId : null;
    set({ combat: null });
    bus.emit('combat-ended', { entityId, outcome, kind });
    // El saco del botín se abre solo: coges lo que quieras y el resto se queda en el suelo
    if (lootBag && state.bags[lootBag]) actions.openBag(lootBag);
    bus.emit('rival-changed');
    bus.emit('merc-changed');
    // Tras ganar un combate con poca vida, un errante traidor puede aprovechar el momento
    if (kind === 'pve' && outcome === 'victory') setTimeout(() => actions.checkBetrayal(false), 400);
  },

  backToLobby() {
    set({ screen: 'lobby', summary: null });
  },
};

/** Profundidad de la subzona actual (0 Afueras … 9 Trono) para la tirada de rareza. */
function subzoneDepth(): number {
  const sub = state.dungeon?.subzone;
  return sub ? Math.max(0, SUBZONE_ORDER.indexOf(sub as SubzoneId)) : 0;
}

// Para pruebas automáticas (solo con ?debug en la URL)
/** Ayudas de desarrollo (solo con ?debug): forzar a Kael, a un errante concreto, que sea hostil o que traicione. */
export const dev: {
  forceKael: boolean; forceWanderer: string | null; forceHostile: boolean; forceBetrayal: boolean; skipTutorial: boolean;
  /** Te da cualquier objeto con la rareza y los atributos que quieras (a la mochila de la expedición o del perfil). */
  give: (itemId: string, rarity?: Rarity, affixes?: string[], qty?: number) => string;
  /** Pone a tu personaje en el nivel que digas (1–100). */
  setLevel: (level: number) => string;
  /** Deja todas tus acciones listas (también en el combate en curso). */
  resetCooldowns: () => string;
} = {
  forceKael: false, forceWanderer: null, forceHostile: false, forceBetrayal: false,
  give(itemId, rarity, affixes, qty = 1) {
    const def = getItem(itemId);
    if (rarity && !RARITY_RULES[rarity]) return `Rareza desconocida: ${rarity}`;
    for (const a of affixes ?? []) if (!AFFIXES[a]) return `Atributo desconocido: ${a}`;
    const stack: ItemStack = { uid: makeUid(), itemId, qty, ...(rarity ? { rarity } : {}), ...(affixes?.length ? { affixes } : {}) };
    if (state.expedition) {
      const r = addToGrid(state.expedition.backpack, stack);
      set({ expedition: { ...state.expedition, backpack: r.grid } });
    } else if (state.profile) {
      const r = addToGrid(state.profile.backpack, stack);
      set({ profile: { ...state.profile, backpack: r.grid } });
    } else return 'No hay personaje.';
    return `Añadido: ${def.name} (${rarity ?? def.rarity})`;
  },
  setLevel(level) {
    if (!state.profile) return 'No hay personaje.';
    const lv = Math.max(1, Math.min(100, Math.floor(level)));
    set({ profile: { ...state.profile, character: { ...state.profile.character, level: lv, xp: 0 } } });
    return `Nivel ${lv}`;
  },
  resetCooldowns() {
    if (state.expedition) set({ expedition: { ...state.expedition, cooldowns: {} } });
    if (state.combat) {
      const cs = structuredClone(state.combat.state);
      for (const c of cs.combatants) if (c.control === 'player') c.cooldowns = {};
      set({ combat: { ...state.combat, state: cs } });
    }
    return 'Recargas a cero';
  },
  // Con ?debug las pruebas automáticas se saltan el tutorial; con ?debug&tutorial se juega
  skipTutorial: typeof window !== 'undefined' && /[?&]debug/.test(window.location.search) && !/[?&]tutorial/.test(window.location.search),
};

/** En este navegador ya se completó alguna vez el tutorial: los personajes nuevos pueden saltarlo. */
const TUTORIAL_FLAG = 'cryptraiders.tutorialDone';
export function tutorialDoneOnDevice(): boolean {
  try { return localStorage.getItem(TUTORIAL_FLAG) === '1'; } catch { return false; }
}
function markTutorialDoneOnDevice() {
  try { localStorage.setItem(TUTORIAL_FLAG, '1'); } catch { /* sin almacenamiento: no pasa nada */ }
}

export function exposeDebug(extra: Record<string, unknown> = {}) {
  if (typeof window !== 'undefined' && /[?&]debug/.test(window.location.search)) {
    // En las pruebas, poner `profile.gold` a mano deja ese oro en monedas de verdad en el almacén (el oro es físico)
    const debugSet = (patch: Partial<GameState>) => {
      const pr = patch.profile;
      if (pr && pr.gold !== gridGold(pr.stash)) patch = { ...patch, profile: setGoldExactly(pr, pr.gold) };
      set(patch);
    };
    (window as unknown as Record<string, unknown>).__CRYPTRAIDERS__ = { getState, getSave, actions, dev, setState: debugSet, ...extra };
  }
}
