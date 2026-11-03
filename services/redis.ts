import Redis from "ioredis"
import { env } from "~/env"

function createRedisClient() {
  if (!env.REDIS_URL) {
    return null
  }

  // Lazy connect so a build never blocks on Redis; capped-backoff reconnect so a
  // blip self-heals (auth's session + magic-link store lives here, so a dead
  // client breaks login until restart). During an outage commands fail fast
  // rather than queue: `commandTimeout` bounds each call and
  // `enableOfflineQueue: false` rejects instead of buffering.
  const client = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    retryStrategy: times => Math.min(times * 200, 2000),
    maxRetriesPerRequest: 2,
    commandTimeout: 2_000,
    enableOfflineQueue: false,
  })

  client.on("error", () => {})

  return client
}

const globalForRedis = globalThis as typeof globalThis & {
  redisGlobal?: ReturnType<typeof createRedisClient>
}

export const redis = globalForRedis.redisGlobal ?? createRedisClient()

// One shared client per process, not one per bundled server layer.
globalForRedis.redisGlobal = redis
