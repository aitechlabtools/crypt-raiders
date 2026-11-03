// Pantalla «Jugar» (opción D): héroe grande en el centro bajo un haz de luz, tarjeta de zona arriba a la izquierda,
// panel de expedición con «Descender» abajo a la izquierda y nivel + accesos rápidos abajo a la derecha.
import { useEffect, useState } from 'react';
import { actions, useGame } from '../../state/store';
import { CLASSES } from '../../../core/data/classes';
import { ZONES, ZONE_ORDER, zoneLock, type ZoneId } from '../../../core/data/zones';
import { getEnemy } from '../../../core/data/enemies';
import { countItem, equippedValue, gridValue } from '../../../core/inventory';
import { EXPEDITION_DURATION_MS } from '../../../core/expedition';
import { xpForNextLevel } from '../../../core/stats';
import { getMerc } from '../../../core/data/mercenaries';
import { QUESTS } from '../../../core/data/quests';
import { PlayerSprite, MonsterSprite, Modal } from '../common';
import { zoneBackdrop, zoneFor } from '../combatZones';
import { iconUrl } from '../../../shared/art';
import { usePixelScale } from '../kit';
import { useLayout } from '../../../config/ui';
import { sfx, startMusic } from '../../audio';

/** La zona elegida se recuerda mientras dure la sesión (al cambiar de pestaña y volver). */
let lastZone: ZoneId = 'mazmorra';

export type QuickTarget = 'quests' | 'merchants' | 'bestiary' | 'contracts';

export function Jugar({ onNavigate }: { onNavigate: (t: QuickTarget) => void }) {
  const profile = useGame((s) => s.profile)!;
  const ch = profile.character;
  const layout = useLayout();
  const phone = layout === 'phone';
  const merc0 = profile.contract ? getMerc(profile.contract.mercId) : null;
  const heroScale = useHeroScale(usePixelScale('hero'), !!merc0, phone);
  const firstTime = profile.stats.expeditions === 0;
  const [zoneId, setZoneIdRaw] = useState<ZoneId>(firstTime ? 'mazmorra' : lastZone);
  const setZoneId = (z: ZoneId) => { lastZone = z; setZoneIdRaw(z); };
  const [map, setMap] = useState(false);
  const zone = ZONES[zoneId];
  const lock = firstTime ? null : zoneLock(zone, ch.level, profile.bossesDefeated);
  const potions = countItem(profile.backpack, 'health_potion');
  const risk = gridValue(profile.backpack) + equippedValue(profile.equipment);
  const merc = profile.contract ? getMerc(profile.contract.mercId) : null;
  const questsReady = profile.quests.filter((q) => !q.claimed && q.progress >= QUESTS.find((d) => d.id === q.id)!.count).length;
  const xpPct = Math.round((ch.xp / xpForNextLevel(ch.level)) * 100);
  // El mercenario, un poco más pequeño y detrás: el protagonista eres tú (escala entera)
  const mercScale = Math.max(2, heroScale - Math.max(1, Math.round(heroScale / 4)));

  const descend = () => {
    if (lock) return;
    sfx('portal');
    if (profile.settings.music) startMusic('dungeon');
    void actions.enterDungeon(firstTime ? 'mazmorra' : zoneId);
  };

  const edge = { left: 'max(var(--pad), env(safe-area-inset-left))', right: 'max(var(--pad), env(safe-area-inset-right))', bottom: 'max(var(--pad), env(safe-area-inset-bottom))' };

  return (
    <div className="relative h-full overflow-hidden" data-testid="screen-play">
      {/* Haz de luz y héroe en el centro; si hay un mercenario contratado, aparece a su lado */}
      <div className="beam" />
      <div className="absolute left-1/2 -translate-x-1/2 flex items-end" style={{ bottom: phone ? '8%' : '9%', gap: merc ? heroScale * 2 : 0 }} data-testid="play-heroes">
        <Figure label={<><span className="text-gold mr-2">Nv {ch.level}</span>{ch.name}</>} scale={heroScale} phone={phone}>
          <PlayerSprite scale={heroScale} />
        </Figure>
        {merc && (
          <Figure label={<span className="text-heal">{merc.name}</span>} scale={mercScale} phone={phone} testId="play-merc">
            <MonsterSprite sprite={merc.sprite} scale={mercScale} className="-scale-x-100" />
          </Figure>
        )}
      </div>

      {/* Abajo a la izquierda: la zona (con el mapa) y, debajo, la expedición con «Descender» */}
      <div className="absolute flex flex-col" style={{ left: edge.left, bottom: edge.bottom, width: phone ? 250 : 324, gap: 'var(--gap)' }}>
      {/* Tarjeta de zona */}
      <section className="panel panel-gold overflow-hidden" data-testid="zone-card">
        <button className="block w-full text-left relative" onClick={() => !firstTime && setMap(true)} aria-label={`Zona: ${zone.name}. Abrir el mapa de zonas`} disabled={firstTime}>
          <ZoneArt id={zoneId} height={phone ? 44 : 96} />
          {profile.bossesDefeated.includes(zone.boss) && <span className="absolute top-2 left-2 ui-tag on bg-black/70">Jefe derrotado ✓</span>}
        </button>
        <div className={`flex items-center gap-3 ${phone ? 'px-3 py-1.5' : 'p-3'}`}>
          <div className="flex-1 min-w-0">
            <div className={`font-display text-parchment leading-tight ${phone ? 'text-base' : 'text-xl'}`} data-testid="zone-name">{zone.name}</div>
            {!phone && <div className="text-[11px] text-stone-300 leading-tight mt-0.5">Niveles {zone.levels[0]}–{zone.levels[1]} · mapa nuevo cada vez</div>}
          </div>
          {!firstTime && <button className="btn text-xs shrink-0" onClick={() => { setMap(true); sfx('click'); }} data-testid="btn-zone-map">Mapa de zonas</button>}
        </div>
      </section>

      {/* Expedición y Descender */}
      <section className="panel panel-gold" data-testid="expedition-panel">
        <div className={phone ? 'p-2.5' : 'p-4'}>
          <h2 className="panel-title text-sm">Expedición</h2>
          <div className="font-body text-parchment leading-tight mt-1">{zone.name} · Nv {zone.levels[0]}–{zone.levels[1]}</div>
          {!phone && (
            <div className="font-body text-stone-300 text-[15px] leading-snug mt-0.5" data-testid="expedition-summary">
              {potions} {potions === 1 ? 'poción' : 'pociones'} · {risk} de oro en riesgo{merc ? ` · ${merc.name} te acompaña` : ''}
            </div>
          )}
          {!phone && <div className="text-[11px] text-stone-400 mt-1">{EXPEDITION_DURATION_MS / 60000} minutos para encontrar el portal. Si caes, pierdes lo que llevas.</div>}
          {lock && <div className="text-xs text-blood mt-1" data-testid="zone-lock">{lock}</div>}
          {!profile.equipment.mainHand && <div className="text-xs text-ember mt-1">Vas sin arma. Revisa tu equipo en el Alijo.</div>}
          <button className="btn btn-gold cta w-full mt-2" onClick={descend} disabled={!!lock} data-testid="btn-enter-dungeon">Descender</button>
        </div>
      </section>
      </div>

      {/* Nivel y accesos rápidos */}
      <div className="absolute flex flex-col items-end gap-3" style={{ right: edge.right, bottom: edge.bottom }}>
        <div className="flex flex-col items-center gap-1" title={`Experiencia: ${xpPct}%`} data-testid="level-ring">
          <div className="lvl-ring" style={{ ['--p' as string]: xpPct }}><span>{ch.level}</span></div>
          <span className="text-[10px] tracking-[0.2em] uppercase text-stone-300">Nivel</span>
        </div>
        <div className="flex gap-2">
          <Quick label="Misiones" icon="chalice" badge={questsReady} onClick={() => onNavigate('quests')} testId="quick-quests" />
          <Quick label="Reputación" icon="coin" onClick={() => onNavigate('merchants')} testId="quick-rep" />
          <Quick label="Bestiario" icon="tome" onClick={() => onNavigate('bestiary')} testId="quick-bestiary" />
          <Quick label="Contrato" icon="sword" onClick={() => onNavigate('contracts')} testId="quick-contract" />
        </div>
      </div>

      {map && <ZoneMap current={zoneId} onPick={(z) => { setZoneId(z); setMap(false); sfx('click'); }} onClose={() => setMap(false)} />}
      {firstTime && !phone && <FirstTimeHint className={CLASSES[ch.classId].name} />}
    </div>
  );
}

/**
 * Escala del héroe según el alto de la pantalla: lo más grande posible (≈80 % del alto libre; 68 % en móvil),
 * siempre entera y nunca menor que la de config/ui.ts. El sprite mide 40 px de alto.
 */
function useHeroScale(min: number, withMerc: boolean, phone: boolean): number {
  const calc = () => {
    if (typeof window === 'undefined') return min;
    const free = window.innerHeight - 70;
    let s = Math.max(min, Math.floor((free * (window.innerHeight <= 520 ? 0.68 : 0.8)) / 40));
    // A lo ancho, el grupo tiene que caber entre los paneles de la izquierda y los botones de la derecha.
    const room = window.innerWidth - 2 * (phone ? 270 : 370);
    const widthAt = (k: number) => (withMerc ? 28 * k + 2 * k + 28 * Math.max(2, k - Math.max(1, Math.round(k / 4))) : 28 * k);
    while (s > min && widthAt(s) > room) s--;
    return s;
  };
  const [s, setS] = useState(calc);
  useEffect(() => {
    const upd = () => setS(calc());
    window.addEventListener('resize', upd);
    return () => window.removeEventListener('resize', upd);
  }, [min, withMerc, phone]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setS(calc()), [withMerc, phone]); // eslint-disable-line react-hooks/exhaustive-deps
  return s;
}

function Figure({ label, scale, phone, children, testId }: { label: React.ReactNode; scale: number; phone: boolean; children: React.ReactNode; testId?: string }) {
  return (
    <div className="flex flex-col items-center" data-testid={testId}>
      <div className="font-display text-parchment mb-1 whitespace-nowrap" style={{ fontSize: phone ? 13 : 18 }}>{label}</div>
      <div className="relative flex justify-center">
        <div className="pedestal" style={{ width: 24 * scale, height: 6 * scale, bottom: -3 * scale }} />
        <div className="relative breathe">{children}</div>
      </div>
    </div>
  );
}

function ZoneArt({ id, height }: { id: ZoneId; height: number }) {
  // Ilustración provisional: el fondo de combate de la zona (320×180), recortado. La definitiva (160×90) la dibujará el usuario.
  const src = zoneBackdrop(zoneFor(ZONES[id].backdrops, '', 0, true));
  return <div className="w-full overflow-hidden bg-black flex justify-center" style={{ height }}><img src={src} alt="" className="pixelated w-[320px] h-[180px] max-w-none" style={{ marginTop: -(180 - height) / 2 }} draggable={false} /></div>;
}

function Quick({ label, icon, badge, onClick, testId }: { label: string; icon: string; badge?: number; onClick: () => void; testId: string }) {
  return (
    <button className="btn quick" onClick={onClick} aria-label={badge ? `${label} (${badge} listas)` : label} data-testid={testId}>
      <img src={iconUrl(icon, 2)} width={24} height={24} className="pixelated" alt="" />
      <span className="leading-none">{label}</span>
      {!!badge && <span className="nb">{badge}</span>}
    </button>
  );
}

/** Mapa de zonas: elegir hasta dónde bajar. Cada zona muestra niveles, jefe y por qué está cerrada. */
function ZoneMap({ current, onPick, onClose }: { current: ZoneId; onPick: (z: ZoneId) => void; onClose: () => void }) {
  const profile = useGame((s) => s.profile)!;
  return (
    <Modal onClose={onClose} wide testId="zone-map">
      <h2 className="panel-title text-xl mb-3">Mapa de zonas</h2>
      <div className="grid sm:grid-cols-3 gap-3" data-testid="zone-picker">
        {ZONE_ORDER.map((id) => {
          const z = ZONES[id];
          const l = zoneLock(z, profile.character.level, profile.bossesDefeated);
          const on = id === current;
          return (
            <button key={id} onClick={() => !l && onPick(id)} disabled={!!l} data-testid={`zone-${id}`}
              className={`panel p-0 text-left overflow-hidden transition ${on ? 'border-gold pulse-gold' : 'hover:brightness-125'} ${l ? 'opacity-60 cursor-not-allowed' : ''}`}>
              <ZoneArt id={id} height={72} />
              <div className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-lg text-parchment">{z.name}</span>
                  {l ? <span aria-label="Cerrada" className="text-blood">🔒</span> : profile.bossesDefeated.includes(z.boss) ? <span className="text-heal text-xs">Jefe ✓</span> : null}
                </div>
                <div className="text-xs text-gold">Niveles {z.levels[0]}–{z.levels[1]}</div>
                <div className="font-body text-sm text-stone-300 leading-snug mt-1">{z.tagline}</div>
                <div className="text-[11px] text-stone-400 mt-1">Jefe: {getEnemy(z.boss).name}</div>
                {l && <div className="text-[11px] text-blood mt-1 leading-tight">{l}</div>}
              </div>
            </button>
          );
        })}
      </div>
      <button className="btn mt-4" onClick={onClose} data-testid="btn-zone-map-close">Cerrar</button>
    </Modal>
  );
}

function FirstTimeHint({ className }: { className: string }) {
  return (
    <div className="absolute right-[max(var(--pad),env(safe-area-inset-right))] top-2 panel p-3 max-w-xs font-body text-[15px] text-stone-300 leading-snug" data-testid="first-time-hint">
      <div className="text-gold font-display text-sm mb-1">Tu primera bajada</div>
      Tu {className.toLowerCase()} baja a la Mazmorra. Coge lo que puedas y busca el portal antes de que se acabe el tiempo.
    </div>
  );
}
