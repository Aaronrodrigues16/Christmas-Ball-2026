// Shared audio singleton - independent of React render cycle so playback
// continues smoothly even if the 3D scene stutters or view changes.
let audio: HTMLAudioElement | null = null
let ctx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let source: MediaElementAudioSourceNode | null = null
let dataArray: Uint8Array | null = null
let timeArray: Uint8Array | null = null
let currentUrl: string | null = null
let bookingSuspend = false
let userVolume = 0.35
let autoplayAttempted = false

// Start near/after the drop and let the track continue (looping full track).
// Adjust SEGMENT_START if you want the drop earlier/later in this specific track.
export const SEGMENT_START = 70
export const SEGMENT_END = Number.POSITIVE_INFINITY

export function getAudio(): HTMLAudioElement {
  if (audio) return audio
  audio = document.createElement('audio')
  audio.preload = 'auto'
  audio.crossOrigin = 'anonymous'
  audio.loop = true
  audio.volume = userVolume
  audio.muted = false
  audio.setAttribute('playsinline', '')
  audio.setAttribute('webkit-playsinline', '')
  audio.style.display = 'none'
  document.body.appendChild(audio)

  const seekToStart = () => {
    if (!audio) return
    const dur = audio.duration
    const safeStart =
      isFinite(dur) && dur > 1 ? Math.min(SEGMENT_START, Math.max(0, dur - 1)) : SEGMENT_START
    if (audio.currentTime < safeStart - 0.25) audio.currentTime = safeStart
  }

  audio.addEventListener('loadedmetadata', seekToStart)
  audio.addEventListener('canplay', () => {
    if (!audio) return
    const dur = audio.duration
    if (!isFinite(dur) || dur <= 1) return
    if (audio.currentTime < Math.min(SEGMENT_START, dur - 1) - 0.25) {
      audio.currentTime = Math.min(SEGMENT_START, dur - 1)
    }
    if (!autoplayAttempted) {
      autoplayAttempted = true
      attemptAutoplay()
      addInteractionListener()
    }
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && audio && !audio.paused && ctx && ctx.state === 'suspended') {
      void ctx.resume().catch(() => {})
    }
  })

  return audio
}

async function attemptAutoplay() {
  if (!audio || bookingSuspend) return
  try {
    const dur = audio.duration
    if (isFinite(dur) && dur > 1) {
      const start = Math.min(SEGMENT_START, Math.max(0, dur - 1))
      if (audio.currentTime < start - 0.25) audio.currentTime = start
    } else if (audio.currentTime < SEGMENT_START - 0.25) {
      audio.currentTime = SEGMENT_START
    }
    await audio.play()
    ensureAnalyser()
    console.log('[audio] Autoplay succeeded')
  } catch (e) {
    console.log('[audio] Autoplay blocked, waiting for user interaction:', e)
    // Autoplay blocked - will need user interaction
  }
}

// Global interaction listener to start audio on first user interaction
let interactionListenerAdded = false
function addInteractionListener() {
  if (interactionListenerAdded || typeof window === 'undefined') return
  interactionListenerAdded = true
  const startOnInteraction = async () => {
    if (audio && audio.paused && !bookingSuspend) {
      try {
        const dur = audio.duration
        if (isFinite(dur) && dur > 1) {
          const start = Math.min(SEGMENT_START, Math.max(0, dur - 1))
          if (audio.currentTime < start - 0.25) audio.currentTime = start
        } else if (audio.currentTime < SEGMENT_START - 0.25) {
          audio.currentTime = SEGMENT_START
        }
        await audio.play()
        ensureAnalyser()
        console.log('[audio] Started on user interaction')
      } catch (e) {
        console.log('[audio] Interaction play failed:', e)
      }
    }
    // Remove listeners after first successful play
    if (!audio?.paused) {
      window.removeEventListener('pointerdown', startOnInteraction)
      window.removeEventListener('touchstart', startOnInteraction)
      window.removeEventListener('keydown', startOnInteraction)
      window.removeEventListener('click', startOnInteraction)
    }
  }
  window.addEventListener('pointerdown', startOnInteraction, { passive: true })
  window.addEventListener('touchstart', startOnInteraction, { passive: true })
  window.addEventListener('keydown', startOnInteraction)
  window.addEventListener('click', startOnInteraction)
}

export function setTrack(url: string) {
  const a = getAudio()
  if (currentUrl === url) return
  currentUrl = url
  a.src = url
  a.load()
}

export async function ensurePlaying(): Promise<boolean> {
  if (bookingSuspend) return false
  const a = getAudio()
  try {
    const dur = a.duration
    if (isFinite(dur) && dur > 1) {
      const start = Math.min(SEGMENT_START, Math.max(0, dur - 1))
      // Only force-seek if we're before the desired start (initial playback).
      if (a.currentTime < start - 0.25) a.currentTime = start
    } else if (a.currentTime < SEGMENT_START - 0.25) {
      a.currentTime = SEGMENT_START
    }
    await a.play()
    return true
  } catch {
    // Autoplay blocked - user interaction required
    return false
  }
}

// New function: initialize audio context without playing (for visualizer)
export async function ensureAudioContext(): Promise<boolean> {
  try {
    ensureAnalyser()
    return true
  } catch {
    return false
  }
}

export function pauseForBooking() {
  bookingSuspend = true
  if (audio) {
    audio.pause()
  }
}

export function resumeAfterBooking() {
  bookingSuspend = false
  const a = getAudio()
  if (a.paused) {
    void ensurePlaying()
  }
}

export function isBookingSuspended(): boolean {
  return bookingSuspend
}

export function isPlaying(): boolean {
  const a = audio
  return !!a && !a.paused && !a.ended
}

export function setMuted(m: boolean) {
  getAudio().muted = m
}

export function setVolume(vol: number) {
  userVolume = Math.max(0, Math.min(1, vol))
  if (audio) {
    audio.volume = userVolume
  }
}

export function getVolume(): number {
  return userVolume
}

export function ensureAnalyser() {
  if (analyser && dataArray) return
  const a = getAudio()
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext
    if (!AC) return
    if (!ctx) ctx = new AC()
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {})
    if (!source) {
      source = ctx.createMediaElementSource(a)
      
      analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.75
      
      // Connect: source -> analyser -> destination
      source.connect(analyser)
      analyser.connect(ctx.destination)
      
      dataArray = new Uint8Array(analyser.frequencyBinCount)
      timeArray = new Uint8Array(analyser.fftSize)
    }
  } catch {
    // Web Audio may fail on some browsers; audio still plays without analysis
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
