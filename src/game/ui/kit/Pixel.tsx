// Pixel art a escala ENTERA según el formato (escritorio, tableta, móvil). Nunca a escalas con decimales.
import { UI, useLayout } from '../../../config/ui';

export type ScaleKey = keyof typeof UI.scale;

/** Escala entera del pixel art para este tipo de imagen en el formato actual. */
export function usePixelScale(key: ScaleKey): number {
  const layout = useLayout();
  return UI.scale[key][layout];
}
