// Controles táctiles de la mazmorra: joystick analógico (izquierda), botón de acción y poción (derecha).
// Tocar el resto de la pantalla mueve al personaje hasta ese punto (lo gestiona la escena).
import { useEffect, useRef, useState } from 'react';
import { touchStick } from '../engine/touchInput';
import { activeScene } from '../engine/DungeonScene';
import { actions, useGame } from '../state/store';
import { countItem } from '../../core/inventory';
import { ItemIcon } from './inventory';
import { TOUCH_CFG } from '../../config/touch';

const R = TOUCH_CFG.stickRadius;

/**
 * Botón de juego: con el dedo se activa al apoyarlo (pointerdown). Así responde al instante y funciona
 * con un segundo dedo mientras el pulgar sigue en el joystick: el navegador no genera «click»
 * para toques de un dedo secundario. Con ratón o teclado sigue funcionando el clic normal.
 */
function useGameButton(fire: () => void) {
  const touched = useRef(false);
  return {
    onPointerDown: (e: React.PointerEvent) => { touched.current = false; if (e.pointerType !== 'touch') return; e.preventDefault(); touched.current = true; fire(); },
    onClick: () => { if (touched.current) { touched.current = false; return; } fire(); },
  };
}

function resetStick() { touchStick.x = 0; touchStick.y = 0; touchStick.active = false; }

export function TouchControls() {
  const prompt = useGame((s) => s.hud.prompt);
  const blocked = useGame((s) => !!s.modal || !!s.combat || s.suspended);
  const potions = useGame((s) => (s.expedition ? countItem(s.expedition.backpack, 'health_potion') : 0));
  const [stick, setStick] = useState<{ ox: number; oy: number; dx: number; dy: number } | null>(null);
  const pid = useRef<number | null>(null);

  const potionBtn = useGameButton(() => { if (potions) actions.drinkPotion(); });
  const actionBtn = useGameButton(() => { if (prompt) activeScene?.interact(); });
  const release = () => { pid.current = null; setStick(null); resetStick(); };

  // Soltar el joystick si se abre un menú o un combate, si la app pasa a segundo plano
  // (llamada, notificación) o al desmontar: si no, el personaje seguiría andando solo.
  useEffect(() => { if (blocked) release(); }, [blocked]);
  useEffect(() => {
    const onHide = () => { if (document.hidden) release(); };
    window.addEventListener('blur', release);
    document.addEventListener('visibilitychange', onHide);
    return () => { window.removeEventListener('blur', release); document.removeEventListener('visibilitychange', onHide); resetStick(); };
  }, []);

  if (blocked) return null;

  return (
    <>
      {/* Zona del joystick: aparece donde apoyas el pulgar */}
      <div
        className="absolute left-0 bottom-0 z-20 touch-none select-none" data-testid="touch-stick-zone"
        style={{ width: `${TOUCH_CFG.stickZoneW * 100}%`, height: `${TOUCH_CFG.stickZoneH * 100}%` }}
        onPointerDown={(e) => {
          if (pid.current !== null) return;
          e.preventDefault();
          pid.current = e.pointerId;
          try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* algunos navegadores no lo permiten */ }
          setStick({ ox: e.clientX, oy: e.clientY, dx: 0, dy: 0 }); touchStick.active = true;
        }}
        onPointerMove={(e) => {
          if (e.pointerId !== pid.current) return;
          setStick((st) => {
            if (!st) return st;
            let dx = e.clientX - st.ox, dy = e.clientY - st.oy;
            const d = Math.hypot(dx, dy);
            if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R; }
            touchStick.x = dx / R; touchStick.y = dy / R;
            return { ...st, dx, dy };
          });
        }}
        onPointerUp={(e) => e.pointerId === pid.current && release()}
        onPointerCancel={(e) => e.pointerId === pid.current && release()}
        onLostPointerCapture={(e) => e.pointerId === pid.current && release()}
      >
        {!stick && (
          <div className="absolute left-[max(2rem,env(safe-area-inset-left))] bottom-8 rounded-full border-2 border-white/20 bg-white/5 pointer-events-none flex items-center justify-center"
            style={{ width: R * 2, height: R * 2 }} data-testid="touch-stick-base">
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
      <div className="absolute bottom-5 z-20 flex items-end gap-3 select-none" style={{ right: 'max(1rem, env(safe-area-inset-right))' }}>
        <button className={`touch-btn ${potions ? '' : 'is-idle'}`} style={{ width: TOUCH_CFG.potionBtn, height: TOUCH_CFG.potionBtn }} {...potionBtn} aria-disabled={!potions} aria-label={`Beber poción (${potions})`} data-testid="touch-potion">
          <ItemIcon itemId="health_potion" size={28} />
          <span className="absolute -top-1 -right-1 text-[11px] bg-black/80 px-1 border border-stone-600">{potions}</span>
        </button>
        <button className={`touch-btn text-sm ${prompt ? 'is-ready' : 'is-idle'}`} style={{ width: TOUCH_CFG.actionBtn, height: TOUCH_CFG.actionBtn }}
          {...actionBtn} aria-disabled={!prompt} aria-label={prompt ?? 'Usar (no hay nada cerca)'} data-testid="touch-action">
          Usar
        </button>
      </div>
    </>
  );
}
