"""موسيقى خلفية مولَّدة (ملكية حرة 100% — تُصنَّع رياضيًا في كل مرة):
نغمة إلكترونية حماسية: بروَجريشن أكوردات + باص + أربيجيو + كيك + هايهات.
معايرة منخفضة لتكون خلفية تحت التعليق الصوتي دون تشتيت.
"""
import math
import wave

import numpy as np

SR = 44100
BPM = 112
BEAT = 60.0 / BPM
BAR = BEAT * 4

# أكوردات Am – F – C – G (ترددات هرتز)
PROG = [
    [220.00, 261.63, 329.63],   # Am
    [174.61, 220.00, 261.63],   # F
    [196.00, 261.63, 329.63],   # C (inversion)
    [196.00, 246.94, 293.66],   # G
]
BASS = [110.00, 87.31, 98.00, 98.00]


def _env(n, a=0.01, r=0.2):
    """غلاف هجوم/اضمحلال بسيط."""
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    na, nr = min(na, n), min(nr, n)
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def _pluck(freq, dur, vol=0.2):
    n = int(dur * SR)
    t = np.arange(n) / SR
    wavef = (np.sin(2 * math.pi * freq * t)
             + 0.45 * np.sin(2 * math.pi * freq * 2 * t)
             + 0.22 * np.sin(2 * math.pi * freq * 3 * t))
    return wavef * _env(n, 0.004, dur * 0.85) * vol


def _pad(chord, dur, vol=0.10):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for f in chord:
        out += (np.sin(2 * math.pi * f * t)
                + 0.3 * np.sin(2 * math.pi * f * 1.005 * t)
                + 0.18 * np.sin(2 * math.pi * f * 2 * t))
    lfo = 1 + 0.12 * np.sin(2 * math.pi * 0.9 * t)
    return out * _env(n, 0.4, 0.5) * lfo * vol / len(chord)


def _bass(freq, dur, vol=0.16):
    n = int(dur * SR)
    t = np.arange(n) / SR
    wavef = np.sin(2 * math.pi * freq * t) + 0.25 * np.sign(np.sin(2 * math.pi * freq * t))
    gate = (np.sin(2 * math.pi * (1 / BEAT) * t) > -0.3).astype(float)
    return wavef * _env(n, 0.005, 0.12) * gate * vol


def _kick(vol=0.34):
    n = int(0.15 * SR)
    t = np.arange(n) / SR
    freq = np.linspace(150, 40, n)
    return np.sin(2 * math.pi * freq * t) * _env(n, 0.001, 0.13) * vol


def _snare(vol=0.12):
    n = int(0.16 * SR)
    noise = np.random.default_rng().uniform(-1, 1, n)
    body = np.sin(2 * math.pi * 190 * np.arange(n) / SR) * 0.4
    sig = (noise * 0.8 + body) * _env(n, 0.001, 0.14)
    return sig * vol


def _hat(vol=0.05):
    n = int(0.04 * SR)
    noise = np.random.default_rng().uniform(-1, 1, n)
    hp = noise - np.concatenate([[0], noise[:-1]]) * 0.95  # تقريب high-pass
    return hp * _env(n, 0.001, 0.035) * vol


def render_music(duration: float, out_wav, volume: float = 1.0):
    """يولّد موسيقى 2099 ويف بطول المقطع (نبض سايد تشين + شيمر) ويكتبها WAV ستيريو."""
    n_total = int(duration * SR)
    mix = np.zeros(n_total)
    t_cursor = 0.0
    bar_i = 0
    rng = np.random.default_rng(2099)
    # منحنى نبض السايد تشين (هبوط عند كل كيك)
    pump = np.ones(n_total)
    while t_cursor < duration - 0.5:
        chord = PROG[bar_i % 4]
        bass_f = BASS[bar_i % 4]
        t0 = int(t_cursor * SR)
        # السجادة الهارمونية (تتنفس مع النبض)
        seg = _pad(chord, BAR * 0.98, vol=0.13)
        for b in range(4):
            _add(mix, _kick(), t0 + int(b * 2 * BEAT * SR) if b % 2 == 0 else t0 + int(b * BEAT * SR) * 0) if False else None
        _add(mix, seg, t0)
        # أربيجيو متلألئ 16th (شيمر أعلى أوكتاف)
        seq = [chord[0] * 2, chord[1] * 2, chord[2] * 2, chord[1] * 2,
               chord[0] * 2, chord[2] * 2, chord[1] * 2, chord[2] * 4]
        for i, f in enumerate(seq):
            _add(mix, _pluck(min(f, 1800), BEAT * 0.4, vol=0.075), t0 + int(i * BEAT * 0.5 * SR))
        # الباص + الكيك + سنير + هايهات
        for b in range(4):
            _add(mix, _bass(bass_f, BEAT * 0.95), t0 + int(b * BEAT * SR))
            _add(mix, _hat(vol=rng.uniform(0.03, 0.055)), t0 + int((b + 0.5) * BEAT * SR))
        _add(mix, _kick(), t0)
        _add(mix, _kick(), t0 + int(2 * BEAT * SR))
        _add(mix, _snare(), t0 + int(BEAT * SR))
        _add(mix, _snare(), t0 + int(3 * BEAT * SR))
        # حفر النبض عند مواضع الكيك
        for kt in (0, 2 * BEAT):
            k0 = t0 + int(kt * SR)
            dn = int(0.30 * SR)
            seg_n = min(dn, max(0, n_total - k0))
            if seg_n > 0:
                pump[k0:k0 + seg_n] *= np.linspace(0.55, 1.0, seg_n)
        t_cursor += BAR
        bar_i += 1
    mix *= pump
    # فيد ختامي
    fade = int(min(2.5, duration * 0.2) * SR)
    if fade > 0:
        mix[-fade:] *= np.linspace(1, 0, fade)
    mix[: int(0.4 * SR)] *= np.linspace(0, 1, int(0.4 * SR))
    peak = np.max(np.abs(mix)) or 1.0
    mix = mix / peak * 0.85 * volume
    # ستيريو خفيف
    right = np.roll(mix, int(0.0007 * SR))
    stereo = np.stack([mix, right], axis=1)
    pcm = (stereo * 32767).astype(np.int16)
    with wave.open(str(out_wav), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    return out_wav


def _add(mix: np.ndarray, seg: np.ndarray, at: int):
    end = min(len(mix), at + len(seg))
    if at < len(mix):
        mix[at:end] += seg[: end - at]
