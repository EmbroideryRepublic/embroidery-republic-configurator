"""
Modellmasken für rein weiße Produktfotos (weiß auf weiß): ISNet (isnet-general-use.onnx, Apache-2.0, aus rembg v0.0.0, md5 fc16ebd8b0c10d971d3513d564d01e29)
läuft lokal auf der CPU über onnxruntime. Ausgabe je Bild: Graustufenmaske 0–255 in Bildgröße.

Aufruf: python scripts/dunkleHintergruendeMasken.py <auftragsliste.json>     (Liste: [{"png": "...", "aus": "..."}], erzeugt von scripts/dunkleHintergruende.mts --maskenliste=...)
Voraussetzung: onnxruntime, numpy, pillow; Modell unter ISNET_PFAD (Standard E:/KI-Bilder/modelle/isnet-general-use/isnet-general-use.onnx), onnxruntime ggf. unter ONNX_PFAD (Standard E:/KI-Bilder/pyplus).
"""
import sys, os, json
sys.path.insert(0, os.environ.get('ONNX_PFAD', 'E:/KI-Bilder/pyplus'))
import numpy as np
import onnxruntime as ort
from PIL import Image
M = os.environ.get('ISNET_PFAD', 'E:/KI-Bilder/modelle/isnet-general-use/isnet-general-use.onnx')
sess = ort.InferenceSession(M, providers=['CPUExecutionProvider'])
name = sess.get_inputs()[0].name
liste = json.load(open(sys.argv[1], encoding='utf-8'))  # [{"png": "...", "aus": "..."}]
for e in liste:
    im = Image.open(e['png'])
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA'); bg = Image.new('RGBA', im.size, (255, 255, 255, 255)); bg.alpha_composite(im); im = bg
    im = im.convert('RGB')
    a = np.array(im.resize((1024, 1024), Image.Resampling.LANCZOS)).astype(np.float32)
    a = a / max(a.max(), 1e-6)
    a = (a - 0.5) / 1.0
    x = np.expand_dims(a.transpose(2, 0, 1), 0).astype(np.float32)
    pred = sess.run(None, {name: x})[0][:, 0, :, :]
    pred = (pred - pred.min()) / max(pred.max() - pred.min(), 1e-6)
    m = Image.fromarray((np.squeeze(pred) * 255).astype('uint8'), mode='L').resize(im.size, Image.Resampling.LANCZOS)
    os.makedirs(os.path.dirname(e['aus']), exist_ok=True)
    m.save(e['aus'])
print('fertig', len(liste))
