# Рисунки существ (PNG с прозрачностью, после cut_bg.py) → art/img/<код>.webp + маска частиц в data/bio.json
# + запись в BIO_ART внутри base.html (мастер-исходник с v127). Запуск: python3 make_art2.py <папка png> [коды...]
import sys, os, re, json, numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
SRC = sys.argv[1]; ONLY = set(sys.argv[2:])
OVR = json.load(open(os.path.join(HERE, "overrides.json"), encoding="utf-8"))
def rle(m):
    import base64
    runs = []; cur = False; n = 0
    for b in m.ravel():
        if b == cur: n += 1
        else: runs.append(n); cur = b; n = 1
    runs.append(n); buf = bytearray()
    for r in runs:
        while r >= 128: buf.append((r & 127) | 128); r >>= 7
        buf.append(r)
    return base64.b64encode(bytes(buf)).decode()
def bleed(rgb, al, it=12):
    rgb = rgb.astype(np.float32); ok = al > 230
    for _ in range(it):
        acc = np.zeros_like(rgb); cnt = np.zeros(ok.shape, np.float32)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                s = np.roll(np.roll(ok, dy, 0), dx, 1); acc += np.roll(np.roll(rgb, dy, 0), dx, 1)*s[..., None]; cnt += s
        grow = (~ok) & (cnt > 0); rgb[grow] = acc[grow]/cnt[grow][:, None]; ok = ok | grow
    return rgb
data = json.load(open(os.path.join(SITE, "data/bio.json"), encoding="utf-8"))
base = open(os.path.join(SITE, "base.html"), encoding="utf-8").read()
m0 = re.search(r"const BIO_ART = (\{.*?\});\n", base); art = json.loads(m0.group(1))
for f in sorted(os.listdir(SRC)):
    k = f[:-4]
    if not f.endswith(".png") or (ONLY and k not in ONLY): continue
    a = np.array(Image.open(os.path.join(SRC, f)).convert("RGBA"))
    ys, xs = np.nonzero(a[..., 3] > 128); a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    h, w = a.shape[:2]
    sc = 256/max(h, w); W, H = max(2, round(w*sc)), max(2, round(h*sc))
    m = np.array(Image.fromarray(a[..., 3]).resize((W, H), Image.LANCZOS)) > 110
    rgb = bleed(a[..., :3], a[..., 3])
    # ≤ 640 px: рисунок крупнее прежних 420, на большом экране и в портрете он заметно чётче
    sc2 = min(1, 640/max(h, w)); W2, H2 = max(2, round(w*sc2)), max(2, round(h*sc2))
    col = Image.fromarray(np.dstack([np.clip(rgb, 0, 255).astype(np.uint8), a[..., 3]]), "RGBA").resize((W2, H2), Image.LANCZOS)
    os.makedirs(os.path.join(HERE, "img"), exist_ok=True)
    col.save(os.path.join(HERE, "img", k + ".webp"), "WEBP", quality=84, method=6)
    data["mask"][k] = [W, H, rle(m)]
    o = OVR.get(k, {}); art[k] = {"img": "art/img/%s.webp" % k, "f": o.get("face"), "a": o.get("anim")}
    print(k, (W, H), (W2, H2), os.path.getsize(os.path.join(HERE, "img", k + ".webp"))//1024, "KB")
json.dump(data, open(os.path.join(SITE, "data/bio.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
base = base[:m0.start(1)] + json.dumps(art, ensure_ascii=False, separators=(",", ":")) + base[m0.end(1):]
open(os.path.join(SITE, "base.html"), "w", encoding="utf-8").write(base)
print("art:", len(art))
