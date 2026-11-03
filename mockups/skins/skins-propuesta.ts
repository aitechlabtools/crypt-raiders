// MAQUETA · Propuesta de datos de skins (así sería src/core/data/skins.ts).
// Cada skin es un traje completo: sustituye cabeza, torso, manos, piernas, pies y capa. El arma y la secundaria
// NO forman parte de la skin: se dibujan encima, en los puntos de anclaje del cuerpo (ver ANCHORS en el plan).
// Mientras el usuario no dibuje los sprites, cada skin lleva un marcador provisional generado por código («placeholder»).
import type { HumanoidSpec } from '../../src/shared/art';

/** Moneda del precio. Hoy solo existe 'gold'; 'premium' y 'real' quedan reservadas para el futuro (sin pagos reales). */
export type Currency = 'gold' | 'premium' | 'real';

export interface SkinDef {
  id: string;
  name: string;
  /** Una o dos frases, tono de fantasía oscura. */
  description: string;
  price: { currency: Currency; amount: number };
  rarity: 'rare' | 'epic' | 'legendary';
  /** Sprites definitivos del usuario (cuando existan). Si faltan, se usa el marcador provisional. */
  sprites?: { front: string; back: string };
  /** Marcador provisional: qué partes del cuerpo cambia y con qué colores (la piel de la cara es la del jugador). */
  placeholder: Pick<HumanoidSpec, 'torso' | 'trim' | 'legs' | 'boots' | 'head' | 'headColor' | 'torsoStyle' | 'hands'> & Partial<Pick<HumanoidSpec, 'cape' | 'hatTrim' | 'eye' | 'amulet'>>;
  /** Orden en la tienda. */
  order: number;
}

export const SKINS: SkinDef[] = [
  {
    id: 'skin_penitent', order: 1, rarity: 'rare',
    name: 'Sudario del Penitente',
    description: 'Hábito de los monjes que velan las criptas de VarkHollow. Vendas y cadenas para no olvidar a quién se debe la vida.',
    price: { currency: 'gold', amount: 1500 },
    placeholder: { torso: '#5b5650', trim: '#2b2724', legs: '#3a3632', boots: '#2a2622', head: 'hood', headColor: '#4a4540', torsoStyle: 'robe', hands: '#d8ccb4', cape: '#3d3934', amulet: '#8c8693' },
  },
  {
    id: 'skin_hollow_warden', order: 2, rarity: 'epic',
    name: 'Guardián Hueco',
    description: 'La armadura negra de la Guardia de VarkHollow. Nadie sabe qué hay dentro desde que cayó el Bastión.',
    price: { currency: 'gold', amount: 4000 },
    placeholder: { torso: '#26242c', trim: '#7a1c24', legs: '#1c1b22', boots: '#121117', head: 'helmet', headColor: '#2e2c35', torsoStyle: 'mail', hands: '#3a3741', cape: '#5a1018', eye: '#ff5a4a' },
  },
  {
    id: 'skin_ash_lord', order: 3, rarity: 'legendary',
    name: 'Señor de la Ceniza',
    description: 'Ropajes del último señor de VarkHollow, que juró no morir mientras ardiera su casa. La corona aún quema.',
    price: { currency: 'gold', amount: 9000 },
    placeholder: { torso: '#3a1414', trim: '#e8913a', legs: '#24100e', boots: '#1a0c0a', head: 'helmet', headColor: '#c8902a', torsoStyle: 'robe', hands: '#1a0c0a', cape: '#c4402a', amulet: '#ff8a3a' },
  },
];

export const SKIN_BY_ID: Record<string, SkinDef> = Object.fromEntries(SKINS.map((s) => [s.id, s]));
