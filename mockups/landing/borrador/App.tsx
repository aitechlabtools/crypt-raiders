import { Diorama } from './Diorama';
import { heroUrl, iconUrl, monsterUrl } from '../shared/art';
import { SHOWCASE_GEAR } from '../shared/gearLook';
import { CLASSES } from '../core/data/classes';
import type { ClassId } from '../core/types';
import { PhoneShot, RoadmapSection, ShotCarousel, VarkHollowSection, type Shot } from './sections';

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
  { icon: 'key', title: 'Ninguna bajada es igual', text: 'Tres zonas cada vez más hondas —la Mazmorra, la Cripta y el Infierno— y cada expedición cambia las salas, los cofres y los peligros. La luz de las antorchas nunca llega a todas partes.' },
  { icon: 'staff_fire', title: 'Piensa antes de golpear', text: 'Atacar, protegerte, lanzar un hechizo o beber una poción: tú decides. El veneno, el fuego y el hielo pueden darle la vuelta a cualquier pelea.' },
  { icon: 'chalice', title: 'Botín que se nota', text: 'Armas y armaduras de común a legendario. Cada pieza mejora a tu personaje… y cambia su aspecto.' },
  { icon: 'dagger', title: 'Aliados de los que no fiarse', text: 'Repartir el botín o quedártelo todo tiene consecuencias. Las traiciones avisan, pero no siempre a tiempo.' },
  { icon: 'gem_red', title: 'Todo o nada', text: 'Doce minutos para llegar al portal. Si caes, pierdes lo que llevabas encima. Lo que guardas en el almacén, nunca.' },
  { icon: 'amulet_heart', title: 'Cada bajada te hace más fuerte', text: 'Sube hasta el nivel 100, cumple los encargos de cuatro mercaderes y gana su confianza: mejores precios, mejor mercancía.' },
  { icon: 'shield_iron', title: 'Espadas de alquiler', text: 'Contrata mercenarios a Garra Roja o rompe las cadenas de los prisioneros que encuentres abajo. Si caen, el contrato se rompe.' },
  { icon: 'pick', title: 'Pica, forja y luce', text: 'Saca mineral de las vetas con tu pico, llévaselo a Maese Brand para forjar tus armas y compra con el oro del juego atuendos completos que cambian cómo te ves, nunca lo fuerte que eres.' },
];

// Borrador: capturas de los menús nuevos (nivel 1) + algunas antiguas de combate. Las finales se harán con una partida avanzada.
const SHOTS: Shot[] = [
  { src: './screenshots/borrador/escritorio-jugar.png', alt: 'Pantalla Jugar del Bastión de Ceniza con el héroe bajo un haz de luz', caption: 'El Bastión de Ceniza: prepara la bajada.' },
  { src: './screenshots/combat.png', alt: 'Combate por turnos contra el Señor del Osario', caption: 'Combate por turnos contra el Señor del Osario.' },
  { src: './screenshots/infierno.jpg', alt: 'Exploración del Infierno', caption: 'El Infierno: la zona más honda.' },
  { src: './screenshots/borrador/escritorio-alijo.png', alt: 'Alijo con el equipo, la mochila y el almacén', caption: 'El Alijo: equipo, mochila, bolsillo seguro y almacén.' },
  { src: './screenshots/borrador/escritorio-mercader-forja.png', alt: 'Forja de Maese Brand dentro de los Mercaderes', caption: 'Mercaderes: forja, misiones, reputación y mercenarios.' },
  { src: './screenshots/borrador/escritorio-tienda.png', alt: 'Tienda de atuendos que se compran con oro del juego', caption: 'Atuendos con oro del juego. Solo estéticos.' },
  { src: './screenshots/mercenary.jpg', alt: 'Combate en el Infierno con una mercenaria aliada', caption: 'En el Infierno, con Nyx la Pirómana a sueldo.' },
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
      Versión para Windows: próximamente
    </span>
  );
}

export function App() {
  return (
    <div className="min-h-screen">
      <header className="fixed top-0 inset-x-0 z-30 site-nav">
        <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6" aria-label="Principal">
          <a href="#top" className="font-display font-extrabold tracking-[0.14em] text-parchment">CRYPT RAIDERS</a>
          <div className="hidden md:flex gap-5 text-stone-300 font-body text-lg">
            <a href="#varkhollow" className="hover:text-parchment">VarkHollow</a>
            <a href="#trailer" className="hover:text-parchment">Tráiler</a>
            <a href="#juego" className="hover:text-parchment">El juego</a>
            <a href="#clases" className="hover:text-parchment">Clases</a>
            <a href="#capturas" className="hover:text-parchment">Capturas</a>
            <a href="#demo" className="hover:text-parchment">Demo</a>
            <a href="#hoja-de-ruta" className="hover:text-parchment">Hoja de ruta</a>
          </div>
          <a href={PLAY_URL} className="ml-auto btn-play px-4 py-1.5 text-sm">Jugar</a>
        </nav>
      </header>

      {/* Cabecera con diorama vivo */}
      <section id="top" className="relative h-[100svh] min-h-[600px] overflow-hidden">
        <Diorama className="absolute inset-0" />
        <div className="absolute inset-0 hero-fade pointer-events-none" />
        <div className="relative z-10 h-full max-w-6xl mx-auto px-4 flex flex-col justify-end pb-16 md:pb-24">
          <h1 className="hero-title font-display font-extrabold text-parchment">CRYPT RAIDERS</h1>
          <p className="font-display text-xl md:text-3xl text-gold mt-3 tracking-wide">Confía en tu espada. En nadie más.</p>
          <p className="font-body text-xl md:text-2xl text-bone/90 mt-4 max-w-2xl leading-snug">Baja a las criptas, llena la mochila y encuentra la salida. Los monstruos son lo de menos: el peligro de verdad camina a tu lado.</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <PlayButton big />
            <DownloadButton />
          </div>
          <p className="font-body text-stone-300 mt-4 text-base">Gratis en el navegador, en ordenador o móvil. Sin registro ni descargas.</p>
        </div>
      </section>

      <VarkHollowSection />

      {/* Tráiler */}
      <section id="trailer" className="max-w-5xl mx-auto px-4 pt-24">
        <h2 className="font-display text-3xl md:text-4xl text-parchment text-center mb-8">Tráiler</h2>
        <div className="panel overflow-hidden border border-stone-800 shadow-2xl">
          <video className="w-full aspect-video block bg-black" src="./trailer/cryptraiders-trailer.mp4" poster="./trailer/poster.jpg" controls preload="none" playsInline data-testid="trailer-video">
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
        <div className="mt-10"><ShotCarousel shots={SHOTS} /></div>
      </section>

      {/* Demo */}
      <section id="demo" className="relative overflow-hidden border-t border-stone-800">
        <div className="absolute inset-0 demo-glow" />
        <div className="relative max-w-6xl mx-auto px-4 py-24 grid lg:grid-cols-[1fr_1.1fr] gap-12 items-center">
          <div>
            <h2 className="font-display text-4xl md:text-5xl text-parchment leading-tight">Juega gratis ahora</h2>
            <p className="font-body text-xl text-stone-300 mt-4 max-w-xl leading-relaxed">Crea a tu aventurero, equípalo, baja a unas criptas que nunca son iguales y vuelve con algo. Tu progreso se guarda en este navegador.</p>
            <div className="mt-8"><PlayButton big /></div>
            <p className="font-body text-stone-400 mt-4">En ordenador con teclado y ratón, o en el móvil en horizontal a pantalla completa, con controles táctiles. También puedes instalarlo como una app.</p>
          </div>
          <PhoneShot src="./screenshots/borrador/movil-mazmorra.png" alt="Crypt Raiders en un móvil en horizontal: joystick, poción y botón Usar" />
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

      <RoadmapSection />

      <footer className="max-w-6xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-4 md:items-center text-stone-400 font-body text-base">
        <span className="font-display tracking-[0.14em] text-stone-300">CRYPT RAIDERS</span>
        <span>Juego independiente en desarrollo. Demo 0.1. El arte y el sonido actuales son provisionales.</span>
        <div className="md:ml-auto flex gap-5">
          <a href={PLAY_URL} className="hover:text-parchment">Jugar</a>
          <a href="#juego" className="hover:text-parchment">El juego</a>
          <a href="#top" className="hover:text-parchment">Volver arriba</a>
        </div>
      </footer>
    </div>
  );
}
