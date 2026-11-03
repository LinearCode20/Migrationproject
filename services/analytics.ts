import { tryCatch } from "@dirstack/utils"
import { createTracker, type ServerTrackArgs, type ServerTrackName } from "highseat/server"
import wretch from "wretch"
import { env, isDev } from "~/env"
import { withTimeout } from "~/lib/http"

const API_URL = "https://api.highseat.com/v1"

/**
 * Highseat is on only when its site id is set. Without it, no tracker loads. The admin
 * visitors chart also needs `HIGHSEAT_API_KEY`.
 */
export const isHighseatEnabled = !!env.NEXT_PUBLIC_HIGHSEAT_SITE

// Highseat takes server-side events only with the site secret, so without it none are sent.
const tracker =
  isHighseatEnabled && env.HIGHSEAT_SECRET
    ? createTracker({ site: env.NEXT_PUBLIC_HIGHSEAT_SITE, secret: env.HIGHSEAT_SECRET })
    : null

/**
 * Tracks an event from the server, such as an outbound click through `/go`. The site's own events
 * are declared in `types/highseat.ts`, and Highseat declares built-in ones such as `mcp_tool_call`.
 */
export function trackServerEvent<Name extends ServerTrackName>(
  name: Name,
  ...args: ServerTrackArgs<Name>
) {
  if (isDev) {
    console.log("Tracking server event:", name, args[0])
    return
  }

  tracker?.track(name, ...args)
}

interface TimeseriesResponse {
  data: { rows: { date: string; visitors: number }[] }
}

/**
 * Unique visitors per day between two dates (inclusive, `yyyy-MM-dd` in the site's timezone),
 * keyed by date. Empty when Highseat is not configured or its API fails, so the admin chart
 * degrades instead of breaking.
 */
export async function getVisitorsByDay(from: string, to: string) {
  const site = env.NEXT_PUBLIC_HIGHSEAT_SITE
  const apiKey = env.HIGHSEAT_API_KEY

  if (!site || !apiKey) {
    return {}
  }

  const query = new URLSearchParams({ period: "custom", from, to })
  const url = `${API_URL}/sites/${site}/timeseries?${query}`

  const { data, error } = await tryCatch(
    wretch(url)
      .auth(`Bearer ${apiKey}`)
      .options(withTimeout(20_000))
      .get()
      .json<TimeseriesResponse>(),
  )

  if (error) {
    console.error("Analytics error:", error)
    return {}
  }

  return Object.fromEntries(data.data.rows.map(row => [row.date.slice(0, 10), row.visitors]))
}
