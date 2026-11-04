# Crypt Raiders · Estado del trabajo (traspaso entre chats)

Última actualización: 3 de noviembre de 2026.
Este documento resume todo lo hablado y hecho para que otro chat de Claude pueda continuar sin perder contexto.
Léelo junto con CLAUDE.md (reglas permanentes del proyecto).

## Cómo trabajamos
- Nombre del juego: **Crypt Raiders** (antes DREADBOUND; cambiado el 3/11). Dominio nuevo: cryptraiders.es.
  Estrategia de marca del usuario: en la web y redes, «Crypt Raiders»; en Steam, «Crypt Raiders: VarkHollow».
  VarkHollow es la región/atmósfera (el lore), no el nombre de la web. Aún no se ha metido VarkHollow en el juego ni en la web.
  Las partidas guardadas con el nombre antiguo se copian solas al nuevo (persistence/db.ts); borrar el personaje borra ambas.
- Repositorio: aitechlabtools/crypt-raiders (antes dreadbound; GitHub redirige el enlace viejo). Web publicada con GitHub Pages en cryptraiders.es.
  OJO: cada push a `main` publica la web (workflow .github/workflows/deploy.yml).
- Carpeta de trabajo en el ordenador: `Documents\GitHub\crypt-raiders`.
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
- La descarga sigue en «Próximamente». La Tienda de atuendos cobra solo oro del juego: sin pagos reales ni servicios externos (los datos admiten otra moneda para el futuro).
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
5. Pantalla Jugar (opción D) — HECHA (commit: «Fase 5: nueva pantalla Jugar»). screens/Jugar.tsx: héroe grande con haz de luz y
   pedestal (escala entera 14/10/5), tarjeta de zona con ilustración provisional (fondo de combate de la zona) y «Mapa de zonas»
   (ventana con las 3 zonas, niveles, jefe y bloqueo), panel Expedición con «Descender» (btn-enter-dungeon), anillo de nivel y
   accesos rápidos (Misiones, Reputación, Bestiario, Contrato → contratos de Garra Roja). La pestaña Expedición desaparece.
6. Crear personaje — HECHA (commit: «Fase 6: nueva pantalla de crear personaje»). screens/CrearPersonaje.tsx: tres columnas
   (Clases + capa + piel · la clase en grande con su círculo, a la mayor escala entera que cabe · Sobre la clase con arma,
   puntos fuertes y débiles —campos pros/cons en data/classes.ts—, habilidades iniciales y equipo inicial); abajo Volver,
   nombre y Confirmar (btn-create). Retratos de clase provisionales (el sprite recortado).
7. Alijo — HECHA (commit: «Fase 7: nuevo Alijo»). screens/Alijo.tsx + screens/ItemCard.tsx: Aventurero (retrato, atributos,
   «Ver detalles» → Personaje) · Equipo (ranuras en 3 columnas con arma y secundaria grandes, Mochila, Bolsillo seguro y ficha
   del objeto con sus acciones; la ficha de un arma muestra las habilidades que daría) · Almacén (8/5/6 columnas, Ordenar y
   Ampliar). Mover: arrastrar, o tocar un objeto y después una casilla libre (las libres se marcan). En móvil, segmentos
   Equipo/Almacén y la ficha sale abajo. La ventanita del ratón ya no aparece en táctil.
8. Personaje — HECHA (commit: «Fase 8: nueva pantalla Personaje»). screens/Personaje.tsx: Atributos (nivel, XP, atributos con lo
   que suma el equipo, desglose base/equipo y trayectoria) · héroe con sus habilidades en herradura (máx. 8; ataque básico,
   clase, arma y secundaria con colores por origen) · lista de habilidades por origen con coste y descripción. Tocar o pasar
   el ratón por una habilidad la resalta en las dos partes. Solo informa (sin talentos). En móvil, segmentos Atributos/Habilidades.
9. Mercaderes, Misiones y Bestiario — HECHA (commit: «Fase 9: Mercaderes, Misiones y Bestiario»). screens/Mercaderes.tsx:
   tarjetas (retrato, rango, reputación, misiones listas, servicios; Hablar) e interior en tres zonas (mercader y servicios ·
   Tienda/Misiones/Vender/Forja/Contratos · tu mochila, tus materiales o la ficha del objeto a vender; en móvil, cajón a la
   derecha). screens/Misiones.tsx: un panel por mercader, primero los que tienen misiones listas. Bestiario centrado (ya tenía
   la estructura). Vestuario y Tienda NO se rehacen: los sustituirán las skins (docs/pendiente-skins.md).
   Atuendos (skins) — HECHO (commit: «Atuendos: trajes completos y Tienda con oro (sustituye al Vestuario)»).
   - Datos: src/core/data/skins.ts (3 atuendos: Sudario del Penitente 1.500, Guardián Hueco 4.000, Señor de la Ceniza 9.000;
     precio {moneda, cantidad}: solo se acepta 'gold'; anclajes de manos por fotograma y orden de capas). Lógica: src/core/skins.ts.
   - Partida: profile.skins {owned, equipped}, aparte del inventario; morir no lo quita. Las partidas con el Vestuario
     antiguo cargan y se descartan sus aspectos (nadie los había comprado); misiones y Leyenda ya no dan aspectos.
   - Dibujo (shared/art.ts): cuerpo · secundaria · arma por capas en anclajes. Sin hojas de sprites todavía: cada atuendo usa
     una «ficha» procedural (arte provisional, se indica en la Tienda). Para el arte final: PNG en public/skins/<id>.png
     (tonos #FF00FF/#B000B0 = piel del jugador) y sprites.sheet en los datos; loadSkinSheets() las carga.
   - Interfaz: ranura «Atuendo» bajo Manos en el Alijo → selector (con «Sin atuendo» e «Ir a la Tienda»); pestaña Tienda
     (screens/Atuendos.tsx) con confirmación y «¡Es tuyo!» → Ponérmelo. Pestaña Vestuario eliminada.
   - Prueba: node scripts/e2e-skins.cjs http://localhost:5173/play/ <carpeta> [dispositivo] y tests/skins.test.ts.
   - Tráiler: rótulo cambiado a «ATUENDOS» (trailer/v3/vestuario.png); el vídeo publicado aún no está remontado.
10. Landing — HECHA (commit pendiente del usuario: «Fase 10: landing con VarkHollow, carrusel de capturas y hoja de ruta»).
   Sección «Esto es VarkHollow» (texto A) tras la cabecera, con las tres profundidades y su jefe; capturas en carrusel
   (src/landing/sections.tsx); «Juega gratis ahora» sin listas y con el juego en un marco de móvil; hoja de ruta
   «El camino hacia las profundidades» al final, con los textos en src/landing/roadmap.ts. Textos sin cifras exactas.
   Capturas nuevas con partida avanzada (scripts/landing-shots.cjs → public/screenshots/landing, WebP + PNG;
   scripts/landing-webp.py hace las WebP). og:image y twitter:card con screenshots/landing/compartir.png.
   Guardián Hueco: «desde que cayó la orden». Sin redes sociales (el usuario no tiene).
   Las capturas antiguas de public/screenshots (combat.png, dungeon.png, etc.) ya no se usan: se pueden borrar.
Cada fase termina con: pruebas automáticas, capturas en 1920×1080, 1180×820 y 844×390, explicación de cómo probarlo
(DevTools en modo dispositivo + recargar; en el móvil real: `npm run dev -- --host`, mirar la IP con `ipconfig`
y abrir `http://IP:5173/play/` con el móvil en la misma Wi-Fi), texto del commit y esperar el visto bueno del usuario.

## Siguiente paso
Tráiler v4 (3/11, noche): 52 s, con los menús nuevos (crear, Jugar y mapa de zonas, Alijo, Personaje, Mercaderes con forja
y contratos, Tienda de atuendos), el atuendo puesto en la mazmorra y el juego en el móvil. Rótulos sin cifras exactas.
Cómo rehacerlo: node scripts/trailer4-capture.cjs <url>/play/ /tmp/claude-0/t3 (tomas nuevas; las de mazmorra y combate son
del v3, scripts/trailer3-capture.cjs) → node trailer/v4/make.cjs (rótulos) → python3 trailer/v4/render.py → python3 trailer/v4/music.py
→ ffmpeg (vídeo + música) → public/trailer/cryptraiders-trailer.mp4. El póster (cierre con el logo) no cambia.
Botón «Apoyar» (donaciones con Stripe): ACTIVO con el enlace real desde el 3/11 (DONATE_LINK en src/landing/site.tsx).
Si se pone un enlace «test_», el botón solo sale en desarrollo. Antes: Se activa poniendo el Payment Link de Stripe en DONATE_URL
(src/landing/site.tsx): entonces aparece junto a «Jugar» en la cabecera, en el pie, en el Aviso legal y como apartado
«Si apoyas el proyecto» en la Política de privacidad (y una frase en la de cookies). Es un enlace externo: la web no carga Stripe.
Páginas legales (paso 7) y revisión de calidad (paso 8): HECHAS el 3/11 (commit pendiente del usuario:
«Páginas legales: aviso legal, privacidad y cookies; pie común y revisión de accesibilidad»).
aviso-legal.html, privacidad.html y cookies.html (src/legal), pie común con enlaces (src/landing/site.tsx), enlaces discretos en
Ajustes del juego. Auditoría: sin cookies, sin terceros (fuentes con @fontsource en el propio sitio), solo IndexedDB «cryptraiders»
→ sin banner. Arreglado: el juego creaba una base vacía «dreadbound» al buscar partidas antiguas. Grises de la web aclarados para
contraste AA (axe sin errores). Datos del titular puestos el 3/11 como IMÁGENES (public/legal/d1–d5.png) para que los bots no los copien; domicilio:
solo la ciudad por ahora. Botón «Escribir un correo» que monta la dirección al pulsarlo. Máxima protección: los datos solo se cargan al pulsar «Ver datos del
titular»; robots.txt y meta robots (noindex, noimageindex) en aviso legal y privacidad. Falta que un profesional revise los textos.
Fase 10: HECHA el 3/11 (noche). El plan de 10 fases está terminado. Subzonas, errantes, Kael y tutorial: HECHO el 4/11 (ver abajo). Pendiente de decidir lo siguiente con el usuario
(por ejemplo: arte definitivo de los atuendos, Pícaro y Clérigo, remontar el tráiler con el rótulo «ATUENDOS»).
Cambio de nombre a Crypt Raiders: HECHO (código, landing, app instalable, tráiler y póster).
Idea aceptada para la Fase 7 (Alijo): la ficha de un arma muestra las habilidades que daría antes de equiparla.
Nota: en el PC del trabajo (pci-pau) Claude no tiene terminal; prueba en una copia en la nube (GitHub + cambios)
y copia los archivos a la carpeta.

Texto de commit sugerido para lo entregado (si se sube todo junto):
«Maquetas de menús (opción D), Fase 1: controles táctiles fiables y Fase 2: pantalla completa, horizontal y app instalable»

## Subzonas, mercenarios errantes, Kael y tutorial — HECHO el 4/11 (commit pendiente del usuario)
Plan y decisiones en docs/plan-subzonas.md. El usuario pidió ejecutarlo entero sin parar en cada fase (el arte es provisional,
hecho por código; él diseñará el definitivo con la lista de assets del plan, sección 9).
- S1 Datos: src/core/data/subzones.ts (10 subzonas: afueras, castillo, calabozos · osario, catacumbas, panteon ·
  carmesi, puertas, rios, trono), zones/index.ts (areaDef, subzoneLock, defaultSubzone). Dentro de una zona basta el nivel;
  entre zonas, el jefe de la última subzona de la anterior. Perfil: tutorialDone, kael {missStreak, met}, lastSubzone.
- S2 Jugar: tarjeta con la subzona («La Cripta · 5/10», «Demasiado fácil») y Mapa de zonas con filas de subzona (en móvil,
  una pestaña por zona). Prueba: scripts/subzones-check.cjs.
- S3 Curva: config/subzones.ts → +0/+1/+2 niveles por profundidad de sala, élite +2, jefe +3 (tope: máximo +3);
  bases de las comunes igualadas entre zonas (ZONE_NORMALIZE) y +0,66 %/nivel; menos XP y oro 5+ niveles por encima
  (50 %/75 %) y 10+ (10 %/50 %); cofres con más oro/tiradas en las subzonas hondas y equipo de su nivel (loot.ts).
- S4–S6 Escenarios y criaturas: baldosas por subzona (shared/art.ts → TILESETS, drawFloorTs/drawWallTs), estilos de mapa
  (subzones.ts → map: salas y pasillos), decorado propio (20 piezas), fondos de combate (ui/combatZones.ts) y 39 criaturas
  nuevas (core/data/zones/subzoneEnemies.ts: 25 comunes, 7 élites, 7 jefes; dibujos en MONSTER_SPECS/BEAST_SPECS/FLYER_SPECS).
  Todos los jefes tienen 2.ª fase al 50 % (combat.ts → phase2). Bestiario por subzonas. Equilibrio: tests/balance.test.ts
  («Balance por subzona»). Hoja de arte para revisar: mockups/subzonas/hoja.html (con el servidor: /mockups/subzonas/hoja.html?sub=afueras).
  Capturas en el juego: scripts/subzone-shots.cjs.
- S7–S8 Errantes y Kael: config/wanderers.ts (probabilidades, triángulos, 20 % del oro, robo, hostiles 20 % en 8–10, Kael 33 %
  con garantía tras 4) y core/data/wanderers.ts (Kael, Brann, Sela, Odo, Varga, Malek, Iskra; Osric solo en el tutorial).
  core/social.ts reescrito: el dado se tira al aliarse; el reparto lo cambia; un traidor espera 1 min y un momento de
  debilidad (poca vida tras un combate, cofre con llave o cerca del portal) y SIEMPRE avisa antes. Sin duelo amistoso.
  Kael: solo en la Mazmorra, linterna verde y aviso al acercarte, recuerda cuántas veces os habéis visto.
  Pruebas: tests/wanderers.test.ts y scripts/e2e-social.cjs (reescrito).
- S9 Tutorial: core/data/tutorial.ts (mapa a mano en las Afueras, 11 pasos con textos de ratón y de toque, recompensa),
  store (startTutorial, tutorialCheck, finishTutorial, replayTutorial), guía en DungeonScreen (TutorialGuide) y flecha en la
  escena. No se puede perder (vuelves al último punto seguro). «Saltar el tutorial» al crear personaje si ya se completó en este
  navegador (localStorage cryptraiders.tutorialDone) y «Repetir el tutorial» en Ajustes (sin recompensas ni cambios).
  Con ?debug las pruebas se lo saltan; con ?debug&tutorial se juega. Prueba: scripts/e2e-tutorial.cjs [url] [carpeta] [dispositivo].
- Ayudas de desarrollo (?debug): __CRYPTRAIDERS__.actions.enterDungeon('rios'), __CRYPTRAIDERS__.dev.forceKael = true,
  dev.forceWanderer = 'iskra', dev.forceHostile = true, dev.forceBetrayal = true.
- Landing y hoja de ruta actualizadas (diez escenarios, errantes, tutorial).
- Pendiente para el usuario: arte definitivo (lista de assets en el plan) y nombres si quiere cambiarlos.

## Combate nuevo: barra D, armas por subzona y rarezas — C1–C6 HECHAS el 4/11 (commits pendientes del usuario)
Plan, decisiones y maquetas: docs/plan-combate.md y mockups/combate (barra) y mockups/armas/hoja.html (armas nuevas).
Decisiones del usuario: distribución D; Ímpetu (físico, Guerrero; Tónico de concentración) y Maná (mágico, Mago y futuras clases
mágicas; poción de maná); las recargas pasan de un combate al siguiente dentro de la expedición; rareza y atributos para todo;
legendarias como en el plan; desbloqueo de habilidades de clase A ELEGIR en los niveles 20/40/60/80.
- C1 Datos: data/weapons.ts (familias, básico por familia, itemSpecials: 2 por mano o 4 a dos manos; mano vacía: Golpe bajo y
  Golpe a lo loco / Guardia y Empujón), loadout.ts (right/left/classSkill), recargas (skills.ts → COOLDOWNS y `cooldown`;
  combat.ts → cooldownLeft/tickCooldowns; expedition.cooldowns), costes a la mitad (COST_WITH_COOLDOWN), data/rarity.ts
  (RARITY_RULES, AFFIXES, stackStats, stackName), ItemStack.rarity/affixes, pociones según clase (loot.ts → adaptDrops; las
  guardadas se convierten al cargar). Dev: __CRYPTRAIDERS__.dev.give(id, rareza, atributos), dev.setLevel(n), dev.resetCooldowns().
- C2 Barra D en CombatScreen.tsx (Atacar · Ataque especial · Habilidad · Mochila+Huir; submenús en el mismo sitio; círculo de
  recarga; registro en una línea en móvil). Ímpetu en naranja. Guía: docs/guia-interfaz.md («Barra de combate»).
- C3 Habilidades de clase: CLASSES[c].classSkills (5 por clase), core/classSkills.ts (pendingUnlocks, unlock/equip),
  Profile.classSkills, ui/ClassSkills.tsx (tarjetas en Personaje y aviso en el pueblo). Mecánicas nuevas en combat.ts: escudo
  (shield/ward), aguante (endure), parpadeo (evade), debilidad (weaken), golpes a todos (aoe), robo de vida, pacto de sangre.
  Capturas automáticas: ?debug&noclass oculta el aviso.
- C4 data/subzoneItems.ts: 27 armas/secundarias y 23 piezas nuevas (curvas ITEM_CURVES), 19 especiales nuevos, legendarias
  con especial único (Velo de la Reina, Martillo de Ignaroth, Cadena de Belzar, Ojo del Abismo, Corona rota; y la Gran hoja de
  obsidiana y el Cetro de azufre forjado). REUSED_BY_SUBZONE reparte las antiguas. Dos manos: inventory.ts → fixHands.
  Botín: loot.ts → subzoneChestTable(…, sub). Iconos y aspecto provisionales en shared/art.ts y shared/gearLook.ts.
- C5 Rareza sorteada al caer (rarity.ts → RARITY_ROLL, rollStacks; más alta en subzonas hondas, cofres con llave, élites y
  jefes), atributos con efecto (vampiro, sangrado, verdugo, escarcha, sabio; veloz/piedra/ermitaño suman estadísticas),
  especiales mejorados (rara −1 recarga al primero; épica además +15 %), precio de venta según rareza.
- C6 Equilibrio: 188 pruebas en verde. Ajustes: Escudo de maná 30 % y recarga 3; Maldición de debilidad hace daño (x1.0);
  Aplastar x1.4; Último bastión 2 turnos y recarga 9; recargas del plan −1 turno. La simulación usa la habilidad de clase que
  tendría un jugador a su nivel y la mejor arma de su familia de la subzona. Victorias contra jefes (simulación): Mago 16–75 %,
  Guerrero 29–99 %. A vigilar: el jefe del Umbral Carmesí es casi seguro para el Guerrero (99 %).
- Pendiente: hablar con el usuario cómo actualizar la landing y la hoja de ruta (pidió comentarlo antes); arte definitivo
  (lista de assets en docs/plan-combate.md, sección 11).

## Landing v2, alpha y tráiler v5 — HECHO el 4/11 (commit pendiente del usuario)
Decisiones: titular A («Confía en tu espada. En nadie más.»), lore versión B (aprobado el nuevo: el Bastión es lo que quedó en pie
del castillo; tres criptas para tres clases de muertos; el fuego empezó abajo), sin clip en la portada (el usuario lo quitó),
sin sección ni botón de Windows, tráiler de 60 s.
- Landing (src/landing): menú fijo de 4 enlaces (VarkHollow, El juego, Galería, Hoja de ruta) que resalta la sección visible; en
  móvil ☰ con Apoyar dentro y Jugar siempre visible. Orden: Portada · VarkHollow (intro, crónica desplegable y descenso por las
  10 subzonas, plegado en móvil) · El juego (ciclo, 6 rasgos, clases, Kael) · Galería (tráiler, capturas, móvil) · Hoja de ruta ·
  Cierre (#apoyar). Nota de alpha bajo el botón. Prueba: node scripts/landing-check.cjs [url] [carpeta].
- «Demo» → «alpha» en la landing, metaetiquetas, páginas legales (apartado «La alpha y tu progreso»), título del juego y textos.
  Borrado src/shared/MobileNotice.tsx (no se usaba y estaba desfasado).
- Subzonas renombradas: Afueras del Bastión, El Bastión en ruinas, Las mazmorras del Bastión.
- Capturas de la landing: node scripts/landing-shots.cjs <url>/play/ y python scripts/landing-webp.py (nuevas: especial, afueras).
- Tráiler v5 (60 s, MP4 H.264 + WebM VP9, póster): guion y rótulos editables en trailer/v5/guion.json y trailer/v5/make.cjs.
  Rehacerlo entero: npm run dev y luego npm run trailer (graba las tomas y monta); solo montaje: npm run trailer:render.
  En la landing se reproduce silenciado, en bucle y con playsinline. También genera public/trailer/clip.* (sin uso ahora).

## Encargos guardados
- Skins de traje completo: HECHO (docs/plan-skins.md, maquetas en mockups/skins).
- Fase 10 (cierre): HECHO (docs/pendiente-landing.md).
