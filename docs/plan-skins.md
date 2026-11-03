# Plan: skins de traje completo (sustituyen al Vestuario)

Estado: PROPUESTA, pendiente de aprobación. Maquetas en `mockups/skins` (abre `mockups/skins/index.html`).

## 1. Qué hay ahora

### Vestuario
- `src/core/data/cosmetics.ts`: 25 «aspectos» por pieza (cabeza, torso, manos, pies, arma, secundaria). 19 se ganan jugando
  (3 por misiones de Vesper, 4 por rango Leyenda, 9 en relicarios de jefe, 3 como botín raro de élites) y 6 son de la
  tienda maqueta («Próximamente», no se pueden comprar).
- `src/core/cosmetics.ts`: desbloquear, ponerse (`wear`) y `dressed()`, que sustituye el aspecto de cada pieza equipada.
- Partida guardada: `profile.cosmetics` (los desbloqueados) y `profile.wardrobe` (qué aspecto lleva cada ranura).
- Pantallas: pestaña Vestuario y pestaña Tienda (`src/game/ui/WardrobeTab.tsx`). Avisos al conseguirlos en `store.ts`
  (`grantCosmetic`), recompensa visible en las misiones (`VendorsTab.tsx`) y prueba `tests/cosmetics.test.ts` y
  `scripts/e2e-wardrobe.cjs`.

### Cómo se dibuja el personaje
- No hay archivos de imagen: el héroe se dibuja por código (`src/shared/art.ts`) en un lienzo de **20×26 px**.
- `heroSpec()` traduce el equipo en una «ficha» de aspecto (colores y formas de cabeza, torso, manos, pies, capa, arma y
  secundaria) y `drawHumanoid()` lo pinta todo de una vez en este orden: capa → piernas y botas → torso → brazos y manos →
  cabeza y casco → **arma** (mano derecha) → **secundaria** (mano izquierda) → contorno negro de 1 px.
- Vistas: **de frente** (4 fotogramas de paso + pose de ataque; la de «herido» es un tinte rojo automático) y **de espaldas**
  (`drawHumanoidBack`, solo en combate: reposo y ataque; ahí el arma va DETRÁS del cuerpo).
- En la mazmorra hay una sola dirección de frente: para mirar a la izquierda se voltea en espejo (`setFlipX`).
- Se escala siempre a números enteros con `image-rendering: pixelated` (ya se cumple).

## 2. Plan por fases (cada una con pruebas, capturas y cómo probarla)

**Fase S1 · Datos y guardado**
- Crear `src/core/data/skins.ts`: las skins (id, nombre, descripción, rareza, `price: { currency, amount }` con
  `currency: 'gold' | 'premium' | 'real'` —hoy solo se usa `gold`—, sprites y marcador provisional) y `ANCHORS`.
- Crear `src/core/skins.ts`: `owns`, `canBuy`, `buy` (solo oro; cualquier otra moneda se rechaza), `equip`, `unequip`.
- `types.ts`: `profile.skins = { owned: string[]; equipped: string | null }`, fuera del inventario. Morir no lo toca.
- `profile.ts` (migración, ver pregunta 1): partidas con `cosmetics`/`wardrobe` se cargan sin error; se borran esos
  campos y se compensa con oro. Pruebas en `tests/skins.test.ts`.

**Fase S2 · Dibujado por capas** (`src/shared/heroLayers.ts` + `art.ts`)
- Separar el dibujo en capas: **cuerpo** (armadura real o skin) · **secundaria** · **arma**. El orden depende de la vista
  y está en datos: de frente `cuerpo → secundaria → arma`; de espaldas `arma → cuerpo → secundaria`.
- Puntos de anclaje por vista y fotograma (dónde está cada mano). El arma y la secundaria se dibujan relativas a esos
  puntos, así cualquier arma de cualquier clase encaja con cualquier skin sin tocar código.
- Anclajes del cuerpo actual (los mismos que usarán las skins si no dices otra cosa), en píxeles del lienzo 20×26:

  | Vista · fotograma | Mano derecha (arma) | Mano izquierda (secundaria) |
  |---|---|---|
  | Frente · reposo (0) | 14, 17 | 5, 17 |
  | Frente · paso (1) | 14, 17 | 5, 15 |
  | Frente · reposo alterno (2) | 14, 17 | 5, 17 |
  | Frente · paso (3) | 14, 15 | 5, 17 |
  | Frente · ataque | 14, 14 | 5, 17 |
  | Espaldas · reposo | 14, 17 | 5, 17 |
  | Espaldas · ataque | 14, 14 | 5, 17 |

- Una skin con sprites usa sus PNG (`public/skins/<id>.png`); sin sprites, su marcador provisional por código.
- La skin se ve en todas partes: retrato y barra del refugio, Jugar, Alijo, Personaje, mazmorra (`textures.ts`,
  `DungeonScene.ts`) y combate de espaldas (`CombatScreen.tsx`).

**Fase S3 · Ranura «Atuendo» y selector**
- `screens/Alijo.tsx`: ranura bajo Manos, mismo tamaño que las pequeñas, borde violeta y rombo. No admite arrastrar.
- `screens/SkinPicker.tsx`: ventana con «Sin atuendo» y tus skins con vista previa sobre tu personaje y tu arma; 44 px
  mínimo; toque o clic. El retrato del Aventurero cambia al momento.

**Fase S4 · Tienda**
- `screens/Tienda.tsx`: 3 tarjetas (vista previa con tu arma, nombre, rareza, descripción, precio) y sus estados:
  comprar · oro insuficiente (desactivado y «Te faltan X de oro») · Equipar · Equipada. Confirmación con nombre y precio;
  tras comprar, «¿Equiparla ahora?».

**Fase S5 · Limpieza y cierre**
- Quitar la pestaña Vestuario; borrar `WardrobeTab.tsx`, `core/cosmetics.ts`, `core/data/cosmetics.ts`,
  `tests/cosmetics.test.ts`, `scripts/e2e-wardrobe.cjs` y las referencias (`gearLook.ts`, `store.ts`, `VendorsTab.tsx`,
  `soak.cjs`, `trailer3-capture.cjs`, `menus-check.cjs`).
- Prueba nueva `scripts/e2e-skins.cjs` (comprar, equipar, verse en la mazmorra y en combate, no perderla al morir,
  partida antigua con aspectos). Actualizar landing («Ya disponible»), `docs/estado-trabajo.md` y `docs/guia-interfaz.md`.

## 3. Las 3 skins propuestas (región de VarkHollow)

| Skin | Concepto | Rareza | Precio |
|---|---|---|---|
| **Sudario del Penitente** | Hábito ceniciento de los monjes que velan las criptas, con vendas en las manos y cadenas. | Raro | 1.500 oro |
| **Guardián Hueco** | Armadura negra de la Guardia de VarkHollow, yelmo cerrado con rendija rojiza y capa granate. | Épico | 4.000 oro |
| **Señor de la Ceniza** | Ropajes del último señor de VarkHollow: corona de hierro al rojo, capa de brasas. | Legendario | 9.000 oro |

Referencia de precios: ampliar el almacén cuesta 500–10.000 oro y la mejor misión da 1.200.

## 4. Preguntas

1. **Aspectos que ya se ganan jugando** (misiones, Leyenda, relicarios y élites). Tu encargo dice que las skins solo
   salen de la Tienda. Propuesta: quitarlos, dar a cambio su valor en oro a quien ya los tenga (150 poco común, 400 raro,
   900 épico, 1.500 legendario) y cambiar las recompensas de aspecto de las misiones y de Leyenda por oro.
2. **Nombre de la ranura**: propongo «Atuendo» (como en las maquetas). Otras: «Skin», «Mortaja», «Galas».
3. **Color de piel**: ¿la cara de una skin usa el tono de piel que eligió el jugador? Propuesta: sí (los píxeles de piel
   se pintan en un color clave que el juego sustituye).
4. **Capa**: ¿la skin decide también la capa, o se mantiene el color de capa del jugador? Propuesta: la decide la skin.
5. **Precios** 1.500 / 4.000 / 9.000: ¿te parecen bien?
6. **Tráiler**: el rótulo «VESTUARIO · aspectos que se ganan jugando» quedará desfasado. ¿Lo cambio por «ATUENDOS»?

## 5. Sprites que tienes que diseñar (por cada skin)

Un PNG con fondo transparente de **140 × 26 px**: 7 fotogramas de **20 × 26 px** uno al lado del otro, sin arma ni
secundaria (el juego las pone encima) y sin contorno exterior (el juego añade el contorno negro de 1 px; deja 1 px libre
alrededor de la figura).

| Fotograma | Qué es |
|---|---|
| 1 | Frente · reposo |
| 2 | Frente · paso (cuerpo 1 px arriba, pierna izquierda levantada) |
| 3 | Frente · reposo alterno |
| 4 | Frente · paso (cuerpo 1 px arriba, pierna derecha levantada) |
| 5 | Frente · ataque (brazo derecho levantado 3 px) |
| 6 | Espaldas · reposo (combate) |
| 7 | Espaldas · ataque |

- Mirar a la izquierda y la pose de «herido» no se dibujan: el juego voltea en espejo y tiñe de rojo.
- Piel de la cara (si dices que sí a la pregunta 3): píxeles en **#FF00FF** (luz) y **#B000B0** (sombra).
- **Anclajes**: un segundo PNG del mismo tamaño (`<id>-anclajes.png`), transparente, con **un píxel #FF0000 donde la
  mano derecha agarra el arma** y **un píxel #0000FF en el centro de la mano izquierda** (secundaria) en cada fotograma.
  Un script los lee y los guarda en los datos. Si no lo entregas, se usan los anclajes del cuerpo actual (tabla de arriba).
- Escala: el juego los amplía a ×2, ×3… (siempre entero).
