import { usePathname, useSearchParams } from "next/navigation"

/**
 * The URL to return to after sign-in: the `next` param when present, otherwise
 * the current page with its query string, so active filters survive the round trip.
 * Pass `params` to carry extra state through sign-in, such as a pending action.
 */
export function useAuthCallbackUrl(params?: Record<string, string>) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const next = searchParams.get("next")

  if (next) {
    return next
  }

  if (pathname.startsWith("/auth")) {
    return "/"
  }

  const search = new URLSearchParams(searchParams)

  for (const [key, value] of Object.entries(params ?? {})) {
    search.set(key, value)
  }

  const query = search.toString()

  return query ? `${pathname}?${query}` : pathname
}
