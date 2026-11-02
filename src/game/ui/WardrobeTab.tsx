// Vestuario (aspectos desbloqueados) y Tienda (maqueta «Próximamente», sin pagos).
import { useGame, actions } from '../state/store';
import { COSMETICS, COSMETIC_ORDER, type CosmeticDef, type CosmeticSlot } from '../../core/data/cosmetics';
import { dressed, fits } from '../../core/cosmetics';
import { RARITY_INFO } from '../../core/data/items';
import { heroUrl } from '../../shared/art';
import type { Equipment } from '../../core/types';
import { HeroSprite } from './common';

const SLOTS: { slot: CosmeticSlot; label: string }[] = [
  { slot: 'mainHand', label: 'Arma' }, { slot: 'offHand', label: 'Secundaria' }, { slot: 'helmet', label: 'Cabeza' },
  { slot: 'armor', label: 'Torso' }, { slot: 'gloves', label: 'Manos' }, { slot: 'boots', label: 'Pies' },
];
const FAMILY: Record<string, string> = { sword: 'una espada', axe: 'un hacha', dagger: 'una daga', staff: 'un báculo', mace: 'una maza', shield: 'un escudo', tome: 'un grimorio' };

/** El héroe con un aspecto puesto (aunque no encaje con lo que llevas), para enseñarlo. */
function preview(eq: Equipment, cos: CosmeticDef): Equipment {
  return { ...eq, [cos.slot]: { uid: `pv-${cos.id}`, itemId: cos.id, qty: 1 } };
}

export function WardrobeTab() {
  const profile = useGame((s) => s.profile)!;
  const ch = profile.character;
  const eq = dressed(profile.equipment, profile.wardrobe);
  const total = COSMETIC_ORDER.filter((id) => COSMETICS[id].source !== 'shop').length;
  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-4 max-w-6xl" data-testid="wardrobe">
      <section className="panel p-4 flex flex-col items-center gap-2 lg:sticky lg:top-0 self-start">
        <h2 className="panel-title text-sm self-stretch">Vestuario</h2>
        <div className="h-52 flex items-end"><HeroSprite classId={ch.classId} appearance={ch.appearance} equipment={eq} scale={8} /></div>
        <p className="font-body text-base text-stone-300 text-center leading-snug">Los aspectos <b className="text-parchment">solo cambian cómo se ve</b> lo que llevas puesto. Tus estadísticas no cambian nunca.</p>
        <div className="text-xs text-stone-400">Desbloqueados: <span className="text-gold" data-testid="cosmetics-count">{profile.cosmetics.length}</span>/{total}</div>
      </section>
      <div className="space-y-3">
        {SLOTS.map(({ slot, label }) => {
          const list = COSMETIC_ORDER.map((id) => COSMETICS[id]).filter((c) => c.slot === slot && c.source !== 'shop');
          const current = profile.wardrobe[slot];
          const base = profile.equipment[slot];
          return (
            <section key={slot} className="panel p-3" data-testid={`wardrobe-${slot}`}>
              <div className="flex items-baseline justify-between gap-2 mb-2">
                <h3 className="panel-title text-sm">{label}</h3>
                {!base && <span className="text-xs text-stone-500">No llevas nada en esta ranura: equípate algo para ver el aspecto.</span>}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-6 gap-2">
                <button className={`bg-black/30 border p-1.5 flex flex-col items-center text-center ${!current ? 'border-gold pulse-gold' : 'border-stone-800 hover:brightness-125'}`} onClick={() => actions.wearCosmetic(slot, null)} data-testid={`wear-${slot}-none`}>
                  <img src={heroUrl(ch.classId, ch.appearance, 2, 0, 'idle', { ...eq, [slot]: profile.equipment[slot] })} className="pixelated h-14" alt="" draggable={false} />
                  <span className="text-[11px] mt-1 leading-tight">Original</span>
                </button>
                {list.map((c) => {
                  const own = profile.cosmetics.includes(c.id);
                  const ok = own && fits(c, profile.equipment);
                  const on = current === c.id;
                  return (
                    <button key={c.id} disabled={!own} onClick={() => actions.wearCosmetic(slot, on ? null : c.id)} data-testid={`wear-${c.id}`}
                      title={own ? c.name : c.how}
                      className={`bg-black/30 border p-1.5 flex flex-col items-center text-center ${on ? 'border-gold pulse-gold' : 'border-stone-800'} ${own ? 'hover:brightness-125' : 'cursor-default'}`}>
                      <img src={heroUrl(ch.classId, ch.appearance, 2, 0, 'idle', preview(eq, c))} className={`pixelated h-14 ${own ? '' : 'brightness-0 opacity-50'}`} alt="" draggable={false} />
                      <span className="text-[11px] mt-1 leading-tight" style={{ color: own ? RARITY_INFO[c.rarity].color : undefined }}>{own ? c.name : '🔒 ' + c.name}</span>
                      {!own && <span className="text-[10px] text-stone-500 leading-tight mt-0.5">{c.how}</span>}
                      {own && !ok && c.family && <span className="text-[10px] text-ember leading-tight mt-0.5">Solo sobre {FAMILY[c.family]}</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export function ShopTab() {
  const profile = useGame((s) => s.profile)!;
  const ch = profile.character;
  const eq = dressed(profile.equipment, profile.wardrobe);
  const items = COSMETIC_ORDER.map((id) => COSMETICS[id]).filter((c) => c.source === 'shop');
  return (
    <div className="space-y-4 max-w-6xl" data-testid="shop">
      <section className="panel panel-gold p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[16rem]">
          <h2 className="font-display text-2xl text-parchment">Tienda de aspectos <span className="text-sm align-middle bg-arcane/20 border border-arcane text-arcane px-2 py-0.5 ml-1">Próximamente</span></h2>
          <p className="font-body text-lg text-stone-300 leading-snug mt-1">Aspectos especiales para tu equipo. Como todos los aspectos, <b className="text-parchment">no dan ninguna ventaja</b>: solo cambian cómo se ve.</p>
          <p className="text-sm text-stone-400 mt-1" data-testid="shop-closed">La tienda aún no está abierta: no se puede comprar nada ni se pide ningún pago.</p>
        </div>
      </section>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {items.map((c) => (
          <div key={c.id} className="panel p-3 flex flex-col items-center text-center gap-1" data-testid={`shop-${c.id}`}>
            <div className="h-28 flex items-end"><img src={heroUrl(ch.classId, ch.appearance, 4, 0, 'idle', preview(eq, c))} className="pixelated h-full" alt="" draggable={false} /></div>
            <div className="text-sm leading-tight" style={{ color: RARITY_INFO[c.rarity].color }}>{c.name}</div>
            <div className="text-[11px] text-stone-400">{RARITY_INFO[c.rarity].name}{c.family ? ` · para ${FAMILY[c.family]}` : ''}</div>
            <button className="btn w-full mt-auto text-sm py-2" disabled data-testid={`shop-buy-${c.id}`}>Próximamente</button>
          </div>
        ))}
      </div>
    </div>
  );
}
