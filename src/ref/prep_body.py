import numpy as np, cv2, base64, json
from PIL import Image
MS=164; PAD=.1; OUT=1024
to_out=lambda v:(v+PAD*MS)/((1+2*PAD)*MS)*OUT
im=np.array(Image.open('ref/body.png').convert('RGBA')).astype(np.float32)
a=im[...,3]
# оставить только фигуру: самая крупная связная область
n,lab,st,_=cv2.connectedComponentsWithStats((a>20).astype(np.uint8))
big=1+np.argmax(st[1:,cv2.CC_STAT_AREA])
keep=cv2.dilate((lab==big).astype(np.uint8),np.ones((5,5),np.uint8))>0
im[...,3]=np.where(keep,a,0)
a=im[...,3]
ys,xs=np.nonzero(a>200); x0,x1,y0,y1=xs.min(),xs.max(),ys.min(),ys.max()
print('bbox',x0,x1,y0,y1)
s=(to_out(163)-to_out(0))/(y1-y0)
W=int(round(im.shape[1]*s)); H=int(round(im.shape[0]*s))
sm=Image.fromarray(im.astype(np.uint8),'RGBA').resize((W,H),Image.LANCZOS)
ox=int(round(to_out(83.5)-(x0+x1)/2*s)); oy=int(round(to_out(0)-y0*s))
can=Image.new('RGBA',(OUT,OUT),(0,0,0,0)); can.paste(sm,(ox,oy),sm)
can.save('ref/body_al.png'); can.save('ref/out/body.webp',quality=86,method=6)
# маска 164×164 в пространстве силуэта
A=np.array(can)[...,3].astype(np.float32)/255
lo,hi=to_out(0),to_out(MS)
crop=A[int(round(lo)):int(round(hi)), int(round(lo)):int(round(hi))]
m=cv2.resize(crop,(MS,MS),interpolation=cv2.INTER_AREA)>.5
yy,xx=np.nonzero(m); print('mask bbox',xx.min(),xx.max(),yy.min(),yy.max(), m.mean())
bits=np.packbits(m.astype(np.uint8).ravel())
open('mask.b64','w').write(base64.b64encode(bits.tobytes()).decode())
Image.fromarray((m*255).astype(np.uint8)).resize((328,328),Image.NEAREST).save('ref/mask_new.png')
# ось фигуры: центр головы (строки 5..25 маски)
rows=[np.nonzero(m[y])[0] for y in range(4,26)]
cx=float(np.mean([(r.min()+r.max())/2 for r in rows if len(r)]))
# чакры по точкам исходного изображения (y в пикселях 2048)
src_y={'root':1490,'sacral':1300,'solar':1060,'heart':860,'throat':570,'brow':285,'crown':92}
def to410(y): return ((y*s+oy)/OUT*((1+2*PAD)*MS)-PAD*MS)*410/MS
ch=[round(to410(src_y[k]),1) for k in ['root','sacral','solar','heart','throat','brow','crown']]
cx410=cx*410/MS
print('cx mask',round(cx,2),'cx410',round(cx410,1),'chakras410',ch)
json.dump({'cx410':round(cx410,2),'chakra':ch},open('ref/out/body_meta.json','w'))
