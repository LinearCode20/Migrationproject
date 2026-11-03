import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "~/.generated/prisma/client"
import { env } from "~/env"

function prismaClientSingleton() {
  // Bound every wait past `max`. `connectionTimeoutMillis` is load-bearing: a
  // waiter rejects instead of queueing forever and pinning the render that asked
  // for it. `maxLifetimeSeconds` recycles connections a proxy may have dropped.
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
    max: 10,
    connectionTimeoutMillis: 5_000,
    statement_timeout: 15_000,
    query_timeout: 15_000,
    idleTimeoutMillis: 30_000,
    maxLifetimeSeconds: 1_800,
    keepAlive: true,
  })
  return new PrismaClient({ adapter })
}

const globalForDb = globalThis as typeof globalThis & {
  dbGlobal?: ReturnType<typeof prismaClientSingleton>
}

export const db = globalForDb.dbGlobal ?? prismaClientSingleton()

// One shared pool per process, not one per bundled server layer.
globalForDb.dbGlobal = db
