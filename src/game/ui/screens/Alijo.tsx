// Alijo (opción D): Aventurero · Equipo (equipamiento, mochila y bolsillo seguro) · Almacén.
// Mover objetos: arrastrar (ordenador), o tocar un objeto (se abre su ficha) y después tocar una casilla libre.
// En móvil no caben las tres columnas: segmentos «Equipo» y «Almacén».
import { useState } from 'react';
import { actions, useGame } from '../../state/store';
import { CLASSES } from '../../../core/data/classes';
import { computeStats, baseStats } from '../../../core/stats';
import { getItem } from '../../../core/data/items';
import { gridValue, equippedValue, type Loc } from '../../../core/inventory';
import { stashUpgrades } from '../../../core/economy';
import { STASH_ROW, STASH_UPGRADE_COSTS } from '../../../config/stash';
import type { EquipSlot, ItemStack } from '../../../core/types';
import { ItemSlot, GridView, StatsList, SLOT_LABELS, type InvMode } from '../inventory';
import { PlayerSprite, GoldAmount } from '../common';
import { Panel, SubHead, Segmented, usePixelScale } from '../kit';
import { useLayout } from '../../../config/ui';
import { ItemCard } from './ItemCard';
import { sfx } from '../../audio';
import { SkinSlot, SkinPicker } from './Atuendos';

const SLOT_ICON: Record<EquipSlot, string> = { mainHand: 'sword', offHand: 'shield', helmet: 'helm', armor: 'tunic', gloves: 'gloves', boots: 'boots', ring: 'ring', amulet: 'amulet' };
const MODE: InvMode = 'lobby';

export function Alijo({ onDetails, onShop }: { onDetails: () => void; onShop?: () => void }) {
  const profile = useGame((s) => s.profile)!;
  const layout = useLayout();
  const phone = layout === 'phone';
  const [sel, setSel] = useState<Loc | null>(null);
  const [view, setView] = useState<'gear' | 'storage'>('gear');
  const [picker, setPicker] = useState(false);
  const clear = () => setSel(null);
  const same = (a: Loc | null, b: Loc) => !!a && JSON.stringify(a) === JSON.stringify(b);

  // Tocar un objeto lo elige (o lo suelta si ya estaba elegido); tocar una casilla libre lleva allí el elegido.
  const onSelect = (l: Loc) => { setSel(same(sel, l) ? null : l); sfx('click'); };
  const onEmpty = (l: Loc) => { if (!sel) return; actions.transfer(sel, l); clear(); };
  const quickFromBag = (l: Loc, s: ItemStack) => { (getItem(s.itemId).slot ? actions.quickEquip(l) : actions.quickMove(l, 'stash')); clear(); };
  const grids = { equipment: profile.equipment, mode: MODE, selected: sel, onSelect, onEmpty };

  const equipment = <EquipmentGrid sel={sel} onSelect={onSelect} onEmpty={onEmpty} onDone={clear} onSkin={() => setPicker(true)} />;
  const pickerModal = picker && <SkinPicker onClose={() => setPicker(false)} onShop={onShop} />;
  const backpack = (
    <div data-testid="alijo-backpack">
      <SubHead right={<button className="btn text-xs" onClick={() => actions.sortContainer('backpack')} data-testid="sort-backpack">Ordenar</button>}>
        Mochila · {profile.backpack.filter(Boolean).length}/{profile.backpack.length}
      </SubHead>
      <GridView grid={profile.backpack} container="backpack" cols={6} {...grids} onQuick={quickFromBag} onAlt={(l) => { actions.quickMove(l, 'stash'); clear(); }} />
    </div>
  );
  const pocket = (
    <div className="mt-3" data-testid="alijo-pocket">
      <SubHead right={<span className="text-[11px] text-heal">no se pierde al morir</span>}>Bolsillo seguro · {profile.pocket.filter(Boolean).length}/{profile.pocket.length}</SubHead>
      <GridView grid={profile.pocket} container="pocket" cols={3} {...grids} onQuick={(l) => { actions.quickMove(l, 'backpack'); clear(); }} />
    </div>
  );
  const stashCols = phone ? 6 : layout === 'tablet' ? 5 : 8;
  const stash = (
    <GridView grid={profile.stash} container="stash" cols={stashCols} {...grids}
      onQuick={(l) => { actions.quickMove(l, 'backpack'); clear(); }} onAlt={(l) => { actions.quickMove(l, 'backpack'); clear(); }} />
  );
  const stashFooter = <StashFooter />;
  const card = <ItemCard loc={sel} mode={MODE} onClear={clear} compact={phone} />;

  if (phone) {
    return (
      <div className="h-full flex flex-col items-center" style={{ padding: '0 max(var(--pad), env(safe-area-inset-right)) var(--pad) max(var(--pad), env(safe-area-inset-left))', gap: 'var(--gap)' }} data-testid="screen-stash">
        <Segmented options={[{ id: 'gear', label: 'Equipo' }, { id: 'storage', label: 'Almacén' }]} value={view} onChange={(v) => { setView(v); sfx('click'); }} testId="alijo-seg" />
        <div className="flex-1 min-h-0 w-full flex justify-center" style={{ gap: 'var(--gap)' }}>
          {view === 'gear' ? (
            <>
              <Panel className="min-h-0" bodyClassName="overflow-y-auto scroll-thin flex items-start justify-center">{equipment}</Panel>
              <Panel className="min-h-0" bodyClassName="overflow-y-auto scroll-thin">{backpack}{pocket}</Panel>
            </>
          ) : (
            <>
              <Panel className="min-h-0" bodyClassName="overflow-y-auto scroll-thin">{backpack}</Panel>
              <Panel className="min-h-0" bodyClassName="overflow-y-auto scroll-thin" testId="alijo-storage">
                <SubHead>Almacén · {profile.stash.filter(Boolean).length}/{profile.stash.length}</SubHead>{stash}{stashFooter}
              </Panel>
            </>
          )}
        </div>
        {pickerModal}
        {sel && (
          <div className="absolute left-0 right-0 bottom-0 z-30 panel panel-gold p-3" style={{ paddingLeft: 'max(12px, env(safe-area-inset-left))', paddingRight: 'max(12px, env(safe-area-inset-right))' }} data-testid="item-sheet">
            <button className="btn icon-btn absolute right-2 top-2" onClick={clear} aria-label="Cerrar la ficha">✕</button>
            <div className="pr-12">{card}</div>
          </div>
        )}
      </div>
    );
  }

  const side = layout === 'tablet' ? 288 : 340;
  return (
    <div className="h-full grid" data-testid="screen-stash"
      style={{ gridTemplateColumns: `${side}px minmax(0,1fr) auto`, gap: 'var(--gap)', padding: '0 max(var(--pad), env(safe-area-inset-right)) var(--pad) max(var(--pad), env(safe-area-inset-left))' }}>
      <Panel title="Aventurero" className="min-h-0" bodyClassName="overflow-y-auto scroll-thin flex flex-col" testId="alijo-hero">
        <HeroColumn onDetails={onDetails} />
      </Panel>
      <Panel title="Equipo" className="min-h-0" bodyClassName="min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto scroll-thin">
          <div className="w-fit mx-auto">
            <div className="flex justify-center mb-4">{equipment}</div>
            {backpack}
            {pocket}
          </div>
        </div>
        {/* En tableta, la ficha solo aparece al elegir un objeto: así cabe la mochila y el bolsillo */}
        {(sel || layout === 'desktop') && <div className="flex mt-3 shrink-0" style={{ gap: 'var(--gap)' }}>
          <div className="panel p-3 flex-1 min-w-0">{card}</div>
          {layout === 'desktop' && (
            <div className="panel p-3 w-44 shrink-0 flex flex-col justify-center gap-1 text-sm">
              <div className="flex justify-between items-center"><span className="text-stone-300">Oro</span><GoldAmount value={profile.gold} /></div>
              <div className="flex justify-between"><span className="text-stone-300">En riesgo</span><span className="text-ember">{gridValue(profile.backpack) + equippedValue(profile.equipment)}</span></div>
            </div>
          )}
        </div>}
      </Panel>
      <Panel title={`Almacén · ${profile.stash.filter(Boolean).length}`} className="min-h-0" bodyClassName="min-h-0 flex flex-col" testId="alijo-storage">
        <div className="flex-1 min-h-0 overflow-y-auto scroll-thin">{stash}</div>
        {stashFooter}
      </Panel>
      {pickerModal}
    </div>
  );
}

/** Equipamiento en tres columnas: arma (grande) y manos · cabeza, torso y pies · secundaria (grande), amuleto y anillo. */
function EquipmentGrid({ sel, onSelect, onEmpty, onDone, onSkin }: { sel: Loc | null; onSelect: (l: Loc) => void; onEmpty: (l: Loc) => void; onDone: () => void; onSkin: () => void }) {
  const eq = useGame((s) => s.profile!.equipment);
  const slot = (s: EquipSlot, big = false) => (
    <div className="flex flex-col items-center gap-0.5" key={s}>
      <ItemSlot stack={eq[s]} loc={{ kind: 'equip', slot: s }} equipment={eq} mode={MODE} placeholderIcon={SLOT_ICON[s]} label={SLOT_LABELS[s]} big={big}
        selected={sel?.kind === 'equip' && sel.slot === s} awaiting={!!sel} onSelect={onSelect} onEmpty={onEmpty}
        onQuick={(l) => { actions.unequip(l); onDone(); }} onAlt={(l) => { actions.unequip(l); onDone(); }} />
      <span className="text-[10px] text-stone-300 uppercase tracking-wider">{SLOT_LABELS[s]}</span>
    </div>
  );
  return (
    <div className="flex items-start gap-6" data-testid="equipment">
      <div className="flex flex-col items-center gap-2">{slot('mainHand', true)}{slot('gloves')}<SkinSlot onClick={onSkin} /></div>
      <div className="flex flex-col items-center gap-2">{slot('helmet')}{slot('armor')}{slot('boots')}</div>
      <div className="flex flex-col items-center gap-2">{slot('offHand', true)}{slot('amulet')}{slot('ring')}</div>
    </div>
  );
}

function HeroColumn({ onDetails }: { onDetails: () => void }) {
  const profile = useGame((s) => s.profile)!;
  const ch = profile.character;
  const cls = CLASSES[ch.classId];
  const scale = usePixelScale('heroSm');
  const stats = computeStats(ch.classId, ch.level, profile.equipment);
  return (
    <>
      <div className="ui-arch mx-auto w-full" style={{ height: 26 * scale + 40 }}><div className="pb-3"><PlayerSprite scale={scale} /></div></div>
      <div className="text-center font-display text-gold mt-3">◆ {cls.name} ◆</div>
      <div className="mt-2"><StatsColumn stats={stats} base={baseStats(ch.classId, ch.level)} resourceName={cls.resourceName} /></div>
      <div className="flex-1" />
      <button className="btn w-full mt-3 font-display tracking-[0.1em] uppercase" style={{ minHeight: 'var(--btn-h)' }} onClick={onDetails} data-testid="btn-hero-details">Ver detalles</button>
    </>
  );
}

/** Lista de atributos en una columna (Vida 258/258 (+52)…). */
function StatsColumn(props: Parameters<typeof StatsList>[0]) {
  return <div className="alijo-stats"><StatsList {...props} /></div>;
}

function StashFooter() {
  const profile = useGame((s) => s.profile)!;
  const n = stashUpgrades(profile);
  const cost = STASH_UPGRADE_COSTS[n];
  return (
    <div className="flex items-center justify-between gap-2 mt-3 flex-wrap shrink-0">
      <button className="btn text-sm" onClick={() => actions.sortContainer('stash')} data-testid="sort-stash">Ordenar</button>
      {cost !== undefined
        ? <button className="btn text-sm" disabled={profile.gold < cost} onClick={() => actions.upgradeStash()} data-testid="btn-stash-upgrade">Ampliar (+{STASH_ROW}) · {cost} oro</button>
        : <span className="text-xs text-heal">Tamaño máximo</span>}
    </div>
  );
}

