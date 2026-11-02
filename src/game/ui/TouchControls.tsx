// Controles táctiles de la mazmorra: joystick analógico (izquierda), botón de acción y poción (derecha).
// Tocar el resto de la pantalla mueve al personaje hasta ese punto (lo gestiona la escena).
import { useRef, useState } from 'react';
import { touchStick } from '../engine/touchInput';
import { activeScene } from '../engine/DungeonScene';
import { actions, useGame } from '../state/store';
import { countItem } from '../../core/inventory';
import { ItemIcon } from './inventory';

const R = 56; // radio del joystick en px

export function TouchControls() {
  const prompt = useGame((s) => s.hud.prompt);
  const blocked = useGame((s) => !!s.modal || !!s.combat);
  const potions = useGame((s) => (s.expedition ? countItem(s.expedition.backpack, 'health_potion') : 0));
  const [stick, setStick] = useState<{ ox: number; oy: number; dx: number; dy: number } | null>(null);
  const pid = useRef<number | null>(null);

  const release = () => {
    pid.current = null; setStick(null);
    touchStick.x = 0; touchStick.y = 0; touchStick.active = false;
  };
  if (blocked) { if (touchStick.active) release(); return null; }

  return (
    <>
      {/* Zona del joystick: aparece donde apoyas el pulgar */}
      <div
        className="absolute left-0 bottom-0 w-[42%] h-[62%] z-20 touch-none" data-testid="touch-stick-zone"
        onPointerDown={(e) => {
          if (pid.current !== null) return;
          pid.current = e.pointerId; (e.target as HTMLElement).setPointerCapture(e.pointerId);
          setStick({ ox: e.clientX, oy: e.clientY, dx: 0, dy: 0 }); touchStick.active = true;
        }}
        onPointerMove={(e) => {
          if (e.pointerId !== pid.current || !stick) return;
          let dx = e.clientX - stick.ox, dy = e.clientY - stick.oy;
          const d = Math.hypot(dx, dy);
          if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R; }
          setStick({ ...stick, dx, dy });
          touchStick.x = dx / R; touchStick.y = dy / R;
        }}
        onPointerUp={(e) => e.pointerId === pid.current && release()}
        onPointerCancel={(e) => e.pointerId === pid.current && release()}
      >
        {!stick && (
          <div className="absolute left-8 bottom-8 w-28 h-28 rounded-full border-2 border-white/15 bg-white/5 pointer-events-none flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/15" />
          </div>
        )}
      </div>
      {stick && (
        <div className="fixed z-30 pointer-events-none rounded-full border-2 border-white/30 bg-black/30" style={{ left: stick.ox - R, top: stick.oy - R, width: R * 2, height: R * 2 }} data-testid="touch-stick">
          <div className="absolute w-12 h-12 rounded-full bg-gold/70 border-2 border-gold shadow-[0_0_16px_#e8b33a88]" style={{ left: R - 24 + stick.dx, top: R - 24 + stick.dy }} />
        </div>
      )}

      {/* Botones de la derecha */}
      <div className="absolute right-4 bottom-5 z-20 flex items-end gap-3">
        <button className="touch-btn w-14 h-14" onClick={() => actions.drinkPotion()} disabled={!potions} aria-label={`Beber poción (${potions})`} data-testid="touch-potion">
          <ItemIcon itemId="health_potion" size={28} />
          <span className="absolute -top-1 -right-1 text-[11px] bg-black/80 px-1 border border-stone-600">{potions}</span>
        </button>
        <button className={`touch-btn w-20 h-20 text-sm ${prompt ? 'is-ready' : ''}`} onClick={() => activeScene?.interact()} disabled={!prompt} aria-label={prompt ?? 'Nada cerca'} data-testid="touch-action">
          {prompt ? 'Usar' : '·'}
        </button>
      </div>
    </>
  );
}
