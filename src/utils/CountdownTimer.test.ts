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

  it('calls onAlert near the alert threshold', () => {
    const onAlert = vi.fn()
    // 10s timer, alert at 3s remaining → fires after ~7s
    const timer = new CountdownTimer(10, vi.fn(), vi.fn(), onAlert, 3)
    timer.start()
    vi.advanceTimersByTime(7_500)
    expect(onAlert).toHaveBeenCalled()
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
})
