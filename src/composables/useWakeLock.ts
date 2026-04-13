import { ref } from 'vue'

type WakeLockType = 'screen'

interface WakeLockSentinel extends EventTarget {
  type: WakeLockType
  released: boolean
  release: () => Promise<void>
}

type NavigatorWithWakeLock = Navigator & {
  wakeLock: { request: (type: WakeLockType) => Promise<WakeLockSentinel> }
}

export function useWakeLock() {
  let wakeLock: WakeLockSentinel | null = null
  let shouldReacquire = false
  const isSupported = 'wakeLock' in navigator
  const isActive = ref(false)

  async function request(type: WakeLockType = 'screen') {
    if (!isSupported) return
    shouldReacquire = true
    wakeLock = await (navigator as NavigatorWithWakeLock).wakeLock.request(type)
    isActive.value = !wakeLock.released
  }

  async function release() {
    if (!isSupported || !wakeLock) return
    shouldReacquire = false
    await wakeLock.release()
    isActive.value = !wakeLock.released
    wakeLock = null
  }

  async function handleVisibilityChange() {
    if (document.visibilityState === 'visible' && shouldReacquire) {
      await request()
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)

  function destroy() {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }

  return { isSupported, isActive, request, release, destroy }
}
