import { forgeCost } from '../../core/forge';
// La forja de Maese Brand: recetas, materiales que tienes y tirada de calidad.
import { useState } from 'react';
import { actions, useGame } from '../state/store';
import { RECIPES, QUALITIES, ENSURE_MATERIAL_MULT } from '../../core/data/forge';
import { forgeBlock, materialsFor, owned } from '../../core/forge';
import { getItem, RARITY_INFO } from '../../core/data/items';
import { REP_RANKS, rankOf } from '../../config/reputation';
import { ItemIcon } from './inventory';

export function ForgePanel() {
  const profile = useGame((s) => s.profile)!;
  const [ensure, setEnsure] = useState(false);
  const rank = rankOf(profile.reputation.brand ?? 0);
  return (
    <div className="space-y-3" data-testid="forge">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-body text-base text-stone-300 max-w-2xl">
          Cada arma sale con una calidad al azar: {QUALITIES.map((q) => `${q.name.toLowerCase()} (${q.weight}%${q.bonus ? `, +${Math.round(q.bonus * 100)}%` : ''})`).join(' · ')}.
        </p>
        <label className="flex items-center gap-2 cursor-pointer select-none btn py-2 px-3" data-testid="forge-ensure">
          <input type="checkbox" checked={ensure} onChange={(e) => setEnsure(e.target.checked)} className="w-5 h-5 accent-[#e8b33a]" />
          <span className="text-sm">Asegurar calidad buena o mejor <span className="text-stone-400">(×{ENSURE_MATERIAL_MULT} materiales)</span></span>
        </label>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2">
        {RECIPES.map((r) => {
          const res = getItem(r.result);
          const locked = rank < r.rank;
          const block = forgeBlock(profile, r, ensure);
          return (
            <div key={r.id} className={`bg-black/30 border border-stone-800 p-3 flex flex-col gap-2 ${locked ? 'opacity-60' : ''}`} data-testid={`recipe-${r.id}`}>
              <div className="flex items-center gap-2">
                <div className="slot" style={{ borderColor: RARITY_INFO[res.rarity].color + 'aa' }}><ItemIcon itemId={r.result} /></div>
                <div className="min-w-0">
                  <div className="truncate" style={{ color: RARITY_INFO[res.rarity].color }}>{res.name}</div>
                  <div className="text-xs text-stone-400 truncate">Nv {res.levelReq} · {Object.entries(res.stats ?? {}).map(([k, v]) => `${v! > 0 ? '+' : ''}${v} ${k}`).join(' ')}</div>
                </div>
              </div>
              {locked ? (
                <div className="text-xs text-stone-400">🔒 Te la enseña con el rango «{REP_RANKS[r.rank].name}»</div>
              ) : (
                <>
                  <ul className="text-xs space-y-0.5">
                    {materialsFor(r, ensure).map((m) => {
                      const have = owned(profile, m.itemId);
                      return <li key={m.itemId} className="flex items-center gap-1.5"><ItemIcon itemId={m.itemId} size={16} /><span className="flex-1">{getItem(m.itemId).name}</span><span className={have >= m.qty ? 'text-heal' : 'text-blood'}>{have}/{m.qty}</span></li>;
                    })}
                    <li className="flex justify-between"><span className="text-stone-400">Trabajo de Brand</span><span className={profile.gold >= forgeCost(r) ? 'text-gold' : 'text-blood'}>{forgeCost(r)} oro</span></li>
                  </ul>
                  <button className="btn btn-gold py-2 mt-auto" disabled={!!block} title={block ?? undefined} onClick={() => actions.forge(r.id, ensure)} data-testid={`forge-${r.id}`}>Forjar</button>
                </>
              )}
            </div>
          );
        })}
      </div>
      <p className="font-body text-sm text-stone-400 italic">Los materiales se cogen de la mochila y del almacén. El arma forjada va a tu mochila.</p>
    </div>
  );
}
