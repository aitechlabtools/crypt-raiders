// Vendedores del refugio: tienda con precios según tu reputación, sus misiones y (con Orvel) la venta.
import { useState } from 'react';
import { actions, useGame } from '../state/store';
import { VENDORS, VENDOR_ORDER, type VendorId } from '../../core/data/vendors';
import { getItem, RARITY_INFO } from '../../core/data/items';
import { buyPrice } from '../../core/economy';
import { REP_RANKS, rankOf } from '../../config/reputation';
import { offeredQuests, questDef, questProgress } from '../../core/quests';
import { monsterUrl } from '../../shared/art';
import { Bar, ItemIcon } from './inventory';
import { GoldAmount } from './common';
import type { ReactNode } from 'react';
import { ForgePanel } from './ForgePanel';
import { COSMETICS, QUEST_COSMETICS } from '../../core/data/cosmetics';
import { ContractsPanel } from './ContractsPanel';

export function RepBar({ rep }: { rep: number }) {
  const r = rankOf(rep);
  const next = REP_RANKS[r + 1];
  const base = REP_RANKS[r].rep;
  return (
    <div>
      <div className="flex justify-between text-[11px]"><span className="text-gold">{REP_RANKS[r].name}</span><span className="text-stone-400">{next ? `${rep - base}/${next.rep - base}` : 'Máximo'}</span></div>
      <Bar value={next ? rep - base : 1} max={next ? next.rep - base : 1} color="#e8b33a" />
    </div>
  );
}

export function VendorsTab({ sellPanel }: { sellPanel: ReactNode }) {
  const profile = useGame((s) => s.profile)!;
  const [vid, setVid] = useState<VendorId>('orvel');
  const [view, setView] = useState<'shop' | 'quests' | 'sell' | 'forge' | 'contracts'>('shop');
  const v = VENDORS[vid];
  const rep = profile.reputation[vid] ?? 0;
  const rank = rankOf(rep);
  const ch = profile.character;
  return (
    <div className="space-y-4 max-w-6xl">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2" data-testid="vendor-list">
        {VENDOR_ORDER.map((id) => {
          const d = VENDORS[id];
          const on = id === vid;
          const ready = offeredQuests(profile, id).filter((q) => questProgress(q, profile) >= questDef(q.id).count).length;
          return (
            <button key={id} onClick={() => { setVid(id); setView('shop'); }} data-testid={`vendor-${id}`}
              className={`panel p-2.5 flex items-center gap-3 text-left relative ${on ? 'pulse-gold border-gold' : 'hover:brightness-125'}`}>
              <img src={monsterUrl(d.sprite, 3)} alt="" className="pixelated h-14 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-display text-parchment leading-tight truncate">{d.name}</div>
                <div className="text-[11px] truncate" style={{ color: d.color }}>{d.role}</div>
                <div className="mt-1"><RepBar rep={profile.reputation[id] ?? 0} /></div>
              </div>
              {ready > 0 && <span className="absolute top-1 right-1 text-[10px] bg-heal text-black px-1.5" title="Misiones listas para cobrar">{ready}</span>}
            </button>
          );
        })}
      </div>

      <section className="panel p-4">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h2 className="font-display text-2xl text-parchment">{v.name}</h2>
            <p className="font-body text-base text-stone-300 italic max-w-2xl">«{v.blurb}»</p>
            <p className="text-xs text-stone-400 mt-1">Rango: <span className="text-gold">{REP_RANKS[rank].name}</span>{REP_RANKS[rank].discount ? ` · ${Math.round(REP_RANKS[rank].discount * 100)}% de descuento` : ''}{REP_RANKS[rank + 1] ? ` · siguiente: ${REP_RANKS[rank + 1].name} (${REP_RANKS[rank + 1].rep})` : ''}</p>
          </div>
          <GoldAmount value={profile.gold} />
        </div>
        <div className="flex gap-2 mb-3 flex-wrap">
          <button className={`btn py-2 px-4 ${view === 'shop' ? 'btn-gold' : ''}`} onClick={() => setView('shop')} data-testid="vendor-view-shop">Tienda</button>
          <button className={`btn py-2 px-4 ${view === 'quests' ? 'btn-gold' : ''}`} onClick={() => setView('quests')} data-testid="vendor-view-quests">Misiones</button>
          {vid === 'garra' && <button className={`btn py-2 px-4 ${view === 'contracts' ? 'btn-gold' : ''}`} onClick={() => setView('contracts')} data-testid="vendor-view-contracts">Contratos</button>}
          {vid === 'brand' && <button className={`btn py-2 px-4 ${view === 'forge' ? 'btn-gold' : ''}`} onClick={() => setView('forge')} data-testid="vendor-view-forge">Forja</button>}
          {v.buysItems && <button className={`btn py-2 px-4 ${view === 'sell' ? 'btn-gold' : ''}`} onClick={() => setView('sell')} data-testid="vendor-view-sell">Vender</button>}
        </div>

        {view === 'shop' && (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2" data-testid="merchant-stock">
            {v.stock.map(({ itemId, rank: need }) => {
              const d = getItem(itemId);
              const locked = rank < need;
              const price = buyPrice(itemId, rep);
              const usable = !d.classes || d.classes.includes(ch.classId);
              return (
                <div key={itemId} className={`flex items-center gap-2 bg-black/30 p-2 border border-stone-800 ${locked ? 'opacity-60' : ''}`}>
                  <div className="slot" style={{ borderColor: RARITY_INFO[d.rarity].color + 'aa' }}><ItemIcon itemId={itemId} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate" style={{ color: RARITY_INFO[d.rarity].color }}>{d.name}</div>
                    <div className="text-xs text-stone-400 truncate">
                      {d.slot && d.levelReq ? <span className={ch.level < d.levelReq ? 'text-blood' : 'text-heal'}>Nv {d.levelReq} · </span> : null}
                      {d.stats ? Object.entries(d.stats).map(([k, val]) => `${val! > 0 ? '+' : ''}${val} ${k}`).join(' ') : d.description}
                      {!usable && <span className="text-blood"> · otra clase</span>}
                    </div>
                  </div>
                  {locked ? (
                    <span className="text-[11px] text-stone-400 text-right leading-tight w-20" data-testid={`locked-${itemId}`}>🔒 {REP_RANKS[need].name}</span>
                  ) : (
                    <button className="btn btn-gold text-sm whitespace-nowrap" disabled={profile.gold < price} onClick={() => actions.buy(itemId, vid)} data-testid={`buy-${itemId}`}>{price} oro</button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {view === 'quests' && <VendorQuests vendor={vid} />}
        {view === 'sell' && sellPanel}
        {view === 'forge' && <ForgePanel />}
        {view === 'contracts' && <ContractsPanel />}
      </section>
    </div>
  );
}

export function VendorQuests({ vendor }: { vendor: VendorId }) {
  const profile = useGame((s) => s.profile)!;
  const list = offeredQuests(profile, vendor);
  if (!list.length) return <p className="font-body text-stone-400 italic">No tiene encargos para ti ahora mismo. Vuelve cuando seas más fuerte.</p>;
  return (
    <div className="space-y-2">
      {list.map((p) => {
        const q = questDef(p.id);
        const prog = questProgress(p, profile);
        const done = prog >= q.count;
        return (
          <div key={q.id} className="bg-black/30 border border-stone-800 p-3 flex flex-wrap items-center gap-3" data-testid={`quest-${q.id}`}>
            <div className="flex-1 min-w-[12rem]">
              <div className="font-display text-lg text-gold">{q.name}{q.repeatable ? <span className="text-xs text-stone-400"> · repetible</span> : null}</div>
              <div className="font-body text-base text-stone-300">{q.description}</div>
              <div className="mt-2 max-w-sm"><Bar value={prog} max={q.count} color={done ? '#5fd19a' : '#e8b33a'} label={q.type === 'deliver' ? 'Tienes' : 'Progreso'} /></div>
            </div>
            <div className="text-right text-sm">
              <div className="text-gold">+{q.reward.gold} oro</div>
              <div className="text-arcane">+{q.reward.xp} XP</div>
              <div style={{ color: VENDORS[vendor].color }}>+{q.reward.rep} reputación</div>
              {QUEST_COSMETICS[q.id] && <div className="text-arcane">+ aspecto: {COSMETICS[QUEST_COSMETICS[q.id]].name}</div>}
              <button className="btn btn-gold mt-2 text-sm py-2 px-4" disabled={!done} onClick={() => actions.claimQuest(q.id)} data-testid={`claim-${q.id}`}>{q.type === 'deliver' ? 'Entregar' : 'Cobrar'}</button>
            </div>
          </div>
        );
      })}
      <p className="font-body text-sm text-stone-400 italic">Las misiones de caza, cofres y extracción avanzan al terminar cada expedición. Las entregas se cobran con lo que tengas en la mochila y el almacén.</p>
    </div>
  );
}
