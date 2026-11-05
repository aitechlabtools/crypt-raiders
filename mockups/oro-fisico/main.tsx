// Maqueta del oro físico: monedas que ocupan casillas, saquito (1 casilla, 50) y saco (2×2, 250),
// bolsillo seguro con saquitos, sacar monedas, botín en un saco en el suelo y el Coleccionista.
// Solo estructura y textos; los iconos de monedas y sacos son provisionales (los diseñará el usuario).
// Vistas: ?v=alijo | bolsillo | sacar | dividir | botin | coleccionista | venta-llena
import { StrictMode, useState, type CSSProperties, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/game/game.css';
import { HeroSprite, GoldAmount, Modal } from '../../src/game/ui/common';
import { Panel, PillBar, SubHead, ItemIcon } from '../../src/game/ui/kit';
import { useLayout } from '../../src/config/ui';
import { emptyEquipment } from '../../src/core/inventory';
import type { Equipment, ItemStack } from '../../src/core/types';

const V = new URLSearchParams(location.search).get('v') ?? 'alijo';
document.documentElement.classList.toggle('is-touch', matchMedia('(pointer:coarse)').matches || innerWidth < 1300);

/* ── Iconos provisionales (pixel art 12×12 en SVG) ── */
const G1 = '#f2c75a', G2 = '#c48f22', G3 = '#7a5310', SK = '#8a5a2b', SK2 = '#5e3b1a', ROPE = '#d9c9a0';
function Px({ size, children }: { size: number; children: ReactNode }) {
  return <svg width={size} height={size} viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden>{children}</svg>;
}
const r = (x: number, y: number, w: number, h: number, f: string) => <rect x={x} y={y} width={w} height={h} fill={f} />;
/** Monedas sueltas: 1–3 (pocas), 4–7 (montoncito), 8–10 (montón). */
export function CoinIcon({ n, size = 36 }: { n: number; size?: number }) {
  const coin = (x: number, y: number) => <g key={`${x}${y}`}>{r(x, y, 4, 1, G2)}{r(x - 1, y + 1, 6, 2, G1)}{r(x, y + 3, 4, 1, G3)}{r(x + 1, y + 1, 2, 1, '#fff3c4')}</g>;
  const pos = n <= 3 ? [[4, 7]] : n <= 7 ? [[2, 8], [6, 8], [4, 5]] : [[1, 8], [5, 8], [8, 8], [3, 5], [6, 5], [4, 2]];
  return <Px size={size}>{pos.map(([x, y]) => coin(x, y))}</Px>;
}
export function PouchIcon({ size = 36 }: { size?: number }) {
  return <Px size={size}>{r(4, 1, 4, 1, SK2)}{r(5, 2, 2, 1, ROPE)}{r(3, 3, 6, 1, SK)}{r(2, 4, 8, 6, SK)}{r(3, 10, 6, 1, SK2)}{r(3, 5, 2, 3, '#a87240')}{r(6, 6, 3, 2, G1)}</Px>;
}
export function SackIcon({ size = 80 }: { size?: number }) {
  return <Px size={size}>{r(4, 0, 4, 1, SK2)}{r(5, 1, 2, 1, ROPE)}{r(3, 2, 6, 1, SK)}{r(1, 3, 10, 7, SK)}{r(2, 10, 8, 1, SK2)}{r(2, 4, 2, 4, '#a87240')}{r(5, 5, 4, 3, G1)}{r(6, 6, 2, 1, G3)}{r(0, 6, 1, 3, SK2)}{r(11, 6, 1, 3, SK2)}</Px>;
}
function GoblinIcon({ size = 120 }: { size?: number }) {
  // Marcador del Coleccionista (duende): sprite definitivo pendiente
  return <Px size={size}>{r(3, 1, 6, 1, '#3f6b2a')}{r(1, 2, 2, 2, '#5d8f3c')}{r(9, 2, 2, 2, '#5d8f3c')}{r(3, 2, 6, 4, '#5d8f3c')}{r(4, 3, 1, 1, '#f2c75a')}{r(7, 3, 1, 1, '#f2c75a')}{r(5, 5, 2, 1, '#2b1d10')}{r(2, 6, 8, 4, '#6a3aa8')}{r(5, 7, 2, 2, G1)}{r(3, 10, 2, 2, '#3f2a17')}{r(7, 10, 2, 2, '#3f2a17')}</Px>;
}

/* ── Casillas ── */
type Cell = { kind: 'coins'; n: number } | { kind: 'pouch'; n: number } | { kind: 'sack'; n: number } | { kind: 'item'; id: string; q?: number } | null;
function Slot({ c, sel, span = 1, style }: { c: Cell; sel?: boolean; span?: 1 | 2; style?: CSSProperties }) {
  const big = span === 2;
  const sz = 'var(--slot)';
  const box: CSSProperties = big ? { gridColumn: 'span 2', gridRow: 'span 2', width: `calc(${sz} * 2 + 4px)`, height: `calc(${sz} * 2 + 4px)` } : {};
  const gold = c && c.kind !== 'item';
  return (
    <div className={`slot ${sel ? 'selected' : ''}`} style={{ ...box, ...(gold ? { borderColor: '#c48f22aa', boxShadow: 'inset 0 0 0 1px #07060a, inset 0 0 14px #f2c75a22' } : {}), ...style }}>
      {c?.kind === 'coins' && <CoinIcon n={c.n} />}
      {c?.kind === 'pouch' && <PouchIcon />}
      {c?.kind === 'sack' && <SackIcon size={80} />}
      {c?.kind === 'item' && <ItemIcon itemId={c.id} size={36} />}
      {c?.kind === 'coins' && <span className="qty">{c.n}</span>}
      {c?.kind === 'item' && (c.q ?? 1) > 1 && <span className="qty">{c.q}</span>}
      {(c?.kind === 'pouch' || c?.kind === 'sack') && <span className="qty" style={{ color: c.n ? '#f2c75a' : '#a8a29e', fontSize: big ? 13 : 10 }}>{c.n}/{c.kind === 'pouch' ? 50 : 250}</span>}
    </div>
  );
}
/** Rejilla con un saco de 2×2 en (col, fila). Las casillas que tapa el saco no se pintan. */
function Grid({ cols, rows, cells, sack, sel }: { cols: number; rows: number; cells: Record<number, Cell>; sack?: { col: number; row: number; n: number }; sel?: number }) {
  const out: ReactNode[] = [];
  for (let i = 0; i < cols * rows; i++) {
    const col = i % cols, row = Math.floor(i / cols);
    if (sack && col >= sack.col && col < sack.col + 2 && row >= sack.row && row < sack.row + 2) {
      if (col === sack.col && row === sack.row) out.push(<Slot key={i} c={{ kind: 'sack', n: sack.n }} span={2} style={{ gridColumnStart: col + 1, gridRowStart: row + 1 }} />);
      continue;
    }
    out.push(<Slot key={i} c={cells[i] ?? null} sel={sel === i} style={{ gridColumnStart: col + 1, gridRowStart: row + 1 }} />);
  }
  return <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, var(--slot))`, gridAutoRows: 'var(--slot)' }}>{out}</div>;
}

function eq(parts: Partial<Record<keyof Equipment, string>>): Equipment {
  const e = emptyEquipment();
  for (const [k, v] of Object.entries(parts)) (e as Record<string, ItemStack | null>)[k] = { uid: k, itemId: v!, qty: 1 };
  return e;
}
const HERO = eq({ mainHand: 'knight_sword', offHand: 'iron_shield', helmet: 'iron_helm', armor: 'chainmail' });
function Screen({ children }: { children: ReactNode }) {
  return <div className="h-full relative overflow-hidden flex flex-col" style={{ background: 'radial-gradient(ellipse at 50% 30%, #1a1520 0%, #0d0b11 55%, #07060a 100%)' }}>{children}</div>;
}
const TABS = [{ id: 'play', label: 'Jugar' }, { id: 'character', label: 'Personaje' }, { id: 'stash', label: 'Alijo' }, { id: 'merchants', label: 'Mercaderes' }, { id: 'quests', label: 'Misiones' }, { id: 'bestiary', label: 'Bestiario' }, { id: 'shop', label: 'Tienda' }];
function Nav({ tab = 'stash' }: { tab?: string }) {
  const layout = useLayout();
  return (
    <header className="ui-nav">
      <div className="flex items-center gap-2 min-w-0">
        <div className={`${layout === 'phone' ? 'w-8 h-8' : 'w-10 h-10'} flex items-end justify-center overflow-hidden bg-[#0d0c11] border-2 border-stone-700`}><HeroSprite classId="warrior" appearance={{ cloak: 0, skin: 1 }} equipment={HERO} scale={layout === 'phone' ? 1 : 2} animate={false} /></div>
        <div className={`${layout === 'phone' ? 'w-[74px]' : 'w-28'} leading-tight`}><div className="font-display text-sm truncate">Aldric <span className="text-gold">▾</span></div><div className="text-[11px] text-stone-300">Nv 34</div></div>
      </div>
      <PillBar tabs={TABS as never} active={tab as never} onChange={() => {}} />
      <div className="flex items-center justify-end gap-2" title="Oro de tu almacén (páginas propias)"><GoldAmount value={1248} className={layout === 'phone' ? 'text-sm' : 'text-lg'} /></div>
    </header>
  );
}

/* ── Alijo con oro físico ── */
const BAG: Record<number, Cell> = { 0: { kind: 'item', id: 'health_potion', q: 3 }, 1: { kind: 'coins', n: 10 }, 2: { kind: 'coins', n: 7 }, 3: { kind: 'pouch', n: 37 }, 4: { kind: 'pouch', n: 0 }, 6: { kind: 'item', id: 'iron_sword' }, 7: { kind: 'item', id: 'bone_amulet' }, 8: { kind: 'coins', n: 2 } };
const POCKET: Cell[] = [{ kind: 'pouch', n: 50 }, { kind: 'pouch', n: 50 }, { kind: 'item', id: 'iron_key' }];
const STASH: Record<number, Cell> = { 2: { kind: 'pouch', n: 50 }, 3: { kind: 'pouch', n: 50 }, 4: { kind: 'pouch', n: 22 }, 5: { kind: 'coins', n: 10 }, 6: { kind: 'coins', n: 4 }, 7: { kind: 'item', id: 'knight_helm' }, 18: { kind: 'item', id: 'chainmail' }, 19: { kind: 'item', id: 'battle_axe' }, 20: { kind: 'item', id: 'health_potion', q: 6 }, 21: { kind: 'item', id: 'ring_of_embers' }, 22: { kind: 'item', id: 'leather_gloves' }, 23: { kind: 'item', id: 'frost_staff' } };
function GoldLine({ label, value, note, color = '#f2c75a' }: { label: string; value: number; note?: string; color?: string }) {
  return <div className="flex items-center justify-between text-xs gap-2"><span className="text-stone-300">{label}</span><span className="flex items-center gap-1"><span style={{ color }} className="font-display">{value}</span>{note && <span className="text-stone-400">{note}</span>}</span></div>;
}
function Backpack({ cols = 6, sel }: { cols?: number; sel?: number }) {
  return (
    <div>
      <SubHead right={<span className="flex gap-1"><button className="btn text-xs" style={{ minHeight: 34 }}>Agrupar oro</button><button className="btn text-xs" style={{ minHeight: 34 }}>Ordenar</button></span>}>Mochila · 8/24</SubHead>
      <Grid cols={cols} rows={4} cells={BAG} sel={sel} />
      <div className="mt-1.5"><GoldLine label="Oro encima (se pierde si mueres)" value={56} color="#e8a33a" /></div>
    </div>
  );
}
function Pocket({ hi = false }: { hi?: boolean }) {
  return (
    <div className="mt-3" style={hi ? { outline: '2px solid #5fb37a', outlineOffset: 4 } : undefined}>
      <SubHead right={<span className="text-[11px] text-heal">no se pierde al morir</span>}>Bolsillo seguro · 3/3</SubHead>
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(3, var(--slot))' }}>{POCKET.map((c, i) => <Slot key={i} c={c} />)}</div>
      <div className="mt-1.5"><GoldLine label="Oro a salvo" value={100} note="de 150 como máximo" color="#5fb37a" /></div>
      {hi && <p className="text-[11px] text-stone-400 mt-1 max-w-[240px]">Solo monedas sueltas o saquitos (máx. 50 por casilla). El saco grande no cabe.</p>}
    </div>
  );
}
function StashPanel({ cols }: { cols: number }) {
  const layout = useLayout();
  const t = layout !== 'desktop';
  return (
    <section className="panel ui-panel min-h-0">
      <div className="flex items-center justify-between gap-2" style={{ padding: t ? '6px 8px 0' : '10px 12px 0' }}>
        <h2 className="font-display text-parchment uppercase tracking-[0.1em]" style={{ fontSize: 'var(--fs-title, 15px)' }}>Almacén <span className="normal-case tracking-normal text-xs font-body text-stone-400">· pág. 1 · 16/120</span></h2>
        <span className="flex gap-1"><button className="btn text-xs" style={{ minHeight: t ? 44 : 34 }}>Agrupar oro</button><button className="btn text-xs" style={{ minHeight: t ? 44 : 34 }}>Ordenar</button></span>
      </div>
      <div style={{ padding: t ? '6px 8px' : '8px 12px' }} className="border-b border-[#2a2830]">
        <div className="flex items-center w-full" style={{ gap: t ? 2 : 4 }}>
          {[1, 2].map((n) => <button key={n} className={`pill ${n === 1 ? 'on' : ''}`} style={{ flex: '1 1 0', minWidth: 44, minHeight: 44, padding: 0 }}>{n}</button>)}
          {[3, 4, 5].map((n) => <button key={n} className="pill" style={{ flex: '1 1 0', minWidth: 44, minHeight: 44, padding: 0, opacity: 0.5 }}>🔒</button>)}
          <button className="pill" style={{ flex: t ? '1 1 0' : '2.4 1 0', minWidth: 44, minHeight: 44, borderColor: '#3f8f8a', color: '#7fd6c9', background: 'rgba(63,143,138,.15)' }}>{t ? '⇄' : 'Compartido'}</button>
        </div>
        <div className="mt-1.5"><GoldLine label="Oro en esta página" value={1048} note="· en todo tu almacén: 1.248" /></div>
      </div>
      <div className="ui-pbody min-h-0 overflow-y-auto scroll-thin"><Grid cols={cols} rows={15} cells={STASH} sack={{ col: 0, row: 0, n: 250 }} /></div>
    </section>
  );
}
function Alijo({ modal, pocketHi = false }: { modal?: ReactNode; pocketHi?: boolean }) {
  const layout = useLayout();
  const phone = layout === 'phone';
  return (
    <Screen>
      <Nav />
      {phone ? (
        <div className="flex-1 min-h-0 flex flex-col items-center" style={{ padding: '0 var(--pad) var(--pad)', gap: 'var(--gap)' }}>
          <div className="ui-seg"><button>Equipo</button><button className="on">Almacén</button></div>
          <div className="flex-1 min-h-0 w-full flex justify-center" style={{ gap: 'var(--gap)' }}>
            <Panel className="min-h-0" bodyClassName="overflow-y-auto scroll-thin"><Backpack sel={3} /><Pocket hi={pocketHi} /></Panel>
            <StashPanel cols={8} />
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 grid" style={{ gridTemplateColumns: `${layout === 'tablet' ? 220 : 340}px minmax(0,1fr) auto`, gap: 'var(--gap)', padding: '0 var(--pad) var(--pad)' }}>
          <Panel title="Aventurero" className="min-h-0" bodyClassName="flex flex-col items-center">
            <div className="ui-arch w-full flex items-end justify-center" style={{ height: 26 * (layout === 'tablet' ? 4 : 6) + 40 }}><div className="pb-3"><HeroSprite classId="warrior" appearance={{ cloak: 0, skin: 1 }} equipment={HERO} scale={layout === 'tablet' ? 4 : 6} animate={false} /></div></div>
            <div className="text-center font-display text-gold mt-3">◆ Guerrero ◆</div>
          </Panel>
          <Panel title="Equipo" className="min-h-0" bodyClassName="overflow-y-auto scroll-thin">
            <div className="w-fit mx-auto">
              <p className="text-xs text-stone-400 text-center mb-3">(Equipo puesto, sin cambios)</p>
              <Backpack sel={3} />
              <Pocket hi={pocketHi} />
              <div className="panel p-3 mt-3 text-sm" style={{ maxWidth: 360 }}>
                <div className="flex items-center gap-2"><PouchIcon /><div><div className="font-display">Saquito de oro · 37/50</div><div className="text-xs text-stone-300">1 casilla. Suelta monedas encima para meterlas.</div></div></div>
                <div className="flex gap-2 mt-2 flex-wrap"><button className="btn btn-gold text-sm" style={{ minHeight: 44 }}>Sacar monedas</button><button className="btn text-sm" style={{ minHeight: 44 }}>Al almacén</button><button className="btn text-sm" style={{ minHeight: 44 }}>Al bolsillo seguro</button></div>
              </div>
            </div>
          </Panel>
          <StashPanel cols={8} />
        </div>
      )}
      {modal}
    </Screen>
  );
}

/* ── Sacar monedas / dividir: selector cómodo con el dedo ── */
function AmountModal({ title, from, max, label }: { title: string; from: ReactNode; max: number; label: string }) {
  const [n, setN] = useState(Math.min(25, max));
  const step = (d: number) => setN(Math.max(1, Math.min(max, n + d)));
  const b = (t: string, d: number) => <button className="btn text-lg" style={{ minWidth: 56, minHeight: 52 }} onClick={() => step(d)}>{t}</button>;
  return (
    <Modal>
      <h2 className="panel-title text-lg mb-2">{title}</h2>
      <div className="flex items-center gap-3">{from}</div>
      <div className="flex items-center justify-center gap-2 mt-4">
        {b('−10', -10)}{b('−1', -1)}
        <div className="panel flex items-center justify-center font-display text-3xl text-gold" style={{ minWidth: 96, minHeight: 56 }}>{n}</div>
        {b('+1', 1)}{b('+10', 10)}
      </div>
      <input type="range" min={1} max={max} value={n} onChange={(e) => setN(+e.target.value)} className="w-full mt-4 accent-[#e8b33a]" style={{ height: 32 }} />
      <div className="flex gap-2 mt-2 justify-center flex-wrap">{[10, 25, 50].filter((x) => x <= max).map((x) => <button key={x} className="btn text-sm" style={{ minHeight: 44 }} onClick={() => setN(x)}>{x}</button>)}<button className="btn text-sm" style={{ minHeight: 44 }} onClick={() => setN(max)}>Todo ({max})</button></div>
      <p className="text-xs text-stone-400 mt-3 text-center">{label}</p>
      <div className="flex gap-2 mt-4 justify-center"><button className="btn btn-gold" style={{ minHeight: 44 }}>{title.startsWith('Sacar') ? `Sacar ${n}` : `Separar ${n}`}</button><button className="btn" style={{ minHeight: 44 }}>Cancelar</button></div>
    </Modal>
  );
}

/* ── Botín en un saco en el suelo ── */
function Botin() {
  const layout = useLayout();
  const loot: Cell[] = [{ kind: 'coins', n: 10 }, { kind: 'coins', n: 4 }, { kind: 'item', id: 'bone_dust', q: 2 }, { kind: 'item', id: 'iron_helm' }, { kind: 'item', id: 'health_potion' }, null, null, null, null, null, null, null];
  const bag: Record<number, Cell> = { 0: { kind: 'item', id: 'health_potion', q: 2 }, 1: { kind: 'pouch', n: 37 }, 2: { kind: 'item', id: 'iron_sword' }, 3: { kind: 'item', id: 'copper_ring' }, 4: { kind: 'coins', n: 10 }, 5: { kind: 'coins', n: 10 }, 6: { kind: 'item', id: 'leather_gloves' }, 7: { kind: 'item', id: 'bone_amulet' }, 8: { kind: 'item', id: 'worn_boots' } };
  return (
    <Screen>
      <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(0deg,#141118 0 32px,#17131c 32px 64px)', opacity: 0.9 }} />
      <div className="absolute" style={{ left: '30%', top: '45%' }}><SackIcon size={48} /></div>
      <div className="relative m-auto panel panel-gold flex" style={{ padding: 'var(--gap)', gap: 'calc(var(--gap) * 1.5)', flexDirection: layout === 'phone' ? 'row' : 'row', maxHeight: '96%' }}>
        <div>
          <h2 className="panel-title text-lg mb-1">Saco del Esqueleto</h2>
          <p className="text-xs text-stone-300 mb-2">Lo que soltó al caer. Coge lo que quieras: el resto se queda en el suelo.</p>
          <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(4, var(--slot))' }}>{loot.map((c, i) => <Slot key={i} c={c} />)}</div>
          <div className="mt-2"><GoldLine label="Oro en el saco" value={14} /></div>
          <div className="flex gap-2 mt-3 flex-wrap"><button className="btn btn-gold" style={{ minHeight: 44 }}>Cogerlo todo</button><button className="btn" style={{ minHeight: 44 }}>Coger el oro</button><button className="btn" style={{ minHeight: 44 }}>Cerrar</button></div>
        </div>
        <div>
          <SubHead>Mochila · 9/24</SubHead>
          <Grid cols={6} rows={4} cells={bag} />
          <div className="mt-1.5"><GoldLine label="Oro encima" value={57} color="#e8a33a" /></div>
          <p className="text-[11px] text-stone-400 mt-2 max-w-[300px]">Las monedas entran primero en tus saquitos con hueco y luego sueltas, de 10 en 10.</p>
        </div>
      </div>
    </Screen>
  );
}

/* ── El Coleccionista (duende): vende sacos y mochilas, compra joyas ── */
function Coleccionista() {
  const layout = useLayout();
  const phone = layout === 'phone';
  const row = (icon: ReactNode, name: string, desc: string, price: number, can = true) => (
    <div className="panel flex items-center gap-3" style={{ padding: phone ? 6 : 10 }}>
      <div className="slot shrink-0">{icon}</div>
      <div className="flex-1 min-w-0 leading-tight"><div className="font-display text-sm">{name}</div><div className="text-[11px] text-stone-300">{desc}</div></div>
      <div className="flex flex-col items-end gap-1"><GoldAmount value={price} />
        <button className={`btn text-xs ${can ? 'btn-gold' : ''}`} style={{ minHeight: 44 }} disabled={!can}>{can ? 'Comprar' : 'Oro insuficiente'}</button></div>
    </div>
  );
  return (
    <Screen>
      <Nav tab="merchants" />
      <div className="flex-1 min-h-0 grid" style={{ gridTemplateColumns: phone ? '160px minmax(0,1fr)' : `${layout === 'tablet' ? 240 : 320}px minmax(0,1fr)`, gap: 'var(--gap)', padding: '0 var(--pad) var(--pad)' }}>
        <Panel title={phone ? undefined : 'El Coleccionista'} className="min-h-0" bodyClassName="flex flex-col items-center text-center">
          <div className="ui-arch w-full flex items-end justify-center" style={{ height: phone ? 110 : 190 }}><GoblinIcon size={phone ? 84 : 144} /></div>
          {phone && <div className="font-display text-gold mt-1 text-sm">El Coleccionista</div>}
          {!phone && <p className="font-body italic text-stone-300 mt-3">«¿Brilla? Entonces lo quiero. ¿No brilla? Entonces véndeme algo que brille.»</p>}
          <p className="text-[11px] text-stone-400 mt-2">Duende prestamista del Bastión. Te vende sacos y mochilas y te compra joyas a buen precio.</p>
          <div className="ui-seg mt-3" style={{ width: '100%' }}><button className="on">Comprar</button><button>Vender joyas</button></div>
        </Panel>
        <Panel title="Sacos y mochilas" className="min-h-0" bodyClassName="overflow-y-auto scroll-thin">
          <div className="grid gap-2" style={{ gridTemplateColumns: phone ? '1fr' : 'repeat(2, minmax(0, 1fr))' }}>
            {row(<PouchIcon />, 'Saquito de oro', '1 casilla · guarda 50 monedas · cabe en el bolsillo seguro', 5)}
            {row(<SackIcon size={40} />, 'Saco de oro', '4 casillas (2×2) · guarda 250 monedas · no cabe en el bolsillo', 25)}
            {row(<ItemIcon itemId="padded_tunic" size={36} />, 'Mochila reforzada', 'Tu mochila pasa a 30 casillas (6×5). Es para siempre.', 150)}
            {row(<ItemIcon itemId="padded_tunic" size={36} />, 'Mochila de explorador', 'Tu mochila pasa a 36 casillas (6×6). Necesita la reforzada.', 600, false)}
          </div>
          <p className="text-xs text-stone-400 mt-3">Pagas con el oro de tus páginas del almacén (no con el de «Compartido»): primero las monedas sueltas y luego los sacos. El cambio vuelve a tu almacén.</p>
        </Panel>
      </div>
    </Screen>
  );
}

function VentaLlena() {
  return (
    <Alijo modal={
      <Modal>
        <h2 className="panel-title text-lg mb-2">No hay sitio para el oro</h2>
        <p className="font-body text-lg">Vender la <b>Hoja del Pavor</b> te da <b className="text-gold">17 monedas</b>, pero tus páginas del almacén no tienen casillas libres ni sacos con hueco.</p>
        <ul className="font-body text-base text-stone-200 list-disc pl-6 mt-2 space-y-1"><li>Pulsa <b>Agrupar oro</b> para juntar las monedas sueltas en tus sacos.</li><li>Compra un saquito al Coleccionista o una página del almacén.</li><li>O libera alguna casilla.</li></ul>
        <div className="flex gap-2 mt-4 flex-wrap"><button className="btn btn-gold" style={{ minHeight: 44 }}>Agrupar oro y vender</button><button className="btn" style={{ minHeight: 44 }}>Cancelar</button></div>
      </Modal>
    } />
  );
}

function App() {
  const map: Record<string, ReactNode> = {
    alijo: <Alijo />,
    bolsillo: <Alijo pocketHi />,
    sacar: <Alijo modal={<AmountModal title="Sacar monedas" from={<><PouchIcon /><span className="font-body text-lg">Saquito de oro · <b className="text-gold">37</b>/50</span></>} max={37} label="Las monedas que saques irán a la primera casilla libre de la mochila (de 10 en 10)." />} />,
    dividir: <Alijo modal={<AmountModal title="Dividir montón" from={<><CoinIcon n={7} /><span className="font-body text-lg">Monedas de oro · <b className="text-gold">7</b></span></>} max={6} label="Las que separes irán a una casilla libre al lado." />} />,
    botin: <Botin />, coleccionista: <Coleccionista />, 'venta-llena': <VentaLlena />,
  };
  return <div style={{ height: '100dvh' }}>{map[V] ?? map.alijo}</div>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
