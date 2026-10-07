# Карта глубины для панорам: Depth Anything V2 Small (ONNX), ближе = светлее. Выход: pano/<id>.webp (картинка 2560) и pano/<id>_d.webp (глубина 1024)
import sys, os, numpy as np, onnxruntime as ort
from PIL import Image, ImageFilter
M = sys.argv[1]; SRC = sys.argv[2]; OUT = sys.argv[3]; ids = sys.argv[4:]
s = ort.InferenceSession(M, providers=["CPUExecutionProvider"]); inp = s.get_inputs()[0].name
mean = np.array([.485, .456, .406], np.float32); std = np.array([.229, .224, .225], np.float32)
def run(im):
    W, H = 1022, 434  # кратно 14
    a = (np.asarray(im.convert("RGB").resize((W, H), Image.BICUBIC), np.float32)/255 - mean)/std
    d = s.run(None, {inp: a.transpose(2, 0, 1)[None]})[0][0]
    return d
for i in ids:
    im = Image.open(os.path.join(SRC, "pano_%s.jpg" % i)).convert("RGB")
    d = run(im)
    # две половины с перекрытием дают больше деталей: просто усредняем с полной картой — не нужно; нормируем с отсечением выбросов
    lo, hi = np.percentile(d, 1), np.percentile(d, 99.5); d = np.clip((d - lo)/(hi - lo), 0, 1)
    dm = Image.fromarray((d*255).astype(np.uint8)).resize((1024, 434), Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.2))
    dm.save(os.path.join(OUT, "%s_d.webp" % i), "WEBP", quality=88)
    im.resize((2560, round(2560*im.size[1]/im.size[0])), Image.LANCZOS).save(os.path.join(OUT, "%s.webp" % i), "WEBP", quality=80, method=6)
    print(i, os.path.getsize(os.path.join(OUT, "%s.webp" % i))//1024, "KB", os.path.getsize(os.path.join(OUT, "%s_d.webp" % i))//1024, "KB")
