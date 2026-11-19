import { useEffect, useMemo, useRef, useState } from "react"
import { ensureAnalyser, ensureAudioContext, ensurePlaying, getAudio, isBookingSuspended, isMuted, setMuted, setTrack, setVolume, getVolume, setOutsideClubEffect } from "../../audio"

export default function MusicPlayer() {
  const [playing, setPlaying] = useState(false)
  const [muted, setMutedState] = useState(false)
  const [needsGesture, setNeedsGesture] = useState(false)
  const [volume, setVolumeState] = useState(0.35)
  const [showVolume, setShowVolume] = useState(false)
  const startedRef = useRef(false)

  const tracks = useMemo(() => {
    const modules = import.meta.glob("/src/assets/music/*.{mp3,m4a,wav,ogg}", {
      eager: true,
      query: "?url",
      import: "default",
    }) as Record<string, string>
    return Object.entries(modules)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, url]) => url)
  }, [])

  useEffect(() => {
    if (tracks.length === 0) return
    setTrack(tracks[0])
    const a = getAudio()
    a.muted = false
    a.volume = 0.35
    setMutedState(a.muted)
    setVolumeState(getVolume())

    // Enable "outside club" muffled effect
    setOutsideClubEffect(true)

    let cancelled = false
    const sync = () => {
      if (cancelled) return
      setPlaying(!a.paused && !a.ended)
      setMutedState(isMuted())
      setVolumeState(getVolume())
    }

    const tryStart = async () => {
      if (cancelled || isBookingSuspended()) return
      const ok = await ensurePlaying()
      if (ok || !a.paused) {
        ensureAnalyser()
        startedRef.current = true
        setNeedsGesture(false)
      } else if (!startedRef.current) {
        setNeedsGesture(true)
      }
      sync()
    }

    const onVis = () => {
      if (document.visibilityState === "visible") void tryStart()
    }

    a.addEventListener("play", sync)
    a.addEventListener("pause", sync)
    a.addEventListener("volumechange", sync)
    a.addEventListener("canplay", tryStart)
    a.addEventListener("loadedmetadata", tryStart)
    window.addEventListener("pointerdown", tryStart, { passive: true })
    window.addEventListener("touchstart", tryStart, { passive: true })
    window.addEventListener("keydown", tryStart)
    document.addEventListener("visibilitychange", onVis)

    void tryStart()

    return () => {
      cancelled = true
      a.removeEventListener("play", sync)
      a.removeEventListener("pause", sync)
      a.removeEventListener("volumechange", sync)
      a.removeEventListener("canplay", tryStart)
      a.removeEventListener("loadedmetadata", tryStart)
      window.removeEventListener("pointerdown", tryStart)
      window.removeEventListener("touchstart", tryStart)
      window.removeEventListener("keydown", tryStart)
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [tracks])

  const onToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const a = getAudio()
    if (a.paused) {
      a.muted = false
      setMuted(false)
      const ok = await ensurePlaying()
      if (ok || !a.paused) {
        ensureAnalyser()
        startedRef.current = true
        setNeedsGesture(false)
      }
    } else {
      const next = !isMuted()
      setMuted(next)
      if (!next) ensureAnalyser()
    }
    setPlaying(!a.paused && !a.ended)
    setMutedState(isMuted())
    setVolumeState(getVolume())
  }

  const onVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value)
    setVolume(vol)
    setVolumeState(vol)
  }

  if (tracks.length === 0) return null

  const active = playing && !muted
  const label = active ? "Sound On" : needsGesture ? "Enable Sound" : "Sound Off"

  return (
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] right-4 z-50 pointer-events-auto flex flex-col-reverse items-end gap-2">
      {/* Volume slider - appears on hover/focus */}
      <div className={`flex items-center gap-2 bg-[#050505]/55 border border-midnight-gold/30 px-3 py-2 rounded-lg backdrop-blur-md transition-all duration-300 ${showVolume ? "opacity-100 translate-x-0 pointer-events-auto" : "opacity-0 translate-x-2 pointer-events-none"}`}>
        <span className="text-[9px] font-display uppercase tracking-[0.2em] text-midnight-ivory/70">Vol</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={onVolumeChange}
          className="w-24 h-1 appearance-none bg-midnight-muted/30 rounded accent-midnight-gold"
          aria-label="Volume"
        />
        <span className="text-[9px] font-display text-midnight-ivory/70 w-8 text-right">{Math.round(volume * 100)}%</span>
      </div>
      <button
        type="button"
        onClick={onToggle}
        onMouseEnter={() => setShowVolume(true)}
        onFocus={() => setShowVolume(true)}
        onMouseLeave={() => setShowVolume(false)}
        onBlur={() => setShowVolume(false)}
        className="flex items-center gap-2.5 border border-midnight-gold/30 bg-[#050505]/55 px-4 py-2.5 text-[9px] md:text-[10px] font-display uppercase tracking-[0.28em] text-midnight-ivory/90 backdrop-blur-md hover:border-midnight-gold/60 hover:bg-[#050505]/75 transition-colors duration-300 pl-[calc(1rem+0.28em)]"
        aria-label={label}
        aria-pressed={active}
        title={label}
      >
        <span className="relative inline-flex h-2.5 w-2.5 items-center justify-center">
          {active && <span className="absolute inline-flex h-full w-full rounded-full bg-midnight-gold/50 animate-ping" />}
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${active ? "bg-midnight-gold shadow-[0_0_10px_rgba(198,173,120,0.8)]" : "bg-midnight-muted/60"}`} />
        </span>
        {label}
      </button>
    </div>
  )
}
