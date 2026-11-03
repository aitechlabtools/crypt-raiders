// Medidas de los controles táctiles. Todo lo que se toca mide al menos 44 px (guía de Apple/Google).
// Dos tamaños: «móvil» (pantalla baja, hasta 520 px de alto en horizontal) y «tableta» (más alta).
import { useEffect, useState } from 'react';

export type TouchSize = 'phone' | 'tablet';

export const TOUCH_CFG = {
  /** Altura máxima (px) para considerar la pantalla «de móvil». Por encima, medidas de tableta. */
  phoneMaxHeight: 520,
  /** Diámetro de la base del joystick y del pomo (px). */
  stickBase: { phone: 120, tablet: 150 },
  stickKnob: { phone: 44, tablet: 56 },
  /** Zona donde se puede apoyar el pulgar para el joystick (fracción de la pantalla). */
  stickZoneW: 0.42,
  stickZoneH: 0.62,
  /** Por debajo de este empuje (0..1) el joystick no mueve: evita derivas al apoyar el dedo. */
  stickDeadZone: 0.15,
  /** Botones de la derecha (px) y separación entre ellos. */
  actionBtn: 72,
  potionBtn: 52,
  btnGap: 12,
  /** Iconos de la barra superior (inventario, menú, pantalla completa). */
  hudIcon: 44,
  minTarget: 44,
  /** Margen mínimo a los bordes; si el móvil tiene notch o barra de gestos, se usa la zona segura. */
  edge: { phone: 12, tablet: 20 },
  /** Mantener pulsado para ver la ficha de una acción (ms) y cuánto puede moverse el dedo mientras. */
  longPressMs: 450,
  longPressSlop: 12,
};

export function touchSizeFor(height: number): TouchSize {
  return height <= TOUCH_CFG.phoneMaxHeight ? 'phone' : 'tablet';
}

/** Hook: «phone» o «tableta» según la altura actual de la ventana (cambia al girar o redimensionar). */
export function useTouchSize(): TouchSize {
  const [size, setSize] = useState<TouchSize>(() => touchSizeFor(typeof window === 'undefined' ? 800 : window.innerHeight));
  useEffect(() => {
    const upd = () => setSize(touchSizeFor(window.innerHeight));
    window.addEventListener('resize', upd);
    return () => window.removeEventListener('resize', upd);
  }, []);
  return size;
}

/** Distancia a un borde respetando la zona segura (notch, barra de gestos). */
export const safe = (side: 'top' | 'right' | 'bottom' | 'left', px: number) => `max(${px}px, env(safe-area-inset-${side}))`;
