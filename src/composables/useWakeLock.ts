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
  const isSupported = 'wakeLock' in navigator
  const isActive = ref<boolean>(false)

  async function request(type: WakeLockType = 'screen') {
    if (!isSupported) return
    wakeLock = await (navigator as NavigatorWithWakeLock).wakeLock.request(type)
    isActive.value = !wakeLock.released
  }

  async function release() {
    if (!isSupported || !wakeLock) return
    await wakeLock.release()
    isActive.value = !wakeLock.released
    wakeLock = null
  }

  return { isSupported, isActive, request, release }
}
