// Crear personaje (opción D): tres columnas. Izquierda: clases, capa y piel. Centro: la clase elegida en grande.
// Derecha: sobre la clase (descripción, arma, puntos fuertes y débiles, habilidades y equipo inicial).
// Abajo: Volver, el nombre del personaje y Confirmar.
import { useEffect, useRef, useState } from 'react';
import { actions, tutorialDoneOnDevice, useGame } from '../../state/store';
import { CLASSES } from '../../../core/data/classes';
import type { ClassId } from '../../../core/types';
import { CLOAK_COLORS, CLOAK_NAMES, SKIN_COLORS, SKIN_NAMES } from '../../../shared/palette';
import { HeroSprite } from '../common';
import { starterEquipment } from '../../../shared/gearLook';
import { combatLoadout } from '../../../core/loadout';
import { getSkill } from '../../../core/data/skills';
import { getItem, RARITY_INFO } from '../../../core/data/items';
import { ItemIcon } from '../inventory';
import { Panel, usePixelScale } from '../kit';
import { useLayout } from '../../../config/ui';
import { sfx } from '../../audio';

const ORDER: ClassId[] = ['warrior', 'mage', 'rogue', 'cleric'];

export function CrearPersonaje() {
  const [name, setName] = useState('');
  const [cls, setCls] = useState<ClassId>('warrior');
  const [cloak, setCloak] = useState(0);
  const [skin, setSkin] = useState(0);
  const layout = useLayout();
  const phone = layout === 'phone';
  const minScale = usePixelScale('heroSm');
  const stage = useRef<HTMLDivElement>(null);
  const heroScale = useFitScale(stage, minScale);
  const portrait = usePixelScale('portrait');
  const def = CLASSES[cls];
  const ap = { cloak, skin };
  const valid = name.trim().length >= 2;
  // Si en este navegador ya se completó el tutorial alguna vez, se puede saltar
  // Con el tutorial ya jugado por otro personaje de la partida, los nuevos empiezan directamente (pueden jugarlo si quieren)
  const accountDone = useGame((s) => s.accountTutorialDone);
  const hasRoster = useGame((s) => s.roster.length > 0);
  const canSkip = accountDone || tutorialDoneOnDevice();
  const [skip, setSkip] = useState(accountDone);
  const create = () => { if (!valid) return; sfx('equip'); void actions.createCharacter(name, cls, ap, canSkip && skip); };
  const side = phone ? 236 : layout === 'tablet' ? 268 : 340;

  return (
    <div className="h-full flex flex-col" data-testid="create-screen"
      style={{ background: 'radial-gradient(ellipse at 50% 55%, #2a1b3a 0%, #120d19 45%, #07060a 80%)', padding: 'max(var(--pad), env(safe-area-inset-top)) max(var(--pad), env(safe-area-inset-right)) max(var(--pad), env(safe-area-inset-bottom)) max(var(--pad), env(safe-area-inset-left))', gap: 'var(--gap)' }}>
      <div className="flex-1 min-h-0 grid" style={{ gridTemplateColumns: `${side}px minmax(0,1fr) ${side}px`, gap: 'var(--gap)' }}>
        {/* Clases, capa y piel */}
        <Panel title="Clases" className="min-h-0" bodyClassName="overflow-y-auto scroll-thin">
          <div className="grid grid-cols-2 gap-2">
            {ORDER.map((id) => {
              const c = CLASSES[id];
              const on = id === cls;
              return (
                <button key={id} data-testid={`class-${id}`} disabled={!c.playable} onClick={() => { setCls(id); sfx('click'); }}
                  aria-pressed={on} aria-label={c.playable ? c.name : `${c.name} (próximamente)`}
                  className={`panel p-1.5 flex flex-col items-center relative ${on ? 'border-gold' : ''} ${c.playable ? 'hover:brightness-125' : 'cursor-not-allowed'}`}
                  style={on ? { boxShadow: '0 0 0 1px #07060a, 0 0 16px #e8b33a55' } : undefined}>
                  <span className={`font-display text-xs leading-tight ${on ? 'text-gold' : 'text-stone-300'}`}>{c.name}</span>
                  {/* Retrato provisional: la parte de arriba del personaje (el definitivo, 24×24, lo dibujará el usuario) */}
                  <div className="overflow-hidden flex justify-center mt-1" style={{ height: 24 * portrait, width: 28 * portrait }}>
                    <HeroSprite classId={id} appearance={ap} scale={portrait} animate={false} className={c.playable ? '' : 'brightness-[.35] grayscale'} />
                  </div>
                  {!c.playable && <span className="absolute left-0 right-0 bottom-1 text-center text-[9px] tracking-[0.12em] uppercase bg-black/80 text-stone-300 py-0.5">Próximamente</span>}
                </button>
              );
            })}
          </div>
          <Swatches label="Capa" names={CLOAK_NAMES} colors={CLOAK_COLORS} value={cloak} onChange={setCloak} testId="cloak" />
          <Swatches label="Piel" names={SKIN_NAMES} colors={SKIN_COLORS} value={skin} onChange={setSkin} testId="skin" />
        </Panel>

        {/* La clase elegida, en grande */}
        <div className="min-h-0 flex flex-col items-center text-center overflow-hidden">
          <div className="text-[11px] tracking-[0.3em] uppercase text-stone-400">Elige tu clase</div>
          <h1 className="font-display text-parchment leading-none mt-1" style={{ fontSize: phone ? 24 : 40 }} data-testid="create-class-name">
            <span className="text-gold">{def.name[0]}</span>{def.name.slice(1)}
          </h1>
          <div className="font-body italic text-stone-300 mt-1" style={{ fontSize: phone ? 13 : 17 }}>«{def.tagline}»</div>
          <div ref={stage} className="flex-1 min-h-0 w-full flex items-center justify-center pb-2" data-testid="create-stage">
            <div className="relative flex justify-center">
              <div className="pedestal" style={{ width: 24 * heroScale, height: 6 * heroScale, bottom: -3 * heroScale }} />
              <div className="relative"><HeroSprite classId={cls} appearance={ap} scale={heroScale} /></div>
            </div>
          </div>
        </div>

        {/* Sobre la clase */}
        <Panel title="Sobre la clase" className="min-h-0" bodyClassName="overflow-y-auto scroll-thin font-body" testId="class-about">
          <p className="text-parchment leading-snug" style={{ fontSize: phone ? 13 : 16 }}>{def.description}</p>
          <div className="mt-3">
            <div className="font-display text-gold text-sm">Arma preferida</div>
            <div className="text-stone-200">{def.weapons}</div>
          </div>
          {def.pros && <ul className="mt-3 space-y-0.5 text-heal">{def.pros.map((p) => <li key={p}>+ {p}</li>)}</ul>}
          {def.cons && <ul className="mt-2 space-y-0.5 text-[#ff7a6a]">{def.cons.map((p) => <li key={p}>− {p}</li>)}</ul>}
          <StartingSkills classId={cls} />
          <div className="mt-3">
            <div className="text-xs text-stone-400 mb-1">Equipo inicial</div>
            <div className="flex flex-wrap gap-1">
              {def.starterKit.map((k) => {
                const it = getItem(k.itemId);
                return (
                  <div key={k.itemId} className="slot" title={it.name} style={{ borderColor: RARITY_INFO[it.rarity].color + 'aa' }}>
                    <ItemIcon itemId={k.itemId} size={phone ? 28 : 36} />{k.qty > 1 && <span className="qty">{k.qty}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </Panel>
      </div>

      {/* Volver · nombre · Confirmar */}
      <div className="grid items-end" style={{ gridTemplateColumns: `${side}px minmax(0,1fr) ${side}px`, gap: 'var(--gap)' }}>
        <button className="btn cta text-base self-stretch" style={{ fontSize: phone ? 14 : 18, letterSpacing: '.1em' }} onClick={() => (hasRoster ? void actions.openSelect() : actions.goto('title'))} data-testid="btn-create-back">Volver</button>
        <label className="flex flex-col items-center justify-self-center w-full max-w-sm">
          {!phone && <span className="text-[11px] tracking-[0.25em] uppercase text-stone-400 mb-1">Nombre del personaje</span>}
          <input data-testid="name-input" value={name} maxLength={18} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && create()}
            placeholder={phone ? 'Nombre del personaje' : 'Escribe un nombre'} aria-label="Nombre del personaje"
            className="w-full text-center bg-[#0d0c11] border-2 border-[#6b4a12] px-3 font-display text-parchment tracking-[0.08em] focus:outline-none focus:border-gold"
            style={{ height: 'var(--cta-h)', fontSize: phone ? 16 : 22 }} />
          {canSkip && (
            <span className="flex items-center gap-2 mt-1 text-sm text-stone-300 cursor-pointer" style={{ minHeight: 44 }}>
              <input type="checkbox" checked={skip} onChange={(e) => setSkip(e.target.checked)} className="accent-[#e8b33a] w-5 h-5" data-testid="skip-tutorial" />
              <span onClick={() => setSkip(!skip)}>Saltar el tutorial</span>
            </span>
          )}
        </label>
        <button className="btn btn-gold cta self-stretch" style={{ fontSize: phone ? 14 : 18, letterSpacing: '.1em' }} disabled={!valid} onClick={create} data-testid="btn-create"
          title={valid ? undefined : 'Escribe un nombre (mín. 2 letras)'}>Confirmar</button>
      </div>
    </div>
  );
}

/**
 * El personaje llena el hueco central: la mayor escala ENTERA que cabe (el sprite mide 20×26 y el arma sobresale),
 * dejando sitio para el círculo de los pies. Se recalcula al cambiar el tamaño de la ventana.
 */
function useFitScale(ref: React.RefObject<HTMLDivElement | null>, min: number): number {
  const [s, setS] = useState(min);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const upd = () => {
      const { width, height } = el.getBoundingClientRect();
      setS(Math.max(min, Math.floor(Math.min((height * 0.92) / 29, (width * 0.9) / 24))));
    };
    upd();
    const ro = new ResizeObserver(upd);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, min]);
  return s;
}

function Swatches({ label, names, colors, value, onChange, testId }: { label: string; names: string[]; colors: string[]; value: number; onChange: (i: number) => void; testId: string }) {
  return (
    <div className="mt-3">
      <div className="text-[11px] tracking-[0.2em] uppercase text-stone-400 mb-1">{label}: <span className="text-stone-200 normal-case tracking-normal">{names[value]}</span></div>
      <div className="flex flex-wrap gap-1.5">
        {colors.map((c, i) => (
          <button key={c} aria-label={`${label}: ${names[i]}`} aria-pressed={value === i} onClick={() => onChange(i)} data-testid={`${testId}-${i}`}
            className={`border-2 ${value === i ? 'border-gold' : 'border-stone-700'}`} style={{ background: c, width: 'var(--touch)', height: 'var(--touch)' }} />
        ))}
      </div>
    </div>
  );
}

/** Habilidades con las que empieza: la de clase y las del arma y la secundaria iniciales. */
function StartingSkills({ classId }: { classId: ClassId }) {
  const kit = combatLoadout(classId, starterEquipment(classId));
  const ids = kit.groups.flatMap((g) => g.skills);
  return (
    <div className="mt-3" data-testid="starting-skills">
      <div className="text-xs text-stone-400 mb-1">Habilidades al empezar</div>
      <div className="text-stone-200 leading-snug">{ids.map((id) => getSkill(id).name).join(' · ')}</div>
    </div>
  );
}
