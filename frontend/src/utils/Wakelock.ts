import { ref } from 'vue'

// https://vueuse.org/core/useWakeLock/
// https://github.com/vueuse/vueuse/blob/main/packages/core/useWakeLock/index.ts
type WakeLockType = 'screen'

export interface WakeLockSentinel extends EventTarget {
  type: WakeLockType
  released: boolean
  release: () => Promise<void>
}

type NavigatorWithWakeLock = Navigator & {
  wakeLock: { request: (type: WakeLockType) => Promise<WakeLockSentinel> }
}

export function useWakeLock() {
  let wakeLock: WakeLockSentinel | null
  const isSupported = navigator && 'wakeLock' in navigator
  const isActive = ref(false)

  // TODO is any of this needed?
  // async function onVisibilityChange() {
  //   if (!isSupported || !wakeLock)
  //     return

  //   if (document && document.visibilityState === 'visible')
  //     wakeLock = await navigator.wakeLock.request('screen');

  //   isActive.value = !wakeLock.released
  // }

  // TODO
  // if (document)
  //   useEventListener(document, 'visibilitychange', onVisibilityChange, { passive: true })

  async function request(type: WakeLockType = 'screen') {
    if (!isSupported)
      return
    wakeLock = await (navigator as NavigatorWithWakeLock).wakeLock.request(type)
    isActive.value = !wakeLock.released
  }

  async function release() {
    if (!isSupported || !wakeLock)
      return
    await wakeLock.release()
    isActive.value = !wakeLock.released
    wakeLock = null
  }

  return {
    isSupported,
    isActive,
    request,
    release,
  }
}

export type UseWakeLockReturn = ReturnType<typeof useWakeLock>
