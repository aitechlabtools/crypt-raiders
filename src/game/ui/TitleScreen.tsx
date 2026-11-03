import { useState } from 'react';
import { actions, useGame } from '../state/store';
import { CLASSES } from '../../core/data/classes';
import type { ClassId } from '../../core/types';
import { CLOAK_COLORS, CLOAK_NAMES, SKIN_COLORS, SKIN_NAMES } from '../../shared/palette';
import { HeroSprite, MonsterSprite, Modal, LoadoutPanel } from './common';
import { starterEquipment } from '../../shared/gearLook';
import { StatsList } from './inventory';
import { baseStats } from '../../core/stats';
import { sfx, startMusic } from '../audio';
import { isTouch } from '../../shared/device';
import { canFullscreen, enterFullscreen, isFullscreen } from '../../shared/fullscreen';
import { FullscreenButton } from './FullscreenButton';

export function Logo({ size = 'text-6xl md:text-8xl' }: { size?: string }) {
  return (
    <h1 className={`font-display font-extrabold ${size} tracking-[0.12em] text-parchment title-glow leading-none`}>
      DREAD<span className="text-blood">BOUND</span>
    </h1>
  );
}

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const profile = useGame((s) => s.profile);
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <Modal onClose={onClose} testId="settings">
      <h2 className="panel-title text-xl mb-4">Ajustes</h2>
      {profile ? (
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm text-stone-300">Volumen general: {Math.round(profile.settings.volume * 100)}%</span>
            <input type="range" min={0} max={1} step={0.05} value={profile.settings.volume} onChange={(e) => actions.setSettings({ volume: +e.target.value })} className="w-full accent-[#e8b33a]" />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={profile.settings.music} onChange={(e) => actions.setSettings({ music: e.target.checked })} className="accent-[#e8b33a] w-4 h-4" />
            <span>Música ambiental</span>
          </label>
          <div className="pt-3 border-t border-stone-700">
            {!confirmDelete ? (
              <button className="btn btn-danger text-sm" onClick={() => setConfirmDelete(true)}>Borrar personaje y empezar de cero</button>
            ) : (
              <div className="space-y-2">
                <p className="font-body text-lg">¿Seguro? Se borrará {profile.character.name}, su almacén y todo su progreso. No se puede deshacer.</p>
                <div className="flex gap-2">
                  <button className="btn btn-danger" onClick={() => { void actions.deleteCharacter(); onClose(); }}>Sí, borrar</button>
                  <button className="btn" onClick={() => setConfirmDelete(false)}>Cancelar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="font-body text-lg">Crea un personaje para ajustar el sonido. El juego se guarda automáticamente en este navegador.</p>
      )}
      <div className="mt-5 text-xs text-stone-400 font-body text-base">Controles: WASD/flechas o clic para moverte · E interactuar · Q beber poción · I inventario · Esc menú · 1-5 acciones de combate.</div>
      <button className="btn mt-4" onClick={onClose}>Cerrar</button>
    </Modal>
  );
}

export function TitleScreen() {
  const profile = useGame((s) => s.profile);
  const notice = useGame((s) => s.notice);
  const [settings, setSettings] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const start = () => {
    sfx('click');
    // En táctil, «Jugar» pone el juego a pantalla completa y en horizontal (Android). El botón ⛶ lo quita.
    if (isTouch() && canFullscreen() && !isFullscreen()) void enterFullscreen();
    if (profile?.settings.music !== false) startMusic('lobby');
    actions.goto(profile ? 'lobby' : 'create');
  };
  return (
    <div className="relative h-full flex flex-col items-center justify-center overflow-hidden" style={{ background: 'radial-gradient(ellipse at 50% 60%, #1d1424 0%, #0b0910 55%, #050407 100%)' }}>
      <div className="absolute top-3 right-3 z-10"><FullscreenButton /></div>
      <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(circle at 50% 110%, rgba(196,40,59,0.35), transparent 50%)' }} />
      <div className="absolute bottom-[12%] left-[8%] hidden md:block opacity-80 breathe"><MonsterSprite sprite="skeleton" scale={7} /></div>
      <div className="absolute bottom-[12%] right-[8%] hidden md:block opacity-80 breathe" style={{ animationDelay: '0.8s' }}><MonsterSprite sprite="rival" scale={7} className="-scale-x-100" /></div>
      <div className="relative text-center fade-in px-4">
        <Logo />
        <p className="font-body italic text-xl md:text-2xl text-stone-300 mt-4">Confía en tu espada. En nadie más.</p>
        <div className="flex flex-col gap-3 mt-10 w-72 mx-auto">
          <button className="btn btn-gold text-lg py-3" onClick={start} data-testid="btn-play" autoFocus>
            {profile ? `Continuar como ${profile.character.name}` : 'Jugar'}
          </button>
          {profile && <button className="btn" onClick={() => setConfirmNew(true)}>Nuevo personaje</button>}
          <button className="btn" onClick={() => setSettings(true)} data-testid="btn-settings">Ajustes</button>
          <a className="btn text-center" href="../">Volver a la web</a>
        </div>
        <p className="mt-10 text-xs text-stone-400 max-w-md mx-auto">Demo v0.1 · Un jugador con aventureros simulados por IA. El progreso se guarda en este navegador.</p>
      </div>
      {notice && (
        <Modal onClose={() => actions.dismissNotice()}>
          <h2 className="panel-title text-lg mb-2">Expedición interrumpida</h2>
          <p className="font-body text-lg">{notice}</p>
          <button className="btn btn-gold mt-4" onClick={() => actions.dismissNotice()}>Entendido</button>
        </Modal>
      )}
      {confirmNew && (
        <Modal onClose={() => setConfirmNew(false)}>
          <h2 className="panel-title text-lg mb-2">¿Nuevo personaje?</h2>
          <p className="font-body text-lg">La demo guarda un único aventurero. Crear uno nuevo borrará a {profile?.character.name} y su almacén.</p>
          <div className="flex gap-2 mt-4">
            <button className="btn btn-danger" onClick={() => { void actions.deleteCharacter().then(() => actions.goto('create')); }}>Borrar y crear</button>
            <button className="btn" onClick={() => setConfirmNew(false)}>Cancelar</button>
          </div>
        </Modal>
      )}
      {settings && <SettingsModal onClose={() => setSettings(false)} />}
    </div>
  );
}

export function CreateScreen() {
  const [name, setName] = useState('');
  const [cls, setCls] = useState<ClassId>('warrior');
  const [cloak, setCloak] = useState(0);
  const [skin, setSkin] = useState(0);
  const def = CLASSES[cls];
  const ap = { cloak, skin };
  const valid = name.trim().length >= 2;
  return (
    <div className="h-full overflow-y-auto scroll-thin" style={{ background: 'radial-gradient(ellipse at 50% 30%, #1a1520 0%, #07060a 70%)' }}>
      <div className="max-w-6xl mx-auto p-4 md:p-8 fade-in">
        <h2 className="panel-title text-2xl md:text-3xl text-center mb-1">Forja a tu aventurero</h2>
        <p className="text-center font-body italic text-stone-300 text-lg mb-6">Las criptas no recuerdan nombres. Tú sí.</p>
        <div className="grid md:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-6">
            <section>
              <h3 className="text-sm uppercase tracking-widest text-stone-300 mb-2">Clase</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {(Object.keys(CLASSES) as ClassId[]).map((id) => {
                  const c = CLASSES[id];
                  const active = id === cls;
                  return (
                    <button
                      key={id}
                      data-testid={`class-${id}`}
                      disabled={!c.playable}
                      onClick={() => { setCls(id); sfx('click'); }}
                      className={`panel p-3 text-left transition relative ${active ? 'pulse-gold' : ''} ${c.playable ? 'hover:brightness-125 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                      style={active ? { borderColor: '#e8b33a' } : undefined}
                    >
                      <div className="flex justify-center h-28 items-end"><HeroSprite classId={id} appearance={ap} scale={4} animate={active} /></div>
                      <div className="font-display text-lg mt-2" style={{ color: c.color }}>{c.name}</div>
                      <div className="font-body italic text-sm text-stone-300">{c.tagline}</div>
                      {!c.playable && <span className="absolute top-2 right-2 text-[10px] bg-stone-700 px-1.5 py-0.5 uppercase tracking-wider">Próximamente</span>}
                    </button>
                  );
                })}
              </div>
            </section>
            <section className="grid sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm uppercase tracking-widest text-stone-300 mb-2">Nombre</h3>
                <input
                  data-testid="name-input"
                  value={name}
                  maxLength={18}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Escribe un nombre"
                  className="w-full bg-[#0d0c11] border-2 border-stone-600 px-3 py-2 text-lg font-pixel focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <h3 className="text-sm uppercase tracking-widest text-stone-300 mb-2">Capa: {CLOAK_NAMES[cloak]}</h3>
                <div className="flex gap-2">
                  {CLOAK_COLORS.map((c, i) => (
                    <button key={c} aria-label={CLOAK_NAMES[i]} onClick={() => setCloak(i)} className={`w-9 h-9 border-2 ${cloak === i ? 'border-gold' : 'border-stone-700'}`} style={{ background: c }} />
                  ))}
                </div>
                <h3 className="text-sm uppercase tracking-widest text-stone-300 mb-2 mt-3">Piel: {SKIN_NAMES[skin]}</h3>
                <div className="flex gap-2">
                  {SKIN_COLORS.map((c, i) => (
                    <button key={c} aria-label={SKIN_NAMES[i]} onClick={() => setSkin(i)} className={`w-9 h-9 border-2 ${skin === i ? 'border-gold' : 'border-stone-700'}`} style={{ background: c }} />
                  ))}
                </div>
              </div>
            </section>
          </div>
          <aside className="panel panel-gold p-4 flex flex-col">
            <div className="flex justify-center h-44 items-end"><HeroSprite classId={cls} appearance={ap} scale={7} /></div>
            <div className="font-display text-2xl text-center mt-2" style={{ color: def.color }}>{name.trim() || def.name}</div>
            <p className="font-body text-base text-stone-300 my-3 leading-snug">{def.description}</p>
            <StatsList stats={baseStats(cls, 1)} resourceName={def.resourceName} />
            <div className="mt-3 text-sm">
              <div className="text-xs text-stone-400 mb-2">Armas: {def.weapons}</div>
              <LoadoutPanel classId={cls} equipment={starterEquipment(cls)} compact />
            </div>
            <button className="btn btn-gold mt-4 py-3 text-lg" disabled={!valid} data-testid="btn-create" onClick={() => { sfx('equip'); void actions.createCharacter(name, cls, ap); }}>
              Comenzar
            </button>
            {!valid && <span className="text-xs text-stone-400 mt-1 text-center">Escribe un nombre (mín. 2 letras)</span>}
            <button className="btn mt-2 text-sm" onClick={() => actions.goto('title')}>Volver</button>
          </aside>
        </div>
      </div>
    </div>
  );
}
