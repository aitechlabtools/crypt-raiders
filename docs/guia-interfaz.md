# Guía de interfaz de los menús

Cómo se monta una pantalla de los menús de Crypt Raiders (refugio, crear personaje…) para que funcione igual
en ordenador, tableta y móvil en horizontal. La estructura viene de la opción D de las maquetas
(`mockups/menu-structure/opcion-d.html`): barra superior con pestañas en píldora y paneles en columnas.
Solo se copia la estructura: los gráficos son siempre los del juego.

## Formatos y medidas

Todo está en un sitio: `src/config/ui.ts` (para el código) y el bloque «Base de interfaz» de
`src/game/game.css` (las mismas medidas como variables CSS). Si cambias un valor, cámbialo en los dos.

| Formato | Cuándo | Barra | Margen | Casilla | Casilla de arma | Botón principal |
|---|---|---|---|---|---|---|
| Escritorio | ancho ≥ 1280 px | 68 px | 24 px | 52 px | 76 px | 72 px |
| Tableta | ancho < 1280 y alto > 520 | 60 px | 18 px | 52 px | 72 px | 64 px |
| Móvil | alto ≤ 520 px | 52 px | 10 px | 44 px | 56 px | 52 px |

- En código: `useLayout()` devuelve `'desktop' | 'tablet' | 'phone'`; `UI.slot[layout]`, etc.
- En CSS: `var(--pad)`, `var(--gap)`, `var(--slot)`, `var(--slot-big)`, `var(--cta-h)`, `var(--touch)`.
- Todo lo que se toca mide al menos **44 px** (`var(--touch)`), también en móvil.
- Respeta las zonas seguras: `max(var(--pad), env(safe-area-inset-left))` en los bordes.

## Pixel art

- Siempre a escala **entera** (×2, ×3…). Nunca 2,5. Usa `usePixelScale('hero' | 'heroSm' | 'portrait' | 'vendor' | 'nav')`,
  que devuelve la escala entera para el formato actual (`UI.scale` en `config/ui.ts`).
- Las imágenes llevan la clase `pixelated`.

## Piezas comunes (`src/game/ui/kit`)

| Pieza | Para qué |
|---|---|
| `PillBar` | Pestañas en píldora de la barra superior (con número verde de novedades). |
| `Panel` | Panel de piedra con título entre rombos («◆ EQUIPO ◆») y cuerpo. `gold` para el borde dorado. |
| `SubHead` | Encabezado pequeño dentro de un panel («Mochila · 11/24») con hueco a la derecha para un botón. |
| `Segmented` | Dos o tres vistas de la misma pantalla (Equipo / Almacén). En móvil sustituye a las columnas que no caben. |
| `Drawer` | Cajón lateral con pestaña vertical: en móvil guarda un panel secundario (Atributos). |
| `Card` | Tarjeta con arco para retratos (mercaderes). |
| `ItemSlot`, `GridView` | Casilla e inventario (miden `var(--slot)`). |
| `ItemCard` | Ficha del objeto seleccionado con sus acciones (`screens/ItemCard.tsx`). |
| Clases CSS | `.cta` botón principal, `.icon-btn` botón de icono de 44 px, `.ui-tag` etiqueta, `.pill`. |

## Montar una pantalla nueva

1. Crea `src/game/ui/screens/MiPantalla.tsx` y añádela a las pestañas de `Lobby.tsx` (tipo `LobbyTab` y lista `tabs`).
2. La pantalla ocupa todo el alto disponible (`h-full`) y gestiona su propio desplazamiento: los paneles
   largos llevan `overflow-y-auto scroll-thin` en su cuerpo, no la página entera.
3. Escritorio y tableta: columnas de `Panel` separadas por `var(--gap)`, con `var(--pad)` de margen.
4. Móvil (alto ≤ 520): una sola columna visible. Lo demás va en `Segmented` (vistas) o en `Drawer` (cajón).
5. Nada depende de pasar el ratón: en táctil, tocar enseña la ficha o selecciona; mantener pulsado, la ficha.
6. Textos visibles en español. Nada de funciones falsas: lo que no existe, no se enseña (o «Próximamente» si se ha decidido así).
7. Prueba en los tres formatos: `scripts/menus-check.cjs` hace capturas de todas las pestañas en 1920×1080,
   1180×820 y 844×390 y avisa si algo se sale de la pantalla o mide menos de 44 px en táctil.
