// Pantalla completa y orientación. Safari usa los nombres con prefijo «webkit»;
// el iPhone no deja poner una web a pantalla completa: allí se instala en la pantalla de inicio.
import { useEffect, useState } from 'react';

type FsDoc = Document & { webkitFullscreenEnabled?: boolean; webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> | void };
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type LockableOrientation = ScreenOrientation & { lock?: (o: string) => Promise<void>; unlock?: () => void };

const doc = () => document as FsDoc;

/** ¿El navegador deja poner la página a pantalla completa? (no en iPhone) */
export function canFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  return !!(doc().fullscreenEnabled || doc().webkitFullscreenEnabled);
}
export function isFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  return !!(doc().fullscreenElement || doc().webkitFullscreenElement);
}
/** ¿Se abrió como app instalada (desde la pantalla de inicio)? Entonces ya ocupa toda la pantalla.
 *  OJO: Chrome también marca «display-mode: fullscreen» cuando la web entra a pantalla completa con el botón;
 *  eso NO es una app instalada (si no, el botón ⛶ desaparecería y no se podría salir). */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  if ((navigator as Navigator & { standalone?: boolean }).standalone === true) return true; // iPhone instalada
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
  return !!window.matchMedia?.('(display-mode: fullscreen)').matches && !isFullscreen();
}
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPod/.test(navigator.userAgent) || (/iPad|Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
}

/** Pone la página a pantalla completa y, si se puede (Android), fija la horizontal. */
export async function enterFullscreen(): Promise<boolean> {
  const el = document.documentElement as FsEl;
  try {
    if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' });
    else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    else return false;
  } catch { return false; }
  await lockLandscape();
  return true;
}
export async function exitFullscreen(): Promise<void> {
  try {
    (screen.orientation as LockableOrientation | undefined)?.unlock?.();
    if (document.exitFullscreen) await document.exitFullscreen();
    else await doc().webkitExitFullscreen?.();
  } catch { /* ya no estaba a pantalla completa */ }
}
/** Fija la orientación horizontal. Solo funciona a pantalla completa o instalada (Android); en iOS no existe. */
export async function lockLandscape(): Promise<boolean> {
  try { await (screen.orientation as LockableOrientation | undefined)?.lock?.('landscape'); return true; } catch { return false; }
}

/** Hook: true mientras la página está a pantalla completa (o abierta como app instalada). */
export function useFullscreen(): boolean {
  const [on, setOn] = useState(() => isFullscreen() || isStandalone());
  useEffect(() => {
    const upd = () => setOn(isFullscreen() || isStandalone());
    document.addEventListener('fullscreenchange', upd);
    document.addEventListener('webkitfullscreenchange', upd);
    return () => { document.removeEventListener('fullscreenchange', upd); document.removeEventListener('webkitfullscreenchange', upd); };
  }, []);
  return on;
}
