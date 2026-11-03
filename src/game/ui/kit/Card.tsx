// Tarjeta con arco: un mercader, una zona… El contenido de debajo lo pone cada pantalla.
import type { ReactNode } from 'react';

export function Card({ title, art, children, on = false, badge, className = '', testId }: {
  title: ReactNode; art: ReactNode; children?: ReactNode; on?: boolean; badge?: number; className?: string; testId?: string;
}) {
  return (
    <article className={`panel ui-card ${on ? 'ui-card on' : ''} ${className}`} data-testid={testId}>
      <h3 className="font-display text-parchment text-center leading-tight min-h-[1.5em]">{title}</h3>
      <div className="ui-arch relative">
        {art}
        {!!badge && <span className="absolute top-2 right-2 text-[11px] min-w-[18px] h-[18px] leading-[18px] text-center bg-heal text-black" aria-label={`${badge} misiones listas`}>{badge}</span>}
      </div>
      {children}
    </article>
  );
}
