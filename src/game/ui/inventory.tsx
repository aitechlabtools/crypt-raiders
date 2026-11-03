import { qualityStats } from '../../core/forge';
import { QUALITIES } from '../../core/data/forge';
import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { EquipSlot, Equipment, Grid, ItemStack, Stats } from '../../core/types';
import { EQUIP_SLOTS, STAT_KEYS } from '../../core/types';
import { getItem, RARITY_INFO } from '../../core/data/items';
import { CLASSES, STAT_LABELS } from '../../core/data/classes';
import type { Loc } from '../../core/inventory';
import { sellPrice } from '../../core/economy';
import { iconUrl } from '../../shared/art';
import { actions, useGame } from '../state/store';
import { getSkill } from '../../core/data/skills';

export const SLOT_LABELS: Record<EquipSlot, string> = {
  mainHand: 'Arma', offHand: 'Secundaria', helmet: 'Cabeza', armor: 'Torso', gloves: 'Manos', boots: 'Pies', ring: 'Anillo', amulet: 'Amuleto',
};
const SLOT_HINT_ICON: Record<EquipSlot, string> = {
  mainHand: 'sword', offHand: 'shield', helmet: 'helm', armor: 'tunic', gloves: 'gloves', boots: 'boots', ring: 'ring', amulet: 'amulet',
};

export type InvMode = 'lobby' | 'merchant' | 'dungeon';

const DRAG_MIME = 'application/x-cryptraiders';

export function ItemIcon({ itemId, size = 36 }: { itemId: string; size?: number }) {
  const def = getItem(itemId);
  return <img src={iconUrl(def.icon, 3)} width={size} height={size} alt={def.name} className="pixelated" draggable={false} />;
}

function statLine(k: keyof Stats, v: number) {
  const sign = v > 0 ? '+' : '';
  return `${sign}${v} ${STAT_LABELS[k]}`;
}

export function ItemTooltip({ stack, equipment, mode }: { stack: ItemStack; equipment?: Equipment; mode?: InvMode }) {
  const def = getItem(stack.itemId);
  const who = useGame((s) => s.profile?.character);
  const r = RARITY_INFO[def.rarity];
  const equipped = def.slot && equipment ? equipment[def.slot] : null;
  const cmp = equipped && equipped.uid !== stack.uid ? getItem(equipped.itemId) : null;
  return (
    <div className="panel p-3 w-64 text-sm" style={{ borderColor: r.color }}>
      <div className="font-semibold text-base leading-tight" style={{ color: r.color }}>{def.name}</div>
      <div className="text-stone-300 text-xs mb-2">
        {r.name} · {def.slot ? SLOT_LABELS[def.slot] : categoryName(def.category)}
        {stack.qty > 1 ? ` · x${stack.qty}` : ''}
      </div>
      {def.uses !== undefined && <div className="text-xs mb-1 text-stone-300" data-testid="tool-uses">Usos: {stack.uses ?? def.uses}/{def.uses}{def.mineTime ? ` · pica en ${def.mineTime} s` : ''}</div>}
      {stack.quality !== undefined && <div className="text-xs mb-1" style={{ color: ['#9a9a9a', '#5fbf4a', '#e8b33a'][stack.quality] }}>Calidad {QUALITIES[stack.quality].name.toLowerCase()}{QUALITIES[stack.quality].bonus ? ` (+${Math.round(QUALITIES[stack.quality].bonus * 100)}%)` : ''}{stack.forgedBy ? ` · Forjada por ${stack.forgedBy}` : ''}</div>}
      {def.stats && (() => {
        const st = qualityStats(def.stats, stack.quality);
        return (
          <ul className="mb-2">
            {STAT_KEYS.filter((k) => st[k]).map((k) => (
              <li key={k} className={st[k]! > 0 ? 'text-heal' : 'text-blood'}>{statLine(k, st[k]!)}</li>
            ))}
          </ul>
        );
      })()}
      {def.use && <div className="text-frost mb-2">Uso: {def.description}</div>}
      <div className="font-body italic text-stone-300 leading-snug">{def.use ? '' : def.description}</div>
      {(def.attack || def.grants) && (
        <div className="text-xs mt-2 pt-2 border-t border-stone-700">
          {def.attack && <div className="text-stone-300">Ataque básico: <span className="text-parchment">{def.attack.name}</span></div>}
          {def.grants && <div className="text-stone-300">{def.slot === 'offHand' ? 'Habilidades defensivas' : 'Habilidades'}: <span className={def.slot === 'offHand' ? 'text-frost' : 'text-parchment'}>{def.grants.map((g) => getSkill(g).name).join(', ')}</span></div>}
        </div>
      )}
      {def.classes && <div className={`text-xs mt-2 ${who && !def.classes.includes(who.classId) ? 'text-blood' : 'text-stone-300'}`}>Clases: {def.classes.map((c) => CLASSES[c].name).join(', ')}</div>}
      {def.levelReq && def.slot && (
        <div className={`text-xs ${who && who.level < def.levelReq ? 'text-blood' : 'text-heal'}`} data-testid="tooltip-level">
          Requiere nivel {def.levelReq}{who && who.level < def.levelReq ? ` (tienes ${who.level}): puedes guardarlo, pero no equiparlo` : ''}
        </div>
      )}
      {cmp && (
        <div className="mt-2 pt-2 border-t border-stone-600 text-xs">
          <div className="text-stone-300 mb-1">Comparado con {cmp.name}:</div>
          {STAT_KEYS.map((k) => {
            const d = (def.stats?.[k] ?? 0) - (cmp.stats?.[k] ?? 0);
            if (!d) return null;
            return <div key={k} className={d > 0 ? 'text-heal' : 'text-blood'}>{d > 0 ? '▲' : '▼'} {statLine(k, d)}</div>;
          })}
        </div>
      )}
      <div className="flex justify-between mt-2 text-xs text-gold">
        <span>Valor: {def.value * stack.qty} oro</span>
        {mode === 'merchant' && <span>Venta: {sellPrice(def.id)}</span>}
      </div>
    </div>
  );
}

function categoryName(c: string) {
  return ({ potion: 'Consumible', material: 'Material', relic: 'Reliquia', jewel: 'Joya', key: 'Llave', quest: 'Objeto de misión', coin: 'Moneda', weapon: 'Arma', shield: 'Escudo', tool: 'Herramienta' } as Record<string, string>)[c] ?? c;
}

interface SlotProps {
  stack: ItemStack | null;
  loc: Loc;
  lootId?: string;
  equipment?: Equipment;
  mode?: InvMode;
  selected?: boolean;
  placeholderIcon?: string;
  label?: string;
  onSelect?: (loc: Loc) => void;
  onQuick?: (loc: Loc, stack: ItemStack) => void;
  onAlt?: (loc: Loc, stack: ItemStack) => void;
}

export function ItemSlot({ stack, loc, lootId, equipment, mode, selected, placeholderIcon, label, onSelect, onQuick, onAlt }: SlotProps) {
  const [over, setOver] = useState(false);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
  const rarity = stack ? RARITY_INFO[getItem(stack.itemId).rarity] : null;
  const who = useGame((s) => s.profile?.character);
  const sdef = stack ? getItem(stack.itemId) : null;
  const tooHigh = !!(sdef?.slot && who && sdef.levelReq && who.level < sdef.levelReq);
  const wrongClass = !!(sdef?.slot && who && sdef.classes && !sdef.classes.includes(who.classId));
  const testId = loc.kind === 'equip' ? `slot-equip-${loc.slot}` : `slot-${loc.container}-${loc.index}`;
  return (
    <div
      data-testid={testId}
      data-item={stack?.itemId ?? ''}
      className={`slot ${over ? 'drag-over' : ''} ${selected ? 'selected' : ''}`}
      style={rarity ? { borderColor: rarity.color + 'aa', boxShadow: `inset 0 0 0 1px #07060a, inset 0 0 14px ${rarity.color}33` } : undefined}
      draggable={!!stack}
      onDragStart={(e) => {
        setTip(null);
        e.dataTransfer.setData(DRAG_MIME, JSON.stringify({ loc, lootId }));
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes(DRAG_MIME)) {
          e.preventDefault();
          setOver(true);
        }
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const raw = e.dataTransfer.getData(DRAG_MIME);
        if (!raw) return;
        const data = JSON.parse(raw) as { loc: Loc; lootId?: string };
        actions.transfer(data.loc, loc, data.lootId ?? lootId);
      }}
      onClick={() => stack && onSelect?.(loc)}
      onDoubleClick={() => stack && onQuick?.(loc, stack)}
      onContextMenu={(e) => {
        e.preventDefault();
        if (stack) onAlt?.(loc, stack);
      }}
      onMouseEnter={(e) => {
        if (!stack) return;
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setTip({ x: r.right + 8, y: r.top });
      }}
      onMouseLeave={() => setTip(null)}
      title={!stack && label ? label : undefined}
    >
      {stack ? <ItemIcon itemId={stack.itemId} /> : placeholderIcon ? <img src={iconUrl(placeholderIcon, 3)} width={30} height={30} className="pixelated opacity-15" alt="" draggable={false} /> : null}
      {stack && stack.qty > 1 && <span className="qty">{stack.qty}</span>}
      {stack && loc.kind === 'grid' && (tooHigh || wrongClass) && (
        <span className="absolute left-0.5 top-0 text-[10px] leading-none px-0.5 bg-black/80 text-blood" data-testid="slot-locked" title={wrongClass ? 'Tu clase no puede usarlo' : `Requiere nivel ${sdef!.levelReq}`}>
          {wrongClass ? '✕' : `Nv${sdef!.levelReq}`}
        </span>
      )}
      {tip && stack && createPortal(
        <div className="fixed z-[100] pointer-events-none" style={{ left: Math.min(tip.x, window.innerWidth - 270), top: Math.min(tip.y, window.innerHeight - 280) }}>
          <ItemTooltip stack={stack} equipment={equipment} mode={mode} />
        </div>,
        document.body,
      )}
    </div>
  );
}

export function GridView(props: {
  grid: Grid;
  container: 'backpack' | 'stash' | 'loot' | 'pocket';
  cols: number;
  lootId?: string;
  equipment?: Equipment;
  mode?: InvMode;
  selected?: Loc | null;
  onSelect?: (loc: Loc) => void;
  onQuick?: (loc: Loc, stack: ItemStack) => void;
  onAlt?: (loc: Loc, stack: ItemStack) => void;
}) {
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${props.cols}, var(--slot))` }} data-testid={`grid-${props.container}`}>
      {props.grid.map((s, i) => {
        const loc: Loc = { kind: 'grid', container: props.container, index: i };
        const sel = props.selected?.kind === 'grid' && props.selected.container === props.container && props.selected.index === i;
        return <ItemSlot key={i} stack={s} loc={loc} lootId={props.lootId} equipment={props.equipment} mode={props.mode} selected={sel} onSelect={props.onSelect} onQuick={props.onQuick} onAlt={props.onAlt} />;
      })}
    </div>
  );
}

export function EquipmentView({ equipment, portrait, selected, onSelect, mode }: { equipment: Equipment; portrait: ReactNode; selected?: Loc | null; onSelect?: (l: Loc) => void; mode?: InvMode }) {
  const slot = (s: EquipSlot) => (
    <div className="flex flex-col items-center gap-0.5" key={s}>
      <ItemSlot
        stack={equipment[s]}
        loc={{ kind: 'equip', slot: s }}
        equipment={equipment}
        mode={mode}
        placeholderIcon={SLOT_HINT_ICON[s]}
        label={SLOT_LABELS[s]}
        selected={selected?.kind === 'equip' && selected.slot === s}
        onSelect={onSelect}
        onQuick={(l) => actions.unequip(l)}
        onAlt={(l) => actions.unequip(l)}
      />
      <span className="text-[10px] text-stone-300 uppercase tracking-wider">{SLOT_LABELS[s]}</span>
    </div>
  );
  const [left, right] = [EQUIP_SLOTS.slice(0, 4), EQUIP_SLOTS.slice(4)];
  return (
    <div className="flex items-center gap-3" data-testid="equipment">
      <div className="flex flex-col gap-1">{left.map(slot)}</div>
      <div className="flex-1 flex items-center justify-center min-w-[120px]">{portrait}</div>
      <div className="flex flex-col gap-1">{right.map(slot)}</div>
    </div>
  );
}

export function StatsList({ stats, base, resourceName }: { stats: Stats; base?: Stats; resourceName: string }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm" data-testid="stats">
      {STAT_KEYS.map((k) => {
        const bonus = base ? stats[k] - base[k] : 0;
        return (
          <div key={k} className="flex justify-between" data-stat={k}>
            <span className="text-stone-300">{k === 'maxMp' ? resourceName : STAT_LABELS[k]}</span>
            <span>
              {stats[k]}
              {bonus !== 0 && <span className={bonus > 0 ? 'text-heal' : 'text-blood'}> ({bonus > 0 ? '+' : ''}{bonus})</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function Bar({ value, max, color, label, testId }: { value: number; max: number; color: string; label?: string; testId?: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="w-full" data-testid={testId}>
      {label && (
        <div className="flex justify-between text-xs mb-0.5">
          <span>{label}</span>
          <span>{Math.round(value)}/{max}</span>
        </div>
      )}
      <div className="bar">
        <div style={{ width: `${pct}%`, background: `linear-gradient(180deg, ${color} 0%, ${color} 55%, rgba(0,0,0,0.35) 100%)`, backgroundColor: color }} />
      </div>
    </div>
  );
}
