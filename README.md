# Gravevow

**Confía en tu espada. En nadie más.**
RPG de extracción por turnos de fantasía oscura, en 2D isométrico. Explora, combate, negocia, traiciona y escapa.

Versión **0.1 (primera entrega jugable)**. Un jugador con un aventurero rival controlado por IA. Todavía no hay multijugador real ni versión de Windows.

---

## Cómo jugar en tu PC

Necesitas [Node.js](https://nodejs.org) (versión 20 o superior).

| Qué quieres | Haz doble clic en | Qué pasa |
|---|---|---|
| Jugar ya, sin instalar nada | `JUGAR.bat` | Sirve la versión compilada (`dist/`) y abre el navegador en http://localhost:4173 |
| Trabajar en el código | `INICIAR-DESARROLLO.bat` | Instala dependencias la primera vez (`npm install`) y arranca Vite con recarga en caliente en http://localhost:5173 |

Desde terminal:

```bash
npm install        # una vez
npm run dev        # desarrollo: http://localhost:5173 (web) y /play/ (juego)
npm test           # 44 pruebas de la lógica (combate, inventario, extracción, alianzas, balance)
npm run build      # compila a dist/
node scripts/serve.mjs   # sirve dist/ en http://localhost:4173
```

> Abrir `dist/index.html` con doble clic no funciona: los navegadores bloquean los módulos JavaScript desde `file://`. Usa `JUGAR.bat`.

## Controles

| Acción | Tecla |
|---|---|
| Moverse | WASD, flechas o clic en el suelo |
| Interactuar (cofres, puertas, Kael, portal) | E |
| Beber poción de vida | Q |
| Inventario | I |
| Menú / cerrar ventana | Esc |
| Combate | 1 ataque · 2-3 habilidades · 4 defender · 5 objeto · 6 huir · Enter continuar |

## Qué funciona (probado)

- **Web oficial** (`/`): cabecera con diorama animado hecho con el arte del juego, concepto, características, clases, capturas reales, acceso a la demo y descarga marcada como «Próximamente».
- **Pantalla de inicio**: jugar/continuar, ajustes (volumen, música, borrar personaje).
- **Creación de personaje**: Guerrero o Mago (Pícaro y Clérigo visibles como «Próximamente»), nombre, color de capa y de piel.
- **Lobby (Bastión de Ceniza)**: personaje y habilidades; equipo con 8 ranuras y estadísticas; mochila en cuadrícula con arrastrar y soltar, tooltips, rarezas, comparación, apilado y ordenación; almacén seguro; mercader (comprar y vender); misiones con recompensa; preparación de expedición.
- **Mazmorras isométricas**: la primera expedición es Las Criptas de Umbravel (diseñada a mano, sirve de tutorial); a partir de la segunda, **cada expedición genera un mapa nuevo** (7-9 salas, siempre con inicio, jefe, cofres, portal y Kael; el número de mapa aparece bajo el temporizador). Incluye cámara que sigue al jugador, movimiento por teclado o clic (con búsqueda de camino), colisiones, puertas, trampas, antorchas con luz parpadeante, niebla de guerra con línea de visión, cofres, murciélagos, esqueletos, jefe (Señor del Osario), portal y temporizador de 12 minutos.
- **Combate por turnos**: orden por velocidad, ataque básico, 2 habilidades por clase, defensa, objetos, huida, 7 estados alterados, críticos, evasión, IA enemiga, aliados en combate, registro y animaciones.
- **Clase, arma y nivel**: cada clase tiene 1 habilidad propia; el arma equipada da el ataque básico y sus habilidades (sin arma, puños); las defensivas solo con escudo o tomo. Todo el equipo tiene nivel mínimo (1, 3, 5, 8): se puede guardar pero no equipar hasta alcanzarlo. Ver `docs/DISENO.md`.
- **Kit de recluta automático**: si mueres y no te queda ningún arma, recibes arma, armadura y una poción.
- **Apariencia según el equipo**: el personaje cambia de aspecto con cada pieza visible (arma, secundaria, cabeza, torso, guantes, botas y amuleto) en el lobby, el combate y la mazmorra, incluso al cambiar de equipo en plena expedición. Cómo se ve cada objeto está en `src/shared/gearLook.ts`.
- **Interacción**: E usa lo que tienes delante; si hay varias cosas cerca (Kael, un cofre, una puerta…) abre un menú para elegir (teclas 1-9).
- **Móvil**: la web y la demo avisan de que se juega con teclado y ratón y permiten enviarse el enlace.
- **Aventurero rival (Kael)**: hablar, aliarse, duelo consensuado (no letal), ignorar, ataque hostil, reparto del botín, traición del jugador (con confirmación) y traición de Kael (con aviso previo según cómo le trates). Si cae, deja una bolsa con sus pertenencias.
- **Extracción y muerte**: canalizar 3 s en el portal → resumen y botín conservado. Morir o quedarse sin tiempo → se pierde todo lo transportado; el almacén y el oro del banco se mantienen; la experiencia se conserva.
- **Persistencia** en IndexedDB (respaldo en localStorage). Si la página se recarga a mitad de expedición, esta se anula sin pérdidas.

## Pruebas

- `npm test`: 72 pruebas unitarias del núcleo (incluye simulaciones de balance y 300 mapas generados validados).
- `node scripts/e2e.cjs http://localhost:5173/play/`: recorrido completo en un navegador real (crear personaje → comprar poción → mazmorra → combate → cofre → alianza → portal → el botín aparece en el lobby → recarga → muerte). Requiere Playwright.
- `node scripts/e2e-social.cjs …`: duelo, alianza, traición, saqueo y huida.
- `node scripts/screenshots.cjs …`: regenera las capturas de la web en `public/screenshots/`.

## Estructura

```
index.html            Web oficial (landing)
play/index.html       Demo jugable
src/core/             Lógica pura y determinista (sin Phaser ni React): reutilizable en un servidor
  data/               Objetos, clases, habilidades, enemigos, misiones, mercader
  combat.ts           Motor de combate por turnos
  inventory.ts        Cuadrículas, pilas, equipo y transferencias
  expedition.ts       Reglas de entrada, extracción y muerte
  social.ts           Confianza, codicia, alianzas y traiciones
  dungeon.ts          Formato de mazmorra (salas + pasillos) y búsqueda de caminos
  dungeonGen.ts       Generador procedural (determinista por semilla) y validación de mapas
src/game/engine/      Phaser: escena isométrica, luz, movimiento, IA de exploración
src/game/state/       Estado global y acciones (puente entre núcleo, interfaz y motor)
src/game/ui/          Interfaz React del juego
src/game/persistence/ IndexedDB
src/landing/          Web oficial
src/shared/           Pixel art procedural y paleta (compartido por juego y web)
tests/                Pruebas unitarias
scripts/              Servidor estático y pruebas E2E
docs/                 Arquitectura, diseño, multijugador y recursos a sustituir
```

## Próximos pasos propuestos

1. Pícaro y Clérigo completos (los datos y habilidades ya existen).
2. Más variedad en los mapas generados (salas especiales, eventos, distintos biomas).
3. Arte y audio definitivos (ver `docs/ASSETS.md`).
4. Más criaturas (goblin, araña venenosa, mago esquelético) y reputación de aventurero.
5. Servidor autoritativo con Colyseus (ver `docs/ARQUITECTURA.md`).
6. Empaquetado para Windows con Tauri.
