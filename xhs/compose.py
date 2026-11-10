"""Compose the 1080x1920 XHS video from captured frames. usage: python3 compose.py [out.mp4] [--still t1,t2]"""
import sys, os, subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.environ.get('FONTS_DIR', os.path.join(HERE, 'fonts'))  # needs NotoSansSC-<weight>.woff
F = lambda w, s: ImageFont.truetype(os.path.join(FONTS, f'NotoSansSC-{w}.woff'), s)
W, H, FPS = 1080, 1920, 30
BG, INK, MUTE, RED, LINE = (238, 239, 241), (22, 24, 27), (120, 125, 132), (214, 24, 43), (205, 208, 212)
FY = 372  # footage top

R = 'r'
SCENES = [
    ('hook', 3, None, None, None),
    ('home', 3, '按考试范围选', '首页', [['七上期中、期末，七下期中、期末'], [('一键筛出要考的知识点', R)]]),
    ('lens', 7, '凸透镜成像', '七下 · 第2章', [[('物近像远像变大', R)], ['u < f 时成正立放大的虚像：放大镜']]),
    ('fish', 7, '光的折射 · 叉鱼', '七下 · 第2章', [['看到的鱼比真实的浅'], [('叉鱼要往下方叉', R)]]),
    ('sound', 7, '声音的传播', '七下 · 第2章', [[('真空不能传声', R)], ['声速：固体 > 液体 > 气体']]),
    ('contour', 6, '等高线地形图', '七上 · 第3章', [[('等高线越密，坡越陡', R)], ['V 字尖端指向高处的是山谷']]),
    ('eye', 6, '近视与远视', '七下 · 第2章', [[('近视戴凹透镜', R)], [('远视戴凸透镜', R)]]),
    ('sprint', 5, '考前冲刺', '游戏化', [['做考点任务，点亮星星'], [('10 题限时闯关', R)]]),
    ('end', 6, None, None, None),
]
TIPS = ['lens', 'fish', 'sound', 'contour', 'eye']
starts, t0 = {}, 0
for s in SCENES: starts[s[0]] = t0; t0 += s[1]
TOTAL = t0

def ease(x): x = max(0, min(1, x)); return 1 - (1 - x) ** 3
def frame_img(name, i):
    d = os.path.join(HERE, 'frames', name); n = len(os.listdir(d))
    return Image.open(os.path.join(d, f'{min(i, n - 1):04d}.jpg')).convert('RGB')

def draw_runs(dr, runs, y, font, cx=W // 2, red=RED):
    parts = [(p, INK) if isinstance(p, str) else (p[0], red) for p in runs]
    tw = sum(dr.textlength(t, font=font) for t, _ in parts); x = cx - tw / 2
    for t, c in parts: dr.text((x, y), t, font=font, fill=c); x += dr.textlength(t, font=font)

def alpha_paste(base, layer, a):
    if a <= 0: return
    if a >= 1: base.alpha_composite(layer); return
    l = layer.copy(); l.putalpha(l.getchannel('A').point(lambda v: int(v * a))); base.alpha_composite(l)

def footage(name, t_local):
    im = frame_img(name, int(t_local * FPS))
    return im.resize((W, int(im.height * W / im.width)))

def render(t):
    idx = max(i for i, s in enumerate(SCENES) if starts[s[0]] <= t + 1e-9)
    name, dur, title, chap, sub = SCENES[idx]; tl = t - starts[name]
    base = Image.new('RGBA', (W, H), BG + (255,)); dr = ImageDraw.Draw(base)
    fimg = footage(name, tl)
    # crossfade from previous scene's last frame during first 0.2 s
    if idx > 0 and tl < .2:
        pn, pd = SCENES[idx - 1][0], SCENES[idx - 1][1]
        fimg = Image.blend(footage(pn, pd - 1 / FPS), fimg, tl / .2)
    base.paste(fimg, (0, FY))
    dr.rectangle([0, FY, W, FY + 2], fill=LINE); dr.rectangle([0, FY + fimg.height - 2, W, FY + fimg.height], fill=LINE)
    # progress bar on top
    dr.rectangle([0, 0, int(W * t / TOTAL), 8], fill=RED)
    if name == 'hook':
        dr.rectangle([60, 120, 72, 196], fill=RED)
        dr.text((96, 118), '七年级科学 3D 实验室', font=F(800, 44), fill=INK); dr.text((96, 176), '浙教版 · 七上 + 七下 · 免费', font=F(500, 28), fill=MUTE)
        k = ease(tl / .5); card = Image.new('RGBA', (W, H), (0, 0, 0, 0)); cd = ImageDraw.Draw(card)
        y0 = 1180 + int((1 - k) * 60)
        cd.rectangle([0, y0 - 40, W, H], fill=BG + (255,))
        draw_runs(cd, ['七年级科学'], y0, F(900, 96)); draw_runs(cd, [('36 个考点', R)], y0 + 128, F(900, 120))
        draw_runs(cd, ['我做成了能动手玩的 3D 实验'], y0 + 290, F(700, 50))
        alpha_paste(base, card, k)
    elif name == 'end':
        dr.rectangle([60, 120, 72, 196], fill=RED)
        dr.text((96, 118), '七年级科学 3D 实验室', font=F(800, 44), fill=INK); dr.text((96, 176), '36 个知识点 · 108 个考点任务 · 144 道真题', font=F(500, 28), fill=MUTE)
        k = ease(tl / .6); card = Image.new('RGBA', (W, H), (0, 0, 0, 0)); cd = ImageDraw.Draw(card)
        y0 = 1060 + int((1 - k) * 60)
        cd.rectangle([0, y0 - 50, W, H], fill=BG + (245,))
        draw_runs(cd, ['免费 · 电脑和平板直接打开'], y0, F(700, 46))
        cd.rounded_rectangle([90, y0 + 84, W - 90, y0 + 214], 18, fill=RED)
        draw_runs(cd, ['g7-science.pages.dev'], y0 + 104, F(800, 70));
        cd2 = ImageDraw.Draw(card); tw = cd2.textlength('g7-science.pages.dev', font=F(800, 70))
        cd2.rounded_rectangle([90, y0 + 84, W - 90, y0 + 214], 18, fill=RED); cd2.text((W / 2 - tw / 2, y0 + 104), 'g7-science.pages.dev', font=F(800, 70), fill=(255, 255, 255))
        k2 = ease((tl - 1.2) / .5)
        if k2 > 0:
            draw_runs(cd, [('收藏', R), '起来，期末前过一遍'], y0 + 270, F(900, 64))
            draw_runs(cd, ['评论区说说：孩子哪一章最头疼？'], y0 + 380, F(500, 40))
        alpha_paste(base, card, k)
    else:
        dr.rectangle([60, 110, 72, 230], fill=RED)
        dr.text((96, 104), chap, font=F(700, 34), fill=MUTE)
        ka = ease(tl / .35); tlay = Image.new('RGBA', (W, H), (0, 0, 0, 0)); td = ImageDraw.Draw(tlay)
        td.text((96 - int((1 - ka) * 40), 150), title, font=F(900, 76), fill=INK); alpha_paste(base, tlay, ka)
        if name in TIPS:
            n = TIPS.index(name) + 1; lab = f'必考口诀 {n}/5'; f = F(800, 32); tw = dr.textlength(lab, font=f)
            dr.rounded_rectangle([W - 70 - tw - 36, 116, W - 70, 172], 28, outline=RED, width=3); dr.text((W - 70 - tw - 18, 122), lab, font=f, fill=RED)
        ks = ease((tl - .25) / .4); slay = Image.new('RGBA', (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(slay)
        y = 1420 + int((1 - ks) * 40)
        for j, line in enumerate(sub): draw_runs(sd, line, y + j * 96, F(900 if j == 0 else 700, 64 if j == 0 else 46))
        alpha_paste(base, slay, ks)
    return base.convert('RGB')

if __name__ == '__main__':
    if '--still' in sys.argv:
        for ts in sys.argv[sys.argv.index('--still') + 1].split(','):
            render(float(ts)).save(os.path.join(HERE, f'still_{ts}.png'))
        sys.exit()
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'g7-science-xhs.mp4')
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                           '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-shortest',
                           '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-movflags', '+faststart', out], stdin=subprocess.PIPE)
    for i in range(int(TOTAL * FPS)):
        ff.stdin.write(render(i / FPS).tobytes())
    ff.stdin.close(); ff.wait(); print('done', out, TOTAL)
