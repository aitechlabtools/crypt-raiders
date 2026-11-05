import { useSyncExternalStore } from 'react';

/**
 * ¿Es un dispositivo táctil sin ratón o una pantalla muy pequeña?
 * Utilidades de dispositivo: detectar pantallas táctiles y compartir el enlace del juego.
 */
export function isMobileLike(): boolean {
  if (typeof window === 'undefined') return false;
  const mq = (q: string) => window.matchMedia?.(q).matches ?? false;
  const touchOnly = mq('(pointer: coarse)') && !mq('(any-pointer: fine)');
  return touchOnly || window.innerWidth < 760;
}

// ── Modo táctil en vivo ────────────────────────────────────────────────────────
// Antes se decidía una sola vez al cargar y se descartaban las pantallas táctiles que además
// tienen un puntero fino (tabletas con funda-teclado, portátiles táctiles, algunos Android):
// esos jugadores se quedaban sin joystick. Ahora el valor inicial es una estimación y el
// primer toque o el primer movimiento de ratón lo corrigen al momento.
const mq = (q: string) => (typeof window !== 'undefined' && window.matchMedia?.(q).matches) || false;
function guessTouch(): boolean {
  if (typeof window === 'undefined') return false;
  if (mq('(pointer: coarse)')) return true;
  return (navigator.maxTouchPoints ?? 0) > 0 && !mq('(pointer: fine)');
}
let touchMode = guessTouch();
const listeners = new Set<() => void>();
function setTouchMode(v: boolean) {
  if (v === touchMode) return;
  touchMode = v;
  if (typeof document !== 'undefined') document.documentElement.classList.toggle('is-touch', v);
  listeners.forEach((l) => l());
}
let watching = false;
/** Empieza a escuchar el tipo de puntero (se llama una vez al arrancar el juego). */
export function watchPointerType(): void {
  if (watching || typeof window === 'undefined') return;
  watching = true;
  document.documentElement.classList.toggle('is-touch', touchMode);
  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') setTouchMode(true);
    else if (e.pointerType === 'mouse') setTouchMode(false);
  }, { capture: true, passive: true });
  // Un ratón que se mueve de verdad (no el «mousemove» que los móviles simulan tras un toque).
  window.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' && (e.movementX || e.movementY)) setTouchMode(false); }, { capture: true, passive: true });
}
/** ¿Se juega con el dedo ahora mismo? */
export function isTouch(): boolean { return touchMode; }
export function subscribeTouch(l: () => void): () => void { listeners.add(l); return () => listeners.delete(l); }
/** Hook de React: se vuelve a pintar cuando el jugador cambia entre dedo y ratón. */
export function useIsTouch(): boolean { return useSyncExternalStore(subscribeTouch, isTouch, () => false); }

export function playUrl(): string {
  return new URL('./play/', window.location.href.replace(/play\/?.*$/, '')).href;
}

/** Comparte o copia el enlace del juego. Devuelve el mensaje para el usuario. */
export async function shareGameLink(): Promise<string> {
  const url = playUrl();
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Crypt Raiders · Alpha', text: 'Juega gratis la alpha de Crypt Raiders:', url });
      return 'Enlace compartido.';
    }
    await navigator.clipboard.writeText(url);
    return 'Enlace copiado. Pégalo en el navegador de tu ordenador.';
  } catch {
    return url;
  }
}

/** iPhone o iPad con Safari (o cualquier navegador de iOS, que usan el mismo motor): pueden borrar los datos tras 7 días sin visitar la web. */
export function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  return iOS;
}

/** El juego se abrió desde la pantalla de inicio (instalado como app). */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (navigator as Navigator & { standalone?: boolean }).standalone === true || window.matchMedia?.('(display-mode: standalone)').matches === true;
}
