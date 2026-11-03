/*
 * TEXTOS LEGALES ORIENTATIVOS.
 * Estos textos son una base redactada para Crypt Raiders según la LSSI-CE, el RGPD, la LOPDGDD y la guía de cookies
 * de la AEPD, a partir de lo que la web hace realmente (auditoría del 3/11/2026). No son asesoramiento jurídico:
 * conviene que los revise un profesional antes de darlos por definitivos, y actualizarlos cuando cambie la web
 * (analítica, cuentas, guardado en la nube, multijugador, compras…).
 * Los datos entre corchetes ([NOMBRE Y APELLIDOS], [NIF], [DOMICILIO], [EMAIL DE CONTACTO]) los rellena el titular.
 */
import type { ReactNode } from 'react';
import { Ph, StorageTable, type LegalSection } from './LegalPage';

export const UPDATED = '3 de noviembre de 2026';

const Titular = () => (
  <dl className="legal-dl">
    <dt>Titular</dt><dd><Ph>[NOMBRE Y APELLIDOS]</Ph></dd>
    <dt>NIF</dt><dd><Ph>[NIF]</Ph></dd>
    <dt>Domicilio</dt><dd><Ph>[DOMICILIO]</Ph></dd>
    <dt>Correo electrónico</dt><dd><Ph>[EMAIL DE CONTACTO]</Ph></dd>
    <dt>Sitio web</dt><dd>cryptraiders.es</dd>
  </dl>
);

export interface PageDef { title: string; intro: ReactNode; sections: LegalSection[] }

// ─────────────────────────────────────────────────────────────────────────────
// AVISO LEGAL
// ─────────────────────────────────────────────────────────────────────────────
export const AVISO: PageDef = {
  title: 'Aviso legal',
  intro: <p>Aquí tienes quién está detrás de Crypt Raiders y las condiciones para usar esta web y la demo del juego.</p>,
  sections: [
    { id: 'titular', title: 'Datos del titular', body: <>
      <p>En cumplimiento del artículo 10 de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico (LSSI-CE), estos son los datos del titular de esta web:</p>
      <Titular />
    </> },
    { id: 'objeto', title: 'Objeto de la web', body: <>
      <p>Esta web presenta <strong>Crypt Raiders</strong>, un videojuego independiente en desarrollo, y da acceso gratuito a una demo jugable en el navegador, en ordenador y en el móvil.</p>
      <p>La web no vende nada. Dentro de la demo, la Tienda de atuendos solo usa el oro que se consigue jugando: no hay pagos con dinero real, y los atuendos son solo estéticos, no dan ventajas.</p>
    </> },
    { id: 'uso', title: 'Condiciones de uso', body: <>
      <p>Usar la web y la demo es gratis y no exige registro. Al usarlas aceptas este aviso legal. Te comprometes a usarlas de forma lícita y a no hacer nada que pueda dañarlas, sobrecargarlas o impedir que otras personas las usen, como intentar acceder a sistemas o datos ajenos o introducir programas dañinos.</p>
      <p>El titular puede cambiar, ampliar o retirar en cualquier momento los contenidos de la web y de la demo, y también estas condiciones. La versión vigente es siempre la publicada en esta página.</p>
    </> },
    { id: 'demo', title: 'La demo y tu progreso', body: <>
      <p>Crypt Raiders es una <strong>demo en desarrollo</strong>: puede tener errores, y su contenido, su equilibrio y sus reglas pueden cambiar entre versiones.</p>
      <p>Tu progreso (personaje, equipo, oro, ajustes) se guarda <strong>solo en tu navegador</strong>, en tu dispositivo. No se guarda en ningún servidor y el titular no tiene copia. Por eso puede perderse si:</p>
      <ul>
        <li>borras los datos de navegación o los datos de este sitio;</li>
        <li>juegas en una ventana privada o de incógnito;</li>
        <li>cambias de navegador o de dispositivo, o instalas el juego como app (la app instalada tiene su propio guardado);</li>
        <li>una actualización del juego obliga a cambiar el formato de las partidas.</li>
      </ul>
      <p>El titular procura conservar las partidas entre versiones, pero no puede garantizarlo mientras el juego esté en desarrollo.</p>
    </> },
    { id: 'propiedad', title: 'Propiedad intelectual e industrial', body: <>
      <p>El juego Crypt Raiders, su nombre, el mundo de VarkHollow, los logotipos, los gráficos en pixel art, los textos, la música, los sonidos, el tráiler y el código de esta web pertenecen al titular, salvo que se indique lo contrario. Está prohibido reproducirlos, distribuirlos, transformarlos o comunicarlos públicamente sin su autorización, salvo para uso personal y para compartir enlaces o capturas citando la fuente.</p>
      <p>Algunos elementos son de terceros y se usan con su licencia: las tipografías Cinzel, Crimson Pro y Pixelify Sans (SIL Open Font License) y las bibliotecas de software libre con las que está hecha la web (por ejemplo React y Phaser, con licencia MIT).</p>
    </> },
    { id: 'responsabilidad', title: 'Exclusión de responsabilidad', body: <>
      <p>El titular intenta que la web y la demo funcionen bien y estén siempre disponibles, pero no lo garantiza: puede haber interrupciones, errores o pérdidas de progreso. En la medida en que lo permita la ley, el titular no responde de los daños que se deriven de ello, ni del mal uso que otras personas hagan de la web.</p>
      <p>La hoja de ruta de la web indica intenciones, no compromisos: puede cambiar y no tiene fechas cerradas.</p>
    </> },
    { id: 'enlaces', title: 'Enlaces a otras webs', body: <>
      <p>Si esta web enlaza a sitios de terceros, el titular no controla sus contenidos ni sus políticas de privacidad, y no responde de ellos. Si detectas un enlace a un contenido ilícito, escribe a <Ph>[EMAIL DE CONTACTO]</Ph> y se retirará.</p>
    </> },
    { id: 'ley', title: 'Legislación aplicable y jurisdicción', body: <>
      <p>Este aviso legal se rige por la legislación española. Si eres consumidor, para cualquier controversia serán competentes los juzgados y tribunales de tu domicilio. En los demás casos, las partes se someten a los juzgados y tribunales del domicilio del titular.</p>
    </> },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// POLÍTICA DE PRIVACIDAD
// ─────────────────────────────────────────────────────────────────────────────
export const PRIVACIDAD: PageDef = {
  title: 'Política de privacidad',
  intro: <>
    <p><strong>En resumen:</strong> esta web no tiene formularios, cuentas, analítica, publicidad ni cookies. Tu partida se guarda solo en tu navegador y no se envía al titular. El único tratamiento de datos es técnico: el del servicio que aloja la web (GitHub) y, si nos escribes, el de tu correo.</p>
  </>,
  sections: [
    { id: 'responsable', title: 'Responsable del tratamiento', body: <>
      <Titular />
      <p>Puedes escribir a esa dirección para cualquier cuestión sobre tus datos.</p>
    </> },
    { id: 'datos', title: 'Qué datos tratamos', body: <>
      <p><strong>El titular no recoge datos personales a través de la web.</strong> No hay registro, formularios, comentarios, analítica, píxeles de seguimiento, publicidad ni botones de redes sociales.</p>
      <p><strong>Tu partida se queda en tu dispositivo.</strong> El juego guarda en tu navegador el nombre que le pones a tu personaje, su progreso, su equipo y tus ajustes de sonido. Esos datos no salen de tu dispositivo: el titular no los recibe ni puede verlos. Puedes borrarlos cuando quieras desde Ajustes en el juego («Borrar personaje») o borrando los datos del sitio en tu navegador. Los detalles están en la <a href="./cookies.html">Política de cookies</a>.</p>
      <p><strong>Todo se sirve desde esta web.</strong> Las tipografías, las imágenes y el tráiler están alojados en la propia web: tu navegador no se conecta a servicios de terceros (como Google Fonts o YouTube) para mostrarlos.</p>
    </> },
    { id: 'alojamiento', title: 'Alojamiento web: GitHub Pages', body: <>
      <p>La web está alojada en GitHub Pages, un servicio de GitHub, Inc. (88 Colin P. Kelly Jr. St., San Francisco, CA 94107, Estados Unidos). Como cualquier servidor, para enviarte las páginas GitHub trata datos técnicos de cada visita, como tu <strong>dirección IP</strong>, el navegador, la página pedida y la fecha y la hora. Según GitHub, la IP de quien visita un sitio de GitHub Pages se registra y se guarda por motivos de seguridad, haya iniciado sesión en GitHub o no.</p>
      <ul>
        <li><strong>Finalidad:</strong> mostrar la web y protegerla frente a abusos y ataques.</li>
        <li><strong>Base jurídica:</strong> el interés legítimo en ofrecer la web de forma segura (artículo 6.1.f del RGPD).</li>
        <li><strong>Transferencia internacional:</strong> GitHub está en Estados Unidos, fuera del Espacio Económico Europeo. Según su declaración de privacidad, se acoge al Marco de Privacidad de Datos UE-EE. UU. (EU-U.S. Data Privacy Framework) y utiliza las cláusulas contractuales tipo de la Comisión Europea.</li>
        <li><strong>Más información:</strong> la declaración de privacidad de GitHub (docs.github.com, «GitHub General Privacy Statement»).</li>
      </ul>
      <p>El dominio cryptraiders.es está registrado en Hostinger. Hostinger no recibe los datos de tu visita a la web; como mucho, recibe las consultas técnicas para encontrar la dirección del sitio (DNS), que normalmente hace tu proveedor de Internet y no tu dispositivo.</p>
    </> },
    { id: 'contacto', title: 'Si nos escribes', body: <>
      <p>Si escribes a <Ph>[EMAIL DE CONTACTO]</Ph>, el titular tratará tu dirección de correo y lo que cuentes en el mensaje solo para responderte. La base jurídica es tu consentimiento al escribir (artículo 6.1.a del RGPD). Los mensajes se guardan mientras haga falta para atender tu consulta y, después, durante los plazos legales que correspondan. No se ceden a nadie salvo obligación legal. El correo se gestiona con un proveedor de correo electrónico que actúa como encargado del tratamiento.</p>
      <p>Crypt Raiders no tiene redes sociales por ahora. Si en el futuro las tiene, esta política lo explicará.</p>
    </> },
    { id: 'menores', title: 'Menores de edad', body: <>
      <p>La web no recoge datos de nadie, tampoco de menores. Si tienes menos de 14 años, pide permiso a tu madre, padre o tutor antes de escribirnos (artículo 7 de la LOPDGDD).</p>
    </> },
    { id: 'derechos', title: 'Tus derechos', body: <>
      <p>Puedes ejercer tus derechos de <strong>acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad</strong> escribiendo a <Ph>[EMAIL DE CONTACTO]</Ph>. Indica qué derecho quieres ejercer; si hace falta para comprobar que eres tú, se te pedirá algún dato más.</p>
      <p>Recuerda que el titular no tiene tu partida: la tienes tú en tu navegador y la puedes borrar directamente.</p>
      <p>Si crees que no se han respetado tus derechos, puedes reclamar ante la <strong>Agencia Española de Protección de Datos</strong> (www.aepd.es, C/ Jorge Juan 6, 28001 Madrid).</p>
    </> },
    { id: 'cambios', title: 'Cambios en esta política', body: <>
      <p>Esta política describe la web tal como es hoy. Se actualizará <strong>antes</strong> de añadir funciones que traten datos, como el guardado en la nube, las cuentas de jugador, el multijugador, la analítica o las compras. La fecha de arriba indica la última actualización.</p>
    </> },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// POLÍTICA DE COOKIES
// ─────────────────────────────────────────────────────────────────────────────
const STORAGE_ROWS = [
  { name: 'cryptraiders', where: 'IndexedDB (base de datos del navegador)', owner: 'Propia', purpose: 'Guardar tu partida: personaje, progreso, equipo, oro y ajustes de sonido.', duration: 'Hasta que borres el personaje o los datos del sitio.', type: 'Técnica, necesaria' },
  { name: 'cryptraiders.profile', where: 'Almacenamiento local (localStorage)', owner: 'Propia', purpose: 'Lo mismo que la anterior. Solo se usa si tu navegador no admite IndexedDB.', duration: 'Hasta que borres el personaje o los datos del sitio.', type: 'Técnica, necesaria' },
  { name: 'dreadbound', where: 'IndexedDB (base de datos del navegador)', owner: 'Propia', purpose: 'Partida guardada con el nombre anterior del juego (DREADBOUND). Solo existe si jugaste antes del cambio de nombre; se copia a «cryptraiders».', duration: 'Hasta que borres el personaje o los datos del sitio.', type: 'Técnica, necesaria' },
];

export const COOKIES: PageDef = {
  title: 'Política de cookies',
  intro: <>
    <p><strong>En resumen:</strong> esta web <strong>no usa cookies</strong>, ni propias ni de terceros. El juego solo guarda tu partida en tu navegador, y eso es necesario para que puedas jugar y continuar después. Por eso no verás ningún aviso de cookies.</p>
  </>,
  sections: [
    { id: 'que-son', title: 'Qué son las cookies', body: <>
      <p>Las cookies son pequeños archivos que una web guarda en tu navegador para recordar algo, como una preferencia o tu sesión. Hay otras tecnologías que funcionan parecido, como el almacenamiento local (localStorage) o IndexedDB, una pequeña base de datos dentro del navegador. La ley trata igual todas estas tecnologías.</p>
    </> },
    { id: 'que-usamos', title: 'Qué guarda esta web', body: <>
      <p>La portada y las páginas legales no guardan nada en tu navegador. La demo del juego guarda lo siguiente, y solo cuando creas un personaje:</p>
      <StorageTable rows={STORAGE_ROWS} />
      <p>Todo es <strong>propio</strong>: lo crea esta web, se queda en tu dispositivo y nadie más lo lee, tampoco el titular.</p>
    </> },
    { id: 'sin-banner', title: 'Por qué no hay aviso de cookies', body: <>
      <p>La ley exige pedirte permiso antes de guardar información en tu navegador, excepto cuando es <strong>estrictamente necesario para prestar un servicio que tú pides</strong> (artículo 22.2 de la LSSI-CE). Guardar tu partida es justo eso: sin ese guardado no podrías jugar ni continuar donde lo dejaste. Así lo considera también la guía sobre cookies de la Agencia Española de Protección de Datos.</p>
      <p>Esta web no usa cookies de análisis, de publicidad ni de redes sociales. Si algún día las usa, antes de cargarlas aparecerá un aviso con los botones «Aceptar» y «Rechazar» igual de visibles y la opción de configurarlas por categorías, y esta página se actualizará.</p>
    </> },
    { id: 'terceros', title: 'Cookies de terceros', body: <>
      <p>Ninguna. Las tipografías, las imágenes y el tráiler se sirven desde la propia web, sin servicios externos. El alojamiento (GitHub Pages) no instala cookies en tu navegador; lo que trata se explica en la <a href="./privacidad.html">Política de privacidad</a>.</p>
    </> },
    { id: 'borrar', title: 'Cómo borrar o bloquear estos datos', body: <>
      <p className="legal-warn"><strong>Atención:</strong> si borras los datos de este sitio, <strong>perderás tu partida</strong> (personaje, equipo y progreso), y no se puede recuperar.</p>
      <p>La forma más sencilla es usar «Borrar personaje y empezar de cero» en Ajustes, dentro del juego. También puedes hacerlo desde el navegador:</p>
      <ul>
        <li><strong>Chrome (ordenador):</strong> Configuración › Privacidad y seguridad › Configuración de sitios › Ver permisos y datos almacenados en los sitios › busca «cryptraiders.es» › Eliminar datos.</li>
        <li><strong>Chrome (Android):</strong> toca el icono que hay a la izquierda de la dirección › Configuración del sitio › Eliminar datos y restablecer permisos.</li>
        <li><strong>Firefox:</strong> haz clic en el candado de la barra de direcciones › Limpiar cookies y datos del sitio.</li>
        <li><strong>Safari (Mac):</strong> Ajustes › Privacidad › Gestionar datos de sitios web › busca «cryptraiders.es» › Eliminar.</li>
        <li><strong>Safari (iPhone y iPad):</strong> Ajustes › Apps › Safari › Avanzado › Datos de sitios web › busca «cryptraiders.es» y desliza para borrar.</li>
        <li><strong>Edge:</strong> Configuración › Cookies y permisos del sitio › Administrar y eliminar cookies y datos del sitio › Ver todas las cookies y datos del sitio › busca «cryptraiders.es» › Eliminar.</li>
      </ul>
      <p>Si bloqueas el almacenamiento de este sitio, el juego se abrirá, pero no podrá guardar tu partida. Si instalaste el juego como app en tu dispositivo, la app tiene su propio guardado: se borra al desinstalarla.</p>
    </> },
    { id: 'cambios', title: 'Cambios en esta política', body: <>
      <p>Esta página se actualizará cuando cambie lo que la web guarda en tu navegador. La fecha de arriba indica la última actualización.</p>
    </> },
  ],
};
