import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CountdownTimer } from './CountdownTimer'

describe('CountdownTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts in non-running state', () => {
    const timer = new CountdownTimer(10, vi.fn(), vi.fn())
    expect(timer.isRunning).toBe(false)
    timer.destroy()
  })

  it('becomes running after start()', () => {
    const timer = new CountdownTimer(10, vi.fn(), vi.fn())
    timer.start()
    expect(timer.isRunning).toBe(true)
    timer.destroy()
  })

  it('stops when pause() is called', () => {
    const timer = new CountdownTimer(10, vi.fn(), vi.fn())
    timer.start()
    timer.pause()
    expect(timer.isRunning).toBe(false)
    timer.destroy()
  })

  it('toggles between running and paused', () => {
    const timer = new CountdownTimer(10, vi.fn(), vi.fn())
    timer.toggle()
    expect(timer.isRunning).toBe(true)
    timer.toggle()
    expect(timer.isRunning).toBe(false)
    timer.destroy()
  })

  it('calls onTick with decreasing msLeft', () => {
    const onTick = vi.fn()
    const timer = new CountdownTimer(10, vi.fn(), onTick)
    timer.start()
    vi.advanceTimersByTime(500)
    expect(onTick).toHaveBeenCalled()
    expect(onTick.mock.calls[0][0]).toBeLessThan(10_000)
    expect(onTick.mock.calls[0][0]).toBeGreaterThanOrEqual(0)
    timer.destroy()
  })

  it('calls onFinished when time runs out', () => {
    const onFinished = vi.fn()
    const timer = new CountdownTimer(5, onFinished, vi.fn())
    timer.start()
    vi.advanceTimersByTime(6_000)
    expect(onFinished).toHaveBeenCalledOnce()
    timer.destroy()
  })

  it('does not call onFinished more than once', () => {
    const onFinished = vi.fn()
    const timer = new CountdownTimer(1, onFinished, vi.fn())
    timer.start()
    vi.advanceTimersByTime(5_000)
    expect(onFinished).toHaveBeenCalledOnce()
    timer.destroy()
  })

  it('cannot be restarted after finishing', () => {
    const onFinished = vi.fn()
    const timer = new CountdownTimer(1, onFinished, vi.fn())
    timer.start()
    vi.advanceTimersByTime(2_000)
    timer.start()
    expect(onFinished).toHaveBeenCalledOnce()
    timer.destroy()
  })

  it('calls onAlert at the exact second boundary', () => {
    const onAlert = vi.fn()
    // 10s timer, alert at 3s remaining → fires at exactly 7s elapsed
    const timer = new CountdownTimer(10, vi.fn(), vi.fn(), onAlert, 3)
    timer.start()
    vi.advanceTimersByTime(6_900)
    expect(onAlert).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(onAlert).toHaveBeenCalledOnce()
    timer.destroy()
  })

  it('stops ticking after destroy()', () => {
    const onTick = vi.fn()
    const timer = new CountdownTimer(10, vi.fn(), onTick)
    timer.start()
    timer.destroy()
    const callCount = onTick.mock.calls.length
    vi.advanceTimersByTime(1_000)
    expect(onTick.mock.calls.length).toBe(callCount)
  })

  it('does not tick while paused', () => {
    const onTick = vi.fn()
    const timer = new CountdownTimer(10, vi.fn(), onTick)
    timer.start()
    vi.advanceTimersByTime(200)
    timer.pause()
    const callCount = onTick.mock.calls.length
    vi.advanceTimersByTime(1_000)
    expect(onTick.mock.calls.length).toBe(callCount)
    timer.destroy()
  })

  it('sets isRunning to false after destroy() while running', () => {
    const timer = new CountdownTimer(10, vi.fn(), vi.fn())
    timer.start()
    expect(timer.isRunning).toBe(true)
    timer.destroy()
    expect(timer.isRunning).toBe(false)
  })

  it('fires onAlert at the 0ms threshold (last beep on finish)', () => {
    const onAlert = vi.fn()
    // 5s timer, alertSeconds=3 → thresholds at 3000, 2000, 1000, 0ms remaining
    const timer = new CountdownTimer(5, vi.fn(), vi.fn(), onAlert, 3)
    timer.start()
    vi.advanceTimersByTime(5_100)
    expect(onAlert).toHaveBeenCalledTimes(4)
    timer.destroy()
  })

  it('fires all missed alerts when a single coalesced tick crosses multiple thresholds', () => {
    const onAlert = vi.fn()
    const timer = new CountdownTimer(10, vi.fn(), vi.fn(), onAlert, 3)
    // Manually position the timer just above the first alert threshold.
    // Reflect.set is used to write to private fields without unsafe type assertions.
    Reflect.set(timer, 'msLeft', 3100)
    Reflect.set(timer, 'timeLastUpdate', 0)
    // Simulate a throttled tick: dt=1700ms drops msLeft to 1400ms,
    // crossing both the 3000ms and 2000ms thresholds in one go.
    vi.spyOn(Date, 'now').mockReturnValue(1700)
    const tick = Reflect.get(timer, 'tick')
    if (typeof tick === 'function') tick.call(timer)
    vi.restoreAllMocks()
    // while loop: 1400 <= 3000 → alert (nextAlertAt=2000)
    //             1400 <= 2000 → alert (nextAlertAt=1000)
    //             1400 <= 1000 → no
    expect(onAlert).toHaveBeenCalledTimes(2)
    timer.destroy()
  })
})
