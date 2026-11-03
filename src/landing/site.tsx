// Cabecera y pie comunes a la landing y a las páginas legales.
// `home` es la ruta a la landing: '' en la propia landing (anclas #) y './' en las páginas legales.

export const PLAY_URL = './play/';

/**
 * Enlace de donaciones (Stripe Payment Link, p. ej. https://donate.stripe.com/...). Mientras sea null, el botón «Apoyar»
 * no aparece en ninguna página. Al ponerlo, también se muestran el apartado «Apoyar el proyecto» de la Política de privacidad
 * y la frase sobre las aportaciones del Aviso legal.
 * Es un enlace a la página de pago de Stripe: esta web no carga nada de Stripe ni guarda datos de pago.
 */
const DONATE_LINK: string | null = 'https://donate.stripe.com/5kQ4gBcm6fUBdK47kS6J200';
/** Un enlace de prueba de Stripe (lleva «/test_») solo se usa en desarrollo: en la web publicada el botón no aparece
 *  hasta poner el enlace real. Así se puede subir el código sin publicar un pago de prueba. */
export const DONATE_URL: string | null =
  DONATE_LINK && (!DONATE_LINK.includes('/test_') || import.meta.env.DEV) ? DONATE_LINK : null;

export function DonateButton({ className = '' }: { className?: string }) {
  if (!DONATE_URL) return null;
  return (
    <a href={DONATE_URL} target="_blank" rel="noopener" className={`btn-donate ${className}`} data-testid="cta-donate"
      aria-label="Apoyar el desarrollo de Crypt Raiders con una aportación (se abre la página de pago de Stripe)">
      <span aria-hidden>♥</span> Apoyar
    </a>
  );
}

export const LEGAL_LINKS = [
  { href: './aviso-legal.html', label: 'Aviso legal' },
  { href: './privacidad.html', label: 'Política de privacidad' },
  { href: './cookies.html', label: 'Política de cookies' },
];

const NAV = [
  ['varkhollow', 'VarkHollow'], ['trailer', 'Tráiler'], ['juego', 'El juego'], ['clases', 'Clases'],
  ['capturas', 'Capturas'], ['demo', 'Demo'], ['hoja-de-ruta', 'Hoja de ruta'],
];

export function SiteHeader({ home = '' }: { home?: string }) {
  return (
    <header className="fixed top-0 inset-x-0 z-30 site-nav">
      <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3 sm:gap-6" aria-label="Principal">
        <a href={home ? home : '#top'} className="font-display font-extrabold whitespace-nowrap text-sm sm:text-base tracking-[0.08em] sm:tracking-[0.14em] text-parchment" aria-label="Crypt Raiders, ir al inicio">CRYPT RAIDERS</a>
        <div className="hidden md:flex gap-5 text-stone-300 font-body text-lg">
          {NAV.map(([id, label]) => <a key={id} href={`${home}#${id}`} className="hover:text-parchment">{label}</a>)}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <a href={PLAY_URL} className="btn-play px-3 sm:px-4 py-1.5 text-sm whitespace-nowrap">Jugar</a>
          <DonateButton className="px-2.5 sm:px-3 py-1.5 text-sm" />
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter({ home = '' }: { home?: string }) {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer border-t border-stone-800" data-testid="site-footer">
      <div className="max-w-6xl mx-auto px-4 py-12 grid gap-8 md:grid-cols-[1.3fr_1fr_1fr] font-body text-base text-stone-400">
        <div>
          <a href={home ? home : '#top'} className="font-display tracking-[0.14em] text-stone-300 hover:text-parchment">CRYPT RAIDERS</a>
          <p className="mt-2 max-w-sm">Juego independiente en desarrollo. Demo jugable: el arte y el sonido actuales son provisionales.</p>
          <p className="mt-3 text-stone-500">© {year} Crypt Raiders. Todos los derechos reservados.</p>
        </div>
        <nav aria-label="El juego">
          <h2 className="font-display text-sm tracking-[0.2em] uppercase text-stone-300 mb-3">El juego</h2>
          <ul className="space-y-1">
            <li><a href={PLAY_URL} className="footer-link">Jugar la demo</a></li>
            <li><a href={`${home}#varkhollow`} className="footer-link">VarkHollow</a></li>
            <li><a href={`${home}#hoja-de-ruta`} className="footer-link">Hoja de ruta</a></li>
            {DONATE_URL && <li><a href={DONATE_URL} target="_blank" rel="noopener" className="footer-link">Apoya el proyecto</a></li>}
            <li><a href={home ? home : '#top'} className="footer-link">Volver al inicio</a></li>
          </ul>
        </nav>
        <nav aria-label="Legal">
          <h2 className="font-display text-sm tracking-[0.2em] uppercase text-stone-300 mb-3">Legal</h2>
          <ul className="space-y-1">
            {LEGAL_LINKS.map((l) => <li key={l.href}><a href={l.href} className="footer-link">{l.label}</a></li>)}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
