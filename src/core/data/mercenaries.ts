// ════════════════════════════════════════════════════════════════════
// Mercenarios de Garra Roja. Tres por zona: dos se contratan con rango,
// el tercero solo aparece como prisionero en su zona (rescátalo y extrae con él).
// Las estadísticas son de nivel 1; crecen con el nivel del combate como Kael.
// ════════════════════════════════════════════════════════════════════
import type { Stats } from '../types';
import type { BasicAttack } from '../combat';
import type { ZoneId } from './zones/types';

export interface MercDef {
  id: string;
  name: string;
  title: string;
  zone: ZoneId;
  /** Rango con Garra Roja necesario para contratarlo. */
  rank: number;
  /** Solo se desbloquea rescatándolo de la mazmorra. */
  captive?: boolean;
  /** Precio por expedición (oro). */
  price: number;
  sprite: string;
  stats: Stats;
  resourceName: string;
  skills: string[];
  basicAttack: BasicAttack;
  blurb: string;
  /** Frase al rescatarlo. */
  rescueLine?: string;
}

const s = (maxHp: number, atk: number, def: number, mag: number, res: number, spd: number, crit = 8, eva = 6): Stats => ({ maxHp, maxMp: 30, atk, def, mag, res, spd, crit, eva });

export const MERCENARIES: Record<string, MercDef> = {
  // ── La Mazmorra ──
  bram: {
    id: 'bram', name: 'Bram el Leñador', title: 'Hachero', zone: 'mazmorra', rank: 0, price: 60, sprite: 'merc_bram',
    stats: s(118, 16, 10, 2, 6, 10), resourceName: 'Furia', skills: ['brutal_blow', 'war_cry'],
    basicAttack: { name: 'Hachazo', kind: 'physical', power: 1, fx: 'slash' },
    blurb: 'Taló bosques enteros antes de bajar al Osario. Golpea fuerte y pregunta poco.',
  },
  lysa: {
    id: 'lysa', name: 'Lysa la Ballestera', title: 'Tiradora', zone: 'mazmorra', rank: 1, price: 90, sprite: 'merc_lysa',
    stats: s(92, 19, 7, 3, 7, 15, 16, 12), resourceName: 'Energía', skills: ['thrust', 'venom_strike'],
    basicAttack: { name: 'Virote', kind: 'physical', power: 1, fx: 'slash' },
    blurb: 'Nunca falla dos veces. Sus virotes atraviesan escudos y suelen ir untados de algo.',
  },
  tobias: {
    id: 'tobias', name: 'Tobías el Ermitaño', title: 'Hechicero', zone: 'mazmorra', rank: 0, captive: true, price: 70, sprite: 'merc_tobias',
    stats: s(84, 6, 6, 18, 12, 11), resourceName: 'Maná', skills: ['spark', 'frost_lance'],
    basicAttack: { name: 'Chispazo', kind: 'magical', power: 1, fx: 'fire' },
    blurb: 'Un viejo mago que los bandidos encadenaron para que les encendiera las hogueras.',
    rescueLine: '«¡Por fin! Tres semanas encendiendo fuegos para esos brutos. Te acompaño, a ver si salimos.»',
  },
  // ── La Cripta ──
  ysolde: {
    id: 'ysolde', name: 'Ysolde la Plateada', title: 'Caballera', zone: 'cripta', rank: 2, price: 180, sprite: 'merc_ysolde',
    stats: s(140, 15, 15, 3, 10, 9), resourceName: 'Aguante', skills: ['shield_bash', 'iron_wall'],
    basicAttack: { name: 'Tajo', kind: 'physical', power: 1, fx: 'slash' },
    blurb: 'Juró proteger a los vivos en la Cripta. Aguanta golpes que tumbarían a un buey.',
  },
  corvin: {
    id: 'corvin', name: 'Corvin el Sepulturero', title: 'Segador', zone: 'cripta', rank: 2, price: 200, sprite: 'merc_corvin',
    stats: s(122, 20, 10, 2, 8, 11, 12), resourceName: 'Furia', skills: ['skull_splitter', 'reaping'],
    basicAttack: { name: 'Pala afilada', kind: 'physical', power: 1, fx: 'smash' },
    blurb: 'Lleva treinta años enterrando muertos. Ahora le pagan por volver a enterrarlos.',
  },
  mirra: {
    id: 'mirra', name: 'Mirra la Exorcista', title: 'Exorcista', zone: 'cripta', rank: 0, captive: true, price: 160, sprite: 'merc_mirra',
    stats: s(100, 8, 8, 18, 14, 12), resourceName: 'Fe', skills: ['holy_light', 'sanctuary'],
    basicAttack: { name: 'Golpe bendito', kind: 'magical', power: 1, fx: 'holy' },
    blurb: 'Bajó a purificar la Cripta y la Reina Velada la encerró en un osario.',
    rescueLine: '«La luz te ha traído hasta aquí. Deja que te devuelva el favor.»',
  },
  // ── El Infierno ──
  draven: {
    id: 'draven', name: 'Draven el Desollado', title: 'Verdugo', zone: 'infierno', rank: 3, price: 380, sprite: 'merc_draven',
    stats: s(132, 22, 11, 2, 9, 12, 14), resourceName: 'Furia', skills: ['rending_slash', 'dread_cut'],
    basicAttack: { name: 'Mandoble', kind: 'physical', power: 1, fx: 'slash' },
    blurb: 'Volvió del Infierno sin piel en la espalda y con ganas de devolver cada latigazo.',
  },
  nyx: {
    id: 'nyx', name: 'Nyx la Pirómana', title: 'Piromante', zone: 'infierno', rank: 4, price: 480, sprite: 'merc_nyx',
    stats: s(96, 6, 7, 24, 13, 13, 12), resourceName: 'Maná', skills: ['fireball', 'ember_rain'],
    basicAttack: { name: 'Llamarada', kind: 'magical', power: 1, fx: 'fire' },
    blurb: 'Dice que el fuego del abismo «le hace cosquillas». Nadie quiere comprobarlo.',
  },
  ulric: {
    id: 'ulric', name: 'Ulric el Encadenado', title: 'Bruto', zone: 'infierno', rank: 0, captive: true, price: 320, sprite: 'merc_ulric',
    stats: s(170, 18, 14, 2, 10, 8), resourceName: 'Furia', skills: ['brutal_blow', 'iron_wall'],
    basicAttack: { name: 'Golpe de cadena', kind: 'physical', power: 1, fx: 'smash' },
    blurb: 'Belzar lo usaba como perro de presa. Las cadenas siguen en sus muñecas.',
    rescueLine: '«…No más cadenas. Llévame arriba y romperé lo que me pidas.»',
  },
};

export const MERC_ORDER = ['bram', 'lysa', 'tobias', 'ysolde', 'corvin', 'mirra', 'draven', 'nyx', 'ulric'];

export function getMerc(id: string): MercDef {
  const m = MERCENARIES[id];
  if (!m) throw new Error(`Mercenario desconocido: ${id}`);
  return m;
}

export function captivesOf(zone: ZoneId): MercDef[] {
  return MERC_ORDER.map(getMerc).filter((m) => m.captive && m.zone === zone);
}
