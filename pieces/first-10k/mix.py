"""Mix voice + music (part A, then part B from the payoff) + SFX cues (sfx.json) -> renders/mix.wav (48 kHz stereo).
Music is ducked under the voice; final loudness is set by ffmpeg loudnorm in the mux step.
usage: python3 -I mix.py   (run from the piece dir)"""
import json, subprocess, numpy as np, os

SR = 48000
V = json.load(open('voice.json'))
DUR = V['duration']
N = int(round(DUR * SR))


def load(fn, stereo=True, rate=1.0):
    ch = 2 if stereo else 1
    af = [] if rate == 1.0 else ['-af', f'asetrate={int(SR * rate)},aresample={SR}']
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', fn, *af, '-ac', str(ch), '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.float32).copy()
    return a.reshape(-1, ch) if stereo else a


def place(buf, clip, t, gain_db=0.0):
    i = int(round(t * SR))
    if i >= len(buf): return
    c = clip[max(0, -i):]
    i = max(0, i)
    n = min(len(c), len(buf) - i)
    buf[i:i + n] += c[:n] * (10 ** (gain_db / 20))


db = lambda x: 10 ** (x / 20)
voice = load('voice/voice.wav', stereo=False)[:N]
voice = np.pad(voice, (0, N - len(voice)))

# ---- music
music = np.zeros((N, 2), np.float32)
A = load('audio/partA.mp3')
fadeA = np.ones(len(A), np.float32)
s, e = int(35.6 * SR), int(37.6 * SR)            # part A thins out into the silence before the payoff
fadeA[s:e] = np.linspace(1, 0, e - s) ** 2; fadeA[e:] = 0
place(music, A * fadeA[:, None], 0.0, -1)
B = load('audio/partB2.mp3')
B_OFF = 39.75 - 1.20                              # part B's first hit (1.20 s into the file) lands on the payoff frame
place(music, B, B_OFF, -1)
# end: let part B ring, then fade with the picture
fe0, fe1 = int(74.4 * SR), N
music[fe0:fe1] *= np.linspace(1, 0, fe1 - fe0)[:, None] ** 1.5

# ducking driven by the voice envelope (attack 20 ms, release 250 ms)
env = np.abs(voice)
win = int(0.02 * SR)
env = np.convolve(env, np.ones(win) / win, mode='same')
g = np.ones(N, np.float32)
lvl = 0.0
a_att, a_rel = np.exp(-1 / (0.02 * SR)), np.exp(-1 / (0.25 * SR))
for i in range(0, N, 48):                      # 1 ms steps
    x = 1.0 if env[i] > 0.02 else 0.0
    lvl = (a_att if x > lvl else a_rel) ** 48 * (lvl - x) + x
    g[i:i + 48] = 1 - lvl * (1 - db(-7))
music *= g[:, None]

# ---- sfx
sfx = np.zeros((N, 2), np.float32)
cache = {}
for c in json.load(open('sfx.json')):
    key = (c['name'], c.get('rate', 1.0))
    if key not in cache: cache[key] = load(f"sfx/{c['name']}.mp3", rate=c.get('rate', 1.0))
    place(sfx, cache[key], c['t'], c['gain'] - 6)

mix = music * db(-4) + sfx * db(-3) + voice[:, None] * db(0)
peak = np.abs(mix).max()
print(f'peak before trim {20*np.log10(peak):.1f} dBFS')
mix *= db(-1) / peak
os.makedirs('renders', exist_ok=True)
for name, arr in [('mix', mix), ('music', music), ('sfx', sfx)]:
    a = (np.clip(arr, -1, 1) * 32767).astype('<i2')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-', f'renders/{name}.wav'], input=a.tobytes(), check=True)
print('wrote renders/mix.wav', DUR, 's')
