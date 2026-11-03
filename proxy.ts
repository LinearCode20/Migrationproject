import { getSessionCookie } from "better-auth/cookies"
import { type NextRequest, NextResponse, type ProxyConfig } from "next/server"
import { withClientIpHeader } from "~/lib/request"

export const config: ProxyConfig = {
  // Every request except build output and static files, so the client IP header reaches the
  // `/api/auth` handler and every server action or route that calls `auth.api` with `headers()`.
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:png|jpe?g|gif|webp|avif|svg|ico|woff2?|css|js|map)$).*)",
  ],
}

/**
 * Redirect that branches on the session cookie, so the response must never be
 * cached at the CDN: a cached redirect would bounce the wrong users (a signed-in
 * visitor sent to login, or an anonymous one past a gate). Stamp it private so
 * gated paths are safe regardless of any `headers()` edge-cache rule.
 */
function gatedRedirect(url: URL) {
  const response = NextResponse.redirect(url)
  response.headers.set("Cache-Control", "private, no-store")
  return response
}

/**
 * Optimistic auth redirects only. Reads the session cookie's presence without
 * touching the database, so it stays cheap to run on every request. Authoritative
 * authentication and role checks live in the route segments themselves, which run
 * server-side and cannot be bypassed the way middleware can.
 */
function findGatedRedirect(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const sessionCookie = getSessionCookie(request)

  const isAuthPage = pathname === "/auth" || pathname.startsWith("/auth/")
  // Only the signed-in area requires a session. The submit pages stay open to guests,
  // and the submit form asks for sign-in when a guest sends it.
  const isAppPage = pathname === "/app" || pathname.startsWith("/app/")

  // Send signed-in users away from the auth pages.
  if (sessionCookie && isAuthPage) {
    return gatedRedirect(new URL("/", request.url))
  }

  // Send anonymous users to the login page.
  if (!sessionCookie && isAppPage) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("next", `${pathname}${search}`)
    return gatedRedirect(loginUrl)
  }
}

/**
 * Runs the gated redirects, then forwards every other request with the client IP header set
 * by the same rule as `getClientIp`, replacing any value the client sent.
 */
export function proxy(request: NextRequest) {
  const redirect = findGatedRedirect(request)

  if (redirect) {
    return redirect
  }

  return NextResponse.next({ request: { headers: withClientIpHeader(request.headers) } })
}
