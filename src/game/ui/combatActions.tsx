// Barra de acciones del combate: ataque, habilidades, objetos y acciones generales en una sola vista,
// con iconos y una ficha al pasar el ratón (o al enfocar con el teclado).
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useIsTouch } from '../../shared/device';
import { TOUCH_CFG } from '../../config/touch';

// En pantallas táctiles no existe «pasar el ratón»: un toque ejecuta y mantener pulsado enseña la ficha.
/** Mantener pulsado (táctil): abre la ficha y anula el clic que llega al soltar. */
export function useLongPress(onLong: () => void, onEnd?: () => void) {
  const timer = useRef<number | null>(null);
  const fired = useRef(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const clear = () => { if (timer.current !== null) { window.clearTimeout(timer.current); timer.current = null; } };
  useEffect(() => clear, []);
  return {
    /** true si el último toque fue una pulsación larga (el clic de después no debe ejecutar). */
    consume: () => { const f = fired.current; fired.current = false; return f; },
    handlers: {
      onPointerDown: (e: React.PointerEvent) => {
        if (e.pointerType !== 'touch') return;
        fired.current = false; start.current = { x: e.clientX, y: e.clientY }; clear();
        timer.current = window.setTimeout(() => { fired.current = true; timer.current = null; onLong(); }, TOUCH_CFG.longPressMs);
      },
      onPointerMove: (e: React.PointerEvent) => {
        if (!start.current || timer.current === null) return;
        if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > TOUCH_CFG.longPressSlop) clear();
      },
      onPointerUp: () => { clear(); start.current = null; if (fired.current) onEnd?.(); },
      onPointerCancel: () => { clear(); start.current = null; if (fired.current) onEnd?.(); },
      onContextMenu: (e: React.MouseEvent) => { if (fired.current || timer.current !== null) e.preventDefault(); },
    },
  };
}
function useOpenTip(id: string) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const h = (e: Event) => { if ((e as CustomEvent).detail !== id) setOpen(false); };
    window.addEventListener('tip-open', h);
    return () => window.removeEventListener('tip-open', h);
  }, [id]);
  const show = () => { window.dispatchEvent(new CustomEvent('tip-open', { detail: id })); setOpen(true); };
  return { open, show, hide: () => setOpen(false) };
}
import type { Combatant } from '../../core/combat';
import { canUseSkill, cooldownLeft, costOf } from '../../core/combat';
import { resourceGain } from '../../config/progression';
import { getSkill } from '../../core/data/skills';
import { getItem } from '../../core/data/items';
import { STATUSES } from '../../core/statuses';
import type { AttackDef, SkillDef } from '../../core/types';
import { ItemIcon } from './inventory';

export type Source = 'basic' | 'class' | 'weapon' | 'offhand';
const SOURCE: Record<Source, { label: string; color: string }> = {
  basic: { label: 'Ataque básico', color: '#d9d3c1' },
  class: { label: 'Clase', color: '#e8b33a' },
  weapon: { label: 'Arma', color: '#a56bff' },
  offhand: { label: 'Mano izquierda', color: '#8fa8c8' },
};
export const FX_COLOR: Record<string, string> = {
  fire: '#ff8a3a', frost: '#9fe3ff', dark: '#b07aff', holy: '#f8dc7a', poison: '#8fd14a', slash: '#ffffff', bite: '#ff6a5a', smash: '#d9d3c1', shield: '#8fa8c8',
};

// Iconos vectoriales sencillos, de trazo grueso, coherentes con el pixel art
const PATHS: Record<string, ReactNode> = {
  slash: <><path d="M5 19 L17 7 L19 5 L19 7 L7 19 Z" /><path d="M4 16 L8 20" /><path d="M3 21 L5 19" /></>,
  smash: <><rect x="4" y="4" width="11" height="7" rx="1" /><path d="M10 11 L10 21" /><path d="M15 6 L20 6" /></>,
  fire: <path d="M12 3 C14 7 18 9 18 14 A6 6 0 0 1 6 14 C6 11 8 9 9 7 C9 10 11 11 11 11 C11 8 11 5 12 3 Z" />,
  frost: <><path d="M12 3 V21" /><path d="M4.5 7.5 L19.5 16.5" /><path d="M19.5 7.5 L4.5 16.5" /><path d="M9 4.5 L12 7 L15 4.5" /><path d="M9 19.5 L12 17 L15 19.5" /></>,
  dark: <><circle cx="12" cy="11" r="7" /><circle cx="9.5" cy="10" r="1.6" /><circle cx="14.5" cy="10" r="1.6" /><path d="M9 18 V21 M12 18 V21 M15 18 V21" /></>,
  holy: <><circle cx="12" cy="12" r="4" /><path d="M12 2 V5 M12 19 V22 M2 12 H5 M19 12 H22 M5 5 L7 7 M17 17 L19 19 M19 5 L17 7 M5 19 L7 17" /></>,
  poison: <path d="M12 3 C15 8 18 11 18 15 A6 6 0 0 1 6 15 C6 11 9 8 12 3 Z" />,
  shield: <path d="M12 3 L19 6 V11 C19 16 15.5 19.5 12 21 C8.5 19.5 5 16 5 11 V6 Z" />,
  bite: <><path d="M4 8 L7 14 L10 8 L12 14 L14 8 L17 14 L20 8" /><path d="M4 18 L20 18" /></>,
  bag: <><path d="M6 8h12l-1 12H7z" /><path d="M9 8a3 3 0 0 1 6 0" /></>,
  flee: <><path d="M4 12 H17" /><path d="M13 7 L18 12 L13 17" /><path d="M20 5 V19" /></>,
};
export function ActionIcon({ fx, color, size = 30 }: { fx: string; color?: string; size?: number }) {
  const c = color ?? FX_COLOR[fx] ?? '#d9d3c1';
  const filled = ['fire', 'poison', 'shield'].includes(fx);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ filter: `drop-shadow(0 0 6px ${c}66)` }}>
      <g fill={filled ? `${c}33` : 'none'} stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{PATHS[fx] ?? PATHS.slash}</g>
    </svg>
  );
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
const kindName = (k: string) => (k === 'magical' ? 'mágico' : 'físico');

function skillLines(sk: SkillDef, res: string, maxMp = 0): string[] {
  const out: string[] = [];
  if (sk.target === 'enemy' && sk.power) out.push(`Daño ${kindName(sk.kind ?? 'physical')} ×${sk.power}`);
  if (sk.ignoresEvasion) out.push('No se puede esquivar');
  if (sk.armorPierce) out.push(`Ignora el ${pct(sk.armorPierce)} de la defensa`);
  if (sk.bonusVsUndead) out.push(`×${sk.bonusVsUndead} contra no-muertos`);
  if (sk.healPct) out.push(`Te cura un ${pct(sk.healPct)} de la vida`);
  if (sk.manaGain) out.push(`Recuperas ${resourceGain(sk.manaGain, maxMp)} de ${res.toLowerCase()}`);
  if (sk.cooldown) out.push(`Recarga: ${sk.cooldown} turno${sk.cooldown > 1 ? 's' : ''}`);
  for (const a of sk.applies ?? []) {
    const st = STATUSES[a.status];
    out.push(`${a.chance >= 1 ? '' : `${pct(a.chance)} de `}${st.name}${a.self ? ' (a ti)' : ''} · ${a.turns} turno${a.turns > 1 ? 's' : ''}`);
  }
  return out;
}

export interface Slot {
  id: string; key: string; name: string; fx: string; source: Source; sourceLabel?: string;
  cost: number; disabled: boolean; reason?: string; desc: string; lines: string[]; onUse: () => void; testId: string; itemId?: string;
}


export function skillSlot(id: string, key: string, source: Source, sourceLabel: string, player: Combatant, onUse: () => void): Slot {
  const sk = getSkill(id);
  const ok = canUseSkill(player, id);
  return {
    id, key, name: sk.name, fx: sk.fx ?? 'slash', source, sourceLabel, cost: costOf(player, id), disabled: !ok,
    reason: ok ? undefined : cooldownLeft(player, id) > 0 ? `En recarga: faltan ${cooldownLeft(player, id)} turno${cooldownLeft(player, id) > 1 ? 's' : ''}.` : `Te falta ${player.resourceName.toLowerCase()}: necesitas ${costOf(player, id)} y tienes ${player.mp}.`,
    desc: sk.description, lines: [...skillLines(sk, player.resourceName, player.stats.maxMp), ...modLine(player.skillMods?.[id])], onUse, testId: `skill-${id}`,
  };
}
function modLine(m?: { cooldown: number; power: number }): string[] {
  if (!m) return [];
  const parts = [m.cooldown ? `${m.cooldown} turno de recarga` : '', m.power ? `+${Math.round(m.power * 100)} % de daño` : ''].filter(Boolean);
  return [`Mejorado por tu arma: ${parts.join(', ')}`];
}

export function attackSlot(a: AttackDef, onUse: () => void): Slot {
  return { id: 'attack', key: '1', name: a.name, fx: a.fx ?? 'slash', source: 'basic', cost: 0, disabled: false, desc: 'El golpe de tu arma. Nunca se agota.', lines: [`Daño ${kindName(a.kind)} ×${a.power}`], onUse, testId: 'act-attack' };
}

function Tooltip({ s, res }: { s: Slot; res: string }) {
  const src = SOURCE[s.source];
  return (
    <div className="absolute bottom-full left-0 mb-2 w-64 z-50 panel p-3 text-left pointer-events-none fade-in shadow-2xl" role="tooltip" style={{ borderColor: src.color }} data-testid="action-tooltip">
      <div className="flex items-center gap-2">
        <ActionIcon fx={s.fx} size={22} />
        <div className="font-display text-parchment leading-tight">{s.name}</div>
      </div>
      <div className="text-[11px] mt-1" style={{ color: src.color }}>{src.label}{s.sourceLabel ? ` · ${s.sourceLabel}` : ''} · {s.cost ? `${s.cost} ${res.toLowerCase()}` : 'sin coste'}</div>
      <div className="font-body text-stone-200 text-[15px] leading-snug mt-2">{s.desc}</div>
      {s.lines.length > 0 && <ul className="mt-2 space-y-0.5 text-xs text-stone-300">{s.lines.map((l) => <li key={l}>· {l}</li>)}</ul>}
      {s.reason && <div className="mt-2 text-xs text-[#ff7a6a]">{s.reason}</div>}
    </div>
  );
}

export function SlotTile({ s, res }: { s: Slot; res: string }) {
  const tip = useOpenTip(s.id); const hover = tip.open;
  const setHover = (v: boolean) => (v ? tip.show() : tip.hide());
  const TOUCH = useIsTouch();
  const lp = useLongPress(() => setHover(true), () => setHover(false));
  const onTap = () => { if (lp.consume()) return; if (s.disabled) { if (TOUCH) setHover(!hover); return; } tip.hide(); s.onUse(); };
  const src = SOURCE[s.source];
  return (
    <div className="relative" onMouseEnter={() => !TOUCH && setHover(true)} onMouseLeave={() => !TOUCH && setHover(false)}>
      <button
        className={`action-tile ${s.disabled ? 'is-off' : ''} ${hover && TOUCH ? 'is-armed' : ''}`} style={{ ['--src' as string]: src.color }}
        {...lp.handlers} onClick={onTap} disabled={s.disabled && !TOUCH} aria-disabled={s.disabled} onFocus={() => !TOUCH && setHover(true)} onBlur={() => !TOUCH && setHover(false)}
        aria-label={`${s.name}. ${s.desc}`} data-testid={s.testId}
      >
        <kbd className="absolute top-1 left-1 text-[10px] bg-black/50 px-1 leading-4">{s.key}</kbd>
        {s.cost > 0 && <span className="absolute top-1 right-1 text-[10px] px-1 leading-4 bg-[#1d2c4a] text-[#9cc3ff]">{s.cost}</span>}
        <ActionIcon fx={s.fx} />
        <span className="text-[11px] leading-tight text-center mt-1 line-clamp-2">{s.name}</span>
      </button>
      {hover && <Tooltip s={s} res={res} />}
    </div>
  );
}

/** Botón pequeño de acción general (defender, objeto, huir) con ficha al pasar el ratón. */
export function UtilBtn({ k, label, sub, icon, onClick, disabled, danger, tip, testId, itemId }: {
  k: string; label: string; sub: string; icon?: string; itemId?: string; onClick: () => void; disabled?: boolean; danger?: boolean; tip: string; testId: string;
}) {
  const tipState = useOpenTip(testId); const hover = tipState.open;
  const setHover = (v: boolean) => (v ? tipState.show() : tipState.hide());
  const TOUCH = useIsTouch();
  const lp = useLongPress(() => setHover(true), () => setHover(false));
  const onTap = () => { if (lp.consume()) return; tipState.hide(); onClick(); };
  return (
    <div className="relative" onMouseEnter={() => !TOUCH && setHover(true)} onMouseLeave={() => !TOUCH && setHover(false)}>
      <button className={`btn w-full flex items-center gap-2 text-left py-1.5 ${danger ? 'btn-danger' : ''} ${hover && TOUCH ? 'is-armed' : ''}`} {...lp.handlers} onClick={onTap} disabled={disabled} onFocus={() => !TOUCH && setHover(true)} onBlur={() => !TOUCH && setHover(false)} data-testid={testId}>
        <kbd className="text-[10px] bg-black/40 px-1">{k}</kbd>
        {itemId ? <ItemIcon itemId={itemId} size={20} /> : <ActionIcon fx={icon ?? 'shield'} size={20} color={danger ? '#ffb3a8' : undefined} />}
        <span className="flex flex-col leading-tight"><span className="text-sm whitespace-nowrap">{label}</span><span className="text-[10px] opacity-70">{sub}</span></span>
      </button>
      {hover && (
        <div className="absolute bottom-full left-0 mb-2 w-60 z-50 panel p-3 pointer-events-none fade-in font-body text-[15px] text-stone-200 leading-snug" role="tooltip">
          <div className="font-display text-parchment mb-1">{itemId ? getItem(itemId).name : label}</div>{tip}
        </div>
      )}
    </div>
  );
}
