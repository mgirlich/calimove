/**
 * A single-use countdown timer that calls back on each tick, on alert threshold, and on finish.
 * Not reactive — pair with Vue refs updated via the onTick callback.
 */
export class CountdownTimer {
  private intervalId: ReturnType<typeof setInterval> | undefined
  private timeLastUpdate = 0
  private msLeft: number
  private nextAlertAt: number
  private running = false
  private done = false
  private readonly msUpdateInterval = 100

  constructor(
    nSeconds: number,
    private readonly onFinished: () => void,
    private readonly onTick: (msLeft: number) => void,
    private readonly onAlert?: () => void,
    alertSeconds = 5,
  ) {
    this.msLeft = nSeconds * 1000
    this.nextAlertAt = alertSeconds * 1000
  }

  get isRunning() {
    return this.running
  }

  start() {
    if (this.done || this.running) return
    this.running = true
    this.timeLastUpdate = Date.now()
    this.intervalId = setInterval(() => this.tick(), this.msUpdateInterval)
  }

  pause() {
    if (this.done) return
    this.running = false
    clearInterval(this.intervalId)
    this.intervalId = undefined
  }

  toggle() {
    if (this.running) this.pause()
    else this.start()
  }

  /** Stop and clean up — call this when the timer is no longer needed. */
  destroy() {
    this.running = false
    clearInterval(this.intervalId)
    this.intervalId = undefined
  }

  private tick() {
    const now = Date.now()
    const dt = now - this.timeLastUpdate
    this.msLeft -= dt
    this.timeLastUpdate = now

    while (this.nextAlertAt >= 0 && this.msLeft <= this.nextAlertAt) {
      this.onAlert?.()
      this.nextAlertAt -= 1000
    }

    const ms = Math.max(0, this.msLeft)
    this.onTick(ms)

    if (this.msLeft <= 0) {
      this.done = true
      this.running = false
      clearInterval(this.intervalId)
      this.intervalId = undefined
      this.onFinished()
    }
  }
}
