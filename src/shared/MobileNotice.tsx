import { useState } from 'react';
import { shareDemoLink } from './device';

/** Aviso para móviles y tabletas: la demo necesita teclado y ratón. */
export function MobileNotice({ onContinue, onClose, continueLabel = 'Intentarlo igualmente' }: { onContinue: () => void; onClose?: () => void; continueLabel?: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-labelledby="mobile-notice-title" data-testid="mobile-notice">
      <div className="w-full max-w-sm border-2 border-[#6b4a12] bg-[#131118] p-6 text-center shadow-2xl">
        <h2 id="mobile-notice-title" className="font-display text-2xl text-[#e8b33a]">Juega en un ordenador</h2>
        <p className="font-body text-lg text-[#d9d3c1] mt-3 leading-snug">
          La demo de Crypt Raiders se juega con <b>teclado y ratón</b>. Ábrela en un ordenador para disfrutarla como es debido.
        </p>
        <button className="btn-play w-full mt-5 px-4 py-3" onClick={async () => setMsg(await shareDemoLink())} data-testid="mobile-share">
          Enviarme el enlace
        </button>
        {msg && <p className="font-body text-base text-[#5fd19a] mt-2 break-all">{msg}</p>}
        <button className="btn-ghost w-full mt-3 px-4 py-2.5 text-sm" onClick={onContinue} data-testid="mobile-continue">
          {continueLabel}
        </button>
        {onClose && (
          <button className="font-body text-[#8c8693] mt-3 underline" onClick={onClose}>
            Volver
          </button>
        )}
      </div>
    </div>
  );
}
