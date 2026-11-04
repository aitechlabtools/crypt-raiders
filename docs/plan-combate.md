# Plan: nueva barra de combate, habilidades de clase, armas por subzona y rarezas

Propuesta del 4/11/2026. Distribución de la barra ELEGIDA por el usuario: **D** (ver mockups/combate).
Pendiente de aprobación del resto del plan. No se ha tocado el código del juego.

---

## 1. Análisis del código actual

### 1.1 Combate
- `core/combat.ts`: combate por turnos con orden por velocidad (`turnOrder`), varios combatientes por bando (jugador,
  mercenario, errante). Acciones: atacar (básico del arma), habilidad, objeto, defender y huir (`fleeChance`).
- Daño (`rollDamage`): ataque (o magia) × potencia, menos defensa (o resistencia), con crítico, evasión, `armorPierce`
  y extra contra no-muertos. Las criaturas escalan con el nivel (`levelScale` y la curva de subzonas).
- Estados (`core/statuses.ts`): veneno 7 %, quemadura 6 % y sangrado 5 % de la vida por turno; congelación y aturdimiento
  (pierde el turno); protección (−40 % de daño), furia (+30 %), bloqueo (−85 % al siguiente golpe) y regeneración.
- **La barra azul AG** es el recurso de la clase: **Aguante** del Guerrero (20 + 2 por nivel, +2 por turno) y **Maná** del
  Mago. Las habilidades cuestan de 2 a 8. Las pociones de maná lo recuperan; la Meditación del Mago también.
  Hoy no hay recargas: solo el coste limita las habilidades.

### 1.2 Armas, equipo y habilidades
- `core/data/items.ts`, `zones/cripta.ts`, `zones/infierno.ts` y `data/forge.ts`: **32 armas de mano derecha**,
  15 de mano izquierda (escudos y tomos) y 35 piezas más (8 cascos, 11 armaduras, 4 guantes, 4 botas, 4 anillos,
  4 amuletos). En total, 77 equipables (25 de ellos del Pícaro, el Clérigo o forjados).
- Cada arma lleva rareza fija, `levelReq`, clases, `family` (espada, hacha, daga, bastón, maza, escudo, tomo), su
  ataque básico (`attack`) y las habilidades que concede (`grants`, de 2 a 3).
- `core/loadout.ts`: el jugador combate con su **habilidad de clase** (Grito de guerra o Meditación), las del arma y
  las de la secundaria. Hay **22 habilidades de jugador** (más 30 de criaturas). Sin arma: Puñetazo y Golpe bajo.
- Ataques básicos: casi todos iguales por familia (Tajo ×1, Hachazo ×1,15, Proyectil arcano ×0,8…).

### 1.3 Rarezas y botín
- 5 rarezas con color (`RARITY_INFO`). La rareza es **fija por objeto**: no hay versiones del mismo objeto con otra
  rareza ni atributos aleatorios.
- Botín: tablas de cofres por zona (`rarityTable` reparte el peso por rareza) y botín propio de cada criatura.
  Desde las subzonas, los cofres de las hondas dan más oro y tiradas y favorecen el equipo de su nivel.

### 1.4 Barra de combate
- `ui/CombatScreen.tsx`: registro a la izquierda y cuadrícula 2×2 (`.cmd`): Atacar, Habilidades (submenú paginado),
  Mochila (submenú) y Huir. Teclas 1–4, flechas y Esc. En táctil: un toque ejecuta y mantener pulsado enseña la ficha
  (`useLongPress`, `combatActions.tsx`). En pantallas bajas, la barra se compacta (`game.css`, `max-height: 560px`).

### 1.5 Qué hay que refactorizar
1. Acciones del jugador: de «lista de habilidades con coste» a **ranuras**: básico, 4 especiales (2 por mano),
   1 habilidad de clase, con **recarga por acción** guardada en el combatiente.
2. `ItemDef` de armas y secundarias: tipo (`weaponType`), manos (1 o 2), básico propio y **dos especiales** fijos.
3. `ItemStack` gana **rareza y atributos** propios (el mismo objeto puede salir común o épico).
4. Clases: lista de 5 habilidades por nivel y la equipada en el perfil.
5. La barra de combate y la ficha de acción; la pestaña Personaje (elegir habilidad de clase).
6. Botín por subzona con rarezas por tirada.

---

## 2. Barra de combate (distribución D, elegida)

Capturas en `mockups/combate/capturas/D-*.png`; índice en `mockups/combate/index.html`.

| Estado | Contenido (cuadrícula 2×2 junto al registro) |
|---|---|
| Normal | **Atacar** (básico del arma, tecla 1) · **Ataque especial** (abre los 4; muestra «3 listos · 1 en recarga», tecla 2) / **Habilidad** (la de clase equipada, tecla 3) · **Mochila** y **Huir** a media anchura (teclas 4 y 5) |
| Ataque especial | En el mismo sitio: columna **Volver** (Esc) + 2×2: fila de arriba, los 2 de la **mano derecha** (borde rojo); abajo, los 2 de la **mano izquierda** (borde azul). Teclas 1–4. Los que están en recarga, apagados con un círculo con los turnos que faltan. |
| Mochila | En el mismo sitio: **Volver** arriba y **Página 1/2 ▸** abajo (Tab) + 2×2 con los objetos usables (icono, nombre, cantidad y efecto). Teclas 1–4. Sin página si caben en 4. |

- Cada botón: borde de color a la izquierda (rojo = mano derecha, azul = mano izquierda, violeta = clase, dorado =
  mochila), icono, título y subtítulo, y un icono pequeño del arma de la que viene.
- Ficha (ratón encima o mantener pulsado): nombre, daño estimado, efecto, recarga y «Mano derecha · Espada de hierro (rara)».
- En móvil horizontal, el registro pasa a **una línea sobre la barra** (toca para verlo entero). Botones de 44 px o más.
- **Arma a dos manos**: da sus 4 especiales ella sola (las dos filas con su color). **Mano izquierda vacía**: dos
  acciones sin arma: **Empujón** (×0,6, 30 % aturdir, recarga 2) y **Guardia** (−30 % de daño un turno, recarga 2).
- Mano derecha vacía: básico **Puñetazo** y especiales **Golpe bajo** y **Cabezazo**.

---

## 3. Recursos: Ímpetu y Maná (decidido)

Las acciones tienen **coste y recarga**. El recurso depende del tipo de acción, no solo de la clase:
- **Ímpetu** (barra naranja): lo gastan los ataques **físicos** (especiales de espada, hacha, maza, lanza, escudo, daga,
  antorcha y las habilidades físicas del Guerrero). Se recupera con el **Tónico de concentración** y un poco cada turno.
- **Maná** (barra azul): lo gastan los ataques **mágicos** (bastón, varita, báculo, tomo, orbe y habilidades del Mago).
  Se recupera con la **poción de maná** y un poco cada turno.
- El Guerrero usa Ímpetu; el Mago y las futuras clases mágicas (Clérigo), Maná. El Aguante actual pasa a llamarse Ímpetu.
- El ataque básico no cuesta nada ni tiene recarga.
- Costes orientativos: especiales 2–4, habilidad de clase 3–6.

### Recargas entre combates (decidido)
- En el primer combate de la expedición todo está listo.
- Las recargas **se guardan al terminar un combate**: si a un ataque le faltaban 2 turnos, en el siguiente combate sigue
  faltándole 2. Se guardan en la expedición (no en el perfil): al volver al pueblo, todo queda listo.

---

## 4. Habilidades de clase (5 por clase, una equipada)

La de la fila «Nivel 1» es la inicial. A los niveles **20, 40, 60 y 80 el jugador elige** cuál de las que le quedan
desbloquea (decidido): al subir de nivel sale un aviso «Nuevo desbloqueo de clase» con las restantes y un botón
«Desbloquear» en cada una; si lo cierra, el desbloqueo queda pendiente y se puede hacer en **Personaje → Habilidad de
clase**. Allí se ven las cinco tarjetas (icono, nombre, efecto, coste, recarga): desbloqueadas, por desbloquear (si hay
algún desbloqueo pendiente) y bloqueadas. Se lleva una equipada; se cambia fuera de combate. La columna «Nivel» de la
tabla es solo el orden sugerido.

| Nivel | Guerrero | Recarga | Mago | Recarga |
|---|---|---|---|---|
| 1 | **Grito de guerra**: +30 % de daño 3 turnos | 5 | **Escudo de maná**: absorbe daño igual al 25 % de tu vida máx. durante 3 turnos | 5 |
| 20 | **Sed de sangre**: golpe ×1,3 que te cura el 50 % del daño hecho | 4 | **Parpadeo**: esquivas el próximo ataque y tu siguiente hechizo hace +50 % | 4 |
| 40 | **Aguantar la línea**: −50 % de daño 2 turnos y no puedes caer por debajo de 1 de vida en ese tiempo | 7 | **Maldición de debilidad**: el enemigo hace −30 % de daño durante 3 turnos | 5 |
| 60 | **Torbellino de acero**: golpea a todos los enemigos ×1,2 y les hace sangrar | 5 | **Pacto de sangre**: pierdes el 15 % de tu vida y todas tus recargas vuelven a 0 | 8 |
| 80 | **Último bastión**: 3 turnos sin poder caer por debajo de 1 de vida y golpes ×1,5 | 9 | **Cometa del abismo**: ×3 de daño mágico y quemadura 3 turnos | 9 |

Estructura: `data/classSkills.ts` → `CLASS_SKILLS[classId] = [{ level, skillId }]`, con entradas vacías para Pícaro y
Clérigo (sus 5 habilidades se diseñan cuando lleguen las clases).

---

## 5. Armas y equipo por subzona

### 5.1 Tipos por clase
| | Mano derecha (1 mano) | A dos manos | Mano izquierda |
|---|---|---|---|
| Guerrero | Espada, hacha, maza, lanza | Mandoble, gran hacha | Escudo, daga de parada, antorcha |
| Mago | Bastón, varita, cetro | Báculo mayor | Tomo, orbe, antorcha, daga ritual |

### 5.2 Familias: básico y especiales posibles (cada arma lleva 2 de su familia; las de 2 manos, 4)
| Familia | Básico (sin recarga) | Especiales posibles (recarga en turnos) |
|---|---|---|
| Espada | **Tajo** ×1,0 · 10 % sangrado | Tajo desgarrador ×1,4 sangrado (3) · Estocada ×1,2 no se esquiva (2) · Golpe de pomo ×0,8 40 % aturdir (3) · Corte del pavor ×2,0 sangra (5) |
| Hacha | **Hachazo** ×1,15 · ignora 15 % defensa | Golpe brutal ×1,4 ignora 50 % (3) · Partecráneos ×1,2 35 % aturdir (4) · Siega ×1,8 ignora 30 % (5) |
| Maza | **Mazazo** ×1,0 · 10 % aturdir | Aplastar ×1,3 y −30 % defensa 2 t (3) · Golpe sordo ×0,9 50 % aturdir (4) · Martillazo ×1,9 (5) |
| Lanza | **Pinchazo** ×0,95 · no se esquiva | Empalar ×1,5 sangra (4) · Mantener a raya ×0,8 y +40 % esquiva 2 t (3) · Barrido ×1,1 25 % aturdir (3) |
| Mandoble / gran hacha (2 manos) | **Tajo pesado** ×1,25 | 4 de espada o hacha, con +10 % de potencia |
| Bastón (fuego, hielo o sombra) | **Proyectil arcano** ×0,8 mágico | Fuego: Chispa (2), Bola de fuego (3), Lluvia de ascuas (4) · Hielo: Lanza de escarcha (2), Ventisca (4), Prisión de hielo (5) · Sombra: Saeta sepulcral (2), Nova oscura (6), Sifón vital (3) |
| Varita | **Chispazo** ×0,7 mágico (+2 velocidad) | Especiales del elemento con 1 turno menos de recarga y −15 % de potencia |
| Báculo mayor (2 manos) | **Rayo** ×1,0 mágico | 4 del elemento |
| Escudo | — | Bloqueo −85 % al próximo golpe (2) · Embestida ×0,7 40 % aturdir (3) · Muro de hierro −40 % y regeneración 3 t (6) |
| Daga (izquierda) | — | Puñalada ×0,9 ignora evasión (2) · Estocada venenosa ×1,1 veneno (3) |
| Tomo | — | Barrera arcana −40 % 3 t (5) · Sifón vital ×0,9 y te curas el 50 % del daño (3) |
| Orbe | — | Pulso ×1,0 mágico (2) · Foco: tu siguiente especial +50 % (4) |
| Antorcha | — | Quemar ×0,8 fuego 70 % quemadura (2) · Ahuyentar: el enemigo −30 % de daño 2 t (4) |

### 5.3 Armas por subzona (R = reutilizada, N = nueva; ★ = legendaria con especial único)
| # | Subzona | Guerrero | Mago | Mano izquierda |
|---|---|---|---|---|
| 1 | Afueras (1–10) | Espada oxidada R · Espada de hierro R · Hacha de batalla R · **Lanza de la guardia N** | Báculo de aprendiz R · Báculo de brasas R · **Varita de abedul N** | Escudo de madera R · Escudo de hierro R · Tomo arcano R · **Antorcha de brea N** |
| 2 | Castillo (10–20) | Espada templada R · Hacha templada R · Espada del caballero R · Hacha del verdugo R · **Maza de armas N** | Báculo de cristal R · Báculo del invierno R | Escudo del Bastión R · **Daga de parada N** · **Orbe turbio N** |
| 3 | Calabozos (20–30) | Hoja del Pavor R · Segadora de huesos R · **Mandoble del verdugo N** (2 manos) | Bastón rúnico R · **Báculo mayor del carcelero N** | Grimorio del eclipse R |
| 4 | Osario (30–40) | Espada sepulcral R · Hacha del verdugo real R · **Lanza de fémur N** | Báculo del osario R · **Varita de vértebra N** | **Orbe del osario N** |
| 5 | Catacumbas (40–50) | Hoja del guardián R · Espada de plata forjada R · **Tridente del ahogado N** | Báculo de ectoplasma R · Báculo del réquiem R | Escudo de lápida R · Baluarte de hueso R · Grimorio fúnebre R · **Farol del barquero N** |
| 6 | Panteón (50–60) | Segur del réquiem R · **Estoque de los duques N** | Cetro del sudario R | **★ Velo de la Reina N** (orbe: «Lamento velado»: congela y te protege) |
| 7 | Carmesí (60–70) | Espada de obsidiana R · **Maza de sangre N** | Báculo de azufre R · **Daga ritual del Umbral N** | Escudo de escama R · Tomo ardiente R |
| 8 | Puertas (70–80) | Hacha de cadenas R · ★ Gran hoja de obsidiana R · **★ Martillo de Ignaroth N** (2 manos: «Forja viva»: aturde y quema) | ★ Cetro de azufre forjado R · **Orbe de magma N** | **Escudo de cadenas N** |
| 9 | Ríos de Fuego (80–90) | Hoja forjada en el abismo R · **Gran hacha de azufre N** (2 manos) | Cetro del abismo R · **Varita de ceniza N** | **Antorcha infernal N** |
| 10 | Trono (90–100) | **★ Cadena de Belzar N** («Arrastrar al abismo»: ×2,5, aturde e ignora defensa) · **Mandoble del Trono N** | **★ Ojo del Abismo N** (orbe: «Mirada del vacío»: −50 % de daño enemigo 2 t) · **Báculo mayor del abismo N** | — |

Total: 37 armas y secundarias reutilizadas (las de Guerrero y Mago) y **24 nuevas** (5 legendarias con especial único, 2
de ellas ya existentes a las que se añade su especial). Las del Pícaro y el Clérigo se conservan para cuando lleguen.

### 5.4 Equipo nuevo por subzona (2 o 3 piezas cada una; las 35 existentes se reparten por su nivel)
1 Afueras: Gorro de centinela, Brazales de cuero · 2 Castillo: Yelmo de la guardia, Botas de patio · 3 Calabozos: Capucha
de carcelero, Grilletes rotos (anillo) · 4 Osario: Máscara de hueso, Rosario de falanges (amuleto) · 5 Catacumbas: Túnica
empapada, Botas de cieno, Anillo de coral negro · 6 Panteón: Corona del duque, Guantes de seda fúnebre · 7 Carmesí: Coraza
de sangre seca, Capucha del culto · 8 Puertas: Yelmo de obsidiana, Guanteletes de forja · 9 Ríos: Botas de ceniza, Amuleto
de azufre · 10 Trono: Coraza de cadenas, Anillo del condenado, Corona rota de Belzar (★).

---

## 6. Rarezas y atributos

- La rareza pasa a ser **de cada objeto encontrado** (no fija por objeto). Cada objeto define su rareza mínima y máxima.
- **Estadísticas**: común ×1,0 · poco común ×1,12 · rara ×1,25 · épica ×1,4 · legendaria ×1,6 (las legendarias
  tienen su propio perfil fijo).
- **Atributos aleatorios** («de sangrado», «del vampiro»…): común 0 · poco común 1 · rara 1–2 · épica 2 · legendaria fijos.
  Ejemplos: **de sangrado** (el básico hace sangrar un 20 %), **del vampiro** (curas el 8 % del daño), **del verdugo**
  (+25 % de daño a enemigos con menos del 30 % de vida), **gélido** (15 % de congelar), **veloz** (+2 velocidad),
  **pétreo** (+defensa), **del sabio** (−1 turno a la recarga de un especial), **del ermitaño** (+vida máxima).
- **Especiales según rareza**: rara −1 turno de recarga en uno de los dos especiales; épica +15 % de potencia en ambos;
  legendaria, su especial único.
- **Probabilidad**: la rareza de cada tirada depende de la subzona (la tabla `rarity` que ya tienen) y mejora en los
  cofres con llave (+1 escalón de probabilidad) y en los de jefe (+2).
- En el inventario, el borde de color de siempre; en la ficha, el nombre con sus atributos («Espada de hierro gélida del vampiro»).

---

## 7. Equilibrio (daño medio por turno con recargas)

Simulación de un jugador que usa el mejor especial disponible cada turno (12 turnos), en múltiplos de su ataque:

| Equipo | Básico | Media por turno | Comparación hoy |
|---|---|---|---|
| Espada + escudo (Guerrero) | ×1,0 | ×1,19 + bloqueo/embestida | ≈ igual que ahora (×1,15) |
| Hacha + escudo | ×1,15 | ×1,26 | ligera mejora |
| Maza + daga | ×1,0 | ×1,30 | más daño, sin defensa |
| Mandoble (2 manos) | ×1,25 | ×1,45 (objetivo, ajustado) | más daño, sin escudo |
| Bastón de fuego + tomo (Mago) | ×0,8 | ×1,20 + barrera/sifón | ≈ igual (sin quedarse sin maná) |
| Bastón de hielo + orbe | ×0,8 | ×1,18 + congelaciones | ≈ igual |
| Báculo mayor (2 manos) | ×1,0 | ×1,45 (objetivo, ajustado) | más daño, más frágil |

Las armas a dos manos dan más daño a cambio de no llevar escudo ni tomo. Se comprobará con la prueba automática de
combates (`tests/balance.test.ts`) en las 10 subzonas, con ambas clases y con armas a una y dos manos, exigiendo lo de
ahora: comunes ≥ 75 % de victorias, élites ≥ 35 %, jefes entre 15 % y 99 % (Belzar, ≥ 5 %).

---

## 8. Decisiones tomadas

1. Recursos: Ímpetu para lo físico (Tónico de concentración) y Maná para lo mágico (poción de maná).
2. Respondida con la 1.
3. Todo listo al empezar la expedición; las recargas pendientes pasan de un combate al siguiente.
4. Rareza y atributos para todo; el equipo actual no hace falta conservarlo tal cual (solo hay un jugador).
5. Las legendarias, como están.
6. Las 10 habilidades, bien; el jugador elige qué desbloquear a los niveles 20, 40, 60 y 80.

---

## 7.1 Resultado del equilibrio final (C6, simulación de tests/balance.test.ts)

| Subzona | Guerrero: élite / jefe | Mago: élite / jefe |
|---|---|---|
| Afueras (nv 6) | 95 % / 96 % | 84 % / 80 % |
| Castillo (15) | 98 % / 55 % | 60 % / 16 % |
| Calabozos (25) | 100 % / 57 % | 93 % / 55 % |
| Osario (35) | 100 % / 54 % | 96 % / 31 % |
| Catacumbas (45) | 100 % / 90 % | 100 % / 34 % |
| Panteón (55) | 100 % / 29 % | 88 % / 45 % |
| Carmesí (65) | 95 % / 99 % | 100 % / 66 % |
| Puertas (75) | 100 % / 91 % | 100 % / 66 % |
| Ríos (85) | 100 % / 66 % | 100 % / 33 % |
| Trono (95) | 100 % / 79 % | 94 % / 43 % |

Cambios respecto a la propuesta: recargas 1 turno más cortas; costes a la mitad; Escudo de maná 30 % (recarga 3);
Aguantar la línea −40 %; Último bastión 2 turnos (+30 %, recarga 9); Parpadeo +30 %; Maldición de debilidad hace x1.0.

## 9. Plan por fases

| Fase | Qué | Cómo se prueba |
|---|---|---|
| **C1** | Datos: armas con tipo, manos, básico y 2 especiales (o 4); familias y especiales en `data/weapons.ts`; recargas en el combatiente; **migración**: objetos y habilidades antiguas se mapean (mismo id, nuevos campos), recursos Ímpetu y Maná; recargas guardadas en la expedición. | Vitest; cargar partidas antiguas. |
| **C2** | Combate con coste (Ímpetu o Maná) y recargas; **barra D** (Atacar · Ataque especial · Habilidad · Mochila y Huir) con las armas actuales; ficha de acción; teclas; móvil. | Pruebas de combate en los tres formatos; e2e. |
| **C3** | Desbloqueo a elegir en los niveles 20/40/60/80, selección en Personaje y aviso al desbloquear. | Personaje en los tres formatos; subir de nivel con ?debug. |
| **C4** | Armas y equipo nuevos por subzona (con su dibujo provisional) y botín por subzona. Capturas para que las veas. | Hoja de arte; botín con ?debug. |
| **C5** | Rarezas por tirada y atributos; especiales mejorados; legendarias con su especial único. | Vitest y fichas en el inventario. |
| **C6** | Equilibrio final en las 10 subzonas, landing, `docs/estado-trabajo.md` y `docs/guia-interfaz.md`. | Suite completa. |

He adelantado la barra (C2) a las clases y las armas nuevas porque cambia la regla central del combate (coste y recargas): conviene que funcione y se pruebe con las armas que ya existen antes de añadir 24 nuevas.

**Modo de desarrollo** (?debug): `__CRYPTRAIDERS__.dev.give('cadena_belzar', 'legendary')` para conseguir cualquier arma con
cualquier rareza, `dev.setLevel(60)` y `dev.resetCooldowns()`.

### Migración de partidas
- Los ids de objetos no cambian: cada arma antigua recibe tipo, básico y dos especiales de su familia (de sus `grants`
  actuales se eligen los dos primeros). Las que daban 3 habilidades conservan la tercera como atributo «del sabio».
- Los objetos guardados reciben `rarity` = la del objeto y sin atributos. No se pierde nada.
- Las pociones se conservan. La habilidad de clase equipada pasa a ser la inicial; un personaje de nivel 20 o más recibe sus desbloqueos pendientes para elegirlos.
- El «+Aguante» del equipo pasa a «+Ímpetu»; el «+Maná», igual.

---

## 10. Archivos por fase
- **C1**: `core/types.ts`, nuevo `core/data/weapons.ts` (familias, básicos y especiales), `data/items.ts` y zonas (campos
  nuevos), `core/data/skills.ts` (recargas), `core/combat.ts` (recargas, sin coste), `core/combatants.ts`, `core/loadout.ts`,
  `core/profile.ts` (migración), `tests/combat-actions.test.ts`.
- **C2**: `ui/CombatScreen.tsx` (barra D), `ui/combatActions.tsx` (ficha y teclas), `game.css`, `ui/DungeonScreen.tsx` (barra Ímpetu/Maná),
  `scripts/e2e.cjs`, `touch-check.cjs`, `mobile-check.cjs`.
- **C3**: nuevo `core/data/classSkills.ts`, `data/classes.ts`, `screens/Personaje.tsx`, `store.ts` (aviso al subir de nivel).
- **C4**: `data/items.ts` (o `data/gear/*.ts` por subzona), `shared/art.ts` (iconos y aspecto), `shared/gearLook.ts`, `core/loot.ts`,
  `config/subzones.ts`.
- **C5**: nuevo `core/data/affixes.ts`, `core/loot.ts` (tirada de rareza y atributos), `screens/ItemCard.tsx`, `ui/inventory.tsx`.
- **C6**: `tests/balance.test.ts`, `src/landing/*`, `docs/estado-trabajo.md`, `docs/guia-interfaz.md`.

---

## 11. Assets que diseñarás tú (marcadores por código mientras tanto)

**Iconos de acción** (24×24 px, se muestran ×2 o ×3): 1 por ataque básico de familia (12), 1 por especial (≈ 40),
10 habilidades de clase, Volver, Página, Tónico de concentración, y el círculo de recarga.
**Armas y secundarias nuevas** (24 piezas): icono de inventario 16×16 px y aspecto en el personaje (sprite de mano,
máximo 12×20 px, en las capas de arma y secundaria ya existentes).
**Equipo nuevo** (23 piezas): icono de inventario 16×16 px y, si se ve en el personaje, su versión de cuerpo (cabeza 20×8,
torso 20×10, manos y pies 4×4 px).
**Legendarias** (5): icono con un marco propio y un efecto de brillo de 2 fotogramas.
Por subzona: 1 Afueras (lanza, varita, antorcha, gorro, brazales) · 2 Castillo (maza, daga de parada, orbe, yelmo, botas) ·
3 Calabozos (mandoble, báculo mayor, capucha, grilletes) · 4 Osario (lanza de fémur, varita de vértebra, orbe, máscara,
rosario) · 5 Catacumbas (tridente, farol, túnica, botas, anillo) · 6 Panteón (estoque, ★ Velo de la Reina, corona, guantes) ·
7 Carmesí (maza de sangre, daga ritual, coraza, capucha) · 8 Puertas (★ Martillo de Ignaroth, orbe de magma, escudo de
cadenas, yelmo, guanteletes) · 9 Ríos (gran hacha, varita de ceniza, antorcha infernal, botas, amuleto) · 10 Trono
(★ Cadena de Belzar, mandoble, ★ Ojo del Abismo, báculo mayor, coraza, anillo, ★ corona).
