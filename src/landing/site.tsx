import { useEffect, useState } from 'react';
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

const NAV = [['varkhollow', 'VarkHollow'], ['juego', 'El juego'], ['galeria', 'Galería'], ['hoja-de-ruta', 'Hoja de ruta']] as const;

/** Menú fijo: 4 enlaces (en móvil, plegados en ☰), Jugar siempre visible y Apoyar (en móvil, dentro del menú). Resalta la sección visible. */
export function SiteHeader({ home = '' }: { home?: string }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');
  useEffect(() => {
    if (home) return;
    const els = NAV.map(([id]) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) setActive(e.target.id); }, { rootMargin: '-45% 0px -50% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [home]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open]);
  return (
    <header className="fixed top-0 inset-x-0 z-30 site-nav">
      <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4 sm:gap-6" aria-label="Principal">
        <a href={home ? home : '#top'} className="font-display font-extrabold whitespace-nowrap text-sm sm:text-base tracking-[0.08em] sm:tracking-[0.14em] text-parchment py-3" aria-label="Crypt Raiders, ir al inicio">CRYPT RAIDERS</a>
        <div className="nav-links gap-6 font-body text-lg">
          {NAV.map(([id, label]) => <a key={id} href={`${home}#${id}`} className={`nav-link ${active === id ? 'is-on' : ''}`} aria-current={active === id ? 'location' : undefined}>{label}</a>)}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <a href={PLAY_URL} className="btn-play px-4 py-1.5 text-sm whitespace-nowrap" data-testid="nav-play">Jugar</a>
          <span className="nav-desk"><DonateButton className="px-3 py-1.5 text-sm" /></span>
          <button className="nav-burger" aria-expanded={open} aria-controls="menu-movil" aria-label={open ? 'Cerrar el menú' : 'Abrir el menú'} onClick={() => setOpen(!open)} data-testid="nav-burger">{open ? '✕' : '☰'}</button>
        </div>
      </nav>
      {open && (
        <div id="menu-movil" className="nav-menu" data-testid="nav-menu">
          {NAV.map(([id, label]) => <a key={id} href={`${home}#${id}`} onClick={() => setOpen(false)} className={active === id ? 'is-on' : ''}>{label}</a>)}
          {DONATE_URL && <div className="pt-4"><DonateButton className="px-4 py-2" /></div>}
        </div>
      )}
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
          <p className="mt-2 max-w-sm">Juego independiente en desarrollo, en fase alpha: el arte y el sonido actuales son provisionales.</p>
          <p className="mt-3 text-stone-500">© {year} Crypt Raiders. Todos los derechos reservados.</p>
        </div>
        <nav aria-label="El juego">
          <h2 className="font-display text-sm tracking-[0.2em] uppercase text-stone-300 mb-3">El juego</h2>
          <ul className="space-y-1">
            <li><a href={PLAY_URL} className="footer-link">Jugar la alpha</a></li>
            {NAV.map(([id, label]) => <li key={id}><a href={`${home}#${id}`} className="footer-link">{label}</a></li>)}
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
