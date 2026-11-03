// ════════════════════════════════════════════════════════════════════
// Medidas de la interfaz de los menús: puntos de corte, tamaños y escalas de pixel art.
// Los mismos valores están como variables CSS en game.css (bloque «Base de interfaz»).
// Si cambias algo aquí, cámbialo también allí. Guía completa: docs/guia-interfaz.md
//
//   · Escritorio → ancho ≥ 1280 px
//   · Tableta    → ancho < 1280 px y alto > 520 px
//   · Móvil      → alto ≤ 520 px (móvil en horizontal)
// El pixel art SIEMPRE se escala a números enteros (×2, ×3…): nunca a 2,5.
// ════════════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';

export type Layout = 'desktop' | 'tablet' | 'phone';

export const UI = {
  desktopMinWidth: 1280,
  phoneMaxHeight: 520,
  /** Alto de la barra de pestañas. */
  navH: { desktop: 68, tablet: 60, phone: 52 },
  /** Margen exterior y separación entre paneles. */
  pad: { desktop: 24, tablet: 18, phone: 10 },
  gap: { desktop: 16, tablet: 12, phone: 8 },
  /** Casilla de inventario y casilla de arma. */
  slot: { desktop: 52, tablet: 52, phone: 44 },
  slotBig: { desktop: 76, tablet: 72, phone: 56 },
  /** Mínimo para tocar con el dedo. */
  touch: 44,
  /** Botón normal y botón principal (Descender, Confirmar). */
  btnH: { desktop: 48, tablet: 48, phone: 44 },
  ctaH: { desktop: 72, tablet: 64, phone: 52 },
  /** Escalas enteras del pixel art. */
  scale: {
    hero: { desktop: 14, tablet: 10, phone: 5 },    // héroe en Jugar y Crear personaje
    heroSm: { desktop: 6, tablet: 5, phone: 3 },     // héroe en Alijo y Personaje
    portrait: { desktop: 4, tablet: 3, phone: 2 },   // retratos de clase
    vendor: { desktop: 6, tablet: 5, phone: 3 },     // mercaderes en sus tarjetas
    nav: { desktop: 2, tablet: 2, phone: 1 },        // retrato de la barra
  },
} as const;

export function layoutFor(width: number, height: number): Layout {
  if (height <= UI.phoneMaxHeight) return 'phone';
  return width >= UI.desktopMinWidth ? 'desktop' : 'tablet';
}

/** Hook: «desktop», «tablet» o «phone» según el tamaño actual de la ventana. */
export function useLayout(): Layout {
  const get = () => (typeof window === 'undefined' ? 'desktop' : layoutFor(window.innerWidth, window.innerHeight));
  const [l, setL] = useState<Layout>(get);
  useEffect(() => {
    const upd = () => setL(get());
    window.addEventListener('resize', upd);
    return () => window.removeEventListener('resize', upd);
  }, []);
  return l;
}

/** Valor de una medida para el formato actual. */
export function sized<T>(v: Record<Layout, T>, layout: Layout): T {
  return v[layout];
}
