// Oro físico: monedas y sacos. Todos los valores son editables.
/** Monedas de oro sueltas por casilla. */
export const COIN_STACK = 10;
/** Capacidad de cada contenedor (monedas). */
export const CONTAINER_CAPACITY: Record<string, number> = { gold_pouch: 50, gold_sack: 250 };
/** Ids de los objetos de oro. */
export const COIN_ID = 'gold_coins';

/** Escala de la economía: todo el oro se dividió entre 10 al llegar el oro físico (precios, botín y recompensas). */
export const GOLD_SCALE = 0.1;
/** Oro con el que empieza un personaje nuevo (monedas en su almacén). */
export const STARTING_COINS = 6;

// ── El Coleccionista (duende) ──
/** Categorías que compra el Coleccionista (joyas, anillos, amuletos, tesoros: cálices, gemas…) y cuánto mejor paga. */
export const COLLECTOR_BUYS = ['jewel', 'relic', 'ring', 'amulet', 'coin'];
export const COLLECTOR_PRICE_MULT = 1.25;
/** Mochilas: casillas que da cada una (6 columnas). La de cuero es la de inicio; las otras las vende el Coleccionista. */
export const BAG_SIZES: Record<string, number> = { backpack_basic: 24, backpack_30: 30, backpack_36: 36 };
export const STARTING_BAG = 'backpack_basic';
