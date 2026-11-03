# Crypt Raiders · Notas para trabajar en el proyecto

## Regla permanente: pensar siempre en móvil y tableta
Cada cambio de interfaz o de mecánica debe funcionar en las tres formas de jugar:
- Ordenador (teclado y ratón).
- Móvil en horizontal (pantalla baja, ~750x340): controles táctiles, sin «pasar el ratón».
- Tableta (horizontal y vertical).

Cómo se hace en este proyecto:
- `useIsTouch()` (hook de React) / `isTouch()` (src/shared/device.ts) y la clase `is-touch` en <html> distinguen la pantalla táctil.
  Es EN VIVO: el primer toque activa el modo táctil y mover un ratón lo quita (tabletas con teclado, portátiles táctiles).
  En componentes usa siempre el hook, nunca una constante calculada al cargar.
  `.touch-only` / `.no-touch` muestran u ocultan elementos; en táctil se ocultan las teclas (<kbd>).
- Nada puede depender solo del hover: en táctil, un toque ejecuta y mantener pulsado enseña la ficha (`useLongPress` en combatActions.tsx).
- Botones de juego táctiles (poción, «Usar»…) se activan en `pointerdown`, no en `click`: un segundo dedo no genera clic.
- Medidas táctiles en src/config/touch.ts (mínimo 44 px por botón).
- Pantallas bajas (max-height 560px): CSS en game.css y `useShortScreen()` en CombatScreen.tsx.
- Mazmorra: joystick analógico + botón de acción (TouchControls.tsx → touchStick en engine/touchInput.ts); tocar el mapa mueve al personaje.
- Prueba obligatoria tras cada cambio: `node scripts/touch-check.cjs <url>/play/` (toques reales, 5 dispositivos), `node scripts/mobile-check.cjs <url>/play/ <carpeta>` (móvil) y con
  `"iPad (gen 7) landscape"` como tercer argumento (tableta), además de scripts/e2e.cjs.
- Mantener al día la lista «Ya disponible / En camino» y los textos de la landing (src/landing/App.tsx) cuando cambie el juego.

## Regla permanente: menús con la base de interfaz
- Toda pantalla de menú usa las piezas de `src/game/ui/kit` y las medidas de `src/config/ui.ts` (y sus variables CSS en game.css).
- Guía para montar una pantalla nueva: `docs/guia-interfaz.md`. Estructura de la opción D de las maquetas (solo estructura, nunca gráficos).
- Pixel art siempre a escala entera (`usePixelScale`). Objetivos táctiles de 44 px como mínimo.
- Prueba de menús en los tres formatos: `node scripts/menus-check.cjs <url>/play/ <carpeta>`.
