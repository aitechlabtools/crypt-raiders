// Habilidades de clase: tarjetas para elegir qué desbloquear (a los niveles 20, 40, 60 y 80) y cuál llevar equipada.
// Se usa en Personaje y en el aviso que sale en el pueblo cuando hay un desbloqueo pendiente.
import { useState } from 'react';
import { actions, useGame } from '../state/store';
import { CLASSES } from '../../core/data/classes';
import { getSkill } from '../../core/data/skills';
import { pendingUnlocks } from '../../core/classSkills';
import { CLASS_UNLOCK_LEVELS } from '../../config/progression';
import { ActionIcon } from './combatActions';
import { Modal } from './common';

export function ClassSkillCards({ compact = false }: { compact?: boolean }) {
  const profile = useGame((s) => s.profile)!;
  const cls = CLASSES[profile.character.classId];
  const pending = pendingUnlocks(profile);
  const { unlocked, equipped } = profile.classSkills;
  const res = cls.resourceName.toLowerCase();
  // Nivel del próximo desbloqueo (para las bloqueadas)
  const nextLevel = CLASS_UNLOCK_LEVELS[unlocked.length - 1];
  return (
    <div className="font-body" data-testid="class-skills">
      {pending > 0 && (
        <p className="text-gold text-[15px] mb-2" data-testid="class-pending">
          {pending === 1 ? 'Tienes un desbloqueo de clase: elige qué habilidad quieres.' : `Tienes ${pending} desbloqueos de clase: elige qué habilidades quieres.`}
        </p>
      )}
      <div className={`grid gap-2 ${compact ? 'grid-cols-1' : 'grid-cols-1'}`}>
        {cls.classSkills.map((id) => {
          const sk = getSkill(id);
          const own = unlocked.includes(id);
          const on = equipped === id;
          const state = on ? 'equipped' : own ? 'owned' : pending > 0 ? 'choose' : 'locked';
          return (
            <div key={id} className={`flex gap-3 items-start p-2 border-2 ${on ? 'border-gold bg-[#2a2116]' : state === 'choose' ? 'border-[#a56bff]' : 'border-stone-700'} ${state === 'locked' ? 'opacity-55' : ''}`} data-testid={`class-skill-${id}`} data-state={state}>
              <span className="grid place-items-center rotate-45 border-2 bg-[#0d0c11] shrink-0 mt-2 ml-1" style={{ width: 30, height: 30, borderColor: '#e8b33a99' }}><span className="-rotate-45"><ActionIcon fx={sk.fx} color="#e8b33a" size={16} /></span></span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-parchment text-[15px]">{sk.name}</span>
                  <span className="text-[11px] text-stone-400 whitespace-nowrap">{sk.cost ? `${sk.cost} ${res}` : 'sin coste'} · recarga {sk.cooldown ?? 0}</span>
                </span>
                <span className="block text-[14px] text-stone-300 leading-snug">{sk.description}</span>
                <span className="flex gap-2 mt-1.5 items-center">
                  {state === 'equipped' && <span className="text-[12px] text-gold">Equipada</span>}
                  {state === 'owned' && <button className="btn py-1 px-3 text-xs min-h-[44px] sm:min-h-0" onClick={() => actions.equipClassSkill(id)} data-testid={`btn-equip-class-${id}`}>Equipar</button>}
                  {state === 'choose' && <button className="btn btn-gold py-1 px-3 text-xs min-h-[44px] sm:min-h-0" onClick={() => actions.unlockClassSkill(id)} data-testid={`btn-unlock-class-${id}`}>Desbloquear</button>}
                  {state === 'locked' && <span className="text-[12px] text-stone-400">{nextLevel ? `Próximo desbloqueo: nivel ${nextLevel}` : 'Bloqueada'}</span>}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Aviso en el pueblo al ganar un desbloqueo: eliges cuál y te invita a equiparla para probarla. */
export function ClassUnlockNotice() {
  const profile = useGame((s) => s.profile)!;
  const [closed, setClosed] = useState(false);
  const [just, setJust] = useState<string | null>(null);
  const pending = pendingUnlocks(profile);
  // Capturas automáticas (landing, tráiler): ?debug&noclass no enseña el aviso
  const hidden = typeof window !== 'undefined' && /[?&]noclass/.test(window.location.search);
  if (hidden || closed || (!pending && !just)) return null;
  const close = () => setClosed(true);
  if (just) {
    const sk = getSkill(just);
    return (
      <Modal onClose={() => setJust(null)} testId="class-unlocked">
        <h2 className="panel-title text-xl mb-2">{sk.name}</h2>
        <p className="font-body text-lg text-stone-200">{sk.description}</p>
        <p className="font-body text-stone-300 mt-2">¿La llevas en la próxima expedición para probarla? Solo puedes llevar una habilidad de clase; la cambias cuando quieras en Personaje.</p>
        <div className="flex gap-2 mt-4 flex-wrap">
          <button className="btn btn-gold" onClick={() => { actions.equipClassSkill(just); setJust(null); }} data-testid="btn-try-class">Equiparla</button>
          <button className="btn" onClick={() => setJust(null)} data-testid="btn-later-class">Ahora no</button>
        </div>
      </Modal>
    );
  }
  const cls = CLASSES[profile.character.classId];
  const options = cls.classSkills.filter((id) => !profile.classSkills.unlocked.includes(id));
  return (
    <Modal onClose={close} testId="class-unlock">
      <h2 className="panel-title text-xl mb-1">Nuevo desbloqueo de clase</h2>
      <p className="font-body text-stone-300 mb-3">Has llegado al nivel {profile.character.level}. Elige qué habilidad de {cls.name.toLowerCase()} aprendes; las demás seguirán esperando a tus próximos desbloqueos.</p>
      <div className="grid gap-2 max-h-[55vh] overflow-y-auto scroll-thin">
        {options.map((id) => {
          const sk = getSkill(id);
          return (
            <button key={id} className="text-left flex gap-3 items-start p-2 border-2 border-stone-700 hover:border-gold min-h-[44px]" onClick={() => { if (actions.unlockClassSkill(id)) setJust(id); }} data-testid={`pick-class-${id}`}>
              <span className="grid place-items-center rotate-45 border-2 bg-[#0d0c11] shrink-0 mt-2 ml-1" style={{ width: 28, height: 28, borderColor: '#e8b33a99' }}><span className="-rotate-45"><ActionIcon fx={sk.fx} color="#e8b33a" size={15} /></span></span>
              <span className="min-w-0"><span className="font-display text-parchment block">{sk.name} <span className="text-[11px] text-stone-400 font-body">· recarga {sk.cooldown}</span></span><span className="font-body text-[14px] text-stone-300 leading-snug">{sk.description}</span></span>
            </button>
          );
        })}
      </div>
      <button className="btn mt-3" onClick={close} data-testid="btn-class-unlock-later">Elegir más tarde</button>
    </Modal>
  );
}
