import { useSyncExternalStore } from 'react'

const MOBILE_BREAKPOINT = 768

const subscribe = (callback: () => void) => {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

const getSnapshot = () =>
  window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches

const getServerSnapshot = () => false

export const useIsMobile = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
