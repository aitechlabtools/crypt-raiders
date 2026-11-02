# DREADBOUND · Notas para trabajar en el proyecto

## Regla permanente: pensar siempre en móvil y tableta
Cada cambio de interfaz o de mecánica debe funcionar en las tres formas de jugar:
- Ordenador (teclado y ratón).
- Móvil en horizontal (pantalla baja, ~750x340): controles táctiles, sin «pasar el ratón».
- Tableta (horizontal y vertical).

Cómo se hace en este proyecto:
- `isTouch()` (src/shared/device.ts) y la clase `is-touch` en <html> distinguen la pantalla táctil.
  `.touch-only` / `.no-touch` muestran u ocultan elementos; en táctil se ocultan las teclas (<kbd>).
- Nada puede depender solo del hover: en táctil, el primer toque enseña la ficha y el segundo ejecuta (ver combatActions.tsx).
- Pantallas bajas (max-height 560px): CSS en game.css y `useShortScreen()` en CombatScreen.tsx.
- Mazmorra: joystick analógico + botón de acción (TouchControls.tsx → touchStick en engine/touchInput.ts); tocar el mapa mueve al personaje.
- Prueba obligatoria tras cada cambio: `node scripts/mobile-check.cjs <url>/play/ <carpeta>` (móvil) y con
  `"iPad (gen 7) landscape"` como tercer argumento (tableta), además de scripts/e2e.cjs.
- Mantener al día la lista «Ya disponible / En camino» y los textos de la landing (src/landing/App.tsx) cuando cambie el juego.
