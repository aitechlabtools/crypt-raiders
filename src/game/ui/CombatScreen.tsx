import { useEffect, useRef, useState } from 'react';
import { actions, useGame } from '../state/store';
import { currentActor, canUseSkill, fleeChance, opponents, type Combatant, type CombatEvent } from '../../core/combat';
import { getSkill } from '../../core/data/skills';
import { getItem } from '../../core/data/items';
import { STATUSES } from '../../core/statuses';
import { countItem } from '../../core/inventory';
import { HeroSprite, MonsterSprite } from './common';
import { Bar, ItemIcon } from './inventory';
import { sfx } from '../audio';

const FX_COLOR: Record<string, string> = {
  fire: '#ff8a3a', frost: '#9fe3ff', dark: '#b07aff', holy: '#f8dc7a', poison: '#8fd14a', slash: '#ffffff', bite: '#ff6a5a', smash: '#d9d3c1', shield: '#8fa8c8',
};
const RANGED = new Set(['fire', 'frost', 'dark', 'holy']);

interface Float { id: number; targetId: string; text: string; color: string }

export function CombatScreen() {
  const combat = useGame((s) => s.combat)!;
  const expedition = useGame((s) => s.expedition);
  const profile = useGame((s) => s.profile)!;
  const cs = combat.state;
  const actor = currentActor(cs);
  const playerTurn = actor?.control === 'player';
  const [menu, setMenu] = useState<'main' | 'items'>('main');
  const [target, setTarget] = useState<string | null>(null);
  const [floats, setFloats] = useState<Float[]>([]);
  const [anim, setAnim] = useState<{ step: number; actorId: string | null; hit: Set<string>; fx: string | null; fromLeft: boolean }>({ step: 0, actorId: null, hit: new Set(), fx: null, fromLeft: true });
  const floatId = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);

  const sideA = cs.combatants.filter((c) => c.side === 'A');
  const sideB = cs.combatants.filter((c) => c.side === 'B');
  const player = cs.combatants.find((c) => c.control === 'player')!;
  const foes = opponents(cs, player);
  const tgt = foes.find((f) => f.id === target) ?? foes[0];

  // Animaciones y sonidos a partir de los eventos del último paso
  useEffect(() => {
    if (cs.step === 0 || cs.step === anim.step) return;
    const evs: CombatEvent[] = cs.events;
    const act = evs.find((e) => e.type === 'action') as Extract<CombatEvent, { type: 'action' }> | undefined;
    const hit = new Set<string>();
    const nf: Float[] = [];
    let anyCrit = false, anyDmg = false, anyMiss = false;
    for (const e of evs) {
      if (e.type === 'damage') {
        if (e.source === 'hit') hit.add(e.targetId);
        anyDmg = true;
        anyCrit ||= e.crit;
        nf.push({ id: ++floatId.current, targetId: e.targetId, text: `${e.crit ? '¡' : ''}-${e.amount}${e.crit ? '!' : ''}`, color: e.status ? STATUSES[e.status].color : e.crit ? '#f8dc7a' : '#ff6a5a' });
      } else if (e.type === 'heal' && e.amount > 0) nf.push({ id: ++floatId.current, targetId: e.targetId, text: `+${e.amount}`, color: '#5fd19a' });
      else if (e.type === 'mana' && e.amount > 0) nf.push({ id: ++floatId.current, targetId: e.targetId, text: `+${e.amount}`, color: '#6fa8ff' });
      else if (e.type === 'miss') { anyMiss = true; nf.push({ id: ++floatId.current, targetId: e.targetId, text: 'Esquiva', color: '#d9d3c1' }); }
      else if (e.type === 'status' && e.applied) nf.push({ id: ++floatId.current, targetId: e.targetId, text: STATUSES[e.status].name, color: STATUSES[e.status].color });
      else if (e.type === 'skip') nf.push({ id: ++floatId.current, targetId: e.actorId, text: 'Pierde el turno', color: STATUSES[e.status].color });
    }
    const actorC = act ? cs.combatants.find((c) => c.id === act.actorId) : null;
    setAnim({ step: cs.step, actorId: act?.actorId ?? null, hit, fx: act && RANGED.has(act.fx) ? act.fx : null, fromLeft: actorC?.side === 'A' });
    setFloats((f) => [...f, ...nf]);
    const ids = new Set(nf.map((x) => x.id));
    setTimeout(() => setFloats((f) => f.filter((x) => !ids.has(x.id))), 1150);
    if (act?.fx === 'fire') sfx('fire');
    else if (act?.fx === 'frost') sfx('frost');
    else if (act?.fx === 'dark' || act?.fx === 'holy') sfx('magic');
    else if (act?.fx === 'item') sfx('heal');
    else if (act?.fx === 'shield' || act?.fx === 'defend') sfx('equip');
    if (anyCrit) setTimeout(() => sfx('crit'), 120);
    else if (anyDmg) setTimeout(() => sfx('hit'), 120);
    else if (anyMiss) sfx('miss');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cs.step]);

  // Turnos de la IA con un ritmo legible
  useEffect(() => {
    if (cs.outcome || !actor || actor.control === 'player') return;
    const t = setTimeout(() => actions.combatAI(), 950);
    return () => clearTimeout(t);
  }, [cs.step, cs.outcome, actor]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [cs.log.length]);

  useEffect(() => setMenu('main'), [cs.step]);

  // Teclas 1-6 y Esc
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (cs.outcome) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { e.preventDefault(); actions.closeCombat(); }
        return;
      }
      if (!playerTurn) return;
      if (menu === 'items') {
        if (e.key === 'Escape') setMenu('main');
        return;
      }
      const skills = player.skills;
      const map: Record<string, () => void> = {
        '1': () => doAttack(),
        '2': () => skills[0] && canUseSkill(player, skills[0]) && doSkill(skills[0]),
        '3': () => skills[1] && canUseSkill(player, skills[1]) && doSkill(skills[1]),
        '4': () => actions.combatAct({ type: 'defend' }),
        '5': () => setMenu('items'),
        '6': () => actions.combatAct({ type: 'flee' }),
      };
      if (map[e.key]) { e.preventDefault(); map[e.key](); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  const doAttack = () => tgt && actions.combatAct({ type: 'attack', targetId: tgt.id });
  const doSkill = (id: string) => actions.combatAct({ type: 'skill', skillId: id, targetId: getSkill(id).target === 'enemy' ? tgt?.id : undefined });

  const usableItems = ['health_potion', 'mana_potion', 'antidote'].filter((id) => expedition && countItem(expedition.backpack, id) > 0);

  return (
    <div className="absolute inset-0 z-40 flex flex-col fade-in" data-testid="combat" style={{ background: 'radial-gradient(ellipse at 50% 75%, #2a1d26 0%, #120e16 45%, #050407 100%)' }}>
      <div className="absolute inset-x-0 bottom-[30%] h-40 opacity-60" style={{ background: 'repeating-linear-gradient(90deg, #1c1b22 0 46px, #15131a 46px 48px), linear-gradient(180deg, transparent, #000)', maskImage: 'linear-gradient(180deg, transparent, black 40%, black 70%, transparent)' }} />

      <header className="relative flex items-center justify-between px-4 py-3 gap-3">
        <div>
          <div className="font-display text-2xl text-parchment" data-testid="combat-title">{combat.title}</div>
          <div className="text-xs text-stone-400">Ronda {cs.round}{combat.kind === 'duel' ? ' · Duelo consensuado: nadie muere' : ''}</div>
        </div>
        <div className="flex items-center gap-1 flex-wrap justify-end" aria-label="Orden de turnos">
          <span className="text-xs text-stone-400 mr-1">Turnos:</span>
          {cs.order.map((id, i) => {
            const c = cs.combatants.find((x) => x.id === id)!;
            if (c.hp <= 0) return null;
            const active = i === cs.turnIndex && !cs.outcome;
            return <span key={id + i} className={`text-xs px-2 py-1 border ${active ? 'border-gold text-gold bg-[#2a2116]' : 'border-stone-700 text-stone-300'} ${c.side === 'A' ? '' : 'italic'}`}>{c.name.split(' ')[0]}</span>;
          })}
        </div>
      </header>

      <div className="relative flex-1 flex items-center justify-around px-4 min-h-0">
        {anim.fx && (
          <div key={`p${anim.step}`} className={`projectile absolute top-[42%] w-6 h-6 rounded-full ${anim.fromLeft ? '' : 'from-right'}`} style={{ background: FX_COLOR[anim.fx], boxShadow: `0 0 24px 8px ${FX_COLOR[anim.fx]}` }} />
        )}
        <div className="flex gap-6 items-end">
          {sideA.map((c) => <Fighter key={c.id} c={c} anim={anim} floats={floats} active={actor?.id === c.id} classId={c.control === 'player' ? profile.character.classId : undefined} appearance={profile.character.appearance} />)}
        </div>
        <div className="font-display text-4xl text-stone-600 hidden md:block">VS</div>
        <div className="flex gap-6 items-end">
          {sideB.map((c) => <Fighter key={c.id} c={c} anim={anim} floats={floats} active={actor?.id === c.id} flip selectable={playerTurn && c.hp > 0} selected={tgt?.id === c.id && sideB.length > 1} onSelect={() => setTarget(c.id)} />)}
        </div>
      </div>

      <div className="relative grid md:grid-cols-[minmax(320px,460px)_1fr] gap-3 p-3">
        <div className="panel panel-gold p-3 min-h-[188px]" data-testid="combat-actions">
          {cs.outcome ? (
            <Result />
          ) : !playerTurn ? (
            <div className="h-full flex items-center justify-center text-stone-300 font-body italic text-lg">{actor ? `${actor.name} está actuando…` : '…'}</div>
          ) : menu === 'main' ? (
            <div className="grid grid-cols-2 gap-2">
              <ActionBtn k="1" label={player.basicAttack.name} sub="Ataque básico" onClick={doAttack} testId="act-attack" />
              {player.skills.map((id, i) => {
                const s = getSkill(id);
                return <ActionBtn key={id} k={String(i + 2)} label={s.name} sub={`${s.cost} ${player.resourceName.toLowerCase()}`} disabled={!canUseSkill(player, id)} onClick={() => doSkill(id)} cls="btn-arcane" title={s.description} testId={`act-skill-${i}`} />;
              })}
              <ActionBtn k="4" label="Defender" sub="-50% de daño este turno" onClick={() => actions.combatAct({ type: 'defend' })} testId="act-defend" />
              <ActionBtn k="5" label="Objeto" sub={`${usableItems.length ? usableItems.map((id) => countItem(expedition!.backpack, id)).reduce((a, b) => a + b, 0) : 0} disponibles`} disabled={!usableItems.length} onClick={() => setMenu('items')} testId="act-item" />
              <ActionBtn k="6" label="Huir" sub={cs.canFlee ? `${Math.round(fleeChance(player, foes) * 100)}% de éxito` : 'Imposible'} disabled={!cs.canFlee} onClick={() => actions.combatAct({ type: 'flee' })} cls="btn-danger" testId="act-flee" />
            </div>
          ) : (
            <div className="space-y-2">
              {usableItems.map((id) => (
                <button key={id} className="btn w-full flex items-center gap-2 text-left" onClick={() => actions.combatAct({ type: 'item', itemId: id })} data-testid={`use-${id}`}>
                  <ItemIcon itemId={id} size={24} /> <span className="flex-1">{getItem(id).name}</span><span className="text-stone-400">x{countItem(expedition!.backpack, id)}</span>
                </button>
              ))}
              <button className="btn w-full text-sm" onClick={() => setMenu('main')}>Volver <kbd className="opacity-60">Esc</kbd></button>
            </div>
          )}
        </div>
        <div ref={logRef} className="panel p-3 h-[188px] overflow-y-auto scroll-thin font-body text-base leading-snug" data-testid="combat-log" aria-live="polite">
          {cs.log.map((l, i) => <div key={i} className={i >= cs.log.length - 3 ? 'text-parchment' : 'text-stone-400'}>{l}</div>)}
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ k, label, sub, onClick, disabled, cls = '', title, testId }: { k: string; label: string; sub: string; onClick: () => void; disabled?: boolean; cls?: string; title?: string; testId?: string }) {
  return (
    <button className={`btn text-left flex gap-2 items-start ${cls}`} onClick={onClick} disabled={disabled} title={title} data-testid={testId}>
      <kbd className="text-xs bg-black/40 px-1.5 mt-0.5">{k}</kbd>
      <span className="flex flex-col leading-tight"><span>{label}</span><span className="text-[11px] opacity-70">{sub}</span></span>
    </button>
  );
}

function Fighter({ c, anim, floats, active, flip, classId, appearance, selectable, selected, onSelect }: {
  c: Combatant; anim: { step: number; actorId: string | null; hit: Set<string> }; floats: Float[]; active: boolean; flip?: boolean;
  classId?: 'warrior' | 'mage' | 'rogue' | 'cleric'; appearance?: { cloak: number; skin: number }; selectable?: boolean; selected?: boolean; onSelect?: () => void;
}) {
  const dead = c.hp <= 0;
  const acting = anim.actorId === c.id;
  const hurt = anim.hit.has(c.id);
  const pose = hurt ? 'hurt' : acting ? 'attack' : 'idle';
  const scale = c.boss ? 9 : c.sprite === 'bat' ? 6 : 7;
  const motion = acting ? (flip ? 'lunge-left' : 'lunge-right') : hurt ? 'hit-shake' : '';
  return (
    <div className={`flex flex-col items-center w-48 relative ${selectable ? 'cursor-pointer' : ''}`} onClick={selectable ? onSelect : undefined} data-testid={`fighter-${c.id}`}>
      <div className="relative h-[240px] flex items-end justify-center w-full">
        <div className={`absolute bottom-1 w-32 h-6 rounded-[50%] ${active ? 'bg-gold/40 shadow-[0_0_30px_rgba(232,179,58,0.6)]' : 'bg-black/60'} ${selected ? 'ring-2 ring-blood' : ''}`} />
        <div key={`${anim.step}-${c.id}`} className={`relative ${dead ? 'death-fade' : motion || 'breathe'}`}>
          {classId && appearance ? (
            <HeroSprite classId={classId} appearance={appearance} scale={scale} animate={false} pose={pose} />
          ) : (
            <MonsterSprite sprite={c.sprite} scale={scale} pose={pose} className={flip ? '-scale-x-100' : ''} />
          )}
        </div>
        {floats.filter((f) => f.targetId === c.id).map((f, i) => (
          <div key={f.id} className="dmg-float absolute left-1/2 font-pixel text-2xl font-semibold" style={{ top: 40 + i * 26, color: f.color, textShadow: '2px 2px 0 #000, -1px -1px 0 #000' }}>{f.text}</div>
        ))}
      </div>
      <div className="panel p-2 w-full mt-1">
        <div className="flex justify-between text-sm mb-1"><span className={`truncate ${c.side === 'A' ? 'text-parchment' : 'text-[#ff9a8a]'}`}>{c.name}</span>{c.boss && <span className="text-xs text-blood">JEFE</span>}</div>
        <Bar value={c.hp} max={c.stats.maxHp} color="#c4283b" label="Vida" testId={`hp-${c.id}`} />
        {c.stats.maxMp > 0 && <div className="mt-1"><Bar value={c.mp} max={c.stats.maxMp} color="#3d7be0" label={c.resourceName} /></div>}
        <div className="flex flex-wrap gap-1 mt-1 min-h-[20px]">
          {c.defending && <span className="text-[10px] px-1 border border-stone-500">En guardia</span>}
          {c.statuses.map((s) => (
            <span key={s.id} className="text-[10px] px-1 border" style={{ borderColor: STATUSES[s.id].color, color: STATUSES[s.id].color }} title={STATUSES[s.id].description}>{STATUSES[s.id].name} {s.turns}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Result() {
  const combat = useGame((s) => s.combat)!;
  const o = combat.state.outcome;
  const r = combat.rewards;
  const duel = combat.kind === 'duel';
  const title = o === 'victory' ? (duel ? '¡Ganas el duelo!' : '¡Victoria!') : o === 'fled' ? 'Has escapado' : duel ? 'Kael gana el duelo' : 'Has caído';
  const color = o === 'victory' ? 'text-gold' : o === 'fled' ? 'text-stone-300' : 'text-blood';
  return (
    <div className="flex flex-col h-full" data-testid="combat-result">
      <div className={`font-display text-3xl ${color}`}>{title}</div>
      {r && (
        <div className="mt-2 text-sm space-y-1">
          <div><span className="text-arcane">+{r.xp} XP</span>{r.gold > 0 && <span className="text-gold"> · +{r.gold} oro</span>}</div>
          {r.items.length > 0 && (
            <div className="flex flex-wrap gap-1 items-center">
              <span className="text-stone-300 mr-1">Botín:</span>
              {r.items.map((it) => <span key={it.uid} className="flex items-center gap-1 bg-black/30 px-1"><ItemIcon itemId={it.itemId} size={20} />{getItem(it.itemId).name}{it.qty > 1 ? ` x${it.qty}` : ''}</span>)}
            </div>
          )}
          {r.overflow && <div className="text-ember">Tu mochila está llena: parte del botín quedó en el suelo.</div>}
          {duel && o !== 'victory' && <div className="font-body text-base text-stone-300">Un duelo consensuado no mata: te levantas con algo de vida.</div>}
        </div>
      )}
      {o === 'defeat' && !duel && <p className="font-body text-lg text-stone-300 mt-2">La cripta reclama tu cuerpo y todo lo que llevabas encima.</p>}
      {o === 'fled' && <p className="font-body text-lg text-stone-300 mt-2">Te alejas a toda prisa. El enemigo vuelve a su guarida… por ahora.</p>}
      <button className="btn btn-gold mt-auto self-start" onClick={() => actions.closeCombat()} data-testid="btn-combat-continue" autoFocus>Continuar <kbd className="opacity-60">Enter</kbd></button>
    </div>
  );
}
