"use client"

import { useMounted } from "@mantine/hooks"
import type { ComponentProps, ReactNode } from "react"
import { NavLink } from "~/components/web/ui/nav-link"
import { useIsActive } from "~/hooks/use-is-active"

interface WithActiveProps {
  href: Parameters<typeof useIsActive>[0]
  children: (isActive: boolean) => ReactNode
}

/**
 * Mount-gated active-route detection, shared by every "highlight the current
 * route" link. Renders `children(false)` on the server and the first client
 * pass, so it never reads the pathname during prerender and adds no hydration
 * mismatch, then re-renders with the real active state after mount.
 */
export function WithActive({ href, children }: WithActiveProps) {
  const mounted = useMounted()

  if (!mounted) {
    return <>{children(false)}</>
  }

  return <WithActiveInner href={href}>{children}</WithActiveInner>
}

function WithActiveInner({ href, children }: WithActiveProps) {
  return <>{children(useIsActive(href))}</>
}

export function ActiveNavLink(props: ComponentProps<typeof NavLink>) {
  return (
    <WithActive href={props.href}>
      {isActive => <NavLink {...props} isActive={isActive} />}
    </WithActive>
  )
}
