# Sound for "Discipline vs Motivation": an original score + synthesized SFX (skill's dsp.py / instruments.py),
# ducked under the voice, mixed to -14 LUFS with a true-peak ceiling. Times mirror story.ts / cast.ts.
import json, os, subprocess, sys
import numpy as np
from dsp import SR, TAU, ns, tt, rng, lp, hp, bp, colored, fades, place, pan, st, integrated, true_peak, write_wav, read_wav, make_ir, convolve_st
from instruments import m2f, pluck, glock, pad, snare, cymbal, timpani, brush

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FPS, TOTAL = 30, 750
DUR = TOTAL / FPS
N = ns(DUR)
CUTS = [50, 150, 192, 234, 290, 345, 440, 490, 527, 564, 600, 660]
music = np.zeros((2, N)); sfx = np.zeros((2, N))
R = rng(42)

# ---------------- music ----------------
B = 0.5  # 120 bpm
def chord(root, minor=False):
    return [root, root + (3 if minor else 4), root + 7]
# A: motivation bounce (0 - 7.8 s): C Am F G, plucked bass + offbeat plucks + glock hook + brushes
prog = [(48, False), (45, True), (41, False), (43, False)]
hook = [72, 76, 79, 76, 74, 72, 74, 76]
for bar in range(4):
    t0 = bar * 2.0
    root, mi = prog[bar]
    for k in range(4):
        tb = t0 + k * B
        place(music, pan(pluck(m2f(root - 12 + (7 if k % 2 else 0)), 0.8, R, 0.6, 0.35), -0.1), tb, 0.9)
        for n_ in chord(root + 12, mi):
            place(music, pan(pluck(m2f(n_), 0.35, R, 0.35, 0.7), 0.35), tb + B / 2, 0.5)
        place(music, pan(brush(0.45 if k % 2 else 0.3, R), 0.2), tb, 0.8)
    for k, n_ in enumerate(hook):
        if (bar * 8 + k) % 3 != 2:
            place(music, pan(glock(m2f(n_ + (0 if bar < 2 else 2) - (0 if k < 4 else 0)), 0.45, R, 1.0), -0.3), t0 + k * 0.25, 0.6)
# B: rain (7.8 - 16.3 s): minor pads + slow falling plucks
for i, (root, mi) in enumerate([(45, True), (41, False), (38, True), (40, False)]):
    t0 = 7.8 + i * 2.15
    place(music, pad([m2f(n) for n in chord(root, mi)] + [m2f(root - 12)], 2.15, 0.55, R, att=0.4, rel=0.8, warm=700), t0, 0.9)
    for k, d in enumerate([12, 7, 3 if mi else 4]):
        place(music, pan(pluck(m2f(root + d + 12), 0.3, R, 1.2, 0.3), 0.4 - 0.4 * k), t0 + 0.4 + k * 0.6, 0.5)
# C: steady climb (16.3 - 20.0 s): ostinato + soft snare, building
prog2 = [(48, False), (43, False), (45, True), (41, False)]
for i in range(8):
    t0 = 16.3 + i * B
    root, mi = prog2[(i // 2) % 4]
    for j, d in enumerate([0, 7, 12, 7]):
        place(music, pan(pluck(m2f(root + d), 0.5 + 0.03 * i, R, 0.4, 0.5), -0.25 + 0.15 * j), t0 + j * B / 4, 0.7)
    if i % 2:
        place(music, pan(snare(0.25 + 0.04 * i, R, tune=1.1, snappy=0.6), 0.1), t0, 0.45)
    place(music, pan(pluck(m2f(root - 12), 0.8, R, 0.5, 0.3), 0), t0, 0.8)
place(music, pad([m2f(n) for n in [60, 64, 67, 72]], 3.6, 0.3, R, att=1.5, rel=0.5), 16.3, 0.6)
# D: hold (20.0 - 22.0): suspended pad, tension
place(music, pad([m2f(n) for n in [53, 60, 65, 67]], 2.0, 0.5, R, att=0.3, rel=0.3), 20.0, 0.8)
for k in range(8):
    place(music, pan(pluck(m2f(67 + (k % 2) * 5), 0.3 + 0.05 * k, R, 0.3, 0.6), 0.3), 20.0 + k * 0.25, 0.45)
# E: summit (22.0 - 25 s): timpani + cymbal + C major + glock arpeggio
place(music, pan(timpani(m2f(36), 0.9, R, 2.5), 0), 21.98, 0.9)
place(music, pan(cymbal(0.55, R, 3.0), 0.2), 22.0, 0.35)
place(music, pad([m2f(n) for n in [48, 60, 64, 67, 72]], 2.4, 0.7, R, att=0.05, rel=0.6, warm=1400), 22.0, 1.0)
for k, n_ in enumerate([72, 76, 79, 84, 79, 84, 88]):
    place(music, pan(glock(m2f(n_), 0.55, R, 1.6), -0.4 + 0.12 * k), 22.0 + k * 0.17, 0.7)
music = music + 0.18 * convolve_st(music.mean(0), make_ir(1.6, 3))

# ---------------- sfx ----------------
def whoosh(dur=0.36, lo=500, hi=4000, vel=0.5):
    t = tt(dur); x = bp(R.standard_normal(len(t)), lo, hi) * np.sin(np.pi * t / dur) ** 2
    return pan(fades(x * vel), 0.0)
for f in CUTS:
    place(sfx, whoosh(vel=0.35), f / FPS - 0.18, 1.0)
# flash pop after the hook
t = tt(0.4); place(sfx, st(fades(np.sin(TAU * 1400 * t * (1 + 0.6 * t)) * np.exp(-t / 0.08) * 0.35 + hp(R.standard_normal(len(t)), 5000) * np.exp(-t / 0.05) * 0.3)), 48 / FPS, 1.0)
# camera shutter at "selfie"
for dt, g in [(0, 0.7), (0.07, 0.5)]:
    t = tt(0.05); place(sfx, pan(hp(R.standard_normal(len(t)), 2500) * np.exp(-t / 0.006) * g, 0.25), 158 / FPS + dt, 1.0)
# notes: little beeps from the headphones under shot 2 (cheap music leaking)
for k in range(10):
    t = tt(0.1); place(sfx, pan(np.sin(TAU * m2f(84 + (k * 5) % 12) * t) * np.exp(-t / 0.04) * 0.12, -0.3), 1.8 + k * 0.25, 1.0)
# Sam's footsteps (walking shots; steps on phase 0 / 0.5 of a 1 Hz cycle)
def step(vel):
    t = tt(0.12); x = lp(R.standard_normal(len(t)), 900) * np.exp(-t / 0.025) + 0.5 * bp(R.standard_normal(len(t)), 1500, 5000) * np.exp(-t / 0.01)
    return fades(x * vel)
for a, b_, v in [(192, 234, 0.35), (440, 490, 0.38), (490, 600, 0.22), (660, 662, 0.3)]:
    k0 = int(np.ceil(a / FPS * 2))
    for k in range(k0, int(b_ / FPS * 2) + 1):
        place(sfx, pan(step(v), 0.1 * (1 if k % 2 else -1)), k / 2, 1.0)
# rain bed 7.8 - 16.3 s (louder in the wide shot)
n = ns(8.9); t = np.arange(n) / SR
rain = np.stack([bp(colored(n, R, 0.6), 400, 9000), bp(colored(n, R, 0.6), 400, 9000)])
env = np.clip(t / 0.4, 0, 1) * np.clip((8.9 - t) / 0.5, 0, 1) * (0.55 + 0.2 * (t < 1.9))
drops = np.zeros(n)
for tk in R.uniform(0, 8.9, 260): i = ns(tk); m = min(n - i, 400); drops[i:i + m] += hp(R.standard_normal(m), 3000) * np.exp(-np.arange(m) / 60) * R.uniform(0.1, 0.4)
place(sfx, (rain * 0.16 + drops * 0.25) * env, 7.6, 1.0)
# thunder at "rained"
n = ns(3.0); t = np.arange(n) / SR
th = lp(colored(n, R, 2.0), 160) * (np.exp(-t / 0.9) * (1 - np.exp(-t / 0.03))) + 0.3 * bp(R.standard_normal(n), 200, 2000) * np.exp(-t / 0.08)
place(sfx, pan(th * 1.6, -0.2), 263 / FPS, 1.0)
# the star leaves: a sad falling whistle
n = ns(1.2); t = np.arange(n) / SR; f = 900 * (330 / 900) ** (t / 1.2)
place(sfx, pan(np.sin(TAU * np.cumsum(f) / SR) * np.sin(np.pi * t / 1.2) * 0.13, 0.4), 10.0, 1.0)
# crown pops on: glock ding + sparkle
place(sfx, pan(glock(m2f(88), 0.7, R, 1.4), 0.0), 11.62, 0.8)
for k in range(6): place(sfx, pan(glock(m2f(91 + 2 * k), 0.25, R, 0.5), 0.5 - 0.2 * k), 11.66 + 0.04 * k, 0.5)
# Max stands up (rustle) and walks off (squelchy steps in the rain)
place(sfx, whoosh(0.3, 300, 2500, 0.3), 12.35, 1.0)
for k in range(5): place(sfx, pan(step(0.28), -0.3), 14.1 + k * 0.42, 1.0)
# summit burst sparkle
for k in range(10): place(sfx, pan(glock(m2f(96 - k), 0.22, R, 0.6), -0.5 + 0.1 * k), 22.55 + 0.03 * k, 0.6)

# ---------------- mix ----------------
voice, _sr = read_wav(os.path.join(ROOT, "voice", "voice.wav"))
v = np.zeros((2, N)); vv = st(voice); v[:, :min(N, vv.shape[1])] = vv[:, :N]
words = json.load(open(os.path.join(ROOT, "voice", "words.json")))
# duck the music while words are spoken (-4 dB, 80 ms attack, 400 ms release)
g = np.zeros(N)
for w in words: g[ns(max(0, w["s"] - 0.08)):ns(w["e"] + 0.15)] = 1
k = np.exp(-1 / (0.15 * SR)); from scipy import signal
g = signal.lfilter([1 - k], [1, -k], g)
duck = 10 ** (-4.0 * np.clip(g, 0, 1) / 20)
vl = integrated(v)
music *= 10 ** ((vl - 10.0 - integrated(music)) / 20)  # bed ~10 LU under the voice (+3 dB on the skill's -13)
sfx *= 10 ** ((vl - 6.0 - integrated(sfx)) / 20) * 0.6
mix = v + music * duck[None] + sfx
end = np.clip((DUR - np.arange(N) / SR) / 0.8, 0, 1); mix *= end[None]
mix *= 10 ** ((-14.0 - integrated(mix)) / 20)
pk = np.abs(mix).max()
if pk > 0.89: mix = np.tanh(mix / 0.89) * 0.89
write_wav(os.path.join(HERE, "mix.wav"), mix)
print("LUFS", round(integrated(mix), 2), "TP", round(true_peak(mix), 2), "dur", mix.shape[1] / SR)
