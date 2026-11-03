// Iconos provisionales de la barra táctil (12×12 en rejilla de píxeles, escalados a entero).
// Se sustituirán por los gráficos definitivos del usuario (ver la lista de gráficos del plan).
const PATHS: Record<'bag' | 'menu', string> = {
  // Mochila: asa, cuerpo y solapa
  bag: 'M4 1h4v1H4zM3 2h1v2H3zM8 2h1v2H8zM2 4h8v1H2zM1 5h1v6H1zM10 5h1v6h-1zM2 11h8v1H2zM4 6h4v2H4z',
  // Menú: tres barras
  menu: 'M1 2h10v2H1zM1 5h10v2H1zM1 8h10v2H1z',
};

export function HudIcon({ name, px = 24 }: { name: keyof typeof PATHS; px?: number }) {
  return (
    <svg viewBox="0 0 12 12" width={px} height={px} className="shrink-0" fill="currentColor" shapeRendering="crispEdges" aria-hidden>
      <path d={PATHS[name]} />
    </svg>
  );
}
