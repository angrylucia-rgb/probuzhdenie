import numpy as np
from PIL import Image
MS=164; PAD=.1; OUT=1024
def to_out(v): return (v + PAD*MS)/((1+2*PAD)*MS)*OUT
res={}
for k in ['mus','org','bone']:
    im=np.array(Image.open(f'ref/{k}_cut.png')).astype(np.float32)
    a=im[...,3]
    if k=='bone':
        # убрать тень пола: серые полупрозрачные пиксели
        r,g,b=im[...,0],im[...,1],im[...,2]
        warm=r-b; lum=(r+g+b)/3
        shadow=(a<235)&(warm<10)
        a=np.where(shadow, a*np.clip((warm-2)/8,0,1)*0.5, a)
        im[...,3]=a
    ys,xs=np.nonzero(a>200)
    x0,x1,y0,y1=xs.min(),xs.max(),ys.min(),ys.max()
    s=(to_out(163)-to_out(0))/(y1-y0)
    cxo=to_out(83.5); 
    W=int(round(im.shape[1]*s)); H=int(round(im.shape[0]*s))
    sm=Image.fromarray(im.astype(np.uint8),'RGBA').resize((W,H),Image.LANCZOS)
    ox=int(round(cxo-(x0+x1)/2*s)); oy=int(round(to_out(0)-y0*s))
    can=Image.new('RGBA',(OUT,OUT),(0,0,0,0)); can.alpha_composite(sm,(ox,oy)) if ox>=0 and oy>=0 else can.paste(sm,(ox,oy),sm)
    can.save(f'ref/{k}_al.png'); res[k]=(s,ox,oy)
    print(k,'bbox',x0,x1,y0,y1,'scale',round(s,3),'off',ox,oy)
# превью с сеткой
from PIL import ImageDraw
for k in res:
    im=Image.open(f'ref/{k}_al.png'); bg=Image.new('RGBA',im.size,(8,10,20,255)); bg.alpha_composite(im)
    d=ImageDraw.Draw(bg)
    for v in range(0,OUT,50):
        d.line([(v,0),(v,OUT)],fill=(60,90,140,255) if v%100 else (90,140,200,255),width=1)
        d.line([(0,v),(OUT,v)],fill=(60,90,140,255) if v%100 else (90,140,200,255),width=1)
        if v%100==0:
            d.text((v+2,2),str(v),fill=(255,220,120,255)); d.text((2,v+2),str(v),fill=(255,220,120,255))
    bg.convert('RGB').save(f'ref/{k}_grid.png')
