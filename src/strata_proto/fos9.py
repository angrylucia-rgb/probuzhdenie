# Вписать окаменелости 12–20 в стены, рельеф (как mkh.py), миниатюра и рамка окаменелости для FOS
import sys, json, numpy as np, onnxruntime as ort
from PIL import Image, ImageFilter
from scipy.ndimage import gaussian_filter, label
U='/mnt/user-data/uploads/Aweking/biosfera/'; OUT='/home/claude/site/strata/v2/'; TH='/home/claude/site/strata/th/'
P=json.load(open(U+'fossil_crops/_places.json'))
M=U+'depth_model.onnx'; s=ort.InferenceSession(M,providers=["CPUExecutionProvider"]); inp=s.get_inputs()[0].name
mean=np.array([.485,.456,.406],np.float32); std=np.array([.229,.224,.225],np.float32)
res={}
for i in sys.argv[1:]:
    p=P[i]; x0,y0,sd=p['x0'],p['y0'],p['side']
    wall=Image.open(U+f'rock/rock_{i}.jpg').convert('RGB'); Wd,Hd=wall.size
    orig=np.asarray(wall.crop((x0,y0,x0+sd,y0+sd)),np.float32)
    ed=np.asarray(Image.open(U+'fossil_crops/'+p['file'].replace('.png','.jpg')).convert('RGB').resize((sd,sd),Image.LANCZOS),np.float32)
    yy,xx=np.mgrid[0:sd,0:sd]/(sd-1); edge=np.minimum.reduce([xx,yy,1-xx,1-yy]); ring=edge<.12
    for c in range(3):
        mo,so=orig[...,c][ring].mean(),orig[...,c][ring].std()+1e-3; me,se=ed[...,c][ring].mean(),ed[...,c][ring].std()+1e-3
        ed[...,c]=(ed[...,c]-me)*(so/se)*.5+(ed[...,c]-me)*.5+mo
    diff=np.abs(ed-orig).mean(-1)
    dm=Image.fromarray(np.clip(diff*3,0,255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(sd*.02)); dm=np.asarray(dm,np.float32)/255
    feather=np.clip((edge-.03)/.14,0,1); feather=feather*feather*(3-2*feather)
    a=np.clip(np.maximum(dm,(edge>.22)*1.0),0,1)
    a=np.asarray(Image.fromarray((a*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(sd*.015)),np.float32)/255*feather
    out=orig*(1-a[...,None])+ed*a[...,None]
    Wa=np.asarray(wall,np.float32).copy(); Wa[y0:y0+sd,x0:x0+sd]=out
    im=Image.fromarray(np.clip(Wa,0,255).astype(np.uint8)); im.save(f'walls/rock_{i}.jpg',quality=95)
    # рамка окаменелости: где правка сильно отличается от исходника (сглажено), внутри квадрата
    d2=gaussian_filter(np.abs(ed-orig).mean(-1),sd*.01)*(edge>.06)
    thr=max(18,np.percentile(d2,80)); m=d2>thr
    lab,n=label(m)
    if n:
        sz=np.bincount(lab.ravel())[1:]; keep=np.isin(lab,1+np.where(sz>sz.max()*.08)[0])
        ys,xs=np.nonzero(keep); bx0,bx1,by0,by1=xs.min(),xs.max(),ys.min(),ys.max()
    else: bx0,by0,bx1,by1=sd*.3,sd*.3,sd*.7,sd*.7
    cx=(x0+(bx0+bx1)/2)/Wd; cy=(y0+(by0+by1)/2)/Hd; bw=(bx1-bx0)/Wd; bh=(by1-by0)/Wd
    res[i]=dict(u=round(cx,3),v=round(cy,3),w=round(max(bw,.04)*1.1,3),ha=round(min(1.2,max(.25,bh/max(bw,1e-3))),2))
    # рельеф — как mkh.py
    W,H=1022,574
    x=(np.asarray(im.resize((W,H),Image.BICUBIC),np.float32)/255-mean)/std
    D=s.run(None,{inp:x.transpose(2,0,1)[None]})[0][0]
    D=np.asarray(Image.fromarray(D.astype(np.float32)).resize((1280,714),Image.BICUBIC),np.float32); D=D-gaussian_filter(D,60)
    lo,hi=np.percentile(D,1),np.percentile(D,99); D=np.clip((D-lo)/(hi-lo),0,1)
    L=np.asarray(im.resize((1280,714),Image.LANCZOS).convert("L"),np.float32)/255
    Lb=np.asarray(Image.fromarray((L*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6)),np.float32)/255
    det=np.clip((L-Lb)*2.2+.5,0,1); h=np.clip(.72*D+.28*det,0,1)
    Image.fromarray((h*255).astype(np.uint8)).save(f"{OUT}{i}_h.webp","WEBP",quality=90)
    im.resize((2560,1429),Image.LANCZOS).save(f"{OUT}{i}.webp","WEBP",quality=72,method=6)
    im.resize((160,89),Image.LANCZOS).save(f"{TH}{i}.webp","WEBP",quality=80)
    print(i,res[i],flush=True)
json.dump(res,open('fos9.json','w'))
