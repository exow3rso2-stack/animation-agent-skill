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

# ---- music: curious plucks (2.0–4.8), zero-g pad (8.3–12.4), relief (15.2–17.9)
B = 60 / 104; pcache = {}
def P(m, d=.5):
    if (m, d) not in pcache: pcache[(m, d)] = pluck(note(m), d)
    return pcache[(m, d)]
seq = [62, 69, 65, 69, 62, 70, 65, 70]
t = 2.0; i = 0
while t < 4.75: put(P(seq[i % 8]), t, .22, -.3 + .6 * (i % 2)); put(P(seq[i % 8] - 24, .4), t, .12) if i % 4 == 0 else None; t += B / 2; i += 1
pad_t = tt(4.1); pad = sum(np.sin(2 * np.pi * note(m) * pad_t + np.sin(pad_t * .7 + m)) for m in [50, 57, 62, 64, 69]) * .05
pad *= adsr(len(pad_t), 1.0, .2) * (1 + .3 * np.sin(2 * np.pi * .5 * pad_t)); put(pad, 8.3, 1.0)
t = 15.25; i = 0; rel = [60, 67, 64, 67, 60, 67, 65, 69]
while t < 17.85: put(P(rel[i % 8]), t, .2, -.3 + .6 * (i % 2)); put(P(rel[i % 8] - 24, .4), t, .1) if i % 4 == 0 else None; t += B / 2; i += 1

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
