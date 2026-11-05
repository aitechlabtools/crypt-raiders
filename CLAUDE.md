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
  `"iPad (gen 7) landscape"` como tercer argumento (tableta), además de scripts/e2e.cjs y, si tocas personajes o guardado, `node scripts/personajes-check.cjs <url>/play/ <carpeta>`
  y, si tocas el almacén, `node scripts/almacen-check.cjs <url>/play/ <carpeta>`;
  si tocas el guardado o las copias, `node scripts/copia-check.cjs <url>/play/ <carpeta>`.
- Mantener al día la hoja de ruta de la landing (src/landing/roadmap.ts: «Ya en el juego», «Próximamente», «Multijugador») y los textos
  de la landing (src/landing/App.tsx y sections.tsx) cuando cambie el juego. Textos sin cifras exactas (como mucho «más de X»).
  Capturas de la landing: `node scripts/landing-shots.cjs <url>/play/ public/screenshots/landing` y `python scripts/landing-webp.py`.

## Regla permanente: menús con la base de interfaz
- Toda pantalla de menú usa las piezas de `src/game/ui/kit` y las medidas de `src/config/ui.ts` (y sus variables CSS en game.css).
- Guía para montar una pantalla nueva: `docs/guia-interfaz.md`. Estructura de la opción D de las maquetas (solo estructura, nunca gráficos).
- Pixel art siempre a escala entera (`usePixelScale`). Objetivos táctiles de 44 px como mínimo.
- Prueba de menús en los tres formatos: `node scripts/menus-check.cjs <url>/play/ <carpeta>`.

## Regla permanente: privacidad y páginas legales
- Páginas legales: aviso-legal.html, privacidad.html y cookies.html (textos en src/legal/texts.tsx; cabecera y pie comunes en src/landing/site.tsx).
- Hoy la web no usa cookies ni servicios de terceros: solo guarda la partida en IndexedDB (técnico, sin consentimiento) y por eso no hay banner.
- Antes de añadir algo que guarde datos en el navegador o cargue un servicio externo (analítica, fuentes o vídeos de terceros,
  redes sociales, guardado en la nube, cuentas, compras), actualiza la Política de cookies (tabla) y la de privacidad, y si no es
  estrictamente necesario, añade antes un banner de consentimiento (Aceptar y Rechazar igual de visibles, Configurar por categorías,
  nada cargado hasta aceptar y enlace «Configurar cookies» en el pie).
- Los datos del titular (nombre, NIF, ciudad y correo) van SOLO como imágenes (public/legal/d1–d5.png, componente `Dato`)
  para que los bots no los copien: no escribirlos nunca como texto en el código, los documentos ni los commits.
  El correo se abre con el botón «Escribir un correo» (`MailButton`), que monta la dirección al pulsarlo.
  Además, no se cargan hasta pulsar «Ver datos del titular» (`revealData`), y public/robots.txt y la etiqueta robots de
  aviso-legal.html y privacidad.html piden a los buscadores no indexar esas páginas ni las imágenes de /legal/.
  Si cambian, se generan de nuevo las imágenes (tipografía Crimson Pro 400, 80 px, interlineado 1,3; color #e9e1cc en la ficha
  del titular y #d6d1c4 dentro de un párrafo). Nunca inventar datos del titular.
