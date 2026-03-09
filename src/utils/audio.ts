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
