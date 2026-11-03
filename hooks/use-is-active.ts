import type { LinkProps } from "next/link"
import { usePathname } from "next/navigation"

export function useIsActive(href: LinkProps["href"] | undefined, exact = false) {
  const pathname = usePathname()

  if (href && href !== "/" && typeof href === "string") {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return false
}
