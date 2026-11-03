// Paleta de Crypt Raiders: piedra, tierra, musgo, noche, oro, magia y amenaza.
export const PAL = {
  outline: '#0b0a0f',
  void: '#07060a',
  stone0: '#1c1b22', stone1: '#2a2830', stone2: '#3a3741', stone3: '#4d4954', stone4: '#625d69', stone5: '#7c7683',
  earth0: '#2a1c14', earth1: '#4a2f1d', earth2: '#6b4429', earth3: '#8f5f37',
  moss0: '#25321f', moss1: '#3c5130', moss2: '#5a7444',
  night0: '#121827', night1: '#1f2a44', night2: '#2f3f66',
  gold0: '#6b4a12', gold1: '#9a6b1a', gold2: '#e8b33a', gold3: '#f8dc7a',
  magic0: '#2e1a4a', magic1: '#4f2a80', magic2: '#a35ae0', magic3: '#d6a8ff',
  threat0: '#4a0e18', threat1: '#8e1c2c', threat2: '#c4283b', threat3: '#ff6a5a',
  bone0: '#6e6756', bone1: '#a49c86', bone2: '#d9d3c1', bone3: '#f2eee2',
  steel0: '#3d434d', steel1: '#6d7580', steel2: '#a3abb6', steel3: '#dfe5ec',
  fire0: '#8e2a0e', fire1: '#e8752b', fire2: '#ffb347', fire3: '#fff1a8',
  ice: '#9fe3ff',
};

export const CLOAK_COLORS = ['#7a2a22', '#2b3f6b', '#3c5a2a', '#4a2f5c'];
export const CLOAK_NAMES = ['Sangre', 'Noche', 'Musgo', 'Ceniza violeta'];
export const SKIN_COLORS = ['#e3b58e', '#b57d55', '#7a4e33'];
export const SKIN_NAMES = ['Clara', 'Morena', 'Oscura'];

export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}
