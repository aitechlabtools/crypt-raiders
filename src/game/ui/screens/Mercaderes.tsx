// Mercaderes (opción D). Fuera: una tarjeta por mercader con su retrato, rango, barra de reputación, misiones listas y
// servicios. Al hablar: tres zonas: el mercader y sus servicios · el servicio elegido · tu mochila, tus materiales o la
// ficha del objeto que vas a vender. La forja (Maese Brand) y los contratos (Garra Roja) viven dentro de su mercader.
// En móvil, la tercera zona va en un cajón por la derecha.
import { StashPanel } from '../StashPanel';
import { useEffect, useState, type ReactNode } from 'react';
import { actions, useGame } from '../../state/store';
import { VENDORS, VENDOR_ORDER, type VendorId } from '../../../core/data/vendors';
import { REP_RANKS, rankOf } from '../../../config/reputation';
import { readyQuestCount } from '../../../core/quests';
import { getItem } from '../../../core/data/items';
import { owned } from '../../../core/forge';
import type { Loc } from '../../../core/inventory';
import { MonsterSprite, GoldAmount } from '../common';
import { GridView, ItemIcon } from '../inventory';
import { RepBar, ShopStock, VendorQuests, type VendorTarget, type VendorView } from '../VendorsTab';
import { ForgePanel } from '../ForgePanel';
import { ContractsPanel } from '../ContractsPanel';
import { ItemCard } from './ItemCard';
import { Card, Drawer, Panel, SubHead, usePixelScale } from '../kit';
import { useLayout } from '../../../config/ui';
import { sfx } from '../../audio';

const VIEW_LABEL: Record<VendorView, string> = { shop: 'Tienda', quests: 'Misiones', sell: 'Vender', forge: 'Forja', contracts: 'Contratos' };

function servicesOf(id: VendorId): VendorView[] {
  const v: VendorView[] = id === 'coleccionista' ? ['shop'] : ['shop', 'quests'];
  if (VENDORS[id].buysItems) v.push('sell');
  if (id === 'garra') v.push('contracts');
  if (id === 'brand') v.push('forge');
  return v;
}
/** El servicio propio de cada mercader (se resalta en su tarjeta). */
const SPECIAL: Partial<Record<VendorId, VendorView>> = { garra: 'contracts', brand: 'forge', orvel: 'sell', coleccionista: 'shop' };

export function Mercaderes({ target, onConsumed }: { target: VendorTarget | null; onConsumed: () => void }) {
  const [open, setOpen] = useState<VendorTarget | null>(target);
  useEffect(() => { if (target) { setOpen(target); onConsumed(); } }, [target]); // eslint-disable-line react-hooks/exhaustive-deps
  return open
    ? <VendorInterior vendor={open.vendor} initial={open.view} onBack={() => { setOpen(null); sfx('click'); }} />
    : <VendorCards onTalk={(vendor) => { setOpen({ vendor, view: 'shop' }); sfx('click'); }} />;
}

function VendorCards({ onTalk }: { onTalk: (v: VendorId) => void }) {
  const profile = useGame((s) => s.profile)!;
  const scale = usePixelScale('vendor');
  return (
    <div className="h-full overflow-y-auto scroll-thin" style={{ padding: '0 max(var(--pad), env(safe-area-inset-right)) var(--pad) max(var(--pad), env(safe-area-inset-left))' }} data-testid="screen-merchants">
      <div className="min-h-full flex flex-col items-center justify-center">
      <h2 className="ui-ptitle border-0 !text-[clamp(14px,1.8vw,26px)] !tracking-[0.18em]">Mercaderes del campamento</h2>
      <div className="grid w-full max-w-[1200px]" style={{ gridTemplateColumns: `repeat(${VENDOR_ORDER.length}, minmax(0,1fr))`, gap: 'var(--gap)' }} data-testid="vendor-list">
        {VENDOR_ORDER.map((id) => {
          const v = VENDORS[id];
          const rep = profile.reputation[id] ?? 0;
          const ready = readyQuestCount(profile, id);
          const special = SPECIAL[id];
          return (
            <Card key={id} title={v.name} badge={ready} testId={`vendor-card-${id}`}
              art={<div className="pb-2 pt-4"><MonsterSprite sprite={v.sprite} scale={scale} /></div>}>
              <div className="text-center text-[12px]" style={{ color: v.color }}>{v.role}</div>
              <RepBar rep={rep} />
              <div className="flex flex-wrap justify-center gap-1">
                {servicesOf(id).map((s) => <span key={s} className={`ui-tag ${s === special ? 'on' : ''}`}>{VIEW_LABEL[s]}</span>)}
              </div>
              <button className="btn w-full mt-auto font-display tracking-[0.12em] uppercase" style={{ minHeight: 'var(--btn-h)' }}
                onClick={() => onTalk(id)} data-testid={`vendor-${id}`}>Hablar</button>
            </Card>
          );
        })}
      </div>
      </div>
    </div>
  );
}

function VendorInterior({ vendor, initial, onBack }: { vendor: VendorId; initial: VendorView; onBack: () => void }) {
  const profile = useGame((s) => s.profile)!;
  const layout = useLayout();
  const phone = layout === 'phone';
  const scale = usePixelScale('vendor');
  const [view, setView] = useState<VendorView>(initial);
  const [sel, setSel] = useState<Loc | null>(null);
  const v = VENDORS[vendor];
  const rep = profile.reputation[vendor] ?? 0;
  const rank = rankOf(rep);
  const discount = REP_RANKS[rank].discount;
  const go = (x: VendorView) => { setView(x); setSel(null); sfx('click'); };
  // Quién compra al vender (el Coleccionista solo joyas y tesoros, y paga mejor)
  useEffect(() => { actions.setActiveVendor(vendor); return () => actions.setActiveVendor(null); }, [vendor]);

  const title = view === 'forge' ? `Forja de ${v.name}` : view === 'contracts' ? 'Contratos de Garra Roja' : view === 'sell' ? `Vender a ${v.name}` : view === 'quests' ? `Encargos de ${v.name}` : `Tienda de ${v.name}`;
  const center: ReactNode =
    view === 'shop' ? <ShopStock vid={vendor} cols={`grid gap-2 ${phone ? 'grid-cols-1' : 'grid-cols-2 2xl:grid-cols-3'}`} />
      : view === 'quests' ? <VendorQuests vendor={vendor} />
        : view === 'forge' ? <ForgePanel />
          : view === 'contracts' ? <ContractsPanel />
            : <SellGrids sel={sel} setSel={setSel} />;
  const side: ReactNode = view === 'sell'
    ? <Panel title="Ficha" className="min-h-0 h-full" bodyClassName="overflow-y-auto scroll-thin"><ItemCard loc={sel} mode="merchant" onClear={() => setSel(null)} /></Panel>
    : view === 'forge'
      ? <Panel title="Tus materiales" className="min-h-0 h-full" bodyClassName="overflow-y-auto scroll-thin flex flex-col"><Materials /></Panel>
      : <Panel title="Tu mochila" className="min-h-0 h-full" bodyClassName="overflow-y-auto scroll-thin flex flex-col"><BagSummary /></Panel>;

  const left = (
    <Panel className="min-h-0" bodyClassName="overflow-y-auto scroll-thin flex flex-col" testId="vendor-panel">
      <div className="ui-arch shrink-0" style={{ height: 26 * (phone ? 2 : scale) + (phone ? 14 : 30) }}><div className="pb-1"><MonsterSprite sprite={v.sprite} scale={phone ? 2 : scale} /></div></div>
      <div className="text-center font-display text-parchment mt-2" data-testid="vendor-name">{v.name}</div>
      <div className="text-center text-[12px]" style={{ color: v.color }}>{v.role}</div>
      {!phone && <p className="font-body italic text-stone-300 text-center text-[15px] leading-snug mt-2">«{v.blurb}»</p>}
      <div className="mt-2"><RepBar rep={rep} /></div>
      {discount > 0 && <div className="text-[11px] text-heal mt-0.5">{Math.round(discount * 100)} % de descuento por tu reputación</div>}
      <div className="flex flex-col gap-2 mt-3">
        {servicesOf(vendor).map((s) => (
          <button key={s} className={`btn font-display tracking-[0.1em] uppercase ${view === s ? 'btn-gold' : ''}`} style={{ minHeight: 'var(--btn-h)' }} onClick={() => go(s)} data-testid={`vendor-view-${s}`}>{VIEW_LABEL[s]}</button>
        ))}
        <button className="btn font-display tracking-[0.1em] uppercase" style={{ minHeight: 'var(--btn-h)' }} onClick={onBack} data-testid="vendor-back">◂ Volver</button>
      </div>
    </Panel>
  );
  const main = <Panel title={title} className="min-h-0" bodyClassName="overflow-y-auto scroll-thin" testId={`vendor-main-${view}`}>{center}</Panel>;
  const pad = { padding: '0 max(var(--pad), env(safe-area-inset-right)) var(--pad) max(var(--pad), env(safe-area-inset-left))', gap: 'var(--gap)' } as const;

  if (phone) {
    return (
      <div className="h-full grid relative" style={{ ...pad, gridTemplateColumns: '170px minmax(0,1fr)', paddingRight: 'calc(max(var(--pad), env(safe-area-inset-right)) + 40px)' }} data-testid="vendor-interior">
        {left}{main}
        <Drawer label={view === 'forge' ? 'Materiales' : view === 'sell' ? 'Ficha' : 'Mochila'} side="right" testId="vendor-side">{side}</Drawer>
      </div>
    );
  }
  const sideW = layout === 'tablet' ? 260 : 320;
  return (
    <div className="h-full grid" style={{ ...pad, gridTemplateColumns: `${layout === 'tablet' ? 220 : 300}px minmax(0,1fr) ${sideW}px` }} data-testid="vendor-interior">
      {left}{main}<div className="min-h-0">{side}</div>
    </div>
  );
}

/** Vender: la mochila y el almacén; al elegir un objeto, su ficha (a la derecha) muestra el precio y «Vender». */
function SellGrids({ sel, setSel }: { sel: Loc | null; setSel: (l: Loc | null) => void }) {
  const profile = useGame((s) => s.profile)!;
  const quick = (l: Loc) => { if (l.kind === 'grid' && (l.container === 'backpack' || l.container === 'stash')) actions.sell(l.container, l.index); };
  const pick = (l: Loc) => setSel(sel && JSON.stringify(sel) === JSON.stringify(l) ? null : l);
  return (
    <div className="flex flex-wrap" style={{ gap: 'calc(var(--gap) * 2)' }} data-testid="sell-grids">
      <div><SubHead>Mochila</SubHead><GridView grid={profile.backpack} container="backpack" cols={6} equipment={profile.equipment} mode="merchant" selected={sel} onSelect={pick} onQuick={quick} onAlt={quick} /></div>
      <div className="flex flex-col" style={{ height: 'min(62vh, 560px)', minHeight: 300 }}>
        <StashPanel cols={8} mode="merchant" sel={sel} onSelect={pick} onQuick={quick} onAlt={quick} testId="sell-stash" />
      </div>
      <p className="font-body text-sm text-stone-400 italic w-full">Elige un objeto para ver cuánto te da. Doble clic: vender al momento.</p>
    </div>
  );
}

function BagSummary() {
  const profile = useGame((s) => s.profile)!;
  return (
    <>
      <GridView grid={profile.backpack} container="backpack" cols={4} equipment={profile.equipment} mode="lobby" />
      <div className="flex-1" />
      <div className="panel p-3 mt-3 flex justify-between items-center"><span className="text-stone-300 text-sm">Oro</span><GoldAmount value={profile.gold} /></div>
    </>
  );
}

/** Materiales de la mochila y el almacén (los que pide la forja). */
function Materials() {
  const profile = useGame((s) => s.profile)!;
  const ids = [...new Set([...profile.backpack, ...profile.stash].filter((x): x is NonNullable<typeof x> => !!x).map((x) => x.itemId).filter((id) => getItem(id).category === 'material'))];
  return (
    <>
      {ids.length ? (
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(4, var(--slot))' }} data-testid="forge-materials">
          {ids.map((id) => <div key={id} className="slot" title={getItem(id).name}><ItemIcon itemId={id} /><span className="qty">{owned(profile, id)}</span></div>)}
        </div>
      ) : <p className="font-body text-stone-400 italic">Aún no tienes materiales. Pica vetas en las mazmorras.</p>}
      <p className="text-[11px] text-stone-400 mt-2">De la mochila y del almacén.</p>
      <div className="flex-1" />
      <div className="panel p-3 mt-3 flex justify-between items-center"><span className="text-stone-300 text-sm">Oro</span><GoldAmount value={profile.gold} /></div>
    </>
  );
}
