// MAQUETA de skins (no es código del juego). Abre con el servidor de desarrollo:
//   npx vite --port 5173   y luego   http://localhost:5173/mockups/skins/maqueta.html?vista=alijo
// Vistas: alijo · selector · tienda · confirmar · capas
// No guarda nada: el guardado del navegador está desactivado en esta página (ver maqueta.html).
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import '../../src/game/game.css';
import './maqueta.css';
import { exposeDebug, useGame } from '../../src/game/state/store';
import { createProfile } from '../../src/core/profile';
import { CLASSES } from '../../src/core/data/classes';
import { xpForNextLevel } from '../../src/core/stats';
import { PillBar, Panel, type PillTab } from '../../src/game/ui/kit';
import { GoldAmount, Modal, PlayerSprite } from '../../src/game/ui/common';
import { useLayout } from '../../src/config/ui';
import { watchPointerType } from '../../src/shared/device';
import type { ClassId, Equipment } from '../../src/core/types';
import { Alijo } from './AlijoMaqueta';
import { SKINS, SKIN_BY_ID, type SkinDef } from './skins-propuesta';
import { skinUrl } from './arte';

watchPointerType();
exposeDebug();
const q = new URLSearchParams(location.search);
const vista = q.get('vista') ?? 'alijo';
const G = (window as unknown as { __CRYPTRAIDERS__: { setState: (p: object) => void } }).__CRYPTRAIDERS__;

// Personaje de ejemplo: guerrero de nivel 24 con espada y escudo, y algo de botín
const p = createProfile('Aldric', 'warrior', { cloak: 0, skin: 0 });
let u = 1;
const mk = (itemId: string, qty = 1) => ({ uid: 'm' + u++, itemId, qty });
p.character.level = 24;
p.gold = 4860;
p.equipment = { ...p.equipment, mainHand: mk('knight_sword'), offHand: mk('iron_shield'), helmet: mk('iron_helm'), armor: mk('chainmail'), gloves: mk('gauntlets'), boots: mk('swift_boots'), amulet: mk('bone_amulet'), ring: mk('copper_ring') };
['health_potion', 'mana_potion', 'antidote', 'miner_pick', 'iron_key'].forEach((id, i) => { p.backpack[i] = mk(id, id.includes('potion') ? 3 : 1); });
['battle_axe', 'iron_sword', 'iron_shield', 'wizard_hat', 'leather_gloves', 'worn_boots', 'ring_of_embers', 'bone_amulet', 'iron_ore', 'copper_ore', 'old_coin'].forEach((id, i) => { p.stash[i] = mk(id, id.includes('ore') ? 6 : 1); });
p.pocket[0] = mk('iron_key');
G.setState({ profile: p, screen: 'lobby' });

type Tab = 'play' | 'character' | 'stash' | 'merchants' | 'quests' | 'bestiary' | 'shop';
const TABS: PillTab<Tab>[] = [
  { id: 'play', label: 'Jugar' }, { id: 'character', label: 'Personaje' }, { id: 'stash', label: 'Alijo' }, { id: 'merchants', label: 'Mercaderes' },
  { id: 'quests', label: 'Misiones', badge: 3 }, { id: 'bestiary', label: 'Bestiario' }, { id: 'shop', label: 'Tienda' },
];

function App() {
  const profile = useGame((s) => s.profile)!;
  const layout = useLayout();
  const tab: Tab = vista === 'tienda' || vista === 'confirmar' ? 'shop' : 'stash';
  const [owned, setOwned] = useState<string[]>(['skin_penitent']);
  const [skin, setSkin] = useState<string | null>(vista === 'alijo' ? 'skin_penitent' : 'skin_penitent');
  const [picker, setPicker] = useState(vista === 'selector');
  const [confirm, setConfirm] = useState<SkinDef | null>(vista === 'confirmar' ? SKIN_BY_ID.skin_hollow_warden : null);
  const ch = profile.character;
  if (vista === 'capas') return <Layers />;
  return (
    <div className="h-full flex flex-col relative" style={{ background: 'radial-gradient(ellipse at 50% 30%, #1a1520 0%, #0d0b11 55%, #07060a 100%)' }}>
      <header className="ui-nav">
        <div className="flex items-center min-w-0">
          {layout !== 'phone' && (
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-10 h-10 flex items-end justify-center overflow-hidden bg-[#0d0c11] border-2 border-stone-700"><img src={skinUrl(ch.classId, ch.appearance, profile.equipment, skin, 2)} className="pixelated" alt="" /></div>
              <div className="min-w-0 w-28 leading-tight">
                <div className="font-display text-sm truncate">{ch.name}</div>
                <div className="text-[11px] text-stone-300 truncate">{CLASSES[ch.classId].name} · Nv {ch.level}</div>
                <div className="h-1 bg-stone-800 mt-1"><div className="h-full bg-arcane" style={{ width: `${Math.round((ch.xp / xpForNextLevel(ch.level)) * 100)}%` }} /></div>
              </div>
            </div>
          )}
        </div>
        <PillBar tabs={TABS} active={tab} onChange={() => {}} />
        <div className="flex items-center justify-end gap-2.5 min-w-0">
          <GoldAmount value={profile.gold} className={layout === 'phone' ? 'text-sm' : 'text-lg'} />
          <button className="btn icon-btn" aria-label="Ajustes">⚙</button>
        </div>
      </header>
      <main className="flex-1 min-h-0 relative">
        {tab === 'stash'
          ? <Alijo onDetails={() => {}} skin={skin} onSkinSlot={() => setPicker(true)} />
          : <Shop owned={owned} equipped={skin} onBuy={setConfirm} onEquip={setSkin} />}
      </main>
      {picker && <SkinPicker owned={['skin_penitent', 'skin_hollow_warden']} current={skin} onPick={(id) => { setSkin(id); setPicker(false); }} onClose={() => setPicker(false)} />}
      {confirm && <ConfirmBuy skin={confirm} gold={profile.gold} onCancel={() => setConfirm(null)} onOk={() => { setOwned([...owned, confirm.id]); setConfirm(null); }} />}
    </div>
  );
}

/** Selector de skins: «Sin atuendo» y las que tienes, con vista previa sobre tu personaje y tu arma. */
function SkinPicker({ owned, current, onPick, onClose }: { owned: string[]; current: string | null; onPick: (id: string | null) => void; onClose: () => void }) {
  const profile = useGame((s) => s.profile)!;
  const ch = profile.character;
  const layout = useLayout();
  const scale = layout === 'phone' ? 3 : 5;
  const tile = (id: string | null, name: string, sub: string) => (
    <button key={id ?? 'none'} className={`skin-tile ${current === id ? 'on' : ''}`} onClick={() => onPick(id)} data-testid={`pick-${id ?? 'none'}`}>
      <img src={skinUrl(ch.classId, ch.appearance, profile.equipment, id, scale)} className="pixelated" alt="" />
      <span className="font-display text-sm text-parchment text-center leading-tight">{name}</span>
      <span className="text-[11px] text-stone-400">{current === id ? 'Puesto' : sub}</span>
    </button>
  );
  return (
    <Modal onClose={onClose} wide testId="skin-picker">
      <h2 className="ui-ptitle border-0 !pt-0">Atuendo</h2>
      <p className="font-body text-stone-300 text-center text-[15px] -mt-1 mb-3">Solo cambia cómo te ven. Tu armadura sigue protegiéndote debajo.</p>
      <div className="flex gap-3 justify-center flex-wrap">
        {tile(null, 'Sin atuendo', 'Se ve tu armadura')}
        {owned.map((id) => tile(id, SKIN_BY_ID[id].name, 'Tuyo'))}
      </div>
      <p className="text-[12px] text-stone-400 text-center mt-3">Consigue más atuendos en la Tienda.</p>
      <div className="flex justify-center mt-3"><button className="btn" onClick={onClose}>Cerrar</button></div>
    </Modal>
  );
}

function Shop({ owned, equipped, onBuy, onEquip }: { owned: string[]; equipped: string | null; onBuy: (s: SkinDef) => void; onEquip: (id: string) => void }) {
  const profile = useGame((s) => s.profile)!;
  const ch = profile.character;
  const layout = useLayout();
  const phone = layout === 'phone';
  const scale = phone ? 4 : layout === 'tablet' ? 7 : 9;
  return (
    <div className="h-full overflow-y-auto scroll-thin" style={{ padding: '0 max(var(--pad), env(safe-area-inset-right)) var(--pad) max(var(--pad), env(safe-area-inset-left))' }} data-testid="skin-shop">
      <div className="min-h-full flex flex-col items-center justify-center">
        <h2 className="ui-ptitle border-0 !text-[clamp(14px,1.8vw,26px)] !tracking-[0.18em]">Atuendos de VarkHollow</h2>
        {!phone && <p className="font-body text-stone-300 text-center -mt-2 mb-3">Trajes completos para tu aventurero. Solo cambian cómo te ven: nunca dan ventaja.</p>}
        <div className="grid w-full max-w-[1200px]" style={{ gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 'var(--gap)' }}>
          {[...SKINS].sort((a, b) => a.order - b.order).map((s) => {
            const has = owned.includes(s.id);
            const on = equipped === s.id;
            const poor = !has && profile.gold < s.price.amount;
            return (
              <Panel key={s.id} gold={on} className="ui-card" bodyClassName="flex flex-col gap-2 !p-3" testId={`skin-card-${s.id}`}>
                <div className="ui-arch" style={{ height: 26 * scale + (phone ? 8 : 24) }}>
                  <div className="pb-1"><img src={skinUrl(ch.classId, ch.appearance, profile.equipment, s.id, scale)} className="pixelated" alt="" /></div>
                </div>
                <div className="text-center">
                  <div className="font-display text-parchment leading-tight" style={{ fontSize: phone ? 14 : 20 }}>{s.name}</div>
                  <div className={`text-[11px] uppercase tracking-[0.15em] rar-${s.rarity}`}>{s.rarity === 'rare' ? 'Raro' : s.rarity === 'epic' ? 'Épico' : 'Legendario'} <span className="text-stone-500 normal-case tracking-normal">· arte provisional</span></div>
                </div>
                {!phone && <p className="font-body text-stone-300 text-[15px] leading-snug text-center">{s.description}</p>}
                <div className="mt-auto flex flex-col gap-1.5">
                  {has ? (
                    on ? <div className="btn w-full text-center opacity-80" style={{ minHeight: 'var(--btn-h)', display: 'grid', placeItems: 'center' }}>✓ Equipada</div>
                      : <button className="btn btn-gold w-full" style={{ minHeight: 'var(--btn-h)' }} onClick={() => onEquip(s.id)}>Equipar</button>
                  ) : (
                    <>
                      <button className="btn btn-gold w-full" style={{ minHeight: 'var(--btn-h)' }} disabled={poor} onClick={() => onBuy(s)} data-testid={`buy-${s.id}`}>
                        Comprar · <span className="price">{s.price.amount.toLocaleString('es-ES')} oro</span>
                      </button>
                      {poor && <div className="text-[12px] text-blood text-center">Te faltan {(s.price.amount - profile.gold).toLocaleString('es-ES')} de oro</div>}
                    </>
                  )}
                </div>
              </Panel>
            );
          })}
        </div>
        <p className="text-[11px] text-stone-500 mt-3 text-center">Pagas con el oro que ganas jugando. No hay pagos con dinero real.</p>
      </div>
    </div>
  );
}

function ConfirmBuy({ skin, gold, onCancel, onOk }: { skin: SkinDef; gold: number; onCancel: () => void; onOk: () => void }) {
  const profile = useGame((s) => s.profile)!;
  const ch = profile.character;
  return (
    <Modal onClose={onCancel} testId="skin-confirm">
      <h2 className="ui-ptitle border-0 !pt-0">¿Comprar este atuendo?</h2>
      <div className="flex items-center gap-4">
        <img src={skinUrl(ch.classId, ch.appearance, profile.equipment, skin.id, 4)} className="pixelated" alt="" />
        <div className="font-body">
          <div className="font-display text-xl text-parchment">{skin.name}</div>
          <div className="text-stone-300 mt-1">Precio: <span className="price">{skin.price.amount.toLocaleString('es-ES')} oro</span></div>
          <div className="text-stone-400 text-sm">Te quedarán {(gold - skin.price.amount).toLocaleString('es-ES')} de oro. Es tuyo para siempre: no ocupa sitio y no se pierde al morir.</div>
        </div>
      </div>
      <div className="flex gap-2 mt-4 justify-end flex-wrap">
        <button className="btn" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-gold" onClick={onOk}>Comprar por {skin.price.amount.toLocaleString('es-ES')} oro</button>
      </div>
    </Modal>
  );
}

/** Hoja técnica: las 3 skins con armas de distintas clases, de frente (paso) y de espaldas (combate). */
function Layers() {
  const ap = { cloak: 0, skin: 0 };
  const kits: { cls: ClassId; label: string; eq: Equipment }[] = [
    { cls: 'warrior', label: 'Espada + escudo', eq: { mainHand: mk('knight_sword'), offHand: mk('iron_shield') } },
    { cls: 'warrior', label: 'Hacha', eq: { mainHand: mk('battle_axe') } },
    { cls: 'mage', label: 'Báculo + grimorio', eq: { mainHand: mk('ember_staff'), offHand: mk('arcane_tome') } },
  ];
  return (
    <div className="h-full overflow-auto p-6 font-body" style={{ background: '#0d0b11' }}>
      <h1 className="font-display text-2xl text-gold mb-1">Capas: una misma skin con armas de cualquier clase</h1>
      <p className="text-stone-300 mb-4">Arte provisional. Cada fila es un atuendo; columnas: tres armas distintas, de frente (4 fotogramas de paso) y de espaldas (combate).</p>
      {[null, ...SKINS.map((s) => s.id)].map((id) => (
        <div key={id ?? 'base'} className="flex items-center gap-6 mb-4">
          <div className="w-48 font-display text-parchment">{id ? SKIN_BY_ID[id].name : 'Sin atuendo (armadura real)'}</div>
          {kits.map((k) => (
            <div key={k.label} className="flex items-end gap-1 panel p-2">
              {[0, 1, 2, 3].map((f) => <img key={f} src={skinUrl(k.cls, ap, k.eq, id, 3, f)} className="pixelated" alt="" />)}
              <img src={skinUrl(k.cls, ap, k.eq, id, 3, 0, 'back')} className="pixelated ml-2" alt="" />
              <span className="text-[11px] text-stone-400 ml-2 w-20">{k.label}</span>
            </div>
          ))}
        </div>
      ))}
      <div className="hidden"><PlayerSprite /></div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
