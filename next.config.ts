import { compact, joinUrlPaths } from "@dirstack/utils"
import { withHighseat } from "highseat/next"
import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./lib/i18n.ts")

/**
 * A route pattern matching any single path segment except the given ones.
 */
function anySegmentExcept(...segments: (string | undefined)[]) {
  const excluded = compact(segments).map(segment => `${segment}$`)
  return `/:slug((?!${excluded.join("|")})[^/]+)`
}

const nextConfig: NextConfig = {
  typedRoutes: true,

  // The project ships its own AGENTS.md, so `next dev` must not append its agent rules to it.
  agentRules: false,

  // Dynamic by default: prerender a static shell, stream request-time data from
  // Suspense boundaries. See https://dirstarter.com/docs/codebase/caching.
  cacheComponents: true,

  // `<Link prefetch>` fetches only a route's static parts, never its dynamic
  // data, so hovering a link warms the shell without paying for a full render.
  partialPrefetching: true,

  cacheLife: {
    infinite: {
      stale: Number.POSITIVE_INFINITY,
      revalidate: Number.POSITIVE_INFINITY,
      expire: Number.POSITIVE_INFINITY,
    },
  },

  turbopack: {
    // Turbopack's CSS parser does not recognize the `::scroll-marker` selectors behind the carousel dots.
    ignoreIssue: [{ path: /app\/styles\.css$/, description: /scroll-marker|target-current/ }],
  },

  experimental: {
    // Persists the Turbopack build cache so a rebuild reuses the last compile
    // instead of starting cold.
    turbopackFileSystemCacheForBuild: true,
  },

  images: {
    unoptimized: true,
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Blocks other sites from embedding pages in a frame, which prevents clickjacking.
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },

          // Blocks framing in older browsers that ignore `frame-ancestors`.
          { key: "X-Frame-Options", value: "DENY" },

          // Keeps browsers on HTTPS for two years, so a network attacker cannot downgrade a visit.
          { key: "Strict-Transport-Security", value: "max-age=63072000" },

          // Stops browsers from guessing a file's type and running it as a script or stylesheet.
          { key: "X-Content-Type-Options", value: "nosniff" },

          // Sends only the origin to other sites, so full page paths and queries never leak.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

          // Denies the page and its embedded frames access to the camera, microphone and location.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },

      // With no server-side function cache, repeat traffic on public pages is
      // absorbed at the CDN edge instead: s-maxage caches the full streamed
      // HTML, stale-while-revalidate serves it while refreshing in background.
      // s-maxage is kept short so admin edits and the per-render related/ad
      // rotation surface within a couple of minutes; the long SWR window is
      // what actually absorbs crawler bursts (stale served instantly, refreshed
      // async), so short s-maxage costs freshness, not offload.

      // Homepage: shortest window so new tools surface quickly.
      {
        source: "/",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=60, stale-while-revalidate=3600" },
        ],
      },

      // Content sections whose child pages are all public. Deliberately excludes
      // `submit`: its root is public (and caught by the single-segment rule
      // below), but its children (`/submit/[slug]`) read a live tool tier per
      // request, so they must keep the framework's private default and never
      // hit the edge.
      {
        source: "/:path(blog|categories|collections|tags)/:rest*",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=120, stale-while-revalidate=3600" },
        ],
      },

      // Single-segment public pages: tool detail slugs plus the static roots
      // (`/about`, `/advertise`, `/submit`, and the section roots). Excludes the
      // routes `proxy.ts` gates on the session cookie (`/app`, `/auth`) because
      // their response (redirect vs page) is session-dependent and must never be
      // edge-cached; they keep the framework's private default. `/app/*` and
      // `/auth/*` never match anyway, since they are two segments. Also excludes
      // the Highseat proxy path and the public MCP server at `/mcp`, single
      // segments too, whose answers are per request.
      {
        source: anySegmentExcept(
          "app",
          "auth",
          "mcp",
          process.env.HIGHSEAT_PATH?.replace(/^\//, ""),
        ),
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=120, stale-while-revalidate=3600" },
        ],
      },
    ]
  },

  async redirects() {
    return [
      // `/admin` and `/dashboard` paths redirect to `/app`. A 308 (`permanent: true`)
      // keeps bookmarks and external links working; `:path*` preserves the rest
      // of the path and the query string.
      { source: "/admin/:path*", destination: "/app/:path*", permanent: true },
      { source: "/dashboard/:path*", destination: "/app/:path*", permanent: true },
    ]
  },

  async rewrites() {
    const revinelUrl = process.env.NEXT_PUBLIC_REVINEL_API_URL || "https://api.revinel.com"

    return [
      {
        source: "/sitemap/:id.xml",
        destination: "/sitemap/:id",
      },
      {
        source: "/rss.xml",
        destination: "/rss/tools.xml",
      },
      {
        source: "/api/cron/publish-tools",
        destination: "/api/cron/publish",
      },

      // Proxy client-side ad fetch + tracking through our origin so ad blockers can't drop them.
      {
        source: "/_proxy/revinel/:path*",
        destination: joinUrlPaths(revinelUrl, ":path*"),
      },
    ]
  },
}

// `withHighseat()` rewrites `HIGHSEAT_PATH` onto `app/api/highseat` ahead of every other route,
// so the `[slug]` tool pages cannot shadow it, and keeps the rewrites above.
export default withNextIntl(withHighseat(nextConfig))
