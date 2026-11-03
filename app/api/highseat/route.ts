import { getClientIp } from "@dirstack/utils"
import { createProxy } from "highseat/next"
import { env } from "~/env"

// Serves the tracker and forwards its events on the site's own proxy path: `withHighseat()` in
// `next.config.ts` rewrites `HIGHSEAT_PATH` here. The visitor's IP is read by the same
// `TRUSTED_PROXY` rule as the rest of the app.
const proxy = createProxy({
  clientIp: request => getClientIp(request.headers, { trust: env.TRUSTED_PROXY }),
})

export const GET = proxy
export const POST = proxy
