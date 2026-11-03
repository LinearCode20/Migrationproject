import { tryCatch } from "@dirstack/utils"
import { createId } from "@paralleldrive/cuid2"
import { after } from "next/server"
import wretch from "wretch"
import type { PostStatus, ToolStatus, ToolTier } from "~/.generated/prisma/client"
import { siteConfig } from "~/config/site"
import { env } from "~/env"
import { withTimeout } from "~/lib/http"
import { sendEventEmails } from "~/server/event-emails"

/**
 * Every domain event, keyed by name, with a flat wire-safe payload of ids,
 * enums and scalars, never a serialized model. A webhook receiver looks up
 * whatever else it needs by id, so the event only has to say what happened and
 * to whom. Downstream sites add their own events by editing this map and adding
 * a `sendEvent` call.
 */
interface EventMap {
  "tool.submitted": {
    toolId: string
  }
  "tool.status_changed": {
    toolId: string
    previousStatus: ToolStatus | null
    newStatus: ToolStatus
    notifyOwner: boolean
  }
  "tool.tier_upgraded": {
    toolId: string
    previousTier: ToolTier
    newTier: ToolTier
  }
  "tool.tier_downgraded": {
    toolId: string
    previousTier: ToolTier
    newTier: ToolTier
  }
  "report.created": {
    reportId: string
    toolId: string | null
  }
  "post.status_changed": {
    postId: string
    previousStatus: PostStatus | null
    newStatus: PostStatus
  }
}

export type Event = { [K in keyof EventMap]: { event: K; data: EventMap[K] } }[keyof EventMap]

/**
 * POST the event to `WEBHOOK_URL` as a JSON envelope: a unique `id` (for
 * receiver-side dedupe), `event`, `site`, `timestamp`, and the flat `data`
 * payload. Off by default (no URL is a no-op), so the feature ships disabled.
 * An optional `WEBHOOK_TOKEN` is sent as a bearer header, enough to secure a
 * self-owned automation receiver (n8n, Zapier, Make). Delivery errors are
 * logged and swallowed; there is no retry.
 */
async function sendEventWebhook({ event, data }: Event) {
  if (!env.WEBHOOK_URL) {
    return
  }

  let request = wretch(env.WEBHOOK_URL).options(withTimeout(10_000))
  if (env.WEBHOOK_TOKEN) {
    request = request.auth(`Bearer ${env.WEBHOOK_TOKEN}`)
  }

  const payload = {
    id: createId(),
    event,
    site: siteConfig.slug,
    timestamp: new Date().toISOString(),
    data,
  }

  // Drain the unread response so undici can release the connection.
  const { error } = await tryCatch(
    request
      .json(payload)
      .post()
      .res(response => response.body?.cancel()),
  )

  if (error) {
    console.error(`Webhook delivery failed for "${event}":`, error)
  }
}

/**
 * Announce a domain event. Call it in the handler right after the mutation
 * commits; delivery is scheduled in `after()`, off the request's critical path.
 * The webhook and email outlets are isolated with `Promise.allSettled`, so one
 * failing outlet never blocks the other.
 */
export function sendEvent<K extends keyof EventMap>(event: K, data: EventMap[K]) {
  after(async () => {
    const results = await Promise.allSettled([
      sendEventWebhook({ event, data } as Event),
      sendEventEmails({ event, data } as Event),
    ])

    for (const result of results) {
      if (result.status === "rejected") {
        console.error(`Event outlet failed for "${event}":`, result.reason)
      }
    }
  })
}
