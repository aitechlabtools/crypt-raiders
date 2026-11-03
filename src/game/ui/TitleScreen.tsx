import { useState } from 'react';
import { actions, useGame } from '../state/store';
import { MonsterSprite, Modal } from './common';
import { sfx, startMusic } from '../audio';
import { isTouch } from '../../shared/device';
import { canFullscreen, enterFullscreen, isFullscreen } from '../../shared/fullscreen';
import { FullscreenButton } from './FullscreenButton';

export function Logo({ size = 'text-6xl md:text-8xl' }: { size?: string }) {
  return (
    <h1 className={`font-display font-extrabold ${size} tracking-[0.12em] text-parchment title-glow leading-none`}>
      CRYPT <span className="text-blood">RAIDERS</span>
    </h1>
  );
}

export function SettingsModal({ onClose, onExit }: { onClose: () => void; onExit?: () => void }) {
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
      <div className="flex gap-2 mt-4 flex-wrap">
        <button className="btn" onClick={onClose}>Cerrar</button>
        {onExit && <button className="btn" onClick={() => { onClose(); onExit(); }} data-testid="btn-exit-title">Salir al título</button>}
      </div>
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

/** Crear personaje: la pantalla vive en screens/CrearPersonaje.tsx (opción D, tres columnas). */
export { CrearPersonaje as CreateScreen } from './screens/CrearPersonaje';
