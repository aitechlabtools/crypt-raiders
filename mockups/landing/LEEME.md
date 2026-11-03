# Maqueta de la landing · Fase 10 (borrador, sin aplicar)

- Ábrela con doble clic en `index.html` (no hace falta servidor).
- `capturas/`: página completa en escritorio 1920×1080, tableta 1180×820 y móvil 390×844, y cada sección nueva por separado.
- `borrador/`: el código del borrador, para aplicarlo cuando lo apruebes:
  `sections.tsx` (VarkHollow, carrusel, móvil y hoja de ruta), `roadmap.ts` (textos de la hoja de ruta),
  `App.tsx` (landing con todo montado) y `landing-anadido.css` (estilos nuevos).
- `capturar.cjs`: rehace las capturas con el servidor en marcha (`npx vite --port 5173`):
  `node mockups/landing/capturar.cjs http://localhost:5173/ mockups/landing/capturas`
- Las capturas del juego que salen en el carrusel son provisionales (personaje de nivel 1). Las definitivas se harán
  con una partida avanzada al aplicar.
