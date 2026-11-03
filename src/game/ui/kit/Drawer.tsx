// Cajón lateral: en móvil guarda lo que no cabe en pantalla (por ejemplo, los atributos).
// Se abre con la pestaña vertical del borde izquierdo y se cierra tocando fuera.
import { useState, type ReactNode } from 'react';

export function Drawer({ label, children, testId }: { label: string; children: ReactNode; testId?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="ui-drawer-tab" onClick={() => setOpen(true)} aria-expanded={open} data-testid={testId ? `${testId}-open` : undefined}>▸ {label}</button>
      {open && <div className="ui-drawer-shade" onClick={() => setOpen(false)} />}
      <div className={`ui-drawer ${open ? 'open' : ''}`} aria-hidden={!open} data-testid={testId}>
        <div className="h-full overflow-y-auto scroll-thin">{children}</div>
      </div>
    </>
  );
}
