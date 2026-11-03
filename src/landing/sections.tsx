// Secciones de la landing: VarkHollow, carrusel de capturas, captura en el móvil y hoja de ruta.
// Los textos de la hoja de ruta están en roadmap.ts; los de VarkHollow, aquí abajo.
import { useEffect, useRef, useState } from 'react';
import { iconUrl, monsterUrl } from '../shared/art';
import { ZONES as BACKDROPS, zoneBackdrop } from '../game/ui/combatZones';
import { ROADMAP, ROADMAP_NOTE } from './roadmap';

// ── VarkHollow ────────────────────────────────────────────────────────────────
export const VARKHOLLOW = {
  title: 'Esto es VarkHollow',
  text: 'Una tierra maldita donde el Bastión de Ceniza aún resiste. Bajo sus muros se abren las criptas de Umbravel, y bajo las criptas, algo peor. Los saqueadores bajan por el oro; la regla es la de siempre: baja, saquea y vuelve. Quien cae ahí abajo, ahí se queda.',
  steam: 'En Steam se llamará Crypt Raiders: VarkHollow.',
};

const DEPTHS = [
  { id: 'mazmorra', name: 'La Mazmorra', levels: 'Nv 1–30', backdrop: 'osario' as const, boss: 'boss', bossName: 'Señor del Osario', color: '#c8a46a',
    text: 'Galerías de piedra bajo el Bastión. Bandidos, bestias y los primeros muertos que no se quedan quietos.' },
  { id: 'cripta', name: 'La Cripta', levels: 'Nv 30–60', backdrop: 'necropolis' as const, boss: 'veiled_queen', bossName: 'La Reina Velada', color: '#8fb8e8',
    text: 'La necrópolis de Umbravel. Velas frías, sarcófagos abiertos y una reina que canta para los que no descansan.' },
  { id: 'infierno', name: 'El Infierno', levels: 'Nv 60–100', backdrop: 'infierno' as const, boss: 'belzar', bossName: 'Belzar, Señor de las Cadenas', color: '#ff7a3a',
    text: 'Obsidiana, lava y cadenas. Lo que vive aquí abajo nunca fue humano.' },
];

export function VarkHollowSection() {
  return (
    <section id="varkhollow" className="relative overflow-hidden">
      <div className="absolute inset-0 vh-glow pointer-events-none" />
      <div className="relative max-w-6xl mx-auto px-4 pt-24 pb-8">
        <p className="font-display text-gold tracking-[0.3em] text-sm uppercase">El mundo</p>
        <h2 className="font-display text-4xl md:text-6xl text-parchment mt-2 leading-tight">{VARKHOLLOW.title}</h2>
        <p className="font-body text-xl md:text-2xl text-stone-300 mt-5 max-w-3xl leading-relaxed">{VARKHOLLOW.text}</p>
        <ol className="depths mt-12" aria-label="Las tres profundidades de VarkHollow">
          {DEPTHS.map((d, i) => (
            <li key={d.id} className="depth" style={{ ['--depth' as string]: d.color }}>
              <div className="depth-art">
                <img src={zoneBackdrop(BACKDROPS[d.backdrop])} alt="" className="pixelated depth-bg" />
                <img src={monsterUrl(d.boss, 4)} alt={d.bossName} title={d.bossName} className="pixelated depth-boss" />
                <span className="depth-step">{i + 1}</span>
              </div>
              <div className="p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-2xl" style={{ color: d.color }}>{d.name}</h3>
                  <span className="font-display text-sm text-stone-400 whitespace-nowrap">{d.levels}</span>
                </div>
                <p className="font-body text-lg text-stone-300 leading-snug mt-2">{d.text}</p>
                <p className="font-body text-sm text-stone-500 mt-3">Jefe: {d.bossName}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="font-body text-stone-500 mt-6 text-base">{VARKHOLLOW.steam}</p>
      </div>
    </section>
  );
}

// ── Carrusel de capturas ──────────────────────────────────────────────────────
/** `src` sin extensión: se sirve la .webp y, si el navegador no la entiende, la .png. */
export interface Shot { src: string; alt: string; caption: string }

function Pic({ src, alt, eager = false, className = '', w = 1920, h = 1080 }: { src: string; alt: string; eager?: boolean; className?: string; w?: number; h?: number }) {
  return (
    <picture>
      <source srcSet={`${src}.webp`} type="image/webp" />
      <img src={`${src}.png`} alt={alt} loading={eager ? 'eager' : 'lazy'} width={w} height={h} className={className} />
    </picture>
  );
}

export function ShotCarousel({ shots }: { shots: Shot[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const go = (n: number) => {
    const t = track.current; if (!t) return;
    const k = (n + shots.length) % shots.length;
    t.scrollTo({ left: k * t.clientWidth, behavior: 'smooth' });
  };
  useEffect(() => {
    const t = track.current; if (!t) return;
    const on = () => setI(Math.round(t.scrollLeft / Math.max(1, t.clientWidth)));
    t.addEventListener('scroll', on, { passive: true });
    return () => t.removeEventListener('scroll', on);
  }, []);
  return (
    <div className="carousel" aria-roledescription="carrusel" aria-label="Capturas del juego">
      <div className="carousel-track" ref={track} tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); } }}>
        {shots.map((s, k) => (
          <figure key={s.src} className="carousel-slide" aria-roledescription="captura" aria-label={`${k + 1} de ${shots.length}`}>
            <Pic src={s.src} alt={s.alt} eager={k === 0} className="w-full aspect-video object-contain bg-black block" />
          </figure>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-4">
        <button className="carousel-btn" onClick={() => go(i - 1)} aria-label="Captura anterior">◄</button>
        <p className="font-body text-lg text-stone-300 flex-1 min-w-0" aria-live="polite"><span className="text-stone-500 mr-2">{i + 1}/{shots.length}</span>{shots[i]?.caption}</p>
        <button className="carousel-btn" onClick={() => go(i + 1)} aria-label="Captura siguiente">►</button>
      </div>
      <div className="carousel-thumbs" role="tablist" aria-label="Elegir captura">
        {shots.map((s, k) => (
          <button key={s.src} role="tab" aria-selected={k === i} aria-label={s.caption} className={`carousel-thumb ${k === i ? 'is-on' : ''}`} onClick={() => go(k)}>
            <Pic src={s.src} alt="" className="w-full h-full object-cover block" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Captura del móvil ─────────────────────────────────────────────────────────
export function PhoneShot({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="flex flex-col items-center">
      <div className="phone-frame"><Pic src={src} alt={alt} w={844} h={390} className="w-full h-full object-cover block" /></div>
      <figcaption className="font-body text-stone-400 mt-3">Así se ve en el móvil.</figcaption>
    </figure>
  );
}

// ── Hoja de ruta ──────────────────────────────────────────────────────────────
const RM_COLOR: Record<string, string> = { ahora: '#5fd19a', pronto: '#e8b33a', multijugador: '#a35ae0' };

export function RoadmapSection() {
  return (
    <section id="hoja-de-ruta" className="border-t border-stone-800">
      <div className="max-w-6xl mx-auto px-4 py-24">
        <h2 className="font-display text-3xl md:text-5xl text-parchment">El camino hacia las profundidades</h2>
        <p className="font-body text-xl text-stone-300 mt-3 max-w-2xl">Hacia dónde va Crypt Raiders.</p>
        <ol className="roadmap mt-12">
          {ROADMAP.map((c, k) => (
            <li key={c.id} className="rm-col" style={{ ['--rm' as string]: RM_COLOR[c.id] }}>
              <div className="rm-head">
                <span className="rm-node"><img src={iconUrl(c.icon, 2)} width={32} height={32} alt="" className="pixelated" /></span>
                {k === 0 && <span className="rm-here">Estás aquí</span>}
              </div>
              <h3 className="font-display text-2xl mt-4" style={{ color: RM_COLOR[c.id] }}>{c.title}</h3>
              <p className="font-display text-xs tracking-[0.2em] uppercase text-stone-400 mt-1">{c.status}</p>
              <ul className="rm-list mt-4">
                {c.items.map((it) => <li key={it}>{it}</li>)}
              </ul>
            </li>
          ))}
        </ol>
        <p className="font-body text-stone-500 mt-10">{ROADMAP_NOTE}</p>
      </div>
    </section>
  );
}
