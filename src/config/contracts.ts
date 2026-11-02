// Contratos de mercenarios con Garra Roja. Precio = precio por expedición × expediciones × multiplicador.
export interface ContractOption { expeditions: number; mult: number }

/** 1, 3 o 5 expediciones: cuanto más largo, más barato sale cada salida. */
export const CONTRACT_OPTIONS: ContractOption[] = [
  { expeditions: 1, mult: 1 },
  { expeditions: 3, mult: 0.85 },
  { expeditions: 5, mult: 0.7 },
];

/** Descuento del primer contrato con un mercenario que rescataste de la mazmorra. */
export const RESCUE_DISCOUNT = 0.5;

/** Probabilidad de encontrar a un prisionero en una expedición (si no llevas mercenario). */
export const CAPTIVE_CHANCE = 0.35;

/** Pociones que lleva un mercenario a cada expedición. */
export const MERC_POTIONS = 2;

/** Los mercenarios de zonas más hondas son más duros. */
export const MERC_ZONE_POWER: Record<string, number> = { mazmorra: 1, cripta: 1.12, infierno: 1.25 };
