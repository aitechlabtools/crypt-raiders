// Personaje (opción D): Atributos con desglose · tu héroe con sus habilidades en arco · lista de habilidades por origen.
// Solo informa: no se compra ni se mejora nada (no hay talentos). Las habilidades salen de tu clase, tu arma y tu
// secundaria, así que cambian en cuanto cambias de equipo en el Alijo.
// En móvil: segmentos «Atributos» y «Habilidades».
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../state/store';
import { CLASSES, STAT_LABELS } from '../../../core/data/classes';
import { computeStats, baseStats, xpForNextLevel } from '../../../core/stats';
import { STAT_KEYS, type Stats } from '../../../core/types';
import { combatLoadout, type SkillGroup } from '../../../core/loadout';
import { getSkill } from '../../../core/data/skills';
import { getEnemy } from '../../../core/data/enemies';
import { PlayerSprite } from '../common';
import { ActionIcon } from '../combatActions';
import { Panel, Segmented, usePixelScale } from '../kit';
import { useLayout } from '../../../config/ui';
import { ClassSkillCards } from '../ClassSkills';

/** Máximo de habilidades en el arco (si hubiera más, se ven todas en la lista). */
const ARC_MAX = 8;
const SRC_COLOR: Record<SkillGroup['source'] | 'basic', string> = { basic: '#d9d3c1', class: '#e8b33a', weapon: '#c79bff', offhand: '#9fe3ff' };
const SRC_LABEL: Record<SkillGroup['source'], string> = { class: 'Clase', weapon: 'Arma', offhand: 'Secundaria' };

interface Node { id: string; name: string; desc: string; cost: number; fx: string; source: SkillGroup['source'] | 'basic'; group: string }

export function Personaje() {
  const profile = useGame((s) => s.profile)!;
  const layout = useLayout();
  const phone = layout === 'phone';
  const [view, setView] = useState<'attrs' | 'skills' | 'class'>('skills');
  const [focus, setFocus] = useState<string | null>(null);
  const ch = profile.character;
  const cls = CLASSES[ch.classId];
  const kit = combatLoadout(ch.classId, profile.equipment, profile.classSkills.equipped);
  const res = cls.resourceName.toLowerCase();
  const nodes: Node[] = [
    { id: 'basic', name: kit.basicAttack.name, desc: 'Ataque básico del arma que llevas. No gasta nada.', cost: 0, fx: kit.basicAttack.fx ?? 'slash', source: 'basic', group: 'Ataque básico' },
    ...kit.groups.flatMap((g) => g.skills.map((id) => { const sk = getSkill(id); return { id, name: sk.name, desc: sk.description, cost: sk.cost, fx: sk.fx ?? 'slash', source: g.source, group: g.label }; })),
  ];

  const attrs = <Attributes />;
  const list = <SkillList nodes={nodes} groups={kit.groups} res={res} focus={focus} onFocus={setFocus} />;
  const arc = <SkillArc nodes={nodes.slice(0, ARC_MAX)} focus={focus} onFocus={setFocus} compact={phone} />;
  const pad = { padding: '0 max(var(--pad), env(safe-area-inset-right)) var(--pad) max(var(--pad), env(safe-area-inset-left))', gap: 'var(--gap)' } as const;

  if (phone) {
    return (
      <div className="h-full flex flex-col items-center" style={pad} data-testid="screen-character">
        <Segmented options={[{ id: 'attrs', label: 'Atributos' }, { id: 'skills', label: 'Habilidades' }, { id: 'class', label: 'De clase' }]} value={view} onChange={setView} testId="character-seg" />
        {view === 'attrs'
          ? <Panel className="flex-1 min-h-0 w-full max-w-xl" bodyClassName="overflow-y-auto scroll-thin" testId="character-attrs">{attrs}</Panel>
          : view === 'class'
          ? <Panel className="flex-1 min-h-0 w-full max-w-xl" bodyClassName="overflow-y-auto scroll-thin" testId="character-class">{<ClassSkillCards compact />}</Panel>
          : (
            <div className="flex-1 min-h-0 w-full grid" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 'var(--gap)' }}>
              <div className="min-h-0 relative">{arc}</div>
              <Panel title="Habilidades" className="min-h-0" bodyClassName="overflow-y-auto scroll-thin" testId="character-skills">{list}</Panel>
            </div>
          )}
      </div>
    );
  }

  const side = layout === 'tablet' ? 300 : 380;
  return (
    <div className="h-full grid" style={{ ...pad, gridTemplateColumns: `${side}px minmax(0,1fr) ${side}px` }} data-testid="screen-character">
      <Panel title="Atributos" className="min-h-0" bodyClassName="overflow-y-auto scroll-thin" testId="character-attrs">{attrs}</Panel>
      <div className="min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 relative">{arc}</div>
        <p className="font-body text-stone-400 text-center text-[15px] leading-snug max-w-lg mx-auto pt-2">Los ataques especiales vienen de lo que empuñas en cada mano; cámbialos en el Alijo. La habilidad de clase la eliges a la derecha.</p>
      </div>
      <div className="min-h-0 flex flex-col" style={{ gap: 'var(--gap)' }}>
        <Panel title="Habilidad de clase" className="min-h-0 flex-[3]" bodyClassName="overflow-y-auto scroll-thin" testId="character-class">{<ClassSkillCards />}</Panel>
        <Panel title="Habilidades" className="min-h-0 flex-[2]" bodyClassName="overflow-y-auto scroll-thin" testId="character-skills">{list}</Panel>
      </div>
    </div>
  );
}

/** Nivel, atributos con lo que suma el equipo, desglose base/equipo y trayectoria. */
function Attributes() {
  const profile = useGame((s) => s.profile)!;
  const ch = profile.character;
  const cls = CLASSES[ch.classId];
  const stats = computeStats(ch.classId, ch.level, profile.equipment);
  const base = baseStats(ch.classId, ch.level);
  const label = (k: keyof Stats) => (k === 'maxMp' ? cls.resourceName : STAT_LABELS[k]);
  const need = xpForNextLevel(ch.level);
  const row = 'flex justify-between py-1.5 border-b border-stone-700 font-body text-[15px]';
  return (
    <div className="font-body">
      <div className="flex items-baseline justify-between">
        <span className="font-display text-xl text-parchment">Nivel {ch.level}</span>
        <span className="text-[11px] text-stone-400">{ch.xp} / {need} XP</span>
      </div>
      <div className="h-1.5 bg-stone-800 mt-1 mb-2"><div className="h-full bg-arcane" style={{ width: `${Math.min(100, (ch.xp / need) * 100)}%` }} /></div>
      <div data-testid="character-stats">
        {STAT_KEYS.map((k) => {
          const bonus = stats[k] - base[k];
          return (
            <div key={k} className={row} data-stat={k}>
              <span className="text-stone-300">{label(k)}</span>
              <span>{stats[k]}{bonus !== 0 && <span className={bonus > 0 ? 'text-heal' : 'text-blood'}> ({bonus > 0 ? '+' : ''}{bonus})</span>}</span>
            </div>
          );
        })}
      </div>
      <h3 className="ui-ptitle border-0 !py-3 !text-[12px]">Desglose</h3>
      <ul className="text-[13px] text-stone-400 space-y-0.5" data-testid="character-breakdown">
        {STAT_KEYS.map((k) => <li key={k}>{label(k)}: base {base[k]} · equipo {stats[k] - base[k] >= 0 ? '+' : ''}{stats[k] - base[k]}</li>)}
      </ul>
      <h3 className="ui-ptitle border-0 !py-3 !text-[12px]">Trayectoria</h3>
      <div data-testid="character-record">
        <div className={row}><span className="text-stone-300">Expediciones</span><span>{profile.stats.expeditions}</span></div>
        <div className={row}><span className="text-stone-300">Extracciones</span><span>{profile.stats.extractions}</span></div>
        <div className={row}><span className="text-stone-300">Muertes</span><span>{profile.stats.deaths}</span></div>
        <div className={row}><span className="text-stone-300">Criaturas derrotadas</span><span>{profile.stats.kills}</span></div>
        <div className={row}><span className="text-stone-300">Jefes derrotados</span><span className="text-right">{profile.bossesDefeated.length ? profile.bossesDefeated.map((b) => getEnemy(b).name).join(', ') : 'Ninguno'}</span></div>
      </div>
    </div>
  );
}

/** El héroe en el centro y sus habilidades repartidas en un arco a su alrededor (escala entera que cabe). */
function SkillArc({ nodes, focus, onFocus, compact }: { nodes: Node[]; focus: string | null; onFocus: (id: string | null) => void; compact: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const min = usePixelScale('heroSm');
  const [dim, setDim] = useState({ w: 600, h: 500 });
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const upd = () => { const r = el.getBoundingClientRect(); setDim({ w: r.width, h: r.height }); };
    upd();
    const ro = new ResizeObserver(upd);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const node = compact ? 44 : 56;
  const label = compact ? 0 : 22;
  // Herradura alrededor del héroe: de abajo a la izquierda, por arriba, hasta abajo a la derecha.
  // Alto que ocupa: R (arriba) + 0,31·R (abajo) + el nodo y su nombre. Ancho: 2·R + el nodo y su nombre.
  const R = Math.max(70, Math.min((dim.h - node - label - 8) / 1.31, dim.w / 2 - node / 2 - (compact ? 6 : 50)));
  // Centrado en vertical si sobra alto (cuando lo que limita es el ancho)
  const used = 1.31 * R + node + label + 8;
  const cx = dim.w / 2, cy = node / 2 + 4 + R + Math.max(0, (dim.h - used) / 2);
  // El héroe dentro de la herradura, con los pies a la altura de los extremos (escala entera).
  const scale = Math.max(min, Math.floor((R * 1.05) / 26));
  const feet = Math.min(dim.h - 6, cy + R * 0.42);
  const a0 = Math.PI * 1.1, a1 = -Math.PI * 0.1;
  const pos = (i: number) => {
    const t = nodes.length === 1 ? 0.5 : i / (nodes.length - 1);
    const a = a0 + (a1 - a0) * t;
    return { x: cx + R * Math.cos(a), y: cy - R * Math.sin(a) };
  };
  return (
    <div ref={box} className="absolute inset-0" data-testid="skill-arc">
      <svg className="absolute inset-0 pointer-events-none" width={dim.w} height={dim.h} aria-hidden>
        <path d={`M ${pos(0).x} ${pos(0).y} A ${R} ${R} 0 0 1 ${pos(nodes.length - 1).x} ${pos(nodes.length - 1).y}`} fill="none" stroke="#3a3741" strokeWidth="2" />
      </svg>
      <div className="absolute flex justify-center" style={{ left: cx, top: feet, transform: 'translate(-50%, -100%)' }}>
        <div className="pedestal" style={{ width: 22 * scale, height: 5 * scale, bottom: -2.5 * scale }} />
        <div className="relative"><PlayerSprite scale={scale} /></div>
      </div>
      {nodes.map((n, i) => {
        const p = pos(i);
        const on = focus === n.id;
        const c = SRC_COLOR[n.source];
        return (
          <button key={n.id} className="absolute grid place-items-center" style={{ left: p.x, top: p.y, width: node, height: node, transform: 'translate(-50%, -50%)' }}
            onClick={() => onFocus(on ? null : n.id)} onPointerEnter={(e) => e.pointerType === 'mouse' && onFocus(n.id)}
            aria-label={`${n.name}: ${n.desc}`} aria-pressed={on} data-testid={`arc-${n.id}`}>
            <span className="grid place-items-center rotate-45 border-2 bg-[#0d0c11]" style={{ width: node * 0.72, height: node * 0.72, borderColor: on ? '#e8b33a' : c + '99', boxShadow: on ? `0 0 16px ${c}` : undefined }}>
              <span className="-rotate-45"><ActionIcon fx={n.fx} color={c} size={compact ? 18 : 24} /></span>
            </span>
            {!compact && <span className={`absolute left-1/2 -translate-x-1/2 top-full text-[11px] whitespace-nowrap ${on ? 'text-gold' : 'text-stone-300'}`}>{n.name}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Lista de habilidades agrupadas por origen: clase, arma (con su ataque básico) y secundaria. */
function SkillList({ nodes, groups, res, focus, onFocus }: { nodes: Node[]; groups: SkillGroup[]; res: string; focus: string | null; onFocus: (id: string | null) => void }) {
  const basic = nodes[0];
  return (
    <div className="space-y-3 font-body">
      {groups.map((g) => (
        <section key={g.source}>
          <h3 className="text-[11px] tracking-[0.15em] uppercase text-stone-400 mb-1">{SRC_LABEL[g.source]} · <span className="text-stone-300 normal-case tracking-normal">{g.label}</span></h3>
          {g.source === 'weapon' && <Entry n={basic} res={res} focus={focus} onFocus={onFocus} />}
          {g.skills.map((id) => <Entry key={id} n={nodes.find((x) => x.id === id)!} res={res} focus={focus} onFocus={onFocus} />)}
        </section>
      ))}
      {!groups.some((g) => g.source === 'offhand') && <p className="text-[13px] text-stone-500 italic">Sin escudo ni tomo: no tienes habilidades defensivas.</p>}
    </div>
  );
}

function Entry({ n, res, focus, onFocus }: { n: Node; res: string; focus: string | null; onFocus: (id: string | null) => void }) {
  const on = focus === n.id;
  const c = SRC_COLOR[n.source];
  return (
    <button className={`w-full text-left flex gap-3 items-start p-2 border ${on ? 'border-gold bg-[#2a2116]' : 'border-transparent'}`} onClick={() => onFocus(on ? null : n.id)} data-testid={`skill-${n.id}`}>
      <span className="grid place-items-center rotate-45 border-2 bg-[#0d0c11] shrink-0 mt-1" style={{ width: 26, height: 26, borderColor: c + '99' }}><span className="-rotate-45"><ActionIcon fx={n.fx} color={c} size={14} /></span></span>
      <span className="min-w-0 flex-1">
        <span className="flex justify-between gap-2"><span className="font-display text-parchment">{n.name}</span><span className="text-[11px] text-stone-400 whitespace-nowrap">{n.cost ? `${n.cost} ${res}` : 'sin coste'}</span></span>
        <span className="block text-[14px] text-stone-300 leading-snug">{n.desc}</span>
      </span>
    </button>
  );
}
