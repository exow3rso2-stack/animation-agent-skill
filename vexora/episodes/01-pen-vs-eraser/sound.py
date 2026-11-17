# VEXORA Ep01 — voice (ElevenLabs) + synthesized dark-trailer score + SFX, ducked under the voice. Writes mix.wav.
import numpy as np, wave, subprocess
from scipy.signal import butter, sosfilt, sawtooth, fftconvolve
SR = 48000; DUR = 64.0; N = int(SR * DUR)
rng = np.random.default_rng(11)
def filt(x, kind, f, order=2): return sosfilt(butter(order, f, kind, fs=SR, output='sos'), x)
def tt(d): return np.arange(int(SR * d)) / SR
def adsr(n, a, r):
    e = np.ones(n); a = min(int(a * SR), n); r = min(int(r * SR), n)
    if a: e[:a] = np.linspace(0, 1, a)
    if r: e[-r:] *= np.linspace(1, 0, r)
    return e
note = lambda m: 440 * 2 ** ((m - 69) / 12)
class Bus:
    def __init__(s): s.L = np.zeros(N); s.R = np.zeros(N)
    def put(s, x, t, gn=1.0, pan=0.0):
        i = int(t * SR)
        if i >= N: return
        x = x[:N - i]; s.L[i:i + len(x)] += x * gn * np.sqrt((1 - pan) / 2) * 1.41; s.R[i:i + len(x)] += x * gn * np.sqrt((1 + pan) / 2) * 1.41
    def arr(s): return np.stack([s.L, s.R], 1)
MUS, SFX = Bus(), Bus()

# ---------------- instruments ----------------
def bass(m, d=.24, cut=500):
    t = tt(d); f = note(m); x = sawtooth(2 * np.pi * f * t) * .6 + np.sin(2 * np.pi * f / 2 * t)
    return filt(x, 'low', cut) * np.exp(-t * 7) * adsr(len(t), .004, .03)
def arp(m, d=.22, cut=2600):
    t = tt(d); f = note(m); x = sawtooth(2 * np.pi * f * t) + .5 * np.sign(np.sin(2 * np.pi * f * 1.003 * t))
    return filt(x, 'low', cut) * np.exp(-t * 11) * adsr(len(t), .003, .03) * .5
def strings(chord, d, cut=1800, att=.5, trem=0):
    t = tt(d); x = np.zeros(len(t))
    for m in chord:
        for c in (-8, 0, 7): x += sawtooth(2 * np.pi * note(m) * 2 ** (c / 1200) * t + m)
    x = filt(x / (3 * len(chord)), 'low', cut) * adsr(len(t), att, min(.5, d / 3))
    if trem: x *= .6 + .4 * np.sin(2 * np.pi * trem * t)
    return x
def kick():
    t = tt(.45); f = 45 + 110 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) + filt(rng.uniform(-1, 1, len(t)), 'high', 3000) * np.exp(-t * 200) * .3
def taiko():
    t = tt(1.0); f = 50 + 40 * np.exp(-t * 18)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4) + filt(rng.uniform(-1, 1, len(t)), 'band', [80, 600]) * np.exp(-t * 9) * .5
def hat(): t = tt(.06); return filt(rng.uniform(-1, 1, len(t)), 'high', 7000) * np.exp(-t * 70) * .5
def bell(m, d=1.4):
    t = tt(d); f = note(m); return (np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 4)) * np.exp(-t * 2.2) * adsr(len(t), .005, .05)
CH = {'Dm': [50, 53, 57], 'Bb': [46, 50, 53], 'Gm': [43, 46, 50], 'A': [45, 49, 52], 'F': [41, 45, 48], 'C': [48, 52, 55]}
BS = {'Dm': 38, 'Bb': 34, 'Gm': 31, 'A': 33, 'F': 29, 'C': 36}
AR = {'Dm': [62, 65, 69, 74], 'Bb': [58, 62, 65, 70], 'Gm': [55, 58, 62, 67], 'A': [57, 61, 64, 69], 'F': [53, 57, 60, 65], 'C': [55, 60, 64, 67]}
E8 = .25
def section(t0, t1, prog, inten, cut0=500, cut1=900, bar=8):
    n = int(round((t1 - t0) / E8))
    for i in range(n):
        t = t0 + i * E8; ch = prog[(i // bar) % len(prog)]; k = i / max(1, n - 1)
        MUS.put(bass(BS[ch] + (12 if i % 8 == 7 else 0), cut=cut0 + (cut1 - cut0) * k), t, .55)
        if inten >= 1: MUS.put(arp(AR[ch][i % 4] + (12 if inten >= 3 and i % 2 else 0), cut=1800 + 1500 * k), t, .2, -.5 if i % 2 else .5)
        if inten >= 1 and i % 4 == 0: MUS.put(kick(), t, .7)
        if inten >= 2 and i % 2 == 1: MUS.put(hat(), t, .3, .3)
        if inten >= 2 and i % 8 == 4: MUS.put(taiko(), t, .45)
        if inten >= 3 and i % bar == 0: MUS.put(strings(CH[ch], bar * E8 + .3, cut=2200, att=.15), t, .32)

# ---------------- score ----------------
MUS.put(strings([38, 45], 2.4, cut=450, att=.05), 0.0, .5)                 # hook drone
section(2.2, 9.7, ['Dm', 'Bb'], 1, 450, 800)                               # intro: who is Hex
section(9.85, 15.0, ['Gm', 'A'], 1, 700, 1100)                              # glove / "needs one"
section(15.05, 21.0, ['Dm', 'Bb', 'Gm', 'A'], 2, 700, 1300, bar=4)         # round 1
section(21.05, 30.25, ['Gm', 'Dm', 'Bb', 'A'], 2, 800, 1500)                # grid
MUS.put(strings([38, 50, 57], 1.3, cut=800, att=.6), 30.25, .4)             # gravity tap build
section(31.55, 37.75, ['Dm', 'Bb', 'Gm', 'A'], 3, 900, 1800, bar=4)        # wall fight
section(37.8, 45.0, ['Gm', 'A', 'Dm', 'A'], 3, 1000, 2400, bar=4)          # cages
t = tt(4.0); MUS.put(strings([45, 57, 61, 64], 4.0, cut=1600, att=2.5, trem=9) * (t / 4) ** 1.5, 45.0, .45)   # "the only thing faster"
for i in range(16): MUS.put(kick(), 45.0 + i * .25, .25 + .5 * i / 16)                                        # accelerating pulse
MUS.put(strings([38, 45, 50, 57, 62], 5.0, cut=2600, att=.05), 50.1, .5)   # freefall: wall of strings
for k in range(5): MUS.put(taiko(), 50.1 + k * .75, .55)
MUS.put(strings([46, 53, 58, 62], 3.0, cut=1400, att=.4), 55.0, .45)       # chute: Bb
MUS.put(strings([43, 50, 55, 58], 3.4, cut=1200, att=.8, trem=6), 57.85, .4)  # the choice: Gm tremolo
for j, m in enumerate([74, 72, 70, 69]): MUS.put(bell(m), 58.0 + j * .9, .14, -.3 + .2 * j)
MUS.put(strings([45, 52, 57, 61], 2.2, cut=1800, att=1.2), 61.3, .45)      # A major: unresolved
for j in range(4): MUS.put(bell(69 + 12 * (j % 2), 1.0), 61.4 + j * .5, .1)
mus = MUS.arr(); mus[int(63.45 * SR):] = 0
ir = rng.uniform(-1, 1, int(1.8 * SR)) * np.exp(-np.arange(int(1.8 * SR)) / SR * 3.0); ir = filt(ir, 'low', 5000); ir /= np.abs(ir).sum() / 6
for c in range(2): mus[:, c] = mus[:, c] * .8 + fftconvolve(mus[:, c], ir)[:N] * .35
mus[int(63.45 * SR):] = 0

# ---------------- SFX kit ----------------
def sub_drop(d=1.2, f0=90, f1=28): t = tt(d); f = f1 + (f0 - f1) * np.exp(-t * 5); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2) * adsr(len(t), .003, .2)
def impact(d=.9, body=60):
    t = tt(d); n = rng.uniform(-1, 1, len(t))
    return filt(n, 'high', 2000) * np.exp(-t * 90) * .6 + np.sin(2 * np.pi * body * t * np.exp(-t * 3)) * np.exp(-t * 6) + filt(n, 'low', 400) * np.exp(-t * 5) * .5
def whoosh(d=.5, lo=300, hi=3000):
    t = tt(d); n = rng.uniform(-1, 1, len(t)); out = np.zeros_like(n); seg = 2048
    for s in range(0, len(n), seg): k = s / len(n); fc = lo + (hi - lo) * np.sin(np.pi * k); out[s:s + seg] = filt(n[s:s + seg], 'band', [fc * .6, min(fc * 1.6, SR / 2 - 100)])
    out *= np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2; return out / (np.abs(out).max() + 1e-9)
def rev_whoosh(d=.35): x = whoosh(d, 400, 5000)[::-1]; return x * np.linspace(0, 1, len(x)) ** 2
def glitch(d=.25):
    t = tt(d); out = np.zeros(len(t)); s = 0
    while s < len(t):
        l = int(SR * rng.uniform(.008, .03)); f = rng.choice([220, 440, 880, 1760, 3520])
        seg = np.sign(np.sin(2 * np.pi * f * np.arange(l) / SR)) * rng.uniform(.3, 1)
        if rng.random() < .4: seg = rng.uniform(-1, 1, l)
        out[s:s + l] = seg[:len(out[s:s + l])]; s += l + int(SR * rng.uniform(0, .01))
    return filt(out, 'high', 300) * .5
def sparkle(d=.5, lo=2500, hi=7000, n=18):
    t = tt(d); out = np.zeros(len(t))
    for k in range(n):
        s = int(rng.uniform(0, d * .8) * SR); f = rng.uniform(lo, hi); l = int(.05 * SR)
        x = np.sin(2 * np.pi * f * np.arange(l) / SR) * np.exp(-np.arange(l) / SR * 60); out[s:s + l] += x[:len(out[s:s + l])]
    return out * .3
def pen_draw(d=.5):  # gold pen: bright scratch + rising shimmer
    t = tt(d); n = filt(rng.uniform(-1, 1, len(t)), 'band', [3000, 9000]) * (.5 + .5 * np.sin(2 * np.pi * 23 * t)) * adsr(len(t), .02, .1) * .5
    f = 900 * 2 ** (t / d); return n + np.sin(2 * np.pi * np.cumsum(f) / SR) * adsr(len(t), .05, .15) * .18 + sparkle(d, 4000, 9000, 8)
def zap(): x = np.zeros(int(.8 * SR)); a = glitch(.22) * .8; x[:len(a)] += a; b = sub_drop(.8, 120, 35) * .7; x[:len(b)] += b; c = sparkle(.6, 3000, 8000, 22); x[:len(c)] += c * 1.2; return x
def metal_slam(): t = tt(1.6); x = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * 3) for f in [180, 260, 415, 677]) * .25; return x + np.pad(impact(1.0, 45), (0, len(t) - int(1.0 * SR)))
def rewind(): t = tt(.6); f = 2400 * np.exp(-t * 5) + 300; tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * .3 * adsr(len(t), .01, .1); return tone + rev_whoosh(.6) * .6
def chute(): t = tt(.9); return filt(rng.uniform(-1, 1, len(t)), 'low', 500) * np.exp(-t * 6) * 1.2 + np.sin(2 * np.pi * 70 * t) * np.exp(-t * 8)
def heartbeat(): t = tt(.5); b = np.sin(2 * np.pi * 52 * t) * np.exp(-t * 14); x = np.zeros(int(.75 * SR)); x[:len(b)] += b; x[int(.2 * SR):int(.2 * SR) + len(b)] += b * .7; return x
def riser(d): t = tt(d); f = 200 * 2 ** (t / d * 3); return (np.sin(2 * np.pi * np.cumsum(f) / SR) * .4 + filt(rng.uniform(-1, 1, len(t)), 'high', 1500) * .5) * (t / d) ** 2
def thunder(): t = tt(3.0); return filt(rng.uniform(-1, 1, len(t)), 'low', 180) * np.exp(-t * 1.2) * adsr(len(t), .1, .5) * 1.5

# ---------------- ambience ----------------
amb = filt(rng.uniform(-1, 1, N), 'band', [800, 7000]) * .025 + filt(rng.uniform(-1, 1, N), 'low', 200) * .035   # rain + city rumble
amb[int(50.1 * SR):int(57.85 * SR)] = filt(rng.uniform(-1, 1, int(7.75 * SR)), 'band', [150, 1800]) * .22   # freefall wind
amb[int(57.85 * SR):] *= .4; amb[int(63.45 * SR):] = 0
SFX.L += amb; SFX.R += amb

# ---------------- events ----------------
for td in [0.9, 10.3, 16.35, 20.75, 28.35, 39.8, 42.3]:
    SFX.put(rev_whoosh(.25), td - .25, .35); SFX.put(zap(), td, .8)
SFX.put(whoosh(.8, 300, 3500), 0.05, .6, .6)                   # blade incoming
SFX.put(thunder(), 2.25, .5)
for td, d in [(4.3, .7), (8.0, .75), (15.1, .45), (19.1, 1.1), (21.6, .3), (36.55, .75), (38.42, .4), (39.9, .4), (42.45, .35), (54.2, .8)]: SFX.put(pen_draw(d), td, .55, .3)
SFX.put(np.pad(sparkle(.3, 1500, 4000), (0, 0)), 8.8, .7); SFX.put(impact(.8, 80), 9.35, .7); SFX.put(sparkle(.3, 4000, 9000), 9.36, .4)
for td in [11.3, 12.3, 13.3]: SFX.put(np.sin(2 * np.pi * 1400 * tt(.06)) * adsr(int(.06 * SR), .002, .03) * .5, td, .4)   # glove counter ticks
SFX.put(whoosh(.3, 800, 4000), 14.15, .35)                      # "one" flick
SFX.put(whoosh(.6, 400, 3000), 15.7, .7, -.4); SFX.put(whoosh(.6, 400, 3000), 16.25, .6, -.6)   # spears thrown
SFX.put(rewind(), 17.45, .9); SFX.put(impact(.6, 110), 17.7, .7)                                # rewind, spear sticks
for td in [19.5, 19.7, 20.25]: SFX.put(impact(.4, 140), td, .35)                                # walls lock
SFX.put(whoosh(.45, 2000, 300), 21.8, .6); SFX.put(metal_slam(), 22.25, 1.0)                    # grid slams down
for td in [24.05, 24.65, 25.15]: SFX.put(np.sin(2 * np.pi * 700 * tt(.08)) * np.exp(-tt(.08) * 40) * .6 + glitch(.08) * .5, td, .6)   # snap moves
SFX.put(whoosh(.5, 500, 2500), 26.6, .35)                                                     # Lumo flies to the anchor
SFX.put(sparkle(1.2, 2000, 6000, 40), 28.5, .6); SFX.put(metal_slam(), 28.8, .6)               # grid collapses
SFX.put(impact(1.0, 50), 30.55, 1.0); SFX.put(sub_drop(1.2, 80, 30), 30.55, .9)                # gravity tap
SFX.put(rev_whoosh(.4), 30.9, .4); SFX.put(whoosh(.5, 300, 4000), 31.2, .8); SFX.put(impact(.7, 70), 31.6, .6)   # flip
SFX.put(whoosh(.35, 600, 3000), 33.5, .5, .3); SFX.put(pen_draw(.3), 34.0, .4); SFX.put(whoosh(.3, 1200, 5000), 34.2, .5, -.3)  # wall exchange
SFX.put(impact(.5, 150), 39.0, .3)
SFX.put(riser(4.0), 45.1, .5)
SFX.put(heartbeat(), 47.6, .6); SFX.put(heartbeat(), 48.35, .7)
SFX.put(rev_whoosh(.4), 48.95, .6)
SFX.put(impact(1.4, 40), 49.35, 1.2); SFX.put(sub_drop(2.0, 70, 22), 49.35, 1.1); SFX.put(sparkle(1.0, 2500, 8000, 50), 49.4, .8)   # roof deleted
SFX.put(whoosh(1.5, 200, 1200), 50.0, .6)
SFX.put(whoosh(.4, 1500, 600), 52.6, .4)                       # grabs the pen
SFX.put(chute(), 55.0, 1.0); SFX.put(impact(.6, 90), 55.0, .5)
SFX.put(whoosh(.8, 600, 200), 55.2, .5)                        # Kip falls away
for k in range(3): SFX.put(heartbeat(), 59.0 + k * .8, .45)
SFX.put(riser(2.0), 61.4, .35)
SFX.put(sub_drop(2.0, 80, 22), 63.45, 1.1); SFX.put(impact(1.0, 40), 63.45, .8)
sfx = SFX.arr()

# ---------------- voice + ducking ----------------
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', 'voice.mp3', '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
v = np.frombuffer(raw, np.float32).astype(np.float64)
voice = np.zeros(N); voice[:min(N, len(v))] = v[:N]
voice = filt(voice, 'high', 80); voice /= np.abs(voice).max() + 1e-9
env = np.convolve(np.abs(voice), np.ones(int(.15 * SR)) / int(.15 * SR), 'same'); env = np.clip(env / (env.max() * .25), 0, 1)
duck = 1 - .55 * env                                            # music −7 dB under speech
mix = mus * duck[:, None] * .45 + sfx * .42 * (1 - .3 * env)[:, None] + np.stack([voice, voice], 1) * .95
mix[int(63.45 * SR) + int(1.6 * SR):] = 0
mix = np.tanh(mix * 1.1) / np.tanh(1.1); mix /= np.abs(mix).max() / .9
with wave.open('mix.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())
print('mix.wav ok')
vm = env > .5
r = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
print('voice', round(r(voice[vm] * .95), 1), 'music under voice', round(r((mus[:, 0] * duck * .55)[vm]), 1), 'sfx under voice', round(r((sfx[:, 0] * .5)[vm]), 1))
