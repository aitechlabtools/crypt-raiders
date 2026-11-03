// ════════════════════════════════════════════════════════════════════
// Atuendos (skins): trajes completos que cambian el aspecto de TODO el personaje (cabeza, torso, manos, piernas,
// pies y capa). Solo son estéticos: nunca dan ni quitan estadísticas. Valen para todas las clases.
// Solo se consiguen en la Tienda. Una vez comprados son tuyos para siempre (no ocupan sitio ni se pierden al morir).
// El arma y la secundaria NO forman parte del atuendo: se dibujan encima, en los puntos de anclaje (ANCHORS).
//
// Para añadir un atuendo: una entrada nueva en SKINS. Mientras no haya sprites, se usa el marcador provisional.
// ════════════════════════════════════════════════════════════════════

/** Moneda del precio. Hoy solo se puede pagar con 'gold' (oro del juego). 'premium' y 'real' quedan reservadas
 *  para el futuro: el juego las rechaza. No hay pagos reales, pasarelas ni servicios externos. */
export type Currency = 'gold' | 'premium' | 'real';

/** Partes del cuerpo que pinta el marcador provisional (la cara usa el tono de piel del jugador). */
export interface SkinBody {
  torso: string;
  trim: string;
  legs: string;
  boots: string;
  cape?: string;
  head: 'helmet' | 'hood' | 'wizard' | 'hair' | 'crown';
  headColor: string;
  hatTrim?: string;
  torsoStyle: 'tunic' | 'mail' | 'robe' | 'shirt';
  hands?: string;
  amulet?: string;
  eye?: string;
}

export interface SkinDef {
  id: string;
  name: string;
  description: string;
  rarity: 'rare' | 'epic' | 'legendary';
  price: { currency: Currency; amount: number };
  /** Orden en la Tienda. */
  order: number;
  /** Sprites definitivos (public/skins/<id>.png y <id>-anclajes.png). Si faltan, se usa `body`. */
  sprites?: { sheet: string; anchors?: string };
  /** Marcador provisional dibujado por código. */
  body: SkinBody;
}

export const SKINS: Record<string, SkinDef> = Object.fromEntries(
  ([
    {
      id: 'skin_penitent', order: 1, rarity: 'rare', price: { currency: 'gold', amount: 1500 },
      name: 'Sudario del Penitente',
      description: 'Hábito de los monjes que velan las criptas de VarkHollow. Vendas y cadenas para no olvidar a quién se debe la vida.',
      body: { torso: '#5b5650', trim: '#2b2724', legs: '#3a3632', boots: '#2a2622', head: 'hood', headColor: '#4a4540', torsoStyle: 'robe', hands: '#d8ccb4', cape: '#3d3934', amulet: '#8c8693' },
    },
    {
      id: 'skin_hollow_warden', order: 2, rarity: 'epic', price: { currency: 'gold', amount: 4000 },
      name: 'Guardián Hueco',
      description: 'La armadura negra de la Guardia de VarkHollow. Nadie sabe qué hay dentro desde que cayó la orden.',
      body: { torso: '#26242c', trim: '#7a1c24', legs: '#1c1b22', boots: '#121117', head: 'helmet', headColor: '#2e2c35', torsoStyle: 'mail', hands: '#3a3741', cape: '#5a1018', eye: '#ff5a4a' },
    },
    {
      id: 'skin_ash_lord', order: 3, rarity: 'legendary', price: { currency: 'gold', amount: 9000 },
      name: 'Señor de la Ceniza',
      description: 'Ropajes del último señor de VarkHollow, que juró no morir mientras ardiera su casa. La corona aún quema.',
      body: { torso: '#3a1414', trim: '#e8913a', legs: '#24100e', boots: '#1a0c0a', head: 'helmet', headColor: '#c8902a', torsoStyle: 'robe', hands: '#1a0c0a', cape: '#c4402a', amulet: '#ff8a3a' },
    },
  ] as SkinDef[]).map((s) => [s.id, s]),
);

export const SKIN_ORDER: string[] = Object.values(SKINS).sort((a, b) => a.order - b.order).map((s) => s.id);

export function getSkin(id: string): SkinDef {
  const s = SKINS[id];
  if (!s) throw new Error(`Atuendo desconocido: ${id}`);
  return s;
}

// ── Puntos de anclaje (dónde está cada mano) en el lienzo de 20×26 ──
// El arma se dibuja con la empuñadura en la mano derecha; la secundaria, centrada en la mano izquierda.
// Todos los cuerpos (el de armadura y cualquier atuendo) usan estos puntos salvo que el atuendo traiga los suyos.

export type View = 'front' | 'back';
export type Pose = 'idle' | 'attack' | 'hurt';
export interface Anchor { right: { x: number; y: number }; left: { x: number; y: number } }

/** Frente: fotogramas de paso 0–3 (reposo, paso, reposo alterno, paso). El ataque levanta la mano derecha 3 px. */
export const FRONT_ANCHORS: Anchor[] = [
  { right: { x: 14, y: 17 }, left: { x: 5, y: 17 } },
  { right: { x: 14, y: 17 }, left: { x: 5, y: 15 } },
  { right: { x: 14, y: 17 }, left: { x: 5, y: 17 } },
  { right: { x: 14, y: 15 }, left: { x: 5, y: 17 } },
];
export const BACK_ANCHOR: Anchor = { right: { x: 14, y: 17 }, left: { x: 5, y: 17 } };
export const ATTACK_LIFT = 3;

/** Orden de las capas según la vista: de frente el arma va delante del cuerpo; de espaldas, detrás. */
export const LAYER_ORDER: Record<View, ('body' | 'offhand' | 'weapon')[]> = {
  front: ['body', 'offhand', 'weapon'],
  back: ['weapon', 'body', 'offhand'],
};

export function anchorFor(view: View, frame: number, pose: Pose): Anchor {
  const a = view === 'front' ? FRONT_ANCHORS[frame % 4] : BACK_ANCHOR;
  if (pose !== 'attack') return a;
  return { right: { x: a.right.x, y: a.right.y - ATTACK_LIFT }, left: a.left };
}
