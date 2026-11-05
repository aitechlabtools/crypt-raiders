# Plan · Oro físico

Análisis del 5/11/2026, todavía sin aprobar. Las maquetas están en `mockups/oro-fisico/index.html`.

## 1. Cómo funciona hoy
- El oro es un número de cada personaje (`profile.gold`) y no ocupa sitio. En la expedición se acumula en `goldFound` y se suma al extraer. Si mueres, se pierde.
- **Fuentes de oro:**
  - Enemigos: su tabla de botín (`loot.gold`).
  - Cofres: la tabla de cada cofre, con más oro en las salas hondas (`CHEST_BY_POSITION`).
  - Encargos (`reward.gold`), ventas (valor del objeto × 0,4) y el reparto con Kael.
- **Gastos:**
  - Pociones y equipo de los mercaderes.
  - Forja: 120–2.200.
  - Mercenarios: 60–480.
  - Atuendos: 1.500 / 4.000 / 9.000.
  - Páginas del almacén: 2.500–25.000 y 15.000 la compartida.
- **El inventario solo admite objetos de una casilla.** Cada contenedor es una lista de casillas (mochila 6 × 4, bolsillo 3, almacén 120 por página).
  - Un objeto de 2×2 obliga a cambiar la colocación, el arrastre, «Ordenar», el botín automático, la venta y el pintado: ocupa 4 casillas que deben estar libres y en bloque.
  - **Hay además un problema mayor:** el almacén se pinta con 8 columnas en escritorio, 5 en tableta y 6 en móvil. Un saco de 2×2 necesita que las columnas sean siempre las mismas. Propuesta: **8 columnas en todos los formatos**, reajustando las columnas del Alijo en tableta y móvil. Cabe; está comprobado en la maqueta.
  - Es factible y es la fase O1.

## 2. Monedas y contenedores (propuesta final)
| Objeto | Casillas | Capacidad | Monedas por casilla | Precio | ¿Bolsillo seguro? |
|---|---|---|---|---|---|
| Monedas de oro (sueltas) | 1 | 10 | 10 | — | Sí |
| Saquito de oro | 1 | 50 | 50 | 5 | Sí |
| Saco de oro | 4 (2×2) | 250 | 62,5 | 25 | No |

- Cada contenedor es más eficiente por casilla que el anterior: 10, luego 50, luego 62,5.
- El saco grande compensa sobre todo en el almacén. El saquito es el que cabe en el bolsillo seguro.
- **Iconos:** las monedas cambian según el montón: 1–3 (pocas), 4–7 (montoncito), 8–10 (montón). El saquito y el saco llevan su propio icono.
- **Número en la casilla:** «7» en las monedas, «37/50» o «180/250» en los sacos.
- **Lo vende El Coleccionista**, un mercader nuevo: un duende prestamista del Bastión. Vende sacos y mochilas y compra joyas a mejor precio que los demás.
- **Mochilas mejores que se compran,** de forma permanente para cada personaje:
  - Inicial: 24 casillas.
  - Reforzada: 30 (6×5), precio 150.
  - De explorador: 36 (6×6), precio 600; requiere la reforzada.
- **Ojo con dos nombres:**
  - Ya existe la «Moneda antigua» (material de los encargos): se queda como está. La nueva es «Monedas de oro».
  - Ya existe el encargo «Coleccionista» de Orvel: propongo renombrarlo «Numismático» para no confundirlo con el mercader.

## 3. Economía: oro de una expedición completa (simulación, 60 mapas por subzona)
Cálculos con las tablas reales del juego: todos los enemigos y todos los cofres de cada mapa.

| Subzona | Oro ahora | ÷10 (monedas) | Casillas sueltas (10) | Con saquitos (50) | Ventas de objetos (÷10) |
|---|---|---|---|---|---|
| Afueras del Bastión | 310 | 31 | 4 | 1 | 70 |
| El Bastión en ruinas | 342 | 34 | 4 | 1 | 84 |
| Las mazmorras del Bastión | 373 | 37 | 4 | 1 | 126 |
| El Osario | 758 | 76 | 8 | 2 | 237 |
| Las Catacumbas | 830 | 83 | 9 | 2 | 266 |
| El Panteón | 942 | 94 | 10 | 2 | 386 |
| La Cripta Carmesí | 1.498 | 150 | 15 | 3 | 574 |
| Las Puertas del Abismo | 1.714 | 171 | 18 | 4 | 645 |
| Los Ríos de Fuego | 1.885 | 189 | 19 | 4 | 910 |
| El Trono de las Cadenas | 2.100 | 210 | 21 | 5 (o 1 saco) | 1.022 |

- **Al principio,** el oro ocupa 4 casillas de las 24: se nota, pero no molesta.
- **En el Infierno,** las monedas sueltas llenarían casi toda la mochila (15–21 casillas). Ahí entra la decisión interesante: bajar con saquitos vacíos (que también ocupan casilla) o con un saco grande, o mejorar la mochila.
- **Bolsillo seguro:** como mucho 150 monedas, que es una expedición entera al principio y menos de una en el Infierno. Es justo la red de seguridad que va perdiendo peso.

### Reescalado (todo ÷10, con redondeo justo)
| Concepto | Ahora | Propuesta |
|---|---|---|
| Oro de un enemigo común (Afueras) | 3–12 | 0–1 |
| Cofre común / rico / del jefe | 8–25 / 20–45 / 60–120 | 1–3 / 2–5 / 6–12 |
| Oro inicial | 60 | 6 |
| Venta de objetos | valor × 0,4 | igual ÷10, mínimo 1 |
| Poción de vida (compra) | ~40 | ~4 |
| Mercenarios | 60–480 | 6–48 |
| Forja | 120–2.200 | 12–220 |
| Atuendos | 1.500 / 4.000 / 9.000 | 150 / 400 / 900 |
| Páginas del almacén 2–5 | 2.500 / 6.000 / 12.000 / 25.000 | 250 / 600 / 1.200 / 2.500 |
| Página «Compartido» | 15.000 | 1.500 |
| Recompensas de encargos | 30–600 | 3–60 |

- **Redondeo justo:** las cantidades que quedan con decimales se redondean al azar con la misma media. Así, en conjunto, se gana lo mismo que ahora.
- Todos los valores siguen en archivos de datos editables.

## 4. ¿Se paga con el oro de la página compartida?
**No: solo con el de las páginas propias del personaje**, tal como prefieres. Así la compartida es un traspaso deliberado. Si quieres gastar ese oro, primero lo mueves a una página tuya.

**Cómo se paga:**
1. Primero con monedas sueltas, de la página 1 a la 5.
2. Después con saquitos.
3. Por último con sacos grandes.
4. El cambio vuelve a los sacos que tienen hueco y, si no caben, como monedas sueltas.

**La barra superior** muestra el oro de las páginas propias. La mochila muestra aparte «Oro encima».

## 5. Migración
1. Cada personaje: su oro ÷10 (redondeando hacia arriba, para que nadie pierda) se convierte en sacos de regalo.
   - Primero sacos grandes llenos, luego saquitos y el resto en monedas sueltas, todo en sus páginas propias.
   - Ejemplo: 12.480 de oro pasan a 1.248 monedas, que son 4 sacos grandes, 4 saquitos llenos y 4 monedas sueltas, en 21 casillas.
2. El resto de la economía (precios, objetos) se reescala a la vez.
3. **Si no cabe en sus páginas,** se le regalan las páginas necesarias. Con 120 casillas por página haría falta muchísimo oro para no caber.
4. El oro que se llevaba en una expedición interrumpida ya se anula sin pérdidas, como ahora.
5. Las copias de seguridad antiguas pasan por la misma migración al importarlas.
6. Se avisa una vez: «El oro ahora pesa: tus N monedas están en sacos en tu almacén».

## 6. Cambios en la expedición
- **Al ganar un combate,** todo lo que suelta el enemigo cae en un **saco en el suelo**: objetos y monedas. La experiencia sigue llegando directa.
  - El saco tiene «Cogerlo todo», «Coger el oro» y «Cerrar».
  - Lo que no cojas se queda en el suelo hasta que acabe la expedición.
- **Al coger monedas,** van primero a los saquitos y sacos con hueco de la mochila y después sueltas, de 10 en 10.
- **El oro de la mochila se pierde al morir.** El del bolsillo seguro, no.
- **Kael y el reparto:** se repartirán monedas de verdad de tu mochila, en lugar de un número. Habrá que revisar `goldShare`.
- **Encargos de «extraer botín por valor de X»:** el oro extraído cuenta igual que ahora, en la escala nueva.

## 7. Preguntas
1. **¿Las mochilas mejores son para siempre** (lo propuesto) **o se pierden al morir** como el equipo?
2. **¿El Coleccionista compra solo joyas** (anillos, amuletos, gemas, cálices) **o también tesoros?**
3. **¿Te vale renombrar el encargo «Coleccionista» de Orvel** a «Numismático»?
4. **Al recoger monedas con la mochila llena,** ¿se quedan en el saco del suelo? Propongo que sí, con el aviso «Tu mochila está llena».

## 8. Fases
- **O1 · Objetos de varias casillas.**
  - Saco de 2×2 en mochila y almacén, con colocación, arrastre, ordenar y pintado.
  - Almacén a 8 columnas en todos los formatos.
  - Tests de colocación.
- **O2 · Monedas y sacos.**
  - Objetos nuevos, apilado de 10 en 10 y número en la casilla.
  - Meter monedas soltándolas o tocándolas sobre el saco.
  - Sacar, con un selector −10 / −1 / +1 / +10, barra y botones «10 · 25 · 50 · Todo».
  - Dividir y juntar montones.
  - «Agrupar oro» en la mochila y en el almacén.
- **O3 · Economía.**
  - Reescalado ÷10 con redondeo justo.
  - Pago automático solo desde las páginas propias, con cambio.
  - «Oro insuficiente».
  - Ventas que entran en los sacos; con el almacén lleno, aviso con «Agrupar oro y vender».
  - Oro del almacén en la barra superior y «Oro encima» en la mochila.
- **O4 · Expediciones.**
  - Saco de botín en el suelo.
  - Monedas físicas de enemigos, cofres y suelo.
  - Pérdida al morir.
  - Bolsillo seguro con «Oro a salvo», hasta 150.
  - Reparto con Kael.
- **O5 · El Coleccionista y las mochilas** (24, 30 y 36).
- **O6 · Migración** del oro de cada personaje y de las copias antiguas.
- **O7 · Tutorial, landing y lista de assets.**
  - Tutorial: recoger el oro del saco, ver que ocupa sitio, guardar un saquito en el bolsillo y extraerlo.
  - Landing: «El oro pesa: si lo llevas encima, lo arriesgas.»
  - Iconos y el sprite del duende, en la lista de assets.
  - Después, la fase 6 pendiente: landing y textos legales de todo.
