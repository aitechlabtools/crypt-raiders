# Plan · Varios personajes, almacén por páginas y copia de seguridad

Propuesta del 5/11/2026. Está pendiente de aprobación. Las maquetas están en `mockups/personajes-copia/index.html`.

## 1. Cómo se guarda hoy y estructura propuesta

### Hoy
- Se guarda **un único perfil** (`Profile`, versión 2) en IndexedDB:
  - Base `cryptraiders`, almacén `save`, clave `profile`.
  - Si no hay IndexedDB, se usa localStorage con la clave `cryptraiders.profile`.
  - Las partidas con el nombre antiguo (`dreadbound`) se copian al cargar.
- El perfil lo lleva todo junto, en `src/core/types.ts`:
  - Personaje, oro, mochila, almacén (`stash`: 40 casillas, más las filas compradas con «Ampliar +8»), bolsillo y equipo.
  - Misiones, estadísticas, reputación, bestiario y jefes derrotados.
  - Contrato y mercenarios rescatados.
  - Atuendos (los comprados y el puesto).
  - Tutorial, Kael, habilidades de clase, última subzona y ajustes.
- `sanitizeProfile` repara y migra el perfil cada vez que se carga.

### Propuesta: «Partida» (`SaveData`, versión 3)
```
SaveData {
  format: 'cryptraiders-save', version: 3,
  account: {
    id,                       // identificador aleatorio: servirá para el guardado en la nube
    createdAt, updatedAt,
    skinsOwned: string[],     // atuendos comprados (de la cuenta)
    tutorialDone, tutorialSeen,
    settings,
    shared: { owned: boolean, grid: Grid },        // página «Compartido»
    lastCharacterId: string | null,
    backup: { lastAt: number | null, expeditionsSince: number, remindedAt: number | null },
  },
  characters: CharacterSave[],  // de 0 a 4, en el orden de los huecos
}
CharacterSave = Profile actual sin los datos de la cuenta, más:
  id, slot (0–3), lastPlayedAt,
  skinEquipped,                         // el atuendo puesto es de cada personaje
  stashPages: Grid[],                   // [página 1, página 2, …]; las compradas son las que existen
```
- **De cada personaje:**
  - Nombre, clase, nivel y XP; equipo, mochila, bolsillo y oro.
  - Reputación, encargos (contrato), misiones, estadísticas y páginas propias.
  - Habilidades de clase, bestiario, jefes derrotados, mercenarios rescatados, Kael y última subzona.
- **De la cuenta:** atuendos comprados, página «Compartido», tutorial completado y ajustes.
- **En el juego:** la tienda sigue trabajando con el personaje activo como hasta ahora. Al guardar se reparte entre la cuenta y su personaje, y al cambiar de personaje se monta de nuevo. Así no hay que reescribir el combate ni la mazmorra.
- **En el navegador:** una sola clave nueva, `save`. La antigua, `profile`, se conserva sin tocar como copia de seguridad de la migración.
- **Al importar una copia:** la partida actual se guarda primero en `save-undo`, para poder deshacerlo.

### Formato de la copia
- **Archivo** `crypt-raiders-copia-AAAA-MM-DD.json`, con este contenido:
  ```
  { format: 'cryptraiders-backup', v: 1, game: '0.2.x', exportedAt,
    summary: [{ name, class, level }],
    data: SaveData,
    sig }
  ```
- **Código de texto:** `CR1.` seguido del mismo JSON comprimido (deflate, con la librería `fflate`, unos 8 KB) y codificado en base64url.
- **Firma (`sig`):** un resumen (hash) del contenido con una sal interna. Si alguien cambia una cifra a mano, la firma no cuadra y la copia se rechaza con un mensaje claro. No para a un experto, pero frena la edición sencilla.
- **Versiones antiguas:** si `data` viene en un formato anterior (incluido un `Profile` v1 o v2 suelto), pasa por la misma migración que al cargar del navegador.

## 2. Migración de las partidas que ya existen
1. Al arrancar, si no existe `save` pero sí `profile` (o la partida antigua `dreadbound`):
   - Se pasa por `sanitizeProfile` como ahora.
   - Se crea `SaveData` con ese personaje en el **hueco 1**.
   - Atuendos, tutorial y ajustes se suben a la cuenta.
2. **Almacén:**
   - Todos los objetos actuales van a la **página 1**, que ahora tiene 120 casillas. El máximo antiguo eran 72, así que siempre caben.
   - Se **devuelve todo el oro gastado en «Ampliar (+8)»**: 500, 1.500, 4.000 y 10.000, hasta 16.000 en total. Me parece lo más justo: la página 1 gratis ya es mayor que el almacén más grande que se podía comprar, así que no pierde objetos ni lo pagado.
   - Un aviso única vez lo explica: «Tu almacén ahora tiene páginas. Te devolvemos X de oro por las ampliaciones».
3. La clave `profile` no se borra, por si hay que recuperar algo.
4. **Pruebas:**
   - Tests con perfiles v1, v2 sin ampliar, v2 con las 4 ampliaciones y almacén lleno, con atuendos y con expedición en curso.
   - Test de ida y vuelta de la copia: exportar, importar y comprobar que todo es igual.

## 3. Precios (en `src/config/stash.ts`, editables)
| Página | Precio | Notas |
|---|---|---|
| 1 | Gratis | 120 casillas (8 × 15) |
| 2 | 2.500 | |
| 3 | 6.000 | |
| 4 | 12.000 | |
| 5 | 25.000 | |
| Compartido | 15.000 | Una sola vez y para todos los personajes. Es la única forma de pasar objetos entre ellos. |

- Todas las páginas tienen el mismo tamaño en todos los dispositivos. Lo que cambia es cuántas se ven sin desplazar.
- Referencia: el atuendo legendario cuesta 9.000.

### Casillas por página
120 por página, es decir 8 columnas × 15 filas.
- **Escritorio (1920 × 1080):** caben las 15 filas, sin hueco y sin desplazar, con la casilla de 52 px.
- **Tableta (1180 × 820):** 5 columnas × 24 filas, con unas 10 visibles; el resto se desplaza.
- **Móvil en horizontal:** 6 columnas × 20 filas, con unas 3 visibles. Casilla de 44 px.

## 4. Maquetas
- Están en `mockups/personajes-copia/`:
  - `index.html`: índice con las 27 capturas.
  - `maqueta.html`: la maqueta viva. Se ve con `npx vite --port 5173`, abriendo http://localhost:5173/mockups/personajes-copia/maqueta.html?v=menu
- **Vistas:**
  - `menu`: menú principal.
  - `menu-nuevo`: menú la primera vez, sin partida.
  - `seleccion`: elegir personaje.
  - `borrar`: borrar un personaje.
  - `cambiar`: cambiar de personaje desde el lobby.
  - `almacen`: almacén por páginas.
  - `comprar`: comprar una página.
  - `copia`: copia de seguridad.
  - `importar`: confirmación al importar.

## 5. Preguntas
Están en el mensaje de entrega.

## 6. Fases
1. **Datos y migración**
   - `SaveData` v3, migración desde v1 y v2 con devolución del oro.
   - Persistencia nueva con la clave `save-undo`.
   - Tests de migración. Sin cambios visibles.
2. **Varios personajes**
   - Pantalla «Elegir personaje» con 4 huecos, crear en un hueco vacío y borrar escribiendo el nombre.
   - Cambio de personaje desde el nombre en el lobby.
   - Tutorial solo con el primer personaje; los siguientes pueden repetirlo desde Ajustes.
   - El atuendo comprado pasa a ser de la cuenta.
3. **Almacén por páginas**
   - Pestañas 1–5 y «Compartido», con compra y confirmación.
   - Mover objetos arrastrando a la pestaña o tocando el objeto y luego la pestaña.
   - «Ordenar» solo ordena la página que se ve.
   - 120 casillas por página.
4. **Copia de seguridad**
   - Exportar e importar archivo; copiar y pegar código.
   - Firma, resumen antes de cargar, copia automática y «Deshacer la última importación».
   - Recordatorio de la última copia: más de 7 días o 10 expediciones.
   - `navigator.storage.persist()` y aviso para Safari en iOS.
5. **Menú principal y textos**
   - Menú nuevo, «Tengo una copia» la primera vez y el texto nuevo del pie.
   - Ajustes sin «Borrar personaje», que pasa a la selección.
6. **Landing y textos legales**
   - Privacidad y cookies: exportar a archivo o código bajo control del jugador, sin servidor.
   - Mención de la copia en la landing donde se diga que se guarda en el navegador.
   - Hoja de ruta.

Cada fase termina con `tsc`, `vitest`, `e2e`, `menus-check`, `mobile-check` (también en tableta) y `touch-check`, el mensaje de commit y una entrada en `docs/estado-trabajo.md`.
