// Cinematic hero reveal sequence (time-based, independent of audio playback state).

export type Phase = 'intro' | 'brand' | 'invited' | 'title' | 'details'

const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()

// ponytail: trailer pacing tuned for slower, readable reveals; adjust seconds here if event copy changes.
export function getPhase(): { phase: Phase; t: number } {
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
  const t = (now - startedAt) / 1000
  let phase: Phase = 'intro'
  if (t >= 8.2) phase = 'details'
  else if (t >= 6.0) phase = 'title'
  else if (t >= 3.8) phase = 'invited'
  else if (t >= 1.2) phase = 'brand'
  return { phase, t }
}
