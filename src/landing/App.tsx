import { Diorama } from './Diorama';
import { heroUrl, iconUrl, monsterUrl } from '../shared/art';
import { CLASSES } from '../core/data/classes';
import type { ClassId } from '../core/types';

// La descarga solo se activa cuando exista un ejecutable real y comprobado.
const DOWNLOAD_URL: string | null = null;
const PLAY_URL = './play/';

const LOOP = [
  { verb: 'Explora', text: 'Bajas a las criptas con lo puesto y un reloj en contra.' },
  { verb: 'Combate', text: 'Cada criatura te lleva a un duelo por turnos donde la velocidad, el maná y los estados deciden.' },
  { verb: 'Negocia', text: 'Te cruzas con otro aventurero. Podéis hablar, aliaros y repartir el botín.' },
  { verb: 'Traiciona', text: 'O no. Una alianza solo dura lo que tarda alguien en decidir que tu mochila vale más que tú.' },
  { verb: 'Escapa', text: 'Si llegas al portal, todo lo que llevas es tuyo. Si caes, se queda abajo.' },
];

const FEATURES = [
  { icon: 'key', title: 'Mazmorras isométricas', text: 'Salas conectadas, puertas, trampas de pinchos y antorchas que apenas alcanzan. Lo que no ves, también te ve.' },
  { icon: 'staff_fire', title: 'Combate por turnos', text: 'Orden por velocidad, habilidades con coste, defensa, pociones y huida. Veneno, quemadura, congelación, sangrado y aturdimiento.' },
  { icon: 'chalice', title: 'Botín con rarezas', text: 'De común a legendario. Inventario en cuadrícula, arrastrar y soltar, comparación de equipo y pilas de consumibles.' },
  { icon: 'dagger', title: 'Alianzas y traiciones', text: 'Repartir o no el botín cambia lo que el otro piensa de ti. Las traiciones avisan, pero no siempre a tiempo.' },
  { icon: 'gem_red', title: 'Extracción con riesgo', text: 'Doce minutos para encontrar el portal. Morir cuesta todo lo que llevabas encima. El almacén del Bastión, nunca.' },
  { icon: 'amulet_heart', title: 'Progresión', text: 'Experiencia y niveles, misiones con recompensa, oro y un mercader que compra lo que sacas de ahí abajo.' },
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

function PlayButton({ big = false }: { big?: boolean }) {
  return (
    <a href={PLAY_URL} className={`btn-play ${big ? 'text-xl px-9 py-4' : 'px-6 py-3'}`} data-testid="cta-play">
      Jugar la demo gratis
    </a>
  );
}

function DownloadButton() {
  if (DOWNLOAD_URL) return <a href={DOWNLOAD_URL} className="btn-ghost px-6 py-3">Descargar para Windows</a>;
  return (
    <span className="btn-ghost px-6 py-3 opacity-60 cursor-not-allowed" aria-disabled="true" title="Todavía no hay versión descargable" data-testid="cta-download">
      Descargar juego · Próximamente
    </span>
  );
}

export function App() {
  return (
    <div className="min-h-screen">
      <header className="fixed top-0 inset-x-0 z-30 site-nav">
        <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6" aria-label="Principal">
          <a href="#top" className="font-display font-extrabold tracking-[0.14em] text-parchment">DREADBOUND</a>
          <div className="hidden md:flex gap-5 text-stone-300 font-body text-lg">
            <a href="#juego" className="hover:text-parchment">El juego</a>
            <a href="#clases" className="hover:text-parchment">Clases</a>
            <a href="#capturas" className="hover:text-parchment">Capturas</a>
            <a href="#demo" className="hover:text-parchment">Demo</a>
          </div>
          <a href={PLAY_URL} className="ml-auto btn-play px-4 py-1.5 text-sm">Jugar</a>
        </nav>
      </header>

      {/* Cabecera con diorama vivo */}
      <section id="top" className="relative h-[100svh] min-h-[600px] overflow-hidden">
        <Diorama className="absolute inset-0" />
        <div className="absolute inset-0 hero-fade pointer-events-none" />
        <div className="relative z-10 h-full max-w-6xl mx-auto px-4 flex flex-col justify-end pb-16 md:pb-24">
          <h1 className="hero-title font-display font-extrabold text-parchment">DREADBOUND</h1>
          <p className="font-display text-xl md:text-3xl text-gold mt-3 tracking-wide">Trust No One. Escape With Everything.</p>
          <p className="font-body text-xl md:text-2xl text-bone/90 mt-4 max-w-xl leading-snug">Un RPG de extracción donde las mazmorras son peligrosas, pero los aventureros todavía más.</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <PlayButton big />
            <DownloadButton />
          </div>
          <p className="font-body text-stone-300 mt-4 text-base">Demo para navegador de escritorio. Sin registro. Un jugador con aventureros controlados por IA.</p>
        </div>
      </section>

      {/* Concepto: el ciclo de una expedición */}
      <section id="juego" className="max-w-6xl mx-auto px-4 py-24">
        <div className="grid md:grid-cols-[1fr_1.3fr] gap-12 items-start">
          <div>
            <h2 className="font-display text-4xl md:text-5xl text-parchment leading-tight">Bajas a por oro. Subes, si subes, con lo que puedas cargar.</h2>
            <p className="font-body text-xl text-stone-300 mt-6 leading-relaxed">
              En DREADBOUND preparas a tu aventurero en el Bastión de Ceniza y bajas a criptas compartidas con otros buscadores de fortuna.
              Combates por turnos contra lo que vive allí abajo, abres cofres y buscas el portal antes de que se acabe el tiempo.
            </p>
            <p className="font-body text-xl text-stone-300 mt-4 leading-relaxed">
              Lo que de verdad cambia cada partida son los demás aventureros: pueden ayudarte, ignorarte o esperar a que estés malherido.
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
            <Sprite src={heroUrl('warrior', { cloak: 0, skin: 0 }, 8)} w={160} label="Guerrero" />
            <Sprite src={monsterUrl('rival', 8)} w={160} label="Kael el Errante" className="-scale-x-100" />
          </div>
          <div>
            <h2 className="font-display text-4xl text-parchment leading-tight">Kael el Errante te ofrece un trato</h2>
            <blockquote className="dialogue mt-6">
              «Trato hecho. Repartimos lo que encontremos. Tú vigila mi espalda y yo la tuya.»
            </blockquote>
            <p className="font-body text-xl text-stone-300 mt-6 leading-relaxed">
              Puedes hablar con él, aliarte, proponer un duelo amistoso que no mata a nadie, ignorarlo o atacarlo.
              Si sois aliados combate a tu lado y espera su parte de cada cofre. Quédatelo todo y empezará a mirar tu mochila.
            </p>
            <p className="font-body text-xl text-stone-300 mt-4 leading-relaxed">
              Traicionar a un aliado exige confirmarlo, para que nadie lo haga por un mal clic. Que te traicionen a ti, no.
            </p>
          </div>
        </div>
      </section>

      {/* Clases */}
      <section id="clases" className="bg-crypt border-y border-stone-800">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <h2 className="font-display text-3xl md:text-4xl text-parchment">Elige quién baja</h2>
          <p className="font-body text-xl text-stone-300 mt-3 max-w-2xl">Guerrero y Mago están completos en la demo. Pícaro y Clérigo están en desarrollo.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
            {(Object.keys(CLASSES) as ClassId[]).map((id) => {
              const c = CLASSES[id];
              return (
                <article key={id} className={`class-card ${c.playable ? '' : 'is-locked'}`}>
                  <div className="h-44 flex items-end justify-center">
                    <Sprite src={heroUrl(id, { cloak: id === 'mage' ? 3 : id === 'rogue' ? 2 : id === 'cleric' ? 1 : 0, skin: id === 'cleric' ? 1 : 0 }, 7)} w={140} label={c.name} />
                  </div>
                  <h3 className="font-display text-2xl mt-4" style={{ color: c.color }}>{c.name}</h3>
                  <p className="font-body italic text-stone-300">{c.tagline}</p>
                  <p className="font-body text-lg text-stone-300 mt-3 leading-snug">{c.description}</p>
                  <p className="font-body text-base mt-4 text-stone-400">{c.playable ? 'Jugable en la demo' : 'En desarrollo'}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Capturas reales */}
      <section id="capturas" className="max-w-6xl mx-auto px-4 py-24">
        <h2 className="font-display text-3xl md:text-4xl text-parchment">Capturas de la demo</h2>
        <p className="font-body text-xl text-stone-300 mt-3">Tomadas directamente de la versión jugable actual.</p>
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
            <h2 className="font-display text-4xl md:text-5xl text-parchment leading-tight">Juega ahora en el navegador</h2>
            <p className="font-body text-xl text-stone-300 mt-4 max-w-xl leading-relaxed">Crea a tu aventurero, equípalo, baja a las Criptas de Umbravel y vuelve con algo. Tu progreso se guarda en este navegador.</p>
            <div className="mt-8"><PlayButton big /></div>
            <p className="font-body text-stone-400 mt-4">Recomendado: ordenador con teclado y ratón. WASD o clic para moverte, E para interactuar.</p>
          </div>
          <div className="grid grid-cols-2 gap-8 font-body text-lg">
            <div>
              <h3 className="font-display text-xl text-heal mb-3">En la demo</h3>
              <ul className="space-y-1.5 text-stone-300">
                <li>Guerrero y Mago</li>
                <li>Una cripta de seis salas</li>
                <li>Esqueletos, murciélagos y un jefe</li>
                <li>Combate por turnos completo</li>
                <li>Inventario, almacén y mercader</li>
                <li>Un aventurero rival con IA</li>
                <li>Misiones y niveles</li>
              </ul>
            </div>
            <div>
              <h3 className="font-display text-xl text-stone-300 mb-3">Todavía no</h3>
              <ul className="space-y-1.5 text-stone-400">
                <li>Multijugador con personas reales</li>
                <li>Mazmorras procedurales</li>
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
        <span>Proyecto indie en desarrollo. Demo v0.1. Arte y sonido provisionales generados por código.</span>
        <div className="md:ml-auto flex gap-5">
          <a href={PLAY_URL} className="hover:text-parchment">Jugar</a>
          <a href="#juego" className="hover:text-parchment">El juego</a>
          <a href="#top" className="hover:text-parchment">Volver arriba</a>
        </div>
      </footer>
    </div>
  );
}
