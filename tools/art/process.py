#!/usr/bin/env python3
"""process.py — size the raw plates for the app. Art is sized to how it is drawn
(the Bee's art-slim rule): world boards and the atlas 1920 wide, postcards and eras
1280, landmarks 960, library tiles 640, WebP q78. Writes app/public/art/<name>.webp.

    python3 tools/art/process.py             # the plates
    python3 tools/art/process.py --avatars   # raw/av-<id>.png -> app/public/avatars/<id>.webp

Avatars are keyed off their flat magenta ground to alpha, trimmed, centred on a
square with a little room, and saved 384px RGBA WebP — the size and shape of
Bizzing Bee's set, whose champions-pack.py this keying follows."""
import os, sys
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
RAW, OUT = os.path.join(HERE, 'raw'), os.path.join(HERE, '..', '..', 'app', 'public', 'art')
AVOUT = os.path.join(HERE, '..', '..', 'app', 'public', 'avatars')
os.makedirs(OUT, exist_ok=True)


def avatar(src, dst, size=384):
    import numpy as np
    a = np.asarray(Image.open(src).convert('RGBA')).astype(np.float32)
    h, w = a.shape[:2]
    kc = np.median(np.stack([a[0, 0, :3], a[0, w - 1, :3], a[h - 1, 0, :3], a[h - 1, w - 1, :3]]), axis=0)
    dist = np.sqrt(((a[:, :, :3] - kc) ** 2).sum(axis=2))
    alpha = np.clip((dist - 60.0) / (145.0 - 60.0), 0, 1)
    out = a.copy(); out[:, :, 3] = alpha * 255
    edge = (alpha > 0.02) & (alpha < 0.98)          # un-premultiply the magenta fringe
    if edge.any():
        f = alpha[edge][:, None]
        out[:, :, :3][edge] = np.clip((out[:, :, :3][edge] - kc * (1 - f)) / np.maximum(f, 0.15), 0, 255)
    im = Image.fromarray(out.astype(np.uint8), 'RGBA')
    bb = im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    if bb: im = im.crop(bb)
    side = int(max(im.size) * 1.06)
    pad = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    pad.paste(im, ((side - im.width) // 2, (side - im.height) // 2), im)
    pad.resize((size, size), Image.LANCZOS).save(dst, 'WEBP', quality=90, method=6)
    # a ground that was not pure magenta keys the creature half away: a ghost.
    # A clean sticker has only its anti-aliased rim partly transparent (~1%).
    A = np.asarray(Image.open(dst).convert('RGBA'))[:, :, 3]
    ghost = float(((A > 10) & (A < 245)).mean())
    if ghost > 0.05: GHOSTS.append(f'{os.path.basename(dst)} ({ghost:.0%} half-transparent)')
    return os.path.getsize(dst)


GHOSTS = []
# Shelly (the mascot) keyed like an avatar, 512px; the app icon at the §2 sizes; the six
# living worlds' painted far planes by day and by night, 1600 wide and a 900-wide phone cut.
if '--mascot' in sys.argv:
    MOUT = os.path.join(HERE, '..', '..', 'app', 'public', 'mascot'); os.makedirs(MOUT, exist_ok=True)
    for pose in ['wave', 'cheer', 'think', 'point', 'sleep', 'oops']:
        b = avatar(os.path.join(RAW, f'mascot-{pose}.png'), os.path.join(MOUT, f'shelly-{pose}.webp'), 512); print(f'shelly {pose}: {b // 1024} KB')
    # the logo's head (standard §2: the mascot's head at 28px): her face and a slice of the globe shell
    w = Image.open(os.path.join(RAW, 'mascot-wave.png')).convert('RGB'); W0 = w.width / 1024
    hd = Image.new('RGB', (560, 560), (255, 0, 255)); hd.paste(w.crop((int(300 * W0), int(90 * W0), int(790 * W0), int(560 * W0))).resize((490, 470)), (35, 45))
    hd.save(os.path.join(RAW, 'mascot-head.png')); avatar(os.path.join(RAW, 'mascot-head.png'), os.path.join(MOUT, 'shelly-head.webp'), 128)
    PUB = os.path.join(HERE, '..', '..', 'app', 'public')
    ic = Image.open(os.path.join(RAW, 'icon.png')).convert('RGB')
    w, h = ic.size; m = int(min(w, h) * 0.035)           # the model draws a rounded tile: cut to its flat field
    ic = ic.crop((m, m, w - m, h - m)).resize((1024, 1024), Image.LANCZOS)
    ic.save(os.path.join(RAW, 'icon-1024.png'))   # the master stays with the raw art
    for n, sz in [('icon-512.png', 512), ('icon-192.png', 192), ('apple-touch-icon.png', 180)]:
        ic.resize((sz, sz), Image.LANCZOS).save(os.path.join(PUB, n), optimize=True)
    # maskable: the tile's teal, the art inside the 80% safe zone
    bg = ic.getpixel((8, 8)); mk = Image.new('RGB', (512, 512), bg); inner = ic.resize((410, 410), Image.LANCZOS); mk.paste(inner, (51, 51))
    mk.save(os.path.join(PUB, 'icon-maskable-512.png'), optimize=True)
    print('icons written'); sys.exit(1 if GHOSTS else 0) if GHOSTS else None
    if GHOSTS: print('GHOSTS', GHOSTS); sys.exit(1)
    sys.exit(0)
if '--worlds' in sys.argv:
    for f in sorted(os.listdir(RAW)):
        if not (f.startswith(('wd-', 'wn-')) and f.endswith('.png')): continue
        im = Image.open(os.path.join(RAW, f)).convert('RGB'); n = f[:-4]
        for suf, W in [('', 1600), ('-s', 900)]:
            out = os.path.join(OUT, n + suf + '.webp'); im.resize((W, round(im.height * W / im.width)), Image.LANCZOS).save(out, 'WEBP', quality=72, method=6)
            print(n + suf, os.path.getsize(out) // 1024, 'KB')
    sys.exit(0)
if '--avatars' in sys.argv:
    total = 0
    for f in sorted(os.listdir(RAW)):
        if not (f.startswith('av-') and f.endswith('.png')): continue
        n = f[3:-4]; b = avatar(os.path.join(RAW, f), os.path.join(AVOUT, n + '.webp'))
        total += b; print(f'avatar {n}: 384x384 {b // 1024} KB')
    print(f'total {total // 1024} KB')
    if GHOSTS: print('GHOSTS — repaint these (their ground was not pure magenta):', ', '.join(GHOSTS)); sys.exit(1)
    sys.exit(0)

def trim(im):
    """Cut off a painted paper border: a model sometimes frames a scene with a
    pale mat despite being told not to. Trims edge rows/columns that are pale
    and flat, never more than 9% a side."""
    import numpy as np
    a = np.asarray(im.convert('L')).astype(np.float32)
    h, w = a.shape
    flat = lambda v: v.mean() > 205 and v.std() < 22
    t = 0
    while t < h * .09 and flat(a[t]): t += 1
    b = 0
    while b < h * .09 and flat(a[h - 1 - b]): b += 1
    l = 0
    while l < w * .09 and flat(a[:, l]): l += 1
    r = 0
    while r < w * .09 and flat(a[:, w - 1 - r]): r += 1
    if t + b + l + r == 0: return im
    pad = 6 if t + b + l + r else 0     # and a little more, past the mat's soft edge
    return im.crop((l + pad * (l > 0), t + pad * (t > 0), w - r - pad * (r > 0), h - b - pad * (b > 0)))


total = 0
PREFIX = next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--prefix=')), '')   # e.g. --prefix=game- : only those
for f in sorted(os.listdir(RAW)):
    if not f.endswith('.png') or f.startswith(('av-', 'mascot-')) or not f.startswith(PREFIX): continue
    n = f[:-4]; im = trim(Image.open(os.path.join(RAW, f)).convert('RGB'))
    w = 1280 if n.startswith(('pc-', 'era-', 'hist-')) else 960 if n.startswith('lm-') else 640 if n.startswith('lib-') else 1600 if n == 'game-tradewinds' else 800 if n.startswith('game-') else 1920
    im = im.resize((w, round(w * im.height / im.width)), Image.LANCZOS)
    p = os.path.join(OUT, n + '.webp'); im.save(p, 'WEBP', quality=78, method=6)
    total += os.path.getsize(p); print(f'{n}: {im.width}x{im.height} {os.path.getsize(p)//1024} KB')
print(f'total {total//1024} KB')
