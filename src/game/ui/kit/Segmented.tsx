// Segmentos: dos o tres vistas de la misma pantalla (Equipo / Almacén). Cada botón mide al menos 44 px de alto.
export function Segmented<T extends string>({ options, value, onChange, testId }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; testId?: string }) {
  return (
    <div className="ui-seg" role="tablist" data-testid={testId}>
      {options.map((o) => (
        <button key={o.id} role="tab" aria-selected={o.id === value} className={o.id === value ? 'on' : ''} onClick={() => onChange(o.id)} data-testid={`seg-${o.id}`}>{o.label}</button>
      ))}
    </div>
  );
}
