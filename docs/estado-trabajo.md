# Crypt Raiders · Estado del trabajo (traspaso entre chats)

Última actualización: 3 de noviembre de 2026.
Este documento resume todo lo hablado y hecho para que otro chat de Claude pueda continuar sin perder contexto.
Léelo junto con CLAUDE.md (reglas permanentes del proyecto).

## Cómo trabajamos
- Nombre del juego: **Crypt Raiders** (antes DREADBOUND; cambiado el 3/11). Dominio nuevo: cryptraiders.es.
  Estrategia de marca del usuario: en la web y redes, «Crypt Raiders»; en Steam, «Crypt Raiders: VarkHollow».
  VarkHollow es la región/atmósfera (el lore), no el nombre de la web. Aún no se ha metido VarkHollow en el juego ni en la web.
  Las partidas guardadas con el nombre antiguo se copian solas al nuevo (persistence/db.ts); borrar el personaje borra ambas.
- Repositorio: aitechlabtools/dreadbound (GitHub; el usuario quiere renombrarlo). Web publicada con GitHub Pages.
  OJO: cada push a `main` publica la web (workflow .github/workflows/deploy.yml).
- Carpeta de trabajo en el ordenador: `Documents\GitHub\dreadbound`.
- Claude edita los archivos directamente en esa carpeta. El usuario hace el commit y el push con GitHub Desktop
  (Claude NO hace commits ni push). Al terminar cada fase, Claude da el texto del commit en español.
- Se trabaja en dos ordenadores (casa y otro): push antes de cambiar de equipo, pull al llegar.
- Stack: React 19 + TypeScript + Vite + Tailwind 4 + Phaser 3.90. Tests: `npx tsc --noEmit`, `npx vitest run`,
  y los scripts de Playwright con el servidor `npx vite --port 5173`:
  `node scripts/e2e.cjs http://localhost:5173/play/ <carpeta>`,
  `node scripts/mobile-check.cjs http://localhost:5173/play/ <carpeta>` (y con `"iPad (gen 7) landscape"` como 3.er argumento),
  `node scripts/touch-check.cjs http://localhost:5173/play/ <carpeta>` (toques reales en 5 dispositivos).

## Reglas permanentes del usuario
- Nada de funciones falsas. Solo un jugador: nunca presentarlo como multijugador.
- La descarga sigue en «Próximamente». La tienda de aspectos de pago es solo maqueta: sin pagos ni servicios externos.
- Siempre diseñar y probar en ordenador, móvil en horizontal y tableta.
- Mantener al día la lista «Ya disponible» de la landing (src/landing/App.tsx).
- Todo el texto visible en español. Un commit por fase, con mensaje en español.
- El pixel art solo se escala a factores enteros.

## Ya hecho (antes de este plan)
Mercenarios (contratos con Garra, cautivos rescatables, postura agresiva/cauta), minería (vetas, picos con usos,
menas para la forja), cosméticos y armario + maqueta de tienda, revisión de bugs, landing y tráiler v3 actualizados.
Versión publicada: 0.1.5.

## Decisiones sobre la nueva interfaz (inspirada en la estructura de Dark and Darker y Fortnite)
- Forja y Mercenarios siguen dentro de los vendedores, que pasan a llamarse «Mercaderes».
- Sin talentos (ni siquiera «Próximamente»). Sin peso ni temporizador de vendedores.
- Elegida la opción D de las maquetas (mockups/menu-structure/opcion-d.html):
  barra superior con pestañas en píldora; pantalla Jugar minimalista: héroe grande centrado, círculo bajo los pies,
  haz de luz central, mismo fondo que el resto de menús, sin hoguera ni atrezo; tarjeta de zona arriba a la izquierda;
  panel Expedición con «Descender» abajo a la izquierda; anillo de nivel y botones rápidos abajo a la derecha;
  en móvil, el Alijo usa segmentos Equipo / Almacén.
- Maquetas publicadas: https://claude.ai/artifact/26XdkHa5AueQg8HtUPcBiN
- Plan completo: «Crypt Raiders · Plan de móvil, tableta y nuevos menús» https://claude.ai/artifact/1mGtYZhUjJ1oEWLJidZQ6t
- Recomendaciones aceptadas: en combate táctil un toque ejecuta y mantener pulsado enseña la ficha; en iPhone el botón
  de pantalla completa explica cómo «Añadir a pantalla de inicio»; la tableta en vertical se adapta en una fase posterior;
  el menú de pausa no para el reloj de la expedición.

## Plan por fases y estado
1. Controles táctiles — HECHA (commit pendiente del usuario: «Fase 1: controles táctiles fiables»).
   Detección táctil en vivo (`useIsTouch`), un toque ejecuta / pulsación larga = ficha (`useLongPress`),
   joystick que se suelta al abrir menús o cambiar de app, poción y «Usar» en pointerdown (funcionan con un segundo dedo),
   botón «Usar» siempre visible, avisos arriba en táctil, sin zoom ni resaltado al tocar, medidas en src/config/touch.ts,
   nueva prueba scripts/touch-check.cjs (pasaba en los 5 dispositivos).
2. Pantalla completa y horizontal — HECHA (commit pendiente del usuario). Pruebas pasadas el 3/11: touch-check (5 dispositivos),
   mobile-check móvil y tableta, e2e y vitest (136). Arreglado al probar: en Android, tras «Jugar» a pantalla completa,
   Chrome marca «display-mode: fullscreen» y el juego creía estar instalado y ocultaba el botón ⛶ (isStandalone en fullscreen.ts).
   touch-check ahora comprueba que el botón quita la pantalla completa; mobile-check la quita antes de girar.
   src/shared/fullscreen.ts (prefijos webkit, bloqueo de horizontal en Android), botón FullscreenButton en título,
   refugio y mazmorra; en táctil «Jugar» entra a pantalla completa; aviso «Gira el dispositivo para jugar» que congela
   la escena (estado `suspended` en el store; el reloj sigue, como en la pausa); manifest de app instalable
   (public/play/manifest.webmanifest + iconos) y metas de iOS; alturas con 100dvh.
3. HUD táctil de mazmorra y combate — HECHA (commit pendiente del usuario: «Fase 3: HUD táctil de mazmorra y combate»).
   En táctil, barra superior propia (TouchTopHud en DungeonScreen.tsx): ficha compacta, reloj y sala, iconos de 44 px
   (inventario, menú, pantalla completa; iconos provisionales en ui/hudIcons.tsx) y aliados debajo. Joystick 120 px (móvil)
   / 150 px (tableta), Usar 72, Poción 52, separación 12; todo con zonas seguras (`safe()` y `useTouchSize()` en config/touch.ts).
   Combate: órdenes y botones de 44 px, zonas seguras; arreglado que el héroe se quedaba en rojo (pose de golpe) hasta su turno.
   touch-check.cjs comprueba todas estas medidas. En escritorio no cambia nada.
4. Base de interfaz — HECHA (commit: «Fase 4: base de interfaz y barra de pestañas en píldora»).
   config/ui.ts (formatos y medidas) + variables CSS en game.css; piezas en ui/kit (PillBar, Panel, SubHead, Segmented,
   Drawer, Card, usePixelScale); docs/guia-interfaz.md; regla en CLAUDE.md; nueva prueba scripts/menus-check.cjs.
   La barra lateral se sustituye por la barra superior de píldoras (Jugar · Personaje · Alijo · Mercaderes · Misiones ·
   Bestiario · Vestuario · Tienda); «Salir al título» pasa a Ajustes. Pestañas nuevas: tab-play, tab-character, tab-stash,
   tab-merchants… (scripts actualizados). Las pantallas antiguas viven dentro hasta que cada fase las sustituya.
5. Pantalla Jugar (opción D). 6. Crear personaje. 7. Alijo. 8. Personaje. 9. Mercaderes y resto. PENDIENTES.
10. Cierre: landing, «Ya disponible», pruebas completas. PENDIENTE.
Cada fase termina con: pruebas automáticas, capturas en 1920×1080, 1180×820 y 844×390, explicación de cómo probarlo
(DevTools en modo dispositivo + recargar; en el móvil real: `npm run dev -- --host`, mirar la IP con `ipconfig`
y abrir `http://IP:5173/play/` con el móvil en la misma Wi-Fi), texto del commit y esperar el visto bueno del usuario.

## Siguiente paso
Fase 5: pantalla Jugar (opción D). Después, fases 6 a 10 seguidas.
Cambio de nombre a Crypt Raiders: HECHO (código, landing, app instalable, tráiler y póster).
Idea aceptada para la Fase 7 (Alijo): la ficha de un arma muestra las habilidades que daría antes de equiparla.
Nota: en el PC del trabajo (pci-pau) Claude no tiene terminal; prueba en una copia en la nube (GitHub + cambios)
y copia los archivos a la carpeta.

Texto de commit sugerido para lo entregado (si se sube todo junto):
«Maquetas de menús (opción D), Fase 1: controles táctiles fiables y Fase 2: pantalla completa, horizontal y app instalable»
