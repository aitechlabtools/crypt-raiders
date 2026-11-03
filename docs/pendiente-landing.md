# Encargo pendiente para la Fase 10 (cierre): landing, VarkHollow y hoja de ruta

Guardado tal cual el 3/11/2026. Se hará al terminar las skins, como Fase 10. Primero: respuesta con análisis, textos, maquetas (mockups/landing) y preguntas; esperar aprobación.

---

Eres un desarrollador web senior y redactor de marketing de videojuegos, trabajando en la landing de Crypt Raiders (antes llamado DREADBOUND), mi proyecto personal. Lee este prompt entero antes de hacer nada.

CONTEXTO DEL PROYECTO

Crypt Raiders es un RPG de extracción de fantasía oscura, en 2D isométrico y por turnos, con gráficos pixel art, ambientado en VarkHollow, la región donde ocurre todo el juego. De momento es para un solo jugador y se juega gratis como demo web en el navegador, en ordenador y en móvil en horizontal. En el futuro saldrá en Steam como "Crypt Raiders: VarkHollow". El repositorio es aitechlabtools/crypt-raiders y la copia local está en Documents\GitHub\crypt-raiders. El dominio es cryptraiders.es.

Antes de empezar, lee docs/estado-trabajo.md, docs/guia-interfaz.md y CLAUDE.md si existen, y localiza en el repositorio los archivos de la landing (página de presentación del juego, distinta de la pantalla del propio juego).

Ahora mismo la landing tiene una sección "Juega gratis ahora" con el botón "Jugar la demo gratis" y, a su derecha, dos listas: "Ya disponible" (una lista larga de funciones) y "En camino" (multijugador, tienda de aspectos, Pícaro y Clérigo, arte y música definitivos, versión para Windows).

OBJETIVO

1. Actualizar la landing con capturas nuevas del juego y con las mecánicas que se han añadido.
2. Añadir una sección que presente VarkHollow, el mundo y la atmósfera del juego.
3. Quitar las listas "Ya disponible" y "En camino" de la sección "Juega gratis ahora" y sustituirlas por una hoja de ruta (roadmap) en tres columnas al final de la página.

PASO 1: COMPROBAR QUÉ HAY DE VERDAD EN EL JUEGO

Antes de escribir textos, revisa el código y docs/estado-trabajo.md y hazme una lista de qué funciones están realmente implementadas y jugables ahora mismo. La landing solo puede anunciar como disponible lo que funcione de verdad. Comprueba en particular: clases jugables, las tres zonas (Mazmorra, Cripta, Infierno) y el nivel máximo, número de enemigos, élites y jefes, habilidades y armas, mercaderes con misiones y reputación, forja y mercenarios dentro de los mercaderes, cofres y llaves, alijo y bolsillo seguro, la nueva Tienda de skins que se compran con oro del juego (la pestaña Vestuario ya no existe), la nueva estructura de menús, y el soporte para móvil con pantalla completa.

Busca también en el repositorio cualquier texto de lore o ambientación que ya exista (descripciones de zonas, nombres de mercaderes, textos de enemigos, documentos de diseño) para que la sección de VarkHollow sea coherente con lo que hay en el juego.

Si algo de lo que propongo abajo como "disponible" no está implementado, muévelo a la columna de "Próximamente" y avísame.

PASO 2: CAPTURAS NUEVAS

1. Haz capturas nuevas del juego con un navegador sin interfaz (Playwright o Puppeteer), usando una partida de prueba con equipo y progreso suficiente para que se vea bien.
2. Capturas mínimas: lobby (pestaña Jugar), combate dentro de una mazmorra, una zona más profunda (Cripta o Infierno), pantalla Alijo con equipo e inventario, Mercaderes, Tienda con las skins, y una captura del juego en móvil horizontal para demostrar que se puede jugar en el móvil.
3. Tamaños: escritorio a 1920 por 1080 y móvil horizontal a 844 por 390.
4. Optimiza las imágenes para web (formato WebP con alternativa PNG o JPG, tamaños adaptados, carga diferida con loading="lazy" salvo la primera) sin que el pixel art se vea borroso: escala a múltiplos enteros e image-rendering: pixelated donde haga falta.
5. Sustituye las capturas antiguas de la landing por las nuevas, con textos alternativos (alt) descriptivos en español.

PASO 3: ACTUALIZAR TEXTOS Y MECÁNICAS

1. Revisa todos los textos de la landing y actualízalos con las mecánicas nuevas: nueva estructura de menús, mercaderes con forja y mercenarios, Tienda de skins con oro (trajes completos solo estéticos, para todas las clases, que se ven también en las mazmorras y son tuyos para siempre), juego en móvil con pantalla completa.
2. Asegúrate de que el nombre en toda la landing es Crypt Raiders y no queda ninguna mención a DREADBOUND (título de la página, metaetiquetas, textos, alt de imágenes, Open Graph para redes sociales).
3. Tono: fantasía oscura, directo y breve, en español. Textos cortos que se lean bien en móvil.
4. Revisa también las metaetiquetas de SEO y Open Graph (título, descripción, imagen para compartir en redes) y usa una de las capturas nuevas como imagen para compartir.

PASO 4: SECCIÓN NUEVA SOBRE VARKHOLLOW

Crea una sección que explique qué es VarkHollow: la región, el mundo y la atmósfera donde ocurre todo el juego. Su función es que el visitante entienda en pocos segundos dónde está y qué se va a encontrar, y que le den ganas de bajar a las criptas.

1. Colocación: en la parte alta de la landing, justo después de la cabecera principal o antes de la explicación de las mecánicas, para que el mundo se presente antes que las funciones. Propón el mejor sitio según la estructura actual.
2. Contenido: un título corto (por ejemplo "Bienvenido a VarkHollow" o "Esto es VarkHollow", propón otros), un párrafo breve de ambientación de entre 2 y 4 frases, y debajo tres bloques pequeños que presenten las tres profundidades del mundo como capas de la misma región: la Mazmorra, la Cripta y el Infierno, cada uno con una frase de ambientación y su rango de nivel.
3. Ideas de ambientación para inspirarte (ajústalas a lo que encuentres en el repositorio y no contradigas el lore existente): VarkHollow es una región maldita de fantasía oscura donde bajo la tierra se esconden criptas cada vez más profundas; los saqueadores descienden en busca de botín sabiendo que cuanto más bajan, más oscuro y peligroso se vuelve todo, hasta llegar al Infierno; la regla del mundo es bajar, saquear y volver con vida, porque quien muere ahí abajo lo pierde todo. Usa esto solo como punto de partida.
4. Escribe 2 o 3 versiones del texto de ambientación para que yo elija, con distinto tono (por ejemplo, una más narrativa y misteriosa, otra más directa y de acción).
5. Visual: usa capturas o fondos pixel art del juego que transmitan la atmósfera de cada profundidad. Si hace falta arte que no existe (por ejemplo una ilustración de VarkHollow o un mapa de la región), usa un marcador de posición y apúntalo en la lista de assets que diseñaré yo (soy diseñador gráfico).
6. Explica en una frase discreta que "Crypt Raiders: VarkHollow" será el nombre de la versión de Steam, para que el visitante relacione ambos nombres.
7. En móvil, los tres bloques de profundidades van uno debajo de otro, y el texto de ambientación debe leerse sin esfuerzo.

PASO 5: QUITAR LAS LISTAS DE LA SECCIÓN "JUEGA GRATIS AHORA"

En la sección "Juega gratis ahora", elimina las dos columnas "Ya disponible" y "En camino". La sección queda con el título, el texto, el botón "Jugar la demo gratis" y la nota sobre ordenador y móvil. Reajusta la distribución para que no quede un hueco vacío (por ejemplo, centrando el bloque o poniendo al lado una captura del juego). Propón la opción que mejor quede.

PASO 6: HOJA DE RUTA AL FINAL DE LA LANDING

Crea una sección nueva al final de la página, antes del pie, titulada "Hoja de ruta" (o propón un título mejor con tono de fantasía oscura, por ejemplo "El camino hacia las profundidades"). Tiene tres columnas, cada una con un título, un pequeño subtítulo de estado y una lista breve de puntos. Solo lo más importante: entre 5 y 7 puntos por columna, cada punto en una sola línea corta.

Columna 1: "Ya en el juego" (estado: disponible ahora). Resumen de lo más importante, no la lista entera. Propuesta (ajústala a lo que compruebes en el paso 1):
- Guerrero y Mago
- Tres zonas cada vez más hondas: Mazmorra, Cripta e Infierno, hasta el nivel 100
- Combate por turnos con habilidades según tu arma
- Mercaderes con misiones, reputación, forja y mercenarios
- Cofres con llave y botín que cambia el aspecto de tu personaje
- Tienda de trajes con oro del juego
- Jugable en ordenador y en móvil

Columna 2: "Próximamente" (estado: en desarrollo, contenido para un jugador y lanzamiento). Propuesta:
- Dos nuevas clases: Pícaro y Clérigo
- Nuevas armas y piezas de equipo, con sus propias habilidades
- Nuevos mapas y salas en cada zona, y nuevas criaturas y jefes
- Más trajes en la Tienda, siempre solo estéticos y sin ventajas
- Arte y música definitivos
- Guardado en la nube para jugar desde varios dispositivos
- Versión para Windows en Steam: Crypt Raiders: VarkHollow

Columna 3: "Multijugador" (estado: el gran objetivo, más adelante). Propuesta:
- Cooperativo PvE: baja a las criptas en grupo con otros jugadores
- Extracción PvPvE: otros grupos de saqueadores en la misma cripta
- Duelos y arena PvP
- Comercio entre jugadores
- Hermandades para jugar con tus aliados
- Clasificaciones por temporada

Requisitos de la hoja de ruta:
1. Cada columna con un color de estado distinto dentro de la paleta de la landing (por ejemplo, verde para disponible como el "Ya disponible" actual, dorado o ámbar para próximamente, y púrpura o rojo oscuro para multijugador), y un pequeño icono o marcador pixel art por columna. Si hace falta un icono que no existe, usa un marcador de posición y apúntalo en la lista de assets que diseñaré yo.
2. Una conexión visual entre columnas que dé sensación de recorrido (por ejemplo una línea o camino que avanza de izquierda a derecha y en la columna actual un indicador de "estás aquí").
3. Una nota breve al pie de la sección indicando que la hoja de ruta puede cambiar y que no hay fechas cerradas.
4. Opcional: un botón o enlace al final para seguir el desarrollo en redes (@CryptRaiders), si la landing ya tiene enlaces a redes.
5. En escritorio, tres columnas lado a lado. En tableta, tres columnas más estrechas o dos más una. En móvil, una columna debajo de otra en orden (Ya en el juego, Próximamente, Multijugador), con la conexión visual adaptada en vertical. Nada debe desbordarse ni requerir scroll horizontal.
6. Los textos de la hoja de ruta deben estar en un archivo de datos o en un bloque fácil de editar, para que yo pueda mover puntos de una columna a otra sin tocar el diseño.

RESTRICCIONES

1. Mantén el estilo visual actual de la landing (colores, tipografías, fondo oscuro, botón dorado). Solo cambias contenido y capturas, y añades las secciones de VarkHollow y de hoja de ruta con el mismo estilo.
2. La landing debe verse perfecta en escritorio, tableta y móvil.
3. No anuncies como disponible nada que no funcione en el juego.
4. Para los trajes y futuros micropagos, deja siempre claro que son solo estéticos y no dan ventajas.
5. No inventes lore que contradiga lo que ya existe en el juego.
6. No hagas commits ni push: los hago yo con GitHub Desktop.

FORMATO DE RESPUESTA QUE ESPERO

Primera respuesta, sin tocar todavía la landing:
1. Lista de funciones realmente implementadas (paso 1) y cualquier diferencia con lo que propongo en la columna "Ya en el juego".
2. Lore o ambientación que hayas encontrado en el repositorio.
3. Las 2 o 3 versiones del texto de VarkHollow y los textos de las tres profundidades.
4. Textos finales propuestos para las tres columnas de la hoja de ruta y para las partes de la landing que cambien.
5. Capturas de maqueta de la landing actualizada, con la sección de VarkHollow, la sección "Juega gratis ahora" reajustada y la nueva hoja de ruta, en escritorio (1920 por 1080), tableta (1180 por 820) y móvil vertical (390 por 844), guardadas en una carpeta de maquetas aparte (por ejemplo mockups/landing) y cómo abrirlas.
6. Lista de assets gráficos que tendré que diseñar, con medidas recomendadas.
7. Preguntas que necesites que te responda.

Espera mi aprobación antes de aplicar los cambios. Después, aplica los cambios, haz capturas finales en los tres tamaños para comprobarlo, dime cómo probarlo en local y actualiza docs/estado-trabajo.md.