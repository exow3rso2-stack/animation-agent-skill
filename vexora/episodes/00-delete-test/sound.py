# VEXORA test 00 — every sound synthesised in code (no samples). Writes audio.wav (48 kHz stereo).
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 48000; DUR = 20.4; N = int(SR * DUR)
rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)

def filt(x, kind, f, order=2): return sosfilt(butter(order, f, kind, fs=SR, output='sos'), x)
def tt(d): return np.arange(int(SR * d)) / SR
def put(x, t, g=1.0, pan=0.0):
    i = int(t * SR); x = x[:max(0, N - i)]
    L[i:i + len(x)] += x * g * np.sqrt((1 - pan) / 2) * 1.41
    R[i:i + len(x)] += x * g * np.sqrt((1 + pan) / 2) * 1.41
def adsr(n, a, r): e = np.ones(n); a = int(a * SR); r = int(r * SR); e[:a] = np.linspace(0, 1, a); e[-r:] *= np.linspace(1, 0, r); return e

# ---- sound kit
def sub_drop(d=1.2, f0=90, f1=28):
    t = tt(d); f = f1 + (f0 - f1) * np.exp(-t * 5); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 2.2) * adsr(len(t), .003, .2)
def impact(d=0.9, body=60):
    t = tt(d); n = rng.uniform(-1, 1, len(t))
    click = filt(n, 'high', 2000) * np.exp(-t * 90)
    thump = np.sin(2 * np.pi * body * t * np.exp(-t * 3)) * np.exp(-t * 6)
    tail = filt(n, 'low', 400) * np.exp(-t * 5) * .5
    return click * .6 + thump + tail
def whoosh(d=0.5, lo=300, hi=3000, rev=False):
    t = tt(d); n = rng.uniform(-1, 1, len(t)); env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
    out = np.zeros_like(n); seg = 2048
    for s in range(0, len(n), seg):
        k = s / len(n); fc = lo + (hi - lo) * (np.sin(np.pi * k))
        out[s:s + seg] = filt(n[s:s + seg], 'band', [fc * .6, min(fc * 1.6, SR / 2 - 100)])
    out *= env
    if rev: out = out * np.linspace(.2, 1, len(out)) ** 2
    return out / (np.abs(out).max() + 1e-9)
def rev_whoosh(d=0.35):
    x = whoosh(d, 400, 5000)[::-1]; return x * np.linspace(0, 1, len(x)) ** 2
def glitch(d=0.25):
    t = tt(d); out = np.zeros(len(t)); s = 0
    while s < len(t):
        l = int(SR * rng.uniform(.008, .03)); f = rng.choice([220, 440, 880, 1760, 3520])
        seg = np.sign(np.sin(2 * np.pi * f * np.arange(l) / SR)) * rng.uniform(.3, 1)
        if rng.random() < .4: seg = rng.uniform(-1, 1, l)
        out[s:s + l] = seg[:len(out[s:s + l])]; s += l + int(SR * rng.uniform(0, .01))
    return filt(out, 'high', 300) * .5
def beep(f, d=0.12):
    t = tt(d); return (np.sin(2 * np.pi * f * t) + .3 * np.sin(4 * np.pi * f * t)) * adsr(len(t), .002, .06)
def sparkle(d=0.5):
    t = tt(d); out = np.zeros(len(t))
    for k in range(18):
        s = int(rng.uniform(0, d * .8) * SR); f = rng.uniform(2500, 7000); l = int(.05 * SR)
        x = np.sin(2 * np.pi * f * np.arange(l) / SR) * np.exp(-np.arange(l) / SR * 60); out[s:s + l] += x[:len(out[s:s + l])]
    return out * .3
def splat():
    t = tt(.35); n = rng.uniform(-1, 1, len(t))
    return filt(n, 'band', [200, 1800]) * np.exp(-t * 18) + np.sin(2 * np.pi * 110 * t) * np.exp(-t * 25) * .6
def shatter(d=1.4):
    t = tt(d); out = np.zeros(len(t))
    for k in range(70):
        s = int((rng.uniform(0, .5) ** 2) * SR); f = rng.uniform(2000, 9000); l = int(rng.uniform(.03, .15) * SR)
        x = np.sin(2 * np.pi * f * np.arange(l) / SR) * np.exp(-np.arange(l) / SR * rng.uniform(25, 60)); out[s:s + l] += x[:len(out[s:s + l])] * rng.uniform(.2, .6)
    return out * .6 + filt(rng.uniform(-1, 1, len(t)), 'high', 3000) * np.exp(-t * 8) * .4
def heartbeat():
    t = tt(.5); b = np.sin(2 * np.pi * 52 * t) * np.exp(-t * 14); x = np.zeros(int(.75 * SR)); x[:len(b)] += b; x[int(.2 * SR):int(.2 * SR) + len(b)] += b * .7; return x
def riser(d):
    t = tt(d); f = 200 * 2 ** (t / d * 3); ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) * .4 + filt(rng.uniform(-1, 1, len(t)), 'high', 1500) * .5) * (t / d) ** 2
def breath(d=.6, lo=500, hi=2500):
    t = tt(d); return filt(rng.uniform(-1, 1, len(t)), 'band', [lo, hi]) * np.sin(np.pi * t / d) ** 2
def pluck(f, d=.5):
    p = int(SR / f); buf = rng.uniform(-1, 1, p); n = int(d * SR); out = np.zeros(n)
    for i in range(n): out[i] = buf[i % p]; buf[i % p] = .5 * (buf[i % p] + buf[(i + 1) % p]) * .996
    return out
note = lambda m: 440 * 2 ** ((m - 69) / 12)

# ---- room tone under everything except the darkness and the black end
room = filt(rng.uniform(-1, 1, N), 'low', 300) * .05 + np.sin(2 * np.pi * 60 * np.arange(N) / SR) * .012
room[int(12.5 * SR):int(15.0 * SR)] *= .15; room[int(19.9 * SR):] = 0
L += room; R += room

# ---- music: dark trailer score in D minor, 120 BPM, locked to the countdown grid
from scipy.signal import sawtooth, fftconvolve
ML = np.zeros(N); MR = np.zeros(N)
def mput(x, t, g=1.0, pan=0.0):
    i = int(t * SR); x = x[:max(0, N - i)]
    ML[i:i + len(x)] += x * g * np.sqrt((1 - pan) / 2) * 1.41; MR[i:i + len(x)] += x * g * np.sqrt((1 + pan) / 2) * 1.41
E8 = 0.25
def bass(m, d=.24, cut=500):
    t = tt(d); f = note(m)
    x = sawtooth(2 * np.pi * f * t) * .6 + np.sin(2 * np.pi * f / 2 * t)
    return filt(x, 'low', cut) * np.exp(-t * 7) * adsr(len(t), .004, .03)
def arp(m, d=.22, cut=2600):
    t = tt(d); f = note(m)
    x = sawtooth(2 * np.pi * f * t) + .5 * np.sign(np.sin(2 * np.pi * f * 1.003 * t))
    return filt(x, 'low', cut) * np.exp(-t * 11) * adsr(len(t), .003, .03) * .5
def strings(chord, d, cut=1800, att=.5, trem=0):
    t = tt(d); x = np.zeros(len(t))
    for m in chord:
        for c in (-8, 0, 7): x += sawtooth(2 * np.pi * note(m) * 2 ** (c / 1200) * t + m)
    x = filt(x / (3 * len(chord)), 'low', cut) * adsr(len(t), att, min(.4, d / 3))
    if trem: x *= .6 + .4 * np.sin(2 * np.pi * trem * t)
    return x
def kick():
    t = tt(.45); f = 45 + 110 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) + filt(rng.uniform(-1, 1, len(t)), 'high', 3000) * np.exp(-t * 200) * .3
def taiko():
    t = tt(1.0); f = 50 + 40 * np.exp(-t * 18)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4) + filt(rng.uniform(-1, 1, len(t)), 'band', [80, 600]) * np.exp(-t * 9) * .5
def hat():
    t = tt(.06); return filt(rng.uniform(-1, 1, len(t)), 'high', 7000) * np.exp(-t * 70) * .5
def bell(m, d=1.2):
    t = tt(d); f = note(m)
    return (np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 4)) * np.exp(-t * 2.5) * adsr(len(t), .005, .05)

Dm, Bb, Gm, A, F = [50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 52], [41, 45, 48]
BASS = {'Dm': 38, 'Bb': 34, 'Gm': 31, 'A': 33, 'F': 29}
ARP = {'Dm': [62, 65, 69, 74], 'Bb': [58, 62, 65, 70], 'Gm': [55, 58, 62, 67], 'A': [57, 61, 64, 69], 'F': [53, 57, 60, 65]}
def section(t0, t1, prog, inten, cut0=500, cut1=900):
    """8th-note ostinato from t0 to t1; chord changes every 8 eighths; inten 0..3 adds layers."""
    n = int(round((t1 - t0) / E8))
    for i in range(n):
        t = t0 + i * E8; ch = prog[(i // 8) % len(prog)]; k = i / max(1, n - 1)
        mput(bass(BASS[ch] + (12 if i % 8 == 7 else 0), cut=cut0 + (cut1 - cut0) * k), t, .55)
        if inten >= 1: mput(arp(ARP[ch][i % 4] + (12 if inten >= 3 and i % 2 else 0), cut=1800 + 1500 * k), t, .22, -.5 if i % 2 else .5)
        if inten >= 1 and i % 4 == 0: mput(kick(), t, .7)
        if inten >= 2 and i % 2 == 1: mput(hat(), t, .35, .3)
        if inten >= 2 and i % 8 == 4: mput(taiko(), t, .45)
        if inten >= 3 and i % 8 == 0: mput(strings({'Dm': Dm, 'Bb': Bb, 'Gm': Gm, 'A': A, 'F': F}[ch], 8 * E8 + .3, cut=2200, att=.15), t, .35)
# A · curiosity (press → first countdown). Grid starts on the press, so ticks land on the beat.
mput(strings([38, 45], 2.2, cut=500, att=.8), .45, .35)
section(2.4, 4.65, ['Dm', 'Bb'], 1)
# B · after the floor: low drone, then the second countdown with tighter filter
mput(strings([38, 50], 1.4, cut=400, att=.05), 4.9, .45)
section(6.6, 7.85, ['Gm'], 1, 700, 1400)
# C · zero gravity: full drive, strings enter
section(8.25, 12.25, ['Dm', 'Bb', 'Gm', 'A'], 3, 700, 1600)
# D · darkness: tremolo strings creeping up, under the heartbeat
mput(strings([62, 69, 74], 2.3, cut=1500, att=1.6, trem=11) * np.linspace(.2, 1, int(2.3 * SR)) ** 2, 12.55, .3)
# E · false relief: warm F major, bells, no drums
mput(strings([53, 57, 60, 64], 2.9, cut=1300, att=.6), 15.0, .38)
for j, m in enumerate([72, 76, 79, 77, 76, 72]): mput(bell(m), 15.15 + j * .42, .12, -.4 + .16 * j)
mput(bell(38 + 24, 1.6), 15.0, .15)
# F · the last countdown: pulse on Lumo's ticks, A-major dominant swelling, hard stop on the cut
for i in range(6):
    t = 17.9 + i * .35; mput(bass(33, .3, 600 + 200 * i), t, .6); mput(kick(), t, .6 if i % 2 == 0 else .35)
    mput(arp([57, 61, 64, 69][i % 4] + 12, cut=2500 + 400 * i), t, .2, .5 if i % 2 else -.5)
mput(strings([45, 57, 61, 64, 69], 2.0, cut=2600, att=1.5), 17.9, .45)
mput(taiko(), 18.6, .6); mput(taiko(), 19.3, .7)
mus = np.stack([ML, MR], 1)
mus[int(19.9 * SR):] = 0
# short hall reverb on the score
ir = rng.uniform(-1, 1, int(1.6 * SR)) * np.exp(-np.arange(int(1.6 * SR)) / SR * 3.2); ir = filt(ir, 'low', 5000); ir /= np.abs(ir).sum() / 6
for c in range(2): mus[:, c] = mus[:, c] * .8 + fftconvolve(mus[:, c], ir)[:N] * .35
mus[int(19.9 * SR):] *= np.linspace(1, 0, N - int(19.9 * SR))[:, None] * 0
L += mus[:, 0] * 1.1; R += mus[:, 1] * 1.1

# ---- events (times match anim.js)
PRESS, DEL_FLOOR, DEL_GRAV, DEL_LIGHT, SMASH, CUT = .40, 4.9, 8.1, 12.5, 14.9, 19.9
put(rev_whoosh(.35), PRESS - .35, .5)
for t0, g in [(PRESS, .9), (DEL_FLOOR, 1.0), (DEL_GRAV, 1.0), (DEL_LIGHT, .8)]:
    put(rev_whoosh(.3), t0 - .3, .45); put(sub_drop(), t0, g); put(glitch(), t0 + .02, .35 * g); put(beep(1760, .08), t0, .2)
put(whoosh(.25, 600, 4000), .55, .45)               # smash zoom out
put(sparkle(.5), .6, .9); put(glitch(.15), .62, .2)  # mug dissolves
put(whoosh(.25, 200, 900), 1.7, .25); put(splat(), 1.95, .7)
for t0, n in [(3.4, 3), (3.9, 2), (4.4, 1), (6.6, 3), (7.1, 2), (7.6, 1), (11.0, 3), (11.5, 2), (12.0, 1)]:
    put(beep({3: 880, 2: 988, 1: 1175}[n]), t0, .35)
put(whoosh(.3, 400, 2000), 3.0, .15)                  # shrug swish
put(sparkle(.6), DEL_FLOOR + .05, .6)                 # floor tiles dissolving
put(whoosh(.6, 2500, 300), 5.6, .7)                   # fall
put(whoosh(1.2, 150, 700), 8.4, .35, .4); put(whoosh(1.0, 200, 900), 9.5, .3, -.4)
put(impact(.5, 90), 10.4, .45)                        # grabs pedestal
for k in range(3): put(heartbeat(), 13.0 + k * .5, .6)
put(whoosh(.45, 300, 5000), 14.45, .8)
put(impact(1.2, 50), SMASH, 1.1); put(sub_drop(1.5, 70, 25), SMASH, 1.0); put(shatter(), SMASH, .8, .2)
put(breath(.7), 16.15, .25)                           # relieved exhale
put(breath(.35, 800, 3000), 17.3, .18)                # sip
put(whoosh(.35, 500, 2500), 17.45, .4, .6)            # Lumo flies in
for t0, n in [(17.9, 3), (18.6, 2), (19.3, 1)]: put(beep({3: 880, 2: 988, 1: 1175}[n], .16), t0, .45, .3)
put(impact(.4, 120), 18.62, .4)                       # smash push on "2"
put(riser(1.25), 18.65, .45)
put(whoosh(.5, 3000, 600), 19.32, .3)                 # mug slips
put(sub_drop(1.6, 80, 22), CUT, 1.2); put(impact(1.0, 40), CUT, .8)

# ---- master: soft clip, normalise for loudnorm later
mix = np.stack([L, R], 1); mix[int(CUT * SR) + int(1.0 * SR):] *= 0
mix = np.tanh(mix * 1.2) / np.tanh(1.2); mix /= np.abs(mix).max() / .9
with wave.open('audio.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())
print('audio.wav', DUR, 's')
