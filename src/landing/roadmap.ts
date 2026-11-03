// Hoja de ruta de la landing. Para mover un punto de columna, corta la línea y pégala en otra lista.
// No hace falta tocar el diseño (App.tsx): las columnas se dibujan solas a partir de estos datos.

export interface RoadmapColumn {
  id: 'ahora' | 'pronto' | 'multijugador';
  title: string;
  status: string;
  /** Icono pixel art del juego (iconUrl) hasta que exista el definitivo. */
  icon: string;
  items: string[];
}

export const ROADMAP: RoadmapColumn[] = [
  {
    id: 'ahora',
    title: 'Ya en el juego',
    status: 'Disponible ahora',
    icon: 'key',
    items: [
      'Guerrero y Mago',
      'Mazmorra, Cripta e Infierno, hasta el nivel 100',
      'Combate por turnos: cada arma te da sus habilidades',
      'Mercaderes con misiones, reputación, forja y mercenarios',
      'Cofres con llave, minería y botín que se ve en tu personaje',
      'Tienda de atuendos con oro del juego, sin ventajas',
      'Jugable en ordenador y en el móvil, a pantalla completa',
    ],
  },
  {
    id: 'pronto',
    title: 'Próximamente',
    status: 'En desarrollo · un jugador',
    icon: 'staff_fire',
    items: [
      'Dos clases nuevas: Pícaro y Clérigo',
      'Más armas y piezas, con sus propias habilidades',
      'Más salas, criaturas y jefes en cada zona',
      'Más atuendos, siempre solo estéticos',
      'Arte y música definitivos',
      'Guardado en la nube para jugar en varios dispositivos',
      'Crypt Raiders: VarkHollow en Steam (Windows)',
    ],
  },
  {
    id: 'multijugador',
    title: 'Multijugador',
    status: 'El gran objetivo · más adelante',
    icon: 'dagger',
    items: [
      'Cooperativo: baja a las criptas en grupo',
      'Extracción PvPvE: otros saqueadores en tu misma cripta',
      'Duelos y arena',
      'Comercio entre jugadores',
      'Hermandades',
      'Clasificaciones por temporada',
    ],
  },
];

export const ROADMAP_NOTE = 'La hoja de ruta puede cambiar y no tiene fechas cerradas. Lo que está en la primera columna, ya lo puedes jugar.';
