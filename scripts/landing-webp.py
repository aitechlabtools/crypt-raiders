# Pasa las capturas PNG de la landing a WebP sin pérdida (el PNG se queda como respaldo).
# Uso: python scripts/landing-webp.py [carpeta]   (por defecto public/screenshots/landing; necesita Pillow: pip install pillow)
import os, sys
from PIL import Image
d = sys.argv[1] if len(sys.argv) > 1 else 'public/screenshots/landing'
for f in sorted(os.listdir(d)):
    if f.endswith('.png') and f != 'compartir.png':
        Image.open(os.path.join(d, f)).convert('RGB').save(os.path.join(d, f[:-4] + '.webp'), lossless=True, method=6)
        print('webp:', f[:-4])
