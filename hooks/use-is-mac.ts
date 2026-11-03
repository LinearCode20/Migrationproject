import { useSyncExternalStore } from "react"

function subscribe() {
  return () => {}
}

function getSnapshot() {
  return /mac/i.test(navigator.userAgent) && !/iphone|ipad|ipod/i.test(navigator.userAgent)
}

/**
 * Whether to spell shortcuts the Apple way. The server renders the Mac glyphs, and other
 * platforms switch to words once hydrated. The platform never changes, so nothing subscribes.
 */
export function useIsMac() {
  return useSyncExternalStore(subscribe, getSnapshot, () => true)
}
