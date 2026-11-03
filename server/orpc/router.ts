import { ai } from "~/server/ai/router"
import { bookmarks } from "~/server/bookmarks/router"
import { categories } from "~/server/categories/router"
import { media } from "~/server/media/router"
import { metrics } from "~/server/metrics/router"
import { publicProcedure } from "~/server/orpc/procedure"
import { posts } from "~/server/posts/router"
import { products } from "~/server/products/router"
import { reports } from "~/server/reports/router"
import { search } from "~/server/search/router"
import { subscribe } from "~/server/subscribe/router"
import { tags } from "~/server/tags/router"
import { tools } from "~/server/tools/router"
import { users } from "~/server/users/router"

// Health check for uptime monitors, reachable at `/api/rpc/ping`.
const ping = publicProcedure.handler(() => ({
  status: "ok" as const,
  timestamp: new Date().toISOString(),
}))

/**
 * The application's oRPC router: one flat entry per entity, reached at the top
 * level (e.g. `orpc.tools.*`, `orpc.bookmarks.*`).
 *
 * Mounted on every transport: `/api/rpc` and the in-process `rsc()` client used
 * by server components, so a procedure behaves identically however it is reached.
 */
export const appRouter = {
  ping,
  ai,
  bookmarks,
  categories,
  media,
  metrics,
  posts,
  products,
  reports,
  search,
  subscribe,
  tags,
  tools,
  users,
}

export type AppRouter = typeof appRouter
