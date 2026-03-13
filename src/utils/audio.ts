let ctx: AudioContext | null = null

/** Call this inside a user gesture handler to unlock audio on iOS Safari. */
export function unlockAudio() {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
}

/** Play a short beep. No-ops if the AudioContext is not yet running. */
export function playBeep() {
  if (!ctx || ctx.state !== 'running') return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.frequency.value = 880
  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
  osc.start()
  osc.stop(ctx.currentTime + 0.3)
}

const bufferCache = new Map<number, AudioBuffer>()

/**
 * Fetch and decode an exercise announcement MP3 into the AudioContext buffer cache.
 * Must be called after unlockAudio() so the AudioContext exists.
 */
export async function preloadAnnouncement(exerciseId: number, url: string): Promise<void> {
  if (!ctx || bufferCache.has(exerciseId)) return
  try {
    const res = await fetch(url)
    const arrayBuffer = await res.arrayBuffer()
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
    bufferCache.set(exerciseId, audioBuffer)
  } catch {
    // silently skip on network error or missing file
  }
}

/**
 * Play a pre-loaded exercise announcement. No-ops if the AudioContext is not
 * running or the buffer hasn't been preloaded yet.
 */
export function playAnnouncement(exerciseId: number): void {
  if (!ctx || ctx.state !== 'running') return
  const buffer = bufferCache.get(exerciseId)
  if (!buffer) return
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.connect(ctx.destination)
  source.start()
}
