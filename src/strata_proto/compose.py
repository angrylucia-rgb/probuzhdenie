# Вписывает отредактированный квадрат с окаменелостью обратно в стену: подгонка цвета по краевому кольцу + мягкая маска
import sys, json, numpy as np
from PIL import Image, ImageFilter
P = json.load(open('/mnt/user-data/outputs/fossil_crops/_places.json'))
SRC = '/mnt/user-data/uploads/Aweking/biosfera/rock'; ED = '/mnt/user-data/uploads/Aweking/biosfera/fossil_crops'
for i in sys.argv[1:]:
    p = P[i]; x0, y0, sd = p['x0'], p['y0'], p['side']
    wall = Image.open(f'{SRC}/rock_{i}.jpg').convert('RGB')
    orig = np.asarray(wall.crop((x0, y0, x0 + sd, y0 + sd)), np.float32)
    ed = np.asarray(Image.open(f"{ED}/{p['file'].replace('.png', '.jpg')}").convert('RGB').resize((sd, sd), Image.LANCZOS), np.float32)
    yy, xx = np.mgrid[0:sd, 0:sd] / (sd - 1)
    edge = np.minimum.reduce([xx, yy, 1 - xx, 1 - yy])                      # 0 у края квадрата, 0,5 в центре
    ring = edge < .12
    # цвет: среднее и разброс по кольцу у края → как у исходной стены
    for c in range(3):
        mo, so = orig[..., c][ring].mean(), orig[..., c][ring].std() + 1e-3
        me, se = ed[..., c][ring].mean(), ed[..., c][ring].std() + 1e-3
        ed[..., c] = (ed[..., c] - me) * (so / se) * .5 + (ed[..., c] - me) * .5 + mo
    # маска: там, где правка заметно отличается от стены, + плавный переход к краю
    diff = np.abs(ed - orig).mean(-1)
    dm = Image.fromarray(np.clip(diff * 3, 0, 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(sd * .02))
    dm = np.asarray(dm, np.float32) / 255
    feather = np.clip((edge - .03) / .14, 0, 1); feather = feather * feather * (3 - 2 * feather)
    a = np.clip(np.maximum(dm, (edge > .22) * 1.0), 0, 1)
    a = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(sd * .015)), np.float32) / 255 * feather
    out = orig * (1 - a[..., None]) + ed * a[..., None]
    W = np.asarray(wall, np.float32).copy(); W[y0:y0 + sd, x0:x0 + sd] = out
    Image.fromarray(np.clip(W, 0, 255).astype(np.uint8)).save(f'walls/rock_{i}.jpg', quality=95)
    print(i, 'ok', 'fossil center u=%.3f v=%.3f w=%.3f' % ((x0 + sd / 2) / 2752, (y0 + sd / 2) / 1536, sd * .6 / 2752))
