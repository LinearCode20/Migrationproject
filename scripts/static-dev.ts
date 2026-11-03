/**
 * Runs the app without a database server. An in-memory Postgres (PGlite) serves the
 * same schema on a local port, is seeded with the template data from `prisma/seed.ts`,
 * and Next.js dev connects to it. Nothing is written to disk, so every start is fresh.
 */
import { PGlite } from "@electric-sql/pglite"
import { citext } from "@electric-sql/pglite/contrib/citext"
import { PGLiteSocketServer } from "@electric-sql/pglite-socket"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

const port = Number(process.env.STATIC_DB_PORT ?? 5433)
const migrationsDir = path.join("prisma", "migrations")
const databaseUrl = `postgresql://static:static@127.0.0.1:${port}/dirstarter`

const pg = await PGlite.create({ extensions: { citext } })

const migrations = (await readdir(migrationsDir, { withFileTypes: true }))
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort()

for (const name of migrations) {
  await pg.exec(await readFile(path.join(migrationsDir, name, "migration.sql"), "utf8"))
}
console.log(`Applied ${migrations.length} migrations`)

// Prisma's pool opens up to 10 connections at once, and the server accepts one by default.
const server = new PGLiteSocketServer({ db: pg, port, host: "127.0.0.1", maxConnections: 20 })
await server.start()
console.log(`In-memory database listening on ${databaseUrl}`)

const env = { ...process.env, DATABASE_URL: databaseUrl }

const seed = Bun.spawn(["bun", "prisma/seed.ts"], { env, stdout: "inherit", stderr: "inherit" })
if ((await seed.exited) !== 0) {
  await server.stop()
  process.exit(1)
}

const dev = Bun.spawn(["bun", "x", "next", "dev", "-p", "5173"], {
  env,
  stdout: "inherit",
  stderr: "inherit",
})

const shutdown = async () => {
  dev.kill()
  await server.stop()
  process.exit(0)
}
process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

await dev.exited
await server.stop()
