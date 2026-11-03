// Medidas de los controles táctiles. Todo lo que se toca mide al menos 44 px (guía de Apple/Google).
export const TOUCH_CFG = {
  /** Radio del joystick en px: lo que puede alejarse el pulgar del centro. */
  stickRadius: 56,
  /** Zona donde se puede apoyar el pulgar para el joystick (fracción de la pantalla). */
  stickZoneW: 0.42,
  stickZoneH: 0.62,
  /** Por debajo de este empuje (0..1) el joystick no mueve: evita derivas al apoyar el dedo. */
  stickDeadZone: 0.15,
  /** Tamaños de los botones de la derecha (px). */
  actionBtn: 80,
  potionBtn: 56,
  minTarget: 44,
  /** Mantener pulsado para ver la ficha de una acción (ms) y cuánto puede moverse el dedo mientras. */
  longPressMs: 450,
  longPressSlop: 12,
};
