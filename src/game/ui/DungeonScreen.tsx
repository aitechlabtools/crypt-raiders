import { useCallback, useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { DungeonScene, activeScene } from '../engine/DungeonScene';
import { actions, getState, useGame, exposeDebug } from '../state/store';
import { computeStats } from '../../core/stats';
import { CLASSES } from '../../core/data/classes';
import { getItem, RARITY_INFO } from '../../core/data/items';
import { countItem, gridValue, type Loc } from '../../core/inventory';
import { timeLeft } from '../../core/expedition';
import { CombatScreen } from './CombatScreen';
import { Bar, EquipmentView, GridView, StatsList, ItemIcon } from './inventory';
import { HeroSprite, MonsterSprite, Modal, formatTime, ItemActions, GoldAmount } from './common';
import { SettingsModal } from './TitleScreen';

export function DungeonScreen() {
  const host = useRef<HTMLDivElement>(null);
  const modal = useGame((s) => s.modal);
  const combat = useGame((s) => s.combat);
  const profile = useGame((s) => s.profile)!;

  useEffect(() => {
    if (!host.current) return;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host.current,
      backgroundColor: '#07060a',
      pixelArt: true,
      roundPixels: true,
      banner: false,
      audio: { noAudio: true },
      scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
      scene: [DungeonScene],
    });
    exposeDebug({ scene: () => activeScene, game });
    const t = setInterval(() => actions.tick(), 250);
    return () => {
      clearInterval(t);
      game.destroy(true);
    };
  }, []);

  // Teclas rápidas de exploración
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const s = getState();
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      const k = e.key.toLowerCase();
      if (s.combat) return; // el combate gestiona sus teclas
      if (k === 'escape') {
        e.preventDefault();
        if (s.modal) actions.closeModal();
        else actions.openModal({ type: 'pause' });
      } else if (k === 'i') {
        e.preventDefault();
        if (s.modal?.type === 'inventory') actions.closeModal();
        else if (!s.modal) actions.openModal({ type: 'inventory' });
      } else if (!s.modal && (k === 'e' || k === ' ')) {
        e.preventDefault();
        activeScene?.interact();
      } else if (!s.modal && k === 'q') {
        e.preventDefault();
        actions.drinkPotion();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-void">
      <div ref={host} className="absolute inset-0" data-testid="game-canvas" />
      <div className="vignette" />
      <Hud />
      {modal?.type === 'loot' && <LootModal />}
      {modal?.type === 'rival' && <RivalModal />}
      {modal?.type === 'confirmBetray' && <ConfirmBetray />}
      {modal?.type === 'inventory' && <DungeonInventory />}
      {modal?.type === 'pause' && <PauseModal />}
      {combat && <CombatScreen />}
      {!profile.tutorialSeen.dungeon && !modal && !combat && <DungeonTutorial />}
    </div>
  );
}

function Hud() {
  const s = useGame((x) => x);
  const exp = s.expedition;
  if (!exp || !s.profile) return null;
  const ch = s.profile.character;
  const stats = computeStats(ch.classId, ch.level, exp.equipment);
  const left = timeLeft(exp, s.now);
  const potions = countItem(exp.backpack, 'health_potion');
  const urgent = left < 120000;
  return (
    <>
      <div className="absolute left-3 top-3 panel p-3 w-64 z-10" data-testid="hud-player">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-10 h-10 bg-[#0d0c11] border-2 border-stone-700 flex items-end justify-center overflow-hidden"><HeroSprite classId={ch.classId} appearance={ch.appearance} scale={2} animate={false} /></div>
          <div className="min-w-0">
            <div className="truncate">{ch.name}</div>
            <div className="text-xs text-stone-400">{CLASSES[ch.classId].name} · Nv {ch.level}</div>
          </div>
        </div>
        <Bar value={exp.hp} max={stats.maxHp} color="#c4283b" label="Vida" testId="hud-hp" />
        <div className="h-1" />
        <Bar value={exp.mp} max={stats.maxMp} color="#3d7be0" label={CLASSES[ch.classId].resourceName} />
        <button className="btn w-full mt-2 text-sm flex items-center justify-center gap-2" onClick={() => actions.drinkPotion()} disabled={!potions}>
          <ItemIcon itemId="health_potion" size={20} /> Poción ({potions}) <kbd className="text-xs opacity-60">Q</kbd>
        </button>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 top-3 text-center z-10 pointer-events-none">
        <div className={`panel px-5 py-1 font-display text-3xl ${urgent ? 'text-blood animate-pulse' : 'text-parchment'}`} data-testid="hud-timer">{formatTime(left)}</div>
        <div className="mt-1 text-sm text-stone-300 tracking-widest uppercase font-display" data-testid="hud-room">{s.hud.room}</div>
      </div>

      <div className="absolute right-3 top-3 flex flex-col items-end gap-2 z-10">
        <div className="flex gap-2">
          <button className="btn text-sm" onClick={() => actions.openModal({ type: 'inventory' })} data-testid="btn-inventory">Inventario <kbd className="opacity-60">I</kbd></button>
          <button className="btn text-sm" onClick={() => actions.openModal({ type: 'pause' })}>Menú <kbd className="opacity-60">Esc</kbd></button>
        </div>
        {s.rival.disposition === 'allied' && (
          <div className="panel p-2 w-52 border-heal" data-testid="hud-ally">
            <div className="text-xs text-heal mb-1">Aliado · Kael el Errante</div>
            <Bar value={s.rival.hp} max={105} color="#5fd19a" />
          </div>
        )}
        {s.rival.disposition === 'hostile' && <div className="panel px-3 py-1 text-sm text-blood border-blood">Kael es hostil</div>}
      </div>

      <div className="absolute left-3 bottom-3 panel px-3 py-2 text-sm z-10 flex items-center gap-4">
        <span>Botín: <span className="text-gold" data-testid="hud-loot-value">{gridValue(exp.backpack)}</span></span>
        <span className="flex items-center gap-1">Oro: <GoldAmount value={exp.goldFound} /></span>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 bottom-6 z-10 flex flex-col items-center gap-2 pointer-events-none">
        {s.hud.channel > 0 && (
          <div className="panel p-2 w-72 text-center border-arcane">
            <div className="text-arcane text-sm mb-1">Canalizando el portal… no te muevas</div>
            <div className="bar"><div style={{ width: `${s.hud.channel * 100}%`, background: '#a35ae0' }} /></div>
          </div>
        )}
        {s.hud.prompt && !s.modal && !s.combat && (
          <div className="panel px-4 py-2 fade-in" data-testid="hud-prompt"><kbd className="bg-gold text-black px-1.5 mr-2">E</kbd>{s.hud.prompt}</div>
        )}
      </div>
    </>
  );
}

function LootModal() {
  const s = useGame((x) => x);
  const [sel, setSel] = useState<Loc | null>(null);
  if (s.modal?.type !== 'loot' || !s.expedition) return null;
  const session = s.modal.session;
  const grid = s.chests[session.id] ?? s.bags[session.id]?.grid ?? [];
  const share = session.shareAsked && s.rival.disposition === 'allied';
  const selStack = sel?.kind === 'grid' && sel.container === 'loot' ? grid[sel.index] : null;
  return (
    <Modal onClose={() => actions.closeLoot()} wide testId="loot-modal">
      <div className="flex items-center justify-between mb-3">
        <h2 className="panel-title text-xl">{session.title}</h2>
        <button className="btn btn-gold" onClick={() => actions.takeAll(session.id)} data-testid="btn-take-all">Cogerlo todo</button>
      </div>
      {share && (
        <div className="panel p-3 mb-3 border-heal flex items-center gap-3">
          <MonsterSprite sprite="rival" scale={2} />
          <div className="font-body text-base flex-1">
            <b className="text-heal">Kael espera su parte.</b> Selecciona un objeto y pulsa «Dar a Kael». Si te lo quedas todo, lo recordará.
            {session.given.length > 0 && <div className="text-heal">Le has dado: {session.given.map((id) => getItem(id).name).join(', ')}.</div>}
          </div>
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <div className="text-sm text-stone-300 mb-2">Contenido</div>
          <GridView grid={grid} container="loot" cols={6} lootId={session.id} equipment={s.expedition.equipment} mode="dungeon" selected={sel} onSelect={setSel}
            onQuick={(l) => actions.quickMove(l, 'backpack', session.id)} onAlt={(l) => actions.quickMove(l, 'backpack', session.id)} />
          {grid.every((x) => !x) && <p className="text-stone-400 text-sm mt-2 italic">Vacío.</p>}
          {selStack && (
            <div className="flex gap-2 mt-3 items-center flex-wrap">
              <span style={{ color: RARITY_INFO[getItem(selStack.itemId).rarity].color }}>{getItem(selStack.itemId).name}</span>
              <button className="btn btn-gold text-sm" onClick={() => { actions.quickMove(sel!, 'backpack', session.id); setSel(null); }}>Coger</button>
              {share && <button className="btn text-sm" onClick={() => { actions.giveToRival(session.id, (sel as { index: number }).index); setSel(null); }} data-testid="btn-give">Dar a Kael</button>}
            </div>
          )}
        </div>
        <div>
          <div className="text-sm text-stone-300 mb-2">Tu mochila · {s.expedition.backpack.filter(Boolean).length}/{s.expedition.backpack.length}</div>
          <GridView grid={s.expedition.backpack} container="backpack" cols={6} lootId={session.id} equipment={s.expedition.equipment} mode="dungeon"
            onQuick={(l) => actions.quickMove(l, 'loot', session.id)} onAlt={(l) => actions.quickMove(l, 'loot', session.id)} />
        </div>
      </div>
      <p className="text-xs text-stone-400 mt-3">Doble clic o clic derecho para mover. También puedes arrastrar.</p>
      <button className="btn mt-3" onClick={() => actions.closeLoot()} data-testid="btn-close-loot">Cerrar <kbd className="opacity-60">Esc</kbd></button>
    </Modal>
  );
}

function trustLabel(t: number) {
  if (t >= 70) return { text: 'Confía en ti', cls: 'text-heal' };
  if (t >= 45) return { text: 'Cordial', cls: 'text-heal' };
  if (t >= 30) return { text: 'Cauto', cls: 'text-gold' };
  return { text: 'Desconfiado', cls: 'text-ember' };
}

function RivalModal() {
  const rival = useGame((s) => s.rival);
  const line = useGame((s) => s.rivalLine);
  const allied = rival.disposition === 'allied';
  const tl = trustLabel(rival.trust);
  return (
    <Modal onClose={() => actions.closeModal()} testId="rival-modal">
      <div className="flex gap-4">
        <div className="shrink-0 w-28 h-36 bg-black/40 border-2 border-stone-700 flex items-end justify-center"><MonsterSprite sprite="rival" scale={5} /></div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-2xl">Kael el Errante</h2>
          <div className="text-sm">
            {allied ? <span className="text-heal">● Aliado</span> : <span className="text-gold">● Neutral</span>}
            <span className="text-stone-400"> · Actitud: </span><span className={tl.cls}>{tl.text}</span>
          </div>
          <p className="font-body text-lg mt-3 leading-snug min-h-[3.5rem]" data-testid="rival-line">
            {line ?? (allied ? 'Kael: «¿Qué pasa? Mantén los ojos abiertos.»' : 'Un aventurero encapuchado te observa, la mano cerca de la daga. No parece hostil… todavía.')}
          </p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-2 mt-4">
        <button className="btn" onClick={() => actions.rivalTalk()} data-testid="rival-talk">Hablar</button>
        {!allied && <button className="btn btn-gold" onClick={() => actions.rivalPropose()} data-testid="rival-ally">Proponer alianza</button>}
        {!allied && <button className="btn" onClick={() => actions.rivalDuel()} data-testid="rival-duel">Proponer duelo amistoso</button>}
        {!allied && <button className="btn" onClick={() => actions.rivalIgnore()} data-testid="rival-ignore">Ignorar y seguir tu camino</button>}
        {allied && <button className="btn" onClick={() => actions.rivalLeave()} data-testid="rival-leave">Separar vuestros caminos</button>}
        {!allied && <button className="btn btn-danger" onClick={() => actions.rivalAttack()} data-testid="rival-attack">Atacar (combate hostil)</button>}
        {allied && <button className="btn btn-danger" onClick={() => actions.askBetray()} data-testid="rival-betray">Traicionar…</button>}
      </div>
      <p className="text-xs text-stone-400 mt-3 font-body text-sm">Un duelo amistoso no mata a nadie ni roba nada. Un ataque hostil o una traición, sí.</p>
      <button className="btn mt-3 text-sm" onClick={() => actions.closeModal()}>Cerrar</button>
    </Modal>
  );
}

function ConfirmBetray() {
  return (
    <Modal onClose={() => actions.closeModal()} testId="confirm-betray">
      <h2 className="panel-title text-xl text-blood mb-2">¿Traicionar a Kael?</h2>
      <p className="font-body text-lg">Romperás la alianza y lo atacarás por sorpresa (empezará aturdido). Si cae, podrás quedarte con todo lo que lleva. Si sobrevive… no lo olvidará.</p>
      <div className="flex gap-2 mt-4">
        <button className="btn btn-danger" onClick={() => actions.confirmBetray()} data-testid="confirm-betray-yes">Sí, es una traición</button>
        <button className="btn" onClick={() => actions.closeModal()}>No, era un error</button>
      </div>
    </Modal>
  );
}

function DungeonInventory() {
  const s = useGame((x) => x);
  const [sel, setSel] = useState<Loc | null>(null);
  const clear = useCallback(() => setSel(null), []);
  if (!s.expedition || !s.profile) return null;
  const ch = s.profile.character;
  const stats = computeStats(ch.classId, ch.level, s.expedition.equipment);
  return (
    <Modal onClose={() => actions.closeModal()} wide testId="dungeon-inventory">
      <div className="flex items-center justify-between mb-3"><h2 className="panel-title text-xl">Inventario</h2><button className="btn text-sm" onClick={() => actions.sortContainer('backpack')}>Ordenar</button></div>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-4">
          <EquipmentView equipment={s.expedition.equipment} selected={sel} onSelect={setSel} mode="dungeon" portrait={<HeroSprite classId={ch.classId} appearance={ch.appearance} scale={5} />} />
          <StatsList stats={stats} resourceName={CLASSES[ch.classId].resourceName} />
        </div>
        <div>
          <GridView grid={s.expedition.backpack} container="backpack" cols={6} equipment={s.expedition.equipment} mode="dungeon" selected={sel} onSelect={setSel}
            onQuick={(l, st) => (getItem(st.itemId).slot ? actions.quickEquip(l) : getItem(st.itemId).use ? actions.useItem(l) : undefined)} />
          <div className="mt-4"><ItemActions loc={sel} mode="dungeon" onClear={clear} /></div>
        </div>
      </div>
      <button className="btn mt-4" onClick={() => actions.closeModal()}>Cerrar <kbd className="opacity-60">I</kbd></button>
    </Modal>
  );
}

function PauseModal() {
  const [settings, setSettings] = useState(false);
  const [giveUp, setGiveUp] = useState(false);
  if (settings) return <SettingsModal onClose={() => setSettings(false)} />;
  return (
    <Modal onClose={() => actions.closeModal()} testId="pause">
      <h2 className="panel-title text-xl mb-1">Pausa</h2>
      <p className="font-body text-stone-300 mb-4">El reloj de la cripta no se detiene.</p>
      <div className="flex flex-col gap-2">
        <button className="btn btn-gold" onClick={() => actions.closeModal()}>Continuar</button>
        <button className="btn" onClick={() => setSettings(true)}>Ajustes</button>
        {!giveUp ? (
          <button className="btn btn-danger" onClick={() => setGiveUp(true)}>Rendirse…</button>
        ) : (
          <div className="panel p-3 border-blood">
            <p className="font-body text-lg mb-2">Rendirte cuenta como una muerte: <b className="text-blood">perderás todo lo que llevas encima</b>.</p>
            <div className="flex gap-2">
              <button className="btn btn-danger" onClick={() => void actions.finishExpedition('died')}>Rendirme</button>
              <button className="btn" onClick={() => setGiveUp(false)}>Seguir luchando</button>
            </div>
          </div>
        )}
      </div>
      <div className="mt-4 text-sm text-stone-400 font-body text-base">WASD/flechas o clic: moverse · E: interactuar · Q: poción · I: inventario · Esc: menú</div>
    </Modal>
  );
}

function DungeonTutorial() {
  return (
    <Modal onClose={() => actions.markTutorial('dungeon')} testId="dungeon-tutorial">
      <h2 className="panel-title text-xl mb-3">Las Criptas de Umbravel</h2>
      <ul className="font-body text-lg space-y-1.5">
        <li><b>Moverse:</b> WASD, flechas o clic en el suelo.</li>
        <li><b>Interactuar:</b> E (cofres, puertas, otros aventureros, portal).</li>
        <li><b>Combate:</b> al tocar a un enemigo empieza un combate por turnos.</li>
        <li><b>Extraer:</b> busca el portal violeta y canaliza 3 segundos sin moverte.</li>
        <li><b>Tiempo:</b> si el reloj llega a cero, la cripta se queda con todo.</li>
      </ul>
      <button className="btn btn-gold mt-4" onClick={() => actions.markTutorial('dungeon')} data-testid="btn-dungeon-tutorial-ok">¡A por ello!</button>
    </Modal>
  );
}
