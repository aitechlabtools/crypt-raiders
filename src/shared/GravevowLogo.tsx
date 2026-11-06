/**
 * Logo de Gravevow: el nombre en piedra tallada y, debajo, el filete rojo con el rombo (el juramento).
 * El filete mide siempre lo mismo que el nombre. Lo usan la landing y el menú principal del juego.
 * El tamaño de la letra lo da la clase que se pase (p. ej. `hero-logo` en la landing o `title-logo` en el juego).
 */
export function GravevowLogo({ className = '', as: Tag = 'h1' }: { className?: string; as?: 'h1' | 'div' }) {
  return (
    <div className={`gv-logo ${className}`}>
      <Tag className="gv-name font-display font-extrabold">GRAVEVOW</Tag>
      <div className="gv-vow" aria-hidden="true"><span /><i /><span /></div>
    </div>
  );
}
