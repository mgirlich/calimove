import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ── Mock AudioContext ──────────────────────────────────────────────────────────

let mockCtxState = 'running'
const mockResume = vi.fn().mockResolvedValue(undefined)
const mockDecodeAudioData = vi.fn()
const mockConnect = vi.fn()
const mockStart = vi.fn()
const mockCreateBufferSource = vi.fn()

class MockAudioContext {
  get state() {
    return mockCtxState
  }
  currentTime = 0
  destination = {}
  resume = mockResume
  decodeAudioData = mockDecodeAudioData
  createBufferSource = mockCreateBufferSource
  createOscillator = vi.fn(() => ({
    connect: vi.fn(),
    frequency: { value: 0 },
    start: vi.fn(),
    stop: vi.fn(),
  }))
  createGain = vi.fn(() => ({
    connect: vi.fn(),
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
  }))
}

// ── Helpers ────────────────────────────────────────────────────────────────────

// buffer is `unknown` so tests don't need AudioBuffer casts
function makeSource(): { buffer: unknown; connect: typeof mockConnect; start: typeof mockStart } {
  return { buffer: null, connect: mockConnect, start: mockStart }
}

function mockFetch(data = new ArrayBuffer(8)) {
  return vi.fn().mockResolvedValue({ arrayBuffer: () => Promise.resolve(data) })
}

// A unique object used as a fake AudioBuffer token — identity checked via toBe()
const fakeBuffer = { _fake: true }

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('audio', () => {
  let audio: typeof import('./audio')

  beforeEach(async () => {
    mockCtxState = 'running'
    vi.clearAllMocks()
    vi.stubGlobal('AudioContext', MockAudioContext)
    vi.resetModules()
    audio = await import('./audio')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // ── unlockAudio ──────────────────────────────────────────────────────────────

  describe('unlockAudio', () => {
    it('creates the AudioContext on first call', async () => {
      const fetchMock = mockFetch()
      vi.stubGlobal('fetch', fetchMock)
      mockDecodeAudioData.mockResolvedValue(fakeBuffer)

      audio.unlockAudio()
      await audio.preloadAnnouncement(1, '/audio/Adam/1.mp3')

      expect(fetchMock).toHaveBeenCalled()
    })

    it('resumes a suspended AudioContext', () => {
      mockCtxState = 'suspended'
      audio.unlockAudio()
      expect(mockResume).toHaveBeenCalled()
    })

    it('does not resume an already running AudioContext', () => {
      audio.unlockAudio()
      expect(mockResume).not.toHaveBeenCalled()
    })
  })

  // ── preloadAnnouncement ──────────────────────────────────────────────────────

  describe('preloadAnnouncement', () => {
    it('no-ops before AudioContext is created', async () => {
      const fetchMock = mockFetch()
      vi.stubGlobal('fetch', fetchMock)

      await audio.preloadAnnouncement(1, '/audio/Adam/1.mp3')

      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('fetches, decodes, and caches audio so playAnnouncement works', async () => {
      vi.stubGlobal('fetch', mockFetch())
      mockDecodeAudioData.mockResolvedValue(fakeBuffer)
      mockCreateBufferSource.mockReturnValue(makeSource())

      audio.unlockAudio()
      await audio.preloadAnnouncement(1, '/audio/Adam/1.mp3')
      audio.playAnnouncement(1)

      expect(mockDecodeAudioData).toHaveBeenCalledOnce()
      expect(mockStart).toHaveBeenCalledOnce()
    })

    it('skips fetch when already cached', async () => {
      const fetchMock = mockFetch()
      vi.stubGlobal('fetch', fetchMock)
      mockDecodeAudioData.mockResolvedValue(fakeBuffer)

      audio.unlockAudio()
      await audio.preloadAnnouncement(1, '/audio/Adam/1.mp3')
      await audio.preloadAnnouncement(1, '/audio/Adam/1.mp3')

      expect(fetchMock).toHaveBeenCalledOnce()
    })

    it('silently ignores fetch errors', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))

      audio.unlockAudio()
      await expect(audio.preloadAnnouncement(1, '/audio/Adam/1.mp3')).resolves.toBeUndefined()
    })

    it('silently ignores decodeAudioData errors', async () => {
      vi.stubGlobal('fetch', mockFetch())
      mockDecodeAudioData.mockRejectedValue(new Error('decode failed'))

      audio.unlockAudio()
      await expect(audio.preloadAnnouncement(1, '/audio/Adam/1.mp3')).resolves.toBeUndefined()
    })
  })

  // ── playAnnouncement ─────────────────────────────────────────────────────────

  describe('playAnnouncement', () => {
    it('no-ops when AudioContext has not been created', () => {
      audio.playAnnouncement(1)
      expect(mockCreateBufferSource).not.toHaveBeenCalled()
    })

    it('no-ops when AudioContext is not running', async () => {
      mockCtxState = 'suspended'
      vi.stubGlobal('fetch', mockFetch())
      mockDecodeAudioData.mockResolvedValue(fakeBuffer)

      audio.unlockAudio()
      await audio.preloadAnnouncement(1, '/audio/Adam/1.mp3')
      audio.playAnnouncement(1)

      expect(mockStart).not.toHaveBeenCalled()
    })

    it('no-ops when buffer is not cached', () => {
      audio.unlockAudio()
      audio.playAnnouncement(999)
      expect(mockCreateBufferSource).not.toHaveBeenCalled()
    })

    it('assigns buffer, connects, and starts a BufferSource', async () => {
      const source = makeSource()
      vi.stubGlobal('fetch', mockFetch())
      mockDecodeAudioData.mockResolvedValue(fakeBuffer)
      mockCreateBufferSource.mockReturnValue(source)

      audio.unlockAudio()
      await audio.preloadAnnouncement(1, '/audio/Adam/1.mp3')
      audio.playAnnouncement(1)

      expect(source.buffer).toBe(fakeBuffer)
      expect(mockConnect).toHaveBeenCalled()
      expect(mockStart).toHaveBeenCalled()
    })
  })
})
