import { z } from "zod"

export const adsConfig = {
  // Off unless a Revinel workspace is set; NEXT_PUBLIC_ADS_DISABLED forces it off.
  // Parsed here rather than through `~/env`: with `SKIP_ENV_VALIDATION` the env
  // object holds raw strings, and the string "false" would read as truthy.
  enabled:
    Boolean(process.env.NEXT_PUBLIC_REVINEL_WORKSPACE_ID) &&
    !z.stringbool().catch(false).parse(process.env.NEXT_PUBLIC_ADS_DISABLED),

  adsPerPage: 2,

  premiumWeightThreshold: 1,
}

// Ads render after the tools, so order k lands at grid slot k+index+2 (hence the inverse).
export function getAdOrder(index: number, columns: number, perPage: number) {
  const rows = Math.max(1, Math.round(perPage / adsConfig.adsPerPage / columns))
  const slot = Math.max(2, columns) + index * rows * columns

  return slot - index - 2
}
