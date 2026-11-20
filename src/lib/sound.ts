/** Small sounds made in the browser, no audio files. People can turn them off. */
const KEY = 'generate.sound'

export const soundOn = (): boolean => {
  try {
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

export const setSoundOn = (on: boolean) => {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {
    /* remembered for this visit only */
  }
}

type Ctx = AudioContext
let ctx: Ctx | null = null
const audio = (): Ctx | null => {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = ctx || new AC()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function noise(a: Ctx, seconds: number): AudioBuffer {
  const buf = a.createBuffer(1, Math.ceil(a.sampleRate * seconds), a.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return buf
}

/**
 * A thermal printer: a soft motor hum with quick ticks as each line feeds, then a short tear.
 * Returns a stop function so the sound ends if the printer is closed early.
 */
export function playPrinter(seconds: number, lines: number): () => void {
  if (!soundOn()) return () => {}
  const a = audio()
  if (!a) return () => {}
  const t0 = a.currentTime + 0.05
  const out = a.createGain()
  out.gain.value = 0.5
  out.connect(a.destination)

  // motor hum
  const hum = a.createOscillator()
  hum.type = 'sawtooth'
  hum.frequency.value = 95
  const humF = a.createBiquadFilter()
  humF.type = 'lowpass'
  humF.frequency.value = 420
  const humG = a.createGain()
  humG.gain.setValueAtTime(0, t0)
  humG.gain.linearRampToValueAtTime(0.05, t0 + 0.08)
  humG.gain.setValueAtTime(0.05, t0 + seconds - 0.1)
  humG.gain.linearRampToValueAtTime(0, t0 + seconds)
  hum.connect(humF).connect(humG).connect(out)
  hum.start(t0)
  hum.stop(t0 + seconds + 0.05)

  // a tick of filtered noise for every line that feeds out
  const buf = noise(a, 0.05)
  const step = seconds / lines
  for (let i = 0; i < lines; i++) {
    const s = a.createBufferSource()
    s.buffer = buf
    const f = a.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = 2600 + Math.random() * 900
    f.Q.value = 1.4
    const g = a.createGain()
    const at = t0 + i * step
    g.gain.setValueAtTime(0, at)
    g.gain.linearRampToValueAtTime(0.32, at + 0.006)
    g.gain.exponentialRampToValueAtTime(0.001, at + 0.045)
    s.connect(f).connect(g).connect(out)
    s.start(at)
  }

  // the paper being torn off
  const tear = a.createBufferSource()
  tear.buffer = noise(a, 0.25)
  const tf = a.createBiquadFilter()
  tf.type = 'highpass'
  tf.frequency.setValueAtTime(1200, t0 + seconds + 0.1)
  tf.frequency.linearRampToValueAtTime(4200, t0 + seconds + 0.32)
  const tg = a.createGain()
  tg.gain.setValueAtTime(0, t0 + seconds + 0.1)
  tg.gain.linearRampToValueAtTime(0.22, t0 + seconds + 0.14)
  tg.gain.exponentialRampToValueAtTime(0.001, t0 + seconds + 0.34)
  tear.connect(tf).connect(tg).connect(out)
  tear.start(t0 + seconds + 0.1)

  return () => {
    try {
      out.gain.cancelScheduledValues(a.currentTime)
      out.gain.setValueAtTime(0, a.currentTime)
      out.disconnect()
    } catch {
      /* already finished */
    }
  }
}
