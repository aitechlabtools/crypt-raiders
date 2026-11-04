// Maqueta de la landing v2 (no es la web publicada). Parámetros: ?h=a|b|c (titular), ?lore=a|b, ?menu=open, ?cronica=open
import { useEffect, useState } from 'react';
import { Diorama } from '../../src/landing/Diorama';
import { heroUrl, iconUrl, monsterUrl } from '../../src/shared/art';
import { SHOWCASE_GEAR } from '../../src/shared/gearLook';
import { CLASSES } from '../../src/core/data/classes';
import { ZONES as BACKDROPS, zoneBackdrop } from '../../src/game/ui/combatZones';
import { PhoneShot, RoadmapSection, ShotCarousel, type Shot } from '../../src/landing/sections';
import { DonateButton, PLAY_URL, SiteFooter } from '../../src/landing/site';
import type { ClassId } from '../../src/core/types';
import { ALPHA_NOTE, ALPHA_SUPPORT, DEPTHS, FEATURES, HEADLINES, LOOP, LORE } from './content';

const q = new URLSearchParams(location.search);
const H = HEADLINES[(q.get('h') ?? 'a') as 'a'];
const L = LORE[(q.get('lore') ?? 'a') as 'a'];
const SHOT = '/screenshots/landing/';
const SHOTS: Shot[] = [
  { src: SHOT + 'combate', alt: 'Combate', caption: 'Combate por turnos (se volverá a sacar con la barra nueva).' },
  { src: SHOT + 'infierno', alt: 'Infierno', caption: 'Los Ríos de Fuego, en el Infierno.' },
  { src: SHOT + 'cripta', alt: 'Cripta', caption: 'Las criptas de Umbravel.' },
  { src: SHOT + 'alijo', alt: 'Alijo', caption: 'El Alijo: armas de cada rareza (se volverá a sacar).' },
  { src: SHOT + 'forja', alt: 'Forja', caption: 'La forja de Maese Brand.' },
  { src: SHOT + 'tienda', alt: 'Tienda', caption: 'Atuendos con oro del juego.' },
];
const NAV = [['varkhollow', 'VarkHollow'], ['juego', 'El juego'], ['galeria', 'Galería'], ['hoja-de-ruta', 'Hoja de ruta']] as const;

function Play({ big = false }: { big?: boolean }) {
  return <a href={PLAY_URL} className={`btn-play ${big ? 'text-xl px-9 py-4' : 'px-6 py-3'}`}>Jugar la alpha gratis</a>;
}

function Header() {
  const [open, setOpen] = useState(q.get('menu') === 'open');
  const [active, setActive] = useState<string>('');
  useEffect(() => {
    const els = NAV.map(([id]) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) setActive(e.target.id); }, { rootMargin: '-45% 0px -50% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return (
    <header className="fixed top-0 inset-x-0 z-30 site-nav">
      <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4" aria-label="Principal">
        <a href="#top" className="font-display font-extrabold whitespace-nowrap text-sm sm:text-base tracking-[0.12em] text-parchment">CRYPT RAIDERS</a>
        <div className="v2-links gap-6 font-body text-lg">
          {NAV.map(([id, label]) => <a key={id} href={`#${id}`} className={`v2-nav ${active === id ? 'is-on' : ''}`} aria-current={active === id ? 'true' : undefined}>{label}</a>)}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <a href={PLAY_URL} className="btn-play px-4 py-1.5 text-sm whitespace-nowrap">Jugar</a>
          <span className="v2-desk-only"><DonateButton className="px-3 py-1.5 text-sm" /></span>
          <button className="v2-burger" aria-expanded={open} aria-controls="v2-menu" aria-label={open ? 'Cerrar el menú' : 'Abrir el menú'} onClick={() => setOpen(!open)}>{open ? '✕' : '☰'}</button>
        </div>
      </nav>
      {open && (
        <div id="v2-menu" className="v2-menu">
          {NAV.map(([id, label]) => <a key={id} href={`#${id}`} onClick={() => setOpen(false)} className={active === id ? 'is-on' : ''}>{label}</a>)}
          <div className="pt-3"><DonateButton className="px-4 py-2" /></div>
        </div>
      )}
    </header>
  );
}

function VarkHollow() {
  const [open, setOpen] = useState(q.get('cronica') === 'open');
  const [unfold, setUnfold] = useState<Record<string, boolean>>({});
  return (
    <section id="varkhollow" className="relative overflow-hidden">
      <div className="absolute inset-0 vh-glow pointer-events-none" />
      <div className="relative max-w-6xl mx-auto px-4 pt-24 pb-8">
        <p className="font-display text-gold tracking-[0.3em] text-sm uppercase">El mundo</p>
        <h2 className="font-display text-4xl md:text-6xl text-parchment mt-2 leading-tight">Esto es VarkHollow</h2>
        <p className="font-body text-xl md:text-2xl text-stone-300 mt-5 max-w-3xl leading-relaxed">{L.intro}</p>
        <button className="v2-chron-btn mt-5" aria-expanded={open} aria-controls="v2-chron" onClick={() => setOpen(!open)}>
          {open ? '▴ Cerrar la crónica' : '▾ Leer la crónica de VarkHollow'}
        </button>
        <div id="v2-chron" hidden={!open} className="v2-chron">
          {L.chronicle.map((p, i) => <p key={i} dangerouslySetInnerHTML={{ __html: p.replace('[P]', '<mark title="Lore nuevo propuesto">P</mark>') }} />)}
        </div>
        <ol className="depths mt-12" aria-label="El descenso por VarkHollow">
          {DEPTHS.map((d, i) => {
            const shown = unfold[d.id] ?? !matchMedia('(max-width: 767px)').matches;
            return (
              <li key={d.id} className="depth" style={{ ['--depth' as string]: d.color }}>
                <div className="depth-art">
                  <img src={zoneBackdrop(BACKDROPS[d.backdrop as keyof typeof BACKDROPS])} alt="" className="pixelated depth-bg" />
                  <img src={monsterUrl(d.boss, 4)} alt={d.bossName} className="pixelated depth-boss" />
                  <span className="depth-step">{i + 1}</span>
                </div>
                <div className="p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-2xl" style={{ color: d.color }}>{d.name}</h3>
                    <span className="font-display text-sm text-stone-400 whitespace-nowrap">{d.levels}</span>
                  </div>
                  <p className="font-body text-lg text-stone-300 leading-snug mt-2">{d.text}</p>
                  <p className="font-body text-sm text-stone-500 mt-3">Jefe final: {d.bossName}</p>
                  <button className="v2-sub-toggle" aria-expanded={shown} onClick={() => setUnfold({ ...unfold, [d.id]: !shown })}>{shown ? 'Ocultar el descenso' : `Ver el descenso (${d.subs.length})`}</button>
                  {shown && (
                    <ol className="v2-descent" aria-label={`Subzonas de ${d.name}`}>
                      {d.subs.map((s, k) => (
                        <li key={s.name} style={{ ['--k' as string]: (i * 3 + k) / 9 }}>
                          <span className="v2-mark" aria-hidden />
                          <span className="flex items-baseline justify-between gap-2"><b className="font-display text-[15px] text-parchment">{s.name}</b><span className="text-xs text-stone-400 whitespace-nowrap">Nv {s.levels}</span></span>
                          <span className="block text-[15px] text-stone-300 leading-snug">{s.text}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
        <p className="font-body text-stone-400 mt-6 text-base">Cuanto más bajas, más peligro… y mejor botín.</p>
      </div>
    </section>
  );
}

export function Landing() {
  return (
    <div className="min-h-screen">
      <Header />
      <section id="top" className="relative min-h-[100svh] overflow-hidden">
        <Diorama className="absolute inset-0" />
        <div className="absolute inset-0 hero-fade pointer-events-none" />
        <div className="relative z-10 min-h-[100svh] max-w-6xl mx-auto px-4 pt-20 pb-12 grid lg:grid-cols-[1.05fr_1fr] gap-8 items-end lg:items-center">
          <div>
            <h1 className="hero-title font-display font-extrabold text-parchment">CRYPT RAIDERS</h1>
            <p className="font-display text-xl md:text-3xl text-gold mt-3 tracking-wide">{H.title}</p>
            <p className="font-body text-lg md:text-2xl text-bone/90 mt-3 max-w-2xl leading-snug">{H.sub}</p>
            <div className="mt-6 flex flex-wrap gap-3 items-center"><Play big /></div>
            <p className="font-body text-stone-300 mt-3 text-base">Gratis en el navegador, en ordenador o móvil. Sin registro ni descargas.</p>
            <p className="v2-alpha mt-3"><span className="v2-alpha-tag">ALPHA</span> {ALPHA_NOTE} <a href="#apoyar" className="underline decoration-dotted">{ALPHA_SUPPORT}</a></p>
          </div>
          <div className="v2-clip">
            <video src="/trailer/cryptraiders-trailer.mp4#t=6" muted autoPlay loop playsInline preload="metadata" aria-label="Clip del juego en movimiento" />
            <span className="v2-clip-label">Clip de 8 s del juego (se montará del tráiler nuevo)</span>
          </div>
        </div>
      </section>

      <VarkHollow />

      <section id="juego" className="max-w-6xl mx-auto px-4 py-24">
        <p className="font-display text-gold tracking-[0.3em] text-sm uppercase">El juego</p>
        <div className="grid md:grid-cols-[1fr_1.2fr] gap-12 items-start mt-2">
          <h2 className="font-display text-4xl md:text-5xl text-parchment leading-tight">Bajas a por oro. Si vuelves, vuelves rico.</h2>
          <ol className="loop" aria-label="Una expedición, paso a paso">
            {LOOP.map((s) => <li key={s.verb} className="loop-step"><span className="font-display text-2xl text-parchment">{s.verb}.</span><span className="font-body text-lg text-stone-300 leading-snug">{s.text}</span></li>)}
          </ol>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8 mt-16">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-4">
              <div className="item-slot shrink-0"><img src={iconUrl(f.icon, 4)} width={48} height={48} alt="" className="pixelated" /></div>
              <div><h3 className="font-display text-xl text-gold">{f.title}</h3><p className="font-body text-lg text-stone-300 leading-snug mt-1">{f.text}</p></div>
            </div>
          ))}
        </div>
        <h3 className="font-display text-3xl text-parchment mt-20">Elige quién baja</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {(Object.keys(CLASSES) as ClassId[]).map((id) => {
            const c = CLASSES[id];
            return (
              <article key={id} className={`class-card ${c.playable ? '' : 'is-locked'}`}>
                <div className="h-36 flex items-end justify-center"><img src={heroUrl(id, { cloak: id === 'mage' ? 3 : id === 'rogue' ? 2 : id === 'cleric' ? 1 : 0, skin: id === 'cleric' ? 1 : 0 }, 6, 0, 'idle', SHOWCASE_GEAR[id])} width={110} alt={c.name} className="pixelated" /></div>
                <h4 className="font-display text-2xl mt-3" style={{ color: c.color }}>{c.name}</h4>
                <p className="font-body text-base text-stone-300 leading-snug mt-1">{c.playable ? c.tagline + ' ' + (id === 'warrior' ? 'Acero e ímpetu.' : 'Fuego, hielo, sombra y maná.') : 'Próximamente'}</p>
              </article>
            );
          })}
        </div>
        <div className="flex items-end gap-6 mt-16 v2-kael">
          <img src={monsterUrl('rival', 6)} width={96} alt="Kael el Errante" className="pixelated -scale-x-100 shrink-0" />
          <blockquote className="dialogue">«Repartimos lo que encontremos. Tú vigila mi espalda y yo la tuya.» <span className="block text-base not-italic text-stone-400 mt-1">— Kael el Errante, en una de cada tres bajadas a la Mazmorra</span></blockquote>
        </div>
      </section>

      <section id="galeria" className="border-y border-stone-800 bg-crypt">
        <div className="max-w-6xl mx-auto px-4 py-24">
          <p className="font-display text-gold tracking-[0.3em] text-sm uppercase">Galería</p>
          <h2 className="font-display text-3xl md:text-5xl text-parchment mt-2">Así se juega ahora mismo</h2>
          <div className="panel overflow-hidden border border-stone-800 shadow-2xl mt-8">
            <video className="w-full aspect-video block bg-black" src="/trailer/cryptraiders-trailer.mp4" poster="/trailer/poster.jpg" controls preload="none" playsInline />
          </div>
          <p className="font-body text-stone-400 mt-2">Tráiler · imágenes reales del juego.</p>
          <div className="mt-12"><ShotCarousel shots={SHOTS} /></div>
          <div className="grid lg:grid-cols-[1fr_1fr] gap-10 items-center mt-16">
            <div>
              <h3 className="font-display text-3xl text-parchment">También en el móvil</h3>
              <p className="font-body text-xl text-stone-300 mt-3">En horizontal y a pantalla completa, con controles táctiles. Se puede instalar como una app.</p>
              <div className="mt-6"><Play /></div>
            </div>
            <PhoneShot src={SHOT + 'movil-infierno'} alt="El juego en un móvil en horizontal" />
          </div>
        </div>
      </section>

      <RoadmapSection />

      <section id="apoyar" className="relative overflow-hidden border-t border-stone-800">
        <div className="absolute inset-0 demo-glow" />
        <div className="relative max-w-3xl mx-auto px-4 py-20 text-center">
          <h2 className="font-display text-4xl md:text-5xl text-parchment">La puerta está abierta</h2>
          <p className="font-body text-xl text-stone-300 mt-4">Crea a tu saqueador y baja. Tu progreso se guarda en este navegador.</p>
          <div className="mt-8"><Play big /></div>
          <p className="font-body text-stone-400 mt-6">¿Te gusta? Crypt Raiders lo hace una sola persona. <DonateButton className="ml-2 px-3 py-1.5 text-sm align-middle" /></p>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
