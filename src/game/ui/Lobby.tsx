import { getMerc } from '../../core/data/mercenaries';
import { ShopTab, WardrobeTab } from './WardrobeTab';
import { BestiaryTab } from './BestiaryTab';
import { stashUpgrades } from '../../core/economy';
import { STASH_ROW, STASH_UPGRADE_COSTS } from '../../config/stash';
import { VendorsTab, VendorQuests } from './VendorsTab';
import { VENDORS, VENDOR_ORDER } from '../../core/data/vendors';
import { monsterUrl } from '../../shared/art';
import { ZONES, ZONE_ORDER, zoneLock, type ZoneId } from '../../core/data/zones';
import { getEnemy } from '../../core/data/enemies';
import { useState, type ReactNode } from 'react';
import { actions, useGame } from '../state/store';
import { CLASSES } from '../../core/data/classes';
import { getItem, RARITY_INFO } from '../../core/data/items';
import { QUESTS } from '../../core/data/quests';
import { computeStats, baseStats, xpForNextLevel } from '../../core/stats';
import { countItem, equippedValue, gridValue, type Loc } from '../../core/inventory';
import { EXPEDITION_DURATION_MS } from '../../core/expedition';
import { EquipmentView, GridView, ItemIcon, StatsList, Bar, type InvMode } from './inventory';
import { PlayerSprite, GoldAmount, ItemActions, Modal, LoadoutPanel } from './common';
import { SettingsModal } from './TitleScreen';
import { sfx, startMusic } from '../audio';
import type { ItemStack } from '../../core/types';
import { FullscreenButton } from './FullscreenButton';
import { PillBar, type PillTab } from './kit';
import { useLayout } from '../../config/ui';

export type LobbyTab = 'play' | 'character' | 'stash' | 'merchants' | 'quests' | 'bestiary' | 'wardrobe' | 'shop';

export function Lobby() {
  const profile = useGame((s) => s.profile)!;
  const [tab, setTab] = useState<LobbyTab>('play');
  const [settings, setSettings] = useState(false);
  const layout = useLayout();
  const ch = profile.character;
  const cls = CLASSES[ch.classId];
  const questsReady = profile.quests.filter((q) => !q.claimed && q.progress >= QUESTS.find((d) => d.id === q.id)!.count).length;
  const tabs: PillTab<LobbyTab>[] = [
    { id: 'play', label: 'Jugar' }, { id: 'character', label: 'Personaje' }, { id: 'stash', label: 'Alijo' }, { id: 'merchants', label: 'Mercaderes' },
    { id: 'quests', label: 'Misiones', badge: questsReady }, { id: 'bestiary', label: 'Bestiario' }, { id: 'wardrobe', label: 'Vestuario' }, { id: 'shop', label: 'Tienda' },
  ];
  const go = (t: LobbyTab) => { setTab(t); sfx('click'); };
  const xpPct = Math.round((ch.xp / xpForNextLevel(ch.level)) * 100);

  return (
    <div className="h-full flex flex-col relative" style={{ background: 'radial-gradient(ellipse at 50% 30%, #1a1520 0%, #0d0b11 55%, #07060a 100%)' }}>
      {/* Barra superior: quién eres, pestañas en píldora, oro, pantalla completa y ajustes */}
      <header className="ui-nav" data-testid="lobby-nav">
        {layout !== 'phone' && (
          <div className="flex items-center gap-2 shrink-0" data-testid="nav-chip">
            <div className="w-10 h-10 flex items-end justify-center overflow-hidden bg-[#0d0c11] border-2 border-stone-700"><PlayerSprite scale={2} animate={false} /></div>
            <div className="min-w-0 w-28 leading-tight">
              <div className="font-display text-sm truncate" data-testid="hero-name">{ch.name}</div>
              <div className="text-[11px] text-stone-300 truncate">{cls.name} · Nv <span data-testid="hero-level">{ch.level}</span></div>
              <div className="h-1 bg-stone-800 mt-1"><div className="h-full bg-arcane" style={{ width: `${xpPct}%` }} /></div>
            </div>
          </div>
        )}
        <PillBar tabs={tabs} active={tab} onChange={go} />
        <GoldAmount value={profile.gold} className={layout === 'phone' ? 'text-sm' : 'text-lg'} />
        <FullscreenButton className="icon-btn" />
        <button className="btn icon-btn" onClick={() => setSettings(true)} aria-label="Ajustes" title="Ajustes" data-testid="btn-lobby-settings"><GearIcon /></button>
      </header>

      <main className="flex-1 min-h-0 relative">
        <div key={tab} className="fade-in h-full">
          {tab === 'play' && <Legacy><ExpeditionTab /></Legacy>}
          {tab === 'character' && <Legacy><HeroTab /></Legacy>}
          {tab === 'stash' && <Legacy><GearTab /><div className="h-4" /><StashTab /></Legacy>}
          {tab === 'merchants' && <Legacy><MerchantTab /></Legacy>}
          {tab === 'quests' && <Legacy><QuestsTab /></Legacy>}
          {tab === 'wardrobe' && <Legacy><WardrobeTab /></Legacy>}
          {tab === 'shop' && <Legacy><ShopTab /></Legacy>}
          {tab === 'bestiary' && <Legacy><BestiaryTab /></Legacy>}
        </div>
      </main>
      {settings && <SettingsModal onClose={() => setSettings(false)} onExit={() => actions.goto('title')} />}
      {!profile.tutorialSeen.lobby && <LobbyTutorial />}
    </div>
  );
}

/** Contenedor con desplazamiento para las pantallas que aún no tienen su diseño propio. */
function Legacy({ children }: { children: ReactNode }) {
  return <div className="h-full overflow-y-auto scroll-thin" style={{ padding: '0 max(var(--pad), env(safe-area-inset-right)) var(--pad) max(var(--pad), env(safe-area-inset-left))' }}>{children}</div>;
}

function GearIcon() {
  // Rueda dentada provisional (12×12)
  return (
    <svg viewBox="0 0 12 12" width="20" height="20" fill="currentColor" shapeRendering="crispEdges" aria-hidden className="shrink-0">
      <path d="M5 0h2v2H5zM5 10h2v2H5zM0 5h2v2H0zM10 5h2v2h-2zM2 2h2v2H2zM8 2h2v2H8zM2 8h2v2H2zM8 8h2v2H8zM3 3h6v6H3z" />
      <rect x="5" y="5" width="2" height="2" fill="#131118" />
    </svg>
  );
}

function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="panel p-4">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="panel-title text-sm">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

function useSelection() {
  const [sel, setSel] = useState<Loc | null>(null);
  return { sel, setSel, clear: () => setSel(null) };
}

function HeroTab() {
  const profile = useGame((s) => s.profile)!;
  const ch = profile.character;
  const cls = CLASSES[ch.classId];
  const stats = computeStats(ch.classId, ch.level, profile.equipment);
  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-4">
      <Section title="Aventurero">
        <div className="flex justify-center h-48 items-end"><PlayerSprite scale={8} /></div>
        <div className="text-center font-display text-2xl mt-2">{ch.name}</div>
        <div className="text-center text-sm" style={{ color: cls.color }}>{cls.name} de nivel {ch.level}</div>
        <div className="mt-3"><Bar value={ch.xp} max={xpForNextLevel(ch.level)} color="#a35ae0" label="Experiencia" /></div>
        <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
          <div className="bg-black/30 p-2"><div className="text-stone-400 text-xs">Expediciones</div>{profile.stats.expeditions}</div>
          <div className="bg-black/30 p-2"><div className="text-stone-400 text-xs">Extracciones</div>{profile.stats.extractions}</div>
          <div className="bg-black/30 p-2"><div className="text-stone-400 text-xs">Muertes</div>{profile.stats.deaths}</div>
          <div className="bg-black/30 p-2"><div className="text-stone-400 text-xs">Criaturas abatidas</div>{profile.stats.kills}</div>
        </div>
      </Section>
      <div className="space-y-4">
        <Section title="Estadísticas">
          <StatsList stats={stats} base={baseStats(ch.classId, ch.level)} resourceName={cls.resourceName} />
          <p className="font-body text-stone-300 mt-3 text-base">Entre paréntesis, la bonificación del equipo. Subir de nivel mejora tus atributos base.</p>
        </Section>
        <Section title="Habilidades">
          <LoadoutPanel classId={ch.classId} equipment={profile.equipment} />
          <p className="font-body text-stone-400 text-base mt-3">Tu clase define quién eres; el arma, cómo luchas. Cambia de arma o de escudo y cambiarán tus habilidades.</p>
        </Section>
      </div>
    </div>
  );
}

function GearTab() {
  const profile = useGame((s) => s.profile)!;
  const ch = profile.character;
  const cls = CLASSES[ch.classId];
  const { sel, setSel, clear } = useSelection();
  const stats = computeStats(ch.classId, ch.level, profile.equipment);
  const mode: InvMode = 'lobby';
  return (
    <>
      <div className="grid xl:grid-cols-[minmax(380px,460px)_1fr] gap-4">
        <div className="space-y-4">
          <Section title="Equipamiento">
            <EquipmentView equipment={profile.equipment} selected={sel} onSelect={setSel} mode={mode} portrait={<PlayerSprite scale={6} />} />
          </Section>
          <Section title="Estadísticas">
            <StatsList stats={stats} base={baseStats(ch.classId, ch.level)} resourceName={cls.resourceName} />
          </Section>
        </div>
        <div className="space-y-4">
          <Section title={`Mochila · ${profile.backpack.filter(Boolean).length}/${profile.backpack.length}`} right={<button className="btn text-xs" onClick={() => actions.sortContainer('backpack')} data-testid="sort-backpack">Ordenar</button>}>
            <GridView grid={profile.backpack} container="backpack" cols={6} equipment={profile.equipment} mode={mode} selected={sel} onSelect={setSel}
              onQuick={(l, s) => (getItem(s.itemId).slot ? actions.quickEquip(l) : actions.quickMove(l, 'stash'))}
              onAlt={(l) => actions.quickMove(l, 'stash')} />
            <p className="text-xs text-stone-400 mt-2">Lo que llevas en la mochila y equipado <span className="text-ember">se arriesga</span> en cada expedición.</p>
          </Section>
          <Section title={`Bolsillo seguro · ${profile.pocket.filter(Boolean).length}/${profile.pocket.length}`}>
            <GridView grid={profile.pocket} container="pocket" cols={3} equipment={profile.equipment} mode={mode} selected={sel} onSelect={setSel} onQuick={(l) => actions.quickMove(l, 'backpack')} />
            <p className="text-xs text-stone-400 mt-2">Lo que guardes aquí <span className="text-heal">no se pierde aunque mueras</span>. Solo caben llaves, joyas, monedas, pociones y materiales.</p>
          </Section>
          <Section title="Acciones"><ItemActions loc={sel} mode={mode} onClear={clear} /></Section>
        </div>
      </div>
    </>
  );
}

function StashUpgrade() {
  const profile = useGame((s) => s.profile)!;
  const n = stashUpgrades(profile);
  const cost = STASH_UPGRADE_COSTS[n];
  return (
    <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
      <span className="text-xs text-stone-400">{profile.stash.filter(Boolean).length}/{profile.stash.length} casillas · ampliaciones {n}/{STASH_UPGRADE_COSTS.length}</span>
      {cost !== undefined
        ? <button className="btn btn-gold text-sm py-2 px-4" disabled={profile.gold < cost} onClick={() => actions.upgradeStash()} data-testid="btn-stash-upgrade">Ampliar +{STASH_ROW} casillas · {cost} oro</button>
        : <span className="text-xs text-heal">Tamaño máximo</span>}
    </div>
  );
}

function StashTab() {
  const profile = useGame((s) => s.profile)!;
  const { sel, setSel, clear } = useSelection();
  const mode: InvMode = 'lobby';
  return (
    <div className="space-y-4">
      <div className="grid xl:grid-cols-2 gap-4">
        <Section title={`Mochila (en riesgo) · ${gridValue(profile.backpack)} oro`} right={<button className="btn text-xs" onClick={() => actions.sortContainer('backpack')}>Ordenar</button>}>
          <GridView grid={profile.backpack} container="backpack" cols={6} equipment={profile.equipment} mode={mode} selected={sel} onSelect={setSel} onQuick={(l) => actions.quickMove(l, 'stash')} onAlt={(l) => actions.quickMove(l, 'stash')} />
        </Section>
        <Section title={`Almacén (seguro) · ${gridValue(profile.stash)} oro`} right={<button className="btn text-xs" onClick={() => actions.sortContainer('stash')} data-testid="sort-stash">Ordenar</button>}>
          <GridView grid={profile.stash} container="stash" cols={8} equipment={profile.equipment} mode={mode} selected={sel} onSelect={setSel} onQuick={(l) => actions.quickMove(l, 'backpack')} onAlt={(l) => actions.quickMove(l, 'backpack')} />
          <StashUpgrade />
        </Section>
      </div>
      <Section title="Acciones"><ItemActions loc={sel} mode={mode} onClear={clear} /></Section>
      <p className="font-body text-base text-stone-300">Los objetos del almacén <span className="text-heal">nunca se pierden</span>, aunque mueras. Clic derecho o doble clic para moverlos entre mochila y almacén.</p>
    </div>
  );
}

function MerchantTab() {
  const profile = useGame((s) => s.profile)!;
  const { sel, setSel, clear } = useSelection();
  const mode: InvMode = 'merchant';
  const sellQuick = (l: Loc) => l.kind === 'grid' && (l.container === 'backpack' || l.container === 'stash') && actions.sell(l.container, l.index);
  const sellPanel = (
    <div className="grid lg:grid-cols-2 gap-4">
      <Section title="Vender desde la mochila">
        <GridView grid={profile.backpack} container="backpack" cols={6} equipment={profile.equipment} mode={mode} selected={sel} onSelect={setSel} onQuick={sellQuick} onAlt={sellQuick} />
      </Section>
      <Section title="Vender desde el almacén">
        <GridView grid={profile.stash} container="stash" cols={6} equipment={profile.equipment} mode={mode} selected={sel} onSelect={setSel} onQuick={sellQuick} onAlt={sellQuick} />
      </Section>
      <div className="lg:col-span-2"><Section title="Acciones"><ItemActions loc={sel} mode={mode} onClear={clear} /></Section></div>
    </div>
  );
  return <VendorsTab sellPanel={sellPanel} />;
}

function QuestsTab() {
  return (
    <div className="space-y-5 max-w-4xl">
      {VENDOR_ORDER.map((id) => (
        <section key={id} className="panel p-4">
          <div className="flex items-center gap-3 mb-2">
            <img src={monsterUrl(VENDORS[id].sprite, 2)} alt="" className="pixelated h-10" />
            <h3 className="font-display text-xl text-parchment flex-1">{VENDORS[id].name}</h3>
          </div>
          <VendorQuests vendor={id} />
        </section>
      ))}
    </div>
  );
}

function ExpeditionTab() {
  const profile = useGame((s) => s.profile)!;
  const ch = profile.character;
  const stats = computeStats(ch.classId, ch.level, profile.equipment);
  const risk = gridValue(profile.backpack) + equippedValue(profile.equipment);
  const potions = countItem(profile.backpack, 'health_potion');
  const noWeapon = !profile.equipment.mainHand;
  const firstTime = profile.stats.expeditions === 0;
  const [zoneId, setZoneId] = useState<ZoneId>('mazmorra');
  const zone = ZONES[zoneId];
  const lock = zoneLock(zone, ch.level, profile.bossesDefeated);
  const enter = () => {
    if (lock) return;
    sfx('portal');
    if (profile.settings.music) startMusic('dungeon');
    void actions.enterDungeon(firstTime ? 'mazmorra' : zoneId);
  };
  const carried = [...Object.values(profile.equipment), ...profile.backpack].filter((s): s is ItemStack => !!s);
  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-4 max-w-6xl">
      <section className="panel panel-gold p-0 overflow-hidden">
        <div className="h-48 relative" style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(163,90,224,0.45), transparent 60%), linear-gradient(180deg, #120e18, #0a0810)' }}>
          <div className="absolute inset-0 flex items-end justify-center pb-2"><PlayerSprite scale={6} /></div>
        </div>
        <div className="p-5">
          {firstTime ? (
            <>
              <h2 className="font-display text-3xl text-parchment">Las Criptas de Umbravel</h2>
              <p className="font-body text-lg text-stone-300 mt-2 leading-snug">Seis salas bajo el Bastión, selladas desde la caída de la orden. Murciélagos, esqueletos y un señor que no acepta que su reino terminó. Dicen que otro aventurero bajó esta mañana.</p>
            </>
          ) : (
            <>
              <h2 className="font-display text-3xl text-parchment">Elige hasta dónde bajas</h2>
              <div className="grid sm:grid-cols-3 gap-2 mt-3" data-testid="zone-picker">
                {ZONE_ORDER.map((id) => {
                  const z = ZONES[id];
                  const l = zoneLock(z, ch.level, profile.bossesDefeated);
                  const on = id === zoneId;
                  return (
                    <button key={id} onClick={() => { setZoneId(id); sfx('click'); }} data-testid={`zone-${id}`}
                      className={`panel p-3 text-left min-h-[5.5rem] transition ${on ? 'pulse-gold border-gold' : 'hover:brightness-125'} ${l ? 'opacity-60' : ''}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-lg text-parchment">{z.name}</span>
                        {l ? <span aria-label="Bloqueada" className="text-blood">🔒</span> : profile.bossesDefeated.includes(z.boss) ? <span className="text-heal text-xs">Jefe ✓</span> : null}
                      </div>
                      <div className="text-xs text-gold">Niveles {z.levels[0]}–{z.levels[1]}</div>
                      {l && <div className="text-[11px] text-blood mt-1 leading-tight">{l}</div>}
                    </button>
                  );
                })}
              </div>
              <p className="font-body text-lg text-stone-300 mt-3 leading-snug">{zone.tagline} Cada expedición, un mapa distinto. Al fondo espera <b className="text-parchment">{getEnemy(zone.boss).name}</b>.</p>
            </>
          )}
          <ul className="mt-4 space-y-1 font-body text-base">
            <li>⏳ Tienes <b className="text-gold">{EXPEDITION_DURATION_MS / 60000} minutos</b> para encontrar el portal de extracción.</li>
            <li>☠ Si mueres o se agota el tiempo, <b className="text-blood">pierdes todo lo que llevas encima</b>.</li>
            <li>✦ Si extraes, conservas todo lo que encuentres.</li>
            <li>▣ Tu almacén y tu oro del banco están a salvo.</li>
          </ul>
          <button className="btn btn-gold text-xl py-3 px-8 mt-5" onClick={enter} disabled={!!lock && !firstTime} data-testid="btn-enter-dungeon">{firstTime ? 'Entrar en la mazmorra' : `Bajar a ${zone.name}`}</button>
          {noWeapon && <p className="text-ember text-sm mt-2">Vas a entrar sin arma. Revisa tu equipo.</p>}
        </div>
      </section>
      <div className="space-y-4">
        <Section title="Preparación">
          <div className="space-y-2 text-sm">
            <Bar value={stats.maxHp} max={stats.maxHp} color="#c4283b" label="Vida" />
            <Bar value={stats.maxMp} max={stats.maxMp} color="#3d7be0" label={CLASSES[ch.classId].resourceName} />
            <div className="flex justify-between pt-2"><span className="text-stone-300">Pociones de vida</span><span className={potions ? '' : 'text-blood'}>{potions}</span></div>
            <div className="flex justify-between"><span className="text-stone-300">Valor en riesgo</span><span className="text-ember">{risk} oro</span></div>
            <div className="flex justify-between gap-2" data-testid="prep-merc"><span className="text-stone-300">Mercenario</span>{profile.contract ? <span className="text-heal text-right">{getMerc(profile.contract.mercId).name} · {profile.contract.left} exp.</span> : <span className="text-stone-500 text-right">Ninguno (Garra Roja)</span>}</div>
          </div>
        </Section>
        <Section title="Te llevas">
          <div className="flex flex-wrap gap-1">
            {carried.length ? carried.map((s) => (
              <div key={s.uid} className="slot" title={getItem(s.itemId).name} style={{ borderColor: RARITY_INFO[getItem(s.itemId).rarity].color + 'aa' }}>
                <ItemIcon itemId={s.itemId} />{s.qty > 1 && <span className="qty">{s.qty}</span>}
              </div>
            )) : <span className="text-stone-400 text-sm">Nada. Valiente.</span>}
          </div>
        </Section>
      </div>
    </div>
  );
}

function LobbyTutorial() {
  return (
    <Modal onClose={() => actions.markTutorial('lobby')} testId="tutorial">
      <h2 className="panel-title text-xl mb-3">Bienvenido al Bastión de Ceniza</h2>
      <ol className="font-body text-lg space-y-2 list-decimal pl-5">
        <li><b>Equipo:</b> arrastra objetos a las ranuras, o haz doble clic para equipar. Pasa el ratón por encima para ver detalles y comparar.</li>
        <li><b>Almacén:</b> lo que guardes aquí está a salvo. Lo que lleves a la mazmorra, no.</li>
        <li><b>Mercader:</b> compra pociones antes de bajar. Vende lo que no necesites.</li>
        <li><b>Expedición:</b> entra, saquea, sobrevive y encuentra el portal antes de que acabe el tiempo.</li>
      </ol>
      <p className="font-body italic text-stone-300 mt-3">Y no te fíes de nadie que encuentres ahí abajo. O sí. Tú decides.</p>
      <button className="btn btn-gold mt-4" onClick={() => actions.markTutorial('lobby')} data-testid="btn-tutorial-ok">Entendido</button>
    </Modal>
  );
}
