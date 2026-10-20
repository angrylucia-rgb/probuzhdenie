# Вырезает существо с ровного серого фона (рисунки Люсии из Nano Banana) → PNG с прозрачностью.
# Фон — медиана по краям кадра; прозрачность — по расстоянию цвета до фона (плавный порог);
# остаётся только самая крупная связная фигура (убирает «призраков» и пятна генератора).
# Запуск: python3 cut_bg.py <папка с jpg/png> <папка для png> [коды...]
import sys, os, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
SRC, DST = sys.argv[1], sys.argv[2]; ONLY = set(sys.argv[3:])
os.makedirs(DST, exist_ok=True)
for f in sorted(os.listdir(SRC)):
    k, ext = os.path.splitext(f)
    if ext.lower() not in (".jpg", ".jpeg", ".png") or (ONLY and k not in ONLY): continue
    im = Image.open(os.path.join(SRC, f)).convert("RGB"); a = np.asarray(im).astype(np.float32)
    h, w = a.shape[:2]
    edge = np.concatenate([a[:8].reshape(-1, 3), a[-8:].reshape(-1, 3), a[:, :8].reshape(-1, 3), a[:, -8:].reshape(-1, 3)])
    bg = np.median(edge, 0)
    # фон может быть с лёгким градиентом: сглаженная карта фона по краевым строкам/столбцам не нужна — берём
    # расстояние до медианы и до размытой версии кадра в больших пустых областях
    d = np.sqrt(((a - bg)**2).sum(-1))
    lum = a.mean(-1); dl = np.abs(lum - bg.mean())
    dist = np.maximum(d, dl*1.2)
    core = dist > 26                                   # уверенно «не фон»
    lab, n = ndimage.label(ndimage.binary_closing(core, iterations=3))
    if n == 0: print(k, "пусто"); continue
    sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1)); big = np.argmax(sizes) + 1
    keep = (lab == big) & core      # замыкание — только чтобы найти фигуру; сами щели между шипами не заливаем
    # к главной фигуре добавляем то, что касается её (тонкие когти, кончик хвоста): расширяем на 6 px
    # и берём там мягкий порог
    zone = ndimage.binary_dilation(keep, iterations=6)
    # дыры внутри тела (светлые пятна, похожие на фон) заливаем, но только небольшие и далеко от края
    holes = ndimage.binary_fill_holes(keep) & ~keep
    hl, hn = ndimage.label(holes)
    if hn:
        hs = ndimage.sum(np.ones_like(hl), hl, range(1, hn + 1))
        far = ndimage.binary_erosion(ndimage.binary_fill_holes(keep), iterations=12)
        for j in range(hn):
            r = hl == j + 1
            # заливаем только «дыры», которые по цвету заметно отличаются от фона (светлые пятна на теле);
            # просвет фона между лапой и телом остаётся прозрачным
            if hs[j] > 400 and (r & far).sum() > .5*hs[j] and dist[r].mean() > 14: keep |= r
    al = np.clip((dist - 8)/(26 - 8), 0, 1)
    al = np.where(keep, 1.0, np.where(zone, al, 0.0))
    al = np.asarray(Image.fromarray((al*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.7))).astype(np.float32)/255
    al[keep & ~ndimage.binary_dilation(~keep, iterations=2)] = 1.0
    # цвет каймы: убираем подмешанный серый фон (un-premultiply относительно фона)
    rgb = a.copy(); m = (al > .02) & (al < .98)
    rgb[m] = np.clip((a[m] - bg*(1 - al[m, None]))/np.maximum(al[m, None], .05), 0, 255)
    ys, xs = np.nonzero(al > .1); pad = 6
    y0, y1, x0, x1 = max(0, ys.min() - pad), min(h, ys.max() + pad), max(0, xs.min() - pad), min(w, xs.max() + pad)
    out = np.dstack([rgb, al*255]).astype(np.uint8)[y0:y1, x0:x1]
    Image.fromarray(out, "RGBA").save(os.path.join(DST, k + ".png"))
    print(k, (w, h), "→", (x1 - x0, y1 - y0), "фон", bg.round(), "фигур", n)
