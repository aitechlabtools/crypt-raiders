import { useEffect, useState } from 'react';
import { isTouch } from './device';

/** En móvil en vertical pide girar la pantalla: el juego se juega en horizontal. */
export function RotateNotice() {
  const [portrait, setPortrait] = useState(false);
  useEffect(() => {
    if (!isTouch()) return;
    const mq = window.matchMedia('(orientation: portrait)');
    const upd = () => setPortrait(mq.matches && window.innerWidth < 700); // las tabletas caben también en vertical
    upd(); mq.addEventListener('change', upd); window.addEventListener('resize', upd);
    return () => { mq.removeEventListener('change', upd); window.removeEventListener('resize', upd); };
  }, []);
  if (!portrait) return null;
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#07060a] p-8 text-center" role="dialog" aria-modal="true" data-testid="rotate-notice">
      <div className="w-16 h-24 border-4 border-[#e8b33a] rounded-xl rotate-hint" />
      <h2 className="font-display text-2xl text-[#e8b33a] mt-8">Gira el móvil</h2>
      <p className="font-body text-lg text-[#d9d3c1] mt-2 leading-snug">DREADBOUND se juega en horizontal.</p>
    </div>
  );
}
