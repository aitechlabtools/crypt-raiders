import { useEffect, useState } from 'react';
import { useIsTouch } from './device';
import { lockLandscape } from './fullscreen';

/** ¿Móvil en vertical? Las tabletas caben también en vertical, así que solo avisamos en pantallas estrechas. */
function phonePortrait(): boolean {
  return window.matchMedia('(orientation: portrait)').matches && window.innerWidth < 700;
}

/**
 * En móvil en vertical tapa el juego y pide girarlo: Gravevow se juega en horizontal.
 * Mientras se ve, avisa con onChange(true) para congelar la escena. No rota la página con CSS:
 * eso rompe los toques y el teclado; donde se puede (Android a pantalla completa) se fija la horizontal.
 */
export function RotateNotice({ onChange }: { onChange?: (shown: boolean) => void }) {
  const [portrait, setPortrait] = useState(false);
  const touch = useIsTouch();
  useEffect(() => {
    if (!touch) { setPortrait(false); return; }
    const mq = window.matchMedia('(orientation: portrait)');
    const upd = () => setPortrait(phonePortrait());
    upd(); mq.addEventListener('change', upd); window.addEventListener('resize', upd);
    return () => { mq.removeEventListener('change', upd); window.removeEventListener('resize', upd); };
  }, [touch]);
  useEffect(() => { onChange?.(portrait); }, [portrait, onChange]);
  if (!portrait) return null;
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#07060a] p-8 text-center" role="dialog" aria-modal="true" data-testid="rotate-notice"
      onClick={() => void lockLandscape()}>
      <div className="w-16 h-24 border-4 border-[#e8b33a] rounded-xl rotate-hint" />
      <h2 className="font-display text-2xl text-[#e8b33a] mt-8">Gira el dispositivo para jugar</h2>
      <p className="font-body text-lg text-[#d9d3c1] mt-2 leading-snug">Gravevow se juega en horizontal. La partida queda en pausa mientras tanto.</p>
    </div>
  );
}
