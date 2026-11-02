/**
 * ¿Es un dispositivo táctil sin ratón o una pantalla muy pequeña?
 * La demo se juega con teclado y ratón, así que en esos casos avisamos.
 */
export function isMobileLike(): boolean {
  if (typeof window === 'undefined') return false;
  const mq = (q: string) => window.matchMedia?.(q).matches ?? false;
  const touchOnly = mq('(pointer: coarse)') && !mq('(any-pointer: fine)');
  return touchOnly || window.innerWidth < 760;
}

export function playUrl(): string {
  return new URL('./play/', window.location.href.replace(/play\/?.*$/, '')).href;
}

/** Comparte o copia el enlace de la demo. Devuelve el mensaje para el usuario. */
export async function shareDemoLink(): Promise<string> {
  const url = playUrl();
  try {
    if (navigator.share) {
      await navigator.share({ title: 'DREADBOUND · Demo', text: 'Juega la demo de DREADBOUND en el ordenador:', url });
      return 'Enlace compartido.';
    }
    await navigator.clipboard.writeText(url);
    return 'Enlace copiado. Pégalo en el navegador de tu ordenador.';
  } catch {
    return url;
  }
}
