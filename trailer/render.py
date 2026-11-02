import json, subprocess, os, sys
T='/tmp/claude-0/trailer'; OUT=f'{T}/out'; TX=f'{T}/txt'
W,H,FPS=1280,720,30
ENC=["-c:v","libx264","-preset","veryfast","-crf","18","-pix_fmt","yuv420p","-r",str(FPS)]

ZOOM=f"crop=640:360:320:190,scale={W}:{H}:flags=neighbor"     # exploración: cámara al doble
COMBAT=f"scale={W}:{H}:flags=lanczos"      # combate: plano completo
MODAL=f"crop=880:495:200:112,scale={W}:{H}:flags=lanczos"      # diálogos y cofres

# (nombre, fuente, t0, t1, encuadre, rótulo, fundido de entrada, fundido de salida)
SHOTS=[
 ('01','card',0,1.4,None,'oro',0.3,0.3),
 ('02','01-entrada',2.0,4.2,ZOOM,'explora',0.25,0.0),
 ('03','02-explorar',0.4,1.6,ZOOM,None,0.0,0.0),
 ('04','02-explorar',2.3,3.3,MODAL,'saquea',0.0,0.2),
 ('05','03-combate',1.6,4.4,COMBAT,'lucha',0.15,0.25),
 ('06','card',0,1.1,None,'solo',0.25,0.25),
 ('07','04-kael',1.1,3.7,MODAL,None,0.25,0.25),
 ('08','card',0,1.1,None,'nadie',0.2,0.2),
 ('09','05-traicion',0.0,3.0,COMBAT,'traicion',0.1,0.25),
 ('10','06-portal',1.2,5.0,ZOOM,'sal',0.25,0.35),
 ('11','card',0,3.0,None,'final',0.6,0.5),
]

def run(cmd):
    r=subprocess.run(cmd,capture_output=True,text=True)
    if r.returncode: print(r.stderr[-1500:]); sys.exit(1)

for name,src,t0,t1,crop,txt,fin,fout in SHOTS:
    dur=round(t1-t0,3)
    tmp=f'{OUT}/{name}.tmp.mp4'; final=f'{OUT}/{name}.mp4'
    inputs=[]; 
    if src=='card':
        inputs+=['-f','lavfi','-i',f'color=c=0x07060a:s={W}x{H}:r={FPS}:d={dur}']
        base='[0:v]format=yuv420p'
    else:
        fr=json.load(open(f'{T}/{src}/frames.json')); start=fr[0]['t']
        sel=[f for f in fr if t0<=f['t']-start<=t1]
        # el último fotograma anterior a t0 abre la toma para que no empiece en negro
        prev=[f for f in fr if f['t']-start<t0]
        if prev: sel=[prev[-1]]+sel
        lst=f'{OUT}/{name}.txt'
        with open(lst,'w') as fh:
            for i,f in enumerate(sel):
                nt=sel[i+1]['t'] if i+1<len(sel) else start+t1
                d=max(0.001,min(nt,start+t1)-max(f['t'],start+t0))
                fh.write(f"file '{f['f']}'\nduration {d:.4f}\n")
            fh.write(f"file '{sel[-1]['f']}'\n")
        inputs+=['-f','concat','-safe','0','-i',lst]
        base=f'[0:v]fps={FPS},{crop},trim=duration={dur},setpts=PTS-STARTPTS,format=yuv420p'
    fades=''
    if fin: fades+=f',fade=in:st=0:d={fin}'
    if fout: fades+=f',fade=out:st={dur-fout:.3f}:d={fout}'
    if txt:
        inputs+=['-loop','1','-framerate',str(FPS),'-t',str(dur),'-i',f'{TX}/{txt}.png']
        ti=0.15 if src!='card' else fin; to=dur-0.3
        fc=(f"{base}[b];[1:v]format=rgba,fade=in:st={ti}:d=0.3:alpha=1,fade=out:st={to:.3f}:d=0.25:alpha=1[t];"
            f"[b][t]overlay=0:0:shortest=1{fades}[v]")
    else:
        fc=f"{base}{fades}[v]"
    run(['ffmpeg','-y','-loglevel','error',*inputs,'-filter_complex',fc,'-map','[v]','-t',str(dur),*ENC,tmp])
    os.replace(tmp,final)
    print('toma',name,dur,'s')

with open(f'{OUT}/list.txt','w') as fh:
    for s in SHOTS: fh.write(f"file '{OUT}/{s[0]}.mp4'\n")
run(['ffmpeg','-y','-loglevel','error','-f','concat','-safe','0','-i',f'{OUT}/list.txt','-c','copy',f'{OUT}/video.tmp.mp4'])
os.replace(f'{OUT}/video.tmp.mp4',f'{OUT}/video.mp4')
# marcas de tiempo de cada corte, para la música
t=0; cuts=[]
for s in SHOTS: cuts.append(round(t,3)); t+=s[3]-s[2]
json.dump({'cuts':cuts,'total':round(t,3)},open(f'{OUT}/cuts.json','w'))
print('total',round(t,2),'s')
