# Traspaso · Fase 10 (landing) · 3/11/2026, tarde

Para seguir en casa. Léelo junto con docs/estado-trabajo.md, docs/pendiente-landing.md (el encargo completo) y CLAUDE.md.

## Estado general
- Fases 1–9 y Atuendos (skins): HECHAS y con commit del usuario. Los archivos borrados a mano ya no están.
- Claude NO hace commits ni push (los hace el usuario con GitHub Desktop).
- Fase 10: EMPEZADA. Solo análisis y un borrador de maqueta. NO se ha tocado la landing real (src/landing).
  El encargo pide una primera respuesta con propuesta y esperar aprobación antes de aplicar nada.

## Paso 1 · Qué hay de verdad en el juego (comprobado en el código)
- Clases jugables: Guerrero y Mago. Pícaro y Clérigo: solo en datos, «Próximamente».
- Zonas: La Mazmorra (nv 1–30), La Cripta (30–60), El Infierno (60–100). Se desbloquean por nivel y venciendo al jefe anterior.
- Criaturas: 21 en total = 15 normales + 3 élites (Capitán de bandidos, Caballero del sepulcro, Carcelero de cadenas)
  + 3 jefes (Señor del Osario, La Reina Velada, Belzar, Señor de las Cadenas).
- Objetos: 32 armas y 77 piezas equipables contando las forjadas. La landing actual dice «23 armas y 66 piezas»:
  hay que actualizar la cifra o no darla. Habilidades: SKILLS tiene 52 entradas (incluye las de enemigos); la landing dice 22
  del jugador: revisar antes de dar una cifra.
- Mercaderes (4): Orvel el Quincallero (comerciante), Hermana Vesper (relicaria, llaves), Garra Roja (mercenarios,
  9 contratables y prisioneros rescatables), Maese Brand (forja y picos). Misiones y reputación por rango.
- Cofres con llave por zona, minería (cobre, hierro, plata, obsidiana, azufre), Alijo (equipo, mochila, bolsillo seguro,
  almacén ampliable), Bestiario, rival Kael el Errante (alianza o traición).
- Tienda de atuendos con oro: 3 trajes, solo estéticos, para todas las clases, se ven en la mazmorra, no se pierden al morir.
  Arte de los atuendos aún provisional.
- Menús nuevos (Jugar, Personaje, Alijo, Mercaderes, Misiones, Bestiario, Tienda). Móvil horizontal a pantalla completa
  y app instalable. Tableta.
- Toda la columna «Ya en el juego» propuesta por el usuario es cierta.
- Diferencia: «Cofres con llave y botín que cambia el aspecto» → sí existe (gearLook).

## Lore encontrado en el repositorio
- Bastión de Ceniza: el refugio (lobby). «Hierro remachado con el emblema de una orden caída». El intendente da equipo de recluta.
- Las Criptas de Umbravel bajo el Bastión. El Señor del Osario «fue el último prior de Umbravel; se coronó con los huesos de sus monjes».
- Cripta: «Necrópolis de sarcófagos y velas frías. Los muertos aquí no descansan». Nombres: La Necrópolis Velada,
  Los Panteones de Umbravel, La Cripta de los Abades. La Reina Velada: «Nadie ha visto su rostro. Su lamento congela».
- Infierno: «Obsidiana, lava y cadenas. Lo que vive aquí nunca fue humano». Belzar, Señor de las Cadenas.
- Mazmorra: «Galerías de piedra y cavernas húmedas. Bandidos, bestias y los primeros muertos inquietos».
- Otros nombres: El Osario de Velmor, Puerta de Ceniza, Sala del Umbral, Corazón de Umbravel.
- VarkHollow solo aparece en los atuendos: «monjes que velan las criptas de VarkHollow», «la Guardia de VarkHollow…
  desde que cayó el Bastión», «el último señor de VarkHollow». OJO: «desde que cayó el Bastión» choca un poco con que el
  Bastión siga siendo el refugio: proponer cambiarlo por «desde que cayó la orden».
- Encaje propuesto: VarkHollow es la región; el Bastión de Ceniza es su último refugio; bajo él, las criptas de Umbravel
  y, más abajo, el Infierno.

## Textos de VarkHollow (borradores, faltan 2 versiones alternativas)
- Título: «Esto es VarkHollow» (alternativas: «Bienvenido a VarkHollow», «Bajo VarkHollow»).
- Versión usada en la maqueta: «Una tierra maldita donde el Bastión de Ceniza aún resiste. Bajo sus muros se abren las
  criptas de Umbravel, y bajo las criptas, algo peor. Los saqueadores bajan por el oro; la regla es la de siempre: baja,
  saquea y vuelve. Quien cae ahí abajo, ahí se queda.»
- Pendiente escribir: una versión más narrativa y misteriosa y otra más directa y de acción.
- Profundidades (con su jefe como imagen pixel art del juego):
  - La Mazmorra · Nv 1–30: «Galerías de piedra bajo el Bastión. Bandidos, bestias y los primeros muertos que no se quedan quietos.»
  - La Cripta · Nv 30–60: «La necrópolis de Umbravel. Velas frías, sarcófagos abiertos y una reina que canta para los que no descansan.»
  - El Infierno · Nv 60–100: «Obsidiana, lava y cadenas. Lo que vive aquí abajo nunca fue humano.»
- Nota Steam: «En Steam se llamará Crypt Raiders: VarkHollow.»
- Colocación propuesta: justo después de la cabecera y antes del Tráiler (el mundo antes que las funciones).

## Hoja de ruta (borrador hecho)
- Título propuesto: «El camino hacia las profundidades».
- Datos en un archivo aparte, `src/landing/roadmap.ts` (ROADMAP y ROADMAP_NOTE): se mueven puntos sin tocar el diseño.
- Columnas: Ya en el juego (verde, «Disponible ahora», marcador «Estás aquí») · Próximamente (dorado,
  «En desarrollo · un jugador») · Multijugador (violeta, «El gran objetivo · más adelante»). Línea que une las tres;
  en móvil, vertical.
- Nota: «La hoja de ruta puede cambiar y no tiene fechas cerradas. Lo que está en la primera columna, ya lo puedes jugar.»

## «Juega gratis ahora»
- Se quitan «Ya disponible» y «En camino». Propuesta: a la derecha, la captura del juego en el móvil dentro de un marco de
  teléfono, con «Así se ve en el móvil.». El texto menciona pantalla completa.

## Capturas
- Borrador con las de scripts/menus-check.cjs (escritorio-jugar, -alijo, -mercaderes, -tienda, movil-jugar) más las
  antiguas combat.png e infierno.jpg.
- Pendiente tras aprobar: script de capturas nuevo con una partida avanzada (nivel alto, buen equipo, Cripta o Infierno)
  a 1920×1080 y 844×390; WebP + PNG de respaldo; escala entera; loading="lazy" salvo la primera.
- Falta og:image en index.html (no hay imagen para compartir) y twitter:card. Usar una captura nueva.
- La landing no tiene enlaces a redes: preguntar por @CryptRaiders.

## Dónde está el borrador
- ACTUALIZADO 3/11 noche: el borrador rehecho está en el repositorio, en mockups/landing/borrador (no se pierde).
  Las capturas van en carrusel. El texto de abajo describe la primera versión (perdida).
- Se hizo en una copia de nube (/home/claude/mock) que NO está en el PC: se pierde al cerrar la sesión.
  Cambios del borrador: src/landing/roadmap.ts (nuevo), src/landing/App.tsx (sección VarkHollow, Demo con captura del
  móvil, Hoja de ruta, galería con capturas nuevas, menú con «VarkHollow» y «Hoja de ruta») y estilos al final de
  src/landing/landing.css (.depths, .depth-*, .phone-frame, .roadmap, .rm-*).
  En casa es más rápido rehacerlo a partir de este resumen.

## Siguiente paso (primera respuesta al usuario, sin aplicar nada)
1. Lista de funciones reales (arriba) y diferencias.
2. Lore encontrado (arriba).
3. 2–3 versiones del texto de VarkHollow + textos de las profundidades.
4. Textos finales de la hoja de ruta y de las partes que cambian.
5. Maquetas en mockups/landing: 1920×1080, 1180×820 y 390×844 vertical (página completa), y cómo abrirlas.
6. Lista de assets para el usuario (diseñador): ilustración o mapa de VarkHollow (p. ej. 1920×800 y versión móvil 780×900),
   3 fondos de profundidad (720×440, pixel art a escala entera), 3 iconos de la hoja de ruta (16×16 o 24×24, se
   muestran ×3), imagen para compartir 1200×630, marco de teléfono opcional.
7. Preguntas: versión de texto elegida; título de la hoja de ruta; ¿hay redes (@CryptRaiders) y enlaces?; ¿cifras
   concretas (armas, criaturas) o textos sin números?; ¿cambiar «desde que cayó el Bastión» en el Guardián Hueco?
Después de aprobar: aplicar, capturas finales en los tres tamaños, cómo probar en local, actualizar estado-trabajo.md
y dar el texto del commit (p. ej. «Fase 10: landing con VarkHollow, capturas nuevas y hoja de ruta»).
