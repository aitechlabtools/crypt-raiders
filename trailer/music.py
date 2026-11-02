# Banda sonora original sintetizada para el tráiler (sin muestras externas).
import json, numpy as np, wave
SR=48000
c=json.load(open('/tmp/claude-0/trailer/out/cuts.json')); cuts=c['cuts']; T=c['total']
n=int(SR*T); t=np.arange(n)/SR
L=np.zeros(n); R=np.zeros(n)
rng=np.random.default_rng(7)
def env(start,att,dec,length=None):
    e=np.zeros(n); i0=int(start*SR); a=int(att*SR); 
    seg=np.arange(n-i0)/SR
    e[i0:]=np.where(seg<att, seg/max(att,1e-4), np.exp(-(seg-att)/dec))
    return e
def lowpass(x,a=0.02):
    y=np.zeros_like(x); acc=0.0
    for i in range(0,len(x)):
        acc+= a*(x[i]-acc); y[i]=acc
    return y
# Dron grave (La) que crece hasta el final
swell=np.clip(t/T,0,1)**1.3*0.7+0.15
drone=(np.sin(2*np.pi*55*t)+0.5*np.sin(2*np.pi*82.4*t+0.3)+0.25*np.sign(np.sin(2*np.pi*55.3*t))*0.3)
drone*=swell*0.22*(0.85+0.15*np.sin(2*np.pi*0.25*t))
L+=drone; R+=drone*0.95
# Golpes graves en los cortes de acción
def boom(at,gain=1.0):
    e=env(at,0.005,0.45); f=np.exp(-np.maximum(t-at,0)*6)*60+38
    ph=np.cumsum(2*np.pi*f/SR)
    s=np.sin(ph)*e*0.9*gain
    nz=rng.standard_normal(n)*env(at,0.002,0.08)*0.25*gain
    return s+nz
for i in [1,4,8,9]: s=boom(cuts[i]); L+=s; R+=s
# Silbido (whoosh) en los rótulos sobre negro
nzbase=rng.standard_normal(n)
for i in [0,5,7]:
    at=cuts[i]; e=np.exp(-((t-at-0.35)/0.22)**2)*0.18
    w=lowpass(nzbase[int(max(0,at-0.2)*SR):int((at+1.0)*SR)],0.08)
    seg=np.zeros(n); i0=int(max(0,at-0.2)*SR); seg[i0:i0+len(w)]=w
    L+=seg*e*1.4; R+=seg*e
# Pulso de tensión (latido) durante el combate y la traición
for start,end,bpm in [(cuts[4],cuts[5],120),(cuts[8],cuts[9],140),(cuts[9],cuts[10],100)]:
    k=start
    while k<end-0.1:
        s=boom(k,0.35); L+=s; R+=s; k+=60/bpm
# Subida antes del final y gran golpe con acorde
fin=cuts[10]
riser=np.clip((t-(fin-1.6))/1.6,0,1)**2*(t<fin)
L+=lowpass(nzbase,0.15)*riser*0.35; R+=lowpass(nzbase[::-1],0.15)*riser*0.35
s=boom(fin,1.6); L+=s; R+=s
chord=np.zeros(n)
for f,g in [(110,1),(130.81,0.7),(164.81,0.6),(220,0.35)]:
    chord+=np.sin(2*np.pi*f*t+0.4*np.sin(2*np.pi*5*t))*g
ce=np.clip((t-fin)/0.05,0,1)*np.exp(-np.maximum(t-fin,0)/2.2)*(t>=fin)
L+=chord*ce*0.16; R+=chord*ce*0.15
# Fundido final y normalización
fade=np.clip((T-t)/0.6,0,1); L*=fade; R*=fade
m=max(np.abs(L).max(),np.abs(R).max()); L/=m/0.89; R/=m/0.89
data=(np.stack([L,R],1)*32767).astype('<i2')
with wave.open('/tmp/claude-0/trailer/out/music.wav','wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes())
print('música',T,'s')
