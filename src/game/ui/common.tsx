import { useEffect, useState, type ReactNode } from 'react';
import type { Loc } from '../../core/inventory';
import { stackAt } from '../../core/inventory';
import { getItem } from '../../core/data/items';
import { sellPrice } from '../../core/economy';
import type { Appearance, ClassId } from '../../core/types';
import { heroUrl, monsterUrl, iconUrl } from '../../shared/art';
import { actions, containersFor, getState, useGame } from '../state/store';
import type { InvMode } from './inventory';
import { ItemIcon } from './inventory';
import { RARITY_INFO } from '../../core/data/items';

export function HeroSprite({ classId, appearance, scale = 6, animate = true, pose = 'idle' as 'idle' | 'attack' | 'hurt', className = '' }: { classId: ClassId; appearance: Appearance; scale?: number; animate?: boolean; pose?: 'idle' | 'attack' | 'hurt'; className?: string }) {
  const [f, setF] = useState(0);
  useEffect(() => {
    if (!animate) return;
    const t = setInterval(() => setF((x) => (x + 1) % 4), 220);
    return () => clearInterval(t);
  }, [animate]);
  return <img src={heroUrl(classId, appearance, scale, animate ? f : 0, pose)} className={`pixelated ${className}`} alt="" draggable={false} />;
}

export function MonsterSprite({ sprite, scale = 6, pose = 'idle', className = '' }: { sprite: string; scale?: number; pose?: 'idle' | 'attack' | 'hurt'; className?: string }) {
  return <img src={monsterUrl(sprite, scale, pose)} className={`pixelated ${className}`} alt="" draggable={false} />;
}

export function GoldAmount({ value, className = '' }: { value: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-gold ${className}`} data-testid="gold">
      <img src={iconUrl('coin', 2)} width={18} height={18} className="pixelated" alt="" />
      {value}
    </span>
  );
}

export function Modal({ children, onClose, wide = false, testId }: { children: ReactNode; onClose?: () => void; wide?: boolean; testId?: string }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 fade-in" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()} data-testid={testId}>
      <div className={`panel panel-gold p-5 ${wide ? 'max-w-4xl' : 'max-w-lg'} w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto scroll-thin`}>{children}</div>
    </div>
  );
}

export function Toasts() {
  const toasts = useGame((s) => s.toasts);
  const color = { loot: 'border-gold text-gold', info: 'border-stone-500', danger: 'border-blood text-[#ff8a7a]', social: 'border-heal text-heal', good: 'border-heal' };
  return (
    <div className="absolute right-4 bottom-4 z-[60] flex flex-col gap-2 w-80 pointer-events-none" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`panel px-3 py-2 text-sm fade-in border-l-4 ${color[t.kind]} flex items-center gap-2`}>
          {t.icon && <img src={iconUrl(t.icon, 2)} width={24} height={24} className="pixelated" alt="" />}
          <span className="font-body text-base leading-tight">{t.text}</span>
        </div>
      ))}
    </div>
  );
}

/** Panel con las acciones disponibles para el objeto seleccionado. */
export function ItemActions({ loc, mode, onClear, lootId }: { loc: Loc | null; mode: InvMode; onClear: () => void; lootId?: string }) {
  const s = useGame((x) => x);
  if (!loc) return <div className="text-stone-400 text-sm italic font-body">Selecciona un objeto para ver sus acciones. Doble clic: acción rápida · Clic derecho: mover · Arrastra para colocar.</div>;
  const c = containersFor(s, lootId);
  const st = c ? stackAt(c, loc) : null;
  if (!st) return <div className="text-stone-400 text-sm italic font-body">Selecciona un objeto.</div>;
  const def = getItem(st.itemId);
  const inGrid = loc.kind === 'grid';
  const btns: ReactNode[] = [];
  const b = (label: string, fn: () => void, cls = '', testId?: string) => (
    <button key={label} className={`btn text-sm ${cls}`} onClick={fn} data-testid={testId}>{label}</button>
  );
  if (def.slot && inGrid && loc.container !== 'loot') btns.push(b('Equipar', () => { actions.quickEquip(loc); onClear(); }, 'btn-gold', 'act-equip'));
  if (loc.kind === 'equip') btns.push(b('Quitar', () => { actions.unequip(loc); onClear(); }, '', 'act-unequip'));
  if (def.use && mode === 'dungeon' && inGrid && loc.container === 'backpack') btns.push(b('Usar', () => actions.useItem(loc), 'btn-gold', 'act-use'));
  if (mode === 'lobby' && inGrid && loc.container === 'backpack') btns.push(b('Al almacén', () => { actions.quickMove(loc, 'stash'); onClear(); }, '', 'act-stash'));
  if (mode === 'lobby' && inGrid && loc.container === 'stash') btns.push(b('A la mochila', () => { actions.quickMove(loc, 'backpack'); onClear(); }, '', 'act-backpack'));
  if (mode === 'merchant' && inGrid && (loc.container === 'backpack' || loc.container === 'stash')) {
    btns.push(b(`Vender (${sellPrice(def.id)})`, () => { actions.sell(loc.container as 'backpack' | 'stash', loc.index); if (st.qty <= 1) onClear(); }, 'btn-gold', 'act-sell'));
    if (st.qty > 1) btns.push(b(`Vender todo (${sellPrice(def.id) * st.qty})`, () => { actions.sell(loc.container as 'backpack' | 'stash', loc.index, true); onClear(); }));
  }
  if (mode === 'dungeon' && inGrid && loc.container === 'backpack') btns.push(b('Soltar', () => { actions.dropItem(loc); onClear(); }, 'btn-danger', 'act-drop'));
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <ItemIcon itemId={st.itemId} size={32} />
      <span style={{ color: RARITY_INFO[def.rarity].color }}>{def.name}</span>
      <div className="flex gap-2 flex-wrap">{btns}</div>
    </div>
  );
}

export function formatTime(ms: number) {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function useHotkey(key: string, fn: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault();
        fn();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [key, fn, enabled]);
}

export { getState };
