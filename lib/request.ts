import { getClientIp as getIpFromHeaders } from "@dirstack/utils"
import { headers } from "next/headers"
import { env } from "~/env"

const FALLBACK_IP = "0.0.0.0"

/**
 * Request header the proxy sets to the resolved client IP. better-auth reads only this header,
 * so its rate limiter follows the same rule as {@link getClientIp}.
 */
export const CLIENT_IP_HEADER = "x-dirstarter-client-ip"

/**
 * Copy of the request headers with {@link CLIENT_IP_HEADER} set to the client IP, resolved by
 * the same rule as {@link getClientIp}. A client-sent value is always dropped, and the header
 * stays unset when no IP resolves, so those requests fall back to better-auth's own handling
 * instead of sharing a placeholder.
 */
export function withClientIpHeader(list: Headers) {
  const result = new Headers(list)
  const ip = getIpFromHeaders(list, { trust: env.TRUSTED_PROXY })

  result.delete(CLIENT_IP_HEADER)

  if (ip) {
    result.set(CLIENT_IP_HEADER, ip)
  }

  return result
}

/**
 * Best-effort client IP, read from the proxy headers by `getClientIp` from `@dirstack/utils`.
 * It returns the last `x-forwarded-for` entry, which the proxy sets to the TCP peer, so a
 * client-sent first entry is never read. `TRUSTED_PROXY=cloudflare` (Dokploy behind a proxied
 * Cloudflare record) also reads `cf-connecting-ip`, but only when that peer is a Cloudflare
 * address. Leave it unset on hosts not behind Cloudflare (Vercel): they pass a client-sent
 * `cf-connecting-ip` through unchanged.
 *
 * Used to bucket anonymous callers in the rate limiter.
 */
export async function getClientIp() {
  const list = await headers()

  return getIpFromHeaders(list, { trust: env.TRUSTED_PROXY }) ?? FALLBACK_IP
}
