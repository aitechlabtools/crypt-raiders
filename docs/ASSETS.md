# Recursos provisionales a sustituir

Todo el arte y el audio de la v0.1 se **genera por código**: es original, no tiene problemas de licencia y no depende de archivos externos. Es coherente, pero es provisional.

| Recurso | Dónde se genera | Sustituir por |
|---|---|---|
| Personajes (4 clases, rival), esqueleto, jefe, murciélago | `src/shared/art.ts` → `drawHumanoid`, `drawBat` | Hojas de sprites con animaciones idle, caminar (4 direcciones isométricas), atacar, recibir daño, morir y lanzar hechizo |
| Suelos, muros, puerta, pilar, trampa | `drawFloor`, `drawWall`, `drawDoor`, `drawPillar`, `drawTrap` | Tileset isométrico 32×16 (o 64×32 con zoom ajustado) |
| Cofres, antorchas, decoración, portal, bolsa | `drawChest`, `drawTorch`, `drawDecor`, `drawPortal`, `drawBag` | Sprites animados |
| Iconos de objetos (33) | `drawIcon` + tabla `ICONS` | Iconos 32×32 por objeto |
| Efectos de combate | CSS en `src/game/game.css` (proyectiles, sacudidas, números) | Partículas y animaciones dibujadas |
| Efectos de sonido (20) | `src/game/audio.ts` (WebAudio sintetizado) | Archivos OGG/MP3 con licencia comercial |
| Música (lobby y mazmorra) | `startMusic` en `src/game/audio.ts` (drones) | Pistas ambientales en bucle |
| Tipografías | `@fontsource` (Cinzel, Crimson Pro, Pixelify Sans: licencia OFL, empaquetadas en el proyecto) | Se pueden mantener |

Para sustituir un sprite basta con cargar la imagen en `src/game/engine/textures.ts` con la **misma clave** de textura (p. ej. `hero0`…`hero3`, `wall0`, `chest_common_open`).
