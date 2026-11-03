import { describe, expect, it } from 'vitest';
import { SKINS, SKIN_ORDER, anchorFor, LAYER_ORDER } from '../src/core/data/skins';
import { buyBlock, buySkin, equipSkin, ownsSkin, wornSkin } from '../src/core/skins';
import { createProfile, sanitizeProfile } from '../src/core/profile';
import { computeStats } from '../src/core/stats';

const base = (gold = 20000) => ({ ...createProfile('Penitente', 'warrior', { cloak: 0, skin: 0 }), gold });

describe('Atuendos', () => {
  it('hay 3 a la venta, con oro como moneda y datos completos', () => {
    expect(SKIN_ORDER).toHaveLength(3);
    for (const s of Object.values(SKINS)) {
      expect(s.price.currency).toBe('gold');
      expect(s.price.amount).toBeGreaterThan(0);
      expect(s.name.length).toBeGreaterThan(3);
      expect(s.description.length).toBeGreaterThan(10);
    }
  });
  it('comprar descuenta el oro y no ocupa sitio en el inventario', () => {
    const p = base();
    const r = buySkin(p, 'skin_penitent');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.profile.gold).toBe(p.gold - SKINS.skin_penitent.price.amount);
    expect(ownsSkin(r.profile, 'skin_penitent')).toBe(true);
    expect(r.profile.backpack).toEqual(p.backpack);
    expect(r.profile.stash).toEqual(p.stash);
  });
  it('no se puede comprar sin oro suficiente, dos veces, ni con otra moneda', () => {
    expect(buyBlock(base(100), 'skin_ash_lord')).toMatch(/Te faltan/);
    const r = buySkin(base(), 'skin_penitent');
    if (!r.ok) throw new Error('compra');
    expect(buyBlock(r.profile, 'skin_penitent')).toMatch(/Ya es tuyo/);
    const premium = { ...SKINS.skin_penitent, id: 'x', price: { currency: 'real' as const, amount: 1 } };
    (SKINS as Record<string, typeof premium>).x = premium;
    expect(buyBlock(base(), 'x')).toMatch(/aún no está a la venta/);
    delete (SKINS as Record<string, unknown>).x;
  });
  it('solo puedes ponerte los tuyos y nunca cambia las estadísticas', () => {
    let p = base();
    expect(equipSkin(p, 'skin_penitent').skins.equipped).toBeNull();
    const r = buySkin(p, 'skin_hollow_warden');
    if (!r.ok) throw new Error('compra');
    p = equipSkin(r.profile, 'skin_hollow_warden');
    expect(wornSkin(p)).toBe('skin_hollow_warden');
    expect(computeStats('warrior', 1, p.equipment)).toEqual(computeStats('warrior', 1, base().equipment));
    expect(wornSkin(equipSkin(p, null))).toBeNull();
  });
  it('partidas antiguas con Vestuario se cargan sin errores y se descartan sus aspectos', () => {
    const old = { ...base(), cosmetics: ['cos_ossuary_helm'], wardrobe: { helmet: 'cos_ossuary_helm' } } as unknown as Record<string, unknown>;
    delete old.skins;
    const p = sanitizeProfile(JSON.parse(JSON.stringify(old)))!;
    expect(p).not.toBeNull();
    expect('cosmetics' in p).toBe(false);
    expect('wardrobe' in p).toBe(false);
    expect(p.skins).toEqual({ owned: [], equipped: null });
  });
  it('limpia atuendos que no existen o puestos que no son tuyos', () => {
    const raw = { ...base(), skins: { owned: ['skin_penitent', 'no_existe', 'skin_penitent'], equipped: 'skin_ash_lord' } };
    const p = sanitizeProfile(JSON.parse(JSON.stringify(raw)))!;
    expect(p.skins).toEqual({ owned: ['skin_penitent'], equipped: null });
  });
  it('anclajes: el ataque sube la mano derecha y el arma va detrás de espaldas', () => {
    expect(anchorFor('front', 0, 'attack').right.y).toBe(anchorFor('front', 0, 'idle').right.y - 3);
    expect(LAYER_ORDER.front.indexOf('weapon')).toBeGreaterThan(LAYER_ORDER.front.indexOf('body'));
    expect(LAYER_ORDER.back.indexOf('weapon')).toBeLessThan(LAYER_ORDER.back.indexOf('body'));
  });
});
