# Montaje del tráiler v2: tomas → vídeo base → rótulos con fundidos → música y efectos.
import json, subprocess, os, sys
T = '/tmp/claude-0/t2'; OUT = f'{T}/out'; TX = os.path.dirname(os.path.abspath(__file__))
W, H, FPS = 1280, 720, 30
os.makedirs(OUT, exist_ok=True)
ENC = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "17", "-pix_fmt", "yuv420p", "-r", str(FPS)]
DUN = "eq=brightness=0.05:gamma=1.35:saturation=1.2:contrast=1.05"   # mazmorra: levantar sombras
UI = "eq=gamma=1.18:saturation=1.12"

def crop(w, x, y):  # recorte 16:9
    return f"crop={w}:{round(w*9/16)}:{x}:{y}"

# (fuente, t0, duración, recorte, color, empuje de cámara por segundo)
SHOTS = [
    ('card',          0.0, 1.0, None, None, 0),
    ('d-cripta',      0.3, 2.0, None, DUN, 0.03),
    ('p-mapa0',       0.12, 1.4, None, DUN, 0.05),
    ('p-mapa1',       0.12, 1.3, None, DUN, 0.05),
    ('p-mapa2',       0.12, 1.3, None, DUN, 0.05),
    ('c-crear',       0.25, 3.0, crop(1180, 50, 20), UI, 0.03),
    ('g-equipo',      0.2, 4.0, crop(1080, 190, 50), UI, 0.025),
    ('m-murcielago',  4.3, 1.5, crop(980, 150, 20), UI, 0.06),
    ('w-jefe',        9.3, 1.5, crop(980, 150, 20), UI, 0.06),
    ('m-jefe',        4.0, 1.5, crop(980, 150, 20), UI, 0.06),
    ('w-jefe',        19.1, 1.5, crop(980, 150, 20), UI, 0.06),
    ('k-kael',        1.6, 1.0, crop(760, 260, 120), UI, 0.04),
    ('k-kael',        5.0, 0.5, crop(760, 260, 120), UI, 0.04),
    ('t-traicion',    0.8, 1.5, crop(980, 150, 20), UI, 0.06),
    ('t-traicion',    6.2, 0.8, crop(980, 150, 20), UI, 0.08),
    ('d-portal2',     0.0, 2.2, None, DUN, 0.04),
    ('card',          0.0, 4.0, None, None, 0),
]
# Rótulos: (png, inicio, fin)
TEXTS = [('oro', 0.1, 0.95), ('mapas', 3.2, 6.9), ('clases', 7.2, 9.9), ('equipo', 10.3, 13.9),
         ('habilidades', 14.15, 16.9), ('jefe', 17.1, 19.9), ('aliado', 20.1, 21.45), ('traidor', 21.6, 23.75),
         ('sal', 24.0, 25.95), ('final', 26.25, 30.0)]

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: print(r.stderr[-2000:]); sys.exit(1)

parts = []; t = 0; cuts = []
for i, (src, t0, dur, cr, col, push) in enumerate(SHOTS):
    out = f'{OUT}/s{i:02d}.mp4'; cuts.append(round(t, 3)); t += dur
    if src == 'card':
        run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'lavfi', '-i', f'color=c=0x07060a:s={W}x{H}:r={FPS}:d={dur}', *ENC, out])
    else:
        fr = json.load(open(f'{T}/{src}/frames.json')); start = fr[0]['t']
        sel = [f for f in fr if t0 <= f['t'] - start <= t0 + dur]
        prev = [f for f in fr if f['t'] - start < t0]
        if prev: sel = [prev[-1]] + sel
        lst = f'{OUT}/s{i:02d}.txt'
        with open(lst, 'w') as fh:
            for k, f in enumerate(sel):
                nt = sel[k + 1]['t'] if k + 1 < len(sel) else start + t0 + dur
                d = max(0.001, min(nt, start + t0 + dur) - max(f['t'], start + t0))
                fh.write(f"file '{f['f']}'\nduration {d:.4f}\n")
            fh.write(f"file '{sel[-1]['f']}'\n")
        vf = f'fps={FPS}'
        if cr: vf += ',' + cr
        # empuje suave: escala creciente por fotograma y recorte centrado
        vf += f",scale={W*2}:{H*2}:flags=bicubic,zoompan=z='1+{push}*on/{FPS}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s={W}x{H}:fps={FPS}"
        vf += f',{col},trim=duration={dur},setpts=PTS-STARTPTS,format=yuv420p'
        run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-vf', vf, '-t', str(dur), *ENC, out])
    parts.append(out); print('toma', i, src, dur)

with open(f'{OUT}/list.txt', 'w') as fh:
    for p in parts: fh.write(f"file '{p}'\n")
run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', f'{OUT}/list.txt', '-c', 'copy', f'{OUT}/base.mp4'])

# Rótulos encima, con fundidos y un destello blanco en el golpe final
inputs = ['-i', f'{OUT}/base.mp4']; fc = ''; last = '[0:v]'
for k, (png, a, b) in enumerate(TEXTS):
    inputs += ['-loop', '1', '-framerate', str(FPS), '-t', str(t), '-i', f'{TX}/{png}.png']
    fi = 0.5 if png == 'final' else 0.18
    fc += (f"[{k+1}:v]format=rgba,fade=in:st={a}:d={fi}:alpha=1,fade=out:st={b-0.2:.2f}:d=0.2:alpha=1[t{k}];"
           f"{last}[t{k}]overlay=0:0:shortest=1[v{k}];")
    last = f'[v{k}]'
fin = cuts[-1]
fc += f"{last}fade=in:st=0:d=0.25,fade=out:st={t-0.6:.2f}:d=0.6,format=yuv420p[v]"
run(['ffmpeg', '-y', '-loglevel', 'error', *inputs, '-filter_complex', fc, '-map', '[v]', '-t', str(t), *ENC, f'{OUT}/video.mp4'])
json.dump({'cuts': cuts, 'total': round(t, 3), 'texts': TEXTS}, open(f'{OUT}/cuts.json', 'w'))
print('total', round(t, 2), 's', cuts)
