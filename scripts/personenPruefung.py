"""
Personenprüfung der Produktbilder: findet Fotos, auf denen ein MENSCH zu sehen ist.

Warum: Der Katalog besteht aus freigestellten Kleidungsstücken auf Weiß. Fotos mit Person
passen nicht zum Stil und verschieben die Brustfläche, auf der die Druck-/Stickplatzierung
des Konfigurators sitzt. Der Hautton-Audit (scripts/onModelAudit.mts) erkennt Personen nur
indirekt und hat 2026-11-26 45 Personenfotos in 6 Produkten übersehen – diese Prüfung nutzt
deshalb einen echten Objektdetektor (YOLOS-tiny, Klasse „person“, läuft lokal auf der CPU).

Regel (an allen 7.566 Bildern des Shops kalibriert und einzeln gesichtet):
  Person  <=>  Wahrscheinlichkeit >= 0,995  UND  Seitenverhältnis der Person-Box (Höhe/Breite in Pixeln) 1,5–2,6.
  Hoodies, Fleece und Polos erreichen ebenfalls hohe Werte, haben aber Boxen mit Verhältnis ~1,0–1,4 – daher das Verhältnis.

Ergebnis: scripts/import/personenpruefung.json  { dateien: { "<ordner>/<datei>.webp": [sha1(12), wahrscheinlichkeit, verhältnis] } }
Inkrementell: unveränderte Dateien (gleicher SHA-1) werden nicht neu geprüft. Der Test
src/lib/assets/__tests__/keineMenschen.test.ts verlangt für JEDES Manifestbild einen aktuellen Eintrag ohne Person.

Aufruf:   python scripts/personenPruefung.py          (Exit 1, wenn eine Person gefunden wurde)
Voraussetzung: python mit torch, transformers, pillow; Modell lokal unter YOLOS_PFAD
(Standard E:/KI-Bilder/modelle/yolos-tiny = Hugging Face „hustvl/yolos-tiny“).
"""
import hashlib
import json
import os
import sys
import time

import torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForObjectDetection

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BILDER = os.path.join(WURZEL, 'public', 'products')
ERGEBNIS = os.path.join(WURZEL, 'scripts', 'import', 'personenpruefung.json')
MODELL = os.environ.get('YOLOS_PFAD', 'E:/KI-Bilder/modelle/yolos-tiny')
SCHWELLE = 0.995
ASPEKT_MIN, ASPEKT_MAX = 1.5, 2.6


def ist_person(score, aspekt):
    return score >= SCHWELLE and ASPEKT_MIN <= aspekt <= ASPEKT_MAX


def sha(pfad):
    h = hashlib.sha1()
    with open(pfad, 'rb') as f:
        h.update(f.read())
    return h.hexdigest()[:12]


def main():
    bisher = {}
    if os.path.exists(ERGEBNIS):
        bisher = json.load(open(ERGEBNIS, encoding='utf-8')).get('dateien', {})
    dateien = []
    for ordner in sorted(os.listdir(BILDER)):
        if ordner.startswith('_') or not os.path.isdir(os.path.join(BILDER, ordner)):
            continue
        for name in sorted(os.listdir(os.path.join(BILDER, ordner))):
            if name.endswith('.webp'):
                dateien.append(f'{ordner}/{name}')
    print('Bilder:', len(dateien), flush=True)

    neu = {}
    offen = []
    for d in dateien:
        s = sha(os.path.join(BILDER, d))
        if d in bisher and bisher[d][0] == s:
            neu[d] = bisher[d]
        else:
            offen.append((d, s))
    print('davon neu/geändert:', len(offen), flush=True)

    if offen:
        torch.set_num_threads(6)
        proc = AutoImageProcessor.from_pretrained(MODELL)
        modell = AutoModelForObjectDetection.from_pretrained(MODELL).eval()
        pid = [i for i, n in modell.config.id2label.items() if n == 'person'][0]
        t0 = time.time()
        for i, (d, s) in enumerate(offen):
            im = Image.open(os.path.join(BILDER, d))
            if im.mode in ('RGBA', 'LA', 'P'):
                im = im.convert('RGBA')
                bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
                bg.alpha_composite(im)
                im = bg
            im = im.convert('RGB')
            eingabe = proc(images=[im], return_tensors='pt', size={'shortest_edge': 384, 'longest_edge': 640})
            with torch.no_grad():
                aus = modell(**eingabe)
            p = aus.logits.softmax(-1)[..., :-1][0, :, pid]
            k = p.argmax().item()
            cx, cy, w, h = aus.pred_boxes[0, k].tolist()
            aspekt = (h * im.height) / max(1e-6, w * im.width)
            neu[d] = [s, round(p[k].item(), 3), round(aspekt, 2)]
            if i % 200 == 0:
                print(f'{i + 1}/{len(offen)} {time.time() - t0:.0f}s', flush=True)

    os.makedirs(os.path.dirname(ERGEBNIS), exist_ok=True)
    with open(ERGEBNIS, 'w', encoding='utf-8') as f:
        json.dump({'regel': f'Wahrscheinlichkeit >= {SCHWELLE} und Seitenverhaeltnis {ASPEKT_MIN}-{ASPEKT_MAX}', 'dateien': neu}, f, separators=(',', ':'))
    personen = [d for d, v in neu.items() if ist_person(v[1], v[2])]
    print('FERTIG:', len(neu), 'Bilder,', len(personen), 'mit Person')
    for d in personen:
        print('  PERSON:', d, neu[d])
    sys.exit(1 if personen else 0)


if __name__ == '__main__':
    main()
