import { Tienda } from './screens/Atuendos';
import { BestiaryTab } from './BestiaryTab';
import { useState, type ReactNode } from 'react';
import { actions, useGame } from '../state/store';
import { CLASSES } from '../../core/data/classes';
import { QUESTS } from '../../core/data/quests';
import { xpForNextLevel } from '../../core/stats';
import { PlayerSprite, GoldAmount, Modal } from './common';
import { SettingsModal } from './TitleScreen';
import { sfx } from '../audio';
import { FullscreenButton } from './FullscreenButton';
import { Jugar } from './screens/Jugar';
import { Alijo } from './screens/Alijo';
import { Personaje } from './screens/Personaje';
import { Mercaderes } from './screens/Mercaderes';
import { Misiones } from './screens/Misiones';
import type { VendorTarget } from './VendorsTab';
import { PillBar, type PillTab } from './kit';
import { useLayout } from '../../config/ui';
import { ClassUnlockNotice } from './ClassSkills';

export type LobbyTab = 'play' | 'character' | 'stash' | 'merchants' | 'quests' | 'bestiary' | 'shop';

export function Lobby() {
  const profile = useGame((s) => s.profile)!;
  const [tab, setTab] = useState<LobbyTab>('play');
  const [settings, setSettings] = useState(false);
  /** Acceso directo a un mercader concreto (p. ej., «Contrato» en Jugar abre los contratos de Garra Roja). */
  const [vendorTarget, setVendorTarget] = useState<VendorTarget | null>(null);
  const layout = useLayout();
  const ch = profile.character;
  const cls = CLASSES[ch.classId];
  const questsReady = profile.quests.filter((q) => !q.claimed && q.progress >= QUESTS.find((d) => d.id === q.id)!.count).length;
  const tabs: PillTab<LobbyTab>[] = [
    { id: 'play', label: 'Jugar' }, { id: 'character', label: 'Personaje' }, { id: 'stash', label: 'Alijo' }, { id: 'merchants', label: 'Mercaderes' },
    { id: 'quests', label: 'Misiones', badge: questsReady }, { id: 'bestiary', label: 'Bestiario' }, { id: 'shop', label: 'Tienda' },
  ];
  const go = (t: LobbyTab) => { setTab(t); sfx('click'); };
  const xpPct = Math.round((ch.xp / xpForNextLevel(ch.level)) * 100);

  return (
    <div className="h-full flex flex-col relative" style={{ background: 'radial-gradient(ellipse at 50% 30%, #1a1520 0%, #0d0b11 55%, #07060a 100%)' }}>
      {/* Barra superior: quién eres, pestañas en píldora, oro, pantalla completa y ajustes */}
      <header className="ui-nav" data-testid="lobby-nav">
        <div className="flex items-center min-w-0">
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
        </div>
        <PillBar tabs={tabs} active={tab} onChange={go} />
        <div className="flex items-center justify-end gap-2.5 min-w-0">
        <GoldAmount value={profile.gold} className={layout === 'phone' ? 'text-sm' : 'text-lg'} />
        <FullscreenButton className="icon-btn" />
        <button className="btn icon-btn" onClick={() => setSettings(true)} aria-label="Ajustes" title="Ajustes" data-testid="btn-lobby-settings"><GearIcon /></button>
        </div>
      </header>

      <main className="flex-1 min-h-0 relative">
        <div key={tab} className="fade-in h-full">
          {tab === 'play' && <Jugar onNavigate={(t) => { if (t === 'contracts') setVendorTarget({ vendor: 'garra', view: 'contracts' }); go(t === 'contracts' ? 'merchants' : t); }} />}
          {tab === 'character' && <Personaje />}
          {tab === 'stash' && <Alijo onDetails={() => go('character')} onShop={() => go('shop')} />}
          {tab === 'merchants' && <Mercaderes target={vendorTarget} onConsumed={() => setVendorTarget(null)} />}
          {tab === 'quests' && <Misiones />}
          {tab === 'shop' && <Tienda />}
          {tab === 'bestiary' && <Legacy><div className="max-w-5xl mx-auto"><BestiaryTab /></div></Legacy>}
        </div>
      </main>
      {settings && <SettingsModal onClose={() => setSettings(false)} onExit={() => actions.goto('title')} />}
      {!profile.tutorialSeen.lobby ? <LobbyTutorial /> : <ClassUnlockNotice />}
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

function LobbyTutorial() {
  return (
    <Modal onClose={() => actions.markTutorial('lobby')} testId="tutorial">
      <h2 className="panel-title text-xl mb-3">Bienvenido al Bastión de Ceniza</h2>
      <ol className="font-body text-lg space-y-2 list-decimal pl-5">
        <li><b>Alijo:</b> tu equipo, tu mochila y el almacén. Arrastra los objetos, o tócalos y luego toca la casilla donde los quieres.</li>
        <li><b>Almacén:</b> lo que guardes ahí está a salvo. Lo que lleves a la mazmorra, no.</li>
        <li><b>Mercaderes:</b> habla con ellos para comprar pociones, vender lo que no necesites y aceptar encargos.</li>
        <li><b>Jugar:</b> elige zona y pulsa <b>Descender</b>. Saquea, sobrevive y encuentra el portal antes de que acabe el tiempo.</li>
      </ol>
      <p className="font-body italic text-stone-300 mt-3">Y no te fíes de nadie que encuentres ahí abajo. O sí. Tú decides.</p>
      <button className="btn btn-gold mt-4" onClick={() => actions.markTutorial('lobby')} data-testid="btn-tutorial-ok">Entendido</button>
    </Modal>
  );
}
