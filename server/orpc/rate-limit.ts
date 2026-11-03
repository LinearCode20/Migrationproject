import { SECOND_MS, tryCatch } from "@dirstack/utils"
import { ORPCError } from "@orpc/server"
import { RateLimiterMemory, RateLimiterRedis } from "rate-limiter-flexible"
import { getClientIp } from "~/lib/request"
import { redis } from "~/services/redis"

interface RateLimit {
  points: number
  duration: number
}

/**
 * Inline rate-limit config. Lives on procedure meta:
 *   `rateLimit: { points: 3, duration: DAY_SECONDS }`  // 3 requests per day
 *
 * `"none"` disables limiting for that procedure entirely.
 */
export type RateLimitConfig = RateLimit | "none"

const limiterCache = new Map<string, RateLimiterMemory | RateLimiterRedis>()

function getLimiter(config: RateLimit) {
  const cacheKey = `${config.points}:${config.duration}`
  const cached = limiterCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const options = { keyPrefix: `rl:p:${cacheKey}`, ...config }

  const limiter = redis
    ? new RateLimiterRedis({
        storeClient: redis,
        // Insurance only runs while Redis is erroring; cap its window so a long
        // `duration` can't leave one multi-hour timer per client IP.
        insuranceLimiter: new RateLimiterMemory({
          ...options,
          duration: Math.min(config.duration, 900),
        }),
        ...options,
      })
    : new RateLimiterMemory(options)

  limiterCache.set(cacheKey, limiter)
  return limiter
}

/**
 * Consume one point against the given config. Throws an oRPC
 * `TOO_MANY_REQUESTS` error with `retryAfterSeconds` in `data` when the
 * bucket is exhausted.
 *
 * Identity resolution: prefer the explicit `identifier` (typically the
 * user id), otherwise fall back to the request's client IP.
 *
 * `scope` namespaces the bucket to a single caller action (typically the
 * procedure path), so two procedures that share the same `{ points, duration }`
 * numbers keep independent quotas.
 */
export async function consumeRateLimit(
  config: { points: number; duration: number },
  identifier: string | null | undefined,
  scope: string,
): Promise<void> {
  const id = identifier ?? (await getClientIp())
  const key = `${scope}:${id}`
  const limiter = getLimiter(config)

  const { error } = await tryCatch(limiter.consume(key))
  if (!error) {
    return
  }

  if (typeof error === "object" && error !== null && "msBeforeNext" in error) {
    const raw = Number((error as { msBeforeNext: number }).msBeforeNext)
    const ms = Number.isFinite(raw) ? raw : 0
    throw new ORPCError("TOO_MANY_REQUESTS", {
      message: "Too many requests. Please try again later.",
      data: { retryAfterSeconds: Math.max(1, Math.ceil(ms / SECOND_MS)) },
    })
  }

  console.error("[rate-limit] limiter error:", error)
}
