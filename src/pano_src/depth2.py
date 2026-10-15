# Карта глубины для панорам любого соотношения сторон: Depth Anything V2 Small (ONNX), ближе = светлее.
# Выход: <out>/<id>.webp (2560 px по ширине) и <out>/<id>_d.webp (глубина 1024 px по ширине)
# Запуск: python3 depth2.py <model.onnx> <картинка> <out> <id>
import sys, os, numpy as np, onnxruntime as ort
from PIL import Image, ImageFilter
M, SRC, OUT, ID = sys.argv[1:5]
s = ort.InferenceSession(M, providers=["CPUExecutionProvider"]); inp = s.get_inputs()[0].name
mean = np.array([.485, .456, .406], np.float32); std = np.array([.229, .224, .225], np.float32)
im = Image.open(SRC).convert("RGB"); ar = im.size[1]/im.size[0]
W = 1022; H = max(14, round(W*ar/14)*14)
a = (np.asarray(im.resize((W, H), Image.BICUBIC), np.float32)/255 - mean)/std
d = s.run(None, {inp: a.transpose(2, 0, 1)[None]})[0][0]
lo, hi = np.percentile(d, 1), np.percentile(d, 99.5); d = np.clip((d - lo)/(hi - lo), 0, 1)
Image.fromarray((d*255).astype(np.uint8)).resize((1024, round(1024*ar)), Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.2)).save(os.path.join(OUT, ID + "_d.webp"), "WEBP", quality=88)
im.resize((2560, round(2560*ar)), Image.LANCZOS).save(os.path.join(OUT, ID + ".webp"), "WEBP", quality=80, method=6)
print(ID, os.path.getsize(os.path.join(OUT, ID + ".webp"))//1024, "KB", os.path.getsize(os.path.join(OUT, ID + "_d.webp"))//1024, "KB")
