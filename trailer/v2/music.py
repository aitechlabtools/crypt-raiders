# Banda sonora original del tráiler v2 (sintetizada, sin muestras externas). 120 bpm, sincronizada con los cortes.
import json, numpy as np, wave
from scipy.signal import lfilter, butter
SR = 48000
c = json.load(open('/tmp/claude-0/t2/out/cuts.json')); cuts = c['cuts']; T = c['total']; texts = c['texts']
n = int(SR * T); t = np.arange(n) / SR
L = np.zeros(n); R = np.zeros(n)
rng = np.random.default_rng(11)
BEAT = 0.5

def lp(x, f): b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)
def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)
def add(sig, at, gain=1.0, pan=0.0):
    i0 = int(at * SR)
    if i0 >= n: return
    seg = sig[: n - i0] * gain
    L[i0:i0 + len(seg)] += seg * (1 - pan) ; R[i0:i0 + len(seg)] += seg * (1 + pan)
def tt(d): return np.arange(int(d * SR)) / SR

# Instrumentos
def boom(g=1.0, d=1.6):  # tambor grave cinematográfico
    x = tt(d); f = 34 + 70 * np.exp(-x * 9)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 2.6)
    s += lp(rng.standard_normal(len(x)), 900) * np.exp(-x * 30) * 0.5
    return np.tanh(s * 1.6) * g
def kick(g=1.0):
    x = tt(0.35); f = 45 + 110 * np.exp(-x * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 11) * g
def snare(g=1.0):
    x = tt(0.3); nz = hp(rng.standard_normal(len(x)), 1500) * np.exp(-x * 16)
    return (nz * 0.7 + np.sin(2 * np.pi * 190 * x) * np.exp(-x * 25) * 0.5) * g
def tick(g=1.0):
    x = tt(0.06); return hp(rng.standard_normal(len(x)), 6000) * np.exp(-x * 80) * g
def clang(g=1.0):  # acero contra acero
    x = tt(1.2); s = np.zeros(len(x))
    for f, a, dcy in [(523, 1, 5), (1187, .7, 7), (1847, .5, 9), (2613, .35, 11), (3407, .25, 14)]:
        s += np.sin(2 * np.pi * f * x + rng.random() * 6) * a * np.exp(-x * dcy)
    s += hp(rng.standard_normal(len(x)), 3000) * np.exp(-x * 60) * 0.8
    return s * 0.35 * g
def whoosh(d=0.6, g=1.0):
    x = tt(d); env = np.sin(np.pi * x / d) ** 2
    nz = rng.standard_normal(len(x)); sweep = lp(nz, 2500) * env
    return sweep * g * 0.5
def riser(d, g=1.0):
    x = tt(d); nz = hp(rng.standard_normal(len(x)), 400) * (x / d) ** 2
    tone = np.sin(2 * np.pi * np.cumsum(110 + 330 * (x / d) ** 2) / SR) * (x / d) ** 2 * 0.3
    return (nz * 0.3 + tone) * g
def saw(f, d, g=1.0):
    x = tt(d); ph = (f * x) % 1.0; s = (2 * ph - 1)
    s = lp(s, 1400) * np.minimum(1, x / 0.01) * np.exp(-x * 5)
    return s * g

# Dron grave en La que crece hasta el final
sw = np.clip(t / 26, 0, 1) ** 1.2 * 0.75 + 0.25
drone = np.sin(2 * np.pi * 55 * t) + 0.5 * np.sin(2 * np.pi * 82.41 * t + 0.3) + 0.3 * np.sin(2 * np.pi * 110.3 * t)
drone *= sw * 0.16 * (0.85 + 0.15 * np.sin(2 * np.pi * 0.5 * t)) * (t < 26.2)
L += drone; R += drone * 0.96
pad = lp(rng.standard_normal(n), 300) * 0.05 * sw * (t < 26)
L += pad; R += pad[::-1]

# 0–7: latido cada segundo
for k in np.arange(1.0, 7.0, 1.0): add(kick(0.8), k); add(kick(0.5), k + 0.22)
# 7–14: pulso a negras con ostinato en corcheas
notes = [110, 110, 130.81, 110, 164.81, 110, 146.83, 130.81]
for i, k in enumerate(np.arange(7.0, 14.0, BEAT / 2)):
    add(saw(notes[i % 8], 0.24, 0.16), k, pan=0.2 * ((i % 2) * 2 - 1))
for k in np.arange(7.0, 14.0, BEAT): add(kick(0.7), k)
for k in np.arange(7.25, 14.0, BEAT): add(tick(0.25), k, pan=0.4)
add(riser(1.5, 0.6), 12.5)
# 14–20: combate a tope — bombo, caja en 2 y 4, semicorcheas
for i, k in enumerate(np.arange(14.0, 20.0, BEAT)):
    add(kick(0.95), k)
    if i % 2 == 1: add(snare(0.55), k)
for i, k in enumerate(np.arange(14.0, 20.0, BEAT / 4)):
    add(saw(notes[(i // 2) % 8] * (2 if i % 4 == 3 else 1), 0.12, 0.14), k, pan=0.3 * ((i % 2) * 2 - 1))
    add(tick(0.15), k, pan=-0.4)
# Golpes reales del combate (acero, impactos mágicos)
for at, g in [(14.55, 1.0), (15.95, 0.8), (17.45, 0.9), (19.4, 1.0)]: add(clang(g), at, pan=0.15); add(boom(0.5, 0.8), at)
# 20–23.8: tensión — el ritmo cae, solo latido acelerando
for k in [20.0, 20.5, 20.9, 21.25]: add(kick(0.7), k)
add(boom(1.2), 21.5); add(clang(1.1), 21.5); add(clang(0.9), 22.7, pan=-0.2)
for k in np.arange(21.5, 23.0, 0.25): add(kick(0.45), k)
add(boom(1.3), 23.0); add(clang(1.2), 23.05); add(snare(0.8), 23.0)
# 23.8–26: portal — subida hacia el título
add(riser(2.2, 1.0), 23.8)
for k in np.arange(24.0, 26.0, BEAT / 2): add(kick(0.3 + 0.5 * (k - 24) / 2), k)
# Golpes en cada corte
for i, ct in enumerate(cuts[1:-1], 1):
    if 14 <= ct < 20 or 20 < ct < 26: add(boom(0.45, 1.0), ct)
    elif ct in (1.0, 3.0, 7.0, 10.0): add(boom(1.0, 1.8), ct)
    else: add(boom(0.6, 1.2), ct)
# Silbidos en la aparición de cada rótulo
for name, a, b in texts:
    if name != 'final': add(whoosh(0.5, 0.9), max(0, a - 0.3), pan=0.3)
# 26: gran golpe final + acorde de La menor que se apaga
fin = cuts[-1]
add(boom(2.2, 3.0), fin); add(clang(0.7), fin)
chord = np.zeros(n)
for f, g in [(55, 1), (110, 0.8), (130.81, 0.6), (164.81, 0.55), (220, 0.35), (261.6, 0.2)]:
    chord += np.sin(2 * np.pi * f * t + 0.3 * np.sin(2 * np.pi * 4.5 * t)) * g
ce = np.clip((t - fin) / 0.04, 0, 1) * np.exp(-np.maximum(t - fin, 0) / 2.4) * (t >= fin)
L += chord * ce * 0.14; R += chord * ce * 0.13
add(whoosh(1.0, 0.6), fin - 0.6)
# Fundidos y normalización con limitador suave
fade = np.clip((T - t) / 0.8, 0, 1) * np.clip(t / 0.05, 0, 1); L *= fade; R *= fade
m = max(np.abs(L).max(), np.abs(R).max()); L = np.tanh(L / m * 1.6) / np.tanh(1.6) * 0.93; R = np.tanh(R / m * 1.6) / np.tanh(1.6) * 0.93
data = (np.stack([L, R], 1) * 32767).astype('<i2')
with wave.open('/tmp/claude-0/t2/out/music.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes())
print('música', T, 's')
