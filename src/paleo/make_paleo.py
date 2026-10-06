import base64, numpy as np, json
from recon import recon
def rle(M):
    flat = M.ravel(); runs = []; cur = False; n = 0
    for b in flat:
        if b == cur: n += 1
        else: runs.append(n); cur = b; n = 1
    runs.append(n); buf = bytearray()
    for r in runs:
        while r >= 128: buf.append((r & 127) | 128); r >>= 7
        buf.append(r)
    return base64.b64encode(bytes(buf)).decode()
out = {a: rle(recon(a)) for a in [0, 15, 50, 100, 170, 230, 270, 320]}
js = ("// Положение материков (360×180, строки с юга на север, 1 — суша): нынешние очертания материков, повёрнутые\n"
      "// палеомагнитными полюсами вращения из PmagPy (frp.get_pole; Африка + палеомагнитная рамка), см. paleo/recon.py\n"
      "const BIO_PALEO = " + json.dumps(out, separators=(",", ":")) + ";\n")
open('../bio_paleo.js', 'w').write(js); print(len(js))
