import type { RevinelColorValue } from "@revinel/sdk"

// Types `ad.meta` globally for the fields every Dirstarter site serves.
// Site-specific fields belong in the fork that uses them.
declare module "@revinel/sdk" {
  interface RevinelMetaRegistry {
    description?: string
    shortDescription?: string
    buttonLabel?: string
    brandColor?: RevinelColorValue
  }
}
