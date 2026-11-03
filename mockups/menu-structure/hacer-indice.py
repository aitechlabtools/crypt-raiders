# Genera index.html con todas las capturas. Uso: python3 hacer-indice.py [png|webp] [salida]
import sys, html
EXT = sys.argv[1] if len(sys.argv) > 1 else 'png'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'index.html'
OPTS = [
  ('d', 'Campamento · mi propuesta', 'Estructura de menú de juego como la que me enseñaste: barra superior compacta con pestañas en píldora sobre la escena, el héroe grande en el centro sobre un pedestal iluminado, la tarjeta de destino arriba a la izquierda, el panel Expedición con Descender abajo a la izquierda, el nivel y los accesos rápidos abajo a la derecha. El resto de pantallas siguen la A (tres zonas), y en el Alijo en móvil cambias entre Equipo y Almacén con segmentos: en Almacén ves mochila y almacén lado a lado.'),
  ('a', 'Estandarte', 'Fiel a la referencia. Barra de pestañas arriba en todos los tamaños; en móvil pasa a iconos con su nombre y se puede deslizar. Las pantallas mantienen sus tres zonas y en móvil los paneles laterales (atributos, almacén, materiales) se abren desde los bordes. El campamento ocupa toda la pantalla.'),
  ('b', 'Grimorio', 'El campamento va enmarcado entre dos paneles: Expedición a la izquierda y Diario (misiones y reputación) a la derecha. En móvil la barra superior se convierte en una barra lateral de iconos para ganar altura, y las pantallas pasan a dos columnas con segmentos (Mochila, Almacén, Bolsillo). Mercaderes en tarjetas anchas de dos en dos.'),
  ('c', 'Atril', 'El campamento es una franja arriba y las tres zonas se ven a la vez abajo, con la preparación y el botón de bajar. En móvil la barra queda en solo iconos y cada pantalla cambia de vista con segmentos (Personaje, Equipo, Almacén). Mercaderes en una lista compacta con botones directos a cada servicio.'),
]
SCREENS = [('jugar', 'Jugar (campamento)'), ('clase', 'Crear personaje'), ('alijo', 'Alijo: equipo, mochila y almacén'), ('mercaderes', 'Mercaderes'), ('mercader', 'Mercader por dentro (Maese Brand, forja)'), ('personaje', 'Personaje: atributos y habilidades')]
DEVS = [('escritorio', 'Escritorio', '1920 × 1080'), ('tableta', 'Tableta', '1180 × 820'), ('movil', 'Móvil', '844 × 390')]
ASSETS = [
  ('Marco de panel (esquinas y bordes)', '9-slice de 24 × 24 px, esquinas de 8 px'),
  ('Adorno de pestaña activa', '48 × 8 px'), ('Marcador bajo la línea de pestañas', '10 × 10 px'),
  ('Iconos de las 8 pestañas', '16 × 16 px (se ven a ×2 o ×3)'), ('Arco del personaje (Alijo y Personaje)', '64 × 72 px'),
  ('Marco de tarjeta de mercader', '48 × 64 px, 9-slice'), ('Retratos de clase (4) y de mercader (4)', '24 × 24 px'),
  ('Escena del campamento con hoguera animada', '320 × 180 px, 4 fotogramas de fuego'), ('Ilustración de cada zona para su tarjeta', '160 × 90 px (3)'),
  ('Iconos de habilidad (24 hoy)', '16 × 16 px'), ('Botones principal y secundario', '9-slice de 16 × 16 px'),
  ('Iconos de ajustes y pantalla completa (entrar y salir)', '12 × 12 px'),
]
e = html.escape
cards = []
for o, name, desc in OPTS:
  rows = []
  for s, sl in (SCREENS[:3] + [('alijo-almacen', 'Alijo: vista Almacén (mochila y almacén lado a lado)')] + SCREENS[3:] if o == 'd' else SCREENS):
    shots = ''.join(f'<figure class="shot d-{d}"><a href="capturas/opcion-{o}_{s}_{d}.{EXT}" data-full><img loading="lazy" src="capturas/opcion-{o}_{s}_{d}.{EXT}" alt="Opción {o.upper()}, {e(sl)}, {dl}"></a><figcaption>{dl} <span>{dz}</span></figcaption></figure>' for d, dl, dz in DEVS)
    rows.append(f'<div class="screen"><h4>{e(sl)} <a class="live" href="opcion-{o}.html#{s}" target="_blank" rel="noopener">abrir ↗</a></h4><div class="shots">{shots}</div></div>')
  cards.append(f'<section class="opt" id="opcion-{o}"><header><div class="letter">{o.upper()}</div><div><h2>{e(name)}</h2><p>{e(desc)}</p></div><a class="go" href="opcion-{o}.html" target="_blank" rel="noopener">Maqueta navegable ↗</a></header>{"".join(rows)}</section>')
assets = ''.join(f'<li><span>{e(a)}</span><b>{e(m)}</b></li>' for a, m in ASSETS)
page = f'''<!doctype html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Menús de DREADBOUND</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* Una sola ambientación oscura, como el juego: piedra, oro y sangre. Cinzel para títulos, Crimson Pro para el texto. */
@font-face {{ font-family: Cinzel; font-weight: 600; src: url(assets/fonts/cinzel-latin-600-normal.woff2) format('woff2'); }}
@font-face {{ font-family: Cinzel; font-weight: 800; src: url(assets/fonts/cinzel-latin-800-normal.woff2) format('woff2'); }}
@font-face {{ font-family: 'Crimson Pro'; font-weight: 400; src: url(assets/fonts/crimson-pro-latin-400-normal.woff2) format('woff2'); }}
@font-face {{ font-family: 'Crimson Pro'; font-weight: 400; font-style: italic; src: url(assets/fonts/crimson-pro-latin-400-italic.woff2) format('woff2'); }}
:root {{ color-scheme: dark; --bg: #0b0a0e; --panel: #15131a; --line: #2e2b34; --fg: #e9e1cc; --mute: #8c8693; --gold: #e8b33a; --gold-d: #9a6b1a;
  --display: Cinzel, 'Times New Roman', serif; --body: 'Crimson Pro', Georgia, serif; }}
html, body {{ margin: 0; background: var(--bg); color: var(--fg); }}
body {{ font-family: var(--body); font-size: 18px; line-height: 1.45; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); padding-block: 0 64px; }}
.wrap {{ max-width: 1400px; margin: 0 auto; }}
h1, h2, h4 {{ font-family: var(--display); font-weight: 600; letter-spacing: .06em; text-wrap: balance; margin: 0; }}
.top {{ padding: 48px 0 28px; border-bottom: 2px solid var(--gold-d); display: grid; grid-template-columns: 1fr auto; gap: 24px; align-items: end; }}
.top h1 {{ font-size: clamp(28px, 4vw, 46px); font-weight: 800; }}
.top h1 span {{ color: var(--gold); }}
.top p {{ margin: 8px 0 0; color: var(--mute); max-width: 70ch; }}
.devs {{ display: flex; gap: 6px; flex-wrap: wrap; }}
.devs button {{ font-family: var(--display); font-size: 14px; letter-spacing: .08em; padding: 10px 16px; min-height: 44px; background: var(--panel); color: var(--mute); border: 2px solid var(--line); cursor: pointer; }}
.devs button[aria-pressed="true"] {{ color: #1a1205; background: linear-gradient(180deg, #e8b33a, #9a6b1a); border-color: #f5d27a; }}
.devs button:focus-visible, a:focus-visible {{ outline: 2px solid var(--gold); outline-offset: 2px; }}
nav.jump {{ display: flex; gap: 16px; flex-wrap: wrap; padding: 16px 0; font-family: var(--display); font-size: 14px; letter-spacing: .08em; }}
nav.jump a {{ color: var(--gold); text-decoration: none; }}
.opt {{ margin-top: 40px; }}
.opt > header {{ display: grid; grid-template-columns: auto 1fr auto; gap: 18px; align-items: start; padding: 18px; background: var(--panel); border: 2px solid var(--line); }}
.letter {{ font-family: var(--display); font-weight: 800; font-size: 40px; line-height: 1; color: var(--gold); width: 56px; height: 56px; display: grid; place-items: center; border: 2px solid var(--gold-d); }}
.opt h2 {{ font-size: 26px; }}
.opt header p {{ margin: 6px 0 0; max-width: 80ch; color: #cfc8b6; }}
.go {{ font-family: var(--display); font-size: 14px; letter-spacing: .06em; color: #1a1205; background: linear-gradient(180deg, #e8b33a, #9a6b1a); padding: 12px 16px; text-decoration: none; white-space: nowrap; border: 2px solid #f5d27a; }}
.screen {{ padding: 18px 0 6px; border-bottom: 1px solid var(--line); }}
.screen h4 {{ font-size: 15px; color: var(--fg); margin-bottom: 10px; display: flex; gap: 12px; align-items: baseline; }}
.live {{ font-family: var(--body); font-size: 15px; color: var(--gold); text-decoration: none; letter-spacing: 0; }}
.shots {{ display: grid; grid-template-columns: 1.6fr 1.05fr 1fr; gap: 12px; align-items: start; }}
.shot {{ margin: 0; min-width: 0; }}
.shot img {{ display: block; width: 100%; height: auto; border: 2px solid var(--line); background: #000; }}
.shot a:hover img {{ border-color: var(--gold-d); }}
figcaption {{ font-size: 14px; color: var(--mute); padding-top: 4px; }}
figcaption span {{ font-variant-numeric: tabular-nums; opacity: .7; }}
body[data-dev] .shots {{ grid-template-columns: 1fr; }}
body[data-dev="escritorio"] .shot:not(.d-escritorio), body[data-dev="tableta"] .shot:not(.d-tableta), body[data-dev="movil"] .shot:not(.d-movil) {{ display: none; }}
.assets {{ margin-top: 48px; padding: 20px; background: var(--panel); border: 2px solid var(--line); }}
.assets h2 {{ font-size: 22px; margin-bottom: 4px; }}
.assets p {{ margin: 0 0 12px; color: var(--mute); }}
.assets ul {{ list-style: none; margin: 0; padding: 0; columns: 2 320px; column-gap: 32px; }}
.assets li {{ display: flex; justify-content: space-between; gap: 16px; padding: 6px 0; border-bottom: 1px solid var(--line); break-inside: avoid; }}
.assets b {{ font-weight: 400; color: var(--gold); font-variant-numeric: tabular-nums; white-space: nowrap; }}
dialog {{ border: 2px solid var(--gold-d); background: #000; padding: 0; max-width: 96vw; max-height: 94vh; }}
dialog img {{ display: block; max-width: 96vw; max-height: 90vh; }}
dialog::backdrop {{ background: #000c; }}
dialog button {{ position: absolute; top: 6px; right: 6px; min-width: 44px; min-height: 44px; background: #000a; color: var(--fg); border: 1px solid var(--line); font-size: 20px; cursor: pointer; }}
@media (max-width: 760px) {{ .top {{ grid-template-columns: 1fr; }} .opt > header {{ grid-template-columns: auto 1fr; }} .go {{ grid-column: 1 / -1; text-align: center; }} .shots {{ grid-template-columns: 1fr; }} .assets li {{ flex-direction: column; gap: 0; }} }}
</style></head>
<body><div class="wrap">
<div class="top"><div><h1>Menús de <span>DREADBOUND</span></h1><p>Tres opciones y mi propuesta (D) para la nueva estructura de menús, con tus gráficos reales del juego y texto de ejemplo. Seis pantallas por opción, en escritorio, tableta y móvil horizontal. Pulsa una captura para verla a tamaño completo o abre la maqueta navegable de cada opción.</p></div>
<div class="devs" role="group" aria-label="Tamaño"><button aria-pressed="true" data-d="">Todos</button><button aria-pressed="false" data-d="escritorio">Escritorio</button><button aria-pressed="false" data-d="tableta">Tableta</button><button aria-pressed="false" data-d="movil">Móvil</button></div></div>
<nav class="jump"><a href="#opcion-d">D · Mi propuesta</a><a href="#opcion-a">A · Estandarte</a><a href="#opcion-b">B · Grimorio</a><a href="#opcion-c">C · Atril</a><a href="#assets">Gráficos que faltan</a></nav>
{"".join(cards)}
<section class="assets" id="assets"><h2>Gráficos que tendrás que diseñar</h2><p>En las maquetas van marcadores provisionales hechos con código o con CSS. Medidas en píxeles de pixel art, a tamaño real (el juego los escala a ×2, ×3…).</p><ul>{assets}</ul></section>
</div>
<dialog id="lb"><img alt=""><button type="button" aria-label="Cerrar">×</button></dialog>
<script>
const lb = document.getElementById('lb');
document.querySelectorAll('[data-full]').forEach((a) => a.addEventListener('click', (e) => {{ e.preventDefault(); lb.querySelector('img').src = a.getAttribute('href'); lb.querySelector('img').alt = a.querySelector('img').alt; lb.showModal(); }}));
lb.addEventListener('click', () => lb.close());
document.querySelectorAll('.devs button').forEach((b) => b.addEventListener('click', () => {{
  document.querySelectorAll('.devs button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  if (b.dataset.d) document.body.dataset.dev = b.dataset.d; else delete document.body.dataset.dev;
}}));
</script></body></html>'''
open(OUT, 'w').write(page)
print('ok', OUT)
