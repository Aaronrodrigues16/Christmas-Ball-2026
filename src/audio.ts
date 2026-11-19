// Single controller for the site's background track.
// - A full page load/refresh resets playback to 0 and the track loops forever.
// - Playback is attempted immediately; if the browser blocks unmuted autoplay,
//   the first interaction anywhere on the page unlocks it.
// - There is no pause/mute control: once started, the music keeps playing.

let audio: HTMLAudioElement | null = null
let ctx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let source: MediaElementAudioSourceNode | null = null
let dataArray: Uint8Array | null = null
let currentUrl: string | null = null
let started = false
let unlockHandler: (() => void) | null = null

const UNLOCK_EVENTS = ['pointerdown', 'click', 'keydown', 'touchstart'] as const

export function getAudio(): HTMLAudioElement {
  if (audio) return audio
  const el = document.createElement('audio')
  el.preload = 'auto'
  el.loop = true
  el.volume = 0.35
  el.muted = false
  el.setAttribute('playsinline', '')
  el.setAttribute('webkit-playsinline', '')
  el.style.display = 'none'
  document.body.appendChild(el)
  audio = el

  // Keep the track continuous if the browser suspends it on tab/window changes.
  // No seek here - only a fresh page load resets to 0.
  const resumeIfPaused = () => {
    if (el.paused) void play()
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') resumeIfPaused()
  })
  window.addEventListener('focus', resumeIfPaused)

  return el
}

// Called once on mount (i.e. on every full load/refresh).
export function startBackgroundAudio(url: string) {
  const el = getAudio()
  if (currentUrl !== url) {
    currentUrl = url
    // Vite resolves the imported MP3 to a same-origin hashed URL, so no
    // crossOrigin attribute is needed (CORS mode can break media on some hosts).
    el.src = url
    el.load()
  }
  // Explicit reset only on load/refresh - never on retries or interactions.
  // Start at 70 seconds (1:10) on every load/refresh.
  const reset = () => {
    try {
      if (el.currentTime !== 70) el.currentTime = 70
    } catch {
      // Metadata not available yet; a fresh element already starts at 0.
    }
  }
  if (el.readyState >= el.HAVE_METADATA) reset()
  else el.addEventListener('loadedmetadata', reset, { once: true })

  void play()
}

async function play(): Promise<boolean> {
  const el = getAudio()
  try {
    await el.play()
    started = true
    removeUnlockListeners()
    // Build the analyser only after playback succeeds. Creating an AudioContext
    // before the autoplay unlock leaves it suspended, which silences the track.
    ensureAnalyser()
    if (ctx?.state === 'suspended') void ctx.resume().catch(() => {})
    return true
  } catch (error) {
    if ((error as DOMException)?.name === 'NotAllowedError') {
      console.info('[audio] Autoplay blocked - waiting for first interaction')
    } else {
      console.info('[audio] Play attempt failed - waiting for first interaction', error)
    }
    attachUnlockListeners()
    return false
  }
}

function attachUnlockListeners() {
  if (unlockHandler || started) return
  const unlock = () => {
    // Detach from every target/event first: this is a genuine one-shot unlock.
    removeUnlockListeners()
    if (audio?.paused) void play()
  }
  unlockHandler = unlock
  for (const event of UNLOCK_EVENTS) {
    window.addEventListener(event, unlock, { passive: true })
    document.addEventListener(event, unlock, { passive: true })
  }
}

function removeUnlockListeners() {
  const handler = unlockHandler
  if (!handler) return
  unlockHandler = null
  for (const event of UNLOCK_EVENTS) {
    window.removeEventListener(event, handler)
    document.removeEventListener(event, handler)
  }
}

export function isPlaying(): boolean {
  const el = audio
  return !!el && !el.paused && !el.ended
}

// Feeds the 3D scene visualisers. No-op until playback is actually unlocked.
export function ensureAnalyser() {
  if (!started || analyser || dataArray) return
  const el = getAudio()
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext
    if (!AC) return
    if (!ctx) ctx = new AC()
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {})
    if (!source) {
      source = ctx.createMediaElementSource(el)
      analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.75
      source.connect(analyser)
      analyser.connect(ctx.destination)
      dataArray = new Uint8Array(analyser.frequencyBinCount)
    }
  } catch {
    // Web Audio may be unavailable; the track still plays without analysis.
  }
}

export type AudioBands = { level: number; bass: number; mid: number; high: number; beat: number }

let prevBass = 0
let beatPulse = 0

export function getAudioBands(): AudioBands {
  if (!analyser || !dataArray) return { level: 0, bass: 0, mid: 0, high: 0, beat: 0 }
  try {
    analyser.getByteFrequencyData(dataArray as any)
    const n = dataArray.length
    const avg = (from: number, to: number) => {
      let s = 0
      const a = Math.max(0, from)
      const b = Math.min(n, to)
      if (b <= a) return 0
      for (let i = a; i < b; i++) s += dataArray![i]
      return s / ((b - a) * 255)
    }
    // fftSize 256 => ~43Hz/bin @44.1k: bass ~bins 1-4, mids ~5-20, highs ~21-64
    const bass = avg(1, 5)
    const mid = avg(5, 20)
    const high = avg(20, 64)
    const level = avg(1, 40)
    const flux = Math.max(0, bass - prevBass)
    prevBass = bass * 0.6 + prevBass * 0.4
    if (flux > 0.08) beatPulse = Math.min(1, beatPulse + flux * 3)
    beatPulse *= 0.88
    return { level, bass, mid, high, beat: beatPulse }
  } catch {
    return { level: 0, bass: 0, mid: 0, high: 0, beat: 0 }
  }
}

export function getAudioLevel(): number {
  return getAudioBands().level
}
