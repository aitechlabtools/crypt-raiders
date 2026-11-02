import { useState } from 'react';
import { Diorama } from './Diorama';
import { isMobileLike } from '../shared/device';
import { MobileNotice } from '../shared/MobileNotice';
import { heroUrl, iconUrl, monsterUrl } from '../shared/art';
import { SHOWCASE_GEAR } from '../shared/gearLook';
import { CLASSES } from '../core/data/classes';
import type { ClassId } from '../core/types';

// La descarga solo se activa cuando exista un ejecutable real y comprobado.
const DOWNLOAD_URL: string | null = null;
const PLAY_URL = './play/';

const LOOP = [
  { verb: 'Explora', text: 'Bajas a las criptas con lo puesto y un reloj en contra.' },
  { verb: 'Combate', text: 'Cada criatura te lleva a un duelo por turnos donde la velocidad, el maná, el veneno, el fuego y el hielo deciden.' },
  { verb: 'Negocia', text: 'Te cruzas con otro aventurero. Podéis hablar, aliaros y repartir el botín.' },
  { verb: 'Traiciona', text: 'O no. Una alianza solo dura lo que tarda alguien en decidir que tu mochila vale más que tú.' },
  { verb: 'Escapa', text: 'Si llegas al portal, todo lo que llevas es tuyo. Si caes, se queda abajo.' },
];

const FEATURES = [
  { icon: 'key', title: 'Ninguna bajada es igual', text: 'Cada expedición cambia las salas, los cofres y los peligros. Y la luz de las antorchas nunca llega a todas partes.' },
  { icon: 'staff_fire', title: 'Piensa antes de golpear', text: 'Atacar, protegerte, lanzar un hechizo o beber una poción: tú decides. El veneno, el fuego y el hielo pueden darle la vuelta a cualquier pelea.' },
  { icon: 'chalice', title: 'Botín que se nota', text: 'Armas y armaduras de común a legendario. Cada pieza mejora a tu personaje… y cambia su aspecto.' },
  { icon: 'dagger', title: 'Aliados de los que no fiarse', text: 'Repartir el botín o quedártelo todo tiene consecuencias. Las traiciones avisan, pero no siempre a tiempo.' },
  { icon: 'gem_red', title: 'Todo o nada', text: 'Doce minutos para llegar al portal. Si caes, pierdes lo que llevabas encima. Lo que guardas en el almacén, nunca.' },
  { icon: 'amulet_heart', title: 'Cada bajada te hace más fuerte', text: 'Sube de nivel, cumple encargos y vende tus hallazgos para equiparte mejor la próxima vez.' },
];

const SHOTS = [
  { src: './screenshots/dungeon.png', alt: 'Exploración de la cripta con el aventurero rival como aliado', caption: 'La Sala de los Pilares, con Kael como aliado.' },
  { src: './screenshots/combat.png', alt: 'Combate por turnos contra el Señor del Osario', caption: 'Combate por turnos contra el Señor del Osario.' },
  { src: './screenshots/inventory.png', alt: 'Inventario y equipamiento en el lobby', caption: 'Equipo, estadísticas y mochila en el Bastión.' },
  { src: './screenshots/rival.png', alt: 'Diálogo con Kael el Errante', caption: 'Hablar, aliarse, ignorar o atacar.' },
];

function Sprite({ src, w, label, className = '' }: { src: string; w: number; label: string; className?: string }) {
  return <img src={src} width={w} alt={label} className={`pixelated ${className}`} />;
}

// Abre el aviso para móviles en lugar de lanzar directamente la demo
let openMobileNotice: (() => void) | null = null;
function guardPlay(e: React.MouseEvent) {
  if (isMobileLike() && openMobileNotice) {
    e.preventDefault();
    openMobileNotice();
  }
}

function PlayButton({ big = false }: { big?: boolean }) {
  return (
    <a href={PLAY_URL} onClick={guardPlay} className={`btn-play ${big ? 'text-xl px-9 py-4' : 'px-6 py-3'}`} data-testid="cta-play">
      Jugar la demo gratis
    </a>
  );
}

function DownloadButton() {
  if (DOWNLOAD_URL) return <a href={DOWNLOAD_URL} className="btn-ghost px-6 py-3">Descargar para Windows</a>;
  return (
    <span className="btn-ghost px-6 py-3 opacity-60 cursor-not-allowed" aria-disabled="true" title="Todavía no hay versión descargable" data-testid="cta-download">
      Versión para Windows: próximamente
    </span>
  );
}

export function App() {
  const [notice, setNotice] = useState(false);
  openMobileNotice = () => setNotice(true);
  return (
    <div className="min-h-screen">
      {notice && <MobileNotice onContinue={() => (window.location.href = PLAY_URL)} onClose={() => setNotice(false)} continueLabel="Abrir la demo igualmente" />}
      <header className="fixed top-0 inset-x-0 z-30 site-nav">
        <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6" aria-label="Principal">
          <a href="#top" className="font-display font-extrabold tracking-[0.14em] text-parchment">DREADBOUND</a>
          <div className="hidden md:flex gap-5 text-stone-300 font-body text-lg">
            <a href="#trailer" className="hover:text-parchment">Tráiler</a>
            <a href="#juego" className="hover:text-parchment">El juego</a>
            <a href="#clases" className="hover:text-parchment">Clases</a>
            <a href="#capturas" className="hover:text-parchment">Capturas</a>
            <a href="#demo" className="hover:text-parchment">Demo</a>
          </div>
          <a href={PLAY_URL} onClick={guardPlay} className="ml-auto btn-play px-4 py-1.5 text-sm">Jugar</a>
        </nav>
      </header>

      {/* Cabecera con diorama vivo */}
      <section id="top" className="relative h-[100svh] min-h-[600px] overflow-hidden">
        <Diorama className="absolute inset-0" />
        <div className="absolute inset-0 hero-fade pointer-events-none" />
        <div className="relative z-10 h-full max-w-6xl mx-auto px-4 flex flex-col justify-end pb-16 md:pb-24">
          <h1 className="hero-title font-display font-extrabold text-parchment">DREADBOUND</h1>
          <p className="font-display text-xl md:text-3xl text-gold mt-3 tracking-wide">Confía en tu espada. En nadie más.</p>
          <p className="font-body text-xl md:text-2xl text-bone/90 mt-4 max-w-2xl leading-snug">Baja a las criptas, llena la mochila y encuentra la salida. Los monstruos son lo de menos: el peligro de verdad camina a tu lado.</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <PlayButton big />
            <DownloadButton />
          </div>
          <p className="font-body text-stone-300 mt-4 text-base">Gratis en el navegador de tu ordenador. Sin registro ni descargas.</p>
        </div>
      </section>

      {/* Tráiler */}
      <section id="trailer" className="max-w-5xl mx-auto px-4 pt-24">
        <h2 className="font-display text-3xl md:text-4xl text-parchment text-center mb-8">Tráiler</h2>
        <div className="panel overflow-hidden border border-stone-800 shadow-2xl">
          <video className="w-full aspect-video block bg-black" src="./trailer/dreadbound-trailer.mp4" poster="./trailer/poster.jpg" controls preload="none" playsInline data-testid="trailer-video">
            Tu navegador no puede reproducir el vídeo.
          </video>
        </div>
        <p className="font-body text-stone-400 text-center mt-3">Imágenes reales del juego tal como es hoy.</p>
      </section>

      {/* Concepto: el ciclo de una expedición */}
      <section id="juego" className="max-w-6xl mx-auto px-4 py-24">
        <div className="grid md:grid-cols-[1fr_1.3fr] gap-12 items-start">
          <div>
            <h2 className="font-display text-4xl md:text-5xl text-parchment leading-tight">Bajas a por oro. Si vuelves, vuelves rico.</h2>
            <p className="font-body text-xl text-stone-300 mt-6 leading-relaxed">
              En el Bastión de Ceniza preparas a tu aventurero. Bajo sus muros esperan unas criptas que cambian en cada expedición:
              combates por turnos, cofres por abrir y un portal que debes encontrar antes de que se acabe el tiempo.
            </p>
            <p className="font-body text-xl text-stone-300 mt-4 leading-relaxed">
              Pero no bajas solo. Ahí abajo hay otro aventurero, y puede ser tu mejor aliado o tu peor error.
            </p>
          </div>
          <ol className="loop" aria-label="Una expedición, paso a paso">
            {LOOP.map((s) => (
              <li key={s.verb} className="loop-step">
                <span className="font-display text-2xl md:text-3xl text-parchment">{s.verb}.</span>
                <span className="font-body text-lg text-stone-300 leading-snug">{s.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Características */}
      <section className="border-y border-stone-800 bg-crypt">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <h2 className="font-display text-3xl md:text-4xl text-parchment mb-10">Lo que encontrarás ahí abajo</h2>
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-5">
                <div className="item-slot shrink-0"><img src={iconUrl(f.icon, 4)} width={48} height={48} alt="" className="pixelated" /></div>
                <div>
                  <h3 className="font-display text-xl text-gold">{f.title}</h3>
                  <p className="font-body text-lg text-stone-300 leading-relaxed mt-1 max-w-[52ch]">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* La mecánica diferencial */}
      <section className="max-w-6xl mx-auto px-4 py-24">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-12 items-center">
          <div className="flex items-end justify-center gap-6 lg:gap-10 min-h-[240px]">
            <Sprite src={heroUrl('warrior', { cloak: 0, skin: 0 }, 8, 0, 'idle', SHOWCASE_GEAR.warrior)} w={160} label="Guerrero" />
            <Sprite src={monsterUrl('rival', 8)} w={160} label="Kael el Errante" className="-scale-x-100" />
          </div>
          <div>
            <h2 className="font-display text-4xl text-parchment leading-tight">Kael el Errante te ofrece un trato</h2>
            <blockquote className="dialogue mt-6">
              «Trato hecho. Repartimos lo que encontremos. Tú vigila mi espalda y yo la tuya.»
            </blockquote>
            <p className="font-body text-xl text-stone-300 mt-6 leading-relaxed">
              Puedes hablar con él, aliarte, retarle a un duelo amistoso o seguir tu camino. Como aliado lucha a tu lado y espera su parte
              de cada cofre. Quédatelo todo y empezará a mirar tu mochila.
            </p>
            <p className="font-body text-xl text-stone-300 mt-4 leading-relaxed">
              Traicionarle es un duelo a muerte, sin huida: si ganas, su equipo es tuyo; si pierdes, el tuyo se queda en la cripta. Y recuerda que él también puede decidir que tu mochila vale más que vuestra amistad.
            </p>
          </div>
        </div>
      </section>

      {/* Clases */}
      <section id="clases" className="bg-crypt border-y border-stone-800">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <h2 className="font-display text-3xl md:text-4xl text-parchment">Elige quién baja</h2>
          <p className="font-body text-xl text-stone-300 mt-3 max-w-2xl">En la demo puedes jugar con el Guerrero y el Mago. El Pícaro y el Clérigo llegarán pronto.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
            {(Object.keys(CLASSES) as ClassId[]).map((id) => {
              const c = CLASSES[id];
              return (
                <article key={id} className={`class-card ${c.playable ? '' : 'is-locked'}`}>
                  <div className="h-44 flex items-end justify-center">
                    <Sprite src={heroUrl(id, { cloak: id === 'mage' ? 3 : id === 'rogue' ? 2 : id === 'cleric' ? 1 : 0, skin: id === 'cleric' ? 1 : 0 }, 7, 0, 'idle', SHOWCASE_GEAR[id])} w={140} label={c.name} />
                  </div>
                  <h3 className="font-display text-2xl mt-4" style={{ color: c.color }}>{c.name}</h3>
                  <p className="font-body italic text-stone-300">{c.tagline}</p>
                  <p className="font-body text-lg text-stone-300 mt-3 leading-snug">{c.description}</p>
                  <p className="font-body text-base mt-4 text-stone-400">{c.playable ? 'Disponible' : 'Próximamente'}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Capturas reales */}
      <section id="capturas" className="max-w-6xl mx-auto px-4 py-24">
        <h2 className="font-display text-3xl md:text-4xl text-parchment">Así se ve ahora mismo</h2>
        <p className="font-body text-xl text-stone-300 mt-3">Capturas reales de la demo, sin retoques.</p>
        <div className="grid md:grid-cols-2 gap-6 mt-10">
          {SHOTS.map((s) => (
            <figure key={s.src} className="shot">
              <img src={s.src} alt={s.alt} loading="lazy" width={1440} height={900} />
              <figcaption className="font-body text-lg text-stone-300 mt-2">{s.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Demo */}
      <section id="demo" className="relative overflow-hidden border-t border-stone-800">
        <div className="absolute inset-0 demo-glow" />
        <div className="relative max-w-6xl mx-auto px-4 py-24 grid lg:grid-cols-[1.2fr_1fr] gap-12">
          <div>
            <h2 className="font-display text-4xl md:text-5xl text-parchment leading-tight">Juega gratis ahora</h2>
            <p className="font-body text-xl text-stone-300 mt-4 max-w-xl leading-relaxed">Crea a tu aventurero, equípalo, baja a unas criptas que nunca son iguales y vuelve con algo. Tu progreso se guarda en este navegador.</p>
            <div className="mt-8"><PlayButton big /></div>
            <p className="font-body text-stone-400 mt-4">Necesitas un ordenador con teclado y ratón.</p>
          </div>
          <div className="grid grid-cols-2 gap-8 font-body text-lg">
            <div>
              <h3 className="font-display text-xl text-heal mb-3">Ya disponible</h3>
              <ul className="space-y-1.5 text-stone-300">
                <li>Guerrero y Mago</li>
                <li>Mazmorras distintas en cada expedición</li>
                <li>Esqueletos, murciélagos y un jefe</li>
                <li>Combate por turnos completo</li>
                <li>Inventario, almacén y mercader</li>
                <li>Un rival que decide por sí mismo si ayudarte o traicionarte</li>
                <li>Misiones y niveles</li>
              </ul>
            </div>
            <div>
              <h3 className="font-display text-xl text-stone-300 mb-3">En camino</h3>
              <ul className="space-y-1.5 text-stone-400">
                <li>Multijugador con personas reales</li>
                <li>Pícaro y Clérigo</li>
                <li>Arte y música definitivos</li>
                <li>Versión para Windows</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Descarga */}
      <section id="descarga" className="bg-crypt border-y border-stone-800">
        <div className="max-w-6xl mx-auto px-4 py-16 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <h2 className="font-display text-3xl text-parchment">Versión para Windows</h2>
            <p className="font-body text-xl text-stone-300 mt-2 max-w-2xl">Estamos preparando una versión descargable con el mismo juego. Aparecerá aquí cuando el instalador esté probado.</p>
          </div>
          <DownloadButton />
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-4 md:items-center text-stone-400 font-body text-base">
        <span className="font-display tracking-[0.14em] text-stone-300">DREADBOUND</span>
        <span>Juego independiente en desarrollo. Demo 0.1. El arte y el sonido actuales son provisionales.</span>
        <div className="md:ml-auto flex gap-5">
          <a href={PLAY_URL} onClick={guardPlay} className="hover:text-parchment">Jugar</a>
          <a href="#juego" className="hover:text-parchment">El juego</a>
          <a href="#top" className="hover:text-parchment">Volver arriba</a>
        </div>
      </footer>
    </div>
  );
}
