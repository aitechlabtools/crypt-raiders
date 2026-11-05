// Maqueta de: menú principal, selección de personaje, almacén por páginas y copia de seguridad.
// Solo estructura y textos: usa las piezas reales del juego (sprites, casillas, paneles) con datos inventados.
// Vistas: ?v=menu | menu-nuevo | seleccion | borrar | cambiar | almacen | comprar | copia | importar
import { StrictMode, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/game/game.css';
import { HeroSprite, GoldAmount, MonsterSprite, Modal } from '../../src/game/ui/common';
import { Panel, PillBar, SubHead, ItemSlot, ItemIcon } from '../../src/game/ui/kit';
import { Logo } from '../../src/game/ui/TitleScreen';
import { useLayout } from '../../src/config/ui';
import { emptyEquipment } from '../../src/core/inventory';
import type { ClassId, Equipment, ItemStack } from '../../src/core/types';

const V = new URLSearchParams(location.search).get('v') ?? 'menu';
document.documentElement.classList.toggle('is-touch', matchMedia('(pointer:coarse)').matches || innerWidth < 1300);

const st = (itemId: string, qty = 1): ItemStack => ({ uid: Math.random().toString(36), itemId, qty });
function eq(parts: Partial<Record<keyof Equipment, string>>): Equipment {
  const e = emptyEquipment();
  for (const [k, v] of Object.entries(parts)) (e as Record<string, ItemStack | null>)[k] = st(v!);
  return e;
}
const HEROES: { name: string; classId: ClassId; level: number; gold: number; last: string; skin: string | null; cloak: number; skinTone: number; e: Equipment }[] = [
  { name: 'Aldric', classId: 'warrior', level: 34, gold: 12480, last: 'Hoy, 09:12', skin: 'skin_hollow_warden', cloak: 0, skinTone: 1, e: eq({ mainHand: 'knight_sword', offHand: 'iron_shield', helmet: 'iron_helm', armor: 'chainmail' }) },
  { name: 'Mireva', classId: 'mage', level: 12, gold: 2310, last: 'Hace 3 días', skin: null, cloak: 2, skinTone: 0, e: eq({ mainHand: 'ember_staff', offHand: 'arcane_tome', helmet: 'wizard_hat', armor: 'linen_robe' }) },
];

function Screen({ children }: { children: ReactNode }) {
  return <div className="h-full relative overflow-hidden" style={{ background: 'radial-gradient(ellipse at 50% 30%, #1a1520 0%, #0d0b11 55%, #07060a 100%)' }}>{children}</div>;
}

/* ───────── 1 · Menú principal ───────── */
function Menu({ fresh }: { fresh?: boolean }) {
  return (
    <div className="relative h-full flex flex-col items-center justify-center overflow-hidden" style={{ background: 'radial-gradient(ellipse at 50% 60%, #1d1424 0%, #0b0910 55%, #050407 100%)' }}>
      <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(circle at 50% 110%, rgba(196,40,59,0.35), transparent 50%)' }} />
      <div className="absolute bottom-[12%] left-[8%] hidden md:block opacity-80"><MonsterSprite sprite="skeleton" scale={7} /></div>
      <div className="absolute bottom-[12%] right-[8%] hidden md:block opacity-80"><MonsterSprite sprite="rival" scale={7} className="-scale-x-100" /></div>
      <div className="relative text-center px-4">
        <Logo size="text-5xl md:text-8xl" />
        <p className="font-body italic text-xl md:text-2xl text-stone-300 mt-3">Confía en tu espada. En nadie más.</p>
        <div className="flex flex-col gap-2.5 mt-8 w-80 mx-auto menu-col">
          {fresh ? (
            <>
              <button className="btn btn-gold text-lg py-3">Nuevo personaje</button>
              <button className="btn flex items-center justify-center gap-2"><IconUp /> Tengo una copia</button>
            </>
          ) : (
            <>
              <button className="btn btn-gold text-lg py-3">Continuar como Aldric</button>
              <button className="btn">Elegir personaje</button>
              <button className="btn flex items-center justify-center gap-2">Copia de seguridad <span className="text-[11px] text-ember font-display">· hace 12 días</span></button>
            </>
          )}
          <button className="btn">Ajustes</button>
          <a className="btn text-center">Volver a la web</a>
        </div>
        <p className="mt-6 text-xs text-stone-400 max-w-md mx-auto">Alpha v0.1 · En desarrollo: puede tener fallos y cambiar. Tu progreso se guarda en este navegador: haz copias de seguridad.</p>
      </div>
    </div>
  );
}

/* ───────── 2 · Elegir personaje ───────── */
function TopBar({ title, back = 'Volver' }: { title: string; back?: string }) {
  return (
    <header className="ui-nav" style={{ display: 'flex', justifyContent: 'space-between' }}>
      <button className="btn">‹ {back}</button>
      <h1 className="font-display text-parchment tracking-[0.14em] uppercase text-base md:text-xl">{title}</h1>
      <div style={{ width: 96 }} />
    </header>
  );
}
function HeroCard({ h, i }: { h: (typeof HEROES)[number]; i: number }) {
  const layout = useLayout();
  const sc = layout === 'phone' ? 2 : layout === 'tablet' ? 4 : 6;
  return (
    <div className={`panel ${i === 0 ? 'panel-gold' : ''} flex flex-col items-center text-center relative cursor-pointer`} style={{ padding: 'var(--gap)' }}>
      {i === 0 && <span className="absolute left-2 top-2 text-[10px] font-display tracking-wider text-gold uppercase">Último</span>}
      <button className="btn icon-btn text-stone-300" aria-label="Borrar personaje" title="Borrar personaje" style={{ position: "absolute", right: 6, top: 6, zIndex: 2, minWidth: 44, minHeight: 44 }}><IconTrash /></button>
      <div className="ui-arch w-full flex items-end justify-center" style={{ height: 26 * sc + (layout === 'phone' ? 14 : 36) }}>
        <div className="pb-2"><HeroSprite classId={h.classId} appearance={{ cloak: h.cloak, skin: h.skinTone }} equipment={h.e} skin={h.skin} scale={sc} animate={false} /></div>
      </div>
      <div className="font-display text-parchment mt-2 text-sm md:text-lg">{h.name}</div>
      <div className="text-xs md:text-sm text-stone-300">{h.classId === 'warrior' ? 'Guerrero' : 'Mago'} · Nv {h.level}</div>
      <div className="flex items-center gap-3 mt-1 text-xs md:text-sm"><GoldAmount value={h.gold} /></div>
      <div className="text-[11px] text-stone-400 mt-0.5">{h.last}</div>
      <button className={`btn ${i === 0 ? 'btn-gold' : ''} w-full mt-2`} style={{ minHeight: 44 }}>Jugar</button>
    </div>
  );
}
function EmptyCard({ n }: { n: number }) {
  return (
    <div className="panel flex flex-col items-center justify-center text-center gap-2 cursor-pointer" style={{ padding: 'var(--gap)', borderStyle: 'dashed', opacity: 0.85 }}>
      <div className="font-display text-4xl md:text-6xl text-stone-500 leading-none">+</div>
      <div className="font-display text-parchment text-sm md:text-base">Nuevo personaje</div>
      <div className="text-[11px] text-stone-400">Hueco {n} de 4</div>
    </div>
  );
}
function Seleccion({ modal }: { modal?: 'borrar' }) {
  return (
    <Screen>
      <div className="h-full flex flex-col">
        <TopBar title="Elige quién baja" back="Menú" />
        <div className="flex-1 min-h-0 grid mx-auto w-full" style={{ gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 'var(--gap)', padding: '0 var(--pad) var(--pad)', maxWidth: 1500, alignContent: 'center' }}>
          <HeroCard h={HEROES[0]} i={0} /><HeroCard h={HEROES[1]} i={1} /><EmptyCard n={3} /><EmptyCard n={4} />
        </div>
        <p className="text-center text-xs text-stone-400 pb-3 sel-foot">Los atuendos, el tutorial y la página «Compartido» del almacén son de todos tus personajes.</p>
      </div>
      {modal === 'borrar' && (
        <Modal>
          <h2 className="panel-title text-lg mb-2">Borrar a Mireva</h2>
          <p className="font-body text-lg">Se perderá <b>todo lo suyo</b>: nivel, equipo, mochila, oro, reputación, encargos y los objetos de sus páginas del almacén. No se puede deshacer.</p>
          <p className="font-body text-base text-heal mt-2">Lo que haya en la página «Compartido» se queda para tus otros personajes.</p>
          <label className="block mt-3 text-sm text-stone-300">Escribe <b className="text-parchment">Mireva</b> para confirmar
            <input className="mt-1 w-full bg-[#0d0c11] border-2 border-stone-700 px-3 text-parchment font-body text-lg" style={{ minHeight: 44 }} defaultValue="Mire" />
          </label>
          <div className="flex gap-2 mt-4"><button className="btn btn-danger" disabled>Borrar para siempre</button><button className="btn">Cancelar</button></div>
        </Modal>
      )}
    </Screen>
  );
}

/* ───────── 3 · Almacén por páginas (pestaña Alijo) ───────── */
const LOBBY_TABS = [{ id: 'play', label: 'Jugar' }, { id: 'character', label: 'Personaje' }, { id: 'stash', label: 'Alijo' }, { id: 'merchants', label: 'Mercaderes' }, { id: 'quests', label: 'Misiones' }, { id: 'bestiary', label: 'Bestiario' }, { id: 'shop', label: 'Tienda' }];
function LobbyNav({ open }: { open?: boolean }) {
  const layout = useLayout();
  const h = HEROES[0];
  return (
    <header className="ui-nav relative z-20">
      <div className="flex items-center min-w-0">
        <button className="flex items-center gap-2 shrink-0 text-left" style={{ minHeight: 44 }} aria-label="Cambiar de personaje">
          <div className={`${layout === 'phone' ? 'w-8 h-8' : 'w-10 h-10'} flex items-end justify-center overflow-hidden bg-[#0d0c11] border-2 ${open ? 'border-gold' : 'border-stone-700'}`}><HeroSprite classId={h.classId} appearance={{ cloak: 0, skin: 1 }} equipment={h.e} skin={h.skin} scale={layout === 'phone' ? 1 : 2} animate={false} /></div>
          <div className={`${layout === 'phone' ? 'w-[74px]' : 'w-28'} leading-tight`}>
            <div className={`font-display truncate ${layout === 'phone' ? 'text-xs' : 'text-sm'}`}>{h.name} <span className="text-gold">▾</span></div>
            <div className="text-[11px] text-stone-300 truncate">{layout === 'phone' ? 'Nv' : 'Guerrero · Nv'} {h.level}</div>
            <div className="h-1 bg-stone-800 mt-1"><div className="h-full bg-arcane" style={{ width: '40%' }} /></div>
          </div>
        </button>
      </div>
      <PillBar tabs={LOBBY_TABS as never} active={'stash' as never} onChange={() => {}} />
      <div className="flex items-center justify-end gap-2"><GoldAmount value={h.gold} className={layout === 'phone' ? 'text-sm' : 'text-lg'} /></div>
      {open && (
        <div className="absolute z-30 panel panel-gold p-2 flex flex-col gap-1" style={{ left: 'var(--pad)', top: 'calc(var(--nav-h) - 4px)', width: 280 }}>
          <div className="text-[11px] font-display uppercase tracking-wider text-stone-400 px-1">Cambiar de personaje</div>
          {HEROES.map((x, i) => (
            <button key={x.name} className={`flex items-center gap-2 px-2 text-left ${i === 0 ? 'bg-[#2a2216]' : 'hover:bg-[#1c1920]'}`} style={{ minHeight: 48 }}>
              <div className="w-9 h-9 flex items-end justify-center overflow-hidden bg-[#0d0c11] border border-stone-700"><HeroSprite classId={x.classId} appearance={{ cloak: x.cloak, skin: x.skinTone }} equipment={x.e} skin={x.skin} scale={1} animate={false} /></div>
              <div className="flex-1 leading-tight"><div className="font-display text-sm">{x.name}</div><div className="text-[11px] text-stone-300">{x.classId === 'warrior' ? 'Guerrero' : 'Mago'} · Nv {x.level}</div></div>
              {i === 0 ? <span className="text-[11px] text-gold">ahora</span> : <span className="text-stone-400">›</span>}
            </button>
          ))}
          <button className="btn text-sm mt-1" style={{ minHeight: 44 }}>Ver todos los personajes</button>
        </div>
      )}
    </header>
  );
}

const PAGE_SIZE = 120;
const PAGES = [
  { n: 1, owned: true }, { n: 2, owned: true }, { n: 3, owned: false, price: 8000 }, { n: 4, owned: false, price: 18000 }, { n: 5, owned: false, price: 35000 },
];
const LOOT = ['knight_sword', 'battle_axe', 'iron_helm', 'chainmail', 'health_potion', 'health_potion', 'focus_tonic', 'copper_ring', 'bone_amulet', 'worn_boots', 'leather_gloves', 'iron_shield', 'padded_tunic', 'antidote', 'ember_staff', 'linen_robe', 'swift_boots', 'gauntlets', 'bone_dagger', 'ring_of_embers', 'leather_hood', 'rusty_sword', 'mana_potion', 'wooden_shield', 'blessed_mace', 'knight_helm', 'executioner_axe', 'apprentice_staff', 'shadow_robe', 'iron_sword', 'frost_staff', 'bastion_shield', 'arcane_tome', 'health_potion'];
function PageTabs({ page }: { page: number | 'shared' }) {
  return (
    <div className="flex items-center gap-1 w-full" data-testid="stash-pages">
      {PAGES.map((p) => (
        <button key={p.n} className={`pill ${page === p.n ? 'on' : ''}`} style={{ flex: '1 1 0', minWidth: 44, minHeight: 44, padding: 0, opacity: p.owned ? 1 : 0.55 }} title={p.owned ? `Página ${p.n}` : `Página ${p.n} · ${p.price} oro`}>
          {p.owned ? p.n : <IconLock />}
        </button>
      ))}
      <button className={`pill ${page === 'shared' ? 'on' : ''}`} style={{ flex: '2.4 1 0', minHeight: 44, padding: '0 6px', gap: 6, borderColor: '#3f8f8a', color: page === 'shared' ? '#07130c' : '#7fd6c9', background: page === 'shared' ? '#7fd6c9' : 'rgba(63,143,138,.15)' }} title="Compartido · para todos tus personajes">
        <IconShare /><span className="shared-label">Compartido</span>
      </button>
    </div>
  );
}
function StashGrid({ cols }: { cols: number }) {
  const grid = Array.from({ length: PAGE_SIZE }, (_, i) => (i < LOOT.length ? st(LOOT[i], LOOT[i].includes('potion') ? 4 : 1) : null));
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, var(--slot))` }}>
      {grid.map((s, i) => <ItemSlot key={i} stack={s} loc={{ kind: 'grid', container: 'stash', index: i }} selected={i === 4} />)}
    </div>
  );
}
function StashPanel({ cols, page = 1 }: { cols: number; page?: number | 'shared' }) {
  const layout = useLayout();
  const compact = layout !== 'desktop';
  return (
    <section className="panel ui-panel min-h-0" data-testid="alijo-storage">
      <div className="flex items-center justify-between gap-2" style={{ padding: compact ? '6px 8px 0' : '10px 12px 0' }}>
        <h2 className="font-display text-parchment uppercase tracking-[0.1em]" style={{ fontSize: 'var(--fs-title, 15px)' }}>Almacén <span className="text-stone-400 normal-case tracking-normal text-xs font-body">· pág. 1 · {LOOT.length}/{PAGE_SIZE}</span></h2>
        <button className="btn text-xs" style={{ minHeight: compact ? 44 : 34 }}>Ordenar</button>
      </div>
      <div style={{ padding: compact ? '6px 8px' : '8px 12px' }} className="border-b border-[#2a2830]"><PageTabs page={page} /></div>
      <div className="ui-pbody min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto scroll-thin"><StashGrid cols={cols} /></div>
      </div>
    </section>
  );
}
function Almacen({ modal, nav }: { modal?: 'comprar'; nav?: 'open' }) {
  const layout = useLayout();
  const phone = layout === 'phone';
  const bag = Array.from({ length: 24 }, (_, i) => (i < 7 ? st(LOOT[i + 3]) : null));
  const backpack = (
    <div>
      <SubHead right={<button className="btn text-xs">Ordenar</button>}>Mochila · 7/24</SubHead>
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(6, var(--slot))' }}>{bag.map((s, i) => <ItemSlot key={i} stack={s} loc={{ kind: 'grid', container: 'backpack', index: i }} />)}</div>
    </div>
  );
  return (
    <Screen>
      <div className="h-full flex flex-col">
        <LobbyNav open={nav === 'open'} />
        {phone ? (
          <div className="flex-1 min-h-0 flex flex-col items-center" style={{ padding: '0 var(--pad) var(--pad)', gap: 'var(--gap)' }}>
            <div className="ui-seg"><button>Equipo</button><button className="on">Almacén</button></div>
            <div className="flex-1 min-h-0 w-full flex justify-center" style={{ gap: 'var(--gap)' }}>
              <Panel className="min-h-0" bodyClassName="overflow-y-auto scroll-thin">{backpack}</Panel>
              <StashPanel cols={6} />
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 grid" style={{ gridTemplateColumns: `${layout === 'tablet' ? 288 : 340}px minmax(0,1fr) auto`, gap: 'var(--gap)', padding: '0 var(--pad) var(--pad)' }}>
            <Panel title="Aventurero" className="min-h-0" bodyClassName="flex flex-col items-center">
              <div className="ui-arch w-full flex items-end justify-center" style={{ height: 26 * (layout === 'tablet' ? 5 : 6) + 40 }}><div className="pb-3"><HeroSprite classId="warrior" appearance={{ cloak: 0, skin: 1 }} equipment={HEROES[0].e} skin={HEROES[0].skin} scale={layout === 'tablet' ? 5 : 6} animate={false} /></div></div>
              <div className="text-center font-display text-gold mt-3">◆ Guerrero ◆</div>
              <p className="text-xs text-stone-400 mt-4 text-center px-2">(Columna sin cambios)</p>
            </Panel>
            <Panel title="Equipo" className="min-h-0" bodyClassName="overflow-y-auto scroll-thin">
              <div className="w-fit mx-auto">
                <p className="text-xs text-stone-400 text-center mb-4">(Equipo puesto y bolsillo, sin cambios)</p>
                {backpack}
                <div className="panel p-3 mt-4 text-sm"><div className="flex items-center gap-2"><ItemIcon itemId="health_potion" size={36} /><div><div className="font-display">Poción de vida ×4</div><div className="text-xs text-stone-300">Elegida: arrástrala (o tócala y toca) a una pestaña para moverla de página.</div></div></div></div>
              </div>
            </Panel>
            <StashPanel cols={layout === 'tablet' ? 5 : 8} />
          </div>
        )}
      </div>
      {modal === 'comprar' && (
        <Modal>
          <h2 className="panel-title text-lg mb-2">Página 3 del almacén</h2>
          <p className="font-body text-lg">120 casillas más, solo para Aldric.</p>
          <div className="flex items-center justify-between panel p-3 mt-3"><span className="text-stone-300">Precio</span><GoldAmount value={8000} className="text-lg" /></div>
          <p className="text-xs text-stone-400 mt-2">Tienes 12.480 de oro. Te quedarán 4.480.</p>
          <div className="flex gap-2 mt-4"><button className="btn btn-gold">Comprar página</button><button className="btn">Cancelar</button></div>
        </Modal>
      )}
    </Screen>
  );
}

/* ───────── 4 · Copia de seguridad ───────── */
function Copia({ modal }: { modal?: 'importar' }) {
  const layout = useLayout();
  const phone = layout === 'phone';
  const [more, setMore] = useState(!phone);
  const btn = (icon: ReactNode, label: string, sub: string, gold = false) => (
    <button className={`btn ${gold ? 'btn-gold' : ''} w-full flex items-center gap-3 text-left`} style={{ minHeight: phone ? 52 : 64, padding: '6px 14px' }}>
      <span className="shrink-0">{icon}</span>
      <span className="leading-tight"><span className="block font-display">{label}</span><span className={`block text-[11px] ${gold ? 'text-[#3a2a08]' : 'text-stone-400'} font-body normal-case tracking-normal`}>{sub}</span></span>
    </button>
  );
  return (
    <Screen>
      <div className="h-full flex flex-col">
        <TopBar title="Copia de seguridad" back="Menú" />
        <div className="flex-1 min-h-0 overflow-y-auto scroll-thin">
          <div className="mx-auto w-full flex flex-col" style={{ maxWidth: 980, padding: '0 var(--pad) var(--pad)', gap: 'var(--gap)' }}>
            <div className="panel panel-gold" style={{ padding: phone ? '8px 12px' : '14px 18px' }}>
              <div className="flex items-center gap-3">
                <IconWarn />
                <p className="font-display text-parchment flex-1" style={{ fontSize: phone ? 14 : 18 }}>Tus datos se guardan solo en este navegador.</p>
                <button className="btn text-sm" style={{ minHeight: 44 }} onClick={() => setMore(!more)}>{more ? 'Menos ▴' : 'Más información ▾'}</button>
              </div>
              {more && (
                <ul className="font-body text-stone-200 mt-2 space-y-1 list-disc pl-6" style={{ fontSize: phone ? 14 : 17 }}>
                  <li>Si borras los datos del navegador o cambias de dispositivo, <b>pierdes la partida</b>.</li>
                  <li>Con una copia la guardas fuera y puedes llevarla a otro ordenador o móvil.</li>
                  <li>La copia es tuya: no se envía a ningún servidor.</li>
                  <li className="text-ember"><b>iPhone y iPad:</b> Safari puede borrar los datos si pasan unos 7 días sin abrir el juego. Añádelo a la pantalla de inicio (Compartir → «Añadir a pantalla de inicio») y haz copias a menudo.</li>
                </ul>
              )}
            </div>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--gap)' }}>
              <Panel title="Guardar mi partida" gold>
                <div className="flex flex-col gap-2">
                  {btn(<IconDown />, 'Exportar archivo', 'Descarga crypt-raiders-copia-2026-11-05.json', true)}
                  {btn(<IconCopy />, 'Copiar código', 'Para pegarlo en otro dispositivo (WhatsApp, correo…)')}
                </div>
                <p className="text-xs text-stone-300 mt-3 text-center">Última copia: <span className="text-ember">hace 12 días</span> · 9 expediciones desde entonces</p>
              </Panel>
              <Panel title="Cargar una partida">
                <div className="flex flex-col gap-2">
                  {btn(<IconUp />, 'Importar archivo', 'Elige un archivo .json de copia')}
                  {btn(<IconPaste />, 'Pegar código', 'Pega el texto que copiaste en otro dispositivo')}
                </div>
                <p className="text-xs text-stone-400 mt-3 text-center">Antes de cargar te enseñamos qué contiene y guardamos tu partida actual por si quieres deshacerlo.</p>
              </Panel>
            </div>
            <p className="text-center text-xs text-stone-400">2 personajes · Datos de cuenta: atuendos, página «Compartido», tutorial y ajustes.</p>
          </div>
        </div>
      </div>
      {modal === 'importar' && (
        <Modal wide>
          <h2 className="panel-title text-lg mb-2">¿Cargar esta copia?</h2>
          <p className="text-sm text-stone-300">Copia del <b className="text-parchment">2 de noviembre de 2026, 21:40</b> · formato 3 · comprobada ✓</p>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[['Aldric', 'Guerrero', 31], ['Mireva', 'Mago', 12], ['Kor', 'Guerrero', 4]].map(([n, c, l]) => (
              <div key={n as string} className="panel p-2 text-center"><div className="font-display">{n}</div><div className="text-xs text-stone-300">{c} · Nv {l}</div></div>
            ))}
          </div>
          <p className="text-xs text-stone-300 mt-2">Y además: 2 atuendos, página «Compartido» con 18 objetos.</p>
          <div className="panel p-3 mt-3 border-blood" style={{ borderColor: '#c4283b88' }}>
            <p className="font-body text-lg"><b className="text-blood">Sustituirá tu partida actual</b> (Aldric Nv 34 y Mireva Nv 12).</p>
            <p className="text-sm text-stone-300 mt-1">Guardaremos antes una copia automática: podrás deshacerlo desde esta pantalla.</p>
          </div>
          <div className="flex gap-2 mt-4"><button className="btn btn-gold">Sí, cargar la copia</button><button className="btn">Cancelar</button></div>
        </Modal>
      )}
    </Screen>
  );
}

/* Iconos pixel (SVG con rejilla de 12×12, sin suavizado) */
const Px = ({ d, c = 'currentColor', s = 24 }: { d: string; c?: string; s?: number }) => <svg width={s} height={s} viewBox="0 0 12 12" shapeRendering="crispEdges" fill={c}><path d={d} /></svg>;
const IconDown = () => <Px d="M5 1h2v6h2v1H8v1H7v1H5V9H4V8H3V7h2zM1 10h1v1h8v-1h1v2H1z" />;
const IconUp = () => <Px d="M5 2h2v1h1v1h1v1H7v5H5V5H3V4h1V3h1zM1 10h1v1h8v-1h1v2H1z" />;
const IconCopy = () => <Px d="M3 1h6v1H4v7H3zM5 3h6v8H5zm1 1v6h4V4z" />;
const IconPaste = () => <Px d="M4 1h4v1h2v10H2V2h2zm1 1v1h2V2zM3 3v8h6V3H8v1H4V3zm1 3h4v1H4zm0 2h4v1H4z" />;
const IconWarn = () => <Px s={30} c="#e8b33a" d="M5 1h2v1h1v2h1v2h1v2h1v3H1V8h1V6h1V4h1V2h1zm0 3v4h2V4zm0 5v1h2V9z" />;
const IconLock = () => <Px s={18} d="M4 1h4v1h1v3h1v6H2V5h1V2h1zm0 1v3h4V2zm1 5v2h2V7z" />;
const IconShare = () => <Px s={20} d="M2 3h3v1h2V3h3v3H7V5H5v2h2V6h3v3H7V8H5v1H2z" />;
const IconTrash = () => <Px s={18} d="M4 1h4v1h3v1H1V2h3zM2 4h8v7H2zm2 1v5h1V5zm3 0v5h1V5z" />;

function App() {
  const map: Record<string, ReactNode> = {
    menu: <Menu />, 'menu-nuevo': <Menu fresh />, seleccion: <Seleccion />, borrar: <Seleccion modal="borrar" />,
    cambiar: <Almacen nav="open" />, almacen: <Almacen />, comprar: <Almacen modal="comprar" />, copia: <Copia />, importar: <Copia modal="importar" />,
  };
  return <div style={{ height: '100dvh' }}>{map[V] ?? map.menu}</div>;
}
const css = document.createElement('style');
css.textContent = `@media (max-height:520px){ .menu-col{gap:6px;margin-top:14px} .menu-col .btn{min-height:44px;padding-top:0;padding-bottom:0} .sel-foot{display:none} }
@media (max-width:900px){ .shared-label{display:none} } @media (max-width:900px){ .grid[style*="1fr 1fr"]{grid-template-columns:1fr 1fr} }`;
document.head.appendChild(css);
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
