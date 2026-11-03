// Plantilla de las páginas legales: misma cabecera y pie que la landing, índice, fecha y botones.
import { useSyncExternalStore, type ReactNode } from 'react';
import { PLAY_URL, SiteFooter, SiteHeader } from '../landing/site';

export interface LegalSection { id: string; title: string; body: ReactNode }

/**
 * Dato del titular mostrado como imagen (public/legal/d*.png), para que los programas que copian páginas
 * no lo lean como texto. Las imágenes se generan fuera del repositorio: los datos no están escritos en el código.
 */
export function Dato({ id, alt }: { id: 'd1' | 'd2' | 'd3' | 'd4' | 'd5'; alt: string }) {
  return <img src={`./legal/${id}.png`} alt={alt} className="legal-img" draggable={false} />;
}

/** Botón que monta la dirección de correo solo al pulsarlo (no aparece escrita en la página). */
export function MailButton() {
  const open = () => {
    const u = 'otcatnoc'.split('').reverse().join('');
    const d = 'se.sredniatpyrc'.split('').reverse().join('');
    window.location.href = `mailto:${u}@${d}`;
  };
  return <button type="button" onClick={open} className="btn-ghost px-5 py-2.5 text-base" data-testid="mail-button">✉ Escribir un correo</button>;
}

// ── Datos del titular: no están en la página hasta que alguien pulsa «Ver datos» ──
// Los bots que leen la página sin hacer clic no llegan a cargar las imágenes. Al pulsar en un sitio se muestran en todos.
let revealed = false;
const revealListeners = new Set<() => void>();
export function revealData() { if (!revealed) { revealed = true; revealListeners.forEach((l) => l()); } }
export function useRevealed(): boolean {
  return useSyncExternalStore((l) => { revealListeners.add(l); return () => revealListeners.delete(l); }, () => revealed, () => false);
}

/** Correo dentro de un párrafo: un enlace-botón discreto que, al pulsarlo, muestra la imagen del correo. */
export function EmailInline() {
  const shown = useRevealed();
  if (shown) return <Dato id="d5" alt="correo electrónico de contacto (en imagen)" />;
  return <button type="button" className="legal-reveal-inline" onClick={revealData} data-testid="reveal-inline">nuestro correo (pulsa para verlo)</button>;
}

/** Dato que debe rellenar el titular. Muy visible a propósito. */
export function Ph({ children }: { children: string }) {
  return <mark className="legal-ph" data-placeholder>{children}</mark>;
}

export function LegalPage({ title, intro, updated, sections }: { title: string; intro: ReactNode; updated: string; sections: LegalSection[] }) {
  return (
    <div className="min-h-screen">
      <a href="#contenido" className="skip-link">Saltar al contenido</a>
      <SiteHeader home="./" />
      <main id="contenido" className="legal max-w-6xl mx-auto px-4 pt-28 pb-20">
        <nav aria-label="Ruta" className="font-body text-stone-400 text-base"><a href="./" className="hover:text-parchment underline-offset-4 hover:underline">Inicio</a> <span aria-hidden>›</span> {title}</nav>
        <h1 className="font-display text-4xl md:text-5xl text-parchment mt-3 leading-tight">{title}</h1>
        <p className="font-body text-stone-400 mt-2">Última actualización: <time dateTime="2026-11-03">{updated}</time></p>
        <div className="legal-intro font-body text-xl text-stone-300 mt-6 leading-relaxed">{intro}</div>

        <div className="legal-grid mt-10">
          <nav className="legal-toc" aria-label="Índice">
            <h2 className="font-display text-sm tracking-[0.2em] uppercase text-gold mb-3">Índice</h2>
            <ol>
              {sections.map((s, i) => <li key={s.id}><a href={`#${s.id}`}><span className="legal-num">{i + 1}.</span> {s.title}</a></li>)}
            </ol>
          </nav>
          <div className="legal-body">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="legal-section" aria-labelledby={`${s.id}-t`}>
                <h2 id={`${s.id}-t`} className="font-display text-2xl md:text-3xl text-parchment"><span className="legal-num">{i + 1}.</span> {s.title}</h2>
                <div className="legal-text">{s.body}</div>
                <a href="#contenido" className="legal-top">Volver al índice ↑</a>
              </section>
            ))}
            <div className="flex flex-wrap gap-3 mt-12">
              <a href="./" className="btn-ghost px-6 py-3">← Volver a la portada</a>
              <a href={PLAY_URL} className="btn-play px-6 py-3">Jugar la demo gratis</a>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter home="./" />
    </div>
  );
}

/** Tabla que en móvil se convierte en tarjetas (cada celda lleva su etiqueta). */
export function StorageTable({ rows }: { rows: { name: string; where: string; owner: string; purpose: string; duration: string; type: string }[] }) {
  const head = ['Nombre', 'Dónde se guarda', 'Titular', 'Finalidad', 'Duración', 'Tipo'];
  return (
    <table className="legal-table">
      <caption className="sr-only">Elementos que esta web guarda en tu navegador</caption>
      <thead><tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name}>
            <th scope="row" data-label="Nombre"><code>{r.name}</code></th>
            <td data-label="Dónde se guarda">{r.where}</td>
            <td data-label="Titular">{r.owner}</td>
            <td data-label="Finalidad">{r.purpose}</td>
            <td data-label="Duración">{r.duration}</td>
            <td data-label="Tipo">{r.type}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
