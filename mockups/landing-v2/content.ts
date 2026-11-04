// Textos de la maqueta (versión A y B del lore). [P] = lore nuevo propuesto, pendiente de aprobar.
export const HEADLINES = {
  a: { title: 'Confía en tu espada. En nadie más.', sub: 'Un RPG de extracción por turnos en pixel art. Baja de la Mazmorra al Infierno, arriesga tu botín en cada expedición y vuelve con vida… si te dejan.' },
  b: { title: 'Baja. Saquea. Vuelve… si puedes.', sub: 'RPG de extracción por turnos en pixel art. Diez escenarios hasta el fondo de VarkHollow, botín que cambia cómo luchas y aliados que pueden traicionarte.' },
  c: { title: 'Cada bajada, todo o nada.', sub: 'Lo que sacas es tuyo. Lo que pierdes se queda abajo. RPG de extracción por turnos, gratis en el navegador y en el móvil.' },
};

export const ALPHA_NOTE = 'Esto es una alpha: el juego está en desarrollo, puede tener fallos y va a cambiar, y tu progreso podría perderse con alguna actualización.';
export const ALPHA_SUPPORT = 'Si quieres que avance más rápido, puedes apoyarlo.';

export const LORE = {
  a: {
    intro: 'VarkHollow ardió una noche y nunca terminó de apagarse. Arriba, el Bastión de Ceniza aún resiste. Abajo, las criptas de Umbravel guardan a sus muertos, y algo más hondo tira de las cadenas. Los saqueadores bajan por el oro. Casi ninguno vuelve.',
    chronicle: [
      'Antes de la ceniza, VarkHollow tenía un señor, una guardia y una orden de monjes que velaba a los muertos en las criptas de Umbravel. [P] El último prior quiso oír lo que susurraban y mandó cavar más hondo de lo que debía.',
      'La noche en que ardió el castillo, su señor juró no morir mientras ardiera su casa. Sigue ardiendo. La guardia cayó: su sargento cobra peaje en la muralla rota y el senescal aún gobierna salones de ceniza. [P] Lo que quedó en pie es el Bastión: unos muros, unos pocos mercaderes y una puerta que solo lleva hacia abajo.',
      'Bajo las mazmorras empiezan las criptas. El Osario, donde el prior se coronó con los huesos de sus monjes. Las Catacumbas, anegadas de agua negra, donde un barquero cobra el paso. El Panteón, donde una reina sin rostro canta a los que no descansan.',
      'Más abajo, la piedra suda sangre. La Cripta Carmesí tiene una puerta, y la puerta tiene un guardián. Al otro lado, Ignaroth forja cadenas y Belzar espera en un trono sobre el vacío.',
      'Tú eres un saqueador. En el Bastión, Orvel compra sin preguntar, la Hermana Vesper guarda las llaves, Garra Roja alquila espadas y Maese Brand forja con lo que subas. Ahí abajo hay otros como tú. Kael el Errante quizá te cubra la espalda. Los demás… ya se verá.',
    ],
  },
  b: {
    intro: 'VarkHollow es una tierra maldita. Su castillo, el Bastión de Ceniza, aún resiste; bajo él se abren las criptas de Umbravel y, más abajo, el Infierno. Tú eres un saqueador: bajas, saqueas y vuelves. Quien cae, se queda abajo.',
    chronicle: [
      'El castillo de VarkHollow ardió. [P] Nadie sabe quién encendió el fuego, pero todos saben que empezó abajo. Su señor juró no morir mientras ardiera su casa, y cumplió.',
      '[P] El Bastión de Ceniza es lo que quedó en pie del castillo: unos muros, unos pocos mercaderes y una puerta. Fuera, sus afueras son de los bandidos. Dentro, los salones quemados siguen guardados por quien ya no respira. Debajo, sus mazmorras bajan hasta el Osario.',
      '[P] Las criptas de Umbravel eran de una orden de monjes. Tres criptas para tres clases de muertos: los monjes en el Osario, los pobres en las Catacumbas, los nobles en su Panteón. Ninguno descansa.',
      'Debajo, la Cripta Carmesí: la piedra suda sangre y huele a azufre. Su puerta lleva al Infierno: las Puertas del Abismo, los Ríos de Fuego y el Trono de las Cadenas, donde espera Belzar.',
      'Los saqueadores bajan por oro, por armas y por gloria. Arriba los esperan Orvel, Vesper, Garra Roja y Maese Brand. Abajo, mercenarios errantes que ofrecen su espada. Algunos cumplen. Kael el Errante, casi siempre. Los demás, mientras les convenga.',
    ],
  },
};

export interface Sub { name: string; levels: string; text: string }
export const DEPTHS: { id: 'mazmorra' | 'cripta' | 'infierno'; name: string; levels: string; backdrop: string; boss: string; bossName: string; color: string; text: string; subs: Sub[] }[] = [
  { id: 'mazmorra', name: 'La Mazmorra', levels: 'Nv 1–30', backdrop: 'osario', boss: 'boss', bossName: 'Señor del Osario', color: '#c8a46a',
    text: 'El castillo de VarkHollow y lo que hay debajo. Bandidos, una guardia que no sabe que ha muerto y, al fondo, el primer trono de huesos.',
    subs: [
      { name: 'Afueras del castillo', levels: '1–10', text: 'Murallas rotas y hogueras de bandidos.' },
      { name: 'El castillo', levels: '10–20', text: 'Tapices quemados y una guardia muerta.' },
      { name: 'Las mazmorras del castillo', levels: '20–30', text: 'Celdas, cadenas y túneles húmedos.' },
    ] },
  { id: 'cripta', name: 'La Cripta', levels: 'Nv 30–60', backdrop: 'necropolis', boss: 'veiled_queen', bossName: 'La Reina Velada', color: '#8fb8e8',
    text: 'Las criptas de Umbravel: tres tumbas para tres clases de muertos. Velas frías, agua negra y nobles que no quieren visitas.',
    subs: [
      { name: 'El Osario de Umbravel', levels: '30–40', text: 'Paredes de calaveras y polvo de hueso.' },
      { name: 'Las Catacumbas Ahogadas', levels: '40–50', text: 'Agua negra hasta el tobillo.' },
      { name: 'El Panteón de los Nobles', levels: '50–60', text: 'Mármol, oro sucio y sarcófagos.' },
    ] },
  { id: 'infierno', name: 'El Infierno', levels: 'Nv 60–100', backdrop: 'infierno', boss: 'belzar', bossName: 'Belzar, Señor de las Cadenas', color: '#ff7a3a',
    text: 'Empieza en una cripta que sangra y acaba en un trono de cadenas sobre el vacío. Lo que vive aquí nunca fue humano.',
    subs: [
      { name: 'La Cripta Carmesí', levels: '60–70', text: 'La piedra suda sangre y huele a azufre.' },
      { name: 'Las Puertas del Abismo', levels: '70–80', text: 'Roca negra y puentes de obsidiana.' },
      { name: 'Los Ríos de Fuego', levels: '80–90', text: 'Lagos de lava y ceniza que no cesa.' },
      { name: 'El Trono de las Cadenas', levels: '90–100', text: 'Más abajo no hay nada.' },
    ] },
];

export const LOOP = [
  { verb: 'Prepárate', text: 'En el Bastión compras, forjas, contratas y eliges qué arriesgas.' },
  { verb: 'Baja', text: 'Un mapa nuevo en cada expedición y doce minutos para encontrar el portal.' },
  { verb: 'Lucha', text: 'Duelos por turnos: dos ataques especiales por mano, una habilidad de clase y el ímpetu o el maná deciden.' },
  { verb: 'Desconfía', text: 'Los mercenarios errantes ofrecen su espada. No todos cumplen.' },
  { verb: 'Escapa', text: 'Si llegas al portal, todo es tuyo. Si caes, se queda abajo.' },
];

export const FEATURES = [
  { icon: 'chalice', title: 'Botín que se nota', text: 'Armas y armaduras de común a legendario, con atributos como «del vampiro». Cada pieza cambia cómo luchas… y cómo te ves.' },
  { icon: 'dagger', title: 'Aliados de los que no fiarse', text: 'Un triángulo sobre su cabeza dice cuánto fiarte. Kael el Errante suele cumplir. Los demás, cuanto más hondo, menos.' },
  { icon: 'gem_red', title: 'Todo o nada', text: 'Lo que llevas encima se pierde si caes. Lo que guardas en el almacén, nunca.' },
  { icon: 'pick', title: 'Pica, forja, contrata', text: 'Minerales para Maese Brand, encargos y reputación con los mercaderes, y espadas de alquiler de Garra Roja.' },
  { icon: 'amulet_heart', title: 'Hasta el nivel 100', text: 'Cinco habilidades de clase por clase: tú eliges cuál desbloquear en cada hito.' },
  { icon: 'shield_iron', title: 'Atuendos sin ventajas', text: 'Se compran con el oro del juego y solo cambian cómo te ves.' },
];
