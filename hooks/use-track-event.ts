"use client"

import { type TrackArgs, type TrackName, track } from "highseat"
import { isDev } from "~/env"

/**
 * Tracks an event on the client. The event names and their properties are declared once, in
 * `types/highseat.ts`.
 */
export function useTrackEvent() {
  function trackEvent<Name extends TrackName>(eventName: Name, ...args: TrackArgs<Name>) {
    if (isDev) {
      console.log("Tracking event:", eventName, args[0])
      return
    }

    track(eventName, ...args)
  }

  return trackEvent
}
