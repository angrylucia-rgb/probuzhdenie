# Реконструкция положения материков по полюсам вращения PmagPy (frp.get_pole, Африка неподвижна + saf — палеомагнитная рамка)
import re, base64, sys, numpy as np
sys.path.insert(0, '/tmp/pm/x/pmagpy'); import frp
CD = '/tmp/pm/x/pmagpy-4.5.2.data/data/data_files/Continents/'
src = open('../earth_land.js').read(); b = re.search(r'EARTH_LAND_B64 = "([^"]+)"', src).group(1)
F = np.frombuffer(base64.b64decode(b), np.uint8).reshape(180, 360).astype(float)/255   # строки с юга на север
LAND = F > .5
lat = (np.arange(180) - 89.5)[:, None]*np.ones((1, 360)); lon = (np.arange(360) - 179.5)[None, :]*np.ones((180, 1))
# контуры материков для разметки плит
def outline(c):
    P = np.array([list(map(float, l.split())) for l in open(CD + c + '.asc') if l.strip()])
    return P[(np.abs(P[:, 0]) + np.abs(P[:, 1])) > .01]
def xyz(la, lo): la, lo = np.radians(la), np.radians(lo); return np.stack([np.cos(la)*np.cos(lo), np.cos(la)*np.sin(lo), np.sin(la)], -1)
PL = {'af':'af', 'nam':'nam', 'sam':'sac', 'eur':'eur', 'ind':'ind', 'aus':'aus', 'ant':'eant', 'grn':'grn'}
O = {c: xyz(*outline(c).T) for c in PL}
pts = xyz(lat[LAND], lon[LAND])
best = np.full(len(pts), -2.0); lab = np.empty(len(pts), object)
for c, V in O.items():
    m = (pts @ V.T).max(1); k = m > best; best[k] = m[k]; lab[k] = c
la_l, lo_l = lat[LAND], lon[LAND]
lab[(la_l > -26.5) & (la_l < -11.5) & (lo_l > 42.5) & (lo_l < 51) ] = 'mad'
lab[(la_l > 10) & (la_l < 32) & (lo_l > 34) & (lo_l < 60)] = 'af'   # Аравия движется с Африкой
PL['mad'] = 'mad'
def rotm(EP):
    # EP = [широта полюса, долгота полюса, угол] (так в таблицах PmagPy, вопреки докстрингу), поворот против часовой
    if not EP or EP == 'NONE' or EP[2] == 0: return np.eye(3)
    e = xyz(float(EP[0]), float(EP[1])); w = np.radians(float(EP[2])); K = np.array([[0, -e[2], e[1]], [e[2], 0, -e[0]], [-e[1], e[0], 0]])
    return np.eye(3) + np.sin(w)*K + (1 - np.cos(w))*K @ K
LABG = np.full((180, 360), '', object); LABG[LAND] = lab
OUT = xyz(lat, lon).reshape(-1, 3)
def recon(age, res=1):
    S = rotm(frp.get_pole('saf', age)) if age else np.eye(3)
    M = np.zeros(180*360, bool)
    for c, p in PL.items():
        R = rotm(frp.get_pole(p, age)) if (age and p != 'af') else np.eye(3)
        q = OUT @ (S @ R)      # обратный поворот: (S R)^T p  ==  p (S R)
        la = np.degrees(np.arcsin(np.clip(q[:, 2], -1, 1))); lo = np.degrees(np.arctan2(q[:, 1], q[:, 0]))
        yi = np.clip((la + 90).astype(int), 0, 179); xi = ((lo + 180).astype(int)) % 360
        M |= LABG[yi, xi] == c
    return M.reshape(180, 360)
if __name__ == '__main__':
    from PIL import Image
    ages = [int(a) for a in sys.argv[1:]] or [0, 100, 200, 300]
    ims = []
    for a in ages:
        M = recon(a); im = Image.fromarray((M[::-1]*230).astype(np.uint8)).resize((360, 180)); ims.append(im)
    S = Image.new('L', (360*2, 190*((len(ims) + 1)//2)), 30)
    for i, im in enumerate(ims): S.paste(im, ((i % 2)*360, (i//2)*190))
    S.save('/tmp/claude-0/-home-claude/8e619237-a42f-5f58-b36e-6509983ac9ee/scratchpad/paleo.png')
