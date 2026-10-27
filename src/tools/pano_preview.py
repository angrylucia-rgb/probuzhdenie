# Предпросмотр расстановки существ на панораме: pano_preview.py <pano.webp> <slots.json> <out.png> [wl]
# slots: [[код, u, v, размер, направление], …]; размер — длинная сторона в долях высоты картинки;
# на суше v — уровень лап, в воде и в воздухе — центр (как в движке PIMG)
import sys, json
from PIL import Image
P = Image.open(sys.argv[1]).convert("RGBA"); S = json.load(open(sys.argv[2])); wl = float(sys.argv[4]) if len(sys.argv) > 4 else None
W, H = P.size; ART = json.load(open("/home/claude/site/art/overrides.json"))
FLY = set(json.load(open("/tmp/claude-0/fly.json"))) if len(sys.argv) > 5 else set()
import base64, numpy as np
MASK = json.load(open("/home/claude/site/data/bio.json", encoding="utf-8"))["mask"]
def sil(k):   # силуэт из маски частиц (для существ без рисунка)
    if k not in MASK: return None
    w, h, s64 = MASK[k][:3]; buf = base64.b64decode(s64); runs = []; i = 0
    while i < len(buf):
        r = 0; sh = 0
        while True:
            c = buf[i]; i += 1; r |= (c & 127) << sh; sh += 7
            if not c & 128: break
        runs.append(r)
    m = np.zeros(w*h, bool); p = 0; cur = False
    for r in runs: m[p:p + r] = cur; p += r; cur = not cur
    a = np.zeros((h, w, 4), np.uint8); a[..., :3] = 60; a[..., 3] = m.reshape(h, w)*235
    return Image.fromarray(a, "RGBA")
for k, u, v, sz, d in S:
    try: im = Image.open(f"/home/claude/site/art/img/{k}.webp").convert("RGBA")
    except Exception: im = sil(k)
    if im is None: print("нет рисунка", k); continue
    f = ART.get(k, {}).get("face", 1) or 1
    if f != d: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    L = sz*H; sc = L/max(im.size); im = im.resize((max(1, int(im.width*sc)), max(1, int(im.height*sc))))
    x = int(u*W - im.width/2); wet = wl is not None and v > wl
    y = int(v*H - im.height/2) if (wet or k in FLY) else int(v*H - im.height)
    P.alpha_composite(im, (x, y))
P.convert("RGB").resize((1400, int(1400*H/W))).save(sys.argv[3])
