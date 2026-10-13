# Рельеф стены: Depth Anything (крупные формы) + детали из яркости (high-pass). Выход: <id>.webp (2560) и <id>_h.webp (1280, серый)
import sys, os, numpy as np, onnxruntime as ort
from PIL import Image, ImageFilter
M="/mnt/user-data/uploads/Aweking/biosfera/depth_model.onnx"; SRC="/mnt/user-data/uploads/Aweking/biosfera/rock"; OUT="assets"
s=ort.InferenceSession(M,providers=["CPUExecutionProvider"]); inp=s.get_inputs()[0].name
mean=np.array([.485,.456,.406],np.float32); std=np.array([.229,.224,.225],np.float32)
for i in sys.argv[1:]:
    im=Image.open(f"walls/rock_{i}.jpg" if os.path.exists(f"walls/rock_{i}.jpg") else f"{SRC}/rock_{i}.jpg").convert("RGB")   # с вписанной окаменелостью, если есть
    W,H=1022,574
    a=(np.asarray(im.resize((W,H),Image.BICUBIC),np.float32)/255-mean)/std
    d=s.run(None,{inp:a.transpose(2,0,1)[None]})[0][0]
    # убрать общий наклон (стена плоская): вычесть сильно размытую версию
    D=Image.fromarray(d.astype(np.float32)).resize((1280,714),Image.BICUBIC); D=np.asarray(D,np.float32)
    from scipy.ndimage import gaussian_filter
    D=D-gaussian_filter(D,60)
    lo,hi=np.percentile(D,1),np.percentile(D,99); D=np.clip((D-lo)/(hi-lo),0,1)
    L=np.asarray(im.resize((1280,714),Image.LANCZOS).convert("L"),np.float32)/255
    Lb=np.asarray(Image.fromarray((L*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6)),np.float32)/255
    det=np.clip((L-Lb)*2.2+.5,0,1)
    h=np.clip(.72*D+.28*det,0,1)
    Image.fromarray((h*255).astype(np.uint8)).save(f"{OUT}/{i}_h.webp","WEBP",quality=90)
    im.resize((2560,1429),Image.LANCZOS).save(f"{OUT}/{i}.webp","WEBP",quality=72,method=6)
    print(i,os.path.getsize(f"{OUT}/{i}.webp")//1024,"KB",os.path.getsize(f"{OUT}/{i}_h.webp")//1024,"KB")
