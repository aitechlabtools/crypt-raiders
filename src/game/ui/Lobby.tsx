import { useState, type ReactNode } from 'react';
import { actions, useGame } from '../state/store';
import { CLASSES } from '../../core/data/classes';
import { getSkill } from '../../core/data/skills';
import { getItem, RARITY_INFO } from '../../core/data/items';
import { MERCHANT_STOCK } from '../../core/data/merchant';
import { QUESTS } from '../../core/data/quests';
import { computeStats, baseStats, xpForNextLevel } from '../../core/stats';
import { countItem, equippedValue, gridValue, type Loc } from '../../core/inventory';
import { needsRecruitKit } from '../../core/profile';
import { buyPrice } from '../../core/economy';
import { EXPEDITION_DURATION_MS } from '../../core/expedition';
import { EquipmentView, GridView, ItemIcon, StatsList, Bar, type InvMode } from './inventory';
import { PlayerSprite, GoldAmount, ItemActions, Modal } from './common';
import { SettingsModal } from './TitleScreen';
import { sfx, startMusic } from '../audio';
import type { ItemStack } from '../../core/types';

type Tab = 'hero' | 'gear' | 'stash' | 'merchant' | 'quests' | 'expedition';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'hero', label: 'Aventurero', icon: '◆' },
  { id: 'gear', label: 'Equipo', icon: '⚔' },
  { id: 'stash', label: 'Almacén', icon: '▣' },
  { id: 'merchant', label: 'Mercader', icon: '◎' },
  { id: 'quests', label: 'Misiones', icon: '✦' },
  { id: 'expedition', label: 'Expedición', icon: '➤' },
];

export function Lobby() {
  const profile = useGame((s) => s.profile)!;
  const [tab, setTab] = useState<Tab>('gear');
  const [settings, setSettings] = useState(false);
  const ch = profile.character;
  const cls = CLASSES[ch.classId];
  const questsReady = profile.quests.filter((q) => !q.claimed && q.progress >= QUESTS.find((d) => d.id === q.id)!.count).length;

  return (
    <div className="h-full flex flex-col" style={{ background: 'radial-gradient(ellipse at 30% 0%, #221a20 0%, #0d0b11 50%, #07060a 100%)' }}>
      {/* Barra superior */}
      <header className="panel flex items-center gap-4 px-4 py-2 shrink-0 border-x-0 border-t-0">
        <div className="w-12 h-12 flex items-end justify-center overflow-hidden bg-[#0d0c11] border-2 border-stone-700">
          <PlayerSprite scale={2} animate={false} />
        </div>
        <div className="min-w-0">
          <div className="font-display text-lg leading-tight truncate" data-testid="hero-name">{ch.name}</div>
          <div className="text-xs text-stone-300">{cls.name} · Nivel <span data-testid="hero-level">{ch.level}</span></div>
        </div>
        <div className="w-40 hidden sm:block">
          <Bar value={ch.xp} max={xpForNextLevel(ch.level)} color="#a35ae0" label="XP" />
        </div>
        <div className="flex-1" />
        <GoldAmount value={profile.gold} className="text-lg" />
        <button className="btn text-sm" onClick={() => setSettings(true)}>Ajustes</button>
        <button className="btn text-sm" onClick={() => actions.goto('title')}>Salir</button>
      </header>

      <div className="flex-1 flex min-h-0">
        <nav className="w-44 shrink-0 p-3 flex flex-col gap-1 border-r-2 border-stone-800 bg-black/20">
          <div className="text-[10px] uppercase tracking-[0.25em] text-stone-400 px-2 mb-1">Bastión de Ceniza</div>
          {TABS.map((t) => (
            <button
              key={t.id}
              data-testid={`tab-${t.id}`}
              onClick={() => { setTab(t.id); sfx('click'); }}
              className={`text-left px-3 py-2 border-2 transition flex items-center gap-2 ${tab === t.id ? 'border-gold bg-[#2a2116] text-gold' : 'border-transparent hover:bg-stone-800'} ${t.id === 'expedition' ? 'mt-auto' : ''}`}
            >
              <span className="w-4 text-center opacity-70">{t.icon}</span>
              {t.label}
              {t.id === 'quests' && questsReady > 0 && <span className="ml-auto bg-gold text-black text-xs px-1.5">{questsReady}</span>}
            </button>
          ))}
        </nav>
        <main className="flex-1 overflow-y-auto scroll-thin p-4 md:p-6 min-w-0">
          <div key={tab} className="fade-in">
            {tab === 'hero' && <HeroTab />}
            {tab === 'gear' && <GearTab />}
            {tab === 'stash' && <StashTab />}
            {tab === 'merchant' && <MerchantTab />}
            {tab === 'quests' && <QuestsTab />}
            {tab === 'expedition' && <ExpeditionTab />}
          </div>
        </main>
      </div>
      {settings && <SettingsModal onClose={() => setSettings(false)} />}
      {!profile.tutorialSeen.lobby && <LobbyTutorial />}
    </div>
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

function RecruitKitBanner() {
  const profile = useGame((s) => s.profile)!;
  if (!needsRecruitKit(profile)) return null;
  return (
    <div className="panel p-3 mb-4 border-ember flex items-center gap-3 flex-wrap" data-testid="recruit-kit">
      <span className="font-body text-lg flex-1">No te queda ningún arma. El intendente del Bastión puede prestarte un equipo de recluta.</span>
      <button className="btn btn-gold" onClick={() => actions.claimRecruitKit()}>Pedir equipo de recluta</button>
    </div>
  );
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
          <div className="space-y-3">
            <div className="flex gap-3"><span className="text-xs bg-stone-700 px-2 py-1 h-fit">1</span><div><div className="text-gold">{cls.basicAttack.name} (ataque básico)</div><div className="font-body text-base text-stone-300">Sin coste. Daño {cls.basicAttack.kind === 'physical' ? 'físico' : 'mágico'} x{cls.basicAttack.power}.</div></div></div>
            {cls.skills.map((id, i) => {
              const s = getSkill(id);
              return (
                <div key={id} className="flex gap-3">
                  <span className="text-xs bg-stone-700 px-2 py-1 h-fit">{i + 2}</span>
                  <div><div className="text-gold">{s.name} <span className="text-xs text-frost">· {s.cost} {cls.resourceName.toLowerCase()}</span></div><div className="font-body text-base text-stone-300">{s.description}</div></div>
                </div>
              );
            })}
            <p className="font-body text-stone-400 text-base italic">Nuevas habilidades y talentos llegarán en próximas versiones.</p>
          </div>
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
      <RecruitKitBanner />
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
          <Section title="Acciones"><ItemActions loc={sel} mode={mode} onClear={clear} /></Section>
        </div>
      </div>
    </>
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
  const ch = profile.character;
  const mode: InvMode = 'merchant';
  const sellQuick = (l: Loc) => l.kind === 'grid' && (l.container === 'backpack' || l.container === 'stash') && actions.sell(l.container, l.index);
  return (
    <div className="grid xl:grid-cols-[1fr_minmax(340px,420px)] gap-4">
      <Section title="Mercader Orvel · Se compra, se vende, no se pregunta" right={<GoldAmount value={profile.gold} />}>
        <div className="grid sm:grid-cols-2 gap-2" data-testid="merchant-stock">
          {MERCHANT_STOCK.map((id) => {
            const d = getItem(id);
            const price = buyPrice(id);
            const usable = !d.classes || d.classes.includes(ch.classId);
            return (
              <div key={id} className="flex items-center gap-2 bg-black/30 p-2 border border-stone-800">
                <div className="slot" style={{ borderColor: RARITY_INFO[d.rarity].color + 'aa' }}><ItemIcon itemId={id} /></div>
                <div className="flex-1 min-w-0">
                  <div className="truncate" style={{ color: RARITY_INFO[d.rarity].color }}>{d.name}</div>
                  <div className="text-xs text-stone-400 truncate">{d.stats ? Object.entries(d.stats).map(([k, v]) => `${v! > 0 ? '+' : ''}${v} ${k}`).join(' ') : d.description}{!usable && <span className="text-blood"> · otra clase</span>}</div>
                </div>
                <button className="btn btn-gold text-sm whitespace-nowrap" disabled={profile.gold < price} onClick={() => actions.buy(id)} data-testid={`buy-${id}`}>{price} oro</button>
              </div>
            );
          })}
        </div>
      </Section>
      <div className="space-y-4">
        <Section title="Vender desde la mochila">
          <GridView grid={profile.backpack} container="backpack" cols={6} equipment={profile.equipment} mode={mode} selected={sel} onSelect={setSel} onQuick={sellQuick} onAlt={sellQuick} />
        </Section>
        <Section title="Vender desde el almacén">
          <GridView grid={profile.stash} container="stash" cols={6} equipment={profile.equipment} mode={mode} selected={sel} onSelect={setSel} onQuick={sellQuick} onAlt={sellQuick} />
        </Section>
        <Section title="Acciones"><ItemActions loc={sel} mode={mode} onClear={clear} /></Section>
      </div>
    </div>
  );
}

function QuestsTab() {
  const profile = useGame((s) => s.profile)!;
  return (
    <div className="space-y-3 max-w-3xl">
      {QUESTS.map((q) => {
        const p = profile.quests.find((x) => x.id === q.id)!;
        const done = p.progress >= q.count;
        return (
          <div key={q.id} className={`panel p-4 flex items-center gap-4 ${p.claimed ? 'opacity-50' : ''}`} data-testid={`quest-${q.id}`}>
            <div className="flex-1">
              <div className="font-display text-lg text-gold">{q.name}</div>
              <div className="font-body text-base text-stone-300">{q.description}</div>
              <div className="mt-2 max-w-sm"><Bar value={p.progress} max={q.count} color={done ? '#5fd19a' : '#e8b33a'} label="Progreso" /></div>
            </div>
            <div className="text-right text-sm">
              <div className="text-gold">+{q.reward.gold} oro</div>
              <div className="text-arcane">+{q.reward.xp} XP</div>
              {p.claimed ? <div className="text-heal mt-2">Cobrada</div> : <button className="btn btn-gold mt-2 text-sm" disabled={!done} onClick={() => actions.claimQuest(q.id)}>Cobrar</button>}
            </div>
          </div>
        );
      })}
      <p className="font-body text-base text-stone-400 italic">Las misiones avanzan al terminar cada expedición.</p>
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
  const enter = () => {
    sfx('portal');
    if (profile.settings.music) startMusic('dungeon');
    void actions.enterDungeon();
  };
  const carried = [...Object.values(profile.equipment), ...profile.backpack].filter((s): s is ItemStack => !!s);
  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-4 max-w-6xl">
      <section className="panel panel-gold p-0 overflow-hidden">
        <div className="h-48 relative" style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(163,90,224,0.45), transparent 60%), linear-gradient(180deg, #120e18, #0a0810)' }}>
          <div className="absolute inset-0 flex items-end justify-center pb-2"><PlayerSprite scale={6} /></div>
        </div>
        <div className="p-5">
          <h2 className="font-display text-3xl text-parchment">{firstTime ? 'Las Criptas de Umbravel' : 'Las criptas cambiantes'}</h2>
          <p className="font-body text-lg text-stone-300 mt-2 leading-snug">
            {firstTime
              ? 'Seis salas bajo el Bastión, selladas desde la caída de la orden. Murciélagos, esqueletos y un señor que no acepta que su reino terminó. Dicen que otro aventurero bajó esta mañana.'
              : 'Bajo el Bastión los pasillos nunca están donde los dejaste. Cada expedición, un mapa distinto: salas nuevas, cofres nuevos y el Señor del Osario esperando en algún rincón. Y siempre hay otro aventurero ahí abajo.'}
          </p>
          <ul className="mt-4 space-y-1 font-body text-base">
            <li>⏳ Tienes <b className="text-gold">{EXPEDITION_DURATION_MS / 60000} minutos</b> para encontrar el portal de extracción.</li>
            <li>☠ Si mueres o se agota el tiempo, <b className="text-blood">pierdes todo lo que llevas encima</b>.</li>
            <li>✦ Si extraes, conservas todo lo que encuentres.</li>
            <li>▣ Tu almacén y tu oro del banco están a salvo.</li>
          </ul>
          <button className="btn btn-gold text-xl py-3 px-8 mt-5" onClick={enter} data-testid="btn-enter-dungeon">Entrar en la mazmorra</button>
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
