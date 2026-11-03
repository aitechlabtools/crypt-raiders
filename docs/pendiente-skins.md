# Pendiente: skins de traje completo (sustituyen al Vestuario)

Encargo del usuario (3/11/2026). Guardado tal cual; el texto original llegó CORTADO a partir de «4. Sistema de capas del»: pedir el resto al usuario antes de empezar.

Cuándo hacerlo: justo después de la Fase 8 (Personaje), EN LUGAR de rediseñar Vestuario y Tienda en la Fase 9.
Así no se rehace el Vestuario para borrarlo después. La Fase 9 queda en Mercaderes, Misiones y Bestiario; la Tienda
se rehace con las skins. Antes de implementar: plan + capturas para el usuario (lo pide el propio encargo).

Notas para entonces: ya existe una ranura cosmética por pieza (profile.wardrobe, core/cosmetics.ts, dressed());
habrá que migrar las partidas con aspectos de piezas sueltas (algunos se ganan con misiones: QUEST_COSMETICS),
y la regla «nada de pagos ni servicios externos» sigue vigente: la Tienda solo con oro del juego.

---

Eres un desarrollador senior de juegos web trabajando en Crypt Raiders (antes llamado DREADBOUND), mi proyecto personal. Lee este prompt entero, revisa el código y preséntame un plan y unas capturas de cómo quedaría antes de implementar nada.

CONTEXTO DEL PROYECTO

Crypt Raiders es un RPG de extracción de fantasía oscura, en 2D isométrico y por turnos, con gráficos pixel art. De momento es para un solo jugador. Es una demo web y en el futuro tendrá versión para Windows. El repositorio es aitechlabtools/crypt-raiders y la copia local está en Documents\GitHub\crypt-raiders. El juego debe funcionar igual de bien en escritorio, tableta y móvil (en móvil, en horizontal y con pantalla completa).

Antes de empezar, lee docs/estado-trabajo.md, docs/guia-interfaz.md y CLAUDE.md si existen, y sigue la estructura de interfaz que ya está fijada en ellos (barra de pestañas superior y paneles en columnas).

La pantalla Alijo tiene ahora tres paneles: Aventurero (retrato y estadísticas) a la izquierda, Equipo en el centro (ranuras de Arma, Cabeza, Secundaria, Manos, Torso, Amuleto, Pies, Anillo, y debajo la Mochila y el Bolsillo seguro) y Almacén a la derecha. En la barra superior están las pestañas Jugar, Personaje, Alijo, Mercaderes, Misiones, Bestiario, Vestuario y Tienda.

OBJETIVO

Sustituir el sistema actual de Vestuario por un sistema de skins de traje completo: una ranura nueva en el equipo donde se equipa una skin que cambia el aspecto de todo el personaje, y una Tienda donde se compran las skins con oro del juego. En el futuro la Tienda tendrá micropagos con dinero real, así que debe quedar preparada para ello, pero ahora no se implementa ningún pago real.

CAMBIOS QUE QUIERO

1. Eliminar la pestaña Vestuario
- Quita la pestaña Vestuario de la barra de navegación en escritorio, tableta y móvil.
- Revisa qué código, datos y pantallas existen del Vestuario actual. Lo que sea reutilizable para el nuevo sistema de skins, reutilízalo; lo que no, elimínalo limpiamente sin dejar referencias rotas.
- Si hay partidas guardadas con datos del Vestuario antiguo, haz que se carguen sin errores (migración o descarte seguro) y explícame qué has hecho.

2. Nueva ranura de Skin en el panel Equipo
- Añade una ranura nueva llamada "Skin" (o propón un nombre mejor en español con tono de fantasía oscura, como "Atuendo") en el panel Equipo de la pantalla Alijo.
- Colócala en el hueco libre que hay debajo de la ranura Manos, en la columna izquierda de las ranuras de equipo, con el mismo tamaño y estilo que las demás ranuras pequeñas, pero con un borde o icono que la distinga como ranura cosmética.
- La ranura no admite objetos normales de la mochila ni del almacén, solo skins.
- Al tocar o hacer clic en la ranura se abre un selector con las skins que tiene el jugador, más una opción "Sin skin" para quitarla. En el selector se ve una vista previa de cada skin. Debe funcionar con toque en móvil y tableta y con ratón en escritorio.
- El retrato del panel Aventurero se actualiza al momento al equipar o quitar una skin.

3. Cómo funciona una skin
- Una skin es un traje completo: sustituye el aspecto de todo el cuerpo del personaje (cabeza, torso, manos y pies) de una sola vez. No hay piezas sueltas.
- Es solo visual. No da ni quita estadísticas. Las piezas de armadura equipadas siguen dando sus valores aunque no se vean mientras la skin está puesta. Al quitar la skin vuelve a verse la armadura real.
- El arma y el escudo o arma secundaria NO forman parte de la skin: se siguen viendo los que el personaje tenga equipados, dibujados por encima del traje en su posición correcta. Si cambias de arma, la skin se adapta sin hacer nada más.
- Las skins sirven para todas las clases.
- La skin se ve en todas partes: en los menús (retrato, lobby de Jugar) y también dentro de las mazmorras en el sprite del gameplay, en todas las direcciones y animaciones que tenga el personaje.
- Una skin comprada es del jugador para siempre. No ocupa espacio en la mochila ni en el almacén, no se puede perder al morir en una expedición, no se puede vender ni soltar. Se guarda en una colección propia del jugador.
- Las skins solo se consiguen en la Tienda. No salen de cofres, enemigos, misiones ni mercaderes.

4. Sistema de capas del
[TEXTO CORTADO AQUÍ — falta el resto del punto 4 y lo que siguiera]
