// Ataques básicos de cada familia de armas (compartidos por todas las zonas).
export const SLASH = { name: 'Tajo', kind: 'physical', power: 1, fx: 'slash' } as const;
export const CHOP = { name: 'Hachazo', kind: 'physical', power: 1.15, fx: 'smash' } as const;
export const STAB = { name: 'Cuchillada', kind: 'physical', power: 1, fx: 'slash' } as const;
export const BOLT = { name: 'Proyectil arcano', kind: 'magical', power: 0.8, fx: 'dark' } as const;
export const SMITE = { name: 'Mazazo', kind: 'physical', power: 1, fx: 'smash' } as const;
