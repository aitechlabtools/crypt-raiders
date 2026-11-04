import { describe, expect, it } from 'vitest';
import { makeRng } from '../src/core/rng';
import { initialRival, proposeAlliance, shareLoot, evaluateBetrayal, rollEncounter, goldShare, talk, noRival, hasRival } from '../src/core/social';
import { WANDERERS, wanderersOf } from '../src/core/data/wanderers';
import { SUBZONES } from '../src/core/data/subzones';
import { RISK, KAEL_CHANCE, KAEL_GUARANTEE_AFTER, BETRAY_MIN_ALLIED_MS, GOLD_SHARE, HOSTILE_CHANCE } from '../src/config/wanderers';
import { SKILLS } from '../src/core/data/skills';
import { MONSTER_SPECS } from '../src/shared/art';

const T0 = 1_000_000;
const ally = (who = 'kael', risk: Parameters<typeof initialRival>[1] = 'kael', traitorRoll = 0.99) => {
  // rng que devuelve siempre el mismo número: < chance → traidor
  const rng = { next: () => traitorRoll, int: (a: number) => a, chance: (p: number) => traitorRoll < p, pick: <T,>(a: readonly T[]) => a[0] } as unknown as ReturnType<typeof makeRng>;
  return proposeAlliance(initialRival(who, risk), rng, T0, 100).rival;
};
const ctx = (o: Partial<Parameters<typeof evaluateBetrayal>[1]> = {}) => ({ now: T0 + BETRAY_MIN_ALLIED_MS + 1, playerHpPct: 0.9, nearPortal: false, zone: 'mazmorra' as const, ...o });

describe('Mercenarios errantes', () => {
  it('los datos son completos: dibujo, habilidades y frases', () => {
    for (const w of Object.values(WANDERERS)) {
      expect(MONSTER_SPECS[w.sprite], w.id).toBeTruthy();
      for (const sk of w.skills) expect(SKILLS[sk], `${w.id}: ${sk}`).toBeTruthy();
      expect(w.lines.greet.length).toBeGreaterThan(0);
      expect(w.lines.warn.length).toBeGreaterThan(5);
    }
    expect(wanderersOf('mazmorra').map((w) => w.id)).not.toContain('kael');
    expect(wanderersOf('mazmorra').map((w) => w.id)).not.toContain('osric');
    for (const z of ['mazmorra', 'cripta', 'infierno'] as const) expect(wanderersOf(z).length).toBeGreaterThanOrEqual(2);
  });
  it('triángulos: Kael 10 %, Mazmorra 15 %, Cripta 25 %, Infierno 50 %, con símbolos distintos', () => {
    expect(RISK.kael.chance).toBe(0.1); expect(RISK.low.chance).toBe(0.15); expect(RISK.mid.chance).toBe(0.25); expect(RISK.high.chance).toBe(0.5);
    expect(new Set(Object.values(RISK).map((r) => r.symbol)).size).toBe(5);
  });
  it('un aliado leal nunca traiciona; un traidor espera un minuto y un momento de debilidad, y avisa antes', () => {
    const loyal = ally('kael', 'kael', 0.99);
    expect(loyal.traitor).toBe(false);
    expect(evaluateBetrayal(loyal, ctx({ playerHpPct: 0.1, nearPortal: true }), makeRng(1)).action).toBe('none');
    const t = ally('kael', 'kael', 0.01);
    expect(t.traitor).toBe(true);
    expect(evaluateBetrayal(t, ctx({ now: T0 + 1000, nearPortal: true }), makeRng(1)).action).toBe('none');
    expect(evaluateBetrayal(t, ctx({ playerHpPct: 0.9 }), makeRng(1)).action).toBe('none');
    const w = evaluateBetrayal(t, ctx({ nearPortal: true }), makeRng(1));
    expect(w.action).toBe('warn');
    const b = evaluateBetrayal(w.rival, ctx({ richChest: true }), makeRng(1));
    expect(b.action).toBe('betray');
    expect(b.rival.disposition).toBe('hostile');
  });
  it('en el Infierno, a veces roba y huye en lugar de atacar', () => {
    let saw = false;
    for (let seed = 1; seed < 40 && !saw; seed++) {
      const t = { ...ally('iskra', 'high', 0.01), warned: true };
      const r = evaluateBetrayal(t, ctx({ nearPortal: true, zone: 'infierno' }), makeRng(seed));
      if (r.action === 'rob') { saw = true; expect(r.rival.disposition).toBe('fleeing'); }
    }
    expect(saw).toBe(true);
  });
  it('repartir baja el riesgo y quedárselo todo lo sube', () => {
    const a = ally('brann', 'low');
    expect(shareLoot(a, ['old_coin'], 3, makeRng(1)).rival.chance).toBeLessThan(a.chance);
    expect(shareLoot(a, [], 3, makeRng(1)).rival.chance).toBeGreaterThan(a.chance);
  });
  it('se lleva su parte del oro encontrado desde la alianza', () => {
    const a = ally('brann', 'low');
    expect(goldShare(a, 600, GOLD_SHARE)).toBe(Math.round(500 * GOLD_SHARE));
    expect(goldShare({ ...a, disposition: 'departed' }, 600, GOLD_SHARE)).toBe(0);
  });
  it('Kael: solo en la Mazmorra, ~1 de cada 3, y seguro tras 4 expediciones sin verlo', () => {
    let kael = 0;
    for (let seed = 1; seed <= 3000; seed++) if (rollEncounter(makeRng(seed), SUBZONES.castillo, 0).who === 'kael') kael++;
    expect(kael / 3000).toBeGreaterThan(KAEL_CHANCE - 0.04);
    expect(kael / 3000).toBeLessThan(KAEL_CHANCE + 0.04);
    for (let seed = 1; seed < 50; seed++) expect(rollEncounter(makeRng(seed), SUBZONES.afueras, KAEL_GUARANTEE_AFTER).who).toBe('kael');
    for (let seed = 1; seed < 300; seed++) expect(rollEncounter(makeRng(seed), SUBZONES.osario, 9).who).not.toBe('kael');
    const miss = [...Array(200)].map((_, i) => rollEncounter(makeRng(i + 1), SUBZONES.afueras, 1)).find((e) => e.who !== 'kael')!;
    expect(miss.kaelStreak).toBe(2);
  });
  it('hostiles solo en las subzonas 8–10 (≈20 %)', () => {
    let hostile = 0, total = 0;
    for (let seed = 1; seed <= 3000; seed++) {
      expect(rollEncounter(makeRng(seed), SUBZONES.carmesi, 0).hostile).toBe(false);
      const e = rollEncounter(makeRng(seed), SUBZONES.rios, 0);
      if (e.who) { total++; if (e.hostile) hostile++; }
    }
    expect(hostile / total).toBeGreaterThan(HOSTILE_CHANCE - 0.05);
    expect(hostile / total).toBeLessThan(HOSTILE_CHANCE + 0.05);
  });
  it('sin errante no hay nada con quien hablar; hablar rota sus frases', () => {
    expect(hasRival(noRival())).toBe(false);
    const r = initialRival('odo', 'mid');
    expect(talk(talk(r).rival).line).not.toBe(talk(r).line);
  });
});
