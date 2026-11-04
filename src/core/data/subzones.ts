// ════════════════════════════════════════════════════════════════════
// Subzonas: cada zona se divide en tramos de 10 niveles con su escenario, sus mapas y sus criaturas.
// Todo es editable. La zona (zones/*.ts) guarda lo común: nombre, llaves de los cofres, jefe que abre la zona siguiente.
//
// Cada subzona tiene cuatro criaturas comunes, un élite y un jefe (las nuevas están en zones/subzoneEnemies.ts).
// El jefe de la última subzona de cada zona es el que abre la zona siguiente.
// ════════════════════════════════════════════════════════════════════
import type { Rarity } from '../types';
import type { ZoneDef, ZoneId } from './zones/types';
import type { MapStyle } from '../dungeonGen';
import type { DecorSprite } from '../dungeon';

export type SubzoneId =
  | 'afueras' | 'castillo' | 'calabozos'
  | 'osario' | 'catacumbas' | 'panteon'
  | 'carmesi' | 'puertas' | 'rios' | 'trono';

export interface SubzoneDef {
  id: SubzoneId;
  zone: ZoneId;
  /** Orden en todo el juego (1–10). */
  index: number;
  name: string;
  /** Una frase para la tarjeta de selección. */
  tagline: string;
  /** Niveles de la subzona: las criaturas toman tu nivel dentro de este rango. */
  levels: [number, number];
  enemies: ZoneDef['enemies'];
  elite: string;
  boss: string;
  roomNames: string[];
  dungeonNames: string[];
  bossRoom: string;
  rarity: Record<Rarity, number>;
  /** Tinte de la luz del mapa (rojo, verde, azul) hasta que cada subzona tenga sus baldosas. */
  tint: [number, number, number];
  /** Fondos de combate (ui/combatZones.ts). El primero es el del jefe. */
  backdrops: string[];
  /** Forma de los mapas (salas más grandes y pasillos anchos en exteriores; estrechos en los túneles). */
  map?: Partial<MapStyle>;
  /** Piezas de decorado que salen por las salas. */
  decor?: DecorSprite[];
}

export const SUBZONES: Record<SubzoneId, SubzoneDef> = {
  // ── La Mazmorra ──
  afueras: {
    id: 'afueras', zone: 'mazmorra', index: 1, name: 'Afueras del Bastión', levels: [1, 10],
    tagline: 'Murallas rotas, empalizadas y hogueras de bandidos bajo la niebla.',
    enemies: [{ id: 'bandit', weight: 30 }, { id: 'renegade_archer', weight: 25 }, { id: 'starving_wolf', weight: 25 }, { id: 'carrion_crow', weight: 20 }],
    elite: 'bandit_captain', boss: 'mordrek',
    roomNames: ['Camino Embarrado', 'Empalizada', 'Cobertizo Quemado', 'Puesto de Guardia', 'Brecha de la Muralla', 'Patio de las Horcas', 'Pozo Seco', 'Establos Vacíos', 'Torre Caída', 'Campamento Bandido'],
    dungeonNames: ['Las Afueras del Bastión', 'La Muralla Rota', 'El Camino de las Horcas'],
    bossRoom: 'Puerta del Castillo',
    rarity: { common: 66, uncommon: 26, rare: 7, epic: 1, legendary: 0 },
    tint: [0.86, 0.94, 1.12],
    backdrops: ['afueras', 'afueras'],
    map: { roomW: [7, 11], roomH: [6, 10], corridor: 2, rooms: [6, 8], size: [46, 40] },
    decor: ['grass', 'grass', 'stake', 'barrel', 'crate', 'rubble', 'bones'],
  },
  castillo: {
    id: 'castillo', zone: 'mazmorra', index: 2, name: 'El Bastión en ruinas', levels: [10, 20],
    tagline: 'Salones de tapices quemados y una guardia que no sabe que ha muerto.',
    enemies: [{ id: 'skeleton', weight: 30 }, { id: 'hollow_armor', weight: 25, minDepth: 1 }, { id: 'hanged_servant', weight: 25 }, { id: 'bat', weight: 20 }],
    elite: 'fallen_guard_knight', boss: 'burned_seneschal',
    roomNames: ['Gran Salón', 'Capilla del Castillo', 'Galería de Retratos', 'Cocinas', 'Armería', 'Patio de Armas', 'Biblioteca Quemada', 'Salón del Trono Vacío', 'Dormitorio de la Guardia', 'Escalera de Caracol'],
    dungeonNames: ['El Castillo de Ceniza', 'Los Salones Quemados', 'La Fortaleza de la Orden'],
    bossRoom: 'Estrado del Senescal',
    rarity: { common: 62, uncommon: 28, rare: 9, epic: 1, legendary: 0 },
    tint: [1.1, 0.96, 0.84],
    backdrops: ['castillo', 'castillo'],
    map: { roomW: [6, 10], roomH: [5, 9], corridor: 2, rooms: [7, 9], size: [44, 38] },
    decor: ['banner', 'barrel', 'candles', 'statue', 'rubble', 'crate'],
  },
  calabozos: {
    id: 'calabozos', zone: 'mazmorra', index: 3, name: 'Las mazmorras del Bastión', levels: [20, 30],
    tagline: 'Celdas, cadenas y túneles húmedos. Al fondo, el osario.',
    enemies: [{ id: 'ossuary_rat', weight: 30 }, { id: 'torturer', weight: 25, minDepth: 1 }, { id: 'mad_prisoner', weight: 25 }, { id: 'pit_worm', weight: 20 }],
    elite: 'executioner', boss: 'ossuary_lord',
    roomNames: ['Celdas de Castigo', 'Sala del Potro', 'Desagüe', 'Pozo de los Olvidados', 'Galería de Cadenas', 'Celda del Penitente', 'Cisterna Negra', 'Túnel de las Ratas', 'Osario', 'Archivo de Huesos'],
    dungeonNames: ['Los Calabozos del Castillo', 'Las Celdas sin Nombre', 'El Osario de Velmor'],
    bossRoom: 'Trono del Osario',
    rarity: { common: 56, uncommon: 30, rare: 11, epic: 3, legendary: 0 },
    tint: [0.9, 1, 0.92],
    backdrops: ['osario', 'calabozos', 'calabozos'],
    map: { roomW: [4, 7], roomH: [4, 6], corridor: 1, rooms: [8, 10], size: [40, 34] },
    decor: ['cage', 'chain', 'bones', 'skull', 'puddle', 'rubble'],
  },
  // ── La Cripta ──
  osario: {
    id: 'osario', zone: 'cripta', index: 4, name: 'El Osario de Umbravel', levels: [30, 40],
    tagline: 'Paredes de calaveras y polvo de hueso. Aquí empiezan las criptas.',
    enemies: [{ id: 'ghoul', weight: 30 }, { id: 'bone_archer', weight: 25 }, { id: 'bone_colossus', weight: 20, minDepth: 1 }, { id: 'ossuary_monk', weight: 25 }],
    elite: 'tomb_knight', boss: 'bone_abbot',
    roomNames: ['Galería de Nichos', 'Osario Mayor', 'Pasillo de Calaveras', 'Cámara de las Velas', 'Capilla de Hueso', 'Fosa Común', 'Claustro Hundido'],
    dungeonNames: ['El Osario de Umbravel', 'Las Galerías de Hueso', 'La Cripta de los Abades'],
    bossRoom: 'Altar de Hueso',
    rarity: { common: 44, uncommon: 32, rare: 18, epic: 6, legendary: 0 },
    tint: [0.82, 0.84, 0.98],
    backdrops: ['osario_umbravel', 'osario_umbravel'],
    map: { roomW: [5, 8], roomH: [5, 8], corridor: 1, rooms: [8, 10], size: [42, 36] },
    decor: ['bones', 'skull', 'skull', 'urn', 'candles', 'coffin'],
  },
  catacumbas: {
    id: 'catacumbas', zone: 'cripta', index: 5, name: 'Las Catacumbas Ahogadas', levels: [40, 50],
    tagline: 'Agua negra hasta el tobillo y lamentos bajo la niebla.',
    enemies: [{ id: 'wraith', weight: 25 }, { id: 'drowned', weight: 30 }, { id: 'crypt_leech', weight: 25 }, { id: 'mourner', weight: 20, minDepth: 1 }],
    elite: 'water_lady', boss: 'black_ferryman',
    roomNames: ['Galería Inundada', 'Cisterna de los Votos', 'Embarcadero Podrido', 'Sala de las Raíces', 'Pozo del Lamento', 'Nichos Anegados', 'Puente de Huesos'],
    dungeonNames: ['Las Catacumbas Ahogadas', 'Las Aguas Negras', 'Los Pozos de Umbravel'],
    bossRoom: 'Embarcadero del Barquero',
    rarity: { common: 40, uncommon: 32, rare: 20, epic: 7, legendary: 1 },
    tint: [0.6, 0.9, 1.12],
    backdrops: ['catacumbas', 'catacumbas'],
    map: { roomW: [5, 9], roomH: [5, 8], corridor: 2, rooms: [7, 9], size: [44, 38] },
    decor: ['puddle', 'puddle', 'roots', 'urn', 'bones', 'coffin'],
  },
  panteon: {
    id: 'panteon', zone: 'cripta', index: 6, name: 'El Panteón de los Nobles', levels: [50, 60],
    tagline: 'Mármol, oro sucio y sarcófagos labrados. Los nobles no quieren visitas.',
    enemies: [{ id: 'necro_priest', weight: 20, minDepth: 1 }, { id: 'tomb_guardian', weight: 20, minDepth: 1 }, { id: 'embalmed_noble', weight: 35 }, { id: 'marble_gargoyle', weight: 25 }],
    elite: 'spectral_duelist', boss: 'veiled_queen',
    roomNames: ['Panteón Olvidado', 'Sala de los Sarcófagos', 'Capilla del Silencio', 'Galería de Estatuas', 'Cámara del Tesoro', 'Mausoleo Dorado', 'Cripta de los Duques'],
    dungeonNames: ['El Panteón de los Nobles', 'La Necrópolis Velada', 'Los Panteones de Umbravel'],
    bossRoom: 'Trono Velado',
    rarity: { common: 36, uncommon: 32, rare: 22, epic: 8, legendary: 2 },
    tint: [0.96, 0.9, 1.14],
    backdrops: ['panteon', 'panteon'],
    map: { roomW: [7, 10], roomH: [6, 9], corridor: 2, rooms: [7, 8], size: [46, 40] },
    decor: ['statue', 'coffin', 'candles', 'urn', 'banner'],
  },
  // ── El Infierno ──
  carmesi: {
    id: 'carmesi', zone: 'infierno', index: 7, name: 'La Cripta Carmesí', levels: [60, 70],
    tagline: 'La piedra suda sangre y huele a azufre. El Infierno está cerca.',
    enemies: [{ id: 'ember_imp', weight: 25 }, { id: 'flame_cultist', weight: 25 }, { id: 'bleeding_ghoul', weight: 25 }, { id: 'flayed_penitent', weight: 25, minDepth: 1 }],
    elite: 'umbral_priest', boss: 'vharok',
    roomNames: ['Altar Profanado', 'Grieta de Brasas', 'Capilla Roja', 'Sala de la Sangre Seca', 'Nichos Calcinados', 'Pozo del Umbral'],
    dungeonNames: ['La Cripta Carmesí', 'El Umbral Rojo', 'Las Capillas Profanadas'],
    bossRoom: 'La Puerta que Sangra',
    rarity: { common: 30, uncommon: 32, rare: 26, epic: 10, legendary: 2 },
    tint: [1.28, 0.62, 0.62],
    backdrops: ['carmesi', 'carmesi'],
    map: { roomW: [5, 9], roomH: [5, 8], corridor: 1, rooms: [8, 9], size: [42, 36] },
    decor: ['candles', 'brazier', 'bones', 'coffin', 'chain', 'spikes'],
  },
  puertas: {
    id: 'puertas', zone: 'infierno', index: 8, name: 'Las Puertas del Abismo', levels: [70, 80],
    tagline: 'Roca negra, ríos de lava y puentes de obsidiana.',
    enemies: [{ id: 'abyss_hound', weight: 30 }, { id: 'sulfur_caller', weight: 20, minDepth: 1 }, { id: 'magma_elemental', weight: 25 }, { id: 'obsidian_gargoyle', weight: 25, minDepth: 1 }],
    elite: 'hound_master', boss: 'ignaroth',
    roomNames: ['Puente de Obsidiana', 'Pozo de Brasas', 'Fragua del Abismo', 'Galería de Azufre', 'Paso de las Cadenas', 'Mirador de Lava'],
    dungeonNames: ['Las Puertas del Abismo', 'La Boca de Fuego', 'El Paso de Obsidiana'],
    bossRoom: 'La Gran Fragua',
    rarity: { common: 24, uncommon: 32, rare: 28, epic: 13, legendary: 3 },
    tint: [1.32, 0.74, 0.54],
    backdrops: ['puertas', 'puertas'],
    map: { roomW: [6, 10], roomH: [6, 9], corridor: 2, rooms: [7, 9], size: [46, 40] },
    decor: ['lava', 'crystal', 'brazier', 'rubble', 'chain', 'spikes'],
  },
  rios: {
    id: 'rios', zone: 'infierno', index: 9, name: 'Los Ríos de Fuego', levels: [80, 90],
    tagline: 'Lagos de lava, islas de roca y ceniza que no deja de caer.',
    enemies: [{ id: 'pit_temptress', weight: 20, minDepth: 1 }, { id: 'hell_knight', weight: 20, minDepth: 1 }, { id: 'flayer', weight: 30 }, { id: 'burning_soul', weight: 30 }],
    elite: 'chain_warden', boss: 'sulfur_beast',
    roomNames: ['Lago de Lava', 'Isla de Ceniza', 'Cámara del Tormento', 'Pozo de Azufre', 'Ruinas Ardientes', 'Orilla Negra'],
    dungeonNames: ['Los Ríos de Fuego', 'El Mar de Brasas', 'Las Islas de Ceniza'],
    bossRoom: 'Cubil de Azufre',
    rarity: { common: 20, uncommon: 30, rare: 30, epic: 16, legendary: 4 },
    tint: [1.36, 0.7, 0.5],
    backdrops: ['rios', 'rios'],
    map: { roomW: [8, 12], roomH: [7, 10], corridor: 2, rooms: [6, 8], size: [50, 42] },
    decor: ['lava', 'lava', 'crystal', 'rubble', 'bones', 'brazier'],
  },
  trono: {
    id: 'trono', zone: 'infierno', index: 10, name: 'El Trono de las Cadenas', levels: [90, 100],
    tagline: 'Una fortaleza de cadenas sobre el vacío. Más abajo no hay nada.',
    enemies: [{ id: 'pit_lord', weight: 25, minDepth: 1 }, { id: 'chained_herald', weight: 25 }, { id: 'abyss_spawn', weight: 25 }, { id: 'soul_devourer', weight: 25 }],
    elite: 'belzar_herald', boss: 'belzar',
    roomNames: ['Sala de las Cadenas', 'Puente sobre el Vacío', 'Cámara del Tormento', 'Forja de Grilletes', 'Antesala del Trono', 'Galería de los Condenados'],
    dungeonNames: ['El Trono de las Cadenas', 'La Fortaleza de Belzar', 'El Fondo del Abismo'],
    bossRoom: 'Trono de las Cadenas',
    rarity: { common: 16, uncommon: 28, rare: 32, epic: 19, legendary: 5 },
    tint: [1.22, 0.52, 0.56],
    backdrops: ['infierno', 'trono'],
    map: { roomW: [6, 10], roomH: [6, 9], corridor: 2, rooms: [8, 10], size: [48, 42] },
    decor: ['chain', 'chain', 'spikes', 'brazier', 'lava', 'skull'],
  },
};

export const SUBZONE_ORDER: SubzoneId[] = ['afueras', 'castillo', 'calabozos', 'osario', 'catacumbas', 'panteon', 'carmesi', 'puertas', 'rios', 'trono'];

export function isSubzoneId(id: unknown): id is SubzoneId {
  return typeof id === 'string' && id in SUBZONES;
}

export function getSubzone(id: SubzoneId | string | undefined): SubzoneDef {
  return isSubzoneId(id) ? SUBZONES[id] : SUBZONES.afueras;
}

export function subzonesOf(zone: ZoneId): SubzoneDef[] {
  return SUBZONE_ORDER.map((id) => SUBZONES[id]).filter((s) => s.zone === zone);
}
