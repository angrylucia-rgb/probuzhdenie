# Рисунки существ Люсии → маска частиц (RLE, как make_masks.py) + цветная картинка WebP (для цвета частиц и портрета).
# Запуск: python3 make_art.py <папка с PNG> [коды...]  → ../bio_art.js и замена масок в ../bio_masks.js
# Рисунок отличается от силуэта PhyloPic цветом: у силуэта непрозрачные пиксели почти чёрные.
import sys, os, io, re, json, base64, numpy as np
from PIL import Image, ImageFilter
SRC = sys.argv[1]; ONLY = set(sys.argv[2:])
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
OVR = json.load(open(os.path.join(HERE, "overrides.json"), encoding="utf-8")) if os.path.exists(os.path.join(HERE, "overrides.json")) else {}
def is_art(a):
    op = a[..., 3] > 200
    if op.sum() < 100: return False
    return a[..., :3][op].mean() > 40
def rle(m):
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
    # цвет непрозрачной части растекается в полупрозрачную кайму: убирает зелёный/белый ореол фона
    rgb = rgb.astype(np.float32); ok = al > 230
    for _ in range(it):
        acc = np.zeros_like(rgb); cnt = np.zeros(ok.shape, np.float32)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                s = np.roll(np.roll(ok, dy, 0), dx, 1); acc += np.roll(np.roll(rgb, dy, 0), dx, 1)*s[..., None]; cnt += s
        grow = (~ok) & (cnt > 0); rgb[grow] = acc[grow]/cnt[grow][:, None]; ok = ok | grow
    return rgb
out = {}
for f in sorted(os.listdir(SRC)):
    k = f[:-4]
    if not f.endswith(".png") or (ONLY and k not in ONLY): continue
    im = Image.open(os.path.join(SRC, f)).convert("RGBA"); a = np.array(im)
    if not is_art(a): continue
    ys, xs = np.nonzero(a[..., 3] > 128); a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    h, w = a.shape[:2]
    sc = 256/max(h, w); W, H = max(2, round(w*sc)), max(2, round(h*sc))
    m = np.array(Image.fromarray(a[..., 3]).resize((W, H), Image.LANCZOS)) > 110
    rgb = bleed(a[..., :3], a[..., 3])
    sc2 = min(1, 420/max(h, w)); W2, H2 = max(2, round(w*sc2)), max(2, round(h*sc2))
    col = Image.fromarray(np.dstack([np.clip(rgb, 0, 255).astype(np.uint8), a[..., 3]]), "RGBA").resize((W2, H2), Image.LANCZOS)
    bio = io.BytesIO(); col.save(bio, "WEBP", quality=82, method=6)
    o = OVR.get(k, {})
    out[k] = {"m": [W, H, rle(m)], "img": "data:image/webp;base64," + base64.b64encode(bio.getvalue()).decode(), "f": o.get("face"), "a": o.get("anim")}
    print(k, (W, H), (W2, H2), len(out[k]["img"])//1024, "KB")
# bio_art.js: копим (существующие рисунки сохраняются, новые заменяют)
ap = os.path.join(SITE, "bio_art.js"); old = {}
if os.path.exists(ap):
    mm = re.search(r"const BIO_ART = (\{.*\});", open(ap, encoding="utf-8").read(), re.S); old = json.loads(mm.group(1)) if mm else {}
for k, v in out.items(): old[k] = {"img": v["img"], "f": v["f"], "a": v["a"]}
open(ap, "w", encoding="utf-8").write("// Рисунки существ «Пробуждения» (Люсия): код → { img: WebP, f: куда смотрит (1 вправо, -1 влево), a: движение }. Генератор — art/make_art.py\nconst BIO_ART = " + json.dumps(old, ensure_ascii=False, separators=(",", ":")) + ";\n")
mp = os.path.join(SITE, "bio_masks.js"); s = open(mp, encoding="utf-8").read()
for k, v in out.items():
    s, n = re.subn(r'^%s:\[\d+,\d+,"[^"]*"\],$' % k, '%s:[%d,%d,"%s"],' % (k, *v["m"]), s, count=1, flags=re.M)
    if not n: s = s.replace("const BIO_MASK = {\n", 'const BIO_MASK = {\n%s:[%d,%d,"%s"],\n' % (k, *v["m"]), 1)
open(mp, "w", encoding="utf-8").write(s)
print("art:", len(old), "· bio_art.js", os.path.getsize(ap)//1024, "KB")
