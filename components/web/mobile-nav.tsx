"use client"

import { useHotkeys, useMounted } from "@mantine/hooks"
import { ArrowRightIcon, ChevronRightIcon, MenuIcon, PlusIcon, XIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { type Dispatch, type SetStateAction, useEffect, useId, useState } from "react"
import { Badge } from "~/components/common/badge"
import { Button } from "~/components/common/button"
import { ActiveNavLink } from "~/components/web/ui/active-nav-link"
import { Container } from "~/components/web/ui/container"
import { Eyebrow } from "~/components/web/ui/eyebrow"
import { navigation } from "~/config/navigation"
import { cx } from "~/lib/utils"

/**
 * Self-contained mobile nav (trigger + overlay panel, owns its open state).
 * Reads no request data itself, so it prerenders into the static shell and needs
 * no Suspense boundary. See `CloseOnNavigate` for why that matters.
 */
export function MobileNav() {
  const t = useTranslations()
  const [isOpen, setOpen] = useState(false)
  const panelId = useId()

  // Close on Escape and whenever the route changes.
  useHotkeys([["Escape", () => setOpen(false)]])

  return (
    <>
      <CloseOnNavigate setOpen={setOpen} />
      <button
        type="button"
        aria-label={t("navigation.toggle_menu")}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="-m-1 p-1 text-lg -translate-x-0.5 lg:hidden"
        onClick={() => setOpen(open => !open)}
      >
        {isOpen ? <XIcon /> : <MenuIcon />}
      </button>

      {/* See https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert */}
      <nav
        id={panelId}
        inert={!isOpen}
        className={cx(
          "fixed inset-x-0 top-(--header-inner-offset) h-lvh pb-[calc(var(--header-inner-offset)+100lvh-100dvh)] overflow-y-auto overscroll-contain bg-background/95 backdrop-blur-lg transition-opacity duration-200 lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <Container>
          <div className="flex flex-col gap-7 py-6">
            {navigation.map(({ labelKey, items }) => (
              <div key={labelKey} className="flex flex-col gap-1.5">
                <Eyebrow className="px-2">{t(labelKey)}</Eyebrow>

                <div className="grid gap-0.5 sm:grid-cols-2">
                  {items.map(({ href, labelKey, icon: Icon, badgeKey }) => (
                    <ActiveNavLink
                      key={href}
                      href={href}
                      isPadded={false}
                      prefix={<Icon />}
                      suffix={<ChevronRightIcon className="text-muted-foreground/40" />}
                      className="gap-3 rounded-lg px-2 py-2.5 hover:bg-accent active:bg-accent"
                    >
                      <span className="flex-1 truncate text-sm font-medium">{t(labelKey)}</span>
                      {badgeKey && <Badge size="sm">{t(badgeKey)}</Badge>}
                    </ActiveNavLink>
                  ))}
                </div>
              </div>
            ))}

            <Button
              variant="primary"
              size="lg"
              prefix={<PlusIcon />}
              suffix={<ArrowRightIcon />}
              render={<Link href="/submit" />}
              className="w-full"
            >
              {t("navigation.submit")}
            </Button>
          </div>
        </Container>
      </nav>
    </>
  )
}

interface CloseOnNavigateProps {
  setOpen: Dispatch<SetStateAction<boolean>>
}

/**
 * Closes the panel on navigation, isolated behind a mount gate so the pathname is
 * never read during a prerender.
 *
 * Reading it in `MobileNav` itself would force a `<Suspense>` boundary in the
 * header. On a route prerendered with concrete params the pathname IS known at
 * build, so that boundary resolves during the build render and Next bakes the
 * whole nav into the static HTML as staged content: a `<div hidden id="S:n">`
 * plus an `$RC` swap script that runs while the HTML is still parsing, before
 * React hydrates. React then finds a mismatch, throws #418 and discards the
 * subtree, blanking the page until a client re-render refills it.
 *
 * Rendering `null` until mounted keeps the server HTML and the first client
 * render identical, so no boundary is needed at all. Detect a regression by
 * grepping a build for `$RC(` under `.next/server/app`.
 *
 * Takes the `setOpen` setter rather than a close callback on purpose: a
 * `() => setOpen(false)` arrow is a new function on every render, so the effect
 * would re-fire the moment the panel opened and close it again.
 */
function CloseOnNavigate({ setOpen }: CloseOnNavigateProps) {
  return useMounted() ? <CloseOnNavigateInner setOpen={setOpen} /> : null
}

interface CloseOnNavigateInnerProps {
  setOpen: Dispatch<SetStateAction<boolean>>
}

function CloseOnNavigateInner({ setOpen }: CloseOnNavigateInnerProps) {
  const pathname = usePathname()

  useEffect(() => setOpen(false), [pathname, setOpen])

  return null
}
