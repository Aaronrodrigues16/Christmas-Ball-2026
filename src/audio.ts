// Shared audio singleton - plays continuously from start on every load
let audio: HTMLAudioElement | null = null
let ctx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let source: MediaElementAudioSourceNode | null = null
let dataArray: Uint8Array | null = null
let timeArray: Uint8Array | null = null
let currentUrl: string | null = null
let autoplayAttempted = false
let interactionListenerAdded = false

export function getAudio(): HTMLAudioElement {
  if (audio) return audio
  audio = document.createElement('audio')
  audio.preload = 'auto'
  audio.crossOrigin = 'anonymous'
  audio.loop = true
  audio.volume = 0.35
  audio.muted = false
  audio.setAttribute('playsinline', '')
  audio.setAttribute('webkit-playsinline', '')
  audio.style.display = 'none'
  document.body.appendChild(audio)

  // Attempt immediate autoplay on canplay
  audio.addEventListener('canplay', () => {
    if (!audio) return
    if (!autoplayAttempted) {
      autoplayAttempted = true
      attemptAutoplay()
    }
  })

  // Retry on visibility/focus (tab switch back, page restore)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && audio && audio.paused) {
      void attemptAutoplay()
    }
  })
  window.addEventListener('focus', () => {
    if (audio && audio.paused) {
      void attemptAutoplay()
    }
  })

  return audio
}

async function attemptAutoplay() {
  if (!audio) return
  try {
    // Always reset to start on new play attempt
    audio.currentTime = 0
    await audio.play()
    ensureAnalyser()
    console.log('[audio] Playback started')
  } catch (e) {
    console.log('[audio] Autoplay blocked, waiting for first interaction')
    // Fallback: wait for first user interaction
    addInteractionListener()
  }
}

// One-time interaction listener - starts audio on first user interaction anywhere
function addInteractionListener() {
  if (interactionListenerAdded || typeof window === 'undefined') return
  interactionListenerAdded = true

  const startOnInteraction = async () => {
    if (audio && audio.paused) {
      try {
        audio.currentTime = 0
        await audio.play()
        ensureAnalyser()
        console.log('[audio] Started on user interaction')
      } catch (e) {
        console.log('[audio] Interaction play failed:', e)
      }
    }
  }

  // Attach to all common interaction events
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

// For checkout - pause during payment
export function pauseForBooking() {
  if (audio) audio.pause()
}

// For checkout - resume after payment
export function resumeAfterBooking() {
  if (audio && audio.paused) {
    void attemptAutoplay()
  }
}

export function isPlaying(): boolean {
  const a = audio
  return !!a && !a.paused && !a.ended
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
