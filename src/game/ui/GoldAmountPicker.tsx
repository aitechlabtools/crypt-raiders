// Selector de cantidad de monedas (sacar de un saco o dividir un montón): cómodo con el dedo.
// −10 · −1 · [n] · +1 · +10, una barra y atajos «10 · 25 · 50 · Todo». Botones de 44 px como mínimo.
import { useState, type ReactNode } from 'react';
import { Modal } from './common';

export function GoldAmountPicker({ title, from, max, initial, confirm, note, onConfirm, onClose }: {
  title: string; from: ReactNode; max: number; initial?: number; confirm: (n: number) => string; note?: string;
  onConfirm: (n: number) => void; onClose: () => void;
}) {
  const [n, setN] = useState(Math.max(1, Math.min(max, initial ?? Math.min(10, max))));
  const set = (v: number) => setN(Math.max(1, Math.min(max, Math.round(v))));
  const step = (t: string, d: number) => <button className="btn text-lg" style={{ minWidth: 56, minHeight: 52 }} onClick={() => set(n + d)} data-testid={`amt${d > 0 ? "-mas" : "-menos"}${Math.abs(d)}`}>{t}</button>;
  return (
    <Modal onClose={onClose} testId="gold-picker">
      <h2 className="panel-title text-lg mb-2">{title}</h2>
      <div className="flex items-center gap-3">{from}</div>
      <div className="flex items-center justify-center gap-2 mt-4">
        {step('−10', -10)}{step('−1', -1)}
        <div className="panel flex items-center justify-center font-display text-3xl text-gold" style={{ minWidth: 96, minHeight: 56 }} data-testid="amt-value">{n}</div>
        {step('+1', 1)}{step('+10', 10)}
      </div>
      <input type="range" min={1} max={max} value={n} onChange={(e) => set(+e.target.value)} className="w-full mt-4 accent-[#e8b33a]" style={{ height: 32 }} aria-label="Cantidad" />
      <div className="flex gap-2 mt-2 justify-center flex-wrap">
        {[10, 25, 50].filter((x) => x < max).map((x) => <button key={x} className="btn text-sm" style={{ minHeight: 44, minWidth: 44 }} onClick={() => set(x)}>{x}</button>)}
        <button className="btn text-sm" style={{ minHeight: 44 }} onClick={() => set(max)} data-testid="amt-all">Todo ({max})</button>
      </div>
      {note && <p className="text-xs text-stone-400 mt-3 text-center">{note}</p>}
      <div className="flex gap-2 mt-4 justify-center">
        <button className="btn btn-gold" style={{ minHeight: 44 }} onClick={() => { onConfirm(n); onClose(); }} data-testid="amt-confirm">{confirm(n)}</button>
        <button className="btn" style={{ minHeight: 44 }} onClick={onClose}>Cancelar</button>
      </div>
    </Modal>
  );
}
